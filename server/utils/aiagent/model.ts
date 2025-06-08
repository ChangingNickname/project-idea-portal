// import the Genkit and Google AI plugin libraries
import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import { defineFlow, runFlow } from '@genkit-ai/flow';
import { H3Event } from 'h3';
import { validateToken, getTokenFromEvent } from './token';
import jwt from 'jsonwebtoken';
import type { TokenPayload } from './token';
import { $fetch } from 'ofetch';

// configure a Genkit instance
const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.0-flash'), // set default model
});

interface ArticleDraft {
  id?: string;
  title: string;
  cover: string | null;
  annotation: string;
  owner: {
    id: string;
    email: string;
    avatar: string;
    displayName: string;
  };
  ownerId: string;
  author: Array<{
    id: string;
    email: string;
    avatar: string;
    displayName: string;
  }>;
  authorId: string[];
  keywords: string[];
  domain: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  status: 'draft' | 'published' | 'archived';
  views?: number;
  likes?: number;
  deadline?: string;
  viewedBy?: string[];
}

interface FilterResult {
  hasIssues: boolean;
  message: string;
  disclaimer?: string | null;
}

interface AIResponse {
  finalResponse: string;
  schema?: ArticleDraft;
  taskOrder?: {
    showIntroduction: boolean;
    analyzeText: boolean;
    searchWeb: boolean;
    searchKnowledgeBase: boolean;
    maxIterations: number;
    needUserClarification: boolean;
    needFeatureInfo: boolean;
    updateArticle: boolean;
  };
  userClarification?: string;
  featureInfo?: string;
}

interface TaskAnalysisState {
  message: string;
  context: string;
  finalResponse: string;
  taskOrder: {
    showIntroduction: boolean;
    analyzeText: boolean;
    searchWeb: boolean;
    searchKnowledgeBase: boolean;
    maxIterations: number;
    needUserClarification: boolean;
    needFeatureInfo: boolean;
    updateArticle: boolean;
  };
  userClarification: string;
  featureInfo: string;
  schema: ArticleDraft | null;
}

interface FlowResult {
  state: TaskAnalysisState;
  nextNode: string;
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
  send: (message: string, articleDraft?: ArticleDraft) => Promise<{ text: string; schema?: ArticleDraft }>;
}

