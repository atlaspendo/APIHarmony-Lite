'use server';
/**
 * @fileOverview API Documentation Generation AI agent.
 *
 * - generateApiDocumentation - A function that handles the API documentation generation process.
 * - GenerateApiDocumentationInput - The input type for the generateApiDocumentation function (imported).
 * - GenerateApiDocumentationOutput - The return type for the generateApiDocumentation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { GenerateApiDocumentationInputSchema, type GenerateApiDocumentationInput } from '@/ai/schemas/api-documentation-schemas';

// GenerateApiDocumentationInputSchema and GenerateApiDocumentationInput type are now imported.

const GenerateApiDocumentationOutputSchema = z.object({
  generatedSpec: z
    .string()
    .describe('The generated OpenAPI 3.0.x specification in YAML format.'),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe('A confidence score (0.0 to 1.0) indicating the AI\'s confidence in the quality and completeness of the generated spec based on the input.'),
  suggestionsForImprovement: z.array(z.string()).optional().describe("Suggestions to further improve the API description or the generated spec."),
});
export type GenerateApiDocumentationOutput = z.infer<typeof GenerateApiDocumentationOutputSchema>;

export async function generateApiDocumentation(input: GenerateApiDocumentationInput): Promise<GenerateApiDocumentationOutput> {
  return generateApiDocumentationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateApiDocumentationPrompt',
  input: {schema: GenerateApiDocumentationInputSchema},
  output: {schema: GenerateApiDocumentationOutputSchema},
  prompt: `You are an expert API designer tasked with generating OpenAPI 3.0.x specifications.
Based on the following description (and optional partial specification), generate a complete OpenAPI 3.0.x specification in YAML format.
Identify potential endpoints, request/response schemas (including data types like string, integer, boolean, object, array), and appropriate HTTP methods (GET, POST, PUT, DELETE, PATCH).
Ensure the generated specification is well-structured and follows OpenAPI best practices.
Include basic request and response examples where appropriate.
Provide a confidence score from 0.0 to 1.0 on the quality and completeness of the generated spec based on the input.
Also, provide an array of suggestions for how the user could improve their input description to get an even better specification, or areas where the generated spec might need further refinement.

Description:
{{{description}}}

{{#if partialSpec}}
Partial Specification (to be completed or enhanced):
{{{partialSpec}}}
{{/if}}

Focus on creating a functional and comprehensive specification. If the description is vague, make reasonable assumptions but note them in the suggestions.
The output YAML should be directly usable.
`,
});

const generateApiDocumentationFlow = ai.defineFlow(
  {
    name: 'generateApiDocumentationFlow',
    inputSchema: GenerateApiDocumentationInputSchema,
    outputSchema: GenerateApiDocumentationOutputSchema,
  },
  async (input: GenerateApiDocumentationInput) => {
    const {output} = await prompt(input);
    return output!;
  }
);
