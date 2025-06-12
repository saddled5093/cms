
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Note, Category } from "@/types"; // Updated Note type
import type { NoteFormData } from "@/components/note-form";
import NoteCard from "@/components/note-card";
import NoteForm from "@/components/note-form";
import ConfirmDialog from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FilePlus, ServerCrash, FilterX, Search, Calendar as CalendarIconLucide, XCircle } from "lucide-react";
// Header is now part of AppLayout
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link"; // Keep Link
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format as formatDateFn, startOfDay, endOfDay, parseISO, isValid } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';
import { format as formatJalali } from 'date-fns-jalali';
import type { DateRange } from "react-day-picker";

// TODO: Replace with actual user ID from AuthContext after login
const MOCK_USER_ID = "user1_id_placeholder"; // Replace with actual logged-in user ID

type ArchiveFilterStatus = "all" | "archived" | "unarchived";
type PublishFilterStatus = "all" | "published" | "unpublished";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [titleSearch, setTitleSearch] = useState("");
  const [contentSearch, setContentSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [debouncedTitleSearch, setDebouncedTitleSearch] = useState("");
  const [debouncedContentSearch, setDebouncedContentSearch] = useState("");
  const [debouncedPhoneSearch, setDebouncedPhoneSearch] = useState("");
  
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<1 | 2>(1);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Store category IDs or names
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilterStatus>("all");
  const [publishFilter, setPublishFilter] = useState<PublishFilterStatus>("all");

  const { toast } = useToast();

  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        // TODO: In a real app, you might fetch notes for a specific user or based on role
        // const response = await fetch('/api/notes?userId=currentUser'); 
        const response = await fetch('/api/notes'); 
        if (!response.ok) {
          throw new Error('Failed to fetch notes');
        }
        let fetchedNotes: Note[] = await response.json();
        
        // Normalize dates from ISO strings to Date objects
        fetchedNotes = fetchedNotes.map(note => ({
          ...note,
          eventDate: note.eventDate ? parseISO(note.eventDate as string) : new Date(),
          createdAt: note.createdAt ? parseISO(note.createdAt as string) : new Date(),
          updatedAt: note.updatedAt ? parseISO(note.updatedAt as string) : new Date(),
        }));

        setNotes(fetchedNotes);
      } catch (error) {
        console.error("Failed to load notes from API", error);
        toast({
          title: "خطا",
          description: "بارگذاری یادداشت‌ها از سرور ممکن نبود.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        // This assumes you have an API endpoint for categories
        // const response = await fetch('/api/categories');
        // if (!response.ok) throw new Error('Failed to fetch categories');
        // const data: Category[] = await response.json();
        // For now, using placeholder categories until API is fully integrated
        // In a real app, this data would come from `prisma.category.findMany()`
        const placeholderCategories: Category[] = [
            // { id: "cat1", name: "عمومی" }, {id: "cat2", name: "کاری"} 
        ]; // Will be populated by seed or API
        // setAvailableCategories(data.sort((a,b) => a.name.localeCompare(b.name, 'fa')));
      } catch (error) {
        console.error("Failed to load categories from API", error);
        // toast({ title: "خطا در بارگذاری دسته‌بندی‌ها", variant: "destructive" });
      }
    };

    fetchNotes();
    fetchCategories();
  }, [toast]);
  
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
    // Assuming note.categories is an array of objects { id: string, name: string }
    notes.forEach(note => note.categories.forEach(cat => catSet.add(cat.name)));
    return Array.from(catSet).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [notes]);
  
  // Or if availableCategories is populated from API:
  const displayableCategories = useMemo(() => {
      return availableCategories.length > 0 ? availableCategories : 
             allCategories.map(name => ({id: name, name})); // Fallback if API categories not loaded
  }, [availableCategories, allCategories]);


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

  const toggleCategoryFilter = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(cName => cName !== categoryName)
        : [...prev, categoryName]
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
    setDateRange(undefined);
  };

  const handleSaveNote = async (data: NoteFormData) => {
    // TODO: Get actual authorId from AuthContext
    const payload = { 
        ...data, 
        authorId: MOCK_USER_ID, // Replace with actual user ID from session
        categoryIds: data.categoryIds, // Ensure categoryIds are passed if using them
        eventDate: data.eventDate.toISOString(), // Send date as ISO string
    };

    try {
      let response;
      let savedNoteData;

      if (editingNote) {
        // response = await fetch(`/api/notes/${editingNote.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(payload),
        // });
        // For now, use POST to create/update, or implement PUT
        console.warn("Update (PUT) not fully implemented yet, using optimistic update for now.");
         setNotes(
            notes.map((note) =>
            note.id === editingNote.id
                ? { 
                    ...note, 
                    ...data, 
                    updatedAt: new Date(),
                    // Simulate category objects if data.categories are names/ids
                    categories: data.categories.map(catNameOrId => {
                        const foundCat = availableCategories.find(ac => ac.id === catNameOrId || ac.name === catNameOrId);
                        return foundCat || { id: catNameOrId, name: catNameOrId };
                    })
                }
                : note
            )
        );
        savedNoteData = { ...editingNote, ...data, updatedAt: new Date().toISOString() };

      } else {
        response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save note');
        }
        savedNoteData = await response.json();
      }

     
      // Normalize date from API response
      const finalNote: Note = {
        ...savedNoteData,
        eventDate: parseISO(savedNoteData.eventDate as string),
        createdAt: parseISO(savedNoteData.createdAt as string),
        updatedAt: parseISO(savedNoteData.updatedAt as string),
      };

      if (editingNote) {
        setNotes(notes.map(n => n.id === editingNote.id ? finalNote : n));
        toast({ title: "یادداشت به‌روزرسانی شد" });
      } else {
        setNotes(prevNotes => [finalNote, ...prevNotes]);
        toast({ title: "یادداشت ایجاد شد" });
      }
    } catch (error: any) {
      console.error("Failed to save note:", error);
      toast({ title: "خطا در ذخیره یادداشت", description: error.message, variant: "destructive" });
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

  const confirmDeleteNote = async () => {
    if (deleteConfirmationStep === 1) {
      setDeleteConfirmationStep(2);
    } else if (deleteConfirmationStep === 2 && noteToDeleteId) {
      try {
        // const response = await fetch(`/api/notes/${noteToDeleteId}`, { method: 'DELETE' });
        // if (!response.ok) {
        //   throw new Error('Failed to delete note');
        // }
        console.warn("Delete (DELETE) not fully implemented yet, using optimistic update.");
        setNotes(notes.filter((note) => note.id !== noteToDeleteId));
        toast({ title: "یادداشت (به صورت محلی) حذف شد" });
      } catch (error) {
        console.error("Failed to delete note:", error);
        toast({ title: "خطا در حذف یادداشت", variant: "destructive" });
      }
      setNoteToDeleteId(null);
      setDeleteConfirmationStep(1); 
    }
  };
  
  const cancelDeleteNote = () => {
    setNoteToDeleteId(null);
    setDeleteConfirmationStep(1);
  }

  const handleToggleArchive = async (noteId: string) => {
    const noteToUpdate = notes.find(n => n.id === noteId);
    if (!noteToUpdate) return;

    const newArchivedState = !noteToUpdate.isArchived;
    // Optimistic update
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, isArchived: newArchivedState, updatedAt: new Date() } : note
      )
    );
    try {
    //   const response = await fetch(`/api/notes/${noteId}/archive`, { // Example endpoint
    //     method: 'PATCH', // or PUT
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ isArchived: newArchivedState }),
    //   });
    //   if (!response.ok) throw new Error('Failed to update archive status');
      toast({ title: `یادداشت (محلی) ${newArchivedState ? "آرشیو شد" : "از آرشیو خارج شد" }` });
    } catch (error) {
      console.error("Failed to toggle archive:", error);
      toast({ title: "خطا در تغییر وضعیت آرشیو", variant: "destructive" });
      // Revert optimistic update
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === noteId ? { ...note, isArchived: !newArchivedState, updatedAt: new Date(noteToUpdate.updatedAt) } : note
        )
      );
    }
  };

  const handleTogglePublish = async (noteId: string) => {
    const noteToUpdate = notes.find(n => n.id === noteId);
    if (!noteToUpdate) return;
    
    const newPublishedState = !noteToUpdate.isPublished;
    // Optimistic update
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, isPublished: newPublishedState, updatedAt: new Date() } : note
      )
    );
    try {
    //   const response = await fetch(`/api/notes/${noteId}/publish`, { // Example endpoint
    //      method: 'PATCH',
    //      headers: { 'Content-Type': 'application/json' },
    //      body: JSON.stringify({ isPublished: newPublishedState }),
    //   });
    //   if (!response.ok) throw new Error('Failed to update publish status');
      toast({ title: `وضعیت انتشار یادداشت (محلی) ${newPublishedState ? "به 'منتشر شده' تغییر کرد" : "به 'عدم انتشار' تغییر کرد" }` });
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      toast({ title: "خطا در تغییر وضعیت انتشار", variant: "destructive" });
      // Revert optimistic update
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === noteId ? { ...note, isPublished: !newPublishedState, updatedAt: new Date(noteToUpdate.updatedAt) } : note
        )
      );
    }
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
    
    if (dateRange?.from) {
      const startDate = startOfDay(dateRange.from);
      const endDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      
      tempNotes = tempNotes.filter(note => {
        const noteEventDate = new Date(note.eventDate);
        return noteEventDate >= startDate && noteEventDate <= endDate;
      });
    }

    if (selectedCategories.length > 0) {
      tempNotes = tempNotes.filter(note =>
        selectedCategories.every(scName => note.categories.some(cat => cat.name === scName))
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

    return tempNotes.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }, [
      notes, 
      debouncedTitleSearch, debouncedContentSearch, debouncedPhoneSearch, 
      dateRange,
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
    (phoneSearch ? 1 : 0) +
    (dateRange?.from ? 1 : 0);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <p>در حال بارگذاری یادداشت‌ها از سرور...</p>
        {/* Add a spinner or skeleton loader here */}
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-6 p-4 border rounded-lg shadow bg-card">
            <h2 className="text-lg font-semibold mb-3 text-primary flex items-center">
                <Search className="ml-2 h-5 w-5"/>
                جستجو و فیلتر پیشرفته
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                 <div className="relative">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal bg-input hover:bg-muted/30 ${
                            !dateRange && "text-muted-foreground"
                            }`}
                        >
                            <CalendarIconLucide className="ml-2 h-4 w-4" />
                            {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                {formatJalali(dateRange.from, "LLL dd, y", { locale: faIR })} -{" "}
                                {formatJalali(dateRange.to, "LLL dd, y", { locale: faIR })}
                                </>
                            ) : (
                                formatJalali(dateRange.from, "LLL dd, y", { locale: faIR })
                            )
                            ) : (
                            <span>انتخاب بازه زمانی</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        {dateRange?.from && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 z-10"
                                onClick={() => setDateRange(undefined)}
                                aria-label="پاک کردن بازه زمانی"
                            >
                                <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                        )}
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            locale={faIR}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
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
                  {displayableCategories.length > 0 ? (
                    <ScrollArea className="h-28 pr-3">
                      <div className="flex flex-wrap gap-2">
                        {displayableCategories.map(category => (
                          <Badge
                            key={category.id}
                            variant={selectedCategories.includes(category.name) ? "default" : "secondary"}
                            onClick={() => toggleCategoryFilter(category.name)}
                            className="cursor-pointer py-1.5 px-3 text-xs transition-all hover:opacity-80"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && toggleCategoryFilter(category.name)}
                          >
                            {category.name}
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
          // Pass availableCategories from API to NoteForm
          // availableCategories={availableCategoriesFromApi} 
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
