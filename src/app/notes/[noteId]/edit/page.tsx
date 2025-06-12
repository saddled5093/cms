
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Note, Category } from '@/types';
import type { NoteFormData } from "@/components/note-form";
import NoteForm from '@/components/note-form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { parseISO, isValid as isValidDateFn } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function EditNotePage() {
  const { noteId } = useParams<{ noteId: string }>();
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [note, setNote] = useState<Note | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showTick, setShowTick] = useState(false);
  const formRef = useRef<{ submit: () => void }>(null); // To trigger form submission

  const processFetchedNote = (fetchedNote: any): Note => {
    let eventDt = fetchedNote.eventDate ? parseISO(fetchedNote.eventDate) : new Date();
    if (!isValidDateFn(eventDt)) eventDt = new Date();
    return {
      ...fetchedNote,
      eventDate: eventDt,
      createdAt: parseISO(fetchedNote.createdAt),
      updatedAt: parseISO(fetchedNote.updatedAt),
      categories: Array.isArray(fetchedNote.categories) ? fetchedNote.categories : [],
      tags: Array.isArray(fetchedNote.tags) ? fetchedNote.tags : (typeof fetchedNote.tags === 'string' ? JSON.parse(fetchedNote.tags || "[]") : []),
      phoneNumbers: Array.isArray(fetchedNote.phoneNumbers) ? fetchedNote.phoneNumbers : (typeof fetchedNote.phoneNumbers === 'string' ? JSON.parse(fetchedNote.phoneNumbers || "[]") : []),
    };
  };

  const fetchNoteAndCategories = useCallback(async () => {
    if (!noteId || !currentUser) {
      setIsLoading(false);
      if (!currentUser) router.push('/login');
      return;
    }
    setIsLoading(true);
    try {
      const [noteResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/notes/${noteId}`),
        fetch('/api/categories')
      ]);

      if (!noteResponse.ok) {
        if (noteResponse.status === 404) toast({ title: "خطا", description: "یادداشت مورد نظر یافت نشد.", variant: "destructive" });
        else throw new Error('Failed to fetch note details');
        setNote(null);
      } else {
        const noteData = await noteResponse.json();
        setNote(processFetchedNote(noteData));
      }

      if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
      const categoriesData: Category[] = await categoriesResponse.json();
      setAvailableCategories(categoriesData.map(c => ({...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt)})).sort((a,b)=>a.name.localeCompare(b.name, 'fa')));

    } catch (error: any) {
      console.error("Failed to load data for edit page", error);
      toast({ title: "خطا", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [noteId, currentUser, toast, router]);

  useEffect(() => {
    fetchNoteAndCategories();
  }, [fetchNoteAndCategories]);

  const handleUpdateNote = async (data: NoteFormData) => {
    if (!note || !currentUser) {
      toast({ title: "خطا", description: "امکان به‌روزرسانی یادداشت وجود ندارد.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const payload = {
      ...data, // This comes from NoteForm, already processed for tags/phoneNumbers arrays
      authorId: note.authorId || currentUser.id,
      eventDate: data.eventDate.toISOString(),
    };

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to update note');
      }
      const updatedNoteRaw = await response.json();
      setNote(processFetchedNote(updatedNoteRaw)); // Update local state if needed
      toast({ title: "یادداشت با موفقیت به‌روزرسانی شد." });
      if (!isAutoSaveEnabled) { // Only navigate if not auto-saving
         router.push(`/notes/${note.id}`);
      }
      return true; // Indicate success for auto-save
    } catch (error: any) {
      console.error("Failed to update note:", error);
      toast({ title: "خطا در به‌روزرسانی یادداشت", description: error.message, variant: "destructive" });
      return false; // Indicate failure for auto-save
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-save timer logic
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (isAutoSaveEnabled && noteId) { // Only run if auto-save is on and it's an edit page
      timerId = setInterval(async () => {
        setCountdown(prevCountdown => {
          if (prevCountdown <= 1) {
            // Trigger form submission via ref
            if (formRef.current?.submit) {
               formRef.current.submit(); // This will call handleUpdateNote
               setShowTick(true);
               setTimeout(() => setShowTick(false), 2000); // Show tick for 2s
            }
            return 10; // Reset countdown
          }
          return prevCountdown - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [isAutoSaveEnabled, noteId, handleUpdateNote]); // handleUpdateNote added as dependency

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg text-foreground">در حال بارگذاری فرم ویرایش...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <p className="text-xl text-destructive mb-4">یادداشت برای ویرایش یافت نشد.</p>
        <Button variant="outline" onClick={() => router.push('/notes')}>
          <ArrowLeft className="ml-2 h-4 w-4" />
          بازگشت به لیست یادداشت‌ها
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-headline text-primary">ویرایش یادداشت: {note.title}</h1>
        <Button variant="outline" onClick={() => router.push(`/notes/${noteId}`)}>
          <ArrowLeft className="ml-2 h-4 w-4" />
          انصراف و بازگشت به جزئیات
        </Button>
      </div>
       <div className="mb-4 p-3 border rounded-md bg-card flex items-center justify-end gap-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch
              id="autosave-toggle"
              checked={isAutoSaveEnabled}
              onCheckedChange={setIsAutoSaveEnabled}
            />
            <Label htmlFor="autosave-toggle" className="text-sm">ذخیره خودکار (هر ۱۰ ثانیه)</Label>
          </div>
          <div className="text-sm text-muted-foreground w-20 text-right">
             {isAutoSaveEnabled && !showTick && <span>{countdown} ثانیه</span>}
             {isAutoSaveEnabled && showTick && <CheckCircle className="h-5 w-5 text-green-500 inline" />}
             {!isAutoSaveEnabled && <AlertTriangle className="h-5 w-5 text-yellow-500 inline" title="ذخیره خودکار غیرفعال است" />}
          </div>
        </div>
      <NoteForm
        onSubmit={handleUpdateNote}
        initialData={note}
        availableCategories={availableCategories}
        isSubmitting={isSubmitting}
        formRef={formRef} // Pass ref to NoteForm
        formMode="edit"
      />
    </div>
  );
}

    