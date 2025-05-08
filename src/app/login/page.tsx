
"use client";

import { LoginForm } from '@/components/auth/login-form';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icons } from '@/components/icons';

export default function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // This effect runs after hydration, ensuring localStorage is accessible
    if (isAuthenticated) {
      router.replace('/dashboard'); 
    } else {
      setIsCheckingAuth(false);
    }
  }, [isAuthenticated, router]);

  if (isCheckingAuth || isAuthenticated) { 
    // Show loader if checking or if authenticated and about to redirect
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Icons.Loader className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <LoginForm />
    </div>
  );
}
