import { googleAI } from '@genkit-ai/googleai';
import { genkitEval, GenkitMetric } from '@genkit-ai/evaluator';
import { genkit } from 'genkit';

export const ai = genkit({
  plugins: [
    googleAI(),
    genkitEval({
      judge: googleAI.model('gemini-2.0-flash'),
      metrics: [GenkitMetric.MALICIOUSNESS],
    })
  ],
  model: googleAI.model('gemini-2.0-flash')
});