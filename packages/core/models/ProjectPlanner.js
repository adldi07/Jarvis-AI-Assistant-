const { callGeminiAPI } = require('../services/geminiService');
const { callPerplexityAPI } = require('../services/perplexityService');
const { callOpenRouterAPI } = require('../services/openRouterService');
const { log } = require('../utils/logger');
const { perplexityApiKey, openRouterApiKey } = require('../config/config');

class ProjectPlanner {
  constructor() {
    this.currentProject = null;
  }

  async createProjectPlan(projectDescription) {
    log('\n🧠 AI Processing Context...', 'magenta');
    log('━'.repeat(50), 'dim');

    const planningPrompt = `
You are Jarvis, an advanced AI software engineer. Analyze the user request: "${projectDescription}"

- If it is a GREETING or GENERAL CONVERSATION:
  Return JSON: { "intent": "chat", "message": "Your friendly response as Jarvis" }

- If it is a request to BUILD/CREATE a project/app/tool:
  Return JSON: { 
    "intent": "project", 
    "plan": {
      "projectName": "kebab-case-name",
      "description": "Short description",
      "features": ["feature1", "feature2"],
      "techStack": ["html", "css", "javascript"],
      "fileStructure": [
        {"name": "index.html", "type": "file", "fileType": "html", "description": "Main HTML with semantic structure"},
        {"name": "styles.css", "type": "file", "fileType": "css", "description": "Modern CSS with variables, gradients, and animations"},
        {"name": "script.js", "type": "file", "fileType": "javascript", "description": "Clean, modular logic"}
      ],
      "dependencies": [],
      "architecture": "Describe how the UI and logic interact"
    }
  }

- DESIGN GUIDELINES:
  - Use high-end, premium aesthetics (glassmorphism, vibrant gradients, shadows).
  - Use Google Fonts (e.g., Inter, Montserrat).
  - Ensure mobile-first responsiveness.
  - Add smooth transitions and hover micro-animations.

Return ONLY clean JSON.
`;

    try {
      // Use Open Router if key is available (primary), then Perplexity, then Gemini
      let response;
      if (openRouterApiKey) {
        log('🚀 Using Open Router API...', 'cyan');
        response = await callOpenRouterAPI(planningPrompt);
      } else if (perplexityApiKey) {
        log('🧠 Using Perplexity AI...', 'magenta');
        response = await callPerplexityAPI(planningPrompt);
      } else {
        log('✨ Using Gemini API...', 'magenta');
        response = await callGeminiAPI(planningPrompt);
      }
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);

        if (result.intent === 'chat') {
          return { type: 'chat', message: result.message };
        }

        this.currentProject = result.plan;
        this.displayPlan();
        return { type: 'project', plan: this.currentProject };
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (error) {
      log(`❌ AI analysis failed: ${error.message}. Trying Gemini fallback...`, 'red');
      try {
        const response = await callGeminiAPI(planningPrompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          if (result.intent === 'chat') return { type: 'chat', message: result.message };
          this.currentProject = result.plan;
          this.displayPlan();
          return { type: 'project', plan: this.currentProject };
        }
      } catch (fallbackError) {
        log(`❌ Gemini fallback also failed: ${fallbackError.message}`, 'red');
      }
      return { type: 'project', plan: this.createFallbackPlan(projectDescription) };
    }
  }

  createFallbackPlan(projectDescription) {
    const projectName = projectDescription.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    this.currentProject = {
      projectName,
      description: projectDescription,
      features: ["Core functionality", "Responsive design", "Modern UI"],
      techStack: ["html", "css", "javascript"],
      fileStructure: [
        { "name": "index.html", "type": "file", "fileType": "html", "description": "Main HTML file" },
        { "name": "styles.css", "type": "file", "fileType": "css", "description": "Styling" },
        { "name": "script.js", "type": "file", "fileType": "javascript", "description": "Main functionality" },
        { "name": "assets", "type": "directory", "description": "Static assets folder" }
      ],
      dependencies: [],
      architecture: "Simple single-page application"
    };

    log('📋 Using fallback plan...', 'yellow');
    this.displayPlan();
    return this.currentProject;
  }

  displayPlan() {
    const plan = this.currentProject;

    log('\n📋 PROJECT PLAN GENERATED', 'green');
    log('━'.repeat(50), 'dim');
    log(`📁 Project: ${plan.projectName}`, 'bright');
    log(`📝 Description: ${plan.description}`, 'white');

    log('\n✨ Features:', 'cyan');
    plan.features.forEach(feature => log(`  • ${feature}`, 'white'));

    log('\n🛠️ Tech Stack:', 'yellow');
    plan.techStack.forEach(tech => log(`  • ${tech.toUpperCase()}`, 'white'));

    log('\n📂 File Structure:', 'blue');
    plan.fileStructure.forEach(item => {
      const icon = item.type === 'directory' ? '📁' : '📄';
      log(`  ${icon} ${item.name} - ${item.description}`, 'white');
    });

    if (plan.dependencies.length > 0) {
      log('\n📦 Dependencies:', 'magenta');
      plan.dependencies.forEach(dep => log(`  • ${dep}`, 'white'));
    }

    log(`\n🏗️ Architecture: ${plan.architecture}`, 'green');
    log('━'.repeat(50), 'dim');
  }
}

module.exports = ProjectPlanner; 