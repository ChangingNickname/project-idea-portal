import { ai } from '../ai';
import { z } from 'genkit';

export const testPrompt = ai.definePrompt({
  name: 'test',
  model: 'googleai/gemini-2.0-flash',
  config: {
    temperature: 0.4,
    topK: 32,
    topP: 0.95
  },
  input: {
    schema: z.object({})
  },
  output: {
    schema: z.object({
      response: z.string()
    })
  },
  prompt: 'say test nothing more'
}); 