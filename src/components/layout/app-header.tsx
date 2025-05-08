
"use client";
import { Icons } from "@/components/icons";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Icons.Zap className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold text-primary">API Harmony Lite</h1>
      </div>
      {/* Future additions: User menu, theme toggle */}
    </header>
  );
}
