
'use server';
/**
 * @fileOverview API Predictive Monitoring AI agent.
 *
 * - predictApiBehavior - A function that handles the API predictive monitoring process.
 * - PredictiveMonitoringInput - The input type for the predictApiBehavior function.
 * - PredictApiBehaviorOutput - The return type for the predictApiBehavior function.
 */

import { ai } from '@/ai/genkit';
import { PredictiveMonitoringInputSchema, PredictApiBehaviorOutputSchema, type PredictiveMonitoringInput, type PredictApiBehaviorOutput } from '@/ai/schemas/api-predictive-monitoring-schemas';

export async function predictApiBehavior(input: PredictiveMonitoringInput): Promise<PredictApiBehaviorOutput> {
  return predictApiBehaviorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictApiBehaviorPrompt',
  input: { schema: PredictiveMonitoringInputSchema },
  output: { schema: PredictApiBehaviorOutputSchema },
  prompt: `You are an expert AI specializing in time-series analysis and predictive monitoring for API health and performance.
Analyze the provided historical API metrics to forecast future behavior within the specified prediction window.

Historical Metrics Data (JSON format):
\`\`\`json
{{{historicalMetricsJson}}}
\`\`\`
The JSON data contains arrays for 'latencyMs', 'errorRatePercent', and 'throughputRpm'. Each array consists of objects with 'date' (YYYY-MM-DD) and 'value' (number).

Prediction Window: The user wants predictions for the next {{{predictionWindowHours}}} hours.

Your analysis should:
1.  **Generate Specific Predictions**: For key metrics (latency, error rate, throughput, and any other relevant derived metrics like resource saturation if inferable), provide concrete predictions.
    *   Each prediction should include:
        *   \`metricName\`: e.g., "Average Latency", "P99 Latency", "Error Rate", "Throughput Degradation", "Potential CPU Saturation".
        *   \`predictedValue\`: A specific value, range, or trend (e.g., "increase to 350ms", "drop below 100rpm", "spike to 15%", "remain stable around 5%").
        *   \`timeToPrediction\`: When this is expected (e.g., "within next 4 hours", "towards the end of the {{{predictionWindowHours}}}-hour window", "if current trend continues for 2 more hours").
        *   \`confidenceScore\`: Your confidence (0.0 to 1.0) in this specific prediction.
        *   \`reasoning\`: Brief explanation (e.g., "based on increasing 7-day trend and cyclical peaks", "sudden spike observed in the last hour").
        *   \`severity\`: Potential impact if this prediction comes true (High, Medium, Low, Info).
2.  **Assess Overall Risk Level**: Based on all predictions, determine an \`overallRiskLevel\` (High, Medium, Low, Unknown) for the API's health in the upcoming window.
3.  **Provide Overall Assessment**: Write a concise \`overallAssessment\` summarizing the predicted API state and highlighting key areas of concern or stability.
4.  **Suggest Preventive Recommendations**: Offer actionable \`preventiveRecommendations\` to mitigate predicted risks (e.g., "Scale up backend instances if latency exceeds 200ms for 1 hour", "Investigate root cause of increasing error rate for /payment endpoint", "Consider preemptive resource allocation for batch job service on weekends").
5.  **Extract Data Insights**: Note any significant \`dataInsights\` or patterns observed in the historical data that informed your predictions (e.g., "Observed a strong correlation between throughput spikes and increased error rates.", "Latency shows a daily peak around 2 PM UTC.").

Focus on actionable, data-driven predictions. If the historical data is insufficient for a strong prediction on a particular metric, state that or provide a low-confidence prediction.
Be specific in your \`predictedValue\` and \`timeToPrediction\`.
`,
});

const predictApiBehaviorFlow = ai.defineFlow(
  {
    name: 'predictApiBehaviorFlow',
    inputSchema: PredictiveMonitoringInputSchema,
    outputSchema: PredictApiBehaviorOutputSchema,
  },
  async (input: PredictiveMonitoringInput) => {
    // Potential pre-processing of input.historicalMetricsJson if needed,
    // e.g., ensuring it's valid JSON, or further cleaning/transforming the data.
    // For now, assume the AI prompt handles the JSON string directly.
    const { output } = await prompt(input);
    return output!;
  }
);
