import { z } from 'zod';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { defineGraph } from 'genkitx-graph';
import { defineFlow, runFlow } from '@genkit-ai/flow';

// Инициализация Genkit
const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.0-flash'),
});

// Определение типов задач
const TaskType = z.enum([
  'extract_full_text',
  'extract_key_topics',
  'determine_domain',
  'create_annotation',
  'create_title',
  'format_article',
  'web_search',
  'knowledge_base_search',
  'help'
]);
type TaskType = z.infer<typeof TaskType>;

// Определение схем для результатов
const KeyTopicsSchema = z.object({
  topics: z.array(z.string()),
});

const DomainSchema = z.object({
  domain: z.string(),
  subdomains: z.array(z.string()),
});

const ArticleSchema = z.object({
  title: z.string(),
  keys: z.array(z.string()),
  annotation: z.string(),
  text: z.string(),
});

const WebSearchSchema = z.object({
  results: z.array(z.object({
    title: z.string(),
    url: z.string(),
    snippet: z.string(),
    relevance: z.number(),
  })),
  totalFound: z.number(),
});

const KnowledgeBaseSearchSchema = z.object({
  results: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    metadata: z.object({
      domain: z.string(),
      createdAt: z.string(),
      tags: z.array(z.string()),
      relevance: z.number(),
    }),
  })),
  totalFound: z.number(),
});

// Определение промтов
const extractFullTextPrompt = ai.definePrompt({
  name: 'extractFullTextPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {
    schema: z.object({ text: z.string() }),
  },
  prompt: `Extract the complete text from the following content:

{{text}}

Return only the extracted text without any additional comments or formatting.`,
});

const extractKeyTopicsPrompt = ai.definePrompt({
  name: 'extractKeyTopicsPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {
    schema: z.object({ text: z.string() }),
  },
  output: {
    schema: KeyTopicsSchema,
  },
  prompt: `Extract 3-7 key topics from the following text:

{{text}}

Return the result in JSON format with an array of topics.`,
});

const determineDomainPrompt = ai.definePrompt({
  name: 'determineDomainPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {
    schema: z.object({ text: z.string() }),
  },
  output: {
    schema: DomainSchema,
  },
  prompt: `Determine the main domain and subdomains of the following text:

{{text}}

Return the result in JSON format with the main domain and an array of subdomains.`,
});

const createAnnotationPrompt = ai.definePrompt({
  name: 'createAnnotationPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {
    schema: z.object({ text: z.string() }),
  },
  prompt: `Create a brief annotation (2-3 sentences) for the following text:

{{text}}

Return only the annotation without any additional comments.`,
});

const createTitlePrompt = ai.definePrompt({
  name: 'createTitlePrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {
    schema: z.object({ text: z.string() }),
  },
  prompt: `Create an informative title for the following text:

{{text}}

Return only the title without any additional comments.`,
});

const formatArticlePrompt = ai.definePrompt({
  name: 'formatArticlePrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {
    schema: z.object({ text: z.string() }),
  },
  output: {
    schema: ArticleSchema,
  },
  prompt: `Format the following text into a structured article:

{{text}}

Return the result in JSON format with title, keywords, annotation, and text.`,
});

const webSearchPrompt = ai.definePrompt({
  name: 'webSearchPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {
    schema: z.object({ query: z.string() }),
  },
  output: {
    schema: WebSearchSchema,
  },
  prompt: `Search the web for information about:

{{query}}

Return the results in JSON format with an array of found pages and total number of results.`,
});

const knowledgeBaseSearchPrompt = ai.definePrompt({
  name: 'knowledgeBaseSearchPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {
    schema: z.object({ query: z.string() }),
  },
  output: {
    schema: KnowledgeBaseSearchSchema,
  },
  prompt: `Search the knowledge base for:

{{query}}

Return the results in JSON format with an array of found documents and total number of results.`,
});

// Определение инструментов
const extractFullTextTool = ai.defineTool(
  {
    name: 'extractFullText',
    description: 'Extracts the complete text from the given content',
    inputSchema: z.object({
      text: z.string().describe('The content to extract text from'),
    }),
    outputSchema: z.object({
      text: z.string(),
    }),
  },
  async ({ text }) => {
    const { text: result } = await extractFullTextPrompt({ text });
    return { text: result };
  }
);

