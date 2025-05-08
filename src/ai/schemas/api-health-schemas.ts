
import { z } from 'zod';

export const AnalyzeApiHealthInputSchema = z.object({
  apiLogs: z
    .string()
    .optional()
    .describe('Multiline text of API logs, or a JSON array of log objects. Include timestamps, status codes, messages, and relevant context if possible.'),
  metricsData: z
    .string()
    .optional()
    .describe('JSON string representing timeseries metrics data. For example: [{timestamp: "YYYY-MM-DDTHH:mm:ssZ", latency_ms: 120, error_rate: 0.05, throughput_rpm: 500}, ...]. Ensure at least one of logs or metrics is provided.'),
}).refine(async (data) => data.apiLogs || data.metricsData, { // Made the predicate async
  message: "Either API logs or metrics data must be provided.",
});

export type AnalyzeApiHealthInput = z.infer<typeof AnalyzeApiHealthInputSchema>;

