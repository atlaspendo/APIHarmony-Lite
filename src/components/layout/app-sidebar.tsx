
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const navItems = [
  { href: "/", label: "Home / Import", icon: Icons.Home },
  { href: "/dashboard", label: "API Dashboard", icon: Icons.LayoutDashboard },
  { href: "/generate-documentation", label: "Generate Documentation", icon: Icons.FilePlus2 },
  { href: "/documentation", label: "View API Documentation", icon: Icons.BookOpen },
  { href: "/dependency-graph", label: "Dependency Graph", icon: Icons.GitFork },
  { href: "/integration-analysis", label: "Integration Analysis", icon: Icons.ListChecks },
  { href: "/health-monitoring", label: "Health Monitoring", icon: Icons.Activity },
  { href: "/vulnerability-scan", label: "Vulnerability Scan", icon: Icons.ShieldAlert },
  { href: "/compliance-check", label: "Compliance Check", icon: Icons.ShieldCheck },
  // { href: "/settings", label: "Settings", icon: Icons.Settings }, // Example for future use
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed inset-y-0 left-0 z-20 flex h-full w-16 flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out">
        <nav className="flex flex-col items-center gap-4 px-2 py-4">
          <Link
            href="/"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            aria-label="API Harmony Lite Home"
          >
            <Icons.Zap className="h-5 w-5 transition-all group-hover:scale-110" />
          </Link>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link href={item.href} legacyBehavior passHref>
                  <Button
                    variant={pathname === item.href ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                      "rounded-lg w-10 h-10",
                      pathname === item.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    aria-label={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
