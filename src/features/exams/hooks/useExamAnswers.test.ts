import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Question } from "../types";
import { useExamAnswers } from "./useExamAnswers";

const questions: Question[] = [
  {
    id: "q1",
    question_text: "Single",
    option_a: "A1",
    option_b: "B1",
    option_c: null,
    option_d: null,
    option_e: null,
    option_f: null,
    option_g: null,
    option_h: null,
    correct_answer: "A",
    explanation: null,
    question_order: 1,
  },
  {
    id: "q2",
    question_text: "Multi",
    option_a: "A2",
    option_b: "B2",
    option_c: "C2",
    option_d: null,
    option_e: null,
    option_f: null,
    option_g: null,
    option_h: null,
    correct_answer: "A, C",
    explanation: null,
    question_order: 2,
  },
];

describe("useExamAnswers", () => {
  it("handles single and multi-select answers", () => {
    const { result } = renderHook(() => useExamAnswers(questions));

    act(() => {
      result.current.handleAnswerSelect("q1", "B");
      result.current.handleAnswerSelect("q2", "C");
      result.current.handleAnswerSelect("q2", "A");
    });

    expect(result.current.answers.q1).toEqual(["B"]);
    expect(result.current.answers.q2).toEqual(["A", "C"]);
    expect(result.current.answeredCount).toBe(2);
    expect(result.current.progress).toBe(100);
  });

  it("supports navigation and flagging", () => {
    const { result } = renderHook(() => useExamAnswers(questions));

    act(() => {
      result.current.toggleFlag("q1");
      result.current.goToNext();
    });

    expect(result.current.currentQuestionIndex).toBe(1);
    expect(result.current.flaggedQuestions.has("q1")).toBe(true);
    expect(result.current.isLastQuestion).toBe(true);

    act(() => {
      result.current.goToPrev();
    });

    expect(result.current.currentQuestionIndex).toBe(0);
  });
});
