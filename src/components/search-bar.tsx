
"use client";

import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import type { ChangeEvent } from "react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  className?: string;
  placeholder?: string;
}

export default function SearchBar({ searchTerm, onSearchChange, className, placeholder = "جستجوی یادداشت‌ها..." }: SearchBarProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <div className={`relative ${className}`}>
      <SearchIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleChange}
        className="w-full rounded-lg bg-background pr-10 pl-4 py-2 shadow-sm focus:ring-2 focus:ring-primary/50"
        aria-label="جستجو"
      />
    </div>
  );
}
