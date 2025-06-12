
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Note, CurrentUser } from "@/types";
import { Trash2, Archive, ArchiveRestore, Eye, EyeOff, CalendarDays, MapPin, Star, UserCircle2, Edit3, Folder } from "lucide-react";
import { format as formatJalali } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';
import Link from "next/link";
import { isValid as isValidDateFn } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface NoteCardProps {
  note: Note;
  currentUser: CurrentUser | null;
  onDelete: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onTogglePublish: (noteId: string) => void;
}

const DATE_DISPLAY_FORMAT_CARD = 'yyyy/M/d'; // Date only for card

export default function NoteCard({ note, currentUser, onDelete, onToggleArchive, onTogglePublish }: NoteCardProps) {
  const canManage = currentUser && (currentUser.id === note.authorId || currentUser.role === "ADMIN");

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-card text-card-foreground w-full border border-border">
      <CardHeader className="p-4 pb-2">
        <Link href={`/notes/${note.id}`} className="block hover:text-primary transition-colors">
          <CardTitle className="font-headline text-xl text-primary truncate" title={note.title}>{note.title}</CardTitle>
        </Link>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 text-xs text-muted-foreground space-y-1.5">
        <div className="flex items-center gap-3 flex-wrap">
          {note.categories && note.categories.length > 0 && (
            <span className="flex items-center" title="دسته بندی">
              <Folder className="ml-1 h-3.5 w-3.5" />
              {note.categories[0].name}{note.categories.length > 1 ? '...' : ''}
            </span>
          )}
          {note.province && (
            <span className="flex items-center" title="استان">
              <MapPin className="ml-1 h-3.5 w-3.5" />
              {note.province}
            </span>
          )}
          {note.eventDate && isValidDateFn(new Date(note.eventDate)) && (
            <span className="flex items-center" title="تاریخ رویداد">
              <CalendarDays className="ml-1 h-3.5 w-3.5" />
              {formatJalali(new Date(note.eventDate), DATE_DISPLAY_FORMAT_CARD, { locale: faIR })}
            </span>
          )}
          {typeof note.rating === 'number' && note.rating > 0 && (
            <span className="flex items-center" title="امتیاز">
              <Star className="ml-1 h-3.5 w-3.5 fill-yellow-400 text-yellow-500" />
              {note.rating}
            </span>
          )}
          {note.author?.username && (
            <span className="flex items-center" title="نویسنده">
              <UserCircle2 className="ml-1 h-3.5 w-3.5" />
              {note.author.username}
            </span>
          )}
          {canManage && (
            <Button variant="ghost" size="icon" asChild className="h-6 w-6 text-accent hover:text-accent/80" title="ویرایش یادداشت">
              <Link href={`/notes/${note.id}/edit`}>
                <Edit3 className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>

      {canManage && (
        <CardFooter className="flex flex-shrink-0 gap-1.5 p-2 border-t border-border/40 justify-end rounded-b-lg">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleArchive(note.id)} aria-label={note.isArchived ? "بازیابی یادداشت" : "آرشیو یادداشت"}>
            {note.isArchived ? <ArchiveRestore className="h-4 w-4 text-muted-foreground hover:text-foreground" /> : <Archive className="h-4 w-4 text-muted-foreground hover:text-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onTogglePublish(note.id)} aria-label={note.isPublished ? "لغو انتشار یادداشت" : "انتشار یادداشت"}>
            {note.isPublished ? <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(note.id)} aria-label="حذف یادداشت">
            <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
