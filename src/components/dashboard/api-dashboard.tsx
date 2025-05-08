
"use client";

import { useOpenApiStore } from "@/stores/openapi-store";
import type { OpenAPIV3, OpenAPIV2 } from 'openapi-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

// Helper to count operations by method
const countOperationsByMethod = (paths: OpenAPIV3.PathsObject | OpenAPIV2.PathsObject | undefined): Record<string, number> => {
  const counts: Record<string, number> = { GET: 0, POST: 0, PUT: 0, DELETE: 0, PATCH: 0, OPTIONS: 0, HEAD: 0, TRACE: 0 };
  if (!paths) return counts;

  for (const path in paths) {
    const pathItem = paths[path];
    if (!pathItem) continue;
    for (const method in pathItem) {
      if (Object.prototype.hasOwnProperty.call(counts, method.toUpperCase())) {
        counts[method.toUpperCase()]++;
      }
    }
  }
  return counts;
};

const chartConfig = {
  operations: {
    label: "Operations",
  },
  GET: { label: "GET", color: "hsl(var(--chart-1))" },
  POST: { label: "POST", color: "hsl(var(--chart-2))" },
  PUT: { label: "PUT", color: "hsl(var(--chart-3))" },
  DELETE: { label: "DELETE", color: "hsl(var(--chart-4))" },
  PATCH: { label: "PATCH", color: "hsl(var(--chart-5))" },
  OPTIONS: { label: "OPTIONS", color: "hsl(var(--muted))" },
  HEAD: { label: "HEAD", color: "hsl(var(--muted))" },
  TRACE: { label: "TRACE", color: "hsl(var(--muted))" },
} satisfies ChartConfig;


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
          <p className="text-destructive-foreground bg-destructive p-3 rounded-md">{specError}</p>
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
          <CardTitle className="flex items-center gap-2"><Icons.Info />No API Specification Loaded</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please import an OpenAPI specification first using the <Link href="/" className="underline text-primary hover:text-primary/80">Import page</Link> to view the dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const { info, paths } = spec;
  const isV3 = 'openapi' in spec && spec.openapi.startsWith('3.');
  const schemas = isV3 ? (spec as OpenAPIV3.Document).components?.schemas : (spec as OpenAPIV2.Document).definitions;
  const numPaths = paths ? Object.keys(paths).length : 0;
  const numSchemas = schemas ? Object.keys(schemas).length : 0;
  const operationCounts = countOperationsByMethod(paths);
  const totalOperations = Object.values(operationCounts).reduce((sum, count) => sum + count, 0);

  const chartData = Object.entries(operationCounts)
    .filter(([, count]) => count > 0)
    .map(([method, count]) => ({ method, operations: count }));


  return (
    <div className="space-y-6">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-card">
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-3">
            <Icons.LayoutDashboard className="w-8 h-8" /> API Dashboard: {info.title}
          </CardTitle>
          <CardDescription className="text-md pt-1">
            {fileName ? `File: ${fileName} | ` : ''} Version: {info.version}
          </CardDescription>
          {info.description && <p className="text-sm text-muted-foreground mt-2">{info.description}</p>}
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
            <Icons.Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numPaths}</div>
            <p className="text-xs text-muted-foreground">distinct API paths</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <Icons.Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOperations}</div>
            <p className="text-xs text-muted-foreground">across all endpoints</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defined Schemas</CardTitle>
            <Icons.FileJson className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numSchemas}</div>
            <p className="text-xs text-muted-foreground">reusable data models</p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Operations Breakdown</CardTitle>
            <CardDescription>Number of operations by HTTP method.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="method" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="operations" radius={4}>
                    {chartData.map((entry, index) => (
                        <div key={`cell-${index}`} style={{backgroundColor: chartConfig[entry.method as keyof typeof chartConfig]?.color || 'hsl(var(--primary))'}}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Navigate to other analytical sections.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          <Button asChild variant="outline">
            <Link href="/documentation"><Icons.BookOpen className="mr-2"/>View Documentation</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dependency-graph"><Icons.GitFork className="mr-2"/>Explore Dependencies</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/vulnerability-scan"><Icons.ShieldAlert className="mr-2"/>Run Vulnerability Scan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pattern-analysis"><Icons.ListChecks className="mr-2"/>Analyze Patterns</Link>
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
