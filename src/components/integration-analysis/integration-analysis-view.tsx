
"use client";

import { useState } from "react";
import { useOpenApiStore } from "@/stores/openapi-store";
import { integrationPatternAnalysis, type IntegrationPatternAnalysisOutput } from "@/ai/flows/integration-pattern-analysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { OpenApiUploadForm } from "@/components/openapi-upload-form";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function IntegrationAnalysisView() {
  const { spec, rawSpec, fileName, error: specError } = useOpenApiStore();
  const [analysisResults, setAnalysisResults] = useState<IntegrationPatternAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    if (!rawSpec) {
      toast({
        title: "No Specification Loaded",
        description: "Please load an OpenAPI specification first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAnalysisError(null);
    setAnalysisResults(null);

    try {
      const results = await integrationPatternAnalysis({ openApiSpec: rawSpec });
      setAnalysisResults(results);
      toast({
        title: "Analysis Complete",
        description: `Integration pattern analysis for "${fileName}" finished.`,
      });
    } catch (err: any) {
      console.error("Integration pattern analysis error:", err);
      const errorMessage = err.message || "An unexpected error occurred during the analysis.";
      setAnalysisError(errorMessage);
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
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icons.ListChecks className="w-6 h-6 text-primary" /> API Integration Pattern Analysis
          </CardTitle>
          <CardDescription>
            Leverage AI to identify common and advanced integration design patterns, potential anti-patterns, and areas for improvement in your OpenAPI specification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!spec && !specError && (
            <>
              <Alert className="mb-6">
                <Icons.Info className="h-4 w-4" />
                <AlertTitle>Load Specification to Start</AlertTitle>
                <AlertDescription>
                  You need to import an OpenAPI specification before you can run an integration pattern analysis.
                  Use the form below to load your API definition.
                </AlertDescription>
              </Alert>
              <OpenApiUploadForm />
            </>
          )}
          {specError && (
             <Alert variant="destructive" className="mb-6">
                <Icons.AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error with Specification</AlertTitle>
                <AlertDescription>
                  There was an error loading the specification: {specError}. Please try importing again.
                  <div className="mt-4"><OpenApiUploadForm/></div>
                </AlertDescription>
            </Alert>
          )}
          {spec && !specError && (
            <div className="mt-4 text-center">
               <p className="text-sm text-muted-foreground mb-4">
                Loaded specification: <strong className="text-foreground">{fileName}</strong>
              </p>
              <Button onClick={handleAnalysis} disabled={isLoading || !rawSpec} size="lg">
                {isLoading ? (
                  <Icons.Loader className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Icons.Zap className="mr-2 h-5 w-5" />
                )}
                Start AI Integration Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Icons.Loader className="w-5 h-5 animate-spin text-primary" /> Analyzing Integration Patterns...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The AI is evaluating the design patterns of the OpenAPI specification. This might take a moment.</p>
          </CardContent>
        </Card>
      )}

      {analysisError && (
        <Alert variant="destructive" className="mt-6">
          <Icons.AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{analysisError}</AlertDescription>
        </Alert>
      )}

      {analysisResults && !isLoading && !analysisError && (
        <Card className="mt-6 shadow-xl">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Icons.FileJson className="w-7 h-7 text-primary" /> Integration Pattern Analysis Report
            </CardTitle>
            <CardDescription>
             {analysisResults.summary || "AI-powered insights into API integration design patterns, anti-patterns, and suggestions."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icons.CheckCircle2 className="w-5 h-5 text-green-600" /> Identified Patterns
                <Badge variant="default" className="ml-auto bg-green-600 hover:bg-green-700 text-white">{analysisResults.identifiedPatterns?.length || 0}</Badge>
              </h3>
              {analysisResults.identifiedPatterns && analysisResults.identifiedPatterns.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-2">
                  {analysisResults.identifiedPatterns.map((pattern, index) => (
                    <AccordionItem value={`pattern-${index}`} key={`pattern-${index}`} className="border rounded-md shadow-sm bg-muted/30">
                      <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-md text-sm">
                        <span className="font-medium">{pattern.name}</span>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 bg-background rounded-b-md text-xs space-y-2">
                        <p>{pattern.description}</p>
                        {pattern.examples && pattern.examples.length > 0 && (
                          <div>
                            <p className="font-semibold mt-1">Examples from spec:</p>
                            <ul className="list-disc list-inside pl-2">
                              {pattern.examples.map((ex, i) => <li key={`ex-p-${index}-${i}`}>{ex}</li>)}
                            </ul>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <Alert>
                  <Icons.Info className="h-4 w-4" />
                  <AlertTitle>No Specific Patterns Identified</AlertTitle>
                  <AlertDescription>The AI did not identify distinct integration patterns based on its criteria.</AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icons.AlertTriangle className="w-5 h-5 text-orange-500" /> Potential Anti-Patterns
                <Badge variant="outline" className="ml-auto border-orange-500 text-orange-500">{analysisResults.antiPatterns?.length || 0}</Badge>
              </h3>
              {analysisResults.antiPatterns && analysisResults.antiPatterns.length > 0 ? (
                 <Accordion type="multiple" className="w-full space-y-2">
                  {analysisResults.antiPatterns.map((antiPattern, index) => (
                    <AccordionItem value={`antipattern-${index}`} key={`antipattern-${index}`} className="border rounded-md shadow-sm bg-muted/30">
                      <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-md text-sm">
                         <span className="font-medium">{antiPattern.name}</span>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 bg-background rounded-b-md text-xs space-y-2">
                        <p>{antiPattern.description}</p>
                        {antiPattern.impact && <p><span className="font-semibold">Impact:</span> {antiPattern.impact}</p>}
                        {antiPattern.examples && antiPattern.examples.length > 0 && (
                          <div>
                            <p className="font-semibold mt-1">Examples from spec:</p>
                            <ul className="list-disc list-inside pl-2">
                              {antiPattern.examples.map((ex, i) => <li key={`ex-ap-${index}-${i}`}>{ex}</li>)}
                            </ul>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <Alert>
                  <Icons.Info className="h-4 w-4" />
                  <AlertTitle>No Anti-Patterns Identified</AlertTitle>
                  <AlertDescription>The AI did not identify significant anti-patterns.</AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icons.Settings className="w-5 h-5 text-blue-500" /> Recommendations for Improvement
                <Badge variant="outline" className="ml-auto border-blue-500 text-blue-500">{analysisResults.recommendations?.length || 0}</Badge>
              </h3>
              {analysisResults.recommendations && analysisResults.recommendations.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-2">
                  {analysisResults.recommendations.map((rec, index) => (
                    <AccordionItem value={`recommendation-${index}`} key={`recommendation-${index}`} className="border rounded-md shadow-sm bg-muted/30">
                      <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-md text-sm">
                        <span className="font-medium flex-1 text-left mr-2">{rec.recommendation.substring(0,100)}{rec.recommendation.length > 100 ? '...' : ''}</span>
                        {rec.priority && <Badge variant={rec.priority === "High" ? "destructive" : rec.priority === "Medium" ? "secondary" : "outline"} className="text-xs">{rec.priority}</Badge>}
                      </AccordionTrigger>
                      <AccordionContent className="p-4 bg-background rounded-b-md text-xs space-y-2">
                        <p><span className="font-semibold">Recommendation:</span> {rec.recommendation}</p>
                        <p><span className="font-semibold">Rationale:</span> {rec.rationale}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <Alert>
                  <Icons.Info className="h-4 w-4" />
                  <AlertTitle>No Specific Suggestions</AlertTitle>
                  <AlertDescription>The AI did not provide specific improvement suggestions at this time.</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
