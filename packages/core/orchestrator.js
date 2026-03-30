const { callClaudeAPI } = require('./services/claudeService');
const { callGeminiAPI } = require('./services/geminiService');
const { callGroqAPI } = require('./services/groqService');
const { callOpenAIAPI } = require('./services/openaiService');
const { callOpenRouterAPI } = require('./services/openRouterService');
const { callPerplexityAPI } = require('./services/perplexityService');
const { log } = require('./utils/logger');

/**
 * Extracts JSON payload from LLM responses, handling markdown code blocks
 * @param {string} text - The raw text from the LLM
 * @returns {any} Parsed JSON object or array
 */
function extractJSON(text) {
    try {
        return JSON.parse(text);
    } catch (e) {
        const match = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
        if (match && match[1]) {
            try { return JSON.parse(match[1]); } catch (err) {}
        }
        
        const firstArr = text.indexOf('[');
        const lastArr = text.lastIndexOf(']');
        const firstObj = text.indexOf('{');
        const lastObj = text.lastIndexOf('}');
        
        if (firstArr !== -1 && lastArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
            try { return JSON.parse(text.substring(firstArr, lastArr + 1)); } catch (err) {}
        }
        
        if (firstObj !== -1 && lastObj !== -1) {
            try { return JSON.parse(text.substring(firstObj, lastObj + 1)); } catch (err) {}
        }
    }
    throw new Error('Could not parse JSON from response.');
}

/**
 * Orchestrator wrapper to safely call an agent, log usage, and fallback to OpenRouter.
 * @param {string} roleName - Display name of the agent role (e.g. PLANNER)
 * @param {Function} defaultAgentFn - Default specific service function (e.g. callClaudeAPI)
 * @param {string} defaultModelName - String identifier for the default model (e.g. 'claude')
 * @param {string} prompt - The prompt to send
 * @param {string} modelPreference - The user's requested model ('best', or specifically 'claude', 'gemini', etc.)
 * @returns {Promise<string>}
 */
async function callAgent(roleName, defaultAgentFn, defaultModelName, prompt, modelPreference) {
    let agentFn = defaultAgentFn;
    let selectedModel = defaultModelName;

    if (modelPreference !== 'best') {
        selectedModel = modelPreference.toLowerCase();
        switch (selectedModel) {
            case 'claude': agentFn = callClaudeAPI; break;
            case 'gemini': agentFn = callGeminiAPI; break;
            case 'groq': agentFn = callGroqAPI; break;
            case 'openai': agentFn = callOpenAIAPI; break;
            case 'perplexity': agentFn = callPerplexityAPI; break;
            case 'openrouter': agentFn = callOpenRouterAPI; break;
            default: 
                log(`⚠️ Unknown model preference '${modelPreference}', reverting to default ${defaultModelName}`, 'yellow');
                selectedModel = defaultModelName;
        }
    }

    log(`[${roleName}] Routing task to ${selectedModel.toUpperCase()} (Reason: ${modelPreference === 'best' ? 'Optimal for ' + roleName : 'User override'})`, 'cyan');
    
    try {
        const result = await agentFn(prompt);
        return result;
    } catch (error) {
        log(`🧨 [${roleName}] ${selectedModel.toUpperCase()} failed: ${error.message}. Falling back to OpenRouter.`, 'yellow');
        const fallbackResult = await callOpenRouterAPI(prompt);
        return fallbackResult;
    }
}

/**
 * Orchestrates a multi-agent workflow to accomplish a user task.
 * 
 * Flow:
 * 1. PLANNER -> breaks down task
 * 2. Loop over subtasks:
 *    - RESEARCHER -> if context needed
 *    - CODER -> writes code
 *    - REVIEWER -> checks code (loops back to CODER up to 2 times if needed)
 * 3. Returns combined context
 *
 * @param {string} userTask - The original user prompt/task
 * @param {string} modelPreference - Selected model ('best' or specific model like 'gemini')
 * @returns {Promise<string>} The final assembled result
 */
