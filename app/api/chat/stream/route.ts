import { submitQuestion } from "@/lib/langgraph";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { getConvexClient } from "@/lib/convex";
import {
  ChatRequestBody,
  StreamMessage,
  StreamMessageType,
  SSE_DATA_PREFIX,
  SSE_LINE_DELIMITER,
} from "@/lib/types";

// export const runtime = "edge";

function sendSSEMessage(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  data: StreamMessage
) {
  const encoder = new TextEncoder();
  return writer.write(
    encoder.encode(
      `${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`
    )
  );
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    let body: ChatRequestBody;
    try {
      body = (await req.json()) as ChatRequestBody;
    } catch {
      return new Response("Invalid or aborted request payload", {
        status: 400,
      });
    }

    const { messages, newMessage, chatId } = body;
    if (!chatId || !newMessage) {
      return new Response("Missing chatId or newMessage", { status: 400 });
    }

    const convex = getConvexClient();

    const stream = new TransformStream({}, { highWaterMark: 1024 });
    const writer = stream.writable.getWriter();

    const response = new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable buffering for nginx which is required for SSE to work properly
      },
    });

    // Handle the streaming response
    (async () => {
      let fullResponse = "";
      let isClientDisconnected = false;
      let currentTool: { name: string; input: unknown } | null = null;

      const safeSend = async (data: StreamMessage) => {
        if (isClientDisconnected) return;
        try {
          await sendSSEMessage(writer, data);
        } catch {
          // Client disconnected (tab closed / navigated away); suppress error so background processing continues
          isClientDisconnected = true;
        }
      };

      const formatToolOutput = (output: unknown): string => {
        if (typeof output === "string") return output;
        return JSON.stringify(output, null, 2);
      };

      const formatTerminalOutput = (
        tool: string,
        input: unknown,
        output: unknown
      ) => {
        const terminalHtml = `<div class="bg-[#1e1e1e] text-white font-mono p-2 rounded-md my-2 overflow-x-auto whitespace-normal max-w-[600px]">
      <div class="flex items-center gap-1.5 border-b border-gray-700 pb-1">
        <span class="text-red-500">●</span>
        <span class="text-yellow-500">●</span>
        <span class="text-green-500">●</span>
        <span class="text-gray-400 ml-1 text-sm">~/${tool}</span>
      </div>
      <div class="text-gray-400 mt-1">$ Input</div>
      <pre class="text-yellow-400 mt-0.5 whitespace-pre-wrap overflow-x-auto">${formatToolOutput(input)}</pre>
      <div class="text-gray-400 mt-2">$ Output</div>
      <pre class="text-green-400 mt-0.5 whitespace-pre-wrap overflow-x-auto">${formatToolOutput(output)}</pre>
    </div>`;

        return `---START---\n${terminalHtml}\n---END---`;
      };

      try {
        await safeSend({ type: StreamMessageType.Connected });

        // Send user message to Convex
        await convex.mutation(api.messages.send, {
          chatId,
          content: newMessage,
        });

        // Convert messages to LangChain format
        const langChainMessages = [
          ...messages.map((msg) =>
            msg.role === "user"
              ? new HumanMessage(msg.content)
              : new AIMessage(msg.content)
          ),
          new HumanMessage(newMessage),
        ];

        try {
          // Create the event stream
          const eventStream = await submitQuestion(langChainMessages, chatId);

          // Process the events
          for await (const event of eventStream) {
            if (event.event === "on_chat_model_stream") {
              const token = event.data.chunk;
              if (token) {
                // Access the text property from the AIMessageChunk
                const text = token.content.at(0)?.["text"];
                if (text) {
                  fullResponse += text;
                  await safeSend({
                    type: StreamMessageType.Token,
                    token: text,
                  });
                }
              }
            } else if (event.event === "on_tool_start") {
              currentTool = {
                name: event.name || "unknown",
                input: event.data.input,
              };
              fullResponse += formatTerminalOutput(
                event.name || "unknown",
                event.data.input,
                "Processing..."
              );
              await safeSend({
                type: StreamMessageType.ToolStart,
                tool: event.name || "unknown",
                input: event.data.input,
              });
            } else if (event.event === "on_tool_end") {
              const toolMessage = new ToolMessage(event.data.output);
              const toolName =
                toolMessage.lc_kwargs.name || currentTool?.name || "unknown";

              if (currentTool) {
                const lastTerminalIndex = fullResponse.lastIndexOf(
                  '<div class="bg-[#1e1e1e]'
                );
                if (lastTerminalIndex !== -1) {
                  fullResponse =
                    fullResponse.substring(0, lastTerminalIndex) +
                    formatTerminalOutput(
                      toolName,
                      currentTool.input,
                      event.data.output
                    );
                }
                currentTool = null;
              }

              await safeSend({
                type: StreamMessageType.ToolEnd,
                tool: toolName,
                output: event.data.output,
              });
            }
          }

          // Persist the complete assistant response from the SERVER (even if client disconnected)
          if (fullResponse.trim()) {
            await convex.mutation(api.messages.store, {
              chatId,
              content: fullResponse,
              role: "assistant",
            });
          }

          // Send completion message
          await safeSend({ type: StreamMessageType.Done });
        } catch (streamError) {
          console.error("Error in event stream:", streamError);
          await safeSend({
            type: StreamMessageType.Error,
            error:
              streamError instanceof Error
                ? streamError.message
                : "Stream processing failed",
          });
        }
      } catch (error) {
        console.error("Error in stream:", error);
        await safeSend({
          type: StreamMessageType.Error,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        if (!isClientDisconnected) {
          try {
            await writer.close();
          } catch (closeError) {
            console.error("Error closing writer:", closeError);
          }
        }
      }
    })();

    return response;
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" } as const,
      { status: 500 }
    );
  }
}