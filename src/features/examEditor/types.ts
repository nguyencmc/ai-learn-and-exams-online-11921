import { type Question } from '@/components/admin/exam/QuestionEditor';

export type { Question };

export interface ExamCategory {
  id: string;
  name: string;
}

export interface ExamEditorState {
  categories: ExamCategory[];
  loading: boolean;
  saving: boolean;
  isEditing: boolean;
  hasAccess: boolean;
  roleLoading: boolean;

  // Exam fields
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  difficulty: string;
  durationMinutes: number;
  thumbnailUrl: string;

  // Questions
  questions: Question[];
}

export interface ExamEditorActions {
  setTitle: (title: string) => void;
  setSlug: (slug: string) => void;
  setDescription: (description: string) => void;
  setCategoryId: (categoryId: string) => void;
  setDifficulty: (difficulty: string) => void;
  setDurationMinutes: (duration: number) => void;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  handleSave: () => Promise<void>;
  handleThumbnailUpload: (file: File) => Promise<string>;
  handleThumbnailRemove: () => void;
  handleImageUpload: (file: File, questionIndex: number, field: string) => Promise<string>;
}
