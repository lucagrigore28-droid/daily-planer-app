'use server';
/**
 * @fileOverview An AI flow for breaking down a homework task into actionable steps.
 *
 * - breakdownTask - A function that handles the task breakdown process.
 * - BreakdownTaskInput - The input type for the breakdownTask function.
 * - BreakdownTaskOutput - The return type for the breakdownTask function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BreakdownTaskInputSchema = z.object({
  subjectName: z.string().describe('The name of the school subject.'),
  taskDescription: z
    .string()
    .describe('The description of the homework task.'),
});
export type BreakdownTaskInput = z.infer<typeof BreakdownTaskInputSchema>;

const BreakdownTaskOutputSchema = z.object({
  steps: z
    .array(z.string())
    .describe('An array of small, actionable steps to complete the task.'),
});
export type BreakdownTaskOutput = z.infer<typeof BreakdownTaskOutputSchema>;

export async function breakdownTask(input: BreakdownTaskInput): Promise<BreakdownTaskOutput> {
  return breakdownTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'breakdownTaskPrompt',
  input: {schema: BreakdownTaskInputSchema},
  output: {schema: BreakdownTaskOutputSchema},
  prompt: `You are a helpful and concise study assistant. Your goal is to help a student break down a homework task into small, manageable steps. The user is from Romania, so please provide the steps in Romanian.

The task is for the subject: {{{subjectName}}}

The task description is: "{{{taskDescription}}}"

Based on this, generate a short list of actionable steps. If the description is empty or vague, provide general steps for studying that subject.
`,
});

const breakdownTaskFlow = ai.defineFlow(
  {
    name: 'breakdownTaskFlow',
    inputSchema: BreakdownTaskInputSchema,
    outputSchema: BreakdownTaskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
