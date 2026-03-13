import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/lib/logger';

const log = logger('TranscriptFlashcardGenerator');
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { Sparkles, Loader2, Check, Plus, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GeneratedCard {
  front: string;
  back: string;
  hint?: string;
  selected: boolean;
}

interface TranscriptFlashcardGeneratorProps {
  transcript: string;
  podcastTitle: string;
}

export const TranscriptFlashcardGenerator = ({
  transcript,
  podcastTitle,
}: TranscriptFlashcardGeneratorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [step, setStep] = useState<"config" | "review">("config");

  // Clean transcript - remove timestamps
  const cleanTranscript = transcript
    .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, "")
    .trim();

  const handleGenerate = async () => {
    if (!cleanTranscript) {
      toast({
        title: "Lỗi",
        description: "Không có nội dung transcript",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: {
          content: `Podcast: ${podcastTitle}\n\nTranscript:\n${cleanTranscript}`,
          count,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Lỗi",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      const cards = data.flashcards.map((card: any) => ({
        ...card,
        selected: true,
      }));

      setGeneratedCards(cards);
      setStep("review");
    } catch (error: unknown) {
      log.error("Error generating flashcards", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo flashcard từ AI",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleCardSelection = (index: number) => {
    setGeneratedCards((prev) =>
      prev.map((card, i) =>
        i === index ? { ...card, selected: !card.selected } : card
      )
    );
  };

  const handleSaveCards = async () => {
    if (!user) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để lưu flashcard",
        variant: "destructive",
      });
      return;
    }

    const selectedCards = generatedCards.filter((c) => c.selected);
    if (selectedCards.length === 0) {
      toast({
        title: "Chưa chọn thẻ",
        description: "Vui lòng chọn ít nhất một thẻ để lưu",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Find or create a deck for podcast flashcards
      const deckName = `Podcast: ${podcastTitle}`;
      let deckId: string;

      const { data: existingDeck } = await supabase
        .from("flashcard_decks")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", deckName)
        .maybeSingle();

      if (existingDeck) {
        deckId = existingDeck.id;
      } else {
        const { data: newDeck, error: deckError } = await supabase
          .from("flashcard_decks")
          .insert({
            user_id: user.id,
            title: deckName,
            description: `Flashcards từ podcast ${podcastTitle}`,
            tags: ["podcast", "listening"],
          })
          .select("id")
          .single();

        if (deckError) throw deckError;
        deckId = newDeck.id;
      }

      // Insert flashcards
      const cardsToInsert = selectedCards.map((card) => ({
        deck_id: deckId,
        user_id: user.id,
        front: card.front,
        back: card.back,
        hint: card.hint || null,
      }));

      const { error: cardsError } = await supabase
        .from("user_flashcards")
        .insert(cardsToInsert);

      if (cardsError) throw cardsError;

      // Create review entries for SRS
      const { data: insertedCards } = await supabase
        .from("user_flashcards")
        .select("id")
        .eq("deck_id", deckId)
        .order("created_at", { ascending: false })
        .limit(selectedCards.length);

      if (insertedCards) {
        const reviewEntries = insertedCards.map((card) => ({
          flashcard_id: card.id,
          user_id: user.id,
          due_at: new Date().toISOString(),
        }));

        await supabase.from("flashcard_reviews").insert(reviewEntries);
      }

      toast({
        title: "Thành công!",
        description: `Đã tạo ${selectedCards.length} flashcard vào bộ "${deckName}"`,
      });

      setOpen(false);
      setStep("config");
      setGeneratedCards([]);
    } catch (error: unknown) {
      log.error("Error saving flashcards", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu flashcard",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    setStep("config");
    setGeneratedCards([]);
  };

  const selectedCount = generatedCards.filter((c) => c.selected).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Tạo Flashcard từ Transcript
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Tạo Flashcard từ Transcript
          </DialogTitle>
          <DialogDescription>
            AI sẽ phân tích transcript và tạo flashcard giúp bạn ôn tập từ vựng và nội dung.
          </DialogDescription>
        </DialogHeader>

        {step === "config" && (
          <div className="space-y-6 py-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Nội dung transcript:</p>
              <p className="text-sm line-clamp-3">{cleanTranscript.slice(0, 200)}...</p>
              <p className="text-xs text-muted-foreground mt-2">
                ({cleanTranscript.length} ký tự)
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Số lượng flashcard</Label>
                <span className="text-sm font-medium text-primary">{count} thẻ</span>
              </div>
              <Slider
                value={[count]}
                onValueChange={(v) => setCount(v[0])}
                min={3}
                max={15}
                step={1}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || !cleanTranscript}
              className="w-full gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Tạo Flashcard bằng AI
                </>
              )}
            </Button>
          </div>
        )}

        {step === "review" && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Đã chọn {selectedCount}/{generatedCards.length} thẻ
              </p>
              <Button variant="ghost" size="sm" onClick={handleBack}>
                ← Quay lại
              </Button>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-3 pb-4">
                {generatedCards.map((card, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-all ${
                      card.selected
                        ? "ring-2 ring-primary bg-primary/5"
                        : "opacity-60 hover:opacity-80"
                    }`}
                    onClick={() => toggleCardSelection(index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Checkbox
                          checked={card.selected}
                          onCheckedChange={() => toggleCardSelection(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Mặt trước</p>
                            <p className="font-medium text-sm">{card.front}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Mặt sau</p>
                            <p className="text-sm text-muted-foreground">{card.back}</p>
                          </div>
                          {card.hint && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Gợi ý</p>
                              <p className="text-xs italic text-muted-foreground">{card.hint}</p>
                            </div>
                          )}
                        </div>
                        {card.selected && (
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="pt-4 border-t mt-auto">
              <Button
                onClick={handleSaveCards}
                disabled={saving || selectedCount === 0}
                className="w-full gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Thêm {selectedCount} thẻ vào bộ Flashcard
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
