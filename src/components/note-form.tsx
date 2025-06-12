
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Note } from "@/types";
import { useEffect } from "react";

const iranProvinces = [
  "البرز", "اردبیل", "آذربایجان شرقی", "آذربایجان غربی", "بوشهر", "چهارمحال و بختیاری",
  "فارس", "گیلان", "گلستان", "همدان", "هرمزگان", "ایلام", "اصفهان", "کرمان",
  "کرمانشاه", "خراسان شمالی", "خراسان رضوی", "خراسان جنوبی", "خوزستان",
  "کهگیلویه و بویراحمد", "کردستان", "لرستان", "مرکزی", "مازندران", "قزوین",
  "قم", "سمنان", "سیستان و بلوچستان", "تهران", "یزد", "زنجان"
].sort((a, b) => a.localeCompare(b, 'fa'));


const noteFormSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است").max(100, "عنوان باید ۱۰۰ کاراکتر یا کمتر باشد"),
  content: z.string().min(1, "محتوا الزامی است"),
  categories: z.string().optional(), // Comma-separated string
  tags: z.string().optional(), // Comma-separated string
  province: z.string().min(1, "انتخاب استان الزامی است"),
  phoneNumbers: z.string().optional(), // Comma-separated string for phone numbers
  isArchived: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export type NoteFormData = {
  title: string;
  content: string;
  categories: string[];
  tags: string[];
  province: string;
  phoneNumbers: string[];
  isArchived: boolean;
  isPublished: boolean;
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
      province: "",
      phoneNumbers: "",
      isArchived: false,
      isPublished: false,
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
          province: initialData.province || "",
          phoneNumbers: initialData.phoneNumbers?.join(", ") || "",
          isArchived: initialData.isArchived || false,
          isPublished: initialData.isPublished || false,
        });
      } else {
        form.reset({ title: "", content: "", categories: "", tags: "", province: "", phoneNumbers: "", isArchived: false, isPublished: false });
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
    const phoneNumbersArray = data.phoneNumbers
      ? data.phoneNumbers.split(",").map((pn) => pn.trim()).filter(pn => pn)
      : [];
    
    onSubmit({
      title: data.title,
      content: data.content,
      categories: categoriesArray,
      tags: tagsArray,
      province: data.province,
      phoneNumbers: phoneNumbersArray,
      isArchived: data.isArchived || false,
      isPublished: data.isPublished || false,
    });
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        form.reset(); 
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
                      className="min-h-[120px] bg-input text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">استان</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger className="bg-input text-foreground placeholder:text-muted-foreground">
                        <SelectValue placeholder="یک استان انتخاب کنید" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {iranProvinces.map((provinceName) => (
                        <SelectItem key={provinceName} value={provinceName}>
                          {provinceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumbers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">شماره‌های تلفن (با کاما جدا کنید)</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹, ۰۲۱۸۷۶۵۴۳۲۱" {...field} className="bg-input text-foreground placeholder:text-muted-foreground"/>
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
             <FormField
              control={form.control}
              name="isArchived"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-input">
                  <div className="space-y-0.5">
                    <FormLabel className="text-foreground">آرشیو کردن</FormLabel>
                    <FormDescription className="text-muted-foreground text-xs">
                      یادداشت را به آرشیو منتقل کن.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-input">
                  <div className="space-y-0.5">
                    <FormLabel className="text-foreground">انتشار عمومی</FormLabel>
                    <FormDescription className="text-muted-foreground text-xs">
                      این یادداشت برای نمایش عمومی منتشر شود.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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

