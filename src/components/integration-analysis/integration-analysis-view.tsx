
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useOpenApiStore } from "@/stores/openapi-store";
import { integrationPatternAnalysis, type IntegrationPatternAnalysisOutput } from "@/ai/flows/integration-pattern-analysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OpenApiUploadForm } from "@/components/openapi-upload-form";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface SelectedPattern {
  name: string;
  description: string;
  examples?: string[];
  diagram?: string; 
  diagramHint?: string;
  type: 'pattern' | 'anti-pattern' | 'recommendation';
}

const FeatureCard = ({ title, description, icon, link, linkText, action, features }: { title: string, description: string, icon: React.ReactNode, link?: string, linkText?: string, action?: React.ReactNode, features?: string[] }) => (
  <Card className="flex flex-col shadow-sm hover:shadow-lg transition-shadow bg-card h-full">
    <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
      <div className="p-2 bg-primary/10 rounded-lg text-primary">
        {icon}
      </div>
      <div>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="flex-grow space-y-2">
      <p className="text-sm text-muted-foreground">{description}</p>
      {features && features.length > 0 && (
        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 pl-2">
          {features.map((feature, index) => <li key={index}>{feature}</li>)}
        </ul>
      )}
    </CardContent>
    {(link && linkText || action) && (
      <CardFooter className="mt-auto">
        {action}
        {link && linkText && (
          <Button asChild className="w-full" variant="outline">
            <Link href={link}><Icons.ArrowRightCircle className="mr-2 h-4 w-4"/>{linkText}</Link>
          </Button>
        )}
      </CardFooter>
    )}
  </Card>
);


