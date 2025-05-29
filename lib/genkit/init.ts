import { ai } from './ai';
import * as flows from './flows';
import { testPrompt } from './prompts/test';

export { ai, flows, testPrompt };

export async function main() {
  const result = await testPrompt({});
  console.log(result.text);
}

main();