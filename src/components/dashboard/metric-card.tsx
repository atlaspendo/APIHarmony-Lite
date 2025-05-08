
"use client";

import type { ComponentProps } from "react";
import { Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  chartData: { name: string; value: number }[];
  chartColor: keyof typeof chartConfig; // e.g., "memory"
  Icon: LucideIcon;
  chartConfig: ChartConfig;
  description?: string;
}

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function MetricCard({ title, value, unit, chartData, chartColor, Icon, chartConfig: propChartConfig, description }: MetricCardProps) {
  
  const activeChartConfig = propChartConfig || chartConfig;

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
        <ChartContainer config={activeChartConfig} className="h-[100px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -25, bottom: 0 }} // Adjusted left margin
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0,3)} // Shorten labels if needed
                className="text-xs"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={5} 
                className="text-xs"
                width={30} // Explicit width for YAxis labels
              />
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel className="text-xs" indicator="line" />}
              />
              <Line
                dataKey="value"
                type="monotone"
                stroke={`hsl(var(--chart-${chartColor as string}))`}
                strokeWidth={2}
                dot={false}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
