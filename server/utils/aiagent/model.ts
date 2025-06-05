// import the Genkit and Google AI plugin libraries
import { googleAI } from '@genkit-ai/googleai';
import { genkit, z } from 'genkit';
import { defineGraph } from 'genkitx-graph';
import { defineFlow, runFlow } from '@genkit-ai/flow';
import { H3Event } from 'h3';
import { validateToken, getTokenFromEvent } from './token';
import jwt from 'jsonwebtoken';
import type { TokenPayload } from './token';

// configure a Genkit instance
export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.0-flash'), // set default model
});

interface TaskOrder {
  analyzeText: boolean;
  searchWeb: boolean;
  searchKnowledgeBase: boolean;
  maxIterations: number;
  needUserClarification: boolean;
  needFeatureInfo: boolean;
}

interface TaskAnalysisState {
  message: string;
  context: string;
  taskOrder: TaskOrder;
  currentIteration: number;
  searchResults: string[];
  userClarification: string | null;
  featureInfo: string | null;
}

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

// Define the task analysis graph
const taskAnalysisGraph = defineGraph(
  {
    name: 'TaskOrderAnalysis',
    inputSchema: z.object({ 
      message: z.string(),
      context: z.string().optional(),
      userClarification: z.string().optional(),
      featureInfo: z.string().optional()
    }),
    outputSchema: z.object({
      taskOrder: z.object({
        analyzeText: z.boolean(),
        searchWeb: z.boolean(),
        searchKnowledgeBase: z.boolean(),
        maxIterations: z.number().min(1).max(5),
        needUserClarification: z.boolean(),
        needFeatureInfo: z.boolean()
      }),
      searchResults: z.array(z.string()),
      userClarification: z.string().nullable(),
      featureInfo: z.string().nullable(),
      finalResponse: z.string()
    })
  },
  async (input) => {
    return {
      state: { 
        message: input.message,
        context: input.context || '',
        taskOrder: {
          analyzeText: false,
          searchWeb: false,
          searchKnowledgeBase: false,
          maxIterations: 1,
          needUserClarification: false,
          needFeatureInfo: false
        },
        currentIteration: 0,
        searchResults: [],
        userClarification: input.userClarification || null,
        featureInfo: input.featureInfo || null
      } as TaskAnalysisState,
      nextNode: 'analyzeTask'
    };
  }
);

// Add node for initial task analysis
taskAnalysisGraph.addNode(
  defineFlow(
    {
      name: 'analyzeTask'
    },
    async (state: TaskAnalysisState) => {
      const prompt = `
        Analyze the following message and determine which tasks need to be performed.
        Message: ${state.message}
        Context: ${state.context}
        
        Determine if we need to:
        1. Analyze the text (for understanding the request)
        2. Search the web (for external information)
        3. Search the knowledge base (for internal information)
        4. Ask user for clarification
        5. Provide information about available features
        
        Also determine how many iterations of search might be needed (max 5).
        
        Return the task order as a JSON object with the following structure:
        {
          "analyzeText": boolean,
          "searchWeb": boolean,
          "searchKnowledgeBase": boolean,
          "maxIterations": number (1-5),
          "needUserClarification": boolean,
          "needFeatureInfo": boolean
        }
      `;

      const { text } = await ai.generate(prompt);
      
      try {
        const taskOrder = JSON.parse(text) as TaskOrder;
        state.taskOrder = {
          analyzeText: taskOrder.analyzeText ?? true,
          searchWeb: taskOrder.searchWeb ?? false,
          searchKnowledgeBase: taskOrder.searchKnowledgeBase ?? false,
          maxIterations: Math.min(Math.max(taskOrder.maxIterations ?? 1, 1), 5),
          needUserClarification: taskOrder.needUserClarification ?? false,
          needFeatureInfo: taskOrder.needFeatureInfo ?? false
        };
      } catch (error) {
        // Default task order if parsing fails
        state.taskOrder = {
          analyzeText: true,
          searchWeb: false,
          searchKnowledgeBase: false,
          maxIterations: 1,
          needUserClarification: false,
          needFeatureInfo: false
        };
      }

      return {
        state,
        nextNode: state.taskOrder.needUserClarification ? 'askUserClarification' : 
                 state.taskOrder.needFeatureInfo ? 'provideFeatureInfo' : 
                 'processTasks'
      };
    }
  )
);

