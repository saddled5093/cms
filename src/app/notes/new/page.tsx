
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@/types';
import type { NoteFormData } from "@/components/note-form";
import NoteForm from '@/components/note-form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function NewNotePage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Autosave states (UI only for new page, functionality for edit page)
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showTick, setShowTick] = useState(false);


  const fetchAvailableCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories for form');
      const data: Category[] = await response.json();
      setAvailableCategories(data.map(c => ({...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt)})).sort((a,b)=>a.name.localeCompare(b.name, 'fa')));
    } catch (error) {
      console.error("Failed to load categories for form", error);
      toast({ title: "خطا در بارگذاری دسته‌بندی‌ها", description: "لیست دسته‌بندی‌ها برای فرم بارگذاری نشد.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (currentUser) {
      fetchAvailableCategories();
    } else {
      router.push('/login'); // Redirect if not logged in
    }
  }, [currentUser, fetchAvailableCategories, router]);

  const handleSaveNewNote = async (data: NoteFormData) => {
    if (!currentUser) {
      toast({ title: "خطا", description: "برای ایجاد یادداشت باید وارد شوید.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const payload = {
      ...data,
      authorId: currentUser.id,
      eventDate: data.eventDate.toISOString(),
    };

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to save new note');
      }
      const savedNote = await response.json();
      toast({ title: "یادداشت جدید با موفقیت ایجاد شد." });
      router.push(`/notes/${savedNote.id}`); // Navigate to the detail page of the new note
    } catch (error: any) {
      console.error("Failed to save new note:", error);
      toast({ title: "خطا در ایجاد یادداشت جدید", description: error.message, variant: "destructive" });
      setIsLoading(false);
    }
    // setIsLoading(false) is handled in finally if successful navigation occurs
  };
  
  if (isLoading && !availableCategories.length) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg text-foreground">در حال بارگذاری فرم...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-headline text-primary">ایجاد یادداشت جدید</h1>
        <Button variant="outline" onClick={() => router.push('/notes')}>
          <ArrowLeft className="ml-2 h-4 w-4" />
          انصراف و بازگشت به لیست
        </Button>
      </div>
       <div className="mb-4 p-3 border rounded-md bg-card flex items-center justify-end gap-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch
              id="autosave-toggle-new"
              checked={isAutoSaveEnabled}
              onCheckedChange={setIsAutoSaveEnabled}
              disabled={true} // Auto-save not functional for new notes until first save
            />
            <Label htmlFor="autosave-toggle-new" className="text-sm text-muted-foreground">ذخیره خودکار (هر ۱۰ ثانیه)</Label>
          </div>
          <div className="text-sm text-muted-foreground w-20 text-right">
             {isAutoSaveEnabled && !showTick && <span>{countdown} ثانیه</span>}
             {isAutoSaveEnabled && showTick && <CheckCircle className="h-5 w-5 text-green-500 inline" />}
             {!isAutoSaveEnabled && <AlertTriangle className="h-5 w-5 text-yellow-500 inline" title="ذخیره خودکار غیرفعال است" />}
          </div>
        </div>
      <NoteForm
        onSubmit={handleSaveNewNote}
        availableCategories={availableCategories}
        isSubmitting={isLoading} 
        formMode="create"
      />
    </div>
  );
}

    