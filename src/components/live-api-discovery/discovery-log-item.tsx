
import type { LucideIcon } from "lucide-react";
import { Icons } from "@/components/icons";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: "info" | "success" | "warning" | "error" | "system";
  details?: string;
}

interface DiscoveryLogItemProps {
  log: LogEntry;
}

export function DiscoveryLogItem({ log }: DiscoveryLogItemProps) {
  const { timestamp, message, type, details } = log;

  let Icon: LucideIcon;
  let colorClass: string;

  switch (type) {
    case "success":
      Icon = Icons.CheckCircle2;
      colorClass = "text-green-500";
      break;
    case "warning":
      Icon = Icons.AlertTriangle;
      colorClass = "text-orange-500";
      break;
    case "error":
      Icon = Icons.XCircle;
      colorClass = "text-destructive";
      break;
    case "system":
      Icon = Icons.Settings;
      colorClass = "text-blue-500";
      break;
    case "info":
    default:
      Icon = Icons.Info;
      colorClass = "text-muted-foreground";
      break;
  }

  return (
    <div className={cn("flex items-start gap-2 p-1.5 border-b border-dashed border-border/50 last:border-b-0", colorClass)}>
      <Icon className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", colorClass)} />
      <div className="flex-grow">
        <p className="leading-snug">
          <span className="text-muted-foreground/80 mr-1.5 text-[0.7rem]">
            [{format(timestamp, 'HH:mm:ss.SSS')}]
          </span>
          <span className={cn(type === "error" || type === "system" ? "font-medium" : "")}>{message}</span>
        </p>
        {details && (
          <p className="text-muted-foreground/70 text-[0.7rem] pl-2 mt-0.5 leading-tight">{details}</p>
        )}
      </div>
    </div>
  );
}