const extractKeyTopicsTool = ai.defineTool(
  {
    name: 'extractKeyTopics',
    description: 'Extracts 3-7 key topics from the given text',
    inputSchema: z.object({
      text: z.string().describe('The text to extract topics from'),
    }),
    outputSchema: KeyTopicsSchema,
  },
  async ({ text }) => {
    const { output } = await extractKeyTopicsPrompt({ text });
    if (!output) throw new Error('Failed to extract key topics');
    return output;
  }
);

const determineDomainTool = ai.defineTool(
  {
    name: 'determineDomain',
    description: 'Determines the main domain and subdomains of the given text',
    inputSchema: z.object({
      text: z.string().describe('The text to analyze for domain determination'),
    }),
    outputSchema: DomainSchema,
  },
  async ({ text }) => {
    const { output } = await determineDomainPrompt({ text });
    if (!output) throw new Error('Failed to determine domain');
    return output;
  }
);

const createAnnotationTool = ai.defineTool(
  {
    name: 'createAnnotation',
    description: 'Creates a brief annotation (2-3 sentences) for the given text',
    inputSchema: z.object({
      text: z.string().describe('The text to create an annotation for'),
    }),
    outputSchema: z.object({
      annotation: z.string(),
    }),
  },
  async ({ text }) => {
    const { text: result } = await createAnnotationPrompt({ text });
    return { annotation: result };
  }
);

const createTitleTool = ai.defineTool(
  {
    name: 'createTitle',
    description: 'Creates an informative title for the given text',
    inputSchema: z.object({
      text: z.string().describe('The text to create a title for'),
    }),
    outputSchema: z.object({
      title: z.string(),
    }),
  },
  async ({ text }) => {
    const { text: result } = await createTitlePrompt({ text });
    return { title: result };
  }
);

const formatArticleTool = ai.defineTool(
  {
    name: 'formatArticle',
    description: 'Formats the given text into a structured article',
    inputSchema: z.object({
      text: z.string().describe('The text to format into an article'),
    }),
    outputSchema: ArticleSchema,
  },
  async ({ text }) => {
    const { output } = await formatArticlePrompt({ text });
    if (!output) throw new Error('Failed to format article');
    return output;
  }
);

const webSearchTool = ai.defineTool(
  {
    name: 'webSearch',
    description: 'Searches the web for information about the given query',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
    }),
    outputSchema: WebSearchSchema,
  },
  async ({ query }) => {
    const { output } = await webSearchPrompt({ query });
    if (!output) throw new Error('Failed to perform web search');
    return output;
  }
);

const knowledgeBaseSearchTool = ai.defineTool(
  {
    name: 'knowledgeBaseSearch',
    description: 'Searches the knowledge base for information about the given query',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
    }),
    outputSchema: KnowledgeBaseSearchSchema,
  },
  async ({ query }) => {
    const { output } = await knowledgeBaseSearchPrompt({ query });
    if (!output) throw new Error('Failed to search knowledge base');
    return output;
  }
);

// Определение типов для графа
type GraphState = {
  text: string;
  taskType?: TaskType;
  result?: any;
};

type GraphInput = {
  text: string;
  taskType?: TaskType;
};

// Определение графа
const textProcessingGraph = defineGraph(
  {
    name: 'TextProcessingGraph',
    inputSchema: z.object({
      text: z.string(),
      taskType: TaskType.optional(),
    }),
    stateSchema: z.object({
      text: z.string(),
      taskType: TaskType.optional(),
      result: z.any().optional(),
    }),
    outputSchema: z.any(),
  },
  async (input: GraphInput) => {
    return {
      state: {
        text: input.text,
        taskType: input.taskType,
      },
      nextNode: 'determineTaskType',
    };
  }
);

// Добавляем узлы графа
textProcessingGraph.addNode(
  defineFlow(
    {
      name: 'determineTaskType',
    },
    async (state: GraphState) => {
      if (!state.taskType) {
        console.log('Determining task type automatically...');
        const { text: result } = await ai.generate({
          prompt: `Analyze the following text and determine the most appropriate task type:
            ${state.text}
            
            Possible task types:
            - extract_full_text
            - extract_key_topics
            - determine_domain
            - create_annotation
            - create_title
            - format_article
            - web_search
            - knowledge_base_search
            - help
            
            Return only the task type as a string.`,
        });
        state.taskType = result.trim() as TaskType;
        console.log('Determined task type:', state.taskType);
      }

      return {
        state,
        nextNode: 'processText',
      };
    }
  )
);

