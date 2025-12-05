'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

/**
 * AuthGuard component to protect routes
 * Redirects to login if user is not authenticated
 */
export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // If on login page and already authenticated, redirect to dashboard
      if (pathname === '/login') {
        if (isAuthenticated()) {
          try {
            // Verify token is still valid
            await getCurrentUser();
            router.push('/');
            return;
          } catch (error) {
            // Token is invalid, allow access to login page
            setIsLoading(false);
            return;
          }
        }
        setIsLoading(false);
        return;
      }

      // For protected routes, check authentication
      if (isAuthenticated()) {
        try {
          // Verify token is still valid
          await getCurrentUser();
          setIsAuth(true);
        } catch (error) {
          // Token is invalid, redirect to login
          router.push('/login');
        }
      } else {
        // Not authenticated, redirect to login
        router.push('/login');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render children if not authenticated (except on login page)
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!isAuth) {
    return null;
  }

  return <>{children}</>;
}

