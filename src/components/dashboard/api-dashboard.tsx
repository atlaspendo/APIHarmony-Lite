
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
import type { OpenAPIV3 } from 'openapi-types';

// Helper to generate somewhat realistic time-series data
const generateLineChartData = (points = 7, minVal = 20, maxVal = 80, trend: 'up' | 'down' | 'stable' = 'stable', noise = 5) => {
  let currentValue = (minVal + maxVal) / 2;
  return Array.from({ length: points }, (_, i) => {
    const trendFactor = trend === 'up' ? (i / points) * (maxVal - minVal) / 2 : trend === 'down' ? -(i / points) * (maxVal - minVal) / 2 : 0;
    const randomNoise = (Math.random() - 0.5) * noise;
    currentValue = Math.max(minVal, Math.min(maxVal, ((minVal + maxVal) / 2) + trendFactor + randomNoise));
    return {
      name: `T-${points - 1 - i}`, 
      value: parseFloat(currentValue.toFixed(1)), 
    };
  }).reverse(); // Ensure T-0 is the latest
};


const initialMemoryUsageData = generateLineChartData(7, 30, 70, 'stable', 10);
const initialCpuUsageData = generateLineChartData(7, 20, 60, 'stable', 8);
const initialResponseTimeData = generateLineChartData(7, 50, 300, 'stable', 50);
const initialErrorRateData = generateLineChartData(7, 0, 5, 'stable', 1);


const metricsChartConfig: ChartConfig = {
  memory: { label: "Memory", color: "hsl(var(--chart-1))" },
  cpu: { label: "CPU", color: "hsl(var(--chart-2))" },
  response: { label: "Response", color: "hsl(var(--chart-3))" },
  error: { label: "Error", color: "hsl(var(--chart-4))" },
};

const MAX_SIMULATION_SECONDS = 30;

