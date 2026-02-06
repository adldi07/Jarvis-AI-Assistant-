const Jarvis = require('./lib/Jarvis');
const FileGenerator = require('./models/FileGenerator');
const ProjectPlanner = require('./models/ProjectPlanner');
const { callGeminiAPI } = require('./services/geminiService');
const { callPerplexityAPI } = require('./services/perplexityService');
const { callClaudeAPI } = require('./services/claudeService');
const { callGroqAPI } = require('./services/groqService');
const { callOpenRouterAPI } = require('./services/openRouterService');
const { callOpenAIAPI } = require('./services/openaiService');
const voiceService = require('./services/voiceService');
const config = require('./config/config');
const logger = require('./utils/logger');

module.exports = {
    Jarvis,
    FileGenerator,
    ProjectPlanner,
    callGeminiAPI,
    callPerplexityAPI,
    callClaudeAPI,
    callGroqAPI,
    callOpenRouterAPI,
    callOpenAIAPI,
    voiceService,
    config,
    logger,
    log: logger.log,
    delay: logger.delay,
    displayProgress: logger.displayProgress
};
