
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Note } from "@/types";
import { Edit3, Trash2, Folder, Tag, MapPin, Phone, Archive, ArchiveRestore, Eye, EyeOff } from "lucide-react";
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onTogglePublish: (noteId: string) => void;
}

export default function NoteCard({ note, onEdit, onDelete, onToggleArchive, onTogglePublish }: NoteCardProps) {
  const MAX_CONTENT_PREVIEW_LENGTH = 150; 
  const displayContent = note.content.length > MAX_CONTENT_PREVIEW_LENGTH 
    ? `${note.content.substring(0, MAX_CONTENT_PREVIEW_LENGTH)}...`
    : note.content;

  return (
    <Card className="flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 bg-card text-card-foreground w-full">
      <div className="flex-grow space-y-2 mb-3 md:mb-0 md:mr-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
          <CardTitle className="font-headline text-xl text-primary mb-1 sm:mb-0">{note.title}</CardTitle>
          <div className="flex gap-1.5 mt-1 sm:mt-0 flex-wrap">
            {note.isArchived && <Badge variant="secondary" className="text-xs bg-muted/60 text-muted-foreground">آرشیو شده</Badge>}
            {note.isPublished && <Badge variant="default" className="text-xs bg-accent/80 text-accent-foreground">منتشر شده</Badge>}
          </div>
        </div>
        <CardDescription className="text-xs text-muted-foreground pt-0.5">
          آخرین بروزرسانی: {format(new Date(note.updatedAt), "PPpp", { locale: faIR })}
        </CardDescription>
        
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
            <Folder className="h-4 w-4 text-muted-foreground mr-0.5" />
            {note.categories.map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">{category}</Badge>
            ))}
          </div>
        )}
        { (note.tags && note.tags.length > 0) && (
          <div className="flex flex-wrap gap-1.5 items-center pt-1">
            <Tag className="h-4 w-4 text-muted-foreground mr-0.5" />
            {note.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex flex-shrink-0 gap-1.5 md:flex-col md:gap-2 md:ml-auto self-start md:self-center pt-2 md:pt-0 border-t md:border-t-0 md:border-r border-border/40 md:pr-3 w-full md:w-auto justify-end">
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
    </Card>
  );
}

