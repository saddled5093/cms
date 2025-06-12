"use client";

import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import type { ChangeEvent } from "react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  className?: string;
}

export default function SearchBar({ searchTerm, onSearchChange, className }: SearchBarProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <div className={`relative ${className}`}>
      <SearchIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /> {/* Changed left-3 to right-3 for RTL */}
      <Input
        type="search"
        placeholder="جستجوی یادداشت‌ها بر اساس عنوان یا محتوا..."
        value={searchTerm}
        onChange={handleChange}
        className="w-full rounded-lg bg-background pr-10 pl-4 py-2 shadow-sm focus:ring-2 focus:ring-primary/50" /* Changed pl-10 pr-4 to pr-10 pl-4 for RTL */
        aria-label="جستجوی یادداشت‌ها"
      />
    </div>
  );
}
