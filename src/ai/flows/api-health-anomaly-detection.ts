'use server';
/**
 * @fileOverview API Health Anomaly Detection AI agent.
 *
 * - analyzeApiHealth - A function that handles the API health analysis.
 * - AnalyzeApiHealthInput - The input type for the analyzeApiHealth function.
 * - AnalyzeApiHealthOutput - The return type for the analyzeApiHealth function.
 * - AnalyzeApiHealthInputSchema - The Zod schema for the input.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const AnalyzeApiHealthInputSchema = z.object({
  apiLogs: z
    .string()
    .optional()
    .describe('Multiline text of API logs, or a JSON array of log objects. Include timestamps, status codes, messages, and relevant context if possible.'),
  metricsData: z
    .string()
    .optional()
    .describe('JSON string representing timeseries metrics data. For example: [{timestamp: "YYYY-MM-DDTHH:mm:ssZ", latency_ms: 120, error_rate: 0.05, throughput_rpm: 500}, ...]. Ensure at least one of logs or metrics is provided.'),
}).refine(data => data.apiLogs || data.metricsData, {
  message: "Either API logs or metrics data must be provided.",
});
export type AnalyzeApiHealthInput = z.infer<typeof AnalyzeApiHealthInputSchema>;

const AnalyzeApiHealthOutputSchema = z.object({
  anomalies: z
    .array(z.object({
      timestamp: z.string().optional().describe("Timestamp of the anomaly if identifiable."),
      description: z.string().describe("Description of the identified anomaly."),
      severity: z.enum(["High", "Medium", "Low"]).describe("Severity of the anomaly."),
      suggestedChecks: z.array(z.string()).optional().describe("Specific checks or areas to investigate related to this anomaly.")
    }))
    .describe("A list of detected anomalies in the provided data."),
  failurePredictions: z
    .array(z.object({
      component: z.string().optional().describe("The API component or endpoint likely to be affected."),
      prediction: z.string().describe("Description of the potential failure."),
      confidence: z.enum(["High", "Medium", "Low"]).describe("Confidence level of the prediction."),
      timeframe: z.string().optional().describe("Estimated timeframe for the potential failure (e.g., 'within next few hours', 'if trend continues').")
    }))
    .describe("Predictions of potential future failures based on trends."),
  rootCauseSuggestions: z
    .array(z.object({
      issue: z.string().describe("The observed issue or anomaly for which root causes are suggested."),
      potentialCauses: z.array(z.string()).describe("A list of potential root causes."),
      investigationSteps: z.array(z.string()).optional().describe("Steps to take to investigate or confirm the root cause.")
    }))
    .describe("Suggestions for root causes of identified issues or anomalies."),
  summary: z.string().describe("An overall health assessment summary based on the analysis of the provided data."),
});
export type AnalyzeApiHealthOutput = z.infer<typeof AnalyzeApiHealthOutputSchema>;

export async function analyzeApiHealth(input: AnalyzeApiHealthInput): Promise<AnalyzeApiHealthOutput> {
  if (!input.apiLogs && !input.metricsData) {
    // This explicit check might be redundant if Zod's refine is correctly triggered
    // by Genkit's flow input validation, but it's a safe fallback.
    throw new Error("Either API logs or metrics data must be provided.");
  }
  return analyzeApiHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeApiHealthPrompt',
  input: {schema: AnalyzeApiHealthInputSchema},
  output: {schema: AnalyzeApiHealthOutputSchema},
  prompt: `You are an expert Site Reliability Engineer (SRE) and API monitoring specialist.
Analyze the provided API logs and/or metrics data to detect anomalies, predict potential failures (short-term, based on observed trends), and suggest potential root causes for observed issues.

{{#if apiLogs}}
API Logs:
\`\`\`
{{{apiLogs}}}
\`\`\`
{{/if}}

{{#if metricsData}}
Metrics Data (JSON format):
\`\`\`json
{{{metricsData}}}
\`\`\`
{{/if}}

Your analysis should:
1.  **Identify Anomalies**: Look for unusual patterns, error spikes (e.g., increased 4xx/5xx status codes), significant latency increases, sudden drops in throughput, resource exhaustion indicators (if inferable from logs), or security-related flags (e.g., auth failures). For each anomaly, describe it, assign a severity (High, Medium, Low), provide an approximate timestamp if possible, and suggest specific checks.
2.  **Predict Potential Failures**: Based on trends in the data (e.g., steadily increasing error rate, rapidly decreasing available resources), predict potential upcoming failures. State the component/endpoint (if identifiable), the nature of the prediction, your confidence (High, Medium, Low), and an estimated timeframe.
3.  **Suggest Root Causes**: For significant issues or anomalies identified, list potential root causes. Also, provide concrete investigation steps to help pinpoint the actual cause.
4.  **Summarize**: Provide a brief overall health assessment summary.

Structure your output according to the defined schema. If data for a specific category (anomalies, predictions, root causes) is insufficient or not evident, return an empty array for that category but still provide a summary.
Prioritize actionable insights.
`,
});

const analyzeApiHealthFlow = ai.defineFlow(
  {
    name: 'analyzeApiHealthFlow',
    inputSchema: AnalyzeApiHealthInputSchema,
    outputSchema: AnalyzeApiHealthOutputSchema,
  },
  async (input: AnalyzeApiHealthInput) => { 
    const {output} = await prompt(input);
    return output!;
  }
);
