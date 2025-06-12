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
import Header from "@/components/layout/header"; // Import Header

// Helper to generate unique IDs
const generateId = () => crypto.randomUUID();

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

  const { toast } = useToast();

  // Load notes from localStorage on initial render
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
        title: "Error",
        description: "Could not load saved notes.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("not_notes", JSON.stringify(notes));
    } catch (error) {
      console.error("Failed to save notes to localStorage", error);
      // Potentially inform user, but avoid constant toasts for this.
    }
  }, [notes]);
  
  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleSaveNote = (data: { title: string; content: string }) => {
    if (editingNote) {
      // Update existing note
      setNotes(
        notes.map((note) =>
          note.id === editingNote.id
            ? { ...note, ...data, updatedAt: new Date() }
            : note
        )
      );
      toast({ title: "Note Updated", description: "Your note has been successfully updated." });
    } else {
      // Create new note
      const newNote: Note = {
        id: generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setNotes([newNote, ...notes]);
      toast({ title: "Note Created", description: "Your new note has been saved." });
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
      toast({ title: "Note Deleted", description: "The note has been removed." });
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
            aria-label="Create new note"
          >
            <FilePlus className="mr-2 h-5 w-5" />
            New Note
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
              {debouncedSearchTerm ? "No notes found" : "No notes yet"}
            </p>
            <p className="text-md">
              {debouncedSearchTerm
                ? "Try adjusting your search terms."
                : "Click 'New Note' to get started!"}
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
          title="Delete Note"
          description="Are you sure you want to delete this note? This action cannot be undone."
        />
      </div>
    </>
  );
}
