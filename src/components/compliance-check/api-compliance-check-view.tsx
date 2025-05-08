
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useOpenApiStore } from "@/stores/openapi-store";
import { checkApiCompliance, type CheckApiComplianceOutput, CheckApiComplianceInputSchema, type CheckApiComplianceInput } from "@/ai/flows/api-compliance-check";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { OpenApiUploadForm } from "@/components/openapi-upload-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


export function ApiComplianceCheckView() {
  const { spec, rawSpec, fileName, error: specError } = useOpenApiStore();
  const [complianceResult, setComplianceResult] = useState<CheckApiComplianceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<CheckApiComplianceInput>({
    resolver: zodResolver(CheckApiComplianceInputSchema),
    defaultValues: {
      openApiSpec: "", // Will be populated from store
      complianceProfile: "GENERAL",
    },
  });

  const onSubmit = async (data: CheckApiComplianceInput) => {
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
    setComplianceResult(null);

    try {
      const result = await checkApiCompliance({ ...data, openApiSpec: rawSpec });
      setComplianceResult(result);
      toast({
        title: "Compliance Check Complete",
        description: `Analysis for "${fileName}" against ${data.complianceProfile} profile finished.`,
      });
    } catch (err: any)      {
      console.error("Compliance check error:", err);
      const errorMessage = err.message || "An unexpected error occurred during the compliance check.";
      setAnalysisError(errorMessage);
      toast({
        title: "Check Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: "PASS" | "FAIL" | "WARN" | "NOT_APPLICABLE") => {
    switch (status) {
      case "PASS": return "text-green-600";
      case "FAIL": return "text-red-600";
      case "WARN": return "text-orange-500";
      default: return "text-muted-foreground";
    }
  };
  
  const getStatusIcon = (status: "PASS" | "FAIL" | "WARN" | "NOT_APPLICABLE") => {
    switch (status) {
      case "PASS": return <Icons.CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "FAIL": return <Icons.XCircle className="w-4 h-4 text-red-600" />;
      case "WARN": return <Icons.AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Icons.Info className="w-4 h-4 text-muted-foreground" />;
    }
  };


  return (
    <div className="container mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icons.ShieldCheck className="w-6 h-6 text-primary" /> API Compliance Check
          </CardTitle>
          <CardDescription>
            Analyze your OpenAPI specification against predefined compliance profiles using AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!spec && !specError && (
            <>
              <Alert className="mb-6">
                <Icons.Info className="h-4 w-4" />
                <AlertTitle>Load Specification to Start</AlertTitle>
                <AlertDescription>
                  You need to import an OpenAPI specification before running a compliance check.
                  Use the form below or the <a href="/" className="underline text-primary">Import page</a>.
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                <p className="text-sm text-muted-foreground">
                  Loaded specification: <strong className="text-foreground">{fileName}</strong>
                </p>
                <FormField
                  control={form.control}
                  name="complianceProfile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compliance Profile</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a compliance profile" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GENERAL">General Best Practices</SelectItem>
                          <SelectItem value="PII_ öffentlich">PII / Publicly Identifiable Information</SelectItem>
                          <SelectItem value="FINANCIAL_BASIC">Financial Basic Security</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Choose the set of rules to check against.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading || !rawSpec} size="lg" className="w-full">
                  {isLoading ? (
                    <Icons.Loader className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Icons.Zap className="mr-2 h-5 w-5" />
                  )}
                  Start Compliance Check
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Icons.Loader className="w-5 h-5 animate-spin text-primary" /> Checking Compliance...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The AI is analyzing the specification against the selected profile. This may take a moment.</p>
            <Progress value={undefined} className="mt-4" />
          </CardContent>
        </Card>
      )}

      {analysisError && (
        <Alert variant="destructive" className="mt-6">
          <Icons.AlertTriangle className="h-4 w-4" />
          <AlertTitle>Compliance Check Error</AlertTitle>
          <AlertDescription>{analysisError}</AlertDescription>
        </Alert>
      )}

      {complianceResult && !isLoading && !analysisError && (
        <Card className="mt-6 shadow-xl">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Icons.Gavel className="w-7 h-7 text-primary" /> Compliance Report for {form.getValues("complianceProfile")} Profile
            </CardTitle>
             <div className="flex justify-between items-center pt-2">
                <CardDescription className="text-sm flex-1">
                    {complianceResult.summary || "Detailed compliance analysis results."}
                </CardDescription>
                <div className="text-right ml-4">
                    <p className="text-xs text-muted-foreground">Overall Score</p>
                    <p className={`text-2xl font-bold ${complianceResult.overallComplianceScore >= 80 ? 'text-green-600' : complianceResult.overallComplianceScore >= 50 ? 'text-orange-500' : 'text-red-600'}`}>
                        {complianceResult.overallComplianceScore.toFixed(0)}/100
                    </p>
                </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Detailed Checks</h3>
              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Status</TableHead>
                      <TableHead className="w-[120px]">Rule ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Findings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceResult.checksPerformed.map((check, index) => (
                      <TableRow key={index} className={check.status === "FAIL" ? "bg-destructive/10" : check.status === "WARN" ? "bg-orange-500/10" : ""}>
                        <TableCell className="font-medium">
                           <div className="flex items-center gap-2"> {getStatusIcon(check.status)} <span className={getStatusColor(check.status)}>{check.status}</span></div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{check.ruleId}</TableCell>
                        <TableCell className="text-xs">{check.description}</TableCell>
                        <TableCell className="text-xs">{check.findings || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
            
            {complianceResult.dataFlowInsights && complianceResult.dataFlowInsights.length > 0 && (
                 <div>
                    <h3 className="text-lg font-semibold mb-2">Data Flow Insights</h3>
                    <Alert>
                        <Icons.Info className="h-4 w-4" />
                        <AlertDescription>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                {complianceResult.dataFlowInsights.map((insight, index) => <li key={`insight-${index}`}>{insight}</li>)}
                            </ul>
                        </AlertDescription>
                    </Alert>
                 </div>
            )}

            {complianceResult.recommendations && complianceResult.recommendations.length > 0 && (
                 <div>
                    <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                     <ScrollArea className="h-40 rounded-md border p-4 bg-muted/30">
                        <ul className="list-disc list-inside space-y-2 text-sm">
                            {complianceResult.recommendations.map((rec, index) => <li key={`rec-${index}`}>{rec}</li>)}
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
