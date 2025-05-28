import { ai } from './init';

export type FlowType = 'chat' | 'completion' | 'code' | 'image';
export type Language = 'en' | 'ru';

interface FlowConfig {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    language?: Language;
}

// Session management
interface Session {
    flow: GenKitFlow;
    lastActivity: number;
}

class SessionManager {
    private static sessions: Map<string, Session> = new Map();
    private static SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    static getSession(sessionId: string, flowType: FlowType, config: FlowConfig = {}): GenKitFlow {
        const now = Date.now();
        const session = this.sessions.get(sessionId);

        // If session exists and not expired, return existing flow
        if (session && (now - session.lastActivity) < this.SESSION_TIMEOUT) {
            session.lastActivity = now;
            return session.flow;
        }

        // Create new session
        const newFlow = new GenKitFlow(flowType, config);
        this.sessions.set(sessionId, {
            flow: newFlow,
            lastActivity: now
        });

        return newFlow;
    }

    static clearExpiredSessions() {
        const now = Date.now();
        // Convert Map to Array before iterating
        Array.from(this.sessions.entries()).forEach(([sessionId, session]) => {
            if (now - session.lastActivity > this.SESSION_TIMEOUT) {
                this.sessions.delete(sessionId);
            }
        });
    }

    static hasSession(sessionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        const now = Date.now();
        return (now - session.lastActivity) < this.SESSION_TIMEOUT;
    }
}

export class GenKitFlow {
    private type: FlowType;
    private config: FlowConfig;
    private history: string[] = [];

    constructor(type: FlowType, config: FlowConfig = {}) {
        this.type = type;
        this.config = {
            temperature: 0.7,
            maxTokens: 1000,
            language: 'en',
            ...config
        };
    }

    private getSystemPrompt(): string {
        const prompts = {
            chat: {
                en: "You are a helpful AI assistant. Provide clear and concise responses.",
                ru: "Вы - полезный AI ассистент. Давайте четкие и лаконичные ответы."
            },
            completion: {
                en: "Complete the following text in a coherent and meaningful way.",
                ru: "Завершите следующий текст связно и осмысленно."
            },
            code: {
                en: "You are a programming expert. Write clean, efficient, and well-documented code.",
                ru: "Вы - эксперт по программированию. Пишите чистый, эффективный и хорошо документированный код."
            },
            image: {
                en: "Generate a detailed description for an image based on the following prompt.",
                ru: "Создайте подробное описание изображения на основе следующего запроса."
            }
        };

        const language = this.config.language || 'en';
        return this.config.systemPrompt || prompts[this.type][language];
    }

    async generate(prompt: string): Promise<string> {
        const fullPrompt = `${this.getSystemPrompt()}\n\n${prompt}`;
        this.history.push(prompt);
        
        const result = await ai.generate(fullPrompt);
        return result.text;
    }

    async generateWithContext(prompt: string, context: string): Promise<string> {
        const fullPrompt = `${this.getSystemPrompt()}\n\nContext: ${context}\n\nPrompt: ${prompt}`;
        this.history.push(prompt);
        
        const result = await ai.generate(fullPrompt);
        return result.text;
    }

    getHistory(): string[] {
        return this.history;
    }

    clearHistory(): void {
        this.history = [];
    }
}

// Pre-configured flows
export const flows = {
    chat: new GenKitFlow('chat'),
    completion: new GenKitFlow('completion'),
    code: new GenKitFlow('code', { temperature: 0.2 }),
    image: new GenKitFlow('image')
};

// Export session manager
export const sessionManager = SessionManager; 