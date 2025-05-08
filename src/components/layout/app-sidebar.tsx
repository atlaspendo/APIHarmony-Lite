
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home / Import", icon: Icons.Home },
  { href: "/dashboard", label: "API Dashboard", icon: Icons.LayoutDashboard },
  { href: "/generate-documentation", label: "Generate API Doc", icon: Icons.FilePlus2 },
  { href: "/documentation", label: "View API Doc", icon: Icons.BookOpen },
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
    <aside className="fixed inset-y-0 left-0 z-20 flex h-full w-60 flex-col border-r bg-sidebar text-sidebar-foreground">
      <nav className="flex flex-col gap-2 px-3 py-4">
        <Link
          href="/"
          className="group mb-4 flex h-12 items-center justify-start gap-3 rounded-md px-3 py-2 text-lg font-semibold text-primary-foreground md:text-base bg-primary"
          aria-label="API Harmony Lite Home"
        >
          <Icons.Zap className="h-6 w-6 shrink-0 transition-all group-hover:scale-110" />
          <span className="font-semibold">API Harmony</span>
        </Link>
        {navItems.map((item) => (
          <Link href={item.href} key={item.href} legacyBehavior passHref>
            <Button
              variant={pathname === item.href ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-left h-10 px-3 py-2",
                pathname === item.href
                  ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              aria-label={item.label}
            >
              <item.icon className="mr-3 h-5 w-5 shrink-0" />
              <span className="text-sm">{item.label}</span>
            </Button>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
