import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Layers } from "lucide-react";
import type { FlashcardSet } from "../types";

interface FlashcardSetListProps {
  sets: FlashcardSet[] | undefined;
  onSelectSet: (set: FlashcardSet) => void;
}

export function FlashcardSetList({ sets, onSelectSet }: FlashcardSetListProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {sets?.map((set) => (
          <Card
            key={set.id}
            className="cursor-pointer hover:shadow-lg transition-shadow border-border"
            onClick={() => onSelectSet(set)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{set.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {set.description}
                  </p>
                </div>
                <Badge variant="secondary" className="uppercase">
                  {set.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Layers className="w-4 h-4" />
                  <span>{set.card_count} thẻ</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>Bắt đầu học</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sets?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có bộ thẻ nào</h3>
            <p className="text-muted-foreground">
              Các bộ flashcard sẽ xuất hiện ở đây
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
