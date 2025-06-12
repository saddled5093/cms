
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit3, Check, X, ListChecks, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import type { Category } from "@/types"; // Assuming Category type exists
// import type { Note } from "@/types"; // Note type might be needed if updating notes


// const CATEGORIES_STORAGE_KEY = "not_categories_list"; // Will be fetched/updated via API
// const NOTES_STORAGE_KEY = "not_notes"; // Notes will be in DB

interface EditableCategory extends Category { // Use Category type from src/types
  isEditing: boolean;
  currentName: string;
}

export default function ManageCategoriesPage() {
  const [editableCategories, setEditableCategories] = useState<EditableCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        // const response = await fetch('/api/categories'); // Replace with your API endpoint
        // if (!response.ok) {
        //   throw new Error('Failed to fetch categories');
        // }
        // const fetchedCategories: Category[] = await response.json();
        const placeholderCategories: Category[] = [
             { id: "cat1_placeholder", name: "عمومی (از کت)" }, 
             { id: "cat2_placeholder", name: "کاری (از کت)"},
             { id: "cat3_placeholder", name: "شخصی (از کت)"}
        ]; // Placeholder
        
        setEditableCategories(
          placeholderCategories.map(cat => ({
            ...cat,
            isEditing: false,
            currentName: cat.name,
          })).sort((a,b) => a.name.localeCompare(b.name, 'fa'))
        );
      } catch (error) {
        console.error("Failed to load categories from API", error);
        toast({
          title: "خطا",
          description: "بارگذاری دسته‌بندی‌ها از سرور ممکن نبود.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [toast]);


  const handleAddCategory = async () => {
    const trimmedNewName = newCategoryName.trim();
    if (!trimmedNewName) {
      toast({ title: "خطا", description: "نام دسته‌بندی نمی‌تواند خالی باشد.", variant: "destructive" });
      return;
    }
    if (editableCategories.some(ec => ec.name === trimmedNewName)) {
      toast({ title: "خطا", description: "این دسته‌بندی از قبل وجود دارد.", variant: "destructive" });
      return;
    }

    try {
    //   const response = await fetch('/api/categories', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ name: trimmedNewName }),
    //   });
    //   if (!response.ok) {
    //     throw new Error('Failed to add category');
    //   }
    //   const newCategory: Category = await response.json();
      const newCategory: Category = { id: Date.now().toString(), name: trimmedNewName }; // Placeholder

      setEditableCategories((prev) => 
          [...prev, { ...newCategory, isEditing: false, currentName: newCategory.name }]
          .sort((a,b) => a.name.localeCompare(b.name, 'fa'))
      );
      setNewCategoryName("");
      toast({ title: "موفقیت", description: `دسته‌بندی «${trimmedNewName}» اضافه شد.` });
    } catch (error) {
      console.error("Failed to add category", error);
      toast({ title: "خطا", description: "افزودن دسته‌بندی با مشکل مواجه شد.", variant: "destructive" });
    }
  };

  const toggleEditMode = (categoryId: string) => {
    setEditableCategories(prev =>
      prev.map(ec =>
        ec.id === categoryId
          ? { ...ec, isEditing: !ec.isEditing, currentName: ec.name } 
          : { ...ec, isEditing: false } 
      )
    );
  };

  const handleNameChange = (categoryId: string, newCurrentName: string) => {
    setEditableCategories(prev =>
      prev.map(ec =>
        ec.id === categoryId
          ? { ...ec, currentName: newCurrentName }
          : ec
      )
    );
  };

  const handleSaveRename = async (categoryIdToRename: string) => {
    const categoryToEdit = editableCategories.find(ec => ec.id === categoryIdToRename);
    if (!categoryToEdit) return;

    const newTrimmedName = categoryToEdit.currentName.trim();

    if (!newTrimmedName) {
      toast({ title: "خطا", description: "نام دسته‌بندی نمی‌تواند خالی باشد.", variant: "destructive" });
      return;
    }

    if (newTrimmedName !== categoryToEdit.name && editableCategories.some(ec => ec.name === newTrimmedName && ec.id !== categoryIdToRename)) {
      toast({ title: "خطا", description: `دسته‌بندی با نام «${newTrimmedName}» از قبل وجود دارد.`, variant: "destructive" });
      return;
    }
    
    const originalName = categoryToEdit.name;

    try {
    //   const response = await fetch(`/api/categories/${categoryIdToRename}`, {
    //     method: 'PUT', // or PATCH
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ name: newTrimmedName }),
    //   });
    //   if (!response.ok) {
    //     throw new Error('Failed to rename category');
    //   }
    //   const updatedCategory: Category = await response.json();
      const updatedCategory: Category = { ...categoryToEdit, name: newTrimmedName }; // Placeholder


      setEditableCategories(prev =>
        prev.map(ec =>
          ec.id === categoryIdToRename
            ? { ...updatedCategory, isEditing: false, currentName: updatedCategory.name }
            : ec
        ).sort((a,b) => a.name.localeCompare(b.name, 'fa'))
      );
      
      // Note: Updating categories in all notes would now typically be handled by the backend
      // or through a separate process if relational integrity is maintained in the DB.
      // If you were to update notes on client-side (not recommended with DB):
      // localStorage logic for notes would need to fetch, update, and save.
      
      toast({ title: "موفقیت", description: `نام دسته‌بندی از «${originalName}» به «${newTrimmedName}» تغییر یافت.` });
    } catch (error) {
      console.error("Failed to rename category", error);
      toast({ title: "خطای بروزرسانی دسته‌بندی", description: "تغییر نام دسته‌بندی با مشکل مواجه شد.", variant: "destructive" });
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
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/" className="flex items-center">
                    <LayoutDashboard className="ml-2 h-4 w-4" />
                    داشبورد
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/notes">بازگشت به لیست یادداشت‌ها</Link>
                </Button>
              </div>
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
                      key={ec.id} // Use id as key
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/60 transition-colors"
                    >
                      {ec.isEditing ? (
                        <Input
                          type="text"
                          value={ec.currentName}
                          onChange={(e) => handleNameChange(ec.id, e.target.value)}
                          className="flex-grow mr-2"
                          autoFocus
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveRename(ec.id)}
                        />
                      ) : (
                        <span className="text-foreground">{ec.name}</span>
                      )}
                      <div className="flex gap-1">
                        {ec.isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveRename(ec.id)}
                              aria-label={`ذخیره تغییر نام ${ec.name}`}
                              className="text-green-500 hover:text-green-400"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleEditMode(ec.id)}
                              aria-label={`لغو تغییر نام ${ec.name}`}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleEditMode(ec.id)}
                            aria-label={`تغییر نام دسته‌بندی ${ec.name}`}
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
