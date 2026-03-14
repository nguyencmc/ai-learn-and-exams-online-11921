export interface BookCategory {
  id: string;
  name: string;
}

export interface Chapter {
  id?: string;
  title: string;
  content: string;
  chapter_order: number;
}
