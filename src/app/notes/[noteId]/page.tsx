
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } 
from 'next/navigation';
import type { Note, Category, Comment as CommentType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input'; // Keep for general input if needed, but rating changes
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, Edit3, Trash2, MessageSquare, Star, Send, CalendarDays, MapPin, Folder, Tag, Phone, Eye, EyeOff, Archive, ArchiveRestore, XCircle } from 'lucide-react';
import { format as formatJalali } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import { parseISO, isValid as isValidDateFn } from 'date-fns';
import Link from 'next/link';
import ConfirmDialog from '@/components/confirm-dialog';
import InteractiveDateDisplay from '@/components/interactive-date-display'; // Import new component

export default function NoteDetailPage() {
  const { noteId } = useParams<{ noteId: string }>();
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // isEditing state is removed, navigation handles edits
  
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false); // Retained for comment loading

  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<1 | 2>(1);

  const DATE_DISPLAY_FORMAT = 'yyyy/M/d HH:mm';

  const processFetchedNote = (fetchedNote: any): Note => {
    let eventDt = fetchedNote.eventDate ? parseISO(fetchedNote.eventDate) : (fetchedNote.createdAt ? parseISO(fetchedNote.createdAt) : new Date());
    if (!isValidDateFn(eventDt)) eventDt = new Date();
    let createdDt = fetchedNote.createdAt ? parseISO(fetchedNote.createdAt) : new Date();
    if (!isValidDateFn(createdDt)) createdDt = new Date();
    let updatedDt = fetchedNote.updatedAt ? parseISO(fetchedNote.updatedAt) : new Date();
    if (!isValidDateFn(updatedDt)) updatedDt = new Date();
  
    return {
      ...fetchedNote,
      eventDate: eventDt,
      createdAt: createdDt,
      updatedAt: updatedDt,
      categories: Array.isArray(fetchedNote.categories)
        ? fetchedNote.categories.map((c: any) => (typeof c === 'string' ? { id: c, name: c } : (c && c.name ? c : { id: String(c), name: String(c) })))
        : [],
      tags: Array.isArray(fetchedNote.tags) ? fetchedNote.tags : (typeof fetchedNote.tags === 'string' ? JSON.parse(fetchedNote.tags || "[]") : []),
      phoneNumbers: Array.isArray(fetchedNote.phoneNumbers) ? fetchedNote.phoneNumbers : (typeof fetchedNote.phoneNumbers === 'string' ? JSON.parse(fetchedNote.phoneNumbers || "[]") : []),
      province: fetchedNote.province || "",
      rating: fetchedNote.rating ?? 0,
      comments: (fetchedNote.comments || []).map((comment: any) => ({
        ...comment,
        author: comment.author || { username: 'ناشناس', id: 'unknown'},
        createdAt: comment.createdAt ? parseISO(comment.createdAt) : new Date(),
        updatedAt: comment.updatedAt ? parseISO(comment.updatedAt) : new Date(),
      })).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    };
  };

  const fetchNoteDetails = useCallback(async () => {
    if (!noteId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/notes/${noteId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({ title: "خطا", description: "یادداشت مورد نظر یافت نشد.", variant: "destructive" });
          setNote(null); 
        } else {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to fetch note details');
        }
      } else {
        const data = await response.json();
        const processed = processFetchedNote(data);
        setNote(processed);
        setComments(processed.comments || []);
      }
    } catch (error: any) {
      console.error("Failed to load note details", error);
      toast({ title: "خطا", description: error.message, variant: "destructive" });
      setNote(null);
    } finally {
      setIsLoading(false);
    }
  }, [noteId, toast]);


  useEffect(() => {
    fetchNoteDetails();
    // No need to fetch available categories here unless needed for something else on this page
  }, [fetchNoteDetails]);


  const handleRatingSubmit = async (ratingValue: number) => {
    if (!note || ratingValue < 0 || ratingValue > 5) {
      toast({ title: "خطا", description: "امتیاز باید بین ۰ و ۵ باشد.", variant: "destructive"});
      return;
    }
    if (currentUser?.role === "ADMIN") {
      try {
        const response = await fetch(`/api/notes/${note.id}/rating`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: ratingValue }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'Failed to update rating');
        }
        const updatedNoteRaw = await response.json();
        setNote(processFetchedNote(updatedNoteRaw)); // Update local state
        toast({ title: "موفقیت", description: `امتیاز یادداشت به ${ratingValue} تغییر کرد.` });
      } catch (error: any) {
         toast({ title: "خطا", description: error.message || "ثبت امتیاز با مشکل مواجه شد.", variant: "destructive"});
      }
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note || !newComment.trim() || !currentUser) return;
    try {
      const response = await fetch(`/api/notes/${note.id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newComment, authorId: currentUser.id }),
      });
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to add comment');
      }
      const newCommentRaw = await response.json();
      const newCommentData: CommentType = {
          ...newCommentRaw,
          createdAt: parseISO(newCommentRaw.createdAt),
          updatedAt: parseISO(newCommentRaw.updatedAt),
          author: { username: currentUser.username }, // Add author from current user
      };
      setComments(prev => [...prev, newCommentData].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      setNewComment("");
      toast({ title: "موفقیت", description: "نظر شما ثبت شد." });
    } catch (error: any) {
      toast({ title: "خطا", description: error.message || "ثبت نظر با مشکل مواجه شد.", variant: "destructive"});
    }
  };

  const handleDeleteRequest = () => {
    if (note) {
      setNoteToDeleteId(note.id);
      setDeleteConfirmationStep(1);
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmationStep === 1) {
      setDeleteConfirmationStep(2);
    } else if (deleteConfirmationStep === 2 && noteToDeleteId) {
      try {
        const response = await fetch(`/api/notes/${noteToDeleteId}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || "Failed to delete note from server");
        }
        toast({ title: "یادداشت حذف شد" });
        router.push('/notes'); 
      } catch (error: any) {
        console.error("Failed to delete note:", error);
        toast({ title: "خطا در حذف یادداشت", description: error.message, variant: "destructive" });
      }
      setNoteToDeleteId(null);
      setDeleteConfirmationStep(1);
    }
  };
  
  const cancelDelete = () => {
    setNoteToDeleteId(null);
    setDeleteConfirmationStep(1);
  };

  const handleToggleArchive = async () => {
    if (!note) return;
    const newArchivedState = !note.isArchived;
    try {
        const response = await fetch(`/api/notes/${note.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...note, eventDate: (note.eventDate as Date).toISOString(), isArchived: newArchivedState, categoryIds: note.categories.map(c => c.id) }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || "Failed to update archive status");
        }
        const updatedNoteRaw = await response.json();
        setNote(processFetchedNote(updatedNoteRaw));
        toast({ title: `یادداشت ${newArchivedState ? "آرشیو شد" : "از آرشیو خارج شد" }` });
    } catch (error: any) {
        console.error("Failed to toggle archive status:", error);
        toast({ title: "خطا در تغییر وضعیت آرشیو", description: error.message, variant: "destructive" });
    }
  };

  const handleTogglePublish = async () => {
    if (!note) return;
    const newPublishedState = !note.isPublished;
    try {
         const response = await fetch(`/api/notes/${note.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...note, eventDate: (note.eventDate as Date).toISOString(), isPublished: newPublishedState, categoryIds: note.categories.map(c => c.id) }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || "Failed to update publish status");
        }
        const updatedNoteRaw = await response.json();
        setNote(processFetchedNote(updatedNoteRaw));
        toast({ title: `وضعیت انتشار یادداشت ${newPublishedState ? "به 'منتشر شده' تغییر کرد" : "به 'عدم انتشار' تغییر کرد" }` });
    } catch (error: any) {
        console.error("Failed to toggle publish status:", error);
        toast({ title: "خطا در تغییر وضعیت انتشار", description: error.message, variant: "destructive" });
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg text-foreground">در حال بارگذاری جزئیات یادداشت...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <p className="text-xl text-destructive mb-4">یادداشت مورد نظر یافت نشد.</p>
        <Button asChild variant="outline">
          <Link href="/notes">
            <ArrowLeft className="ml-2 h-4 w-4" />
            بازگشت به لیست یادداشت‌ها
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/notes')}>
          <ArrowLeft className="ml-2 h-4 w-4" />
          بازگشت به لیست یادداشت‌ها
        </Button>
      </div>

      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <CardTitle className="text-3xl font-headline text-primary mb-2 sm:mb-0">{note.title}</CardTitle>
            <div className="flex gap-2 items-center flex-wrap">
                <Button variant="outline" size="sm" asChild className="text-accent hover:text-accent/80">
                    <Link href={`/notes/${note.id}/edit`}>
                        <Edit3 className="ml-2 h-4 w-4" />
                        ویرایش
                    </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeleteRequest} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف
                </Button>
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleArchive} aria-label={note.isArchived ? "بازیابی یادداشت" : "آرشیو یادداشت"}>
                    {note.isArchived ? <ArchiveRestore className="h-5 w-5 text-muted-foreground hover:text-foreground" /> : <Archive className="h-5 w-5 text-muted-foreground hover:text-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleTogglePublish} aria-label={note.isPublished ? "لغو انتشار یادداشت" : "انتشار یادداشت"}>
                    {note.isPublished ? <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />}
                </Button>
            </div>
          </div>
          <CardDescription className="text-sm text-muted-foreground mt-2 space-y-1">
            <div>
                ایجاد شده توسط: {note.author?.username || 'ناشناس'} در <InteractiveDateDisplay date={note.createdAt} format={DATE_DISPLAY_FORMAT} />
            </div>
            <div>
                آخرین بروزرسانی: <InteractiveDateDisplay date={note.updatedAt} format={DATE_DISPLAY_FORMAT} />
            </div>
          </CardDescription>
          <div className="flex gap-1.5 mt-2 flex-wrap items-center">
              {note.isArchived && <Badge variant="secondary" className="text-xs bg-muted/60 text-muted-foreground">آرشیو شده</Badge>}
              {note.isPublished && <Badge variant="default" className="text-xs bg-accent/80 text-accent-foreground">منتشر شده</Badge>}
              {typeof note.rating === 'number' && note.rating > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-500"/> {note.rating}
                </Badge>
              )}
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-foreground mb-1 flex items-center"><CalendarDays className="ml-2 h-4 w-4 text-muted-foreground"/>تاریخ رویداد</h3>
            <p className="text-foreground/90">{note.eventDate && isValidDateFn(note.eventDate) ? formatJalali(new Date(note.eventDate), DATE_DISPLAY_FORMAT, { locale: faIR }) : 'ثبت نشده'}</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">محتوا</h3>
            <p className="text-foreground/90 whitespace-pre-wrap break-words bg-muted/20 p-3 rounded-md">{note.content}</p>
          </div>

          {note.province && (
            <div>
              <h3 className="font-semibold text-foreground mb-1 flex items-center"><MapPin className="ml-2 h-4 w-4 text-muted-foreground"/>استان</h3>
              <p className="text-foreground/90">{note.province}</p>
            </div>
          )}

          {note.categories && note.categories.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-1 flex items-center"><Folder className="ml-2 h-4 w-4 text-muted-foreground"/>دسته‌بندی‌ها</h3>
              <div className="flex flex-wrap gap-2">
                {note.categories.map(category => (
                  <Badge key={category.id} variant="secondary">{category.name}</Badge>
                ))}
              </div>
            </div>
          )}

          {note.tags && note.tags.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-1 flex items-center"><Tag className="ml-2 h-4 w-4 text-muted-foreground"/>تگ‌ها</h3>
              <div className="flex flex-wrap gap-2">
                {note.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {note.phoneNumbers && note.phoneNumbers.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-1 flex items-center"><Phone className="ml-2 h-4 w-4 text-muted-foreground"/>شماره‌های تلفن</h3>
              <div className="flex flex-wrap gap-2">
                {note.phoneNumbers.map(pn => (
                  <Badge key={pn} variant="outline" className="font-mono">{pn}</Badge>
                ))}
              </div>
            </div>
          )}

          {currentUser?.role === "ADMIN" && (
            <div className="pt-4 border-t border-border/40">
              <label className="block text-sm font-medium text-foreground mb-2">امتیاز مدیر (۰-۵):</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <Button
                    key={starValue}
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRatingSubmit(starValue)}
                    aria-label={`امتیاز ${starValue} از 5`}
                    className="p-1"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors duration-150 ${
                        (note.rating || 0) >= starValue
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-muted-foreground hover:text-yellow-300'
                      }`}
                    />
                  </Button>
                ))}
                 {(note.rating || 0) > 0 && (
                    <Button variant="ghost" size="icon" onClick={() => handleRatingSubmit(0)} className="p-1 h-7 w-7 text-xs text-muted-foreground hover:text-destructive" aria-label="حذف امتیاز">
                        <XCircle className="h-4 w-4" />
                    </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 border-t border-border/40 pt-6">
             <h3 className="text-lg font-semibold text-foreground flex items-center">
                <MessageSquare className="ml-2 h-5 w-5" />
                نظرات ({comments.length})
            </h3>
            {isLoadingComments && <p className="text-sm text-muted-foreground">در حال بارگذاری نظرات...</p>}
            {!isLoadingComments && comments.length > 0 ? (
            <div className="space-y-3 max-h-72 w-full overflow-y-auto pr-2">
                {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-muted/30 rounded-md">
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                    توسط: {comment.author.username} در <InteractiveDateDisplay date={comment.createdAt} format={DATE_DISPLAY_FORMAT} />
                    </p>
                </div>
                ))}
            </div>
            ) : (
            !isLoadingComments && <p className="text-sm text-muted-foreground">هنوز نظری ثبت نشده است.</p>
            )}

            {currentUser && (
            <form onSubmit={handleCommentSubmit} className="mt-2 flex gap-2 w-full">
                <Textarea
                placeholder="نظر خود را بنویسید..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-grow bg-input text-foreground placeholder:text-muted-foreground text-sm min-h-[70px]"
                rows={2}
                />
                <Button type="submit" size="sm" className="self-end bg-primary hover:bg-primary/80 text-primary-foreground">
                <Send className="ml-2 h-4 w-4" />
                ارسال
                </Button>
            </form>
            )}
        </CardFooter>
      </Card>

       <ConfirmDialog
          isOpen={!!noteToDeleteId}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title={deleteConfirmationStep === 1 ? "حذف یادداشت" : "تأیید نهایی حذف"}
          description={
            deleteConfirmationStep === 1
              ? "آیا از حذف این یادداشت مطمئن هستید؟ این عمل، نظرات مرتبط را نیز حذف خواهد کرد."
              : "این عمل غیرقابل بازگشت است و یادداشت و تمام نظرات آن برای همیشه حذف خواهند شد. آیا کاملاً مطمئن هستید؟"
          }
        />
    </div>
  );
}


    