export function IntegrationAnalysisView() {
  const { spec, rawSpec, fileName, error: specError } = useOpenApiStore();
  const [analysisResults, setAnalysisResults] = useState<IntegrationPatternAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<SelectedPattern | null>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("ai-feature-suite"); // Default to AI Feature Suite


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
    // setAnalysisResults(null); // Keep previous results while loading new ones for Pattern tab
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
          diagram: firstPattern.name.toLowerCase().includes("point-to-point") ? "https://picsum.photos/600/300?random=1" : 
                   firstPattern.name.toLowerCase().includes("api gateway") ? "https://picsum.photos/600/300?random=2" : 
                   firstPattern.name.toLowerCase().includes("cqrs") ? "https://picsum.photos/600/300?random=3" :
                   undefined,
          diagramHint: firstPattern.name.toLowerCase().includes("point-to-point") ? "connection points" : 
                       firstPattern.name.toLowerCase().includes("api gateway") ? "gateway architecture" : 
                       firstPattern.name.toLowerCase().includes("cqrs") ? "command query" :
                       "integration diagram",
          type: 'pattern'
        });
      } else if (results.antiPatterns && results.antiPatterns.length > 0) {
        const firstAntiPattern = results.antiPatterns[0];
         setSelectedPattern({
          name: firstAntiPattern.name,
          description: firstAntiPattern.description,
          examples: firstAntiPattern.examples,
          type: 'anti-pattern'
        });
      } else if (results.recommendations && results.recommendations.length > 0) {
        const firstRecommendation = results.recommendations[0];
        setSelectedPattern({
          name: firstRecommendation.recommendation,
          description: firstRecommendation.rationale,
          type: 'recommendation'
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
    const name = item.name || (type === 'recommendation' ? item.recommendation : "Details");
    setSelectedPattern({
      name: name,
      description: item.description || item.rationale || "",
      examples: item.examples,
      diagram: name.toLowerCase().includes("point-to-point") ? "https://picsum.photos/600/300?random=1" : 
               name.toLowerCase().includes("api gateway") ? "https://picsum.photos/600/300?random=2" : 
               name.toLowerCase().includes("cqrs") ? "https://picsum.photos/600/300?random=3" :
               undefined,
      diagramHint: name.toLowerCase().includes("point-to-point") ? "connection points" : 
                   name.toLowerCase().includes("api gateway") ? "gateway architecture" : 
                   name.toLowerCase().includes("cqrs") ? "command query" :
                   "integration diagram",
      type: type
    });
  };


  return (
    <div className="container mx-auto space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icons.BrainCircuit className="w-6 h-6 text-primary" /> API Integration Intelligence Hub
          </CardTitle>
          <CardDescription>
            Leverage AI to analyze patterns, discover APIs, monitor health, ensure compliance, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!spec && !specError && (
            <>
              <Alert className="mb-6">
                <Icons.Info className="h-4 w-4" />
                <AlertTitle>Load Specification to Start</AlertTitle>
                <AlertDescription>
                  Import an OpenAPI spec to enable integration analysis and other AI features.
                </AlertDescription>
              </Alert>
              <OpenApiUploadForm onSpecLoaded={() => {
                setAnalysisResults(null);
                setSelectedPattern(null);
                setAnalysisError(null);
                setActiveTab("ai-feature-suite");
              }} />
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
          {spec && !specError && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="ai-feature-suite">
                  <Icons.BrainCircuit className="w-4 h-4 mr-2"/>AI Feature Suite
                </TabsTrigger>
                <TabsTrigger value="pattern-intelligence">
                  <Icons.Palette className="w-4 h-4 mr-2"/>Pattern Intelligence
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ai-feature-suite">
                <div className="space-y-6">
                  <Card className="bg-card border-primary/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl"><Icons.Search className="w-6 h-6 text-primary"/>Automated API Discovery & Documentation</CardTitle>
                      <CardDescription>Discover, document, and visualize your API landscape.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FeatureCard
                        title="Live API Discovery"
                        description="Simulated multi-method scanning to identify API endpoints across systems."
                        icon={<Icons.Radar className="w-8 h-8"/>}
                        features={[
                          "Common path scanning",
                          "Response analysis hints",
                          "Confidence scoring (simulated)"
                        ]}
                        link="/live-api-discovery"
                        linkText="Explore Discovery"
                      />
                      <FeatureCard
                        title="AI Document Generation"
                        description="Automatically generate OpenAPI specifications from descriptions or partial specs."
                        icon={<Icons.FilePlus2 className="w-8 h-8"/>}
                        features={[
                          "Natural language to OpenAPI",
                          "Partial spec enhancement",
                          "YAML output with confidence"
                        ]}
                        link="/generate-documentation"
                        linkText="Generate Docs"
                      />
                      <FeatureCard
                        title="Dependency Graph"
                        description="Interactive visual relationship mapping for your API schemas and operations."
                        icon={<Icons.GitFork className="w-8 h-8"/>}
                        features={[
                          "Schema usage by operations",
                          "Inter-schema references",
                          "Supports OpenAPI v2 & v3"
                        ]}
                        link="/dependency-graph"
                        linkText="View Dependencies"
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-primary/30">
                     <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl"><Icons.Palette className="w-6 h-6 text-primary"/>Integration Pattern Analysis & Recommendation</CardTitle>
                      <CardDescription>Deep learning-based pattern recognition and best practice recommendations.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                       <FeatureCard
                        title="AI Pattern Analysis"
                        description="Analyze your OpenAPI spec for integration patterns, anti-patterns, and get improvement suggestions."
                        icon={<Icons.Lightbulb className="w-8 h-8"/>}
                        features={[
                            "Identifies common patterns (e.g., API Gateway, CQRS hints)",
                            "Detects anti-patterns (e.g., chatty APIs)",
                            "Provides actionable recommendations"
                        ]}
                        action={<Button variant="outline" onClick={() => { setActiveTab('pattern-intelligence'); if (!analysisResults && rawSpec) handleAnalysis(); }}>Analyze Current Spec</Button>}
                      />
                       <FeatureCard
                        title="Conceptual Advanced Features"
                        description="Future capabilities for deeper integration insights."
                        icon={<Icons.Zap className="w-8 h-8"/>}
                        features={[
                            "Implementation code generation for patterns (Conceptual)",
                            "ROI analysis of optimizations (Conceptual)",
                            "Automatic A/B testing of approaches (Conceptual)"
                        ]}
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-primary/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl"><Icons.HeartPulse className="w-6 h-6 text-primary"/>Comprehensive API Health Monitoring</CardTitle>
                      <CardDescription>Real-time metrics, anomaly detection, and root cause analysis.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FeatureCard
                        title="Health & Anomaly Detection"
                        description="Analyze API logs/metrics for performance issues and anomalies."
                        icon={<Icons.Activity className="w-8 h-8"/>}
                        features={[
                            "Log & metrics data input",
                            "ML-powered anomaly detection",
                            "Root cause suggestions"
                        ]}
                        link="/health-monitoring"
                        linkText="Monitor Health"
                      />
                      <FeatureCard
                        title="Predictive Monitoring"
                        description="Forecast future API behavior and potential failures based on historical trends."
                        icon={<Icons.TrendingUp className="w-8 h-8"/>}
                        features={[
                            "Time-series data analysis",
                            "Future state predictions (latency, errors etc.)",
                            "Preventive recommendations"
                        ]}
                        link="/predictive-monitoring"
                        linkText="Predict Trends"
                      />
                       <FeatureCard
                        title="Conceptual Advanced Monitoring"
                        description="Future enhancements for proactive API management."
                        icon={<Icons.Gauge className="w-8 h-8"/>}
                        features={[
                            "Automated remediation for common failures (Conceptual)",
                            "Business impact assessment of issues (Conceptual)"
                        ]}
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-primary/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl"><Icons.Gavel className="w-6 h-6 text-primary"/>Governance & Compliance Management</CardTitle>
                      <CardDescription>Ensure security, compliance, and manage the API lifecycle.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FeatureCard
                        title="Vulnerability Scanning"
                        description="AI-driven security vulnerability scanning for APIs based on OpenAPI specs."
                        icon={<Icons.ShieldAlert className="w-8 h-8"/>}
                        features={[
                            "Identifies common security issues",
                            "Provides actionable recommendations"
                        ]}
                        link="/vulnerability-scan"
                        linkText="Scan for Vulnerabilities"
                      />
                      <FeatureCard
                        title="Compliance Checks"
                        description="Audit your APIs against predefined compliance profiles (e.g., PII, Financial)."
                        icon={<Icons.ShieldCheck className="w-8 h-8"/>}
                        features={[
                            "Checks against GENERAL, PII, FINANCIAL profiles",
                            "Detailed rule-based analysis"
                        ]}
                        link="/compliance-check"
                        linkText="Check Compliance"
                      />
                      <FeatureCard
                        title="Conceptual Governance Features"
                        description="Future capabilities for comprehensive API governance."
                        icon={<Icons.ClipboardList className="w-8 h-8"/>}
                        features={[
                            "Data flow tracking & visualization (Conceptual)",
                            "API lifecycle management (Conceptual)",
                            "Usage analytics & dependency mapping (Conceptual)"
                        ]}
                      />
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card border-primary/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl"><Icons.Settings className="w-6 h-6 text-primary"/>Self-Optimizing Integration Framework (Conceptual)</CardTitle>
                      <CardDescription>Future capabilities for continuous performance optimization and intelligent operations. These features are not yet implemented.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-3 p-6 grid md:grid-cols-2 gap-x-6 gap-y-3">
                        <p className="flex items-start"><Icons.RefreshCw className="inline w-4 h-4 mr-2 mt-1 text-primary/80 shrink-0"/>Continuous performance optimization using reinforcement learning.</p>
                        <p className="flex items-start"><Icons.Maximize className="inline w-4 h-4 mr-2 mt-1 text-primary/80 shrink-0"/>Automatic scaling recommendations based on usage patterns.</p>
                        <p className="flex items-start"><Icons.Share2 className="inline w-4 h-4 mr-2 mt-1 text-primary/80 shrink-0"/>Intelligent request routing for optimal performance.</p>
                        <p className="flex items-start"><Icons.Zap className="inline w-4 h-4 mr-2 mt-1 text-primary/80 shrink-0"/>Background synchronization optimization for data consistency.</p>
                        <p className="flex items-start"><Icons.Lightbulb className="inline w-4 h-4 mr-2 mt-1 text-primary/80 shrink-0"/>Caching strategy recommendations and implementations.</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="pattern-intelligence">
                {isLoading && !analysisResults && ( // Show loading only if no previous results exist
                  <Card className="mt-6 shadow-lg">
                    <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Icons.Loader className="w-5 h-5 animate-spin text-primary" /> Analyzing Integration Patterns...</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">AI is evaluating the design of the OpenAPI specification. This may take a moment.</p></CardContent>
                  </Card>
                )}
                {analysisError && (
                  <Alert variant="destructive" className="mt-6"><Icons.AlertTriangle className="h-4 w-4" /><AlertTitle>Analysis Error</AlertTitle><AlertDescription>{analysisError}</AlertDescription></Alert>
                )}
                
                {!analysisResults && !isLoading && !analysisError && (
                  <div className="mt-4 text-center border p-6 rounded-md bg-muted/20">
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

                {analysisResults && ( // Always show results section if available, even if loading new ones
                  <Card className="mt-4 border-0 shadow-none">
                    <CardHeader>
                        <CardTitle>Pattern Intelligence Report {isLoading && <Icons.Loader className="w-5 h-5 animate-spin text-primary inline-block ml-2"/>}</CardTitle>
                        <CardDescription>{analysisResults.summary || "AI-powered insights into API integration design."}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-1 space-y-4">
                        <div>
                          <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><Icons.CheckCircle2 className="w-4 h-4 text-green-600" /> Identified Patterns</h3>
                          <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/30">
                            {analysisResults.identifiedPatterns?.length > 0 ? analysisResults.identifiedPatterns.map((p, i) => (
                              <Button key={`ip-${i}`} variant={selectedPattern?.name === p.name && selectedPattern.type === 'pattern' ? "secondary" : "ghost"} size="sm" className="w-full justify-start text-left mb-1 h-auto py-1.5" onClick={() => handlePatternSelect(p, 'pattern')}>
                                <span className="truncate block">{p.name}</span>
                              </Button>
                            )) : <p className="text-xs text-muted-foreground p-2">No distinct patterns identified.</p>}
                          </ScrollArea>
                        </div>
                        <div>
                          <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><Icons.AlertTriangle className="w-4 h-4 text-orange-500" /> Potential Anti-Patterns</h3>
                            <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/30">
                            {analysisResults.antiPatterns?.length > 0 ? analysisResults.antiPatterns.map((ap, i) => (
                              <Button key={`ap-${i}`} variant={selectedPattern?.name === ap.name && selectedPattern.type === 'anti-pattern' ? "secondary" : "ghost"} size="sm" className="w-full justify-start text-left mb-1 h-auto py-1.5" onClick={() => handlePatternSelect(ap, 'anti-pattern')}>
                                <span className="truncate block">{ap.name}</span>
                              </Button>
                            )) : <p className="text-xs text-muted-foreground p-2">No anti-patterns identified.</p>}
                          </ScrollArea>
                        </div>
                          <div>
                          <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><Icons.Settings className="w-4 h-4 text-blue-500" /> Recommendations</h3>
                            <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/30">
                            {analysisResults.recommendations?.length > 0 ? analysisResults.recommendations.map((r, i) => (
                              <Button key={`rec-${i}`} variant={selectedPattern?.name === r.recommendation && selectedPattern.type === 'recommendation' ? "secondary" : "ghost"} size="sm" className="w-full justify-start text-left mb-1 h-auto py-1.5" onClick={() => handlePatternSelect(r, 'recommendation')}>
                                <span className="truncate block">{r.recommendation}</span>
                              </Button>
                            )) : <p className="text-xs text-muted-foreground p-2">No specific recommendations.</p>}
                          </ScrollArea>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        {selectedPattern ? (
                          <Card className="shadow-inner h-full">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                {selectedPattern.type === 'pattern' && <Icons.CheckCircle2 className="w-5 h-5 text-green-600"/>}
                                {selectedPattern.type === 'anti-pattern' && <Icons.AlertTriangle className="w-5 h-5 text-orange-500"/>}
                                {selectedPattern.type === 'recommendation' && <Icons.Settings className="w-5 h-5 text-blue-500"/>}
                                {selectedPattern.name}
                              </CardTitle>
                              <CardDescription className="capitalize text-xs">{selectedPattern.type}</CardDescription>
                            </CardHeader>
                            <ScrollArea className="h-[calc(100%-4rem-1.5rem)]"> {/* Adjust height based on CardHeader */}
                              <CardContent>
                                <p className="text-sm mb-3">{selectedPattern.description}</p>
                                {selectedPattern.examples && selectedPattern.examples.length > 0 && (
                                  <div className="mb-3">
                                    <h4 className="text-xs font-semibold mb-1">Examples in Specification:</h4>
                                    <ul className="list-disc list-inside pl-2 space-y-1 text-xs text-muted-foreground">
                                      {selectedPattern.examples.map((ex, i) => <li key={`ex-${i}`}>{ex}</li>)}
                                    </ul>
                                  </div>
                                )}
                                {selectedPattern.diagram && (
                                  <div className="mt-4 border rounded-md p-2">
                                      <h4 className="text-sm font-semibold mb-2 text-center">Illustrative Diagram</h4>
                                    <Image src={selectedPattern.diagram} alt={`${selectedPattern.name} Diagram`} width={600} height={300} className="rounded-md object-contain mx-auto" data-ai-hint={selectedPattern.diagramHint || "integration diagram"}/>
                                    <p className="text-xs text-muted-foreground text-center mt-1">Note: This is a placeholder diagram.</p>
                                  </div>
                                )}
                              </CardContent>
                            </ScrollArea>
                          </Card>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground p-8 border rounded-md bg-muted/30">
                            <p>Select an item from the left to view details, or run analysis if no results are shown.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                     <CardFooter>
                       <Button onClick={handleAnalysis} variant="outline" className="w-full" disabled={isLoading}>
                          <Icons.RefreshCw className="mr-2 h-4 w-4" /> Re-analyze Current Specification
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