interface SearchResult {
  posts: Post[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Define the task analysis graph
const taskAnalysisGraph = defineFlow(
  {
    name: 'taskAnalysisGraph'
  },
  async (state: TaskAnalysisState): Promise<FlowResult> => {
    console.log('Executing node: analyzeTask');
    
    const prompt = `
      You are an AI assistant. Analyze the following message and generate a response.
      DO NOT include any explanations or text outside the JSON object.
      DO NOT use markdown formatting.
      
      Message: ${state.message}
      Context: ${state.context}
      
      Return ONLY a JSON object in this exact format:
      {
        "response": string,
        "taskOrder": {
          "showIntroduction": boolean,
          "analyzeText": boolean,
          "searchWeb": boolean,
          "searchKnowledgeBase": boolean,
          "maxIterations": number,
          "needUserClarification": boolean,
          "needFeatureInfo": boolean,
          "updateArticle": boolean
        },
        "schema": {
          "title": string,
          "cover": string | null,
          "annotation": string,
          "keywords": string[],
          "domain": string,
          "content": string,
          "status": "draft" | "published" | "archived"
        } | null
      }
      
      Rules for response:
      - If message is about creating a new article:
        1. Generate a complete initial schema
        2. Ask specific questions about the article
        3. Set needUserClarification to true
      - If message is a greeting: Respond with a friendly greeting and offer help
      - If message asks about capabilities: Explain what you can do
      - If message is about article updates: Update schema and confirm changes
      - If message is a question: Provide a direct answer
      - Keep responses concise and natural
      - Use the same language as the user's message
      
      Rules for taskOrder:
      - showIntroduction: true if greeting or asking about capabilities
      - analyzeText: true if message needs analysis
      - searchWeb: true if external information needed
      - searchKnowledgeBase: true if looking for existing content
      - needUserClarification: true if asking for more details
      - needFeatureInfo: true if asking about features
      - updateArticle: true if suggesting article changes
      - maxIterations: always 1
      
      Rules for schema:
      - For new articles:
        1. Set a clear title
        2. Add relevant keywords
        3. Set appropriate domain
        4. Add initial annotation
        5. Set status to "draft"
      - For updates: Return updated schema
      - If no updates needed: Return null
      - Keep existing values for fields not mentioned in message
      
      Example responses:
      {"response": "Создаю начальную схему для статьи о умных парковках. Расскажите подробнее:\n1. Какие аспекты умных парковок вас интересуют больше всего?\n2. Есть ли у вас предпочтения по формату статьи (обзор, инструкция, анализ)?\n3. Какие ключевые функции умных парковок вы хотели бы осветить?", "taskOrder": {"showIntroduction": false, "analyzeText": true, "searchWeb": false, "searchKnowledgeBase": false, "maxIterations": 1, "needUserClarification": true, "needFeatureInfo": false, "updateArticle": true}, "schema": {"title": "Умные парковки: технологии будущего", "cover": null, "annotation": "Обзор современных технологий умных парковок, их преимуществ и перспектив развития", "keywords": ["умные парковки", "умный город", "IoT", "автоматизация", "транспортная инфраструктура"], "domain": "smart-city", "content": "", "status": "draft"}}
    `;

    const { text } = await ai.generate(prompt);
    
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanText);
      
      state.finalResponse = result.response;
      state.taskOrder = {
        ...state.taskOrder,
        ...result.taskOrder
      };
      
      if (result.schema) {
        state.schema = {
          ...state.schema,
          ...result.schema
        };
      }
      
      return {
        state,
        nextNode: 'finalizeOutput'
      };
    } catch (error) {
      console.error('Error in task analysis:', error);
      console.error('Raw response:', text);
      state.finalResponse = "Извините, произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз.";
      return {
        state,
        nextNode: 'finalizeOutput'
      };
    }
  }
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
      send: async (message: string, articleDraft?: ArticleDraft) => {
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
          ${JSON.stringify(taskOrderResult.state.taskOrder, null, 2)}
          
          Search Results:
          ${taskOrderResult.state.searchResults.join('\n')}
          
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

export async function ask(message: string, articleDraft?: ArticleDraft): Promise<AIResponse> {
  try {
    console.log('Processing message:', message);
    
    // Initialize state
    const state: TaskAnalysisState = {
      message,
      context: articleDraft ? JSON.stringify(articleDraft) : '',
      finalResponse: '',
      taskOrder: {
        showIntroduction: false,
        analyzeText: false,
        searchWeb: false,
        searchKnowledgeBase: false,
        maxIterations: 1,
        needUserClarification: false,
        needFeatureInfo: false,
        updateArticle: false
      },
      userClarification: '',
      featureInfo: '',
      schema: articleDraft || null
    };

    // Run input filter first
    const inputFilterResult = await runFlow(
      defineFlow(
        {
          name: 'inputFilter'
        },
        inputFilter
      ),
      state
    );

    // If input filter found issues, return immediately
    if (inputFilterResult.nextNode === 'finalizeOutput') {
      return {
        finalResponse: inputFilterResult.state.finalResponse,
        taskOrder: inputFilterResult.state.taskOrder,
        schema: inputFilterResult.state.schema
      };
    }

    // Run main graph only if input filter passed
    const result = await runFlow(taskAnalysisGraph, inputFilterResult.state);
    
    return {
      finalResponse: result.state.finalResponse,
      taskOrder: result.state.taskOrder,
      schema: result.state.schema,
      userClarification: result.state.userClarification,
      featureInfo: result.state.featureInfo
    };
  } catch (error) {
    console.error('Error in ask function:', error);
    return {
      finalResponse: "Извините, произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз."
    };
  }
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

export async function processMessage(message: string, context: string = ''): Promise<AIResponse> {
  console.log('Starting message processing...');
  
  const state: TaskAnalysisState = {
    message,
    context,
    taskOrder: {
      showIntroduction: false,
      analyzeText: true,
      searchWeb: false,
      searchKnowledgeBase: false,
      maxIterations: 1,
      needUserClarification: false,
      needFeatureInfo: false
    },
    searchResults: [],
    userClarification: '',
    featureInfo: '',
    articleDraft: '',
    finalResponse: ''
  };

  try {
    console.log('Executing task analysis graph...');
    // Always start with inputFilter
    const result = await taskAnalysisGraph.execute(state);
    console.log('Graph execution completed. Final node:', result.nextNode);
    
    return {
      response: result.state.finalResponse,
      schema: result.state.schemaUpdate
    };
  } catch (error) {
    console.error('Error in message processing:', error);
    throw error;
  }
}

// Update the main entry point
export const main = async () => {
  const graph = taskAnalysisGraph;
  graph.setEntryPoint('inputFilter');
  // ... rest of the main function
};

async function inputFilter(state: TaskAnalysisState): Promise<FlowResult> {
  console.log('Executing node: inputFilter');
  
  const prompt = `
    You are a strict content filter. Your task is to analyze the following message and return a JSON response.
    DO NOT include any explanations or text outside the JSON object.
    DO NOT use markdown formatting.
    
    Message to analyze: ${state.message}
    
    Return ONLY a JSON object in this exact format:
    {
      "hasIssues": boolean,
      "message": string
    }
    
    Rules for hasIssues:
    - Set to true if message contains ANY of these:
      1. Political content or propaganda
      2. Religious content or discussions
      3. Offensive or harmful content
      4. Dangerous or illegal activities
      5. Sensitive personal information
      6. Hate speech or discrimination
      7. Explicit content
      8. Medical advice
      9. Financial advice
      10. Security vulnerabilities
      11. Malware or hacking instructions
      12. Copyright violations
      13. Spam or advertising
      14. Personal attacks
      15. Misinformation
    
    Rules for message:
    - If hasIssues is true: Return a clear rejection message explaining why the content cannot be processed
    - If hasIssues is false: Return "Message is clean"
    
    Example responses:
    {"hasIssues": false, "message": "Message is clean"}
    {"hasIssues": true, "message": "Извините, но я не могу обработать этот запрос, так как он содержит политический контент."}
    {"hasIssues": true, "message": "Извините, но я не могу обработать этот запрос, так как он содержит религиозный контент."}
    {"hasIssues": true, "message": "Извините, но я не могу обработать этот запрос, так как он содержит недопустимый контент."}
  `;

  const { text } = await ai.generate(prompt);
  
  try {
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    const filterResult = JSON.parse(cleanText) as FilterResult;
    
    if (filterResult.hasIssues) {
      console.log('Input filter found issues:', filterResult.message);
      state.finalResponse = filterResult.message;
      state.taskOrder.showIntroduction = false;
      return {
        state,
        nextNode: 'finalizeOutput'
      };
    }
    
    console.log('Input filter passed message');
    return {
      state,
      nextNode: 'analyzeTask'
    };
  } catch (error) {
    console.error('Error in input filter:', error);
    console.error('Raw response:', text);
    state.finalResponse = "Извините, но я не могу обработать этот запрос. Пожалуйста, попробуйте сформулировать его иначе.";
    state.taskOrder.showIntroduction = false;
    return {
      state,
      nextNode: 'finalizeOutput'
    };
  }
}

async function finalizeOutput(state: TaskAnalysisState): Promise<FlowResult> {
  console.log('Executing node: finalizeOutput');
  return {
    state,
    nextNode: 'end'
  };
}