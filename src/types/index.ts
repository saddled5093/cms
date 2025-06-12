
// Prisma now generates types, but we can define frontend-specific variations if needed.

export interface Comment {
  id: string;
  content: string;
  createdAt: Date | string; // Allow Date for client-side, string for API
  updatedAt: Date | string;
  authorId: string;
  author: { username: string; id?: string }; // author might have id from API
  noteId: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  categories: { id: string; name: string }[];
  tags: string[]; // Will be parsed from JSON string from DB
  province: string;
  phoneNumbers: string[]; // Will be parsed from JSON string from DB
  eventDate: Date | string; 
  createdAt: Date | string;
  updatedAt: Date | string;
  isArchived: boolean;
  isPublished: boolean;
  rating?: number | null; 
  comments?: Comment[];
  authorId?: string; 
  author?: { username: string; id?: string }; // author might have id from API
}

export interface Category {
  id: string;
  name: string;
  createdAt: Date | string; // Add timestamps for consistency if needed by UI
  updatedAt: Date | string;
}

// User type for frontend context, can be simpler than Prisma's User
export interface CurrentUser {
    id: string;
    username: string;
    role: string; // "USER" | "ADMIN"
}

    