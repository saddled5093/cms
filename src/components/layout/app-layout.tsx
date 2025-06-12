
"use client";
import type { ReactNode } from 'react';
import Header from '@/components/layout/header';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react'; // For loading spinner

export default function AppLayout({ children }: { children: ReactNode }) {
  const { currentUser, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">در حال بارگذاری برنامه...</p>
      </div>
    );
  }

  // If not logged in and not on the login page, don't render the main layout.
  // AuthContext's useEffect will handle redirection.
  if (!currentUser && pathname !== '/login') {
     // Render nothing or a minimal loading/redirecting state while AuthContext handles redirection.
     // This prevents flashing the layout before redirection.
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-foreground">در حال بررسی وضعیت ورود...</p>
        </div>
    );
  }

  // If on the login page, just render children (which is the LoginPage itself)
  if (pathname === '/login') {
    return <>{children}</>;
  }
  
  // If logged in, render the full app layout
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-6 md:px-8 md:py-0 bg-background border-t border-border/40">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            .با ❤️ ساخته شده است
          </p>
        </div>
      </footer>
    </div>
  );
}
