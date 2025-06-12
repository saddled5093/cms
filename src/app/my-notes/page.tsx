
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Note, Category, CurrentUser } from "@/types";
import NoteCard from "@/components/note-card";
import ConfirmDialog from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FilePlus, ServerCrash, FilterX, Search, Calendar as CalendarIconLucide, XCircle, Loader2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { startOfDay, endOfDay, parseISO, isValid as isValidDateFn } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';
import { format as formatJalali } from 'date-fns-jalali';
import type { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";


type ArchiveFilterStatus = "all" | "archived" | "unarchived";
type PublishFilterStatus = "all" | "published" | "unpublished"; // For user's own notes

export default function MyNotesPage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  const [titleSearch, setTitleSearch] = useState("");
  const [contentSearch, setContentSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [debouncedTitleSearch, setDebouncedTitleSearch] = useState("");
  const [debouncedContentSearch, setDebouncedContentSearch] = useState("");
  const [debouncedPhoneSearch, setDebouncedPhoneSearch] = useState("");

  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<1 | 2>(1);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilterStatus>("all");
  const [publishFilter, setPublishFilter] = useState<PublishFilterStatus>("all");

  const { toast } = useToast();

  const processFetchedNote = (note: any): Note => {
    let eventDt = note.eventDate ? parseISO(note.eventDate) : (note.createdAt ? parseISO(note.createdAt) : new Date());
    if (!isValidDateFn(eventDt)) eventDt = new Date();
    let createdDt = note.createdAt ? parseISO(note.createdAt) : new Date();
    if (!isValidDateFn(createdDt)) createdDt = new Date();
    let updatedDt = note.updatedAt ? parseISO(note.updatedAt) : new Date();
    if (!isValidDateFn(updatedDt)) updatedDt = new Date();

    return {
      ...note,
      eventDate: eventDt,
      createdAt: createdDt,
      updatedAt: updatedDt,
      authorId: note.authorId || note.author?.id, // Ensure authorId is present
      author: note.author ? { id: note.author.id, username: note.author.username } : undefined,
      categories: Array.isArray(note.categories)
        ? note.categories.map((c: any) => (typeof c === 'string' ? { id: c, name: c } : (c && c.name ? c : { id: String(c), name: String(c) })))
        : [],
      tags: Array.isArray(note.tags) ? note.tags : (typeof note.tags === 'string' ? JSON.parse(note.tags || "[]") : []),
      phoneNumbers: Array.isArray(note.phoneNumbers) ? note.phoneNumbers : (typeof note.phoneNumbers === 'string' ? JSON.parse(note.phoneNumbers || "[]") : []),
      province: note.province || "",
      rating: note.rating ?? 0,
      comments: (note.comments || []).map((comment: any) => ({
        ...comment,
        createdAt: comment.createdAt ? parseISO(comment.createdAt) : new Date(),
        updatedAt: comment.updatedAt ? parseISO(comment.updatedAt) : new Date(),
      })),
    };
  };

  const fetchNotes = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingNotes(true);
    try {
      const response = await fetch(`/api/notes?filter=mine&userId=${currentUser.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch your notes');
      }
      let fetchedNotesRaw: any[] = await response.json();
      const processedNotes = fetchedNotesRaw.map(processFetchedNote);
      setNotes(processedNotes);
    } catch (error) {
      console.error("Failed to load your notes from API", error);
      toast({
        title: "خطا",
        description: "بارگذاری یادداشت‌های شما از سرور ممکن نبود.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNotes(false);
    }
  }, [currentUser, toast]);

  const fetchAvailableCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data: Category[] = await response.json();
      setAvailableCategories(data.map(c => ({...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt)})).sort((a,b) => a.name.localeCompare(b.name, 'fa')));
    } catch (error) {
      console.error("Failed to load categories for filter", error);
      toast({ title: "خطا در بارگذاری دسته‌بندی‌ها", description: "لیست دسته‌بندی‌ها برای فیلتر بارگذاری نشد.", variant: "destructive" });
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
      if (cat && cat.id && cat.name && !catMap.has(cat.id)) {
        catMap.set(cat.id, cat);
      }
    }));
    return Array.from(catMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  }, [notes]);

  const displayableCategoriesForFilter = useMemo(() => {
    return allUniqueCategoriesFromNotes.length > 0 ? allUniqueCategoriesFromNotes : availableCategories;
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

  const handleDeleteNoteRequest = (noteId: string) => {
    setNoteToDeleteId(noteId);
    setDeleteConfirmationStep(1);
  };

  const confirmDeleteNote = async () => {
    if (deleteConfirmationStep === 1) {
      setDeleteConfirmationStep(2);
    } else if (deleteConfirmationStep === 2 && noteToDeleteId) {
      try {
        const response = await fetch(`/api/notes/${noteToDeleteId}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || "Failed to delete note from server");
        }
        setNotes(notes.filter((note) => note.id !== noteToDeleteId));
        toast({ title: "یادداشت حذف شد" });
      } catch (error: any) {
        console.error("Failed to delete note:", error);
        toast({ title: "خطا در حذف یادداشت", description: error.message, variant: "destructive" });
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
    try {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...noteToUpdate, eventDate: (noteToUpdate.eventDate as Date).toISOString(), isArchived: newArchivedState, categoryIds: noteToUpdate.categories.map(c => c.id) }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || "Failed to update archive status on server");
        }
        const updatedNoteRaw = await response.json();
        const updatedNote = processFetchedNote(updatedNoteRaw);
        setNotes(prevNotes => prevNotes.map(note => note.id === noteId ? updatedNote : note));
        toast({ title: `یادداشت ${newArchivedState ? "آرشیو شد" : "از آرشیو خارج شد" }` });
    } catch (error: any) {
        console.error("Failed to toggle archive status:", error);
        toast({ title: "خطا در تغییر وضعیت آرشیو", description: error.message, variant: "destructive" });
    }
  };

  const handleTogglePublish = async (noteId: string) => {
    const noteToUpdate = notes.find(n => n.id === noteId);
    if (!noteToUpdate) return;

    const newPublishedState = !noteToUpdate.isPublished;
    try {
         const response = await fetch(`/api/notes/${noteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...noteToUpdate, eventDate: (noteToUpdate.eventDate as Date).toISOString(), isPublished: newPublishedState, categoryIds: noteToUpdate.categories.map(c => c.id) }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || "Failed to update publish status on server");
        }
        const updatedNoteRaw = await response.json();
        const updatedNote = processFetchedNote(updatedNoteRaw);
        setNotes(prevNotes => prevNotes.map(note => note.id === noteId ? updatedNote : note));
        toast({ title: `وضعیت انتشار یادداشت ${newPublishedState ? "به 'منتشر شده' تغییر کرد" : "به 'عدم انتشار' تغییر کرد" }` });
    } catch (error: any) {
        console.error("Failed to toggle publish status:", error);
        toast({ title: "خطا در تغییر وضعیت انتشار", description: error.message, variant: "destructive" });
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


    return tempNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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

  if (isAuthLoading || (isLoadingNotes && !notes.length && currentUser)) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg text-foreground">در حال بارگذاری یادداشت‌های شما...</p>
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
            <Search className="ml-2 h-5 w-5" />
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
              placeholder="جستجو محتوا (فیلتر دقیق‌تر)..."
              value={contentSearch}
              onChange={(e) => setContentSearch(e.target.value)}
              className="bg-input placeholder:text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="جستجو شماره تلفن (فیلتر دقیق‌تر)..."
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
                    className={`w-full justify-start text-left font-normal bg-input hover:bg-muted/30 ${!dateRange && "text-muted-foreground"
                      }`}
                  >
                    <CalendarIconLucide className="ml-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {formatJalali(dateRange.from, "yyyy/M/d", { locale: faIR })} -{" "}
                          {formatJalali(dateRange.to, "yyyy/M/d", { locale: faIR })}
                        </>
                      ) : (
                        formatJalali(dateRange.from, "yyyy/M/d", { locale: faIR })
                      )
                    ) : (
                      <span>انتخاب بازه زمانی رویداد</span>
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
            <h1 className="text-2xl font-headline text-primary flex items-center">
              <User className="ml-2 h-6 w-6" />
              یادداشت‌های من
            </h1>
          </div>
          <Button
            asChild
            className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transition-transform hover:scale-105"
            aria-label="ایجاد یادداشت جدید"
          >
            <Link href="/notes/new">
              <FilePlus className="ml-2 h-5 w-5" />
              یادداشت جدید
            </Link>
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
                  {displayableCategoriesForFilter.length > 0 ? (
                    <ScrollArea className="h-28 pr-3">
                      <div className="flex flex-wrap gap-2">
                        {displayableCategoriesForFilter.map(category => (
                          <Badge
                            key={category.id}
                            variant={selectedCategories.includes(category.id) ? "default" : "secondary"}
                            onClick={() => toggleCategoryFilter(category.id)}
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
                    currentUser={currentUser as CurrentUser} // currentUser is checked to not be null before rendering this
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
                    : "هنوز یادداشتی ایجاد نکرده‌اید"}
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

        <ConfirmDialog
          isOpen={!!noteToDeleteId}
          onClose={cancelDeleteNote}
          onConfirm={confirmDeleteNote}
          title={deleteConfirmationStep === 1 ? "حذف یادداشت" : "تأیید نهایی حذف"}
          description={
            deleteConfirmationStep === 1
              ? "آیا از حذف این یادداشت مطمئن هستید؟ این عمل، نظرات مرتبط را نیز حذف خواهد کرد."
              : "این عمل غیرقابل بازگشت است و یادداشت و تمام نظرات آن برای همیشه حذف خواهند شد. آیا کاملاً مطمئن هستید؟"
          }
        />
      </div>
    </>
  );
}
