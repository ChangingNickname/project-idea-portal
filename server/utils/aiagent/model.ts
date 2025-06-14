// import the Genkit and Google AI plugin libraries
import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import { defineFlow, runFlow } from '@genkit-ai/flow';
import { defineGraph } from 'genkitx-graph';
import { H3Event } from 'h3';
import { validateToken, getTokenFromEvent } from './token';
import jwt from 'jsonwebtoken';
import type { TokenPayload } from './token';
import { $fetch } from 'ofetch';
import { z } from 'zod';
// TODO: ADD RAG FOR KNOWLEDGE BASE
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
  messageHistory: ChatMessage[];
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
      Message History:
      ${state.messageHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
      
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
      - Consider the entire message history when generating responses
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

      // Determine next node based on taskOrder
      if (state.taskOrder.searchWeb) {
        return {
          state,
          nextNode: 'searchWeb'
        };
      } else if (state.taskOrder.searchKnowledgeBase) {
        return {
          state,
          nextNode: 'searchKnowledgeBase'
        };
      } else if (state.taskOrder.needUserClarification) {
        return {
          state,
          nextNode: 'userClarification'
        };
      } else if (state.taskOrder.needFeatureInfo) {
        return {
          state,
          nextNode: 'featureInfo'
        };
      } else if (state.taskOrder.updateArticle) {
        return {
          state,
          nextNode: 'updateArticle'
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

// Define the search web flow
const searchWebFlow = defineFlow(
  {
    name: 'searchWeb'
  },
  async (state: TaskAnalysisState): Promise<FlowResult> => {
    console.log('Executing node: searchWeb');
    const prompt = `
      You are an AI assistant searching the web for information.
      Consider the following context and message history when searching:
      
      Current Message: ${state.message}
      Context: ${state.context}
      Message History:
      ${state.messageHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
      
      Return ONLY a JSON object in this exact format:
      {
        "response": string,
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
    `;
    
    const { text } = await ai.generate(prompt);
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanText);
      
      state.finalResponse = result.response;
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
      console.error('Error in search web:', error);
      state.finalResponse = "Извините, произошла ошибка при поиске информации. Пожалуйста, попробуйте еще раз.";
      return {
        state,
        nextNode: 'finalizeOutput'
      };
    }
  }
);

// Define the search knowledge base flow
const searchKnowledgeBaseFlow = defineFlow(
  {
    name: 'searchKnowledgeBase'
  },
  async (state: TaskAnalysisState): Promise<FlowResult> => {
    console.log('Executing node: searchKnowledgeBase');
    const prompt = `
      You are an AI assistant searching the knowledge base for information.
      Consider the following context and message history when searching:
      
      Current Message: ${state.message}
      Context: ${state.context}
      Message History:
      ${state.messageHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
      
      Return ONLY a JSON object in this exact format:
      {
        "response": string,
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
    `;
    
    const { text } = await ai.generate(prompt);
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanText);
      
      state.finalResponse = result.response;
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
      console.error('Error in search knowledge base:', error);
      state.finalResponse = "Извините, произошла ошибка при поиске в базе знаний. Пожалуйста, попробуйте еще раз.";
      return {
        state,
        nextNode: 'finalizeOutput'
      };
    }
  }
);

// Define the user clarification flow
const userClarificationFlow = defineFlow(
  {
    name: 'userClarification'
  },
  async (state: TaskAnalysisState): Promise<FlowResult> => {
    console.log('Executing node: userClarification');
    const prompt = `
      You are an AI assistant asking for clarification.
      Consider the following context and message history when formulating questions:
      
      Current Message: ${state.message}
      Context: ${state.context}
      Message History:
      ${state.messageHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
      
      Return ONLY a JSON object in this exact format:
      {
        "response": string,
        "clarification": string
      }
    `;
    
    const { text } = await ai.generate(prompt);
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanText);
      
      state.finalResponse = result.response;
      state.userClarification = result.clarification;
      
      return {
        state,
        nextNode: 'finalizeOutput'
      };
    } catch (error) {
      console.error('Error in user clarification:', error);
      state.finalResponse = "Извините, произошла ошибка при запросе уточнений. Пожалуйста, попробуйте еще раз.";
      return {
        state,
        nextNode: 'finalizeOutput'
      };
    }
  }
);

