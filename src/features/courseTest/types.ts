export interface CourseTest {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  pass_percentage: number;
  max_attempts: number;
  is_required: boolean;
}

export interface TestQuestion {
  id: string;
  question_text: string;
  question_image: string | null;
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

export interface TestAttempt {
  id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
  completed_at: string;
}

export interface TestResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  answers: Record<string, { selected: string[]; correct: string[]; isCorrect: boolean }>;
}

export type TestState = 'intro' | 'taking' | 'result';

export interface CourseTestTakingProps {
  lessonId: string;
  onComplete?: () => void;
}
