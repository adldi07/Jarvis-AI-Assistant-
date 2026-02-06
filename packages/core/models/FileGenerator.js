const path = require('path');
const { callGeminiAPI } = require('../services/geminiService');
const { callPerplexityAPI } = require('../services/perplexityService');
const { callClaudeAPI } = require('../services/claudeService');
const { callOpenAIAPI } = require('../services/openaiService');
const { log, delay, displayProgress } = require('../utils/logger');
const { API_DELAY, PROJECTS_DIR, perplexityApiKey, claudeApiKey, openaiApiKey } = require('../config/config');

class FileGenerator {
  constructor(adapter) {
    if (!adapter) {
      throw new Error('FileGenerator requires a StorageAdapter (DiskAdapter or InMemoryAdapter)');
    }
    this.adapter = adapter;
    this.templates = {
      html: this.getHTMLTemplate,
      css: this.getCSSTemplate,
      javascript: this.getJSTemplate
    };
  }

  async generateProjectFiles(plan) {
    log('\n🚀 Code Generation Phase Started...', 'green');
    log('━'.repeat(50), 'dim');

    // Create projectsByJarvis directory
    await this.adapter.ensureDir(PROJECTS_DIR);
    log(`📁 Created projects directory: ${PROJECTS_DIR}`, 'green');

    const projectPath = path.join(PROJECTS_DIR, plan.projectName);

    // Create project directory
    await this.adapter.ensureDir(projectPath);
    log(`📁 Created project directory: ${plan.projectName}`, 'green');

    // Sort items: directories first, then files
    const sortedStructure = [...plan.fileStructure].sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return 0;
    });

    const totalItems = sortedStructure.length;
    let completedItems = 0;

    // Create directories and files
    for (const item of sortedStructure) {
      completedItems++;

      if (item.type === 'directory') {
        displayProgress(completedItems, totalItems, `Creating directory: ${item.name}`);
        await this.createDirectory(projectPath, item);
        log(`📁 Created directory: ${item.name}`, 'green');
      } else {
        displayProgress(completedItems, totalItems, `Generating file: ${item.name}`);

        try {
          await this.generateSingleFile(projectPath, item, plan);
          log(`✅ Generated: ${item.name}`, 'green');

          // Add delay for API rate limiting
          if (completedItems < totalItems) {
            await delay(API_DELAY);
          }
        } catch (error) {
          log(`❌ Failed to generate ${item.name}: ${error.message}`, 'red');
          // Create fallback file
          await this.createFallbackFile(projectPath, item, plan);
        }
      }
    }

    // Create package.json and README
    await this.createProjectMetadata(projectPath, plan);

    log('\n🎉 PROJECT CREATION COMPLETED!', 'green');
    log('━'.repeat(50), 'dim');
    log(`📁 Location: ${projectPath}`, 'cyan');
    log(`🌐 Open: ${path.join(projectPath, 'index.html')}`, 'cyan');
    log('━'.repeat(50), 'dim');
  }

  async createDirectory(projectPath, dirConfig) {
    const dirPath = path.join(projectPath, dirConfig.name);
    try {
      await this.adapter.ensureDir(dirPath);
    } catch (error) {
      log(`⚠️ Warning: Could not create directory ${dirConfig.name}: ${error.message}`, 'yellow');
    }
  }

  async generateSingleFile(projectPath, fileConfig, plan) {
    // Only generate content for actual code files
    if (!fileConfig.fileType || !this.shouldGenerateContent(fileConfig.fileType)) {
      await this.createFallbackFile(projectPath, fileConfig, plan);
      return;
    }

    const prompt = this.buildPromptForFile(fileConfig, plan);
    let content;

    try {
      // Use OpenAI as primary, then Claude, then Perplexity, else Gemini
      if (openaiApiKey) {
        content = await callOpenAIAPI(prompt);
      } else if (claudeApiKey) {
        content = await callClaudeAPI(prompt);
      } else if (perplexityApiKey) {
        content = await callPerplexityAPI(prompt);
      } else {
        content = await callGeminiAPI(prompt);
      }
    } catch (error) {
      log(`⚠️ Primary API failed for ${fileConfig.name}, falling back to Gemini...`, 'yellow');
      try {
        content = await callGeminiAPI(prompt);
      } catch (geminiError) {
        throw new Error(`Primary API and Gemini fallback failed: ${geminiError.message}`);
      }
    }

    // Extract code from response
    const cleanContent = this.extractCodeFromResponse(content, fileConfig.fileType);
    const filePath = path.join(projectPath, fileConfig.name);

    // Adapter handles saving
    await this.adapter.saveFile(filePath, cleanContent);
  }

  shouldGenerateContent(fileType) {
    return ['html', 'css', 'javascript', 'js', 'json'].includes(fileType.toLowerCase());
  }

  buildPromptForFile(fileConfig, plan) {
    const reqs = this.getSpecificRequirements(fileConfig.fileType, plan);
    return `${fileConfig.fileType.toUpperCase()} for ${plan.description}. File:${fileConfig.name} Purpose:${fileConfig.description} Features:${plan.features.join(',')}. ${reqs} Code only, no markdown.`;
  }

  getSpecificRequirements(type, plan) {
    const t = type.toLowerCase();
    if (t === 'html') return 'Semantic HTML5,mobile meta,link styles.css+script.js,accessible.';
    if (t === 'css') return 'Grid/Flexbox,CSS vars,transitions,gradients,glassmorphism,responsive,animations.';
    if (t === 'js' || t === 'javascript') return `ES6+,features:${plan.features.join(',')},error handling,async/await,events.`;
    if (t === 'json') return 'Valid JSON.';
    return 'Best practices.';
  }

  extractCodeFromResponse(content, type) {
    // Remove markdown code blocks
    const codeBlockRegex = new RegExp(`\`\`\`${type}?[\\s\\S]*?\`\`\``, 'gi');
    const codeBlockMatch = content.match(codeBlockRegex);

    if (codeBlockMatch) {
      return codeBlockMatch[0]
        .replace(/```[a-z]*\n?/gi, '')
        .replace(/```\n?$/gi, '')
        .trim();
    }

    // Try to extract HTML from full document
    if (type === 'html') {
      const htmlMatch = content.match(/<!DOCTYPE[\s\S]*<\/html>/i);
      if (htmlMatch) return htmlMatch[0];
    }

    // Return cleaned content
    return content.trim();
  }

  async createFallbackFile(projectPath, fileConfig, plan) {
    const filePath = path.join(projectPath, fileConfig.name);

    let fallbackContent;
    if (fileConfig.fileType && this.templates[fileConfig.fileType]) {
      fallbackContent = this.templates[fileConfig.fileType](plan);
    } else {
      fallbackContent = this.getGenericFallback(fileConfig, plan);
    }

    await this.adapter.saveFile(filePath, fallbackContent);
    log(`⚠️ Created fallback: ${fileConfig.name}`, 'yellow');
  }

  getGenericFallback(fileConfig, plan) {
    const ext = path.extname(fileConfig.name).toLowerCase();

    switch (ext) {
      case '.js':
        return `// ${fileConfig.name}\n// ${fileConfig.description}\n\nconsole.log('${fileConfig.name} loaded');`;
      case '.css':
        return `/* ${fileConfig.name} */\n/* ${fileConfig.description} */\n\n:root {\n  --primary-color: #007bff;\n}`;
      case '.html':
        return this.getHTMLTemplate(plan);
      case '.json':
        return '{}';
      case '.md':
        return `# ${fileConfig.name}\n\n${fileConfig.description}`;
      default:
        return `# ${fileConfig.name}\n\n${fileConfig.description}\n\nGenerated by Jarvis AI`;
    }
  }

  getHTMLTemplate(plan) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${plan.projectName}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>${plan.description}</h1>
        </header>
        <main>
            <div class="content">
                <p>Welcome to your ${plan.description}!</p>
                <!-- Add your content here -->
            </div>
        </main>
    </div>
    <script src="script.js"></script>
