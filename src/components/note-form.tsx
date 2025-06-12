
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
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format as formatDateFn } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';
import { format as formatJalali } from 'date-fns-jalali';
import { cn } from "@/lib/utils";

const CATEGORIES_STORAGE_KEY = "not_categories_list";

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
  eventDate: z.date({ required_error: "انتخاب تاریخ رویداد الزامی است" }),
  categories: z.array(z.string()).optional().default([]), 
  tags: z.string().optional(), 
  province: z.string().min(1, "انتخاب استان الزامی است"),
  phoneNumbers: z.string().optional(), 
  isArchived: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export type NoteFormData = {
  title: string;
  content: string;
  eventDate: Date;
  categories: string[];
  tags: string[];
  province: string;
  phoneNumbers: string[];
  isArchived: boolean;
  isPublished: boolean;
};

type FormSchemaType = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NoteFormData) => void;
  initialData?: Partial<Note>;
}

export default function NoteForm({ isOpen, onClose, onSubmit, initialData }: NoteFormProps) {
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: "",
      content: "",
      eventDate: new Date(),
      categories: [],
      tags: "",
      province: "",
      phoneNumbers: "",
      isArchived: false,
      isPublished: false,
    },
  });

  const loadAvailableCategories = () => {
    try {
      const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (storedCategories) {
        setAvailableCategories(JSON.parse(storedCategories).sort((a: string, b: string) => a.localeCompare(b, 'fa')));
      } else {
        setAvailableCategories([]);
      }
    } catch (error) {
      console.error("Failed to load categories for form", error);
      setAvailableCategories([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAvailableCategories();
      if (initialData) {
        form.reset({
          title: initialData.title || "",
          content: initialData.content || "",
          eventDate: initialData.eventDate ? new Date(initialData.eventDate) : new Date(),
          categories: initialData.categories || [],
          tags: initialData.tags?.join(", ") || "",
          province: initialData.province || "",
          phoneNumbers: initialData.phoneNumbers?.join(", ") || "",
          isArchived: initialData.isArchived || false,
          isPublished: initialData.isPublished || false,
        });
      } else {
        form.reset({ 
            title: "", 
            content: "", 
            eventDate: new Date(),
            categories: [], 
            tags: "", 
            province: "", 
            phoneNumbers: "", 
            isArchived: false, 
            isPublished: false 
        });
      }
    }
  }, [initialData, form, isOpen]);

  const handleFormSubmit = (data: FormSchemaType) => {
    const tagsArray = data.tags
      ? data.tags.split(",").map((tag) => tag.trim()).filter(tag => tag)
      : [];
    const phoneNumbersArray = data.phoneNumbers
      ? data.phoneNumbers.split(",").map((pn) => pn.trim()).filter(pn => pn)
      : [];
    
    onSubmit({
      title: data.title,
      content: data.content,
      eventDate: data.eventDate,
      categories: data.categories || [],
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
      <DialogContent className="sm:max-w-3xl bg-card text-card-foreground rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            {initialData?.id ? "ویرایش یادداشت" : "ایجاد یادداشت جدید"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 p-1">
            <div className="md:flex md:gap-6">
              <div className="md:flex-grow space-y-6">
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
                          className="min-h-[200px] md:min-h-[300px] bg-input text-foreground placeholder:text-muted-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:w-1/3 space-y-6 mt-6 md:mt-0">
                 <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-foreground">تاریخ رویداد</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal bg-input hover:bg-muted/30",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="ml-2 h-4 w-4" />
                              {field.value ? (
                                formatJalali(field.value, "PPP", { locale: faIR })
                              ) : (
                                <span>یک تاریخ انتخاب کنید</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={faIR}
                            required
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-foreground">دسته‌بندی‌ها</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between bg-input text-foreground data-[placeholder]:text-muted-foreground">
                            <span className="truncate max-w-[calc(100%-2rem)]">
                              {field.value && field.value.length > 0
                                ? field.value.join('، ')
                                : "انتخاب دسته‌بندی‌ها"}
                            </span>
                            <ChevronDown className="mr-auto h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-60">
                           <ScrollArea className="h-full">
                          <DropdownMenuLabel>دسته‌بندی‌های موجود</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {availableCategories.length > 0 ? (
                            availableCategories.map((category) => (
                              <DropdownMenuCheckboxItem
                                key={category}
                                checked={field.value?.includes(category)}
                                onCheckedChange={(checked) => {
                                  const currentCategories = field.value || [];
                                  const newValue = checked
                                    ? [...currentCategories, category]
                                    : currentCategories.filter((c) => c !== category);
                                  field.onChange(newValue);
                                }}
                                onSelect={(e) => e.preventDefault()} // Prevents menu from closing
                              >
                                {category}
                              </DropdownMenuCheckboxItem>
                            ))
                          ) : (
                            <DropdownMenuItem disabled>دسته‌بندی‌ای برای انتخاب وجود ندارد.</DropdownMenuItem>
                          )}
                          </ScrollArea>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                      <FormLabel className="text-foreground">شماره‌های تلفن</FormLabel>
                      <FormControl>
                        <Input placeholder="با کاما جدا کنید" {...field} className="bg-input text-foreground placeholder:text-muted-foreground"/>
                      </FormControl>
                       <FormDescription className="text-xs">مثال: ۰۹۱۲۳۴۵۶۷۸۹, ۰۲۱۸۷۶۵۴۳۲۱</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">تگ‌ها</FormLabel>
                      <FormControl>
                        <Input placeholder="با کاما جدا کنید" {...field} className="bg-input text-foreground placeholder:text-muted-foreground"/>
                      </FormControl>
                       <FormDescription className="text-xs">مثال: مهم، فوری</FormDescription>
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
                          یادداشت به آرشیو منتقل شود.
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
                          این یادداشت عمومی منتشر شود.
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
              </div>
            </div>
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

