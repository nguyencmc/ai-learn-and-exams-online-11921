import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createAttempt } from '../api';
import type { AnswerState, PracticeQuestion } from '../types';
import { isMultiSelectQuestion, toggleMultiSelect, checkAnswerCorrect } from '../types';
import { logger } from '@/lib/logger';

const log = logger('PracticeRunner');

interface UsePracticeRunnerOptions {
  questions: PracticeQuestion[] | undefined;
}

export function usePracticeRunner({ questions }: UsePracticeRunnerOptions) {
  const { user } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [mobileTab, setMobileTab] = useState<'question' | 'explanation' | 'nav'>('question');

  const currentQuestion = questions?.[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const isLastQuestion = questions ? currentIndex === questions.length - 1 : false;
  const answeredCount = Object.values(answers).filter((a) => a?.isChecked).length;
  const progress = questions ? (answeredCount / questions.length) * 100 : 0;
  const correctCount = Object.values(answers).filter((a) => a.isChecked && a.isCorrect).length;
  const wrongCount = Object.values(answers).filter((a) => a.isChecked && !a.isCorrect).length;
  const unansweredCount = (questions?.length ?? 0) - answeredCount;

  const handleSelectAnswer = useCallback(
    (choiceId: string) => {
      if (!currentQuestion || currentAnswer?.isChecked) return;
      const isMultiSelect = isMultiSelectQuestion(currentQuestion.correct_answer);
      setAnswers((prev) => {
        const newSelected = isMultiSelect
          ? toggleMultiSelect(prev[currentQuestion.id]?.selected, choiceId)
          : choiceId;
        return {
          ...prev,
          [currentQuestion.id]: {
            questionId: currentQuestion.id,
            selected: newSelected || null,
            isChecked: false,
            isCorrect: null,
            timeSpent: 0,
          },
        };
      });
    },
    [currentQuestion, currentAnswer],
  );

  const handleCheck = useCallback(async () => {
    if (!currentQuestion || !currentAnswer?.selected || currentAnswer.isChecked) return;
    setIsChecking(true);
    const isCorrect = checkAnswerCorrect(currentAnswer.selected, currentQuestion.correct_answer);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        isChecked: true,
        isCorrect,
      },
    }));
    setStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
    }));
    if (user) {
      try {
        await createAttempt({
          user_id: user.id,
          question_id: currentQuestion.id,
          mode: 'practice',
          selected: currentAnswer.selected,
          is_correct: isCorrect,
          time_spent_sec: 0,
        });
      } catch (e) {
        log.error('Error occurred', e);
      }
    }
    setIsChecking(false);
  }, [currentQuestion, currentAnswer, user]);

  const handleNext = useCallback(() => {
    if (questions && currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setMobileTab('question');
    }
  }, [currentIndex, questions]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setMobileTab('question');
    }
  }, [currentIndex]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setStats({ correct: 0, wrong: 0 });
    setIsFinished(false);
  };

  return {
    currentIndex,
    setCurrentIndex,
    currentQuestion,
    currentAnswer,
    answers,
    isChecking,
    isFinished,
    setIsFinished,
    stats,
    mobileTab,
    setMobileTab,
    isLastQuestion,
    answeredCount,
    progress,
    correctCount,
    wrongCount,
    unansweredCount,
    handleSelectAnswer,
    handleCheck,
    handleNext,
    handlePrev,
    handleRestart,
  };
}
