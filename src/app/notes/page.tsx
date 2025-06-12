
"use client";

import { useState, useEffect, useMemo, useCallback } from "react"; // Added useCallback
import type { Note, Category } from "@/types";
import type { NoteFormData } from "@/components/note-form";
import NoteCard from "@/components/note-card";
import NoteForm from "@/components/note-form";
import ConfirmDialog from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FilePlus, ServerCrash, FilterX, Search, Calendar as CalendarIconLucide, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link"; 
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format as formatDateFn, startOfDay, endOfDay, parseISO, isValid as isValidDateFn } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';
import { format as formatJalali } from 'date-fns-jalali';
import type { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth

type ArchiveFilterStatus = "all" | "archived" | "unarchived";
type PublishFilterStatus = "all" | "published" | "unpublished";

export default function NotesPage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth(); // Get currentUser
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  
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

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilterStatus>("all");
  const [publishFilter, setPublishFilter] = useState<PublishFilterStatus>("all");

  const { toast } = useToast();

  const fetchNotes = useCallback(async () => {
    if (!currentUser) return; // Don't fetch if no user
    setIsLoadingNotes(true);
    try {
      // TODO: Add query param for authorId if non-admin, or fetch all if admin
      // For now, assuming API filters by author or returns all if admin.
      const response = await fetch(`/api/notes?userId=${currentUser.id}`); 
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      let fetchedNotes: any[] = await response.json();
      
      fetchedNotes = fetchedNotes.map(note => {
        let eventDt = note.eventDate ? parseISO(note.eventDate) : (note.createdAt ? parseISO(note.createdAt) : new Date());
        if (!isValidDateFn(eventDt)) eventDt = new Date();
        let createdDt = note.createdAt ? parseISO(note.createdAt) : new Date();
        if(!isValidDateFn(createdDt)) createdDt = new Date();
        let updatedDt = note.updatedAt ? parseISO(note.updatedAt) : new Date();
        if(!isValidDateFn(updatedDt)) updatedDt = new Date();

        return {
          ...note,
          eventDate: eventDt,
          createdAt: createdDt,
          updatedAt: updatedDt,
          // Ensure categories is an array of {id, name} objects
          categories: Array.isArray(note.categories) 
            ? note.categories.map((c: any) => (typeof c === 'string' ? {id: c, name: c} : (c && c.name ? c : {id: String(c), name: String(c)}))) 
            : [],
          tags: Array.isArray(note.tags) ? note.tags : [],
          phoneNumbers: Array.isArray(note.phoneNumbers) ? note.phoneNumbers : [],
          province: note.province || "",
        };
      });

      setNotes(fetchedNotes as Note[]);
    } catch (error) {
      console.error("Failed to load notes from API", error);
      toast({
        title: "خطا",
        description: "بارگذاری یادداشت‌ها از سرور ممکن نبود.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNotes(false);
    }
  }, [currentUser, toast]);

  const fetchAvailableCategories = useCallback(async () => {
    // This should fetch categories from API eventually
    // For now, it might still rely on seed or a simpler mechanism if API is not ready
    // Or, derive from notes if API doesn't exist for categories yet.
    try {
      // const response = await fetch('/api/categories');
      // if (!response.ok) throw new Error('Failed to fetch categories');
      // const data: Category[] = await response.json();
      // setAvailableCategories(data.sort((a,b) => a.name.localeCompare(b.name, 'fa')));
       const placeholderCategories: Category[] = [
            // { id: "cat1", name: "عمومی" }, {id: "cat2", name: "کاری"}
        ]; 
        setAvailableCategories(placeholderCategories);

    } catch (error) {
      console.error("Failed to load categories", error);
      // toast({ title: "خطا در بارگذاری دسته‌بندی‌ها", variant: "destructive" });
    }
  }, [toast]);


  useEffect(() => {
    if (currentUser) {
      fetchNotes();
      fetchAvailableCategories();
    }
  }, [currentUser, fetchNotes, fetchAvailableCategories]);
  
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

  const allUniqueCategoriesFromNotes = useMemo(() => {
    const catMap = new Map<string, Category>();
    notes.forEach(note => note.categories.forEach(cat => {
        if(cat && cat.id && cat.name && !catMap.has(cat.id)) {
            catMap.set(cat.id, cat);
        }
    }));
    return Array.from(catMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  }, [notes]);
  
  const displayableCategories = useMemo(() => {
      return availableCategories.length > 0 ? availableCategories : allUniqueCategoriesFromNotes;
  }, [availableCategories, allUniqueCategoriesFromNotes]);


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

  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(cId => cId !== categoryId)
        : [...prev, categoryId]
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
    if (!currentUser) {
        toast({ title: "خطا", description: "برای ذخیره یادداشت باید وارد شوید.", variant: "destructive"});
        return;
    }
    const payload = { 
        ...data, 
        authorId: currentUser.id,
        eventDate: data.eventDate.toISOString(),
        // categoryIds should already be in data from NoteForm
    };

    try {
      let response;
      let savedNoteData;

      if (editingNote) {
        // TODO: Implement PUT /api/notes/:id
        console.warn("Update (PUT) not fully implemented yet, using optimistic update for now.");
         setNotes(
            notes.map((note) =>
            note.id === editingNote.id
                ? { 
                    ...note, 
                    ...data,
                    eventDate: data.eventDate, 
                    updatedAt: new Date(),
                    categories: data.categoryIds.map(id => {
                        const foundCat = displayableCategories.find(ac => ac.id === id);
                        return foundCat || { id: id, name: id };
                    })
                }
                : note
            )
        );
        savedNoteData = { ...editingNote, ...data, eventDate: data.eventDate.toISOString(), updatedAt: new Date().toISOString() };

      } else {
        response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
         if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.details || 'Failed to save note');
        }
        savedNoteData = await response.json();
      }

      const finalNote: Note = {
        ...savedNoteData,
        eventDate: parseISO(savedNoteData.eventDate as string),
        createdAt: parseISO(savedNoteData.createdAt as string),
        updatedAt: parseISO(savedNoteData.updatedAt as string),
        categories: savedNoteData.categories || [], // Ensure categories is an array
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
        // TODO: Implement DELETE /api/notes/:id
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
    // TODO: Call API to update archive status
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, isArchived: newArchivedState, updatedAt: new Date() } : note
      )
    );
    toast({ title: `یادداشت (محلی) ${newArchivedState ? "آرشیو شد" : "از آرشیو خارج شد" }` });
  };

  const handleTogglePublish = async (noteId: string) => {
    const noteToUpdate = notes.find(n => n.id === noteId);
    if (!noteToUpdate) return;
    
    const newPublishedState = !noteToUpdate.isPublished;
     // TODO: Call API to update publish status
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, isPublished: newPublishedState, updatedAt: new Date() } : note
      )
    );
    toast({ title: `وضعیت انتشار یادداشت (محلی) ${newPublishedState ? "به 'منتشر شده' تغییر کرد" : "به 'عدم انتشار' تغییر کرد" }` });
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
        const noteEventDate = new Date(note.eventDate); // Already a Date object
        return isValidDateFn(noteEventDate) && noteEventDate >= startDate && noteEventDate <= endDate;
      });
    }

    if (selectedCategories.length > 0) {
      tempNotes = tempNotes.filter(note =>
        selectedCategories.every(scId => note.categories.some(cat => cat.id === scId))
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

    return tempNotes.sort((a, b) => {
        const dateA = new Date(a.eventDate);
        const dateB = new Date(b.eventDate);
        if (!isValidDateFn(dateA) && !isValidDateFn(dateB)) return 0;
        if (!isValidDateFn(dateA)) return 1; // put invalid dates at the end
        if (!isValidDateFn(dateB)) return -1; // put invalid dates at the end
        return dateB.getTime() - dateA.getTime();
    });
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

  if (isAuthLoading || (isLoadingNotes && !notes.length)) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg text-foreground">در حال بارگذاری یادداشت‌ها...</p>
      </div>
    );
  }
  
  if (!currentUser && !isAuthLoading) {
      return (
        <div className="container mx-auto p-4 md:p-8 text-center">
            <p className="text-lg text-destructive">برای مشاهده یادداشت‌ها ابتدا باید وارد شوید.</p>
            <Button asChild className="mt-4">
                <Link href="/login">رفتن به صفحه ورود</Link>
            </Button>
        </div>
      )
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
                            required
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
                            variant={selectedCategories.includes(category.id) ? "default" : "secondary"}
                            onClick={() => toggleCategoryFilter(category.id)} // Use category.id for filtering
                            className="cursor-pointer py-1.5 px-3 text-xs transition-all hover:opacity-80"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && toggleCategoryFilter(category.id)}
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
                    : "هنوز یادداشتی ایجاد نشده است"}
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
          availableCategories={displayableCategories} 
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