async function runOrchestrator(userTask, modelPreference = 'best') {
    log(`🚀 Starting Multi-Agent Pipeline for task: "${userTask.substring(0, 50)}..."`, 'green');
    
    // Phase 1: PLANNER (Claude - Best at reasoning & structured JSON plans)
    const plannerPrompt = `
You are the PLANNER agent. Break the following user task down into smaller subtasks.
Return a STRICT JSON array of objects. Each object must have:
- "id": A numeric ID
- "type": Either "research" (if web search/documentation review is needed) or "code" (if pure code generation)
- "description": Explicit and detailed instructions for the subtask

User Task: ${userTask}

Return ONLY the JSON array.
`;
    const plannerResponse = await callAgent('PLANNER', callClaudeAPI, 'claude', plannerPrompt, modelPreference);
    
    let subtasks = [];
    try {
        let parsed = extractJSON(plannerResponse);
        subtasks = Array.isArray(parsed) ? parsed : (parsed.subtasks || [parsed]);
    } catch (e) {
        log(`⚠️ [PLANNER] Failed to parse structured JSON. Defaulting to single subtask.`, 'yellow');
        subtasks = [{ id: 1, type: "code", description: userTask }];
    }

    log(`📋 [PLANNER] Generated ${subtasks.length} subtask(s)`, 'cyan');

    let finalOutput = [];

    // Phase 2: Execute subtasks
    for (const subtask of subtasks) {
        log(`\n➡️ Executing Subtask ${subtask.id} (${subtask.type}): ${subtask.description.substring(0, 50)}...`, 'magenta');
        
        if (subtask.type === 'research') {
            // Phase 3a: RESEARCHER (Perplexity - Web-aware)
            const researchPrompt = `
You are the RESEARCHER agent. Provide detailed notes, documentation, or gathered info for the following task:
Task: ${subtask.description}
`;
            const researchNotes = await callAgent('RESEARCHER', callPerplexityAPI, 'perplexity', researchPrompt, modelPreference);
            finalOutput.push(`### Research Notes (Task ${subtask.id})\n${researchNotes}`);
        } else {
            // Phase 3b: CODER (Gemini/OpenAI - Best at code generation)
            let coderPrompt = `
You are the CODER agent. Generate the complete and robust code for this subtask:
Task: ${subtask.description}
`;
            let generatedCode = await callAgent('CODER', callGeminiAPI, 'gemini', coderPrompt, modelPreference);
            
            // Phase 4: REVIEWER (Groq - Fast, good at critique)
            let isApproved = false;
            let currentIteration = 0;
            const MAX_REVIEW_RETRIES = 2;

            while (!isApproved && currentIteration < MAX_REVIEW_RETRIES) {
                const reviewerPrompt = `
You are the REVIEWER agent. Critique the following code based on the original subtask. Check for bugs, omissions, or anti-patterns.
Subtask: ${subtask.description}

Code:
${generatedCode}

Return a STRICT JSON object with:
- "status": Either "approved" or "needs_fixes"
- "feedback": If "needs_fixes", describe specifically what to change. If "approved", say "Looks good".
Return ONLY the JSON object.
`;
                const reviewResponse = await callAgent(`REVIEWER (Iter ${currentIteration + 1})`, callGroqAPI, 'groq', reviewerPrompt, modelPreference);
                
                let reviewData = { status: "approved", feedback: "" };
                try {
                    reviewData = extractJSON(reviewResponse);
                } catch (e) {
                    log(`⚠️ [REVIEWER] Failed to parse JSON, assuming approved.`, 'yellow');
                }

                if (reviewData.status === 'needs_fixes') {
                    // Loop back to CODER Phase
                    log(`🔄 [REVIEWER] Flagged issues: ${reviewData.feedback.substring(0, 60)}... Retrying CODER.`, 'magenta');
                    currentIteration++;
                    
                    const fixPrompt = `
You are the CODER agent. Your previous code had issues flagged by the REVIEWER.
Original subtask: ${subtask.description}

REVIEWER Feedback:
${reviewData.feedback}

Previous Code:
${generatedCode}

Please fix the code and return the entire updated/fixed version.
`;
                    generatedCode = await callAgent(`CODER (Fix ${currentIteration})`, callGeminiAPI, 'gemini', fixPrompt, modelPreference);
                } else {
                    isApproved = true;
                    log(`✅ [REVIEWER] Code approved!`, 'green');
                }
            }

            if (!isApproved) {
                log(`⚠️ [REVIEWER] Max iterations reached. Proceeding with the latest generated code.`, 'yellow');
            }

            finalOutput.push(`### Code (Task ${subtask.id})\n${generatedCode}`);
        }
    }

    log(`🎉 Multi-Agent Orchestration complete! Combined results ready.`, 'green');
    return finalOutput.join('\n\n---\n\n');
}

module.exports = {
    runOrchestrator
};
