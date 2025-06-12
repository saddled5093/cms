
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Note } from "@/types";
import type { NoteFormData } from "@/components/note-form";
import NoteCard from "@/components/note-card";
import NoteForm from "@/components/note-form";
import SearchBar from "@/components/search-bar";
import ConfirmDialog from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FilePlus, ServerCrash, FilterX } from "lucide-react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const generateId = () => crypto.randomUUID();

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem("not_notes");
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes).map((note: any) => ({
          ...note,
          categories: note.categories || [],
          tags: note.tags || [],
          province: note.province || "", // Handle potentially missing province
          phoneNumbers: note.phoneNumbers || [], // Handle potentially missing phoneNumbers
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

  const allCategories = useMemo(() => {
    const catSet = new Set<string>();
    notes.forEach(note => note.categories.forEach(cat => catSet.add(cat)));
    return Array.from(catSet).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [notes]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => note.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [notes]);

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSearchTerm("");
  };

  const handleSaveNote = (data: NoteFormData) => {
    if (editingNote) {
      setNotes(
        notes.map((note) =>
          note.id === editingNote.id
            ? { 
                ...note, 
                ...data, // includes title, content, categories, tags, province, phoneNumbers
                updatedAt: new Date() 
              }
            : note
        )
      );
      toast({ title: "یادداشت به‌روزرسانی شد", description: "یادداشت شما با موفقیت به‌روزرسانی شد." });
    } else {
      const newNote: Note = {
        id: generateId(),
        title: data.title,
        content: data.content,
        categories: data.categories,
        tags: data.tags,
        province: data.province,
        phoneNumbers: data.phoneNumbers,
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
    let tempNotes = notes;

    if (debouncedSearchTerm) {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
      tempNotes = tempNotes.filter(
        (note) =>
          note.title.toLowerCase().includes(lowerSearchTerm) ||
          note.content.toLowerCase().includes(lowerSearchTerm) ||
          note.categories.some(cat => cat.toLowerCase().includes(lowerSearchTerm)) ||
          note.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)) ||
          note.province.toLowerCase().includes(lowerSearchTerm) ||
          note.phoneNumbers.some(pn => pn.toLowerCase().includes(lowerSearchTerm))
      );
    }

    if (selectedCategories.length > 0) {
      tempNotes = tempNotes.filter(note =>
        selectedCategories.every(sc => note.categories.includes(sc))
      );
    }

    if (selectedTags.length > 0) {
      tempNotes = tempNotes.filter(note =>
        selectedTags.every(st => note.tags.includes(st))
      );
    }
    // Sort notes by updatedAt in descending order (newest first)
    return tempNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [notes, debouncedSearchTerm, selectedCategories, selectedTags]);
  
  const activeFilterCount = selectedCategories.length + selectedTags.length + (searchTerm ? 1 : 0);


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
            <FilePlus className="ml-2 h-5 w-5" />
            یادداشت جدید
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-x-8 gap-y-6 mt-8">
          {/* Filter Panel */}
          <aside className="lg:w-64 xl:w-72 lg:sticky lg:top-24 h-fit lg:max-h-[calc(100vh-8rem)]">
            <Card className="shadow-lg rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-headline text-primary flex items-center justify-between">
                  <span>فیلترها</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="text-xs">{activeFilterCount} فعال</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <h3 className="font-semibold mb-2.5 text-md text-foreground">دسته‌بندی‌ها</h3>
                  {allCategories.length > 0 ? (
                    <ScrollArea className="h-36 pr-3">
                      <div className="flex flex-wrap gap-2">
                        {allCategories.map(category => (
                          <Badge
                            key={category}
                            variant={selectedCategories.includes(category) ? "default" : "secondary"}
                            onClick={() => toggleCategoryFilter(category)}
                            className="cursor-pointer py-1.5 px-3 text-xs transition-all hover:opacity-80"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && toggleCategoryFilter(category)}
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">دسته‌بندی‌ای وجود ندارد.</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2.5 text-md text-foreground">تگ‌ها</h3>
                  {allTags.length > 0 ? (
                    <ScrollArea className="h-36 pr-3">
                      <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                          <Badge
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "secondary"}
                            onClick={() => toggleTagFilter(tag)}
                            className="cursor-pointer py-1.5 px-3 text-xs transition-all hover:opacity-80"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && toggleTagFilter(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">تگی وجود ندارد.</p>
                  )}
                </div>
                
                {activeFilterCount > 0 && (
                   <Button onClick={clearFilters} variant="outline" size="sm" className="w-full mt-3 text-muted-foreground hover:text-foreground">
                      <FilterX className="ml-2 h-4 w-4" />
                      پاک کردن همه فیلترها
                   </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Notes Grid */}
          <main className="flex-grow min-w-0">
            {filteredNotes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
              <div className="text-center py-12 text-muted-foreground h-full flex flex-col justify-center items-center">
                <ServerCrash className="mx-auto h-16 w-16 mb-4 opacity-70" />
                <p className="text-xl font-semibold mb-2 font-headline">
                  {activeFilterCount > 0
                    ? "یادداشتی با این مشخصات یافت نشد"
                    : "هنوز یادداشتی وجود ندارد"}
                </p>
                <p className="text-md">
                  {activeFilterCount > 0
                    ? "عبارات جستجو یا فیلترهای خود را تغییر دهید."
                    : "برای شروع، روی 'یادداشت جدید' کلیک کنید!"}
                </p>
              </div>
            )}
          </main>
        </div>

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
