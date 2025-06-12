"use client";

import { useState, useEffect, useMemo } from "react";
import type { Note } from "@/types";
import NoteCard from "@/components/note-card";
import NoteForm from "@/components/note-form";
import SearchBar from "@/components/search-bar";
import ConfirmDialog from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FilePlus, ServerCrash } from "lucide-react";
import Header from "@/components/layout/header";

const generateId = () => crypto.randomUUID();

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem("not_notes");
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        })));
      }
    } catch (error) {
      console.error("Failed to load notes from localStorage", error);
      toast({
        title: "خطا",
        description: "بارگذاری یادداشت‌های ذخیره شده ممکن نبود.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    try {
      localStorage.setItem("not_notes", JSON.stringify(notes));
    } catch (error) {
      console.error("Failed to save notes to localStorage", error);
    }
  }, [notes]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleSaveNote = (data: { title: string; content: string }) => {
    if (editingNote) {
      setNotes(
        notes.map((note) =>
          note.id === editingNote.id
            ? { ...note, ...data, updatedAt: new Date() }
            : note
        )
      );
      toast({ title: "یادداشت به‌روزرسانی شد", description: "یادداشت شما با موفقیت به‌روزرسانی شد." });
    } else {
      const newNote: Note = {
        id: generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setNotes([newNote, ...notes]);
      toast({ title: "یادداشت ایجاد شد", description: "یادداشت جدید شما ذخیره شد." });
    }
    setIsFormOpen(false);
    setEditingNote(null);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteToDeleteId(noteId);
  };

  const confirmDeleteNote = () => {
    if (noteToDeleteId) {
      setNotes(notes.filter((note) => note.id !== noteToDeleteId));
      toast({ title: "یادداشت حذف شد", description: "یادداشت حذف گردید." });
    }
    setNoteToDeleteId(null);
  };

  const filteredNotes = useMemo(() => {
    if (!debouncedSearchTerm) return notes;
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [notes, debouncedSearchTerm]);

  return (
    <>
      <Header onNewNoteClick={() => { setEditingNote(null); setIsFormOpen(true); }} />
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center">
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} className="flex-grow" />
          <Button
            onClick={() => {
              setEditingNote(null);
              setIsFormOpen(true);
            }}
            className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transition-transform hover:scale-105"
            aria-label="ایجاد یادداشت جدید"
          >
            <FilePlus className="ml-2 h-5 w-5" /> {/* In RTL, ml-2 becomes margin-right */}
            یادداشت جدید
          </Button>
        </div>

        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ServerCrash className="mx-auto h-16 w-16 mb-4 opacity-70" />
            <p className="text-xl font-semibold mb-2 font-headline">
              {debouncedSearchTerm ? "یادداشتی یافت نشد" : "هنوز یادداشتی وجود ندارد"}
            </p>
            <p className="text-md">
              {debouncedSearchTerm
                ? "عبارات جستجوی خود را تغییر دهید."
                : "برای شروع، روی 'یادداشت جدید' کلیک کنید!"}
            </p>
          </div>
        )}

        <NoteForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingNote(null);
          }}
          onSubmit={handleSaveNote}
          initialData={editingNote || undefined}
        />

        <ConfirmDialog
          isOpen={!!noteToDeleteId}
          onClose={() => setNoteToDeleteId(null)}
          onConfirm={confirmDeleteNote}
          title="حذف یادداشت"
          description="آیا از حذف این یادداشت مطمئن هستید؟ این عمل قابل بازگشت نیست."
        />
      </div>
    </>
  );
}