</body>
</html>`;
  }

  getCSSTemplate(plan) {
    return `/* ${plan.projectName} Styles */
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --text-color: #333;
    --bg-color: #f8fafc;
    --border-radius: 8px;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background: var(--bg-color);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

header h1 {
    text-align: center;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 2rem;
}

.content {
    background: white;
    padding: 2rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    text-align: center;
}

@media (max-width: 768px) {
    .container {
        padding: 0.5rem;
    }
}`;
  }

  getJSTemplate(plan) {
    return `// ${plan.projectName} JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('${plan.description} loaded successfully!');
    
    // Initialize the application
    init();
});

function init() {
    // Add your initialization code here
    console.log('Application initialized');
    
    // Add event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Add your event listeners here
    console.log('Event listeners set up');
}

// Add your custom functions here`;
  }

  async createProjectMetadata(projectPath, plan) {
    // Create package.json
    const packageJson = {
      name: plan.projectName,
      version: "1.0.0",
      description: plan.description,
      main: "index.html",
      scripts: {
        start: "open index.html",
        dev: "live-server .",
        build: "echo 'Build script here'"
      },
      keywords: plan.features,
      author: "Jarvis AI",
      dependencies: {},
      devDependencies: {}
    };

    // Add dependencies if specified in plan
    if (plan.dependencies && plan.dependencies.length > 0) {
      plan.dependencies.forEach(dep => {
        packageJson.dependencies[dep] = "latest";
      });
    }

    await this.adapter.saveFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create README.md
    const readme = `# ${plan.projectName}

${plan.description}

## Features
${plan.features.map(feature => `- ${feature}`).join('\n')}

## Tech Stack
${plan.techStack.map(tech => `- ${tech.toUpperCase()}`).join('\n')}

## File Structure
\`\`\`
${this.generateFileTreeString(plan.fileStructure)}
\`\`\`

## Getting Started
1. Clone or download this project
2. Open \`index.html\` in your web browser
3. Start using the application!

## Development
- For local development with live reload: \`npm run dev\` (requires live-server)
- For production build: \`npm run build\`

## Architecture
${plan.architecture}

## Dependencies
${plan.dependencies.length > 0 ? plan.dependencies.map(dep => `- ${dep}`).join('\n') : 'No external dependencies'}

---
*Generated by Jarvis AI*
`;

    await this.adapter.saveFile(path.join(projectPath, 'README.md'), readme);

    // Create .gitignore
    const gitignore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
/dist
/build

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock
`;

    await this.adapter.saveFile(path.join(projectPath, '.gitignore'), gitignore);

    log('📄 Created project metadata (package.json, README.md, .gitignore)', 'cyan');
  }

  generateFileTreeString(fileStructure, indent = '') {
    let tree = '';
    fileStructure.forEach((item, index) => {
      const isLast = index === fileStructure.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const icon = item.type === 'directory' ? '📁' : '📄';
      tree += `${indent}${connector}${icon} ${item.name}\n`;
    });
    return tree;
  }
}

module.exports = FileGenerator;