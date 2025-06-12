
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Note } from "@/types";
import type { NoteFormData } from "@/components/note-form";
import NoteCard from "@/components/note-card";
import NoteForm from "@/components/note-form";
import ConfirmDialog from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FilePlus, ServerCrash, FilterX, Search } from "lucide-react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

const generateId = () => crypto.randomUUID();

type ArchiveFilterStatus = "all" | "archived" | "unarchived";
type PublishFilterStatus = "all" | "published" | "unpublished";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  
  const [titleSearch, setTitleSearch] = useState("");
  const [contentSearch, setContentSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");

  const [debouncedTitleSearch, setDebouncedTitleSearch] = useState("");
  const [debouncedContentSearch, setDebouncedContentSearch] = useState("");
  const [debouncedPhoneSearch, setDebouncedPhoneSearch] = useState("");
  
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<1 | 2>(1);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilterStatus>("all");
  const [publishFilter, setPublishFilter] = useState<PublishFilterStatus>("all");

  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem("not_notes");
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes).map((note: any) => ({
          ...note,
          categories: Array.isArray(note.categories) ? note.categories : (typeof note.categories === 'string' ? note.categories.split(',').map((s:string) => s.trim()).filter(Boolean) : []),
          tags: Array.isArray(note.tags) ? note.tags : (typeof note.tags === 'string' ? note.tags.split(',').map((s:string) => s.trim()).filter(Boolean) : []),
          province: note.province || "", 
          phoneNumbers: Array.isArray(note.phoneNumbers) ? note.phoneNumbers : (typeof note.phoneNumbers === 'string' ? note.phoneNumbers.split(',').map((s:string) => s.trim()).filter(Boolean) : []),
          isArchived: typeof note.isArchived === 'boolean' ? note.isArchived : false,
          isPublished: typeof note.isPublished === 'boolean' ? note.isPublished : false,
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
    localStorage.setItem("not_notes", JSON.stringify(notes));
  }, [notes]);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTitleSearch(titleSearch), 300);
    return () => clearTimeout(handler);
  }, [titleSearch]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedContentSearch(contentSearch), 300);
    return () => clearTimeout(handler);
  }, [contentSearch]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedPhoneSearch(phoneSearch), 300);
    return () => clearTimeout(handler);
  }, [phoneSearch]);

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

  const allProvinces = useMemo(() => {
    const provinceSet = new Set<string>();
    notes.forEach(note => {
      if (note.province) provinceSet.add(note.province);
    });
    return Array.from(provinceSet).sort((a, b) => a.localeCompare(b, 'fa'));
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
  
  const toggleProvinceFilter = (province: string) => {
    setSelectedProvinces(prev =>
      prev.includes(province)
        ? prev.filter(p => p !== province)
        : [...prev, province]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedProvinces([]);
    setArchiveFilter("all");
    setPublishFilter("all");
    setTitleSearch("");
    setContentSearch("");
    setPhoneSearch("");
  };

  const handleSaveNote = (data: NoteFormData) => {
    if (editingNote) {
      setNotes(
        notes.map((note) =>
          note.id === editingNote.id
            ? { 
                ...note, 
                ...data, 
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
        isArchived: data.isArchived,
        isPublished: data.isPublished,
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

  const handleDeleteNoteRequest = (noteId: string) => {
    setNoteToDeleteId(noteId);
    setDeleteConfirmationStep(1);
  };

  const confirmDeleteNote = () => {
    if (deleteConfirmationStep === 1) {
      setDeleteConfirmationStep(2);
      // Dialog stays open for the second confirmation
    } else if (deleteConfirmationStep === 2 && noteToDeleteId) {
      setNotes(notes.filter((note) => note.id !== noteToDeleteId));
      toast({ title: "یادداشت حذف شد", description: "یادداشت حذف گردید." });
      setNoteToDeleteId(null);
      setDeleteConfirmationStep(1); // Reset for next time
    }
  };
  
  const cancelDeleteNote = () => {
    setNoteToDeleteId(null);
    setDeleteConfirmationStep(1);
  }

  const handleToggleArchive = (noteId: string) => {
    const noteToUpdate = notes.find(n => n.id === noteId);
    if (!noteToUpdate) return;

    const newArchivedState = !noteToUpdate.isArchived;
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, isArchived: newArchivedState, updatedAt: new Date() } : note
      )
    );
    toast({ title: `یادداشت ${newArchivedState ? "آرشیو شد" : "از آرشیو خارج شد" }` });
  };

  const handleTogglePublish = (noteId: string) => {
    const noteToUpdate = notes.find(n => n.id === noteId);
    if (!noteToUpdate) return;
    
    const newPublishedState = !noteToUpdate.isPublished;
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, isPublished: newPublishedState, updatedAt: new Date() } : note
      )
    );
    toast({ title: `وضعیت انتشار یادداشت ${newPublishedState ? "به 'منتشر شده' تغییر کرد" : "به 'عدم انتشار' تغییر کرد" }` });
  };


  const filteredNotes = useMemo(() => {
    let tempNotes = notes;

    if (debouncedTitleSearch) {
      tempNotes = tempNotes.filter(note => note.title.toLowerCase().includes(debouncedTitleSearch.toLowerCase()));
    }
    if (debouncedContentSearch) {
      tempNotes = tempNotes.filter(note => note.content.toLowerCase().includes(debouncedContentSearch.toLowerCase()));
    }
    if (debouncedPhoneSearch) {
      tempNotes = tempNotes.filter(note => note.phoneNumbers.some(pn => pn.includes(debouncedPhoneSearch)));
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
    
    if (selectedProvinces.length > 0) {
      tempNotes = tempNotes.filter(note => selectedProvinces.includes(note.province));
    }

    if (archiveFilter === "archived") {
      tempNotes = tempNotes.filter(note => note.isArchived);
    } else if (archiveFilter === "unarchived") {
      tempNotes = tempNotes.filter(note => !note.isArchived);
    }

    if (publishFilter === "published") {
      tempNotes = tempNotes.filter(note => note.isPublished);
    } else if (publishFilter === "unpublished") {
      tempNotes = tempNotes.filter(note => !note.isPublished);
    }

    return tempNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [
      notes, 
      debouncedTitleSearch, debouncedContentSearch, debouncedPhoneSearch, 
      selectedCategories, selectedTags, selectedProvinces, 
      archiveFilter, publishFilter
    ]);
  
  const activeFilterCount = 
    selectedCategories.length + 
    selectedTags.length + 
    selectedProvinces.length + 
    (archiveFilter !== "all" ? 1 : 0) +
    (publishFilter !== "all" ? 1 : 0) +
    (titleSearch ? 1 : 0) +
    (contentSearch ? 1 : 0) +
    (phoneSearch ? 1 : 0);


  return (
    <>
      {/* Header will be rendered by RootLayout, no onNewNoteClick prop needed from here */}
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-6 p-4 border rounded-lg shadow bg-card">
            <h2 className="text-lg font-semibold mb-3 text-primary flex items-center">
                <Search className="ml-2 h-5 w-5"/>
                جستجوی پیشرفته
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                    type="text"
                    placeholder="جستجو بر اساس عنوان..."
                    value={titleSearch}
                    onChange={(e) => setTitleSearch(e.target.value)}
                    className="bg-input placeholder:text-muted-foreground"
                />
                <Input
                    type="text"
                    placeholder="جستجو بر اساس محتوا..."
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                    className="bg-input placeholder:text-muted-foreground"
                />
                <Input
                    type="text"
                    placeholder="جستجو بر اساس شماره تلفن..."
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    className="bg-input placeholder:text-muted-foreground"
                />
            </div>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-grow">
            <h1 className="text-2xl font-headline text-primary">همه یادداشت‌ها</h1>
          </div>
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

        <div className="flex flex-col lg:flex-row gap-x-8 gap-y-6 mt-2">
          <aside className="lg:w-72 xl:w-80 lg:sticky lg:top-24 h-fit lg:max-h-[calc(100vh-8rem)]">
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
                    <ScrollArea className="h-28 pr-3">
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
                    <ScrollArea className="h-28 pr-3">
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

                <div>
                  <h3 className="font-semibold mb-2.5 text-md text-foreground">استان‌ها</h3>
                  {allProvinces.length > 0 ? (
                    <ScrollArea className="h-28 pr-3">
                      <div className="flex flex-wrap gap-2">
                        {allProvinces.map(province => (
                          <Badge
                            key={province}
                            variant={selectedProvinces.includes(province) ? "default" : "secondary"}
                            onClick={() => toggleProvinceFilter(province)}
                            className="cursor-pointer py-1.5 px-3 text-xs transition-all hover:opacity-80"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && toggleProvinceFilter(province)}
                          >
                            {province}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">استانی برای فیلتر وجود ندارد.</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2.5 text-md text-foreground">وضعیت آرشیو</h3>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "archived", "unarchived"] as ArchiveFilterStatus[]).map(status => (
                      <Badge
                        key={status}
                        variant={archiveFilter === status ? "default" : "secondary"}
                        onClick={() => setArchiveFilter(status)}
                        className="cursor-pointer py-1.5 px-3 text-xs transition-all hover:opacity-80"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setArchiveFilter(status)}
                      >
                        {status === "all" ? "همه" : status === "archived" ? "آرشیو شده" : "آرشیو نشده"}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2.5 text-md text-foreground">وضعیت انتشار</h3>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "published", "unpublished"] as PublishFilterStatus[]).map(status => (
                      <Badge
                        key={status}
                        variant={publishFilter === status ? "default" : "secondary"}
                        onClick={() => setPublishFilter(status)}
                        className="cursor-pointer py-1.5 px-3 text-xs transition-all hover:opacity-80"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setPublishFilter(status)}
                      >
                        {status === "all" ? "همه" : status === "published" ? "منتشر شده" : "منتشر نشده"}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {activeFilterCount > 0 && (
                   <Button onClick={clearFilters} variant="outline" size="sm" className="w-full mt-4 text-muted-foreground hover:text-foreground">
                      <FilterX className="ml-2 h-4 w-4" />
                      پاک کردن همه فیلترها
                   </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          <main className="flex-grow min-w-0">
            {filteredNotes.length > 0 ? (
              <div className="space-y-4">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNoteRequest}
                    onToggleArchive={handleToggleArchive}
                    onTogglePublish={handleTogglePublish}
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
          onClose={cancelDeleteNote}
          onConfirm={confirmDeleteNote}
          title={deleteConfirmationStep === 1 ? "حذف یادداشت" : "تأیید نهایی حذف"}
          description={
            deleteConfirmationStep === 1
              ? "آیا از حذف این یادداشت مطمئن هستید؟"
              : "این عمل غیرقابل بازگشت است و یادداشت برای همیشه حذف خواهد شد. آیا کاملاً مطمئن هستید؟"
          }
        />
      </div>
    </>
  );
}

    