
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"; // Added import for Input
import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PredictionCard } from "./prediction-card";
import { predictApiBehavior, type PredictApiBehaviorOutput } from "@/ai/flows/api-predictive-monitoring";
import { PredictiveMonitoringInputSchema, type PredictiveMonitoringInput } from "@/ai/schemas/api-predictive-monitoring-schemas";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Helper to generate more realistic-looking time-series data
const generateTimeSeriesData = (points = 30, initialValue = 50, trend: 'up' | 'down' | 'volatile' | 'stable' = 'stable', noiseFactor = 5, cycleLength = 10) => {
  const data = [];
  let value = initialValue;
  for (let i = 0; i < points; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (points - 1 - i)); // Go back in time
    
    let trendAdjustment = 0;
    if (trend === 'up') trendAdjustment = (i / points) * 20;
    else if (trend === 'down') trendAdjustment = -(i / points) * 20;
    else if (trend === 'volatile') trendAdjustment = Math.sin(i / cycleLength * Math.PI * 2) * 15 + (Math.random() - 0.5) * 10;


    const noise = (Math.random() - 0.5) * noiseFactor;
    value = Math.max(0, Math.min(100, initialValue / 2 + trendAdjustment + noise + (trend === 'stable' ? initialValue/2 : 0)));
    
    data.push({ 
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      value: parseFloat(value.toFixed(1))
    });
  }
  return data;
};

const initialLatencyData = generateTimeSeriesData(30, 200, 'stable', 50); // avg 200ms
const initialErrorRateData = generateTimeSeriesData(30, 5, 'stable', 2);    // avg 5%
const initialThroughputData = generateTimeSeriesData(30, 500, 'stable', 100); // avg 500rpm


const chartConfig: ChartConfig = {
  latency: { label: "Avg Latency (ms)", color: "hsl(var(--chart-1))" },
  errorRate: { label: "Error Rate (%)", color: "hsl(var(--chart-2))" },
  throughput: { label: "Throughput (rpm)", color: "hsl(var(--chart-3))" },
};

