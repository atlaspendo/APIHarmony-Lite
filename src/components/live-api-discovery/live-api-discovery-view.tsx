
"use client";

import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DiscoveryLogItem, type LogEntry } from "./discovery-log-item";


const discoveryFormSchema = z.object({
  targetUrl: z.string().url({ message: "Please enter a valid base URL to scan." })
    .min(1, "Target URL cannot be empty."),
  // Future options: scanDepth, specific ports, common paths file
});

type DiscoveryFormValues = z.infer<typeof discoveryFormSchema>;

interface DiscoveredEndpoint {
  id: string;
  method: string;
  path: string;
  confidence: number; // 0-1
  details?: string; // e.g. parameters found, response type hints
}

const MOCK_COMMON_PATHS = [
  "/api/v1/users", "/api/v1/products", "/api/v1/orders", "/health", "/status",
  "/api/v2/items", "/api/v2/categories", "/auth/login", "/auth/register"
];
const MOCK_METHODS = ["GET", "POST", "PUT", "DELETE"];

export function LiveApiDiscoveryView() {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryLogs, setDiscoveryLogs] = useState<LogEntry[]>([]);
  const [discoveredEndpoints, setDiscoveredEndpoints] = useState<DiscoveredEndpoint[]>([]);
  const [discoveryProgress, setDiscoveryProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const logsEndRef = useRef<HTMLDivElement>(null);

  const form = useForm<DiscoveryFormValues>({
    resolver: zodResolver(discoveryFormSchema),
    defaultValues: {
      targetUrl: "",
    },
  });

  const addLog = (message: string, type: LogEntry['type'] = "info", details?: string) => {
    setDiscoveryLogs(prev => [...prev, { timestamp: new Date(), message, type, details }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [discoveryLogs]);

  const simulateDiscovery = async (baseUrl: string) => {
    setIsDiscovering(true);
    setDiscoveryLogs([]);
    setDiscoveredEndpoints([]);
    setDiscoveryProgress(0);
    setError(null);

    addLog(`Starting API discovery for ${baseUrl}...`, "system");

    const totalSteps = MOCK_COMMON_PATHS.length * MOCK_METHODS.length + 5; // 5 for initial steps
    let currentStep = 0;

    const updateProg = () => {
      currentStep++;
      setDiscoveryProgress(Math.min(100, (currentStep / totalSteps) * 100));
    };

    try {
      addLog(`Pinging target: ${baseUrl}`, "info");
      await new Promise(res => setTimeout(res, 300));
      updateProg();
      addLog(`Target ${baseUrl} is responsive.`, "success");
      updateProg();

      addLog("Attempting to fetch common root files (robots.txt, sitemap.xml)...", "info");
      await new Promise(res => setTimeout(res, 500));
      if (Math.random() > 0.5) addLog("Found robots.txt, analyzing for API paths...", "success");
      else addLog("robots.txt not found or not informative.", "warning");
      updateProg();
      updateProg();


      addLog(`Starting common path scanning (${MOCK_COMMON_PATHS.length} paths)...`, "system");
      updateProg();

      for (const commonPath of MOCK_COMMON_PATHS) {
        const fullPath = commonPath; // Assuming baseUrl already handles this
        addLog(`Scanning path: ${fullPath}`, "info");
        
        for (const method of MOCK_METHODS) {
          await new Promise(res => setTimeout(res, 50 + Math.random() * 100)); // Simulate network delay
          updateProg();

          const shouldDiscover = Math.random();
          if (shouldDiscover < 0.15) { // 15% chance to "discover" an endpoint
            const newEndpoint: DiscoveredEndpoint = {
              id: `${method}-${fullPath}`,
              method: method,
              path: fullPath,
              confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
              details: `Responded with ${Math.random() > 0.3 ? '200 OK' : '404 Not Found (but hints API behavior)'}. Potential parameters: 'id', 'page'.`
            };
            setDiscoveredEndpoints(prev => [...prev, newEndpoint]);
            addLog(`Potential endpoint found: ${method} ${baseUrl.replace(/\/+$/, '')}${fullPath}`, "success", `Confidence: ${(newEndpoint.confidence * 100).toFixed(0)}%`);
          }
        }
         if (Math.random() < 0.1) addLog(`Finished scanning variants of ${fullPath}`, "info");
      }
      
      setDiscoveryProgress(100);
      addLog("API Discovery simulation complete.", "system");
      toast({ title: "Discovery Complete", description: `Found ${discoveredEndpoints.length} potential endpoints.` });

    } catch (e: any) {
      addLog(`Error during discovery: ${e.message}`, "error");
      setError(e.message || "An unknown error occurred.");
      toast({ title: "Discovery Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsDiscovering(false);
    }
  };

  const onSubmit = async (data: DiscoveryFormValues) => {
    await simulateDiscovery(data.targetUrl);
  };

  return (
    <div className="container mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icons.Radar className="w-7 h-7 text-primary" /> Live API Discovery (Simulated)
          </CardTitle>
          <CardDescription>
            Enter a target base URL to simulate the discovery of potential API endpoints.
            This tool mimics techniques like common path scanning and response analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="targetUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Base URL</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., https://api.example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      The base URL from which to start the discovery process.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isDiscovering} size="lg" className="w-full">
                {isDiscovering ? (
                  <Icons.Loader className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Icons.Search className="mr-2 h-5 w-5" />
                )}
                Start Discovery Simulation
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isDiscovering && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Icons.Loader className="w-5 h-5 animate-spin text-primary" /> Discovery in Progress...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={discoveryProgress} className="mb-2 h-3" />
            <p className="text-sm text-muted-foreground text-center">{discoveryProgress.toFixed(0)}% Complete</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <Icons.AlertTriangle className="h-4 w-4" />
          <AlertTitle>Discovery Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(discoveryLogs.length > 0 || discoveredEndpoints.length > 0) && !isDiscovering && !error && (
        <Card className="mt-6 shadow-xl">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Icons.ListChecks className="w-7 h-7 text-primary" /> Discovery Results
            </CardTitle>
             <CardDescription>
              Summary of the API discovery process and findings for: {form.getValues("targetUrl")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icons.FileText className="w-5 h-5 text-accent" /> Discovery Log
              </h3>
              <ScrollArea className="h-[400px] rounded-md border p-3 bg-muted/30 text-xs">
                {discoveryLogs.map((log, index) => (
                  <DiscoveryLogItem key={index} log={log} />
                ))}
                <div ref={logsEndRef} />
              </ScrollArea>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icons.Network className="w-5 h-5 text-green-600" /> Discovered Endpoints
                <Badge variant="outline" className="ml-auto">{discoveredEndpoints.length}</Badge>
              </h3>
              {discoveredEndpoints.length > 0 ? (
                <ScrollArea className="h-[400px] rounded-md border p-3 bg-muted/30">
                  {discoveredEndpoints.map((endpoint) => (
                    <div key={endpoint.id} className="p-3 mb-2 border rounded-md bg-background shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-semibold text-sm method-${endpoint.method.toLowerCase()}`}>
                          <Badge variant="outline" className={`mr-2 method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</Badge>
                          {endpoint.path}
                        </span>
                        <Badge variant={endpoint.confidence > 0.75 ? "default" : "secondary"}>
                          Conf: {(endpoint.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      {endpoint.details && <p className="text-xs text-muted-foreground">{endpoint.details}</p>}
                    </div>
                  ))}
                </ScrollArea>
              ) : (
                 <Alert>
                    <Icons.Info className="h-4 w-4" />
                    <AlertTitle>No Endpoints Discovered</AlertTitle>
                    <AlertDescription>The simulation did not identify any potential API endpoints for the given target based on the current criteria.</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
       <style jsx global>{`
        .method-get { color: hsl(var(--chart-1)); }
        .method-get.bg-badge, .method-get .bg-badge { background-color: hsl(var(--chart-1) / 0.1); border-color: hsl(var(--chart-1)); color: hsl(var(--chart-1)); }
        .method-post { color: hsl(var(--chart-2)); }
        .method-post.bg-badge, .method-post .bg-badge { background-color: hsl(var(--chart-2) / 0.1); border-color: hsl(var(--chart-2)); color: hsl(var(--chart-2));}
        .method-put { color: hsl(var(--chart-3)); }
        .method-put.bg-badge, .method-put .bg-badge { background-color: hsl(var(--chart-3) / 0.1); border-color: hsl(var(--chart-3)); color: hsl(var(--chart-3));}
        .method-delete { color: hsl(var(--destructive)); }
        .method-delete.bg-badge, .method-delete .bg-badge { background-color: hsl(var(--destructive) / 0.1); border-color: hsl(var(--destructive)); color: hsl(var(--destructive));}
        .method-patch { color: hsl(var(--chart-4)); }
        .method-patch.bg-badge, .method-patch .bg-badge { background-color: hsl(var(--chart-4) / 0.1); border-color: hsl(var(--chart-4)); color: hsl(var(--chart-4));}
      `}</style>
    </div>
  );
}
