"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnalyzeApiHealthInputSchema, type AnalyzeApiHealthInput } from "@/ai/schemas/api-health-schemas";
import { analyzeApiHealth, type AnalyzeApiHealthOutput } from "@/ai/flows/api-health-anomaly-detection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function ApiHealthAnalysisView() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeApiHealthOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<AnalyzeApiHealthInput>({
    resolver: zodResolver(AnalyzeApiHealthInputSchema),
    defaultValues: {
      apiLogs: "",
      metricsData: "",
    },
  });

  const onSubmit = async (data: AnalyzeApiHealthInput) => {
    if (!data.apiLogs && !data.metricsData) {
        form.setError("apiLogs", { type: "manual", message: "Please provide either API logs or metrics data."})
        form.setError("metricsData", { type: "manual", message: "Please provide either API logs or metrics data."})
        return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeApiHealth(data);
      setAnalysisResult(result);
      toast({
        title: "API Health Analysis Complete",
        description: "Logs and/or metrics have been analyzed.",
      });
    } catch (err: any) {
      console.error("API health analysis error:", err);
      const errorMessage = err.message || "An unexpected error occurred during health analysis.";
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

  const renderSeverityBadge = (severity: "High" | "Medium" | "Low") => {
    switch (severity) {
      case "High": return <Badge variant="destructive">{severity}</Badge>;
      case "Medium": return <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">{severity}</Badge>;
      case "Low": return <Badge variant="outline" className="border-yellow-500 text-yellow-600">{severity}</Badge>;
      default: return <Badge>{severity}</Badge>;
    }
  }

  return (
    <div className="container mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icons.Activity className="w-6 h-6 text-primary" /> AI-Powered API Health Analysis
          </CardTitle>
          <CardDescription>
            Paste API logs or metrics data (JSON) to detect anomalies, predict potential failures, and get root cause suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="apiLogs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Logs (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste multiline API logs here. Include timestamps, status codes, error messages, etc."
                        className="min-h-[150px] font-mono text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide raw text logs from your API servers or services.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="metricsData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metrics Data (JSON, Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='e.g., [{"timestamp": "2023-10-26T10:00:00Z", "latency_ms": 120, "error_rate": 0.05, "throughput_rpm": 500}, ...]'
                        className="min-h-[100px] font-mono text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide timeseries metrics as a JSON array of objects.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} size="lg" className="w-full">
                {isLoading ? (
                  <Icons.Loader className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Icons.Zap className="mr-2 h-5 w-5" />
                )}
                Analyze API Health
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Icons.Loader className="w-5 h-5 animate-spin text-primary" /> Analyzing Health Data...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The AI is processing the logs and/or metrics. This might take a moment.</p>
            <Progress value={undefined} className="mt-4" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <Icons.AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && !isLoading && !error && (
        <Card className="mt-6 shadow-xl">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Icons.HeartPulse className="w-7 h-7 text-primary" /> API Health Report
            </CardTitle>
            <CardDescription className="text-sm">
              {analysisResult.summary || "Detailed analysis of API health based on provided data."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Anomalies */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icons.AlertTriangle className="w-5 h-5 text-orange-500" /> Detected Anomalies
                <Badge variant="outline" className="ml-auto border-orange-500 text-orange-500">{analysisResult.anomalies?.length || 0}</Badge>
              </h3>
              {analysisResult.anomalies && analysisResult.anomalies.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-2">
                  {analysisResult.anomalies.map((anomaly, index) => (
                    <AccordionItem value={`anomaly-${index}`} key={`anomaly-${index}`} className="border rounded-md shadow-sm bg-muted/30">
                      <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-md text-sm">
                        <span className="font-medium flex-1 text-left mr-2 truncate">{anomaly.description}</span>
                        {renderSeverityBadge(anomaly.severity)}
                      </AccordionTrigger>
                      <AccordionContent className="p-4 bg-background rounded-b-md text-xs space-y-2">
                        <p><span className="font-semibold">Timestamp:</span> {anomaly.timestamp || "N/A"}</p>
                        <p><span className="font-semibold">Description:</span> {anomaly.description}</p>
                        {anomaly.suggestedChecks && anomaly.suggestedChecks.length > 0 && (
                            <div><p className="font-semibold">Suggested Checks:</p><ul className="list-disc list-inside pl-2">{anomaly.suggestedChecks.map((check, i) => <li key={`check-${index}-${i}`}>{check}</li>)}</ul></div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (<Alert><Icons.Info className="h-4 w-4" /><AlertTitle>No Anomalies Detected</AlertTitle><AlertDescription>No significant anomalies were identified in the provided data.</AlertDescription></Alert>)}
            </div>

            {/* Failure Predictions */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icons.Zap className="w-5 h-5 text-red-600" /> Potential Failure Predictions
                <Badge variant="destructive" className="ml-auto">{analysisResult.failurePredictions?.length || 0}</Badge>
              </h3>
              {analysisResult.failurePredictions && analysisResult.failurePredictions.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-2">
                  {analysisResult.failurePredictions.map((prediction, index) => (
                     <AccordionItem value={`prediction-${index}`} key={`prediction-${index}`} className="border rounded-md shadow-sm bg-muted/30">
                       <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-md text-sm">
                         <span className="font-medium flex-1 text-left mr-2 truncate">{prediction.prediction} {prediction.component && `(${prediction.component})`}</span>
                         {renderSeverityBadge(prediction.confidence)} {/* Re-using severity badge for confidence */}
                       </AccordionTrigger>
                       <AccordionContent className="p-4 bg-background rounded-b-md text-xs space-y-2">
                         <p><span className="font-semibold">Component:</span> {prediction.component || "General"}</p>
                         <p><span className="font-semibold">Prediction:</span> {prediction.prediction}</p>
                         <p><span className="font-semibold">Timeframe:</span> {prediction.timeframe || "Not specified"}</p>
                       </AccordionContent>
                     </AccordionItem>
                  ))}
                </Accordion>
              ) : (<Alert><Icons.Info className="h-4 w-4" /><AlertTitle>No Failure Predictions</AlertTitle><AlertDescription>No immediate failure predictions based on current data trends.</AlertDescription></Alert>)}
            </div>

            {/* Root Cause Suggestions */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icons.GitFork className="w-5 h-5 text-blue-500" /> Root Cause Suggestions
                 <Badge variant="outline" className="ml-auto border-blue-500 text-blue-500">{analysisResult.rootCauseSuggestions?.length || 0}</Badge>
              </h3>
              {analysisResult.rootCauseSuggestions && analysisResult.rootCauseSuggestions.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-2">
                  {analysisResult.rootCauseSuggestions.map((suggestion, index) => (
                    <AccordionItem value={`rootcause-${index}`} key={`rootcause-${index}`} className="border rounded-md shadow-sm bg-muted/30">
                      <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-md text-sm">
                        <span className="font-medium flex-1 text-left mr-2 truncate">{suggestion.issue}</span>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 bg-background rounded-b-md text-xs space-y-2">
                         <p><span className="font-semibold">Issue:</span> {suggestion.issue}</p>
                        {suggestion.potentialCauses && suggestion.potentialCauses.length > 0 && (
                            <div><p className="font-semibold">Potential Causes:</p><ul className="list-disc list-inside pl-2">{suggestion.potentialCauses.map((cause, i) => <li key={`cause-${index}-${i}`}>{cause}</li>)}</ul></div>
                        )}
                        {suggestion.investigationSteps && suggestion.investigationSteps.length > 0 && (
                            <div><p className="font-semibold mt-1">Investigation Steps:</p><ul className="list-disc list-inside pl-2">{suggestion.investigationSteps.map((step, i) => <li key={`step-${index}-${i}`}>{step}</li>)}</ul></div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (<Alert><Icons.Info className="h-4 w-4" /><AlertTitle>No Specific Root Cause Suggestions</AlertTitle><AlertDescription>No specific root cause suggestions were generated for the current data.</AlertDescription></Alert>)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
