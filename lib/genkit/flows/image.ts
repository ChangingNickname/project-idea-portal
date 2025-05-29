import { z } from 'genkit';
import { ai } from '../ai';
import { googleAI } from '@genkit-ai/googleai';

export const imageFlow = ai.defineFlow(
  {
    name: 'imageFlow',
    inputSchema: z.object({
      prompt: z.string(),
      size: z.enum(['256x256', '512x512', '1024x1024']).optional()
    }),
    outputSchema: z.object({
      answer: z.string()
    })
  },
  async ({ prompt, size = '512x512' }) => {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `Generate a detailed image description for: ${prompt}`,
    });
    return { answer: text };
  }
); 