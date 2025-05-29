import { z } from 'genkit';
import { ai } from '../ai';
import { googleAI } from '@genkit-ai/googleai';

export const completionFlow = ai.defineFlow(
  {
    name: 'completionFlow',
    inputSchema: z.object({
      text: z.string(),
      maxTokens: z.number().optional()
    }),
    outputSchema: z.object({
      answer: z.string()
    })
  },
  async ({ text, maxTokens }) => {
    const { text: result } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `Complete the following text in a coherent and meaningful way:\n\n${text}`,
    });
    return { answer: result };
  }
); 