import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { YoutubeTranscript } from "youtube-transcript";

export const youtubeTranscriptTool = new DynamicStructuredTool({
  name: "youtube_transcript",
  description: "Fetches the transcript/captions for a given YouTube video URL.",
  schema: z.object({
    videoUrl: z.string().describe("The full URL of the YouTube video"),
  }),
  func: async ({ videoUrl }) => {
    try {
      console.log(`Fetching transcript for: ${videoUrl}`);
      // Fetch the transcript using the npm package
      const transcriptList = await YoutubeTranscript.fetchTranscript(videoUrl);
      
      // Map the array of objects into a single readable string for the LLM
      const fullText = transcriptList
        .map((item) => item.text)
        .join(" ");
      
      // Limit to ~4000 characters just in case it's a 3 hour podcast, 
      // so we don't blow up the LLM context window. You can adjust this.
      return fullText.slice(0, 8000); 
    } catch (error: any) {
      console.error("Error fetching transcript:", error.message);
      return `Failed to fetch transcript. Error: ${error.message}. Ensure the video has public captions available.`;
    }
  },
});