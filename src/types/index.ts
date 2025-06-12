
// Prisma now generates types, but we can define frontend-specific variations if needed.
// For example, API response types or form data types.

// This Note type should align with Prisma's Note model,
// especially for data coming from/to the API.
// For simplicity, we'll keep it similar for now, but in a real app,
// you might import Prisma's generated types: import type { Note as PrismaNote } from '@prisma/client';

export interface Note {
  id: string;
  title: string;
  content: string;
  categories: { id: string; name: string }[]; // Categories will likely be objects with id and name
  tags: string[];
  province: string;
  phoneNumbers: string[];
  eventDate: Date | string; // Date for Date objects, string for ISO strings from API
  createdAt: Date | string;
  updatedAt: Date | string;
  isArchived: boolean;
  isPublished: boolean;
  authorId?: string; // Optional on frontend if not always needed
  author?: { username: string }; // Optional author info
}

// You would also define User and Category types for the frontend if needed,
// or rely on Prisma types passed through the API.
export interface Category {
  id: string;
  name: string;
}
