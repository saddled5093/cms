
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, ListChecks } from "lucide-react";
import Link from "next/link";
import Header from "@/components/layout/header"; // Assuming Header is generic enough

const CATEGORIES_STORAGE_KEY = "not_categories_list";

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
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
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
      } catch (error) {
        console.error("Failed to save categories to localStorage", error);
      }
    }
  }, [categories, isLoading]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "خطا",
        description: "نام دسته‌بندی نمی‌تواند خالی باشد.",
        variant: "destructive",
      });
      return;
    }
    if (categories.includes(newCategoryName.trim())) {
      toast({
        title: "خطا",
        description: "این دسته‌بندی از قبل وجود دارد.",
        variant: "destructive",
      });
      return;
    }
    setCategories((prev) => [...prev, newCategoryName.trim()].sort((a, b) => a.localeCompare(b, 'fa')));
    setNewCategoryName("");
    toast({
      title: "موفقیت",
      description: `دسته‌بندی «${newCategoryName.trim()}» اضافه شد.`,
    });
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    setCategories((prev) => prev.filter((cat) => cat !== categoryToDelete));
    toast({
      title: "موفقیت",
      description: `دسته‌بندی «${categoryToDelete}» حذف شد.`,
    });
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
      {/* Minimal header, actual app header is in layout */}
      <div className="container mx-auto p-4 md:p-8">
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-headline text-primary flex items-center">
                <ListChecks className="ml-2 h-6 w-6" />
                مدیریت دسته‌بندی‌ها
              </CardTitle>
              <Button variant="outline" asChild>
                <Link href="/">بازگشت به صفحه اصلی</Link>
              </Button>
            </div>
            <CardDescription>
              دسته‌بندی‌های خود را برای یادداشت‌ها اضافه، مشاهده و حذف کنید.
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
              {categories.length > 0 ? (
                <ul className="space-y-2">
                  {categories.map((category) => (
                    <li
                      key={category}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/60 transition-colors"
                    >
                      <span className="text-foreground">{category}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(category)}
                        aria-label={`حذف دسته‌بندی ${category}`}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
