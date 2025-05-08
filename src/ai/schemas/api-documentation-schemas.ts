import { z } from 'zod';

export const GenerateApiDocumentationInputSchema = z.object({
  description: z
    .string()
    .min(50, { message: "Description must be at least 50 characters long."})
    .describe('A natural language description of the API, its purpose, and its intended endpoints/functionality.'),
  partialSpec: z
    .string()
    .optional()
    .describe('An optional partial OpenAPI specification (YAML or JSON string) to be completed or enhanced.'),
});
export type GenerateApiDocumentationInput = z.infer<typeof GenerateApiDocumentationInputSchema>;