// Define the feature info flow
const featureInfoFlow = defineFlow(
  {
    name: 'featureInfo'
  },
  async (state: TaskAnalysisState): Promise<FlowResult> => {
    console.log('Executing node: featureInfo');
    const prompt = `
      You are an AI assistant providing feature information.
      Consider the following context and message history when explaining features:
      
      Current Message: ${state.message}
      Context: ${state.context}
      Message History:
      ${state.messageHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
      
      Return ONLY a JSON object in this exact format:
      {
        "response": string,
        "featureInfo": string
      }
    `;
    
    const { text } = await ai.generate(prompt);
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanText);
      
      state.finalResponse = result.response;
      state.featureInfo = result.featureInfo;
      
      return {
        state,
        nextNode: 'finalizeOutput'
      };
    } catch (error) {
      console.error('Error in feature info:', error);
      state.finalResponse = "Извините, произошла ошибка при предоставлении информации о функциях. Пожалуйста, попробуйте еще раз.";
      return {
        state,
        nextNode: 'finalizeOutput'
      };
    }
  }
);

// Define the update article flow
const updateArticleFlow = defineFlow(
  {
    name: 'updateArticle'
  },
  async (state: TaskAnalysisState): Promise<FlowResult> => {
    console.log('Executing node: updateArticle');
    const prompt = `
      You are an AI assistant updating an article.
      Consider the following context and message history when making updates:
      
      Current Message: ${state.message}
      Context: ${state.context}
      Message History:
      ${state.messageHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
      Current Schema: ${JSON.stringify(state.schema, null, 2)}
      
      Return ONLY a JSON object in this exact format:
      {
        "response": string,
        "schema": {
          "title": string,
          "cover": string | null,
          "annotation": string,
          "keywords": string[],
          "domain": string,
          "content": string,
          "status": "draft" | "published" | "archived"
        }
      }
    `;
    
    const { text } = await ai.generate(prompt);
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanText);
      
      state.finalResponse = result.response;
      state.schema = {
        ...state.schema,
        ...result.schema
      };
      
      return {
        state,
        nextNode: 'finalizeOutput'
      };
    } catch (error) {
      console.error('Error in update article:', error);
      state.finalResponse = "Извините, произошла ошибка при обновлении статьи. Пожалуйста, попробуйте еще раз.";
      return {
        state,
        nextNode: 'finalizeOutput'
      };
    }
  }
);

// Define the finalize output flow
const finalizeOutputFlow = defineFlow(
  {
    name: 'finalizeOutput'
  },
  async (state: TaskAnalysisState): Promise<FlowResult> => {
    console.log('Executing node: finalizeOutput');
    return {
      state,
      nextNode: 'end'
    };
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
        
        // Initialize state
        const state: TaskAnalysisState = {
          message,
          context,
          messageHistory: [],
          finalResponse: '',
          taskOrder: {
            showIntroduction: false,
            analyzeText: true,
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

        // Run task analysis
        const taskAnalysisResult = await runFlow(taskAnalysisGraph, state);
        
        // Run the next flow based on the task analysis result
        let result = taskAnalysisResult;
        while (result.nextNode !== 'end') {
          switch (result.nextNode) {
            case 'searchWeb':
              result = await runFlow(searchWebFlow, result.state);
              break;
            case 'searchKnowledgeBase':
              result = await runFlow(searchKnowledgeBaseFlow, result.state);
              break;
            case 'userClarification':
              result = await runFlow(userClarificationFlow, result.state);
              break;
            case 'featureInfo':
              result = await runFlow(featureInfoFlow, result.state);
              break;
            case 'updateArticle':
              result = await runFlow(updateArticleFlow, result.state);
              break;
            case 'finalizeOutput':
              result = await runFlow(finalizeOutputFlow, result.state);
              break;
            default:
              console.error('Unknown next node:', result.nextNode);
              throw new Error('Unknown next node: ' + result.nextNode);
          }
        }
        
        // Add assistant message to history
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: result.state.finalResponse,
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
          text: result.state.finalResponse,
          schema: result.state.schema
        };
      }
    };
    chatSessions.set(sessionToken, newSession);
    chatSession = newSession;
  }

  return chatSession;
}

