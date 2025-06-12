
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit3, Check, X, ListChecks } from "lucide-react";
import Link from "next/link";
import type { Note } from "@/types";


const CATEGORIES_STORAGE_KEY = "not_categories_list";
const NOTES_STORAGE_KEY = "not_notes";

interface EditableCategory {
  originalName: string;
  isEditing: boolean;
  currentName: string;
}

export default function ManageCategoriesPage() {
  const [editableCategories, setEditableCategories] = useState<EditableCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (storedCategories) {
        const parsedCategories: string[] = JSON.parse(storedCategories);
        setEditableCategories(
          parsedCategories.map(name => ({
            originalName: name,
            isEditing: false,
            currentName: name,
          })).sort((a,b) => a.originalName.localeCompare(b.originalName, 'fa'))
        );
      }
    } catch (error) {
      console.error("Failed to load categories from localStorage", error);
      toast({
        title: "خطا",
        description: "بارگذاری دسته‌بندی‌های ذخیره شده ممکن نبود.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!isLoading) {
      try {
        const categoryNames = editableCategories.map(ec => ec.originalName).sort((a,b) => a.localeCompare(b, 'fa'));
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categoryNames));
      } catch (error) {
        console.error("Failed to save categories to localStorage", error);
      }
    }
  }, [editableCategories, isLoading]);

  const handleAddCategory = () => {
    const trimmedNewName = newCategoryName.trim();
    if (!trimmedNewName) {
      toast({
        title: "خطا",
        description: "نام دسته‌بندی نمی‌تواند خالی باشد.",
        variant: "destructive",
      });
      return;
    }
    if (editableCategories.some(ec => ec.originalName === trimmedNewName)) {
      toast({
        title: "خطا",
        description: "این دسته‌بندی از قبل وجود دارد.",
        variant: "destructive",
      });
      return;
    }
    setEditableCategories((prev) => 
        [...prev, { originalName: trimmedNewName, isEditing: false, currentName: trimmedNewName }]
        .sort((a,b) => a.originalName.localeCompare(b.originalName, 'fa'))
    );
    setNewCategoryName("");
    toast({
      title: "موفقیت",
      description: `دسته‌بندی «${trimmedNewName}» اضافه شد.`,
    });
  };

  const toggleEditMode = (originalName: string) => {
    setEditableCategories(prev =>
      prev.map(ec =>
        ec.originalName === originalName
          ? { ...ec, isEditing: !ec.isEditing, currentName: ec.originalName } // Reset currentName on toggle
          : { ...ec, isEditing: false } // Close other editing inputs
      )
    );
  };

  const handleNameChange = (originalName: string, newCurrentName: string) => {
    setEditableCategories(prev =>
      prev.map(ec =>
        ec.originalName === originalName
          ? { ...ec, currentName: newCurrentName }
          : ec
      )
    );
  };

  const handleSaveRename = (originalNameToRename: string) => {
    const categoryToEdit = editableCategories.find(ec => ec.originalName === originalNameToRename);
    if (!categoryToEdit) return;

    const newTrimmedName = categoryToEdit.currentName.trim();

    if (!newTrimmedName) {
      toast({ title: "خطا", description: "نام دسته‌بندی نمی‌تواند خالی باشد.", variant: "destructive" });
      return;
    }

    if (newTrimmedName !== originalNameToRename && editableCategories.some(ec => ec.originalName === newTrimmedName)) {
      toast({ title: "خطا", description: `دسته‌بندی با نام «${newTrimmedName}» از قبل وجود دارد.`, variant: "destructive" });
      return;
    }

    // Update category list
    setEditableCategories(prev =>
      prev.map(ec =>
        ec.originalName === originalNameToRename
          ? { originalName: newTrimmedName, isEditing: false, currentName: newTrimmedName }
          : ec
      ).sort((a,b) => a.originalName.localeCompare(b.originalName, 'fa'))
    );

    // Update categories in all notes
    try {
      const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
      let notes: Note[] = storedNotes ? JSON.parse(storedNotes) : [];
      let notesUpdated = false;

      notes = notes.map(note => {
        if (note.categories.includes(originalNameToRename)) {
          notesUpdated = true;
          return {
            ...note,
            categories: note.categories.map(cat => cat === originalNameToRename ? newTrimmedName : cat),
            updatedAt: new Date() // Optionally update timestamp
          };
        }
        return note;
      });

      if (notesUpdated) {
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
      }
      toast({ title: "موفقیت", description: `نام دسته‌بندی از «${originalNameToRename}» به «${newTrimmedName}» تغییر یافت.` });
    } catch (error) {
      console.error("Failed to update notes with new category name", error);
      toast({ title: "خطای بروزرسانی یادداشت‌ها", description: "تغییر نام دسته‌بندی در یادداشت‌ها با مشکل مواجه شد.", variant: "destructive" });
      // Optionally revert category name change if notes update fails critically
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <p>در حال بارگذاری دسته‌بندی‌ها...</p>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-4 md:p-8">
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-headline text-primary flex items-center">
                <ListChecks className="ml-2 h-6 w-6" />
                مدیریت دسته‌بندی‌ها
              </CardTitle>
              <Button variant="outline" asChild>
                <Link href="/notes">بازگشت به لیست یادداشت‌ها</Link>
              </Button>
            </div>
            <CardDescription>
              دسته‌بندی‌های خود را برای یادداشت‌ها اضافه و یا تغییر نام دهید.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-foreground">افزودن دسته‌بندی جدید</h3>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="نام دسته‌بندی جدید"
                  className="flex-grow"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <Button onClick={handleAddCategory} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <PlusCircle className="ml-2 h-5 w-5" />
                  افزودن
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">لیست دسته‌بندی‌ها</h3>
              {editableCategories.length > 0 ? (
                <ul className="space-y-2">
                  {editableCategories.map((ec) => (
                    <li
                      key={ec.originalName}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/60 transition-colors"
                    >
                      {ec.isEditing ? (
                        <Input
                          type="text"
                          value={ec.currentName}
                          onChange={(e) => handleNameChange(ec.originalName, e.target.value)}
                          className="flex-grow mr-2"
                          autoFocus
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveRename(ec.originalName)}
                        />
                      ) : (
                        <span className="text-foreground">{ec.originalName}</span>
                      )}
                      <div className="flex gap-1">
                        {ec.isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveRename(ec.originalName)}
                              aria-label={`ذخیره تغییر نام ${ec.originalName}`}
                              className="text-green-500 hover:text-green-400"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleEditMode(ec.originalName)}
                              aria-label={`لغو تغییر نام ${ec.originalName}`}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleEditMode(ec.originalName)}
                            aria-label={`تغییر نام دسته‌بندی ${ec.originalName}`}
                            className="text-accent hover:text-accent/80"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  هنوز دسته‌بندی‌ای اضافه نشده است.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

    