import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, X, RotateCcw } from "lucide-react";

interface FlashcardControlsProps {
  currentIndex: number;
  totalCards: number;
  onPrev: () => void;
  onNext: () => void;
  onMarkRemembered: (isRemembered: boolean) => void;
  onReset: () => void;
}

export function FlashcardControls({
  currentIndex,
  totalCards,
  onPrev,
  onNext,
  onMarkRemembered,
  onReset,
}: FlashcardControlsProps) {
  return (
    <>
      <div className="flex items-center justify-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => onMarkRemembered(false)}
          className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="w-5 h-5 mr-2" />
          Chưa nhớ
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => onMarkRemembered(true)}
          className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white dark:text-green-400 dark:border-green-400"
        >
          <Check className="w-5 h-5 mr-2" />
          Đã nhớ
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          disabled={currentIndex === totalCards - 1}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="text-center">
        <Button variant="ghost" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Học lại từ đầu
        </Button>
      </div>
    </>
  );
}
