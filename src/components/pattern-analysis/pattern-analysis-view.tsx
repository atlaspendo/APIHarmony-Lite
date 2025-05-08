
"use client";

import { useState } from "react";
import { useOpenApiStore } from "@/stores/openapi-store";
import { apiPatternAnalysis, type ApiPatternAnalysisOutput } from "@/ai/flows/api-pattern-analysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { OpenApiUploadForm } from "@/components/openapi-upload-form";
import { useToast } from "@/hooks/use-toast";

export function PatternAnalysisView() {
  const { spec, rawSpec, fileName, error: specError } = useOpenApiStore();
  const [analysisResults, setAnalysisResults] = useState<ApiPatternAnalysisOutput | null>(null);
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
      const results = await apiPatternAnalysis({ openApiSpec: rawSpec });
      setAnalysisResults(results);
      toast({
        title: "Analysis Complete",
        description: `API pattern analysis for "${fileName}" finished.`,
      });
    } catch (err: any) {
      console.error("Pattern analysis error:", err);
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
            <Icons.ListChecks className="w-6 h-6 text-primary" /> API Pattern Analysis
          </CardTitle>
          <CardDescription>
            Leverage AI to identify common design patterns, potential anti-patterns, and areas for improvement in your OpenAPI specification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!spec && !specError && (
            <>
              <Alert className="mb-6">
                <Icons.Info className="h-4 w-4" />
                <AlertTitle>Load Specification to Start</AlertTitle>
                <AlertDescription>
                  You need to import an OpenAPI specification before you can run a pattern analysis.
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
                Start AI Pattern Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Display Section */}
      {isLoading && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Icons.Loader className="w-5 h-5 animate-spin text-primary" /> Analyzing API Patterns...
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
              <Icons.FileJson className="w-7 h-7 text-primary" /> API Pattern Analysis Report
            </CardTitle>
            <CardDescription>
              AI-powered insights into API design patterns and suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid md:grid-cols-1 gap-6">
            {/* Identified Patterns */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icons.CheckCircle2 className="w-5 h-5 text-green-600" /> Identified Patterns
                <Badge variant="default" className="ml-auto bg-green-600 hover:bg-green-700 text-white">{analysisResults.patterns?.length || 0}</Badge>
              </h3>
              {analysisResults.patterns && analysisResults.patterns.length > 0 ? (
                <ScrollArea className="h-60 rounded-md border p-4 bg-muted/30">
                  <ul className="space-y-3">
                    {analysisResults.patterns.map((pattern, index) => (
                      <li key={`pattern-${index}`} className="text-sm p-3 bg-background rounded-md shadow-sm border border-green-500/50">
                        <p className="font-medium text-white bg-green-600 px-2 py-1 rounded-t-md -mx-3 -mt-3 mb-2 text-xs">Pattern #{index+1}</p>
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <Alert>
                  <Icons.Info className="h-4 w-4" />
                  <AlertTitle>No Specific Patterns Identified</AlertTitle>
                  <AlertDescription>The AI did not identify distinct design patterns based on its criteria.</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Identified Anti-Patterns */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icons.AlertTriangle className="w-5 h-5 text-orange-500" /> Potential Anti-Patterns
                <Badge variant="outline" className="ml-auto border-orange-500 text-orange-500">{analysisResults.antiPatterns?.length || 0}</Badge>
              </h3>
              {analysisResults.antiPatterns && analysisResults.antiPatterns.length > 0 ? (
                <ScrollArea className="h-60 rounded-md border p-4 bg-muted/30">
                  <ul className="space-y-3">
                    {analysisResults.antiPatterns.map((antiPattern, index) => (
                      <li key={`antipattern-${index}`} className="text-sm p-3 bg-background rounded-md shadow-sm border border-orange-500/50">
                        <p className="font-medium text-white bg-orange-500 px-2 py-1 rounded-t-md -mx-3 -mt-3 mb-2 text-xs">Anti-Pattern #{index+1}</p>
                        {antiPattern}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <Alert>
                  <Icons.Info className="h-4 w-4" />
                  <AlertTitle>No Anti-Patterns Identified</AlertTitle>
                  <AlertDescription>The AI did not identify significant anti-patterns.</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Suggestions */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icons.Settings className="w-5 h-5 text-blue-500" /> Suggestions for Improvement
                <Badge variant="outline" className="ml-auto border-blue-500 text-blue-500">{analysisResults.suggestions?.length || 0}</Badge>
              </h3>
              {analysisResults.suggestions && analysisResults.suggestions.length > 0 ? (
                <ScrollArea className="h-60 rounded-md border p-4 bg-muted/30">
                  <ul className="space-y-3">
                    {analysisResults.suggestions.map((suggestion, index) => (
                      <li key={`suggestion-${index}`} className="text-sm p-3 bg-background rounded-md shadow-sm border border-blue-500/50">
                        <p className="font-medium text-white bg-blue-500 px-2 py-1 rounded-t-md -mx-3 -mt-3 mb-2 text-xs">Suggestion #{index+1}</p>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
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
