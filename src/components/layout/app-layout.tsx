"use client"; // Required because Header might eventually need client features or its children might
import type { ReactNode } from 'react';
// Header is now part of page.tsx to handle button click state.
// If Header were purely static, it could be here.

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header is rendered in page.tsx or specific layout wrappers that need its interactive elements */}
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-6 md:px-8 md:py-0 bg-background border-t border-border/40">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with ❤️.
          </p>
        </div>
      </footer>
    </div>
  );
}
