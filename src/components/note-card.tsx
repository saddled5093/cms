
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Note } from "@/types";
import { Edit3, Trash2, Folder, Tag, MapPin, Phone, Archive, ArchiveRestore, Eye, EyeOff, FileText } from "lucide-react";
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
  const MAX_CONTENT_PREVIEW_LENGTH = 80; 
  const displayContent = note.content.length > MAX_CONTENT_PREVIEW_LENGTH 
    ? `${note.content.substring(0, MAX_CONTENT_PREVIEW_LENGTH)}...`
    : note.content;

  return (
    <Card className="flex flex-col h-full overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-xl text-primary">{note.title}</CardTitle>
          <div className="flex gap-1.5">
            {note.isArchived && <Badge variant="secondary" className="text-xs bg-muted/50 text-muted-foreground">آرشیو شده</Badge>}
            {note.isPublished && <Badge variant="default" className="text-xs bg-accent/80 text-accent-foreground">منتشر شده</Badge>}
          </div>
        </div>
        <CardDescription className="text-xs text-muted-foreground pt-1">
          آخرین بروزرسانی: {format(new Date(note.updatedAt), "PPpp", { locale: faIR })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-4 space-y-2.5">
        <p className="text-sm font-body whitespace-pre-wrap break-words">
          {displayContent}
        </p>
        {note.province && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{note.province}</span>
          </div>
        )}
        {note.phoneNumbers && note.phoneNumbers.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span>{note.phoneNumbers.join('، ')}</span>
          </div>
        )}
        { (note.categories && note.categories.length > 0) && (
          <div className="flex flex-wrap gap-1 items-center">
            <Folder className="h-4 w-4 text-muted-foreground mr-1" />
            {note.categories.map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">{category}</Badge>
            ))}
          </div>
        )}
        { (note.tags && note.tags.length > 0) && (
          <div className="flex flex-wrap gap-1 items-center">
            <Tag className="h-4 w-4 text-muted-foreground mr-1" />
            {note.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2 border-t border-border/60">
        <Button variant="ghost" size="icon" onClick={() => onToggleArchive(note.id)} aria-label={note.isArchived ? "بازیابی یادداشت" : "آرشیو یادداشت"}>
          {note.isArchived ? <ArchiveRestore className="h-5 w-5 text-muted-foreground hover:text-foreground" /> : <Archive className="h-5 w-5 text-muted-foreground hover:text-foreground" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onTogglePublish(note.id)} aria-label={note.isPublished ? "لغو انتشار یادداشت" : "انتشار یادداشت"}>
          {note.isPublished ? <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(note)} aria-label="ویرایش یادداشت">
          <Edit3 className="h-5 w-5 text-accent hover:text-accent/80" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(note.id)} aria-label="حذف یادداشت">
          <Trash2 className="h-5 w-5 text-destructive hover:text-destructive/80" />
        </Button>
      </CardFooter>
    </Card>
  );
}

