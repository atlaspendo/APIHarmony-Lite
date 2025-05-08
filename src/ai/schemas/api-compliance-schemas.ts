import { z } from 'zod';

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
