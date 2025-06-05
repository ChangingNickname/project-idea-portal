// import the Genkit and Google AI plugin libraries
import { googleAI } from '@genkit-ai/googleai';
import { genkit, z } from 'genkit';
import { H3Event } from 'h3';
import { validateToken, getTokenFromEvent } from './token';
import jwt from 'jsonwebtoken';
import type { TokenPayload } from './token';

// configure a Genkit instance
export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.0-flash'), // set default model
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  user?: {
    id: string;
    email: string;
    avatar: string;
    displayName: string;
  };
  images?: Array<{
    id: string;
    data: string;
  }>;
}

interface ChatSession {
  messages: ChatMessage[];
  send: (message: string, articleDraft?: any) => Promise<{ text: string; schema?: any }>;
}

// Store active chat sessions
const chatSessions = new Map<string, ChatSession>();

export async function createValidatedChat(event: H3Event) {
  const config = useRuntimeConfig();
  
  // Validate session token
  const sessionToken = await getTokenFromEvent(event);
  if (!config.jwtSecret) {
    throw new Error('JWT secret is not configured');
  }
  validateToken(sessionToken, { jwtSecret: config.jwtSecret as string }, event);

  // Get or create chat session
  let chatSession = chatSessions.get(sessionToken);
  if (!chatSession) {
    const newSession: ChatSession = {
      messages: [],
      send: async (message: string, articleDraft?: any) => {
        // Add user message to history
        const userMessage: ChatMessage = {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        };
        newSession.messages.push(userMessage);
        
        // Prepare context from history
        const context = newSession.messages
          .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n');
        
        // Generate response with context
        const prompt = `Previous conversation:\n${context}\n\nUser: ${message}\nAssistant:`;
        const { text } = await ai.generate(prompt);
        
        // Add assistant message to history
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: text,
          timestamp: new Date().toISOString(),
          user: {
            id: 'assistant',
            email: 'ai@assistant.com',
            avatar: '/images/ai-avatar.png',
            displayName: 'AI Assistant'
          }
        };
        newSession.messages.push(assistantMessage);
        
        return { 
          text,
          schema: articleDraft || null
        };
      }
    };
    chatSessions.set(sessionToken, newSession);
    chatSession = newSession;
  }

  return chatSession;
}

export async function ask(message: string, event: H3Event, articleDraft?: any) {
  const chat = await createValidatedChat(event);
  const { text, schema } = await chat.send(message, articleDraft);
  return { text, schema };
}

// Cleanup function to remove expired sessions
export function cleanupChatSessions() {
  const now = Date.now();
  for (const [token, _] of chatSessions.entries()) {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      if (now - decoded.timestamp > 3600000) { // 1 hour
        chatSessions.delete(token);
      }
    } catch {
      chatSessions.delete(token);
    }
  }
}

/*
// ...configure Genkit (as shown above)...

const graph = defineGraph(
  {
    name: 'MultiStepGraph',
    inputSchema: z.object({ text: z.string(), iterations: z.number() }),
    outputSchema: z.string(),
  },
  async (input) => {
    return {
      state: { text: input.text, iterations: input.iterations, count: 0 },
      nextNode: 'processText',
    };
  }
);

graph.addNode(
  defineFlow(
    {
      name: 'processText',
    },
    async (state) => {
      state.text = state.text.toUpperCase();
      state.count++;

      return {
        state,
        nextNode:
          state.count < state.iterations ? 'processText' : 'finalizeOutput',
      };
    }
  )
);

graph.addNode(
  defineFlow(
    {
      name: 'finalizeOutput',
    },
    async (state) => {
      return `Processed ${state.count} times: ${state.text}`;
    }
  )
);

// Run the graph
const result = await runFlow(graph.executor, {
  text: 'hello world',
  iterations: 3,
});
console.log(result); // Outputs: "Processed 3 times: HELLO WORLD"
*/

/*
// chat session
import { genkit } from 'genkit/beta';
import { googleAI } from '@genkit-ai/googleai';

import { createInterface } from 'node:readline/promises';

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.0-flash'),
});

async function main() {
  const chat = ai.chat();
  console.log("You're chatting with Gemini. Ctrl-C to quit.\n");
  const readline = createInterface(process.stdin, process.stdout);
  while (true) {
    const userInput = await readline.question('> ');
    const { text } = await chat.send(userInput);
    console.log(text);
  }
}

main();
*/