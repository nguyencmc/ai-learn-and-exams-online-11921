export interface InProgressSession {
  id: string;
  set_id: string;
  started_at: string;
  total_questions: number | null;
}

export interface WrongAnswerStats {
  count: number;
  questionIds: string[];
}

export interface LastPracticeSet {
  id: string;
  title: string;
}

export interface Recommendation {
  type: 'exam' | 'flashcard' | 'practice' | 'review';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  href: string;
  icon: 'target' | 'brain' | 'trending' | 'book' | 'trophy' | 'flame' | 'star';
}

export interface UserStats {
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  streakToday: boolean;
  flashcardsDue: number;
  inProgressSession: boolean;
  wrongAnswerCount: number;
  practicedSetIds: string[];
  unpracticedSets: { id: string; title: string }[];
  recentAccuracy7d: number;
  daysActiveLast7: number;
}
