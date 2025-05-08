
"use client";

import { useState } from "react";
import Image from "next/image";
import { useOpenApiStore } from "@/stores/openapi-store";
import { integrationPatternAnalysis, type IntegrationPatternAnalysisOutput, type IntegrationPatternAnalysisInput } from "@/ai/flows/integration-pattern-analysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { OpenApiUploadForm } from "@/components/openapi-upload-form";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SelectedPattern {
  name: string;
  description: string;
  examples?: string[];
  diagram?: string; // URL for placeholder diagram
  type: 'pattern' | 'anti-pattern' | 'recommendation';
}


export function IntegrationAnalysisView() {
  const { spec, rawSpec, fileName, error: specError } = useOpenApiStore();
  const [analysisResults, setAnalysisResults] = useState<IntegrationPatternAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<SelectedPattern | null>(null);
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
    setSelectedPattern(null);

    try {
      const results = await integrationPatternAnalysis({ openApiSpec: rawSpec });
      setAnalysisResults(results);
      if (results.identifiedPatterns && results.identifiedPatterns.length > 0) {
        const firstPattern = results.identifiedPatterns[0];
        setSelectedPattern({
          name: firstPattern.name,
          description: firstPattern.description,
          examples: firstPattern.examples,
          // Example of how you might set a specific diagram for a pattern
          diagram: firstPattern.name.toLowerCase().includes("point-to-point") ? "https://picsum.photos/600/300?random=1" : undefined,
          type: 'pattern'
        });
      }
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
  
  const handlePatternSelect = (item: any, type: SelectedPattern['type']) => {
    setSelectedPattern({
      name: item.name || (type === 'recommendation' ? item.recommendation : "Details"),
      description: item.description || item.rationale || "",
      examples: item.examples,
      diagram: item.name?.toLowerCase().includes("point-to-point") ? "https://picsum.photos/600/300?random=1" : 
               item.name?.toLowerCase().includes("api gateway") ? "https://picsum.photos/600/300?random=2" : undefined,
      type: type
    });
  };


  return (
    <div className="container mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icons.Palette className="w-6 h-6 text-primary" /> API Integration Intelligence
          </CardTitle>
          <CardDescription>
            Analyze patterns, identify anti-patterns, and receive recommendations for your API integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!spec && !specError && (
            <>
              <Alert className="mb-6">
                <Icons.Info className="h-4 w-4" />
                <AlertTitle>Load Specification to Start</AlertTitle>
                <AlertDescription>
                  Import an OpenAPI spec to enable integration analysis features.
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
                  There was an error: {specError}. Please try importing again.
                  <div className="mt-4"><OpenApiUploadForm/></div>
                </AlertDescription>
            </Alert>
          )}
          {spec && !specError && !analysisResults && !isLoading &&(
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
          <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Icons.Loader className="w-5 h-5 animate-spin text-primary" /> Analyzing Integration Patterns...</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">AI is evaluating the design of the OpenAPI specification. This may take a moment.</p></CardContent>
        </Card>
      )}

      {analysisError && (
        <Alert variant="destructive" className="mt-6"><Icons.AlertTriangle className="h-4 w-4" /><AlertTitle>Analysis Error</AlertTitle><AlertDescription>{analysisError}</AlertDescription></Alert>
      )}

      {analysisResults && !isLoading && !analysisError && (
        <Tabs defaultValue="pattern-intelligence" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api-discovery"><Icons.Search className="w-4 h-4 mr-2"/>Live API Discovery</TabsTrigger>
            <TabsTrigger value="pattern-intelligence"><Icons.Lightbulb className="w-4 h-4 mr-2"/>Pattern Intelligence</TabsTrigger>
            <TabsTrigger value="predictive-monitoring"><Icons.LineChart className="w-4 h-4 mr-2"/>Predictive Monitoring</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-discovery" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Live API Discovery</CardTitle><CardDescription>This feature is under development. Discover APIs in real-time across your enterprise systems.</CardDescription></CardHeader>
              <CardContent><p className="text-muted-foreground">Coming soon: Real-time scanning and fingerprinting of APIs.</p></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pattern-intelligence" className="mt-4">
            <Card>
              <CardHeader>
                  <CardTitle>Pattern Intelligence Report</CardTitle>
                  <CardDescription>{analysisResults.summary || "AI-powered insights into API integration design."}</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                  <div>
                    <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><Icons.CheckCircle2 className="w-4 h-4 text-green-600" /> Identified Patterns</h3>
                    <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/30">
                      {analysisResults.identifiedPatterns?.length > 0 ? analysisResults.identifiedPatterns.map((p, i) => (
                        <Button key={`ip-${i}`} variant="ghost" size="sm" className="w-full justify-start text-left mb-1" onClick={() => handlePatternSelect(p, 'pattern')}>{p.name}</Button>
                      )) : <p className="text-xs text-muted-foreground p-2">No distinct patterns identified.</p>}
                    </ScrollArea>
                  </div>
                  <div>
                    <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><Icons.AlertTriangle className="w-4 h-4 text-orange-500" /> Potential Anti-Patterns</h3>
                     <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/30">
                      {analysisResults.antiPatterns?.length > 0 ? analysisResults.antiPatterns.map((ap, i) => (
                        <Button key={`ap-${i}`} variant="ghost" size="sm" className="w-full justify-start text-left mb-1" onClick={() => handlePatternSelect(ap, 'anti-pattern')}>{ap.name}</Button>
                      )) : <p className="text-xs text-muted-foreground p-2">No anti-patterns identified.</p>}
                    </ScrollArea>
                  </div>
                   <div>
                    <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><Icons.Settings className="w-4 h-4 text-blue-500" /> Recommendations</h3>
                     <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/30">
                      {analysisResults.recommendations?.length > 0 ? analysisResults.recommendations.map((r, i) => (
                        <Button key={`rec-${i}`} variant="ghost" size="sm" className="w-full justify-start text-left mb-1" onClick={() => handlePatternSelect(r, 'recommendation')}>{r.recommendation.substring(0,30)}...</Button>
                      )) : <p className="text-xs text-muted-foreground p-2">No specific recommendations.</p>}
                    </ScrollArea>
                  </div>
                </div>
                <div className="md:col-span-2">
                  {selectedPattern ? (
                    <Card className="shadow-inner">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {selectedPattern.type === 'pattern' && <Icons.CheckCircle2 className="w-5 h-5 text-green-600"/>}
                          {selectedPattern.type === 'anti-pattern' && <Icons.AlertTriangle className="w-5 h-5 text-orange-500"/>}
                          {selectedPattern.type === 'recommendation' && <Icons.Settings className="w-5 h-5 text-blue-500"/>}
                          {selectedPattern.name}
                        </CardTitle>
                        <CardDescription className="capitalize">{selectedPattern.type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-3">{selectedPattern.description}</p>
                        {selectedPattern.examples && selectedPattern.examples.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-semibold mb-1">Examples:</h4>
                            <ul className="list-disc list-inside pl-2 space-y-1 text-xs text-muted-foreground">
                              {selectedPattern.examples.map((ex, i) => <li key={`ex-${i}`}>{ex}</li>)}
                            </ul>
                          </div>
                        )}
                        {selectedPattern.diagram && (
                          <div className="mt-4 border rounded-md p-2">
                             <h4 className="text-sm font-semibold mb-2 text-center">Illustrative Diagram</h4>
                            <Image src={selectedPattern.diagram} alt={`${selectedPattern.name} Diagram`} width={600} height={300} className="rounded-md object-contain mx-auto" data-ai-hint="integration diagram" />
                            <p className="text-xs text-muted-foreground text-center mt-1">Note: This is a placeholder diagram.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground p-8 border rounded-md">
                      <p>Select an item from the left to view details.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predictive-monitoring" className="mt-4">
            <Card>
               <CardHeader><CardTitle>Predictive Monitoring</CardTitle><CardDescription>This feature is under development. Anticipate integration issues before they impact services.</CardDescription></CardHeader>
              <CardContent><p className="text-muted-foreground">Coming soon: ML-based failure prediction and proactive alerts.</p></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