export function PredictiveMonitoringView() {
  const [analysisResult, setAnalysisResult] = useState<PredictApiBehaviorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [latencyData, setLatencyData] = useState(initialLatencyData);
  const [errorRateData, setErrorRateData] = useState(initialErrorRateData);
  const [throughputData, setThroughputData] = useState(initialThroughputData);


  const form = useForm<PredictiveMonitoringInput>({
    resolver: zodResolver(PredictiveMonitoringInputSchema),
    defaultValues: {
      historicalMetricsJson: JSON.stringify({
        latencyMs: initialLatencyData,
        errorRatePercent: initialErrorRateData,
        throughputRpm: initialThroughputData,
      }, null, 2),
      predictionWindowHours: "24",
    },
  });

  const onSubmit = async (data: PredictiveMonitoringInput) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // Potentially update charts based on input, if live update is desired
      // For now, we assume the initial charts are representative of what's submitted
      const parsedMetrics = JSON.parse(data.historicalMetricsJson);
      if(parsedMetrics.latencyMs) setLatencyData(parsedMetrics.latencyMs.slice(-30)); // Show last 30 points
      if(parsedMetrics.errorRatePercent) setErrorRateData(parsedMetrics.errorRatePercent.slice(-30));
      if(parsedMetrics.throughputRpm) setThroughputData(parsedMetrics.throughputRpm.slice(-30));


      const result = await predictApiBehavior(data);
      setAnalysisResult(result);
      toast({
        title: "Predictive Analysis Complete",
        description: "Future API behavior predictions have been generated.",
      });
    } catch (err: any) {
      console.error("Predictive monitoring error:", err);
      const errorMessage = err.message || "An unexpected error occurred during predictive analysis.";
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icons.TrendingUp className="w-7 h-7 text-primary" /> AI-Powered Predictive API Monitoring
          </CardTitle>
          <CardDescription>
            Input historical API metrics (or use defaults) to let AI predict future behavior, potential issues, and suggest preventive actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="historicalMetricsJson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Historical Metrics (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Paste JSON data of historical metrics. See schema for expected format (latencyMs, errorRatePercent, throughputRpm as arrays of {date: "YYYY-MM-DD", value: number}).'
                        className="min-h-[200px] font-mono text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide time-series data for key API metrics. Default data is pre-filled.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="predictionWindowHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prediction Window (Hours)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 24 for next 24 hours" {...field} />
                    </FormControl>
                    <FormDescription>
                      How far into the future should the AI predict? (e.g., 6, 12, 24, 48 hours).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} size="lg" className="w-full">
                {isLoading ? (
                  <Icons.Loader className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Icons.BrainCircuit className="mr-2 h-5 w-5" />
                )}
                Generate Predictions
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="mt-6 shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
                <Icons.LineChart className="w-5 h-5 text-primary"/> Historical Metrics Overview
            </CardTitle>
            <CardDescription>Visual representation of the input historical data (showing last 30 data points if more are provided).</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 pt-2">
            {[
              { title: "Latency (ms)", data: latencyData, dataKey: "latency", color: chartConfig.latency.color },
              { title: "Error Rate (%)", data: errorRateData, dataKey: "errorRate", color: chartConfig.errorRate.color },
              { title: "Throughput (rpm)", data: throughputData, dataKey: "throughput", color: chartConfig.throughput.color },
            ].map(chart => (
                <div key={chart.title} className="h-[250px] p-3 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="text-sm font-semibold text-center mb-2 text-foreground">{chart.title}</h4>
                    <ChartContainer config={chartConfig} className="w-full h-[200px]">
                        <ResponsiveContainer>
                        <LineChart data={chart.data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.7)" />
                            <XAxis dataKey="date" 
                                tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} 
                                className="text-[10px] fill-muted-foreground" 
                                interval="preserveStartEnd" 
                                tickCount={5}
                            />
                            <YAxis className="text-[10px] fill-muted-foreground" domain={['auto', 'auto']} tickCount={5}/>
                            <Tooltip
                                content={<ChartTooltipContent 
                                    className="text-xs shadow-lg bg-background/90 backdrop-blur-sm"
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric'})}
                                    formatter={(value, name) => [`${value} ${chart.dataKey === 'latency' ? 'ms' : chart.dataKey === 'errorRate' ? '%' : 'rpm'}`, chartConfig[chart.dataKey]?.label]}
                                    indicator="line"
                                />}
                                cursor={{ stroke: chart.color, strokeWidth: 1.5 , strokeDasharray:"3 3"}}
                            />
                            <Line type="monotone" dataKey="value" stroke={chart.color} strokeWidth={2.5} dot={false} name={chartConfig[chart.dataKey]?.label as string} activeDot={{ r: 5, strokeWidth:1, fill: chart.color, stroke: "hsl(var(--background))" }}/>
                        </LineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            ))}
        </CardContent>
      </Card>


      {isLoading && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Icons.Loader className="w-5 h-5 animate-spin text-primary" /> Analyzing and Predicting...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The AI is processing historical data and forecasting future trends. This may take some time.</p>
            <Progress value={undefined} className="mt-4" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <Icons.AlertTriangle className="h-4 w-4" />
          <AlertTitle>Prediction Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && !isLoading && !error && (
        <Card className="mt-6 shadow-xl">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Icons.Gauge className="w-7 h-7 text-primary" /> Predictive Monitoring Report
            </CardTitle>
            <CardDescription className="flex justify-between items-center">
              <span>{analysisResult.overallAssessment || "AI-driven forecast of API behavior."}</span>
              <Badge variant={
                analysisResult.overallRiskLevel === "High" ? "destructive" :
                analysisResult.overallRiskLevel === "Medium" ? "secondary" : "default"
              } className="ml-2 text-xs px-2 py-1">
                Overall Risk: {analysisResult.overallRiskLevel || "N/A"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icons.Zap className="w-5 h-5 text-accent" /> Future State Predictions ({form.getValues("predictionWindowHours")} hours)
              </h3>
              {analysisResult.predictions && analysisResult.predictions.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysisResult.predictions.map((prediction, index) => (
                    <PredictionCard key={index} prediction={prediction} />
                  ))}
                </div>
              ) : (
                <Alert>
                  <Icons.Info className="h-4 w-4" />
                  <AlertTitle>No Specific Predictions</AlertTitle>
                  <AlertDescription>The AI did not generate specific future state predictions based on the provided data and window.</AlertDescription>
                </Alert>
              )}
            </div>

            {analysisResult.dataInsights && analysisResult.dataInsights.length > 0 && (
                 <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Icons.Lightbulb className="w-5 h-5 text-yellow-500" /> Data Insights
                    </h3>
                    <Alert variant="default" className="bg-muted/30">
                        <Icons.Info className="h-4 w-4 text-muted-foreground" />
                        <AlertDescription>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                {analysisResult.dataInsights.map((insight, index) => <li key={`insight-${index}`}>{insight}</li>)}
                            </ul>
                        </AlertDescription>
                    </Alert>
                 </div>
            )}

            {analysisResult.preventiveRecommendations && analysisResult.preventiveRecommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Icons.ShieldCheck className="w-5 h-5 text-green-600" /> Preventive Recommendations
                </h3>
                <ScrollArea className="h-40 rounded-md border p-4 bg-muted/30">
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    {analysisResult.preventiveRecommendations.map((rec, index) => (
                      <li key={`rec-${index}`}>{rec}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    