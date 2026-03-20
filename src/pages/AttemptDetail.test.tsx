import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AttemptDetail from "./AttemptDetail";

const mockUseQuery = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => mockUseQuery(options),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/components/exam/AIExplanation", () => ({
  AIExplanation: () => null,
}));

vi.mock("@/components/ui/ImageLightbox", () => ({
  ImageLightbox: () => null,
}));

describe("AttemptDetail mobile question list", () => {
  beforeEach(() => {
    const attempt = {
      id: "attempt-1",
      exam_id: "exam-1",
      score: 50,
      total_questions: 2,
      correct_answers: 1,
      time_spent_seconds: 90,
      completed_at: "2026-03-20T00:00:00.000Z",
      answers: { q1: "A", q2: "A" },
      exam: {
        id: "exam-1",
        title: "Demo exam",
        slug: "demo-exam",
        difficulty: "easy",
      },
    };

    const questions = [
      {
        id: "q1",
        question_text: "Question 1",
        option_a: "A1",
        option_b: "B1",
        option_c: null,
        option_d: null,
        correct_answer: "A",
        explanation: "Explanation 1",
        question_order: 1,
      },
      {
        id: "q2",
        question_text: "Question 2",
        option_a: "A2",
        option_b: "B2",
        option_c: null,
        option_d: null,
        correct_answer: "B",
        explanation: "Explanation 2",
        question_order: 2,
      },
    ];

    mockUseQuery.mockImplementation((options: { queryKey: string[] }) => {
      if (options.queryKey[0] === "attempt") {
        return { data: attempt, isLoading: false };
      }
      if (options.queryKey[0] === "attempt-questions") {
        return { data: questions, isLoading: false };
      }
      return { data: null, isLoading: false };
    });
  });

  it("toggles and closes mobile question list when selecting a question", () => {
    render(
      <MemoryRouter initialEntries={["/history/attempt-1"]}>
        <Routes>
          <Route path="/history/:attemptId" element={<AttemptDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    const toggleButton = screen.getByRole("button", { name: /danh sách câu hỏi/i });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");

    const panel = toggleButton.parentElement?.querySelector(".max-h-40");
    expect(panel).not.toBeNull();

    const questionButton = within(panel as HTMLElement).getByRole("button", { name: "2" });
    fireEvent.click(questionButton);

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
  });
});
