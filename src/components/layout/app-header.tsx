
"use client";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export function AppHeader() {
  const { logout, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6 shadow-md"> {/* Changed shadow-sm to shadow-md */}
      <div className="flex items-center gap-2">
        {/* The Zap icon and title are now primarily in the sidebar header */}
        {/* This header can be simpler or hold page-specific titles or actions if needed */}
         <div className="flex items-center gap-2">
          {/* Removed Icon and Title from here as it's prominent in sidebar */}
        </div>
      </div>
      {isAuthenticated && (
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <Icons.LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      )}
    </header>
  );
}
