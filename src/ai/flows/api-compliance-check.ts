'use server';
/**
 * @fileOverview API Compliance Check AI agent.
 *
 * - checkApiCompliance - A function that handles the API compliance check process.
 * - CheckApiComplianceInput - The input type for the checkApiCompliance function.
 * - CheckApiComplianceOutput - The return type for the checkApiCompliance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const CheckApiComplianceInputSchema = z.object({
  openApiSpec: z
    .string()
    .describe('The OpenAPI specification (YAML or JSON string) to analyze for compliance.'),
  complianceProfile: z
    .enum(["GENERAL", "PII_ öffentlich", "FINANCIAL_BASIC"])
    .default("GENERAL")
    .describe('The compliance profile to check against. "GENERAL" checks for common best practices. "PII_ öffentlich" focuses on publicly identifiable information. "FINANCIAL_BASIC" for basic financial data rules.'),
});
export type CheckApiComplianceInput = z.infer<typeof CheckApiComplianceInputSchema>;

export const CheckApiComplianceOutputSchema = z.object({
  checksPerformed: z
    .array(z.object({
      ruleId: z.string().describe("A unique identifier for the compliance rule checked."),
      description: z.string().describe("Description of the compliance rule."),
      status: z.enum(["PASS", "FAIL", "WARN", "NOT_APPLICABLE"]).describe("Compliance status for this rule."),
      findings: z.string().optional().describe("Detailed findings or evidence if status is FAIL or WARN, including paths or schema names if applicable.")
    }))
    .describe("A list of all compliance checks performed and their results."),
  overallComplianceScore: z
    .number()
    .min(0)
    .max(100)
    .describe("An overall score from 0 to 100 representing the API's compliance level against the selected profile. Higher is better."),
  summary: z
    .string()
    .describe("A concise summary of the overall compliance status, highlighting key areas of concern and strengths."),
  dataFlowInsights: z
    .array(z.string())
    .optional()
    .describe("Observations about data flow based on the spec, relevant to compliance (e.g., 'User PII seems to be exposed in GET /users response without explicit masking notes.')."),
  recommendations: z.array(z.string()).optional().describe("Actionable recommendations to improve compliance based on the findings.")
});
export type CheckApiComplianceOutput = z.infer<typeof CheckApiComplianceOutputSchema>;

export async function checkApiCompliance(input: CheckApiComplianceInput): Promise<CheckApiComplianceOutput> {
  return checkApiComplianceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkApiCompliancePrompt',
  input: {schema: CheckApiComplianceInputSchema},
  output: {schema: CheckApiComplianceOutputSchema},
  prompt: `You are an expert API security and compliance auditor.
Analyze the provided OpenAPI specification against the selected compliance profile.

Compliance Profile: {{{complianceProfile}}}

OpenAPI Specification:
\`\`\`
{{{openApiSpec}}}
\`\`\`

**Compliance Rules:**

**GENERAL Profile (Base for all other profiles):**
*   **GEN-001: API Authentication**: All API operations must be protected by at least one security scheme defined in \`securitySchemes\` and applied via a global \`security\` requirement or operation-specific \`security\`.
*   **GEN-002: HTTPS Enforcement**: API should enforce HTTPS. (Check for \`schemes: [https]\` in Swagger 2.0 or server URLs with \`https://\` in OpenAPI 3.0). If not explicit, assume WARN unless HTTP is explicitly stated (FAIL).
*   **GEN-003: Input Validation**: Operations should define request parameters and request bodies with clear type definitions and constraints (e.g., \`pattern\`, \`minLength\`, \`maxLength\`, \`minimum\`, \`maximum\`, \`enum\`). Check for presence of these in a reasonable portion of parameters/schemas.
*   **GEN-004: Sensitive Data Exposure in Logs/Errors**: Error responses (4xx, 5xx) should not reveal excessive internal details or stack traces. (Infer from example error responses or lack of standardized error schema).
*   **GEN-005: Authorization Granularity**: (Difficult to check from spec alone, but WARN if no clear roles/scopes are mentioned in descriptions or security schemes like OAuth2 scopes).
*   **GEN-006: Clear Versioning**: API should have a versioning strategy (e.g., in path, header, query param). (Check info.version, server URLs, or path patterns).
*   **GEN-007: Rate Limiting Indication**: (WARN if no mention of rate limiting in API description, \`x-ratelimit-\` headers in responses, or link to rate limiting policy).
*   **GEN-008: Secure Defaults for Security Schemes**: If API keys are used, they should be recommended to be passed in headers, not query parameters. OAuth2 flows should prefer Authorization Code or Client Credentials over Implicit.

**PII_ öffentlich Profile (Includes all GENERAL rules plus the following):**
*   **PII-001: Identification of PII**: Scan schemas for common PII keywords (e.g., 'firstName', 'lastName', 'email', 'address', 'phoneNumber', 'ssn', 'nationalId', 'dateOfBirth', 'gender', 'race', 'ipAddress', 'geolocation'). List identified PII fields.
*   **PII-002: PII in GET Request Parameters**: PII (as identified in PII-001) should not be passed as GET request query parameters.
*   **PII-003: PII Handling in Responses**: Note if PII fields are present in response schemas. Check for any explicit mentions of masking, encryption, or redaction in descriptions.
*   **PII-004: Data Minimization Principle**: (WARN if large, undifferentiated objects containing PII are returned, rather than specific fields needed for an operation).

**FINANCIAL_BASIC Profile (Includes all GENERAL rules plus the following):**
*   **FIN-001: Identification of Financial Data**: Scan schemas for common financial data keywords (e.g., 'accountNumber', 'cardNumber', 'cvv', 'expiryDate', 'balance', 'transactionAmount', 'currency', 'paymentMethod'). List identified financial fields.
*   **FIN-002: Financial Data in GET Request Parameters**: Sensitive financial data (especially card numbers, CVV) should not be passed as GET request query parameters.
*   **FIN-003: Strong Authentication for Financial Ops**: Operations tagged with 'financial', 'payment', 'transaction' or involving financial data schemas must use strong authentication (e.g., OAuth2, multi-factor hints in descriptions).
*   **FIN-004: Idempotency for Mutations**: POST, PUT, PATCH operations involving financial data should mention idempotency (e.g., via Idempotency-Key header in descriptions or parameters).
*   **FIN-005: Transaction Logging/Auditing**: (WARN if no mention of transaction logging or auditing capabilities in API descriptions for financial operations).

**Instructions for Analysis:**
1.  For each rule applicable to the selected \`{{{complianceProfile}}}\` (and its base profiles):
    *   State the \`ruleId\` and \`description\`.
    *   Determine its \`status\`:
        *   \`PASS\`: The rule is met.
        *   \`FAIL\`: The rule is violated.
        *   \`WARN\`: Potential issue or insufficient information to confirm PASS, but a concern exists.
        *   \`NOT_APPLICABLE\`: The rule does not apply to this API (e.g., no financial data for a FIN rule).
    *   Provide \`findings\` for FAIL or WARN statuses, citing specific paths, schemas, or parts of the spec.
2.  Calculate an \`overallComplianceScore\` from 0 to 100. (100 for all PASS, 0 for all FAIL. Deduct more for FAILs than WARNs. Consider the number of applicable rules).
3.  Provide a \`summary\` of the compliance status.
4.  Extract any relevant \`dataFlowInsights\` related to compliance (e.g., how PII or financial data appears to move).
5.  Provide actionable \`recommendations\` to improve compliance.

Be thorough and precise in your analysis.
`,
});

const checkApiComplianceFlow = ai.defineFlow(
  {
    name: 'checkApiComplianceFlow',
    inputSchema: CheckApiComplianceInputSchema,
    outputSchema: CheckApiComplianceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
