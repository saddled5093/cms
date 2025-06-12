"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Note } from "@/types";
import { Edit3, Trash2, Folder, Tag } from "lucide-react";
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const MAX_CONTENT_PREVIEW_LENGTH = 100; // Adjusted for new elements
  const displayContent = note.content.length > MAX_CONTENT_PREVIEW_LENGTH 
    ? `${note.content.substring(0, MAX_CONTENT_PREVIEW_LENGTH)}...`
    : note.content;

  return (
    <Card className="flex flex-col h-full overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground">
      <CardHeader className="pb-2">
        <CardTitle className="font-headline text-xl text-primary">{note.title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground pt-1">
          آخرین بروزرسانی: {format(new Date(note.updatedAt), "PPpp", { locale: faIR })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-4 space-y-3">
        <p className="text-sm font-body whitespace-pre-wrap break-words">
          {displayContent}
        </p>
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
