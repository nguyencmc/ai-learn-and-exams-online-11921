import { Progress } from "@/components/ui/progress";

interface FlashcardProgressProps {
  rememberedCount: number;
  totalCards: number;
  currentIndex: number;
  progressPercent: number;
}

export function FlashcardProgress({
  rememberedCount,
  totalCards,
  currentIndex,
  progressPercent,
}: FlashcardProgressProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-muted-foreground">
          Tiến độ: {rememberedCount}/{totalCards} thẻ đã nhớ
        </span>
        <span className="text-muted-foreground">
          Thẻ {currentIndex + 1}/{totalCards}
        </span>
      </div>
      <Progress value={progressPercent} className="h-2" />
    </div>
  );
}
