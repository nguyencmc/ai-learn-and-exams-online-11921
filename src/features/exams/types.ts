export interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  option_f: string | null;
  option_g: string | null;
  option_h: string | null;
  correct_answer: string;
  explanation: string | null;
  question_order: number;
}

export interface Exam {
  id: string;
  title: string;
  duration_minutes: number;
  question_count: number;
  difficulty: string | null;
}

export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

export type OptionLabel = (typeof OPTION_LABELS)[number];

export const MAX_GUEST_QUESTIONS = 5;
