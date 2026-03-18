import { describe, expect, it } from "vitest";
import { getChoices, getDifficultyLabel } from "./practiceUtils";
import type { PracticeQuestion } from "./types";

const baseQuestion: PracticeQuestion = {
  id: "q1",
  set_id: "set-1",
  question_text: "What is 2+2?",
  option_a: "3",
  option_b: "4",
  option_c: "5",
  option_d: null,
  option_e: null,
  option_f: null,
  correct_answer: "B",
  explanation: null,
  difficulty: "medium",
  tags: [],
  question_order: 1,
  created_at: "2026-01-01",
};

describe("practiceUtils", () => {
  it("maps available options to choice list", () => {
    const choices = getChoices(baseQuestion);

    expect(choices).toEqual([
      { id: "A", text: "3" },
      { id: "B", text: "4" },
      { id: "C", text: "5" },
    ]);
  });

  it("returns difficulty labels and classnames", () => {
    expect(getDifficultyLabel("easy").label).toBe("Dễ");
    expect(getDifficultyLabel("hard").label).toBe("Khó");
    expect(getDifficultyLabel(null).label).toBe("Trung bình");
  });
});
