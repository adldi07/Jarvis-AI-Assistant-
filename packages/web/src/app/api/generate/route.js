import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { Jarvis } from '@jarvis/core';
import InMemoryAdapter from '../../../../adapters/InMemoryAdapter';

export const runtime = 'nodejs';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.accessToken) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in with Google.' }, { status: 401 });
        }

        const { description } = await req.json();
        if (!description) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const send = (data) => {
                    controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
                };

                try {
                    const adapter = new InMemoryAdapter();
                    const jarvis = new Jarvis(adapter);

                    const authOptionsCore = { accessToken: session.accessToken };

                    send({ type: 'status', message: '🧠 Thinking...' });
                    const plan = await jarvis.createPlan(description, authOptionsCore);
                    send({ type: 'plan', data: plan });

                    send({ type: 'status', message: '🚀 Building...' });
                    await jarvis.generate(plan, authOptionsCore);

                    send({ type: 'files', data: adapter.getFiles() });
                    send({ type: 'status', message: '✅ Done!' });
                    controller.close();
                } catch (error) {
                    send({ type: 'error', message: error.message });
                    controller.close();
                }
            },
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache',
            },
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
