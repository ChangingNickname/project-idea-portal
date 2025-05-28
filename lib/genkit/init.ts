import { googleAI } from "@genkit-ai/googleai";
import { genkit } from 'genkit'


export const ai = genkit({
    plugins: [googleAI()],
    model: googleAI.model('gemini-2.0-flash'),
})


async function main() {
    const result = await ai.generate('Hello, world!')
    console.log(result)
}
