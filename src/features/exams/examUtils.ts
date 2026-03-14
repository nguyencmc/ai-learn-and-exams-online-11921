import type { Question } from "./types";

/** Check if user's answers match the correct answer(s) for a question. */
export const isAnswerCorrect = (
  question: Question,
  userAnswers: string[] | undefined,
): boolean => {
  if (!userAnswers || userAnswers.length === 0) return false;
  const correctAnswers =
    question.correct_answer
      ?.split(",")
      .map((a) => a.trim())
      .sort() || [];
  const sortedUserAnswers = [...userAnswers].sort();
  return JSON.stringify(correctAnswers) === JSON.stringify(sortedUserAnswers);
};

/** Format seconds into HH:MM:SS or MM:SS display string. */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/** Get the correct answers as a sorted array of option labels. */
export const getCorrectAnswers = (question: Question): string[] =>
  question.correct_answer
    ?.split(",")
    .map((a) => a.trim())
    .sort() || [];

/** Whether the question has multiple correct answers. */
export const isMultiAnswer = (question: Question): boolean =>
  getCorrectAnswers(question).length > 1;
