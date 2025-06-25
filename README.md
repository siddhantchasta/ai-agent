# 🧠 AI Workflow Agent with Claude, LangGraph, and wxflows

A powerful AI agent platform built using **Claude 3.5 Sonnet**, **LangGraph**, **LangChain**, and **wxflows**, designed for tool-augmented conversations, real-time streaming, and production-ready deployment.

---

📸 Screenshots 
<div style="display: flex; justify-content: center; align-items: flex-start; gap: 20px; flex-wrap: wrap; margin: 20px 0;">
  <img src="https://github.com/user-attachments/assets/1917852f-83c3-4bb8-9fc7-79607eb10344" alt="Screenshot 1" style="width: 30%; max-width: 100%; height: auto;" />
  <img src="https://github.com/user-attachments/assets/c592c1bf-0ffc-4f84-9d20-789401c3e2ed" alt="Screenshot 2" style="width: 30%; max-width: 100%; height: auto;" />
  <img src="https://github.com/user-attachments/assets/a1feacf7-1eac-4e15-81d4-a9052ec67c83" alt="Screenshot 3" style="width: 30%; max-width: 100%; height: auto;" />
</div>

---

## 🚀 Features

### 🔁 Prompt Caching (Anthropic)
- Reduce token usage drastically using **Anthropic’s prompt caching feature**
- Optimized for cost and speed across sessions
- Seamless reuse of shared conversation context

### 🧰 Tooling with wxflows
- **Integrate any data source as a tool in seconds**
  - YouTube transcript tools
  - Google Books API integration
- Drag-and-drop visual flow creation using **wxflows**

### 🧠 LangGraph + LangChain Integration
- **State Management** with `StateGraph`
- **Tool Orchestration** with `ToolNode`
- **Memory Handling** using `MemorySaver`
- **Context Trimming** for efficient message windows

### 💬 Advanced Chat Experience (Next.js 15)
- Custom **real-time streaming** of Claude responses
- **Tool execution feedback** inline in chat
- Handles **tool errors** gracefully with user-friendly recovery

### 💻 Modern Frontend Interface
- Built with **Next.js 15**, **React**, **TailwindCSS**, and **Framer Motion**
- Developer-style **terminal output blocks** for tool results
- Chat history, real-time updates, and interactive UI elements

### 🔐 Authentication & Persistence
- Auth handled via **Clerk**
- **Convex database** for:
  - User profile management
  - Persistent chat histories
  - Real-time state sync

### 🤖 Claude 3.5 Sonnet (Anthropic)
- Robust reasoning with **tool-augmented responses**
- Smart context handling (up to **4096 tokens**)
- Fast, scalable, and precise generation capabilities

### 🚢 Deployment
- One-click **Vercel deployment**
- `.env` based **secure environment config**
- Optimized for **production performance**

---

## 🛠 Tech Stack

| Layer         | Tech Used |
|--------------|-----------|
| AI Model     | Claude 3.5 Sonnet (Anthropic) |
| Orchestration | LangGraph, LangChain |
| Tooling      | wxflows |
| Frontend     | Next.js 15, React, TailwindCSS, Framer Motion |
| Backend      | Convex, Clerk |
| Hosting      | Vercel |
| Utilities    | Custom Streaming, Prompt Caching, Tool Feedback UI |

---

## 🧪 Getting Started

Follow these steps to run the project locally:

### 1. Clone the repository

```
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install dependencies

```
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory and add the following:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CONVEX_DEPLOYMENT=your_convex_deployment
NEXT_PUBLIC_CONVEX_URL=your_convex_url
ANTHROPIC_API_KEY=your_claude_api_key
WXFLOWS_APIKEY=your_wxflows_apikey
WXFLOWS_ENDPOINT=your_wxflows_endpoint
```

> 🔐 **Do not commit your `.env.local` file. It contains sensitive credentials.**

### 4. Run the development server

```
npm run dev
```

Visit the app at: [http://localhost:3000](http://localhost:3000)

---
### 📄 License
This project is licensed under the MIT License

