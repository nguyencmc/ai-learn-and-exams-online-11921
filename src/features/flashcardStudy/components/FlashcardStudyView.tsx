import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Layers } from "lucide-react";
import type { FlashcardSet, Flashcard } from "../types";
import { FlashcardProgress } from "./FlashcardProgress";
import { FlashcardCard } from "./FlashcardCard";
import { FlashcardControls } from "./FlashcardControls";
import { FlashcardCompletion } from "./FlashcardCompletion";

interface FlashcardStudyViewProps {
  selectedSet: FlashcardSet;
  cards: Flashcard[] | undefined;
  currentCard: Flashcard | null;
  currentIndex: number;
  isFlipped: boolean;
  localProgress: Record<string, boolean>;
  progressPercent: number;
  isComplete: boolean;
  cardsLoading: boolean;
  getRememberedCount: () => number;
  onGoBack: () => void;
  onToggleFlip: () => void;
  onMarkRemembered: (isRemembered: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
}

export function FlashcardStudyView({
  selectedSet,
  cards,
  currentCard,
  currentIndex,
  isFlipped,
  localProgress,
  progressPercent,
  isComplete,
  cardsLoading,
  getRememberedCount,
  onGoBack,
  onToggleFlip,
  onMarkRemembered,
  onNext,
  onPrev,
  onReset,
}: FlashcardStudyViewProps) {
  const totalCards = cards?.length ?? 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={onGoBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

        <h1 className="text-2xl font-bold text-foreground">{selectedSet.title}</h1>
        <p className="text-muted-foreground">{selectedSet.description}</p>
      </div>

      {/* Progress */}
      <FlashcardProgress
        rememberedCount={getRememberedCount()}
        totalCards={totalCards}
        currentIndex={currentIndex}
        progressPercent={progressPercent}
      />

      {cardsLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : currentCard ? (
        <>
          <FlashcardCard
            card={currentCard}
            isFlipped={isFlipped}
            isRemembered={!!localProgress[currentCard.id]}
            onToggleFlip={onToggleFlip}
          />

          <FlashcardControls
            currentIndex={currentIndex}
            totalCards={totalCards}
            onPrev={onPrev}
            onNext={onNext}
            onMarkRemembered={onMarkRemembered}
            onReset={onReset}
          />
        </>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không có thẻ nào</h3>
            <p className="text-muted-foreground">
              Bộ flashcard này chưa có thẻ nào
            </p>
          </CardContent>
        </Card>
      )}

      {isComplete && <FlashcardCompletion />}
    </div>
  );
}
