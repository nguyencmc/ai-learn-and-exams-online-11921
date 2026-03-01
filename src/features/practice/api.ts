import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import type { QuestionSet, PracticeQuestion, ExamSession, PracticeAttempt } from './types';

// Database row types
type DbQuestionSet = Database['public']['Tables']['question_sets']['Row'];
type DbPracticeQuestion = Database['public']['Tables']['practice_questions']['Row'];
type DbExamSession = Database['public']['Tables']['practice_exam_sessions']['Row'];
type DbPracticeAttempt = Database['public']['Tables']['practice_attempts']['Row'];

// Transform functions
function toQuestionSet(row: DbQuestionSet): QuestionSet {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category_id: row.category_id,
    tags: row.tags || [],
    level: row.level || 'beginner',
    is_published: row.is_published ?? false,
    question_count: row.question_count || 0,
    creator_id: row.creator_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toPracticeQuestion(row: DbPracticeQuestion): PracticeQuestion {
  return {
    id: row.id,
    set_id: row.set_id,
    question_text: row.question_text,
    question_image: row.question_image,
    option_a: row.option_a,
    option_b: row.option_b,
    option_c: row.option_c,
    option_d: row.option_d,
    option_e: row.option_e,
    option_f: row.option_f,
    correct_answer: row.correct_answer,
    explanation: row.explanation,
    difficulty: row.difficulty,
    tags: row.tags || [],
    question_order: row.question_order,
    created_at: row.created_at,
    creator_id: row.creator_id,
  };
}

function toExamSession(row: DbExamSession): ExamSession {
  return {
    id: row.id,
    user_id: row.user_id,
    set_id: row.set_id,
    status: row.status as ExamSession['status'],
    duration_sec: row.duration_sec,
    started_at: row.started_at,
    ended_at: row.ended_at,
    score: row.score,
    total_questions: row.total_questions,
    correct_count: row.correct_count,
  };
}

function toPracticeAttempt(row: DbPracticeAttempt): PracticeAttempt {
  return {
    id: row.id,
    user_id: row.user_id,
    question_id: row.question_id,
    mode: row.mode,
    exam_session_id: row.exam_session_id,
    selected: row.selected,
    is_correct: row.is_correct,
    time_spent_sec: row.time_spent_sec,
    created_at: row.created_at,
  };
}

// Question Sets
export async function fetchQuestionSets(filters?: {
  level?: string;
  tags?: string[];
}): Promise<QuestionSet[]> {
  let query = supabase
    .from('question_sets')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (filters?.level && filters.level !== 'all') {
    query = query.eq('level', filters.level);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(toQuestionSet);
}

export async function fetchQuestionSetById(id: string): Promise<QuestionSet | null> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? toQuestionSet(data) : null;
}

// Questions
export async function fetchQuestionsBySetId(
  setId: string,
  options?: {
    limit?: number;
    difficulty?: 'all' | 'easy' | 'medium' | 'hard';
    tags?: string[];
    shuffle?: boolean;
  }
): Promise<PracticeQuestion[]> {
  let query = supabase
    .from('practice_questions')
    .select('*')
    .eq('set_id', setId);

  // Filter by difficulty
  if (options?.difficulty && options.difficulty !== 'all') {
    query = query.eq('difficulty', options.difficulty);
  }

  // Filter by tags
  if (options?.tags && options.tags.length > 0) {
    query = query.overlaps('tags', options.tags);
  }

  const { data, error } = await query;
  if (error) throw error;

  let questions = (data || []).map(toPracticeQuestion);

  // Shuffle if requested
  if (options?.shuffle) {
    questions = questions.sort(() => Math.random() - 0.5);
  }

  // Limit
  if (options?.limit && options.limit > 0) {
    questions = questions.slice(0, options.limit);
  }

  return questions;
}

// Exam Sessions
export async function createExamSession(
  userId: string,
  setId: string,
  durationSec: number,
  totalQuestions: number
): Promise<ExamSession> {
  const { data, error } = await supabase
    .from('practice_exam_sessions')
    .insert({
      user_id: userId,
      set_id: setId,
      duration_sec: durationSec,
      total_questions: totalQuestions,
      status: 'in_progress',
    })
    .select()
    .single();

  if (error) throw error;
  return toExamSession(data);
}

export async function submitExamSession(
  sessionId: string,
  score: number,
  correctCount: number
): Promise<ExamSession> {
  const { data, error } = await supabase
    .from('practice_exam_sessions')
    .update({
      status: 'submitted',
      ended_at: new Date().toISOString(),
      score,
      correct_count: correctCount,
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return toExamSession(data);
}

export async function fetchExamSessionById(id: string): Promise<ExamSession | null> {
  const { data, error } = await supabase
    .from('practice_exam_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? toExamSession(data) : null;
}

// Attempts
export async function createAttempt(attempt: {
  user_id: string;
  question_id: string;
  mode: 'practice' | 'exam';
  exam_session_id?: string;
  selected: string;
  is_correct: boolean;
  time_spent_sec: number;
}): Promise<PracticeAttempt> {
  const { data, error } = await supabase
    .from('practice_attempts')
    .insert({
      user_id: attempt.user_id,
      question_id: attempt.question_id,
      mode: attempt.mode,
      exam_session_id: attempt.exam_session_id,
      selected: attempt.selected,
      is_correct: attempt.is_correct,
      time_spent_sec: attempt.time_spent_sec,
    })
    .select()
    .single();

  if (error) throw error;
  return toPracticeAttempt(data);
}

export async function createBatchAttempts(
  attempts: Array<{
    user_id: string;
    question_id: string;
    mode: 'practice' | 'exam';
    exam_session_id?: string;
    selected: string;
    is_correct: boolean;
    time_spent_sec: number;
  }>
): Promise<PracticeAttempt[]> {
  const insertData = attempts.map(a => ({
    user_id: a.user_id,
    question_id: a.question_id,
    mode: a.mode,
    exam_session_id: a.exam_session_id,
    selected: a.selected,
    is_correct: a.is_correct,
    time_spent_sec: a.time_spent_sec,
  }));

  const { data, error } = await supabase
    .from('practice_attempts')
    .insert(insertData)
    .select();

  if (error) throw error;
  return (data || []).map(toPracticeAttempt);
}

export async function fetchWrongAttempts(userId: string, limit = 50): Promise<PracticeAttempt[]> {
  const { data, error } = await supabase
    .from('practice_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_correct', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(toPracticeAttempt);
}

export async function fetchQuestionsByIds(ids: string[]): Promise<PracticeQuestion[]> {
  if (ids.length === 0) return [];
  
  const { data, error } = await supabase
    .from('practice_questions')
    .select('*')
    .in('id', ids);

  if (error) throw error;
  return (data || []).map(toPracticeQuestion);
}

export async function fetchAttemptsForSession(sessionId: string): Promise<PracticeAttempt[]> {
  const { data, error } = await supabase
    .from('practice_attempts')
    .select('*')
    .eq('exam_session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(toPracticeAttempt);
}

