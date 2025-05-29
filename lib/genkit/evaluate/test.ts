import { z, Document } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { genkitEval, GenkitMetric } from '@genkit-ai/evaluator';
import { ai } from '../ai';
import dataset from './dataset.json';

// Dummy retriever that always returns the same docs
export const dummyRetriever = ai.defineRetriever(
  {
    name: 'dummyRetriever',
  },
  async () => {
    const facts = [
      "Dog is man's best friend",
      'Dogs have evolved and were domesticated from wolves',
      'Dogs are known for their loyalty and companionship'
    ];
    return { documents: facts.map((t) => Document.fromText(t)) };
  },
);

// A simple question-answering flow
export const qaFlow = ai.defineFlow(
  {
    name: 'qaFlow',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.object({ answer: z.string() }),
  },
  async ({ query }) => {
    const factDocs = await ai.retrieve({
      retriever: dummyRetriever,
      query,
    });

    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `Answer this question with the given context: ${query}`,
      docs: factDocs,
    });
    return { answer: text };
  },
);

// Evaluation function
export async function evaluate() {
  console.log('Starting evaluation...');
  
  for (const example of dataset) {
    console.log('\nTesting query:', example.input.query);
    const result = await qaFlow.run(example.input);
    console.log('Generated answer:', result.answer);
    console.log('Reference answer:', example.reference);
  }
  
  console.log('\nEvaluation completed!');
}

// Run evaluation if this file is executed directly
if (require.main === module) {
  evaluate().catch(console.error);
} 