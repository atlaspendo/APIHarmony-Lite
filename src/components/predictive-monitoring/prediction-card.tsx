
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { Progress } from "@/components/ui/progress";
import type { Prediction } from "@/ai/schemas/api-predictive-monitoring-schemas"; // Assuming Prediction type is exported

interface PredictionCardProps {
  prediction: Prediction;
}

const getIconForMetric = (metricName: string): React.ElementType => {
    if (metricName.toLowerCase().includes("latency")) return Icons.GaugeCircle;
    if (metricName.toLowerCase().includes("error")) return Icons.AlertOctagon;
    if (metricName.toLowerCase().includes("cpu")) return Icons.Cpu;
    if (metricName.toLowerCase().includes("memory")) return Icons.MemoryStick;
    if (metricName.toLowerCase().includes("throughput")) return Icons.Activity;
    return Icons.LineChart;
};


export function PredictionCard({ prediction }: PredictionCardProps) {
  const MetricIcon = getIconForMetric(prediction.metricName);
  const confidencePercent = prediction.confidenceScore * 100;

  let valueDisplay = prediction.predictedValue;
  if (prediction.metricName.toLowerCase().includes("latency")) valueDisplay += " ms";
  else if (prediction.metricName.toLowerCase().includes("error") || prediction.metricName.toLowerCase().includes("%")) valueDisplay += "%";
  else if (prediction.metricName.toLowerCase().includes("throughput")) valueDisplay += " rpm";


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <CardTitle className="text-md font-semibold flex items-center gap-2">
                <MetricIcon className="w-5 h-5 text-primary" />
                {prediction.metricName}
            </CardTitle>
            <Badge variant={
                prediction.severity && prediction.severity.toLowerCase() === "high" ? "destructive" :
                prediction.severity && prediction.severity.toLowerCase() === "medium" ? "secondary" : "outline"
            }>
                {prediction.severity || "Info"}
            </Badge>
        </div>
        <CardDescription className="text-xs pt-1">Predicted state {prediction.timeToPrediction.toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div>
            <p className="text-2xl font-bold text-accent mb-2">{valueDisplay}</p>
            {prediction.reasoning && <p className="text-xs text-muted-foreground mb-3">{prediction.reasoning}</p>}
        </div>
        <div className="mt-auto">
            <div className="text-xs text-muted-foreground mb-1">Confidence: {confidencePercent.toFixed(0)}%</div>
            <Progress 
                value={confidencePercent} 
                className="h-2"
                // Apply the indicator color class via the dedicated prop
                indicatorClassName={
                    confidencePercent < 50 ? "bg-red-500" :
                    confidencePercent < 75 ? "bg-orange-500" :
                    "bg-green-500"
                }
            />
        </div>
      </CardContent>
    </Card>
  );
}

// Remove helper declaration for Progress indicator color
// It's no longer needed as the prop is handled correctly now
// declare module "react" {
//     interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
//       indicatorClassName?: string;
//     }
// }
