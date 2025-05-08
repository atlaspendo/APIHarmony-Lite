
"use client";

import type { ComponentProps } from "react";
import { Area, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  chartData: { name: string; value: number }[];
  chartColorKey: string; // e.g., "memory", "cpu". Used as a key in propChartConfig.
  Icon: LucideIcon;
  chartConfig: ChartConfig; // This is propChartConfig, e.g., metricsChartConfig from dashboard
  description?: string;
}

export function MetricCard({ title, value, unit, chartData, chartColorKey, Icon, chartConfig: propChartConfig, description }: MetricCardProps) {
  
  // The actual color string, e.g., "hsl(var(--chart-1))" for memory
  const actualColorString = propChartConfig[chartColorKey]?.color;

  // ChartContainer's 'config' prop expects keys to match the 'dataKey' of Line/Area elements.
  // Our dataKey for Line/Area is "value".
  const chartDisplayConfig: ChartConfig = {
    value: { 
      label: title, // Used by ChartTooltipContent
      color: actualColorString, 
    },
  };

  const gradientId = `gradient-${chartColorKey.toString().replace(/\s+/g, '-')}`;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <Icon className="w-5 h-5 mr-2 text-primary" />
            {title}
          </CardTitle>
          <div className="text-2xl font-bold text-right">
            {value}
            {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
          </div>
        </div>
         {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartDisplayConfig} className="h-[100px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -25, bottom: 0 }} 
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  {/* var(--color-value) will be defined by ChartStyle from chartDisplayConfig.value.color */}
                  <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(val) => val.slice(0,3)} 
                className="text-xs fill-muted-foreground"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={5} 
                className="text-xs fill-muted-foreground"
                width={30} 
              />
              <Tooltip
                cursor={{ stroke: actualColorString, strokeWidth: 1, strokeDasharray: "3 3" }}
                labelFormatter={(label) => <div className="font-semibold text-foreground">{label}</div>} // For T-0, T-1 label
                content={<ChartTooltipContent
                            className="text-xs shadow-lg" // Ensure good visibility
                            indicator="line" // "dot" or "line"
                            // itemSorter={(item) => item.name === 'value' ? -1 : 1} // If multiple series
                          />}
              />
              <Line
                dataKey="value"
                type="monotone"
                stroke="var(--color-value)" 
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 1, fill: "var(--color-value)", stroke: "hsl(var(--background))" }}
              />
              <Area
                dataKey="value"
                type="monotone"
                fill={`url(#${gradientId})`}
                stroke="none"
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

    