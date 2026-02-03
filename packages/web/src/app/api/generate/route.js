import { NextResponse } from 'next/server';
import { Jarvis } from '@jarvis/core';
import InMemoryAdapter from '../../../../adapters/InMemoryAdapter';

export const runtime = 'nodejs';

export async function POST(req) {
    try {
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

                    send({ type: 'status', message: '🧠 Thinking...' });
                    const result = await jarvis.createPlan(description);

                    if (result.type === 'chat') {
                        send({ type: 'status', message: `🤖 ${result.message}` });
                        controller.close();
                        return;
                    }

                    const plan = result.plan;
                    send({ type: 'plan', data: plan });

                    send({ type: 'status', message: '🚀 Building...' });
                    await jarvis.generate(plan);

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
