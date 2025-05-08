
"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface AnomalyItemProps {
  title: string;
  description: string;
  severity: "High" | "Medium" | "Low" | "Info";
  timestamp?: string;
  detailsLink?: string; // Optional link for more details
}

export function AnomalyItem({ title, description, severity, timestamp, detailsLink }: AnomalyItemProps) {
  const Icon = severity === "High" || severity === "Medium" ? AlertTriangle : severity === "Low" ? Info : CheckCircle2;
  const iconColor = severity === "High" ? "text-destructive" : severity === "Medium" ? "text-orange-500" : severity === "Low" ? "text-yellow-500" : "text-blue-500";

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-1 flex-shrink-0 ${iconColor}`} />
        <div className="flex-grow">
          <h4 className="font-semibold text-md">{title}</h4>
          {timestamp && <p className="text-xs text-muted-foreground mb-1">{timestamp}</p>}
          <p className="text-sm text-muted-foreground">{description}</p>
          {detailsLink && (
            <Button variant="link" size="sm" asChild className="p-0 h-auto mt-2 text-primary">
              <a href={detailsLink} target="_blank" rel="noopener noreferrer">
                View Details <Icons.ExternalLink className="ml-1 w-3 h-3" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
