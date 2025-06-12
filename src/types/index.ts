export interface Note {
  id: string;
  title: string;
  content: string;
  categories: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