textProcessingGraph.addNode(
  defineFlow(
    {
      name: 'processText',
    },
    async (state: GraphState) => {
      console.log('Processing text with task type:', state.taskType);
      let result;

      switch (state.taskType) {
        case 'help':
          result = {
            description: 'Text Processing Graph - это инструмент для обработки текста с различными возможностями.',
            availableTasks: [
              {
                name: 'extract_full_text',
                description: 'Извлекает полный текст из входных данных'
              },
              {
                name: 'extract_key_topics',
                description: 'Извлекает 3-7 ключевых тем из текста'
              },
              {
                name: 'determine_domain',
                description: 'Определяет основной домен и поддомены текста'
              },
              {
                name: 'create_annotation',
                description: 'Создает краткую аннотацию (2-3 предложения) для текста'
              },
              {
                name: 'create_title',
                description: 'Создает информативный заголовок для текста'
              },
              {
                name: 'format_article',
                description: 'Форматирует текст в структурированную статью'
              },
              {
                name: 'web_search',
                description: 'Выполняет поиск в интернете по запросу'
              },
              {
                name: 'knowledge_base_search',
                description: 'Выполняет поиск в базе знаний'
              },
              {
                name: 'help',
                description: 'Показывает это сообщение с описанием возможностей'
              }
            ],
            usage: `Использование:
1. Вызовите инструмент graph с текстом и опциональным типом задачи:
   await graphTool({ text: "Ваш текст", taskType: "extract_key_topics" })

2. Если тип задачи не указан, граф автоматически определит наиболее подходящий тип

3. Результат будет возвращен в формате, соответствующем выбранному типу задачи`
          };
          break;
        case 'extract_full_text':
          result = await extractFullTextTool({ text: state.text });
          break;
        case 'extract_key_topics':
          result = await extractKeyTopicsTool({ text: state.text });
          break;
        case 'determine_domain':
          result = await determineDomainTool({ text: state.text });
          break;
        case 'create_annotation':
          result = await createAnnotationTool({ text: state.text });
          break;
        case 'create_title':
          result = await createTitleTool({ text: state.text });
          break;
        case 'format_article':
          result = await formatArticleTool({ text: state.text });
          break;
        case 'web_search':
          result = await webSearchTool({ query: state.text });
          break;
        case 'knowledge_base_search':
          result = await knowledgeBaseSearchTool({ query: state.text });
          break;
        default:
          throw new Error(`Unknown task type: ${state.taskType}`);
      }

      return result;
    }
  )
);

// Определение инструмента для вызова графа
const graphTool = ai.defineTool(
  {
    name: 'graph',
    description: 'Executes the Text Processing Graph with the given input',
    inputSchema: z.object({
      text: z.string().describe('The text to process'),
      taskType: TaskType.optional().describe('Optional task type. If not provided, will be determined automatically'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      console.log('Starting graph execution...');
      console.log('Input:', input);
      
      const result = await runFlow(textProcessingGraph.executor, input);
      console.log('Graph execution result:', result);
      return result;
    } catch (error) {
      console.error('Error executing graph:', error);
      throw error;
    }
  }
);

// Обновляем основной поток для использования графа
export const textProcessingFlow = ai.defineFlow(
  {
    name: 'textProcessingFlow',
    inputSchema: z.object({
      text: z.string(),
      taskType: TaskType.optional(),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      console.log('Starting text processing flow...');
      console.log('Input:', input);
      
      const result = await runFlow(textProcessingGraph.executor, input);
      console.log('Processing result:', result);
      return result;
    } catch (error) {
      console.error('Error in text processing flow:', error);
      throw error;
    }
  }
);

// Обновляем основную функцию для поддержки выполнения графа
async function processText(input: { text: string; taskType?: TaskType; useGraph?: boolean }) {
  try {
    console.log('Starting text processing...');
    console.log('Input:', input);
    
    const result = await textProcessingFlow(input);
    
    if (!result) {
      throw new Error('No result returned from text processing flow');
    }
    
    console.log('Processing result:', result);
    return result;
  } catch (error) {
    console.error('Error processing text:', error);
    throw error;
  }
}

// Экспорт компонентов
export { ai, TaskType, processText };

// Тестовый запуск
async function main() {
  const result = await processText({
    text: 'Sample text for testing',
  });
  console.log('Test result:', result);
}

// Проверка, является ли файл основным модулем
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  main();
}
