
export interface Note {
  id: string;
  title: string;
  content: string;
  categories: string[];
  tags: string[];
  province: string;
  phoneNumbers: string[];
  eventDate: Date; // New field for user-defined date
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  isPublished: boolean;
}
