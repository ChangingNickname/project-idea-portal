import { z } from 'genkit';
import { ai } from '../ai';
import { googleAI } from '@genkit-ai/googleai';

export const ChatSchema = z.object({
  message: z.string(),
  history: z.array(z.string()).optional()
});

export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatSchema,
    outputSchema: z.object({ response: z.string() })
  },
  async ({ message, history = [] }) => {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `You are a helpful AI assistant. Provide clear and concise responses.\n\n${history.join('\n')}\n\nUser: ${message}`,
    });
    return { response: text };
  }
); 