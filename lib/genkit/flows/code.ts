import { z } from 'genkit';
import { ai } from '../ai';
import { googleAI } from '@genkit-ai/googleai';

export const CodeSchema = z.object({
  prompt: z.string(),
  language: z.string().optional()
});

export const codeFlow = ai.defineFlow(
  {
    name: 'codeFlow',
    inputSchema: CodeSchema,
    outputSchema: z.object({ code: z.string() })
  },
  async ({ prompt, language }) => {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `You are a programming expert. Write clean, efficient, and well-documented code in ${language || 'the most appropriate language'}.\n\nTask: ${prompt}`,
    });
    return { code: text };
  }
); 