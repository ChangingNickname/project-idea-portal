import { z } from 'genkit';
import { ai } from '../ai';
import { googleAI } from '@genkit-ai/googleai';

export const CompletionSchema = z.object({
  text: z.string(),
  maxTokens: z.number().optional()
});

export const completionFlow = ai.defineFlow(
  {
    name: 'completionFlow',
    inputSchema: CompletionSchema,
    outputSchema: z.object({ text: z.string() })
  },
  async ({ text, maxTokens }) => {
    const { text: result } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `Complete the following text in a coherent and meaningful way:\n\n${text}`,
    });
    return { text: result };
  }
); 