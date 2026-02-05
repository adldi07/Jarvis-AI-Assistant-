import { NextResponse } from 'next/server';
import { callGeminiAPI, callClaudeAPI, callPerplexityAPI, callGroqAPI, callOpenRouterAPI, config } from '@jarvis/core';

export const runtime = 'nodejs';

export async function POST(req) {
    try {
        const { feedback, currentFiles, plan, model } = await req.json();

        const prompt = `
Context: A project named "${plan.projectName}" described as "${plan.description}".
Current Code Files:
${Object.entries(currentFiles).map(([path, content]) => `--- FILE: ${path} ---\n${content}\n`).join('\n')}

User Feedback: "${feedback}"

Task: Update the code files based on the feedback. 
Respond with only the updated files in a JSON format:
{
  "files": {
     "filename.html": "updated content",
     ...
  }
}

Include ONLY the files that need changes. Return valid JSON only.
`;

        let response;
        const { claudeApiKey, perplexityApiKey, groqApiKey, openRouterApiKey } = config;

        if (model === 'claude' && claudeApiKey) {
            response = await callClaudeAPI(prompt);
        } else if (model === 'groq' && groqApiKey) {
            response = await callGroqAPI(prompt);
        } else if (model === 'openrouter' && openRouterApiKey) {
            response = await callOpenRouterAPI(prompt);
        } else if (model === 'perplexity' && perplexityApiKey) {
            response = await callPerplexityAPI(prompt);
        } else {
            response = await callGeminiAPI(prompt);
        }

        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return NextResponse.json(result);
        } else {
            throw new Error('AI failed to return valid JSON for refinement');
        }

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
