export type ContentVisibility = 'private' | 'public';
export type ResourceType = 'document' | 'video' | 'link';

export type LibraryContentType =
  | 'lesson'
  | 'resource'
  | 'exam'
  | 'course'
  | 'flashcard'
  | 'podcast';

export interface TeacherLesson {
  id: string;
  teacher_id: string;
  title: string;
  content: string | null;
  cover_image: string | null;
  visibility: ContentVisibility;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface TeacherResource {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  visibility: ContentVisibility;
  tags: string[];
  created_at: string;
}

export interface LibraryItem {
  id: string;
  contentType: LibraryContentType;
  title: string;
  subtitle?: string;
  visibility?: ContentVisibility;
  tags?: string[];
  created_at: string;
  classCount?: number;
  raw: TeacherLesson | TeacherResource | Record<string, unknown>;
}

export interface ClassOption {
  id: string;
  title: string;
  class_code: string;
  member_count?: number;
}

export type LibraryFilter = 'all' | LibraryContentType;
