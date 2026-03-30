# Jarvis AI Assistant (Monorepo)

An intelligent AI-powered software engineer that generates complete web applications. Modular architecture supporting both Terminal and Web interfaces.

## 🚀 Key Modules

- **`packages/core`**: The Brain. Storage-agnostic logic for planning and generation.
- **`packages/web`**: The Visual Dashboard (Next.js). Features Live Preview and AI Refinement Loop.
- **`packages/cli`**: The Terminal interface for local file generation.

## ✨ Features

- **Instant Live Preview**: Interactive split-screen view in the web dashboard that renders code instantly.
- **AI Refinement Loop**: Give feedback and the AI updates the code in place.
- **Multi-Agent Orchestrator**: Routes tasks to specialized LLMs (Claude for planning, Perplexity for research, Gemini/OpenAI for coding, Groq for review) with automatic fallback to OpenRouter.
- **Storage Adapters**: Hybrid system supporting both Disk (CLI) and In-Memory (Web) storage.
- **Clean Architecture**: Decoupled AI logic from UI and Storage layers.

## 📁 Monorepo Structure

```text
root/
├── package.json          # Workspace manager
├── packages/
│   ├── core/             # Shared logic (Gemini API, Generators)
│   ├── cli/              # Terminal application
│   └── web/              # Next.js Dashboard
├── .env.example          # Environment setup template
└── README.md
```

## 🛠️ Installation & Setup

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root with your API Keys for the multi-agent system:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   CLAUDE_API_KEY=your_claude_api_key
   GROQ_API_KEY=your_groq_api_key
   OPENAI_API_KEY=your_openai_api_key
   PERPLEXITY_API_KEY=your_perplexity_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

3. **Usage**

   **Run Terminal Jarvis:**
   ```bash
   npm run cli
   ```

   **Run Web Dashboard:**
   ```bash
   npm run web
   ```

## 🏗️ Architecture: The Adapter Pattern

Jarvis uses a custom **Storage Adapter Pattern**. The `FileGenerator` doesn't know about `fs` or the `browser`. Instead, it uses:
- **`DiskAdapter`**: In CLI mode, writes directly to your local file system.
- **`InMemoryAdapter`**: In Web mode, stores files in a JSON object for instant browser previews and ZIP downloads.

## 🤖 Multi-Agent Orchestrator

The `packages/core/orchestrator.js` implements a specialized agent loop:
1. **PLANNER (Claude)**: Breaks tasks into structured JSON subtasks.
2. **RESEARCHER (Perplexity)**: Gathers web-aware context for research tasks.
3. **CODER (Gemini / OpenAI)**: Generates the application code.
4. **REVIEWER (Groq)**: Critiques code and loops back to the Coder for fixes (max 2 iterations).
5. **FALLBACK (OpenRouter)**: Automatically catches any agent failures and reroutes the prompt to ensure reliability.

*Note: You can override the orchestrator to run the entire loop on a single preferred model via the UI.*

---
*Powered by a Multi-Agent LLM Architecture*
 made by Adesh Kumar 