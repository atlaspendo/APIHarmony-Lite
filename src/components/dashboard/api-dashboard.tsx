
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
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

// Placeholder data for charts (remains simulated)
const generateLineChartData = (points = 7) => {
  return Array.from({ length: points }, (_, i) => ({
    name: `T-${points - 1 - i}`, 
    value: Math.floor(Math.random() * (80 - 20 + 1) + 20), 
  }));
};

const initialMemoryUsageData = generateLineChartData();
const initialCpuUsageData = generateLineChartData();
const initialResponseTimeData = generateLineChartData(7).map(d => ({...d, value: Math.floor(Math.random() * (300 - 50 + 1) + 50)}));
const initialErrorRateData = generateLineChartData(7).map(d => ({...d, value: parseFloat((Math.random() * 5).toFixed(1))}));

const metricsChartConfig: ChartConfig = {
  memory: { label: "Memory", color: "hsl(var(--chart-1))" },
  cpu: { label: "CPU", color: "hsl(var(--chart-2))" },
  response: { label: "Response", color: "hsl(var(--chart-3))" },
  error: { label: "Error", color: "hsl(var(--chart-4))" },
};

// System health and anomaly data remain illustrative examples for now
const exampleSystemHealthData = [
  { name: "Customer Portal API", status: "Warning", details: "Memory usage increasing", Icon: Icons.Server },
  { name: "CRM API Gateway", status: "Healthy", details: "99.9% uptime", Icon: Icons.Network },
  { name: "Inventory Service", status: "Healthy", details: "Nominal throughput", Icon: Icons.ListChecks },
  { name: "Payment Processor", status: "Critical", details: "High error rate on transactions", Icon: Icons.AlertOctagon },
];

const exampleAnomalyData = [
  {
    title: "Illustrative: Memory Usage Anomaly",
    description: "Simulated: Memory usage increasing. This is an example anomaly.",
    severity: "High",
    timestamp: new Date().toLocaleString(),
  },
  {
    title: "Illustrative: Elevated Error Rate",
    description: "Simulated: Example of an elevated error rate on an endpoint.",
    severity: "Medium",
    timestamp: new Date(Date.now() - 3600000).toLocaleString(), // 1 hour ago
  },
];

const MAX_SIMULATION_SECONDS = 30;

