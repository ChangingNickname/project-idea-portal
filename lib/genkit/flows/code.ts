import { z } from 'genkit';
import { ai } from '../ai';
import { googleAI } from '@genkit-ai/googleai';

export const codeFlow = ai.defineFlow(
  {
    name: 'codeFlow',
    inputSchema: z.object({
      prompt: z.string(),
      language: z.string().optional()
    }),
    outputSchema: z.object({
      answer: z.string()
    })
  },
  async ({ prompt, language = 'typescript' }) => {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `Generate ${language} code for the following request:\n\n${prompt}`,
    });
    return { answer: text };
  }
); 