export async function ask(message: string, articleDraft?: ArticleDraft, messageHistory?: Array<{ role: string; content: string; timestamp: string }>): Promise<AIResponse> {
  try {
    console.log('Processing message:', message);
    
    // Convert message history to ChatMessage format
    const chatMessages: ChatMessage[] = messageHistory ? messageHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.timestamp
    })) : [];
    
    // Prepare context from message history
    const context = chatMessages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
    
    // Initialize state
    const state: TaskAnalysisState = {
      message,
      context,
      messageHistory: chatMessages,
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

    // Run task analysis
    const taskAnalysisResult = await runFlow(taskAnalysisGraph, inputFilterResult.state);
    
    // Run the next flow based on the task analysis result
    let result = taskAnalysisResult;
    while (result.nextNode !== 'end') {
      switch (result.nextNode) {
        case 'searchWeb':
          result = await runFlow(searchWebFlow, result.state);
          break;
        case 'searchKnowledgeBase':
          result = await runFlow(searchKnowledgeBaseFlow, result.state);
          break;
        case 'userClarification':
          result = await runFlow(userClarificationFlow, result.state);
          break;
        case 'featureInfo':
          result = await runFlow(featureInfoFlow, result.state);
          break;
        case 'updateArticle':
          result = await runFlow(updateArticleFlow, result.state);
          break;
        case 'finalizeOutput':
          result = await runFlow(finalizeOutputFlow, result.state);
          break;
        default:
          console.error('Unknown next node:', result.nextNode);
          return {
            finalResponse: "Извините, произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз."
          };
      }
    }
    
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
    messageHistory: [],
    finalResponse: '',
    taskOrder: {
      showIntroduction: false,
      analyzeText: true,
      searchWeb: false,
      searchKnowledgeBase: false,
      maxIterations: 1,
      needUserClarification: false,
      needFeatureInfo: false,
      updateArticle: false
    },
    userClarification: '',
    featureInfo: '',
    schema: null
  };

  try {
    console.log('Executing task analysis...');
    const taskAnalysisResult = await runFlow(taskAnalysisGraph, state);
    console.log('Task analysis completed. Next node:', taskAnalysisResult.nextNode);
    
    // Run the next flow based on the task analysis result
    let result = taskAnalysisResult;
    while (result.nextNode !== 'end') {
      switch (result.nextNode) {
        case 'searchWeb':
          result = await runFlow(searchWebFlow, result.state);
          break;
        case 'searchKnowledgeBase':
          result = await runFlow(searchKnowledgeBaseFlow, result.state);
          break;
        case 'userClarification':
          result = await runFlow(userClarificationFlow, result.state);
          break;
        case 'featureInfo':
          result = await runFlow(featureInfoFlow, result.state);
          break;
        case 'updateArticle':
          result = await runFlow(updateArticleFlow, result.state);
          break;
        case 'finalizeOutput':
          result = await runFlow(finalizeOutputFlow, result.state);
          break;
        default:
          console.error('Unknown next node:', result.nextNode);
          throw new Error('Unknown next node: ' + result.nextNode);
      }
    }
    
    return {
      finalResponse: result.state.finalResponse,
      schema: result.state.schema,
      taskOrder: result.state.taskOrder,
      userClarification: result.state.userClarification,
      featureInfo: result.state.featureInfo
    };
  } catch (error) {
    console.error('Error in message processing:', error);
    throw error;
  }
}

// Update the main entry point
export const main = async () => {
  // Initialize the flows
  const flows = {
    taskAnalysis: taskAnalysisGraph,
    searchWeb: searchWebFlow,
    searchKnowledgeBase: searchKnowledgeBaseFlow,
    userClarification: userClarificationFlow,
    featureInfo: featureInfoFlow,
    updateArticle: updateArticleFlow,
    finalizeOutput: finalizeOutputFlow
  };
  
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