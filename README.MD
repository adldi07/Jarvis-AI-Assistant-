# Jarvis AI SaaS (Monorepo)

An intelligent AI-powered software engineer that generates complete web applications. Now transformed into a scalable SaaS platform with Google OAuth integration and real-time previews.

## 🚀 Key Modules

- **`packages/core`**: The Brain. Storage-agnostic logic for planning and generation.
- **`packages/web`**: The SaaS Dashboard (Next.js). Features Live Preview, AI Refinement, and User Quota management via OAuth.
- **`packages/cli`**: The Classic Terminal interface using the refactored core.

## ✨ SaaS Features

- **Google OAuth 2.0 (Auto-Quota)**: Users log in with Google to use Jarvis with their *own* Google Generative AI quota—no master API key limit.
- **Instant Live Preview**: Interactive split-screen view with a sandboxed Iframe rendering code instantly via Blobs.
- **AI Refinement Loop**: Don't like a design? Just ask Jarvis to "make the button red" and it updates the code in place.
- **Storage Adapters**: Hybrid system that supports both Disk (CLI) and In-Memory (Web) storage.

## 📁 Monorepo Structure

```text
root/
├── package.json          # Workspace manager
├── packages/
│   ├── core/             # Shared logic (Gemini API, Generators)
│   ├── cli/              # Terminal application
│   └── web/              # Next.js SaaS Dashboard
├── .env.example          # Environment setup template
└── README.md
```

## 🛠️ Installation & Setup

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env` and fill in your credentials.
   *Note: For the Web Dashboard, you'll need Google Cloud OAuth credentials.*

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
*Powered by Gemini 2.0 Flash*
