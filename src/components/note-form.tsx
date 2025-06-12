"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Note } from "@/types";
import { useEffect } from "react";

const noteFormSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است").max(100, "عنوان باید ۱۰۰ کاراکتر یا کمتر باشد"),
  content: z.string().min(1, "محتوا الزامی است"),
  categories: z.string().optional(), // Comma-separated string
  tags: z.string().optional(), // Comma-separated string
});

export type NoteFormData = {
  title: string;
  content: string;
  categories: string[];
  tags: string[];
};

// Internal form data type
type FormSchemaType = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NoteFormData) => void;
  initialData?: Partial<Note>;
}

export default function NoteForm({ isOpen, onClose, onSubmit, initialData }: NoteFormProps) {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: "",
      content: "",
      categories: "",
      tags: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          title: initialData.title || "",
          content: initialData.content || "",
          categories: initialData.categories?.join(", ") || "",
          tags: initialData.tags?.join(", ") || "",
        });
      } else {
        form.reset({ title: "", content: "", categories: "", tags: "" });
      }
    }
  }, [initialData, form, isOpen]);

  const handleFormSubmit = (data: FormSchemaType) => {
    const categoriesArray = data.categories
      ? data.categories.split(",").map((cat) => cat.trim()).filter(cat => cat)
      : [];
    const tagsArray = data.tags
      ? data.tags.split(",").map((tag) => tag.trim()).filter(tag => tag)
      : [];
    
    onSubmit({
      title: data.title,
      content: data.content,
      categories: categoriesArray,
      tags: tagsArray,
    });
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        form.reset(); // Ensure form is reset when dialog is closed via X or overlay click
      }
    }}>
      <DialogContent className="sm:max-w-[525px] bg-card text-card-foreground rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            {initialData?.id ? "ویرایش یادداشت" : "ایجاد یادداشت جدید"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 p-1">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">عنوان</FormLabel>
                  <FormControl>
                    <Input placeholder="عنوان یادداشت را وارد کنید" {...field} className="bg-input text-foreground placeholder:text-muted-foreground"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">محتوا</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="یادداشت خود را اینجا بنویسید..."
                      className="min-h-[150px] bg-input text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">دسته‌بندی‌ها (با کاما جدا کنید)</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: کار، شخصی، پروژه آلفا" {...field} className="bg-input text-foreground placeholder:text-muted-foreground"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">تگ‌ها (با کاما جدا کنید)</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: مهم، فوری، ایده" {...field} className="bg-input text-foreground placeholder:text-muted-foreground"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => { onClose(); form.reset(); }}>
                  انصراف
                </Button>
              </DialogClose>
              <Button type="submit" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                ذخیره یادداشت
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
