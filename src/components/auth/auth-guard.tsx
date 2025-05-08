
"use client";

import { useAuthStore } from '@/stores/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Icons } from '@/components/icons'; 

export function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // This effect runs after hydration, ensuring localStorage is accessible for persist middleware
    if (!isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    } else {
      setIsVerifying(false);
    }
  }, [isAuthenticated, router, pathname]);

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Icons.Loader className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If authenticated, or if on the login page (which doesn't need this guard to redirect itself), render children
  return <>{children}</>;
}
