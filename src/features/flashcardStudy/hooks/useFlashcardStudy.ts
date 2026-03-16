import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import type { FlashcardSet, Flashcard, UserProgress } from "../types";

export function useFlashcardStudy() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [localProgress, setLocalProgress] = useState<Record<string, boolean>>({});

  // Fetch flashcard sets
  const { data: sets, isLoading: setsLoading } = useQuery({
    queryKey: ["flashcard-sets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flashcard_sets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FlashcardSet[];
    },
  });

  // Fetch flashcards for selected set
  const { data: cards, isLoading: cardsLoading } = useQuery({
    queryKey: ["flashcards", selectedSet?.id],
    queryFn: async () => {
      if (!selectedSet) return [];
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("set_id", selectedSet.id)
        .order("card_order", { ascending: true });
      if (error) throw error;
      return data as Flashcard[];
    },
    enabled: !!selectedSet,
  });

  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ["flashcard-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_flashcard_progress")
        .select("flashcard_id, is_remembered")
        .eq("user_id", user.id);
      if (error) throw error;
      return data as UserProgress[];
    },
    enabled: !!user,
  });

  // Initialize local progress from database
  useEffect(() => {
    if (userProgress) {
      const progressMap: Record<string, boolean> = {};
      userProgress.forEach((p) => {
        progressMap[p.flashcard_id] = p.is_remembered;
      });
      setLocalProgress(progressMap);
    }
  }, [userProgress]);

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ flashcardId, isRemembered }: { flashcardId: string; isRemembered: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_flashcard_progress")
        .upsert({
          user_id: user.id,
          flashcard_id: flashcardId,
          is_remembered: isRemembered,
          last_reviewed_at: new Date().toISOString(),
          review_count: 1,
        }, {
          onConflict: "user_id,flashcard_id",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcard-progress"] });
    },
  });

  const handleMarkRemembered = (isRemembered: boolean) => {
    if (!cards || cards.length === 0) return;

    const currentCard = cards[currentIndex];
    setLocalProgress((prev) => ({
      ...prev,
      [currentCard.id]: isRemembered,
    }));

    if (user) {
      updateProgressMutation.mutate({
        flashcardId: currentCard.id,
        isRemembered,
      });
    }

    toast({
      title: isRemembered ? "Đã đánh dấu nhớ!" : "Đánh dấu chưa nhớ",
      description: isRemembered
        ? "Thẻ này sẽ được đánh dấu là đã nhớ"
        : "Bạn có thể ôn lại thẻ này sau",
    });

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      }, 300);
    }
  };

  const goToNext = () => {
    if (cards && currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const resetCards = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const selectSet = (set: FlashcardSet) => {
    setSelectedSet(set);
  };

  const goBackToList = () => {
    setSelectedSet(null);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const toggleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const getRememberedCount = () => {
    if (!cards) return 0;
    return cards.filter((card) => localProgress[card.id]).length;
  };

  const progressPercent = cards && cards.length > 0
    ? (getRememberedCount() / cards.length) * 100
    : 0;

  const currentCard = cards?.[currentIndex] ?? null;

  const isComplete = !!(
    cards &&
    cards.length > 0 &&
    currentIndex === cards.length - 1 &&
    getRememberedCount() === cards.length
  );

  return {
    // Data
    sets,
    cards,
    currentCard,
    selectedSet,
    currentIndex,
    isFlipped,
    localProgress,
    progressPercent,
    isComplete,

    // Loading states
    setsLoading,
    cardsLoading,

    // Computed
    getRememberedCount,

    // Actions
    selectSet,
    goBackToList,
    toggleFlip,
    handleMarkRemembered,
    goToNext,
    goToPrev,
    resetCards,
  };
}
