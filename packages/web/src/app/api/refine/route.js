import { NextResponse } from 'next/server';
import { callGeminiAPI, callClaudeAPI, callPerplexityAPI, callGroqAPI, callOpenRouterAPI, config } from '@jarvis/core';

export const runtime = 'nodejs';

export async function POST(req) {
    try {
        const { feedback, currentFiles, plan, model } = await req.json();

        const prompt = `Project:${plan.projectName}
Files:
${Object.entries(currentFiles).map(([p, c]) => `[${p}]\n${c}`).join('\n')}

Feedback:"${feedback}"

Return JSON:{"files":{"filename":"updated code"}} Only changed files. JSON only.`;

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
