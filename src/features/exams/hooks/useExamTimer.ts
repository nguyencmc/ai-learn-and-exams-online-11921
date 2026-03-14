import { useState, useEffect } from "react";

interface UseExamTimerOptions {
  durationMinutes: number | undefined;
  enabled: boolean;
  onTimeUp: () => void;
}

export function useExamTimer({ durationMinutes, enabled, onTimeUp }: UseExamTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(0);

  // Initialize timer when duration is available
  useEffect(() => {
    if (durationMinutes && enabled) {
      setTimeLeft(durationMinutes * 60);
    }
  }, [durationMinutes, enabled]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || !enabled) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, enabled, onTimeUp]);

  return { timeLeft, durationSeconds: (durationMinutes || 0) * 60 };
}
