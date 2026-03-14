import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Exam, Question } from "../types";

interface UseExamDataOptions {
  slug: string | undefined;
  isPracticeMode: boolean;
}

export function useExamData({ slug, isPracticeMode }: UseExamDataOptions) {
  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["exam", slug, isPracticeMode],
    queryFn: async () => {
      if (isPracticeMode) {
        const query = supabase
          .from("question_sets")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        let { data, error } = await query;

        // If not found by slug, try by ID
        if (!data && !error) {
          const idQuery = await supabase
            .from("question_sets")
            .select("*")
            .eq("id", slug)
            .maybeSingle();
          data = idQuery.data;
          error = idQuery.error;
        }

        if (error) throw error;
        if (!data) return null;

        return {
          id: data.id,
          title: data.title,
          duration_minutes: data.duration_minutes || 60,
          question_count: data.question_count || 0,
          difficulty: data.level,
        } as Exam;
      } else {
        const { data, error } = await supabase
          .from("exams")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (error) throw error;
        return data as Exam | null;
      }
    },
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["questions", exam?.id, isPracticeMode],
    queryFn: async () => {
      if (!exam?.id) return [];

      if (isPracticeMode) {
        const { data, error } = await supabase
          .from("practice_questions")
          .select("*")
          .eq("set_id", exam.id)
          .order("question_order", { ascending: true });

        if (error) throw error;

        return (data || []).map((q, idx) => ({
          id: q.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          option_e: q.option_e,
          option_f: q.option_f,
          option_g: null,
          option_h: null,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          question_order: q.question_order ?? idx,
        })) as Question[];
      } else {
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .eq("exam_id", exam.id)
          .order("question_order", { ascending: true });

        if (error) throw error;
        return data as Question[];
      }
    },
    enabled: !!exam?.id,
  });

  return {
    exam,
    questions: questions || [],
    isLoading: examLoading || questionsLoading,
  };
}
