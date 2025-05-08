
'use server';
/**
 * @fileOverview API Pattern Analysis AI agent.
 *
 * - apiPatternAnalysis - A function that handles the API pattern analysis process.
 * - ApiPatternAnalysisInput - The input type for the apiPatternAnalysis function.
 * - ApiPatternAnalysisOutput - The return type for the apiPatternAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ApiPatternAnalysisInputSchema = z.object({
  openApiSpec: z
    .string()
    .describe('The OpenAPI specification to analyze for design patterns and anti-patterns.'),
});
export type ApiPatternAnalysisInput = z.infer<typeof ApiPatternAnalysisInputSchema>;

const ApiPatternAnalysisOutputSchema = z.object({
  patterns: z
    .array(z.string())
    .describe('A list of common API design patterns identified in the specification.'),
  antiPatterns: z
    .array(z.string())
    .describe('A list of potential API design anti-patterns or areas of concern.'),
  suggestions: z
    .array(z.string())
    .describe('A list of suggestions for improving the API design based on the analysis.'),
});
export type ApiPatternAnalysisOutput = z.infer<typeof ApiPatternAnalysisOutputSchema>;

export async function apiPatternAnalysis(input: ApiPatternAnalysisInput): Promise<ApiPatternAnalysisOutput> {
  return apiPatternAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'apiPatternAnalysisPrompt',
  input: {schema: ApiPatternAnalysisInputSchema},
  output: {schema: ApiPatternAnalysisOutputSchema},
  prompt: `You are an expert API design reviewer.
Analyze the provided OpenAPI specification for common API design patterns, potential anti-patterns, and areas for improvement.

Consider aspects such as:
- RESTful principles adherence
- Resource naming conventions
- URI structure
- HTTP method usage
- Status code consistency and correctness
- Request/Response payload design (complexity, consistency)
- Authentication and authorization patterns (though detailed security is for vulnerability scan)
- Versioning strategies (if evident)
- Pagination, filtering, sorting capabilities
- Error handling patterns
- HATEOAS principles (if applicable)
- Idempotency

OpenAPI Specification:
{{{openApiSpec}}}

Based on your analysis, populate the patterns, antiPatterns, and suggestions fields.
Be concise and focus on actionable insights.
If no significant patterns or anti-patterns are found in a category, you can return an empty array for that field or a brief statement like "No significant X identified."
`,
});

const apiPatternAnalysisFlow = ai.defineFlow(
  {
    name: 'apiPatternAnalysisFlow',
    inputSchema: ApiPatternAnalysisInputSchema,
    outputSchema: ApiPatternAnalysisOutputSchema,
  },
  async input => {
    // Placeholder logic - in a real scenario, this would call the LLM
    // For now, returning mock data for UI development
    // const {output} = await prompt(input);
    // return output!;
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (input.openApiSpec.includes("error_trigger_for_pattern_analysis")) {
        throw new Error("Simulated error during pattern analysis.");
    }
    
    if (input.openApiSpec.includes("empty_result_for_pattern_analysis")) {
      return {
        patterns: ["No significant patterns identified in this simple spec."],
        antiPatterns: [],
        suggestions: ["Consider adding more detailed descriptions to operations and schemas."],
      };
    }

    return {
      patterns: [
        "Standard RESTful resource naming conventions observed (e.g., /users, /products/{id}).",
        "Consistent use of GET for retrieval, POST for creation, PUT for update, DELETE for removal.",
        "Clear separation of resources in URI paths.",
      ],
      antiPatterns: [
        "Some operations lack explicit pagination parameters (e.g., limit, offset), which could lead to performance issues with large datasets.",
        "Error responses are not consistently defined across all operations; consider a standardized error schema.",
        "Lack of explicit rate limiting information in the API definition.",
      ],
      suggestions: [
        "Implement standardized pagination (e.g., limit/offset or cursor-based) for all collection endpoints.",
        "Define a global error response schema and reference it in all operations for consistency.",
        "Consider adding ' OpenAPI extensions (x-ratelimit-limit, x-ratelimit-remaining) or link to rate limiting documentation.",
        "Ensure all schemas and properties have clear descriptions.",
      ],
    };
  }
);