// Add node for asking user clarification
taskAnalysisGraph.addNode(
  defineFlow(
    {
      name: 'askUserClarification'
    },
    async (state: TaskAnalysisState) => {
      const prompt = `
        Based on the following message and context, generate a question to clarify the user's request.
        Message: ${state.message}
        Context: ${state.context}
        
        The question should be specific and help us better understand what the user needs.
      `;

      const { text } = await ai.generate(prompt);
      state.userClarification = text;

      return {
        state,
        nextNode: 'finalizeOutput'
      };
    }
  )
);

// Add node for providing feature information
taskAnalysisGraph.addNode(
  defineFlow(
    {
      name: 'provideFeatureInfo'
    },
    async (state: TaskAnalysisState) => {
      const prompt = `
        Based on the following message and context, provide information about relevant features.
        Message: ${state.message}
        Context: ${state.context}
        
        Explain what features are available and how they can help the user.
      `;

      const { text } = await ai.generate(prompt);
      state.featureInfo = text;

      return {
        state,
        nextNode: 'finalizeOutput'
      };
    }
  )
);

// Add node for processing tasks
taskAnalysisGraph.addNode(
  defineFlow(
    {
      name: 'processTasks'
    },
    async (state: TaskAnalysisState) => {
      if (state.currentIteration >= state.taskOrder.maxIterations) {
        return {
          state,
          nextNode: 'finalizeOutput'
        };
      }

      // Process current iteration
      state.currentIteration++;
      
      // Here we would implement actual search logic
      // For now, just add a placeholder result
      state.searchResults.push(`Search iteration ${state.currentIteration} completed`);

      return {
        state,
        nextNode: state.currentIteration < state.taskOrder.maxIterations ? 'processTasks' : 'finalizeOutput'
      };
    }
  )
);

// Update finalizeOutput node
taskAnalysisGraph.addNode(
  defineFlow(
    {
      name: 'finalizeOutput'
    },
    async (state: TaskAnalysisState) => {
      // Generate final response based on all collected information
      const prompt = `
        Based on the following information, generate a comprehensive response:
        
        Original Message: ${state.message}
        Context: ${state.context}
        Search Results: ${state.searchResults.join('\n')}
        User Clarification: ${state.userClarification || 'Not needed'}
        Feature Info: ${state.featureInfo || 'Not needed'}
        
        Generate a helpful and informative response that addresses the user's needs.
      `;

      const { text } = await ai.generate(prompt);

      return {
        taskOrder: state.taskOrder,
        searchResults: state.searchResults,
        userClarification: state.userClarification,
        featureInfo: state.featureInfo,
        finalResponse: text
      };
    }
  )
);

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
        
        // Analyze task order using the graph
        const taskOrderResult = await runFlow(taskAnalysisGraph.executor, {
          message,
          context,
          articleDraft
        });
        
        // Generate response with context and task order
        const prompt = `
          Previous conversation:
          ${context}
          
          Task Order:
          ${JSON.stringify(taskOrderResult.taskOrder, null, 2)}
          
          Search Results:
          ${taskOrderResult.searchResults.join('\n')}
          
          User: ${message}
          Assistant:`;
          
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
  const context = chat.messages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const result = await runFlow(taskAnalysisGraph.executor, {
    message,
    context,
    articleDraft
  });

  // Add user message to history
  chat.messages.push({
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  });

  // Add assistant message to history
  chat.messages.push({
    role: 'assistant',
    content: result.finalResponse,
    timestamp: new Date().toISOString(),
    user: {
      id: 'assistant',
      email: 'ai@assistant.com',
      avatar: '/images/ai-avatar.png',
      displayName: 'AI Assistant'
    }
  });

  return { 
    text: result.finalResponse,
    schema: articleDraft || null,
    taskOrder: result.taskOrder,
    userClarification: result.userClarification,
    featureInfo: result.featureInfo
  };
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