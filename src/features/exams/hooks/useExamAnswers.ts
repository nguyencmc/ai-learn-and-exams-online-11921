import { useState, useCallback } from "react";
import type { Question } from "../types";

export function useExamAnswers(questions: Question[] | undefined) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  const handleAnswerSelect = useCallback(
    (questionId: string, answer: string) => {
      setAnswers((prev) => {
        const currentAnswers = prev[questionId] || [];
        const question = questions?.find((q) => q.id === questionId);
        const correctAnswers =
          question?.correct_answer
            ?.split(",")
            .map((a) => a.trim()) || [];
        const isMulti = correctAnswers.length > 1;

        if (isMulti) {
          if (currentAnswers.includes(answer)) {
            return { ...prev, [questionId]: currentAnswers.filter((a) => a !== answer) };
          } else {
            return { ...prev, [questionId]: [...currentAnswers, answer].sort() };
          }
        } else {
          return { ...prev, [questionId]: [answer] };
        }
      });
    },
    [questions],
  );

  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  }, []);

  const goToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    if (!questions) return;
    setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
  }, [questions]);

  const currentQuestion = questions?.[currentQuestionIndex];
  const answeredCount = Object.keys(answers).filter((id) => answers[id]?.length > 0).length;
  const flaggedCount = flaggedQuestions.size;
  const unansweredCount = questions ? questions.length - answeredCount : 0;
  const progress = questions ? (answeredCount / questions.length) * 100 : 0;
  const isLastQuestion = questions ? currentQuestionIndex === questions.length - 1 : false;

  const getQuestionStatus = useCallback(
    (questionId: string, index: number) => ({
      isAnswered: answers[questionId]?.length > 0,
      isCurrent: index === currentQuestionIndex,
      isFlagged: flaggedQuestions.has(questionId),
    }),
    [answers, currentQuestionIndex, flaggedQuestions],
  );

  return {
    currentQuestionIndex,
    currentQuestion,
    answers,
    flaggedQuestions,
    answeredCount,
    flaggedCount,
    unansweredCount,
    progress,
    isLastQuestion,
    handleAnswerSelect,
    toggleFlag,
    goToQuestion,
    goToPrev,
    goToNext,
    getQuestionStatus,
  };
}
