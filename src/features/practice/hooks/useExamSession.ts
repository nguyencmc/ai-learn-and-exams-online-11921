import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createExamSession, submitExamSession, createBatchAttempts } from '../api';
import type { PracticeQuestion, ExamSession, AnswerState } from '../types';
import { isMultiSelectQuestion, toggleMultiSelect, checkAnswerCorrect } from '../types';
import { logger } from '@/lib/logger';

const log = logger('useExamSession');

interface UseExamSessionOptions {
  questions: PracticeQuestion[];
  setId: string;
  durationMinutes: number;
  onComplete?: (session: ExamSession) => void;
}

export function useExamSession({
  questions,
  setId,
  durationMinutes,
  onComplete,
}: UseExamSessionOptions) {
  const { user } = useAuth();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<Record<string, number>>({});

  // Initialize answers state
  useEffect(() => {
    const initial: Record<string, AnswerState> = {};
    questions.forEach((q) => {
      initial[q.id] = {
        questionId: q.id,
        selected: null,
        isChecked: false,
        isCorrect: null,
        timeSpent: 0,
      };
    });
    setAnswers(initial);
  }, [questions]);

  // Timer
  useEffect(() => {
    if (!isStarted || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isStarted]);

  // Track time spent on each question
  useEffect(() => {
    if (!isStarted) return;
    
    const currentQuestionId = questions[currentIndex]?.id;
    if (currentQuestionId) {
      startTimeRef.current[currentQuestionId] = Date.now();
    }

    return () => {
      if (currentQuestionId && startTimeRef.current[currentQuestionId]) {
        const spent = Math.floor((Date.now() - startTimeRef.current[currentQuestionId]) / 1000);
        setAnswers((prev) => ({
          ...prev,
          [currentQuestionId]: {
            ...prev[currentQuestionId],
            timeSpent: (prev[currentQuestionId]?.timeSpent || 0) + spent,
          },
        }));
      }
    };
  }, [currentIndex, isStarted, questions]);

  const startExam = useCallback(async () => {
    if (!user) return;

    try {
      const newSession = await createExamSession(
        user.id,
        setId,
        durationMinutes * 60,
        questions.length
      );
      setSession(newSession);
      setIsStarted(true);
    } catch (error) {
      log.error('Failed to start exam', error);
    }
  }, [user, setId, durationMinutes, questions.length]);

  const selectAnswer = useCallback((questionId: string, selected: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const isMultiSelect = isMultiSelectQuestion(question.correct_answer);
    
    setAnswers((prev) => {
      const currentSelected = prev[questionId]?.selected;
      let newSelected: string | null;
      
      if (isMultiSelect) {
        newSelected = toggleMultiSelect(currentSelected, selected) || null;
      } else {
        newSelected = selected;
      }
      
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          selected: newSelected,
        },
      };
    });
  }, [questions]);

  const handleSubmit = useCallback(async () => {
    if (!user || !session || isSubmitting) return;

    setIsSubmitting(true);
    clearInterval(timerRef.current);

    try {
      // Calculate scores
      let correct = 0;
      const attemptData = questions.map((q) => {
        const answer = answers[q.id];
        const isAnswerCorrect = checkAnswerCorrect(answer?.selected, q.correct_answer);
        if (isAnswerCorrect) correct++;

        return {
          user_id: user.id,
          question_id: q.id,
          mode: 'exam' as const,
          exam_session_id: session.id,
          selected: answer?.selected || '',
          is_correct: isAnswerCorrect,
          time_spent_sec: answer?.timeSpent || 0,
        };
      });

      const score = Math.round((correct / questions.length) * 100);

      // Batch insert attempts
      await createBatchAttempts(attemptData);

      // Update session
      const updatedSession = await submitExamSession(session.id, score, correct);
      setSession(updatedSession);
      onComplete?.(updatedSession);
    } catch (error) {
      log.error('Failed to submit exam', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [user, session, questions, answers, isSubmitting, onComplete]);

  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  }, [questions.length]);

  const goNext = useCallback(() => {
    goToQuestion(currentIndex + 1);
  }, [currentIndex, goToQuestion]);

  const goPrev = useCallback(() => {
    goToQuestion(currentIndex - 1);
  }, [currentIndex, goToQuestion]);

  return {
    session,
    answers,
    currentIndex,
    currentQuestion: questions[currentIndex],
    timeLeft,
    isStarted,
    isSubmitting,
    isCompleted: session?.status === 'submitted',
    answeredCount: Object.values(answers).filter((a) => a.selected !== null).length,
    totalQuestions: questions.length,
    startExam,
    selectAnswer,
    handleSubmit,
    goToQuestion,
    goNext,
    goPrev,
  };
}
