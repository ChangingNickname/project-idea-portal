import { ai } from './ai';
import * as flows from './flows';
import { testPrompt } from './prompts/test';
import { qaFlow, dummyRetriever } from './evaluate/test';


export { ai, flows, testPrompt, qaFlow, dummyRetriever };

export async function main() {
  const result = await testPrompt({});
  console.log(result.text);
}

main();