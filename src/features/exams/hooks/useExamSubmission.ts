import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAnswerCorrect } from "../examUtils";
import type { Exam, Question } from "../types";

interface UseExamSubmissionOptions {
  exam: Exam | null | undefined;
  questions: Question[];
  answers: Record<string, string[]>;
  userId: string | undefined;
  isPracticeMode: boolean;
  endProctoringSession: () => Promise<void>;
}

export function useExamSubmission({
  exam,
  questions,
  answers,
  userId,
  isPracticeMode,
  endProctoringSession,
}: UseExamSubmissionOptions) {
  const startTime = useRef(Date.now());

  const submit = useCallback(async () => {
    if (!questions.length || !exam) return;

    const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
    const correctCount = questions.filter((q) =>
      isAnswerCorrect(q, answers[q.id]),
    ).length;
    const score = Math.round((correctCount / questions.length) * 100);

    if (isPracticeMode && userId) {
      const { data: session } = await supabase
        .from("practice_exam_sessions")
        .insert({
          user_id: userId,
          set_id: exam.id,
          duration_sec: timeSpent,
          status: "submitted",
          ended_at: new Date().toISOString(),
          score,
          correct_count: correctCount,
          total_questions: questions.length,
        })
        .select()
        .single();

      if (session) {
        const attempts = questions.map((q) => ({
          user_id: userId,
          question_id: q.id,
          mode: "exam",
          exam_session_id: session.id,
          selected: (answers[q.id] || []).join(","),
          is_correct: isAnswerCorrect(q, answers[q.id]),
          time_spent_sec: 0,
        }));
        await supabase.from("practice_attempts").insert(attempts);
      }
    } else {
      await supabase.from("exam_attempts").insert({
        exam_id: exam.id,
        user_id: userId || null,
        score,
        total_questions: questions.length,
        correct_answers: correctCount,
        time_spent_seconds: timeSpent,
        answers: answers,
      });
    }

    await endProctoringSession();
  }, [questions, exam, answers, userId, isPracticeMode, endProctoringSession]);

  return { submit };
}
