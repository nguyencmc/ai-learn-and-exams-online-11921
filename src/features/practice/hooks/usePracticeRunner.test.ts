import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PracticeQuestion } from "../types";
import { usePracticeRunner } from "./usePracticeRunner";

const mockCreateAttempt = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("../api", () => ({
  createAttempt: (payload: unknown) => mockCreateAttempt(payload),
}));

const questions: PracticeQuestion[] = [
  {
    id: "q1",
    set_id: "set-1",
    question_text: "Capital?",
    option_a: "Paris",
    option_b: "London",
    option_c: null,
    option_d: null,
    option_e: null,
    option_f: null,
    correct_answer: "A",
    explanation: "Paris is correct",
    difficulty: "easy",
    tags: [],
    question_order: 1,
    created_at: "2026-01-01",
  },
];

describe("usePracticeRunner", () => {
  beforeEach(() => {
    mockCreateAttempt.mockResolvedValue({});
  });

  it("selects and checks answer, then updates stats", async () => {
    const { result } = renderHook(() => usePracticeRunner({ questions }));

    act(() => {
      result.current.handleSelectAnswer("A");
    });

    expect(result.current.currentAnswer?.selected).toBe("A");

    await act(async () => {
      await result.current.handleCheck();
    });

    expect(result.current.currentAnswer?.isChecked).toBe(true);
    expect(result.current.currentAnswer?.isCorrect).toBe(true);
    expect(result.current.stats.correct).toBe(1);
    expect(result.current.answeredCount).toBe(1);
    expect(mockCreateAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        question_id: "q1",
        mode: "practice",
        is_correct: true,
      }),
    );
  });

  it("resets state on restart", () => {
    const { result } = renderHook(() => usePracticeRunner({ questions }));

    act(() => {
      result.current.setIsFinished(true);
      result.current.handleRestart();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.answers).toEqual({});
    expect(result.current.stats).toEqual({ correct: 0, wrong: 0 });
    expect(result.current.isFinished).toBe(false);
  });
});
