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
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  content: z.string().min(1, "Content is required"),
});

type NoteFormData = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NoteFormData) => void;
  initialData?: Partial<Note>; // Making initialData partial and more flexible
}

export default function NoteForm({ isOpen, onClose, onSubmit, initialData }: NoteFormProps) {
  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title || "",
        content: initialData.content || "",
      });
    } else {
      form.reset({ title: "", content: "" });
    }
  }, [initialData, form, isOpen]); // Reset form when initialData changes or dialog opens

  const handleFormSubmit = (data: NoteFormData) => {
    onSubmit(data);
    form.reset(); // Reset form after successful submission
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px] bg-card text-card-foreground rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            {initialData?.id ? "Edit Note" : "Create New Note"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 p-1">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter note title" {...field} className="bg-input text-foreground placeholder:text-muted-foreground"/>
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
                  <FormLabel className="text-foreground">Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your note here..."
                      className="min-h-[150px] bg-input text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Save Note
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