export function ApiDashboard() {
  const { spec, fileName, error: specError, rawSpec } = useOpenApiStore();
  const { toast } = useToast();

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTimeElapsed, setSimulationTimeElapsed] = useState(0);
  const [simulationIntervalId, setSimulationIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [currentScenario, setCurrentScenario] = useState("Normal Operation");
  
  const [memoryUsageData, setMemoryUsageData] = useState(initialMemoryUsageData);
  const [cpuUsageData, setCpuUsageData] = useState(initialCpuUsageData);
  const [responseTimeData, setResponseTimeData] = useState(initialResponseTimeData);
  const [errorRateData, setErrorRateData] = useState(initialErrorRateData);
  const [systemHealthData, setSystemHealthData] = useState<any[]>([]);
  const [anomalyData, setAnomalyData] = useState<any[]>([]);


  const extractEndpoints = useCallback(() => {
    if (!spec || !spec.paths) return [];
    const endpoints: { name: string; status: "Healthy" | "Warning" | "Critical"; details: string; Icon: any }[] = [];
    Object.keys(spec.paths).forEach(path => {
        const pathMethods = spec.paths![path] as OpenAPIV3.PathItemObject;
        Object.keys(pathMethods).forEach(method => {
            if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
                endpoints.push({
                    name: `${method.toUpperCase()} ${path}`,
                    status: "Healthy", // Default status
                    details: "Nominal operation",
                    Icon: Icons.Network, // Default icon
                });
            }
        });
    });
    return endpoints.slice(0, 5); // Limit for display
  }, [spec]);

  useEffect(() => {
    setSystemHealthData(extractEndpoints());
    // Reset metrics when spec changes
    setMemoryUsageData(generateLineChartData(7, 30, 70, 'stable', 10));
    setCpuUsageData(generateLineChartData(7, 20, 60, 'stable', 8));
    setResponseTimeData(generateLineChartData(7, 50, 300, 'stable', 50));
    setErrorRateData(generateLineChartData(7, 0, 5, 'stable', 1));
    setAnomalyData([]); // Clear anomalies
  }, [spec, extractEndpoints]);


  const stopSimulation = useCallback(() => {
    if (simulationIntervalId) {
      clearInterval(simulationIntervalId);
      setSimulationIntervalId(null);
    }
    setIsSimulating(false);
  }, [simulationIntervalId]);

  const startSimulation = (scenario: string = "Memory Leak Simulation") => {
    stopSimulation(); 
    setCurrentScenario(scenario);
    setIsSimulating(true);
    setSimulationTimeElapsed(0);
    setAnomalyData([]); // Clear previous anomalies
    
    // Initial kick for data
    setMemoryUsageData(generateLineChartData(7, 30, (scenario.includes("Memory Leak") ? 50: 70) ));
    setCpuUsageData(generateLineChartData(7, 20, (scenario.includes("CPU Spike") ? 70: 60)));
    setResponseTimeData(generateLineChartData(7, 50, (scenario.includes("Latency Increase") ? 400: 300)));
    setErrorRateData(generateLineChartData(7, 0, (scenario.includes("Error Spike") ? 15: 5)));


    const intervalId = setInterval(() => {
      setSimulationTimeElapsed(prev => {
        const nextTime = prev + 1;
        if (nextTime >= MAX_SIMULATION_SECONDS) {
          stopSimulation();
          setTimeout(() => {
            toast({ title: "Simulation Ended", description: `${currentScenario} completed.` });
          }, 0);
          return MAX_SIMULATION_SECONDS;
        }
        
        // Update metrics based on scenario
        if (scenario.includes("Memory Leak")) {
          setMemoryUsageData(d => [...d.slice(1), { name: `T+${nextTime}`, value: Math.min(100, d[d.length-1].value + (Math.random() * 2 + 1) * (nextTime/MAX_SIMULATION_SECONDS*2) ) }]);
          if (nextTime > MAX_SIMULATION_SECONDS / 2 && memoryUsageData[memoryUsageData.length-1].value > 75) {
             setAnomalyData(anomalies => anomalies.find(a=>a.title.includes("Memory Usage")) ? anomalies : [...anomalies, {title: "Memory Usage Anomaly", description: "Memory usage critically high.", severity: "High", timestamp: new Date().toLocaleString()}]);
          }
        } else {
          setMemoryUsageData(d => [...d.slice(1), { name: `T+${nextTime}`, value: generateLineChartData(1,30,70,'stable',10)[0].value }]);
        }

        if (scenario.includes("CPU Spike") && nextTime > 5 && nextTime < 15) { // Spike for a period
           setCpuUsageData(d => [...d.slice(1), { name: `T+${nextTime}`, value: Math.min(100, 60 + Math.random() * 30) }]);
           if (cpuUsageData[cpuUsageData.length-1].value > 80) {
             setAnomalyData(anomalies => anomalies.find(a=>a.title.includes("CPU Usage")) ? anomalies : [...anomalies, {title: "CPU Usage Anomaly", description: "CPU usage spiked.", severity: "Medium", timestamp: new Date().toLocaleString()}]);
           }
        } else {
           setCpuUsageData(d => [...d.slice(1), { name: `T+${nextTime}`, value: generateLineChartData(1,20,60,'stable',8)[0].value }]);
        }
        
        if (scenario.includes("Latency Increase")) {
            setResponseTimeData(d => [...d.slice(1), { name: `T+${nextTime}`, value: Math.min(1000, d[d.length-1].value + (Math.random() * 20 + 5) * (nextTime/MAX_SIMULATION_SECONDS*1.5) ) }]);
        } else {
            setResponseTimeData(d => [...d.slice(1), { name: `T+${nextTime}`, value: generateLineChartData(1,50,300,'stable',50)[0].value }]);
        }

        if (scenario.includes("Error Spike")) {
            setErrorRateData(d => [...d.slice(1), { name: `T+${nextTime}`, value: Math.min(100, d[d.length-1].value + (Math.random() * 1 + 0.5) * (nextTime/MAX_SIMULATION_SECONDS*2) ) }]);
            if (errorRateData[errorRateData.length-1].value > 10) {
                 setAnomalyData(anomalies => anomalies.find(a=>a.title.includes("Error Rate")) ? anomalies : [...anomalies, {title: "Elevated Error Rate", description: "Error rate significantly increased.", severity: "High", timestamp: new Date().toLocaleString()}]);
            }
        } else {
            setErrorRateData(d => [...d.slice(1), { name: `T+${nextTime}`, value: generateLineChartData(1,0,5,'stable',1)[0].value }]);
        }


        // Update system health data illustratively
        setSystemHealthData(prevHealth => prevHealth.map(item => {
            if (scenario.includes("Error Spike") && item.name.includes("POST") && Math.random() < 0.3) {
                return {...item, status: "Critical", details: "High error rate on transactions"};
            }
            if (scenario.includes("Memory Leak") && Math.random() < 0.2) {
                 return {...item, status: "Warning", details: "Memory usage increasing"};
            }
            return {...item, status: "Healthy", details: "Nominal operation"};
        }));

        return nextTime;
      });
    }, 1000);
    setSimulationIntervalId(intervalId);
    setTimeout(() => {
        toast({ title: "Simulation Started", description: `Running ${scenario}.` });
    }, 0);
  };

  const handleToggleSimulation = (scenario?: string) => {
    if (isSimulating) {
      stopSimulation();
      setTimeout(() => {
        toast({ title: "Simulation Paused" });
      }, 0);
    } else {
      startSimulation(scenario || "Normal Operation");
    }
  };

  const handleResetSimulation = () => {
    stopSimulation();
    setSimulationTimeElapsed(0);
    setCurrentScenario("Normal Operation");
    setMemoryUsageData(generateLineChartData(7, 30, 70));
    setCpuUsageData(generateLineChartData(7, 20, 60));
    setResponseTimeData(generateLineChartData(7, 50, 300));
    setErrorRateData(generateLineChartData(7, 0, 5));
    setSystemHealthData(extractEndpoints());
    setAnomalyData([]);
    setTimeout(() => {
        toast({ title: "Simulation Reset" });
    }, 0);
  };

  useEffect(() => {
    return () => { 
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

  if (!spec || !rawSpec) {
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

  const simulationScenarios = [
    "Normal Operation",
    "Memory Leak Simulation",
    "CPU Spike Simulation",
    "Latency Increase Simulation",
    "Error Spike Simulation",
  ];


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
             <div className="space-y-2">
                <p className="text-sm font-medium">Select Scenario:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {simulationScenarios.map(scenario => (
                    <Button 
                        key={scenario} 
                        onClick={() => handleToggleSimulation(scenario)} 
                        variant={currentScenario === scenario && isSimulating ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        disabled={isSimulating && currentScenario !== scenario}
                    >
                        {isSimulating && currentScenario === scenario ? <Icons.PauseCircle className="mr-2 h-4 w-4" /> : <Icons.PlayCircle className="mr-2 h-4 w-4" />}
                        {scenario.replace(" Simulation", "")}
                    </Button>
                ))}
                </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span>Simulation Time</span>
                <span className="font-semibold">{simulationTimeElapsed} / {MAX_SIMULATION_SECONDS} seconds</span>
              </div>
              <Progress value={simulationProgressPercent} className="h-2" />
            </div>
             <p className="text-sm">Current: <span className="font-semibold">{currentScenario}</span> {isSimulating ? "(Running)" : "(Paused/Stopped)"}</p>
            
            <div className="flex gap-2">
               <Button onClick={() => handleToggleSimulation(currentScenario)} variant={isSimulating ? "destructive" : "default"} className="w-full" size="sm">
                {isSimulating ? (
                  <><Icons.PauseCircle className="mr-2 h-4 w-4" /> Pause Current</>
                ) : (
                  <><Icons.PlayCircle className="mr-2 h-4 w-4" /> Resume/Start Current</>
                )}
              </Button>
              <Button onClick={handleResetSimulation} variant="outline" className="w-full" size="sm" disabled={isSimulating && simulationTimeElapsed === 0}>
                <Icons.RefreshCw className="mr-2 h-4 w-4" /> Reset All
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <Icons.ClipboardList className="w-5 h-5 mr-2 text-primary" /> System Health (Endpoints from Spec)
            </CardTitle>
            <CardDescription className="text-xs">Status of monitored API endpoints. Limited to first 5 for display.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-72 overflow-y-auto">
            {systemHealthData.length > 0 ? systemHealthData.map((item) => (
              <SystemHealthItem key={item.name} {...item} />
            )) : (
                <p className="text-sm text-muted-foreground p-4 text-center">No endpoints found or loaded from specification.</p>
            )}
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
            value={memoryUsageData.length > 0 ? memoryUsageData[memoryUsageData.length - 1].value : 0} 
            unit="%" 
            chartData={memoryUsageData} 
            chartColorKey="memory" 
            Icon={Icons.MemoryStick}
            chartConfig={metricsChartConfig}
            description="Current RAM utilization"
          />
          <MetricCard 
            title="CPU Usage" 
            value={cpuUsageData.length > 0 ? cpuUsageData[cpuUsageData.length -1].value : 0} 
            unit="%" 
            chartData={cpuUsageData} 
            chartColorKey="cpu" 
            Icon={Icons.Cpu}
            chartConfig={metricsChartConfig}
            description="Current processor load"
          />
          <MetricCard 
            title="Response Time" 
            value={responseTimeData.length > 0 ? responseTimeData[responseTimeData.length - 1].value : 0} 
            unit="ms" 
            chartData={responseTimeData} 
            chartColorKey="response" 
            Icon={Icons.GaugeCircle}
            chartConfig={metricsChartConfig}
            description="Average API response latency"
          />
          <MetricCard 
            title="Error Rate" 
            value={errorRateData.length > 0 ? errorRateData[errorRateData.length - 1].value : 0} 
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
            <Icons.Zap className="w-6 h-6 mr-2 text-primary" /> Anomaly Detection (Simulated)
          </CardTitle>
          <CardDescription>Detected anomalies based on simulated metric thresholds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {anomalyData.length > 0 ? (
            anomalyData.map((anomaly, index) => (
              <AnomalyItem key={index} {...anomaly} />
            ))
          ) : (
            <Alert>
              <Icons.CheckCircle2 className="h-4 w-4" />
              <AlertTitle>No Anomalies Detected (Simulated)</AlertTitle>
              <AlertDescription>All simulated systems are operating within normal parameters based on current thresholds.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