export function ApiDashboard() {
  const { spec, fileName, error: specError } = useOpenApiStore();
  const { toast } = useToast();

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTimeElapsed, setSimulationTimeElapsed] = useState(0);
  const [simulationIntervalId, setSimulationIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [currentScenario, setCurrentScenario] = useState("Memory Leak Simulation");
  
  // State for metric data that might change during simulation
  const [memoryUsageData, setMemoryUsageData] = useState(initialMemoryUsageData);
  const [cpuUsageData, setCpuUsageData] = useState(initialCpuUsageData);
  const [responseTimeData, setResponseTimeData] = useState(initialResponseTimeData);
  const [errorRateData, setErrorRateData] = useState(initialErrorRateData);


  const stopSimulation = useCallback(() => {
    if (simulationIntervalId) {
      clearInterval(simulationIntervalId);
      setSimulationIntervalId(null);
    }
    setIsSimulating(false);
  }, [simulationIntervalId]);

  const startSimulation = () => {
    stopSimulation(); // Clear any existing interval
    setIsSimulating(true);
    setSimulationTimeElapsed(0);
    
    // Slightly alter metric data to show change
    setMemoryUsageData(prev => prev.map(d => ({...d, value: Math.min(100, d.value + Math.random() * 10)})));
    setErrorRateData(prev => prev.map(d => ({...d, value: Math.min(20, d.value + Math.random() * 2)})));


    const intervalId = setInterval(() => {
      setSimulationTimeElapsed(prev => {
        const nextTime = prev + 1;
        if (nextTime >= MAX_SIMULATION_SECONDS) {
          stopSimulation();
          toast({ title: "Simulation Ended", description: `${currentScenario} completed.` });
          return MAX_SIMULATION_SECONDS;
        }
        // Example: Make memory usage creep up during "Memory Leak"
        if (currentScenario.includes("Memory Leak")) {
          setMemoryUsageData(prevData => {
            const newData = [...prevData];
            const lastVal = newData[newData.length - 1].value;
            newData.push({ name: `T+${nextTime}`, value: Math.min(100, lastVal + Math.random() * 2 + 1)});
            return newData.slice(-7); // Keep last 7 points
          });
        }
        return nextTime;
      });
    }, 1000);
    setSimulationIntervalId(intervalId);
    toast({ title: "Simulation Started", description: `Running ${currentScenario}.` });
  };

  const handleToggleSimulation = () => {
    if (isSimulating) {
      stopSimulation();
      toast({ title: "Simulation Paused" });
    } else {
      startSimulation();
    }
  };

  const handleResetSimulation = () => {
    stopSimulation();
    setSimulationTimeElapsed(0);
    // Reset metrics to initial state or re-generate
    setMemoryUsageData(generateLineChartData());
    setCpuUsageData(generateLineChartData());
    setResponseTimeData(generateLineChartData(7).map(d => ({...d, value: Math.floor(Math.random() * (300 - 50 + 1) + 50)})));
    setErrorRateData(generateLineChartData(7).map(d => ({...d, value: parseFloat((Math.random() * 5).toFixed(1)) })));
    toast({ title: "Simulation Reset" });
  };

  useEffect(() => {
    return () => { // Cleanup on unmount
      stopSimulation();
    };
  }, [stopSimulation]);


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
  const simulationProgressPercent = (simulationTimeElapsed / MAX_SIMULATION_SECONDS) * 100;

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
                <span className="font-semibold">{simulationTimeElapsed} / {MAX_SIMULATION_SECONDS} seconds</span>
              </div>
              <Progress value={simulationProgressPercent} className="h-2" />
            </div>
            <div className="space-y-1">
              <p className="text-sm">Scenario: <span className="font-semibold">{currentScenario}</span></p>
              <p className="text-xs text-muted-foreground">Simulates various API health scenarios.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleToggleSimulation} variant={isSimulating ? "destructive" : "default"} className="w-full">
                {isSimulating ? (
                  <><Icons.PauseCircle className="mr-2 h-4 w-4" /> Pause Simulation</>
                ) : (
                  <><Icons.PlayCircle className="mr-2 h-4 w-4" /> Start Simulation</>
                )}
              </Button>
              <Button onClick={handleResetSimulation} variant="outline" className="w-full" disabled={isSimulating && simulationTimeElapsed === 0}>
                <Icons.RefreshCw className="mr-2 h-4 w-4" /> Reset Simulation
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <Icons.ClipboardList className="w-5 h-5 mr-2 text-primary" /> System Health (Illustrative)
            </CardTitle>
            <CardDescription className="text-xs">Example status of monitored systems.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-72 overflow-y-auto">
            {exampleSystemHealthData.map((item) => (
              <SystemHealthItem key={item.name} {...item} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <Icons.Activity className="w-6 h-6 mr-2 text-primary" /> Real-time Metrics (Simulated)
          </CardTitle>
          <CardDescription>Simulated performance metrics for {info.title}. These metrics are randomly generated or adjusted during simulation.</CardDescription>
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

      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <Icons.Zap className="w-6 h-6 mr-2 text-primary" /> Anomaly Detection (Illustrative)
          </CardTitle>
          <CardDescription>Example of detected anomalies and recommended actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exampleAnomalyData.length > 0 ? (
            exampleAnomalyData.map((anomaly, index) => (
              <AnomalyItem key={index} {...anomaly} />
            ))
          ) : (
            <Alert>
              <Icons.CheckCircle2 className="h-4 w-4" />
              <AlertTitle>No Anomalies Detected (Illustrative)</AlertTitle>
              <AlertDescription>All example systems are operating within normal parameters.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
