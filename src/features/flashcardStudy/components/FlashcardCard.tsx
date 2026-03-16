import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Flashcard } from "../types";

interface FlashcardCardProps {
  card: Flashcard;
  isFlipped: boolean;
  isRemembered: boolean;
  onToggleFlip: () => void;
}

export function FlashcardCard({ card, isFlipped, isRemembered, onToggleFlip }: FlashcardCardProps) {
  const borderClass = isRemembered
    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
    : "border-border";

  return (
    <div
      className="perspective-1000 mb-6 cursor-pointer"
      onClick={onToggleFlip}
    >
      <div
        className={`relative w-full h-80 transition-transform duration-500 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <Card
          className={`absolute inset-0 backface-hidden flex items-center justify-center p-8 ${borderClass}`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-center">
            <Badge variant="outline" className="mb-4">Mặt trước</Badge>
            <h2 className="text-3xl font-bold text-foreground">
              {card.front_text}
            </h2>
            <p className="text-sm text-muted-foreground mt-4">
              Nhấn để lật thẻ
            </p>
          </div>
        </Card>

        {/* Back */}
        <Card
          className={`absolute inset-0 backface-hidden flex items-center justify-center p-8 ${borderClass}`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="text-center">
            <Badge variant="outline" className="mb-4">Mặt sau</Badge>
            <p className="text-xl text-foreground leading-relaxed">
              {card.back_text}
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Nhấn để lật thẻ
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
