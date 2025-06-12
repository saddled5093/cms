
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit3, Check, X, ListChecks, LayoutDashboard, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Category } from "@/types"; 
import { useAuth } from "@/contexts/AuthContext"; 


interface EditableCategory extends Category {
  isEditing: boolean;
  currentName: string;
}

export default function ManageCategoriesPage() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [editableCategories, setEditableCategories] = useState<EditableCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
        setIsLoadingCategories(false);
        return;
    }
    setIsLoadingCategories(true);
    try {
      const response = await fetch('/api/categories'); 
      if (!response.ok) throw new Error('Failed to fetch categories');
      const fetchedCategories: Category[] = await response.json();
      
      setEditableCategories(
        fetchedCategories.map(cat => ({
          ...cat,
          isEditing: false,
          currentName: cat.name,
          createdAt: new Date(cat.createdAt), // Ensure dates are Date objects
          updatedAt: new Date(cat.updatedAt),
        })).sort((a,b) => a.name.localeCompare(b.name, 'fa'))
      );
    } catch (error) {
      console.error("Failed to load categories", error);
      toast({
        title: "خطا",
        description: "بارگذاری دسته‌بندی‌ها با مشکل مواجه شد.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);


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
      const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmedNewName }),
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add category');
      }
      const newCategory: Category = await response.json();
      
      setEditableCategories((prev) => 
          [...prev, { ...newCategory, isEditing: false, currentName: newCategory.name, createdAt: new Date(newCategory.createdAt), updatedAt: new Date(newCategory.updatedAt) }]
          .sort((a,b) => a.name.localeCompare(b.name, 'fa'))
      );
      setNewCategoryName("");
      toast({ title: "موفقیت", description: `دسته‌بندی «${trimmedNewName}» اضافه شد.` });
    } catch (error: any) {
      console.error("Failed to add category", error);
      toast({ title: "خطا", description: error.message || "افزودن دسته‌بندی با مشکل مواجه شد.", variant: "destructive" });
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

    if (newTrimmedName === categoryToEdit.name) { // No change
        toggleEditMode(categoryIdToRename); // Just close edit mode
        return;
    }

    if (editableCategories.some(ec => ec.name === newTrimmedName && ec.id !== categoryIdToRename)) {
      toast({ title: "خطا", description: `دسته‌بندی با نام «${newTrimmedName}» از قبل وجود دارد.`, variant: "destructive" });
      return;
    }
    
    const originalName = categoryToEdit.name;

    try {
      const response = await fetch(`/api/categories/${categoryIdToRename}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newTrimmedName }),
      });
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to rename category');
      }
      const updatedCategory: Category = await response.json();
      
      setEditableCategories(prev =>
        prev.map(ec =>
          ec.id === categoryIdToRename
            ? { ...updatedCategory, isEditing: false, currentName: updatedCategory.name, createdAt: new Date(updatedCategory.createdAt), updatedAt: new Date(updatedCategory.updatedAt) }
            : ec
        ).sort((a,b) => a.name.localeCompare(b.name, 'fa'))
      );
      
      toast({ title: "موفقیت", description: `نام دسته‌بندی از «${originalName}» به «${newTrimmedName}» تغییر یافت.` });
    } catch (error: any) {
      console.error("Failed to rename category", error);
      toast({ title: "خطای بروزرسانی دسته‌بندی", description: error.message || "تغییر نام دسته‌بندی با مشکل مواجه شد.", variant: "destructive" });
    }
  };


  if (isAuthLoading || (isLoadingCategories && !editableCategories.length)) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg text-foreground">در حال بارگذاری دسته‌بندی‌ها...</p>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
        <div className="container mx-auto p-4 md:p-8 text-center">
            <p className="text-lg text-destructive">شما اجازه دسترسی به این صفحه را ندارید.</p>
            <Button asChild className="mt-4">
                <Link href="/">بازگشت به داشبورد</Link>
            </Button>
        </div>
    )
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
                  className="flex-grow bg-input text-foreground placeholder:text-muted-foreground"
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
              {isLoadingCategories && editableCategories.length === 0 ? (
                 <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                 </div>
              ) : editableCategories.length > 0 ? (
                <ul className="space-y-2">
                  {editableCategories.map((ec) => (
                    <li
                      key={ec.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/60 transition-colors"
                    >
                      {ec.isEditing ? (
                        <Input
                          type="text"
                          value={ec.currentName}
                          onChange={(e) => handleNameChange(ec.id, e.target.value)}
                          className="flex-grow mr-2 bg-input text-foreground"
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
                        {/* Optional: Delete button can be added here
                         <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(ec.id)} className="text-destructive hover:text-destructive/80">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                        */}
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
