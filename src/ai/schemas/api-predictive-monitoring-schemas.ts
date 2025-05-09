
import { z } from 'zod';

const TimeSeriesDataPointSchema = z.object({
  date: z.string().describe("Date of the metric reading, ideally in YYYY-MM-DD format."),
  value: z.number().describe("The metric value for that date."),
});

export const PredictiveMonitoringInputSchema = z.object({
  historicalMetricsJson: z
    .string()
    .describe('A JSON string representing historical time-series data for key API metrics. Expected structure: { "latencyMs": [{date: "YYYY-MM-DD", value: number}, ...], "errorRatePercent": [{date: "YYYY-MM-DD", value: number}, ...], "throughputRpm": [{date: "YYYY-MM-DD", value: number}, ...] }. Each metric is optional but at least one should be provided.'),
  predictionWindowHours: z
    .string() // Keep as string to match form input, will parse to number in flow or prompt.
    .describe('The time window for the prediction in hours (e.g., "6", "12", "24", "48").'),
  // openApiSpecId: z.string().optional().describe("Optional ID of the OpenAPI specification to focus the prediction on, if available and relevant."),
});
export type PredictiveMonitoringInput = z.infer<typeof PredictiveMonitoringInputSchema>;


export const PredictionSchema = z.object({
  metricName: z.string().describe("Name of the metric being predicted (e.g., 'Average Latency', 'Error Rate', 'CPU Utilization')."),
  predictedValue: z.string().describe("The predicted value or range for the metric (e.g., '250ms - 300ms', 'will exceed 10%', 'stable around 60%')."),
  timeToPrediction: z.string().describe("Estimated timeframe for when this prediction is expected to materialize (e.g., 'in the next 6 hours', 'by end of day', 'within 2 days')."),
  confidenceScore: z.number().min(0).max(1).describe("A score from 0.0 to 1.0 indicating the AI's confidence in this specific prediction."),
  reasoning: z.string().optional().describe("Brief explanation of the factors or trends leading to this prediction."),
  severity: z.enum(["High", "Medium", "Low", "Info"]).optional().describe("Predicted severity of the impact if this prediction materializes."),
});
export type Prediction = z.infer<typeof PredictionSchema>;


export const PredictApiBehaviorOutputSchema = z.object({
  predictions: z
    .array(PredictionSchema)
    .describe("A list of specific predictions about future API behavior or metric states."),
  overallRiskLevel: z
    .enum(["High", "Medium", "Low", "Unknown"])
    .describe("An overall assessment of the risk level based on the combined predictions."),
  overallAssessment: z
    .string()
    .describe("A concise summary of the predicted API health and key areas of attention for the specified future window."),
  preventiveRecommendations: z
    .array(z.string())
    .optional()
    .describe("Actionable recommendations to mitigate predicted risks or improve future API stability."),
  dataInsights: z
    .array(z.string())
    .optional()
    .describe("Interesting patterns or insights observed from the historical data that informed the predictions."),
});
export type PredictApiBehaviorOutput = z.infer<typeof PredictApiBehaviorOutputSchema>;

// Example to validate historicalMetricsJson structure if needed within Zod, though typically validated by the AI or flow logic
// This is a more complex validation and might be better handled in the flow itself.
// .refine(data => {
//   try {
//     const metrics = JSON.parse(data.historicalMetricsJson);
//     // Check for at least one valid metric array
//     const hasLatency = Array.isArray(metrics.latencyMs) && metrics.latencyMs.every((p: any) => TimeSeriesDataPointSchema.safeParse(p).success);
//     const hasErrorRate = Array.isArray(metrics.errorRatePercent) && metrics.errorRatePercent.every((p: any) => TimeSeriesDataPointSchema.safeParse(p).success);
//     const hasThroughput = Array.isArray(metrics.throughputRpm) && metrics.throughputRpm.every((p: any) => TimeSeriesDataPointSchema.safeParse(p).success);
//     return hasLatency || hasErrorRate || hasThroughput;
//   } catch {
//     return false;
//   }
// }, { message: "Historical metrics JSON must be valid and contain at least one metric (latencyMs, errorRatePercent, or throughputRpm) with proper {date, value} structure." })
