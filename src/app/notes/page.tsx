
"use client";
// This page is deprecated and will be removed.
// Redirect to /my-notes or /all-notes based on user preference or a default.
// For now, let's just make it a simple redirect to /all-notes for simplicity,
// or it can be removed entirely if navigation is updated.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NotesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Default redirect to all notes, or could be my-notes if user is logged in.
    router.replace('/all-notes'); 
  }, [router]);

  return (
    <div className="container mx-auto p-4 md:p-8 text-center flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-lg text-foreground">در حال هدایت به لیست یادداشت‌ها...</p>
    </div>
  );
}
