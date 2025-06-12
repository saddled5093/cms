
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Note } from "@/types";
import { Trash2, Archive, ArchiveRestore, Eye, EyeOff, CalendarDays, MapPin } from "lucide-react";
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
  onDelete: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onTogglePublish: (noteId: string) => void;
}

const DATE_DISPLAY_FORMAT = 'yyyy/M/d HH:mm';

export default function NoteCard({ note, onDelete, onToggleArchive, onTogglePublish }: NoteCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-card text-card-foreground w-full border border-border">
      <Link href={`/notes/${note.id}`} className="block hover:bg-muted/10 transition-colors rounded-t-lg">
        <CardHeader className="p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <CardTitle className="font-headline text-xl text-primary mb-1 sm:mb-0 truncate" title={note.title}>{note.title}</CardTitle>
            <div className="flex gap-1.5 mt-1 sm:mt-0 flex-wrap items-center">
              {note.isArchived && <Badge variant="secondary" className="text-xs bg-muted/60 text-muted-foreground">آرشیو شده</Badge>}
              {note.isPublished && <Badge variant="default" className="text-xs bg-accent/80 text-accent-foreground">منتشر شده</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center text-sm text-foreground/80 pt-0.5">
            <CalendarDays className="ml-2 h-4 w-4 text-muted-foreground" />
            <span>تاریخ رویداد: {note.eventDate && isValidDateFn(new Date(note.eventDate)) ? formatJalali(new Date(note.eventDate), DATE_DISPLAY_FORMAT, { locale: faIR }) : 'ثبت نشده'}</span>
          </div>

          {note.province && (
            <div className="flex items-center text-sm text-foreground/80 pt-1">
              <MapPin className="ml-2 h-4 w-4 text-muted-foreground" />
              <span>{note.province}</span>
            </div>
          )}
        </CardContent>
      </Link>
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
    </Card>
  );
}
