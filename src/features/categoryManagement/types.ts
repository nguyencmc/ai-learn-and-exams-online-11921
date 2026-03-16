export interface BaseCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  display_order: number | null;
  is_featured: boolean | null;
  created_at: string;
}

export interface ExamCategory extends BaseCategory {
  exam_count: number | null;
  question_count: number | null;
  attempt_count: number | null;
  rating: number | null;
  subcategory_count: number | null;
  creator_id: string | null;
}

export interface PodcastCategory extends BaseCategory {
  podcast_count: number | null;
  creator_id: string | null;
}

export interface BookCategory extends BaseCategory {
  book_count: number | null;
  creator_id: string | null;
}

export type CategoryType = 'exam' | 'podcast' | 'book';

export type Category = ExamCategory | PodcastCategory | BookCategory;

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  icon_url: string;
  display_order: number;
  is_featured: boolean;
}

export const DEFAULT_FORM_DATA: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  icon_url: '',
  display_order: 0,
  is_featured: false,
};
