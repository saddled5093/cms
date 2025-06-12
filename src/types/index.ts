
export interface Note {
  id: string;
  title: string;
  content: string;
  categories: string[];
  tags: string[];
  province: string; // New field for province
  phoneNumbers: string[]; // New field for multiple phone numbers
  createdAt: Date;
  updatedAt: Date;
}
