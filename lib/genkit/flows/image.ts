import { z } from 'genkit';
import { ai } from '../ai';
import { googleAI } from '@genkit-ai/googleai';

export const ImageSchema = z.object({
  prompt: z.string(),
  size: z.string().optional()
});

export const imageFlow = ai.defineFlow(
  {
    name: 'imageFlow',
    inputSchema: ImageSchema,
    outputSchema: z.object({ description: z.string() })
  },
  async ({ prompt, size }) => {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `Generate a detailed description for an image based on the following prompt. ${size ? `The image should be ${size}.` : ''}\n\nPrompt: ${prompt}`,
    });
    return { description: text };
  }
); 