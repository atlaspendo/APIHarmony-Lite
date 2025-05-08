
"use client";

import { useOpenApiStore } from "@/stores/openapi-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "./metric-card";
import { SystemHealthItem } from "./system-health-item";
import { AnomalyItem } from "./anomaly-item";
import type { ChartConfig } from "@/components/ui/chart"; 

// Placeholder data for charts
const generateLineChartData = (points = 7) => {
  return Array.from({ length: points }, (_, i) => ({
    name: `T-${points - 1 - i}`, // Time labels like T-6, T-5, ..., T-0
    value: Math.floor(Math.random() * (80 - 20 + 1) + 20), // Random value between 20 and 80
  }));
};

const memoryUsageData = generateLineChartData();
const cpuUsageData = generateLineChartData();
const responseTimeData = generateLineChartData(7).map(d => ({...d, value: Math.floor(Math.random() * (300 - 50 + 1) + 50)})); // ms
const errorRateData = generateLineChartData(7).map(d => ({...d, value: parseFloat((Math.random() * 5).toFixed(1))})); // %

const metricsChartConfig: ChartConfig = {
  memory: { label: "Memory", color: "hsl(var(--chart-1))" },
  cpu: { label: "CPU", color: "hsl(var(--chart-2))" },
  response: { label: "Response", color: "hsl(var(--chart-3))" },
  error: { label: "Error", color: "hsl(var(--chart-4))" },
};

const systemHealthData = [
  { name: "Customer Portal API", status: "Warning", details: "Memory usage increasing", Icon: Icons.Server },
  { name: "CRM API Gateway", status: "Healthy", details: "99.9% uptime", Icon: Icons.Network },
  { name: "Inventory Service", status: "Healthy", details: "Nominal throughput", Icon: Icons.ListChecks },
  { name: "Payment Processor", status: "Critical", details: "High error rate on transactions", Icon: Icons.AlertOctagon },
];

const anomalyData = [
  {
    title: "Memory Usage Anomaly Detected",
    description: "Memory usage is increasing at an abnormal rate of approximately 2% per minute. This pattern matches known memory leak signatures in authentication services.",
    severity: "High",
    timestamp: "2024-05-15 10:30:00 UTC",
  },
  {
    title: "Elevated Error Rate on /orders Endpoint",
    description: "The /orders endpoint is experiencing a 15% error rate, significantly above the 1% baseline. Primarily 503 Service Unavailable errors.",
    severity: "Medium",
    timestamp: "2024-05-15 09:15:00 UTC",
  },
];

export function ApiDashboard() {
  const { spec, fileName, error: specError } = useOpenApiStore();

  if (specError) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Icons.AlertTriangle /> Error Loading Specification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Icons.AlertTriangle className="h-4 w-4" />
            <AlertTitle>Failed to Load Specification</AlertTitle>
            <AlertDescription>{specError}</AlertDescription>
          </Alert>
          <p className="mt-4 text-sm">
            Please try importing the specification again via the <Link href="/" className="underline text-primary hover:text-primary/80">Import page</Link>.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!spec) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Icons.LayoutDashboard />API Harmony Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Icons.Info className="h-4 w-4" />
            <AlertTitle>No API Specification Loaded</AlertTitle>
            <AlertDescription>
              Please import an OpenAPI specification using the <Link href="/" className="underline text-primary hover:text-primary/80">Import page</Link> to view the dashboard.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Robust check for spec.info and its required properties
  if (!spec.info || typeof spec.info.title === 'undefined' || typeof spec.info.version === 'undefined') {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Icons.AlertTriangle /> Malformed API Specification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Icons.AlertTriangle className="h-4 w-4" />
            <AlertTitle>Invalid Specification Structure</AlertTitle>
            <AlertDescription>
              The loaded API specification is missing essential 'info' (title/version).
              Please check the spec file: {fileName || 'Unknown file'}.
            </AlertDescription>
          </Alert>
           <p className="mt-4 text-sm">
            Try importing the specification again via the <Link href="/" className="underline text-primary hover:text-primary/80">Import page</Link>.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { info } = spec;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-card">
          <CardTitle className="text-2xl font-semibold text-primary flex items-center gap-3">
            <Icons.LayoutDashboard className="w-7 h-7" /> Dashboard: {info.title}
          </CardTitle>
          <CardDescription className="text-sm pt-1">
            {fileName ? `File: ${fileName} | ` : ''} Version: {info.version}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Top Row: Simulation Controls & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <Icons.SlidersHorizontal className="w-5 h-5 mr-2 text-primary" /> Simulation Controls
            </CardTitle>
            <CardDescription className="text-xs">Simulate API degradation scenarios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span>Simulation Time</span>
                <span className="font-semibold">30 seconds</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            <div className="space-y-1">
              <p className="text-sm">Scenario: <span className="font-semibold">Memory Leak</span></p>
              <p className="text-xs text-muted-foreground">Simulates a gradual memory leak in the Customer Portal API.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" className="w-full">
                <Icons.PauseCircle className="mr-2 h-4 w-4" /> Pause Simulation
              </Button>
              <Button variant="outline" className="w-full">
                <Icons.RefreshCw className="mr-2 h-4 w-4" /> Reset Simulation
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <Icons.ClipboardList className="w-5 h-5 mr-2 text-primary" /> System Health
            </CardTitle>
            <CardDescription className="text-xs">Current status of monitored systems.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-72 overflow-y-auto">
            {systemHealthData.map((item) => (
              <SystemHealthItem key={item.name} {...item} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Real-time Metrics Section */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <Icons.Activity className="w-6 h-6 mr-2 text-primary" /> Real-time Metrics
          </CardTitle>
          <CardDescription>Performance metrics for {info.title}.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard 
            title="Memory Usage" 
            value={memoryUsageData[memoryUsageData.length - 1].value} 
            unit="%" 
            chartData={memoryUsageData} 
            chartColorKey="memory" 
            Icon={Icons.MemoryStick}
            chartConfig={metricsChartConfig}
            description="Current RAM utilization"
          />
          <MetricCard 
            title="CPU Usage" 
            value={cpuUsageData[cpuUsageData.length -1].value} 
            unit="%" 
            chartData={cpuUsageData} 
            chartColorKey="cpu" 
            Icon={Icons.Cpu}
            chartConfig={metricsChartConfig}
            description="Current processor load"
          />
          <MetricCard 
            title="Response Time" 
            value={responseTimeData[responseTimeData.length - 1].value} 
            unit="ms" 
            chartData={responseTimeData} 
            chartColorKey="response" 
            Icon={Icons.GaugeCircle}
            chartConfig={metricsChartConfig}
            description="Average API response latency"
          />
          <MetricCard 
            title="Error Rate" 
            value={errorRateData[errorRateData.length - 1].value} 
            unit="%" 
            chartData={errorRateData} 
            chartColorKey="error" 
            Icon={Icons.AlertOctagon}
            chartConfig={metricsChartConfig}
            description="Percentage of failed requests"
          />
        </CardContent>
      </Card>

      {/* Anomaly Detection & Remediation Section */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <Icons.Zap className="w-6 h-6 mr-2 text-primary" /> Anomaly Detection & Remediation
          </CardTitle>
          <CardDescription>Detected anomalies and recommended actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {anomalyData.length > 0 ? (
            anomalyData.map((anomaly, index) => (
              <AnomalyItem key={index} {...anomaly} />
            ))
          ) : (
            <Alert>
              <Icons.CheckCircle2 className="h-4 w-4" />
              <AlertTitle>No Anomalies Detected</AlertTitle>
              <AlertDescription>All systems are operating within normal parameters.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    