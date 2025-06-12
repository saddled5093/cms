"use client";
import type { ReactNode } from 'react';
import Header from '@/components/layout/header'; // Import Header

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header /> {/* Add Header here */}
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
