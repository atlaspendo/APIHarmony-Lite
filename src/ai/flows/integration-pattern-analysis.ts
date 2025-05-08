'use server';
/**
 * @fileOverview Integration Pattern Analysis AI agent.
 *
 * - integrationPatternAnalysis - A function that handles the integration pattern analysis process.
 * - IntegrationPatternAnalysisInput - The input type for the integrationPatternAnalysis function.
 * - IntegrationPatternAnalysisOutput - The return type for the integrationPatternAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const IntegrationPatternAnalysisInputSchema = z.object({
  openApiSpec: z
    .string()
    .describe('The OpenAPI specification to analyze for integration design patterns and anti-patterns.'),
});
export type IntegrationPatternAnalysisInput = z.infer<typeof IntegrationPatternAnalysisInputSchema>;

export const IntegrationPatternAnalysisOutputSchema = z.object({
  identifiedPatterns: z
    .array(z.object({ 
        name: z.string().describe("Name of the identified integration pattern."), 
        description: z.string().describe("Description of the pattern and its use in the API."), 
        examples: z.array(z.string()).optional().describe("Specific examples from the spec (e.g., paths or schema names).") 
    }))
    .describe('A list of common and advanced integration design patterns identified in the specification.'),
  antiPatterns: z
    .array(z.object({ 
        name: z.string().describe("Name of the identified anti-pattern."), 
        description: z.string().describe("Description of the anti-pattern and its manifestation."), 
        impact: z.string().optional().describe("Potential impact of this anti-pattern."),
        examples: z.array(z.string()).optional().describe("Specific examples from the spec.") 
    }))
    .describe('A list of potential integration design anti-patterns or areas of concern.'),
  recommendations: z
    .array(z.object({ 
        recommendation: z.string().describe("The suggested improvement."), 
        rationale: z.string().describe("Reasoning behind the recommendation."), 
        priority: z.enum(["High", "Medium", "Low"]).optional().describe("Priority of the recommendation.")
    }))
    .describe('A list of suggestions for improving the API integration design based on the analysis.'),
  summary: z.string().describe("A brief summary of the overall integration landscape quality based on the analysis.")
});
export type IntegrationPatternAnalysisOutput = z.infer<typeof IntegrationPatternAnalysisOutputSchema>;

export async function integrationPatternAnalysis(input: IntegrationPatternAnalysisInput): Promise<IntegrationPatternAnalysisOutput> {
  return integrationPatternAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'integrationPatternAnalysisPrompt',
  input: {schema: IntegrationPatternAnalysisInputSchema},
  output: {schema: IntegrationPatternAnalysisOutputSchema},
  prompt: `You are an expert API and integration architect. Analyze the provided OpenAPI specification for common and advanced integration design patterns (e.g., CQRS, Event Sourcing stubs, API Gateway patterns, Saga, Strangler Fig, etc.), potential anti-patterns (e.g., chatty APIs, monolithic remnants, tight coupling), and areas for improvement. Provide specific examples from the spec where possible.

Consider: RESTful adherence, resource modeling, HTTP methods, status codes, payload design, auth/authz, versioning, pagination, error handling, HATEOAS, idempotency, microservice communication styles (sync/async hints), event-driven architecture hints, data consistency approaches.

OpenAPI Specification:
{{{openApiSpec}}}

Populate identifiedPatterns, antiPatterns, and recommendations with detailed, actionable insights. For recommendations, include rationale and optionally a priority. Provide an overall summary.
If no significant items are found for a category, you can return an empty array for that field or a brief statement in the summary.
`,
});

const integrationPatternAnalysisFlow = ai.defineFlow(
  {
    name: 'integrationPatternAnalysisFlow',
    inputSchema: IntegrationPatternAnalysisInputSchema,
    outputSchema: IntegrationPatternAnalysisOutputSchema,
  },
  async input => {
    if (input.openApiSpec.includes("error_trigger_for_integration_analysis")) {
        throw new Error("Simulated error during integration pattern analysis.");
    }
    
    // For testing empty results:
    if (input.openApiSpec.includes("empty_result_for_integration_analysis")) {
      return {
        identifiedPatterns: [],
        antiPatterns: [],
        recommendations: [{
            recommendation: "Consider adding more detailed descriptions to operations and schemas for clarity.",
            rationale: "Empty specifications lack context for thorough analysis.",
            priority: "Medium"
        }],
        summary: "The provided OpenAPI specification is too minimal for a detailed integration pattern analysis. Basic best practices like detailed descriptions are suggested.",
      };
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);
