
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Note, Comment as CommentType } from "@/types";
import { Edit3, Trash2, Folder, Tag, MapPin, Phone, Archive, ArchiveRestore, Eye, EyeOff, CalendarDays, MessageSquare, Star, Send } from "lucide-react";
import { format as formatJalali } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
// UserRole enum is not imported anymore, comparisons will be string-based

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onTogglePublish: (noteId: string) => void;
  onRatingChange: (noteId: string, rating: number) => Promise<void>; // Callback for rating change
  onCommentAdd: (noteId: string, content: string) => Promise<void>; // Callback for adding comment
}

export default function NoteCard({ note, onEdit, onDelete, onToggleArchive, onTogglePublish, onRatingChange, onCommentAdd }: NoteCardProps) {
  const MAX_CONTENT_PREVIEW_LENGTH = 150;
  const displayContent = note.content.length > MAX_CONTENT_PREVIEW_LENGTH
    ? `${note.content.substring(0, MAX_CONTENT_PREVIEW_LENGTH)}...`
    : note.content;

  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [currentRating, setCurrentRating] = useState<number>(note.rating || 0);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<CommentType[]>(note.comments || []);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!note.id) return;
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/notes/${note.id}/comments`);
      if (response.ok) {
        const fetchedComments: CommentType[] = await response.json();
        setComments(fetchedComments.map(c => ({...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) })));
      } else {
        console.error("Failed to fetch comments for note:", note.id);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [note.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);
  
  useEffect(() => {
    setCurrentRating(note.rating || 0);
  }, [note.rating]);

  useEffect(() => {
    setComments(note.comments || []);
  }, [note.comments]);


  const handleRatingSubmit = async (ratingValue: number) => {
    if (ratingValue < 0 || ratingValue > 5) {
      toast({ title: "خطا", description: "امتیاز باید بین ۰ و ۵ باشد.", variant: "destructive"});
      return;
    }
    if (currentUser?.role === "ADMIN") { // Changed to string comparison
      try {
        await onRatingChange(note.id, ratingValue);
        setCurrentRating(ratingValue); // Optimistic update
        toast({ title: "موفقیت", description: `امتیاز یادداشت به ${ratingValue} تغییر کرد.` });
      } catch (error) {
         toast({ title: "خطا", description: "ثبت امتیاز با مشکل مواجه شد.", variant: "destructive"});
      }
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    try {
      await onCommentAdd(note.id, newComment);
      setNewComment("");
      // Refetch comments or optimistically update
      await fetchComments(); 
      toast({ title: "موفقیت", description: "نظر شما ثبت شد." });
    } catch (error) {
      toast({ title: "خطا", description: "ثبت نظر با مشکل مواجه شد.", variant: "destructive"});
    }
  };


  return (
    <div className="flex flex-col p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 bg-card text-card-foreground w-full border border-border">
      {/* Note Content and Metadata */}
      <div className="flex flex-col md:flex-row items-start md:items-center w-full">
        <div className="flex-grow space-y-2 mb-3 md:mb-0 md:mr-4 rtl:md:ml-4 rtl:md:mr-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <h2 className="font-headline text-xl text-primary mb-1 sm:mb-0">{note.title}</h2>
            <div className="flex gap-1.5 mt-1 sm:mt-0 flex-wrap items-center">
              {note.isArchived && <Badge variant="secondary" className="text-xs bg-muted/60 text-muted-foreground">آرشیو شده</Badge>}
              {note.isPublished && <Badge variant="default" className="text-xs bg-accent/80 text-accent-foreground">منتشر شده</Badge>}
              {typeof note.rating === 'number' && note.rating > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-500"/> {note.rating}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center text-sm text-foreground/80 pt-0.5">
            <CalendarDays className="ml-2 h-4 w-4 text-muted-foreground" />
            <span>تاریخ رویداد: {note.eventDate ? formatJalali(new Date(note.eventDate), "PPP", { locale: faIR }) : 'ثبت نشده'}</span>
          </div>

          <p className="text-xs text-muted-foreground pt-0.5">
            آخرین بروزرسانی: {formatJalali(new Date(note.updatedAt), "PPPp", { locale: faIR })}
          </p>

          <p className="text-sm font-body whitespace-pre-wrap break-words text-foreground/90 pt-1">
            {displayContent}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-xs text-muted-foreground pt-1.5">
            {note.province && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{note.province}</span>
              </div>
            )}
            {note.phoneNumbers && note.phoneNumbers.length > 0 && (
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                <span>{note.phoneNumbers.join('، ')}</span>
              </div>
            )}
          </div>

          { (note.categories && note.categories.length > 0) && (
            <div className="flex flex-wrap gap-1.5 items-center pt-1">
              <Folder className="h-4 w-4 text-muted-foreground mr-0.5 rtl:ml-0.5 rtl:mr-0" />
              {note.categories.map((category) => (
                <Badge key={category.id} variant="secondary" className="text-xs">{category.name}</Badge>
              ))}
            </div>
          )}
          { (note.tags && note.tags.length > 0) && (
            <div className="flex flex-wrap gap-1.5 items-center pt-1">
              <Tag className="h-4 w-4 text-muted-foreground mr-0.5 rtl:ml-0.5 rtl:mr-0" />
              {note.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 gap-1.5 md:flex-col md:gap-2 md:mr-auto rtl:md:ml-auto rtl:md:mr-0 self-start md:self-center pt-2 md:pt-0 border-t md:border-t-0 md:border-l rtl:md:border-r rtl:md:border-l-0 border-border/40 md:pl-3 rtl:md:pr-3 w-full md:w-auto justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleArchive(note.id)} aria-label={note.isArchived ? "بازیابی یادداشت" : "آرشیو یادداشت"}>
            {note.isArchived ? <ArchiveRestore className="h-4 w-4 text-muted-foreground hover:text-foreground" /> : <Archive className="h-4 w-4 text-muted-foreground hover:text-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onTogglePublish(note.id)} aria-label={note.isPublished ? "لغو انتشار یادداشت" : "انتشار یادداشت"}>
            {note.isPublished ? <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(note)} aria-label="ویرایش یادداشت">
            <Edit3 className="h-4 w-4 text-accent hover:text-accent/80" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(note.id)} aria-label="حذف یادداشت">
            <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
          </Button>
        </div>
      </div>

      {/* Admin Rating Section */}
      {currentUser?.role === "ADMIN" && ( // Changed to string comparison
        <div className="mt-3 pt-3 border-t border-border/40">
          <label htmlFor={`rating-${note.id}`} className="block text-sm font-medium text-foreground mb-1">امتیاز مدیر (۰-۵):</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              id={`rating-${note.id}`}
              min="0"
              max="5"
              value={currentRating}
              onChange={(e) => setCurrentRating(Number(e.target.value))}
              className="w-20 bg-input text-foreground"
            />
            <Button size="sm" onClick={() => handleRatingSubmit(currentRating)}>ثبت امتیاز</Button>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="mt-4 pt-4 border-t border-border/40">
        <h3 className="text-md font-semibold text-foreground mb-2 flex items-center">
          <MessageSquare className="ml-2 h-5 w-5" />
          نظرات ({comments.length})
        </h3>
        {isLoadingComments && <p className="text-sm text-muted-foreground">در حال بارگذاری نظرات...</p>}
        {!isLoadingComments && comments.length > 0 ? (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {comments.map((comment) => (
              <div key={comment.id} className="p-2.5 bg-muted/30 rounded-md">
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{comment.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  توسط: {comment.author.username} در {formatJalali(new Date(comment.createdAt), "PPPp", { locale: faIR })}
                  {/* TODO: Add edit/delete buttons for comment author or admin */}
                </p>
              </div>
            ))}
          </div>
        ) : (
          !isLoadingComments && <p className="text-sm text-muted-foreground">هنوز نظری ثبت نشده است.</p>
        )}

        {/* Add Comment Form */}
        {currentUser && (
          <form onSubmit={handleCommentSubmit} className="mt-4 flex gap-2">
            <Textarea
              placeholder="نظر خود را بنویسید..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-grow bg-input text-foreground placeholder:text-muted-foreground text-sm min-h-[60px]"
              rows={2}
            />
            <Button type="submit" size="sm" className="self-end bg-primary hover:bg-primary/80 text-primary-foreground">
              <Send className="ml-2 h-4 w-4" />
              ارسال
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
