import { z } from 'genkit';
import { ai } from '../ai';
import { googleAI } from '@genkit-ai/googleai';

export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      message: z.string(),
      history: z.array(z.string()).optional()
    }),
    outputSchema: z.object({
      answer: z.string()
    })
  },
  async ({ message, history = [] }) => {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `You are a helpful AI assistant. Provide clear and concise responses.\n\n${history.join('\n')}\n\nUser: ${message}`,
    });
    return { answer: text };
  }
); 