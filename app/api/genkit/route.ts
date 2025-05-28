import { NextResponse } from 'next/server';
import { flows, GenKitFlow, FlowType, Language, sessionManager } from '@/lib/genkit/flows';

export async function GET() {
    return NextResponse.json({ 
        status: 'ok',
        message: 'GenKit API is running. Use POST method with a prompt to generate content.',
        availableFlows: Object.keys(flows),
        supportedLanguages: ['en', 'ru']
    });
}

export async function POST(req: Request) {
    try {
        const { 
            prompt, 
            flow = 'chat', 
            context,
            language = 'en'
        } = await req.json();
        
        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        if (!Object.keys(flows).includes(flow)) {
            return NextResponse.json(
                { error: `Invalid flow type. Available flows: ${Object.keys(flows).join(', ')}` },
                { status: 400 }
            );
        }

        if (!['en', 'ru'].includes(language)) {
            return NextResponse.json(
                { error: 'Unsupported language. Supported languages: en, ru' },
                { status: 400 }
            );
        }

        // Get or create session
        const headerSessionId = req.headers.get('x-session-id');
        const isNewSession = !headerSessionId || !sessionManager.hasSession(headerSessionId);
        const sessionId = isNewSession ? Math.random().toString(36).substring(2) : headerSessionId;

        // Get flow instance for this session
        const selectedFlow = sessionManager.getSession(sessionId, flow as FlowType, { language });

        // Generate response
        const result = context 
            ? await selectedFlow.generateWithContext(prompt, context)
            : await selectedFlow.generate(prompt);

        return NextResponse.json({ 
            result,
            flow,
            history: selectedFlow.getHistory(),
            sessionId,
            isNewSession
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 