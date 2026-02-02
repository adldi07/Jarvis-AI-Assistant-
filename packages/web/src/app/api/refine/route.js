import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { callGeminiAPI } from '@jarvis/core';

export const runtime = 'nodejs';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { feedback, currentFiles, plan } = await req.json();

        const authOptionsCore = { accessToken: session.accessToken };

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

        const response = await callGeminiAPI(prompt, authOptionsCore);
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
