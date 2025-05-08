
"use client";

import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemHealthItemProps {
  name: string;
  status: "Healthy" | "Warning" | "Critical" | "Unknown";
  details: string;
  Icon?: LucideIcon; // Optional icon for the service
}

export function SystemHealthItem({ name, status, details, Icon = Icons.Server }: SystemHealthItemProps) {
  const getStatusVariant = (): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "Healthy":
        return "default"; // Will use primary color if not styled further
      case "Warning":
        return "secondary"; // Orange-like, check globals.css for --chart-3
      case "Critical":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusColorClass = () => {
     switch (status) {
      case "Healthy":
        return "bg-green-500 hover:bg-green-600 text-white"; 
      case "Warning":
        return "bg-orange-500 hover:bg-orange-600 text-white";
      default: // Critical and Unknown
        return ""; // Uses default badge variant colors
    }
  }


  return (
    <div className="flex items-center justify-between p-3 bg-card hover:bg-muted/50 rounded-md transition-colors border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{details}</p>
        </div>
      </div>
      <Badge variant={getStatusVariant()} className={cn("text-xs", getStatusColorClass())}>
        {status}
      </Badge>
    </div>
  );
}

