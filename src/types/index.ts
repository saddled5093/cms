
// Prisma now generates types, but we can define frontend-specific variations if needed.
// For example, API response types or form data types.

export interface Comment {
  id: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  authorId: string;
  author: { username: string };
  noteId: string;
}

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
  rating?: number | null; // Rating from 0 to 5
  comments?: Comment[]; // Array of comments
  authorId?: string; // Optional on frontend if not always needed
  author?: { username: string }; // Optional author info
}

// You would also define User and Category types for the frontend if needed,
// or rely on Prisma types passed through the API.
export interface Category {
  id: string;
  name: string;
}
