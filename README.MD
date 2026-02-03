# Jarvis AI Assistant (Monorepo)

An intelligent AI-powered software engineer that generates complete web applications. Modular architecture supporting both Terminal and Web interfaces.

## 🚀 Key Modules

- **`packages/core`**: The Brain. Storage-agnostic logic for planning and generation.
- **`packages/web`**: The Visual Dashboard (Next.js). Features Live Preview and AI Refinement Loop.
- **`packages/cli`**: The Terminal interface for local file generation.

## ✨ Features

- **Instant Live Preview**: Interactive split-screen view in the web dashboard that renders code instantly.
- **AI Refinement Loop**: Give feedback and the AI updates the code in place.
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
   Create a `.env` file in the root with your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
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

---
*Powered by Gemini 2.5 Flash*

made by Adesh Kumar