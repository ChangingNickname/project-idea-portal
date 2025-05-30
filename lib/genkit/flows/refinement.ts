import { z } from 'genkit';
import { ai } from '../ai';
import { googleAI } from '@genkit-ai/googleai';

let fieldStore: Record<string, string> = {};

const FIELD_NAMES = [
  'title',
  'subject area',
  'solved problem',
  'target',
  'tasks',
  'resources',
  'hours',
  'requirements',
  'similar ideas',
  'economic justification',
  'tags',
  'full description',
  'short description'
];

const systemPrompt = `
You are an expert academic advisor helping a student turn vague ideas into structured university-level project proposals.

Your job is to guide them conversationally, asking intelligent follow-up questions — one field at a time — until all 13 fields are gathered.

**For every response**, you must include a proposed answer for one missing field using this format:

[[field name: value]]

This lets my system extract the information automatically.

📌 Important:
- Do NOT skip the [[...]] format under any circumstance.
- Do NOT include multiple fields in one reply.
- Your tone should be thoughtful, professional, and helpful — like a university research advisor.
- Ask one clear, natural question about the next most important missing field.
- Offer suggestions or elaborations based on the user’s previous input to help them think clearly.

---

Here are the 13 required fields:
${FIELD_NAMES.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Avoid summarizing. Just keep asking and guiding.

If the user already provided a field in previous messages, do not ask about it again.
`;


export const refinementFlow = ai.defineFlow(
  {
    name: 'refinementFlow',
    inputSchema: z.object({
      message: z.string(),
      history: z.array(z.string()).optional()
    }),
    outputSchema: z.object({
      answer: z.string(),
      fields: z.record(z.string(), z.string()).optional()
    })
  },
  async ({ message, history = [] }) => {
    const joinedHistory = history.join('\n');
    const fullPrompt = `${systemPrompt}\n\nPrevious conversation:\n${joinedHistory}\n\nUser: ${message}`;

    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: fullPrompt
    });

    // Extract [[field: value]] pairs
    // Extract fields from Gemini response
    const fieldRegex = /\[\[(.+?):\s*(.*?)\]\]/g;
    const extractedFields: Record<string, string> = {};
    let match;
    while ((match = fieldRegex.exec(text)) !== null) {
    const [_, field, value] = match;
    extractedFields[field.trim().toLowerCase()] = value.trim();
    }

    // Merge into central store
    fieldStore = {
    ...fieldStore,
    ...extractedFields
    };

    console.log('Updated field store:', fieldStore);


    return {
      answer: text,
      fields: extractedFields
    };
  }
);
