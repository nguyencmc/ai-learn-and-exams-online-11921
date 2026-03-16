export interface TestQuestion {
  id?: string;
  question_text: string;
  question_image?: string;
  option_a: string;
  option_b: string;
  option_c?: string;
  option_d?: string;
  correct_answer: string;
  explanation?: string;
  question_order: number;
}

export interface CourseTest {
  id?: string;
  lesson_id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  pass_percentage: number;
  max_attempts: number;
  is_required: boolean;
}

export interface CourseTestEditorProps {
  lessonId: string;
  lessonTitle: string;
}
