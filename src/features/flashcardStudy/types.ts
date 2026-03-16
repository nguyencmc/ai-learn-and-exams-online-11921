export interface FlashcardSet {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  card_count: number | null;
}

export interface Flashcard {
  id: string;
  front_text: string;
  back_text: string;
  card_order: number | null;
}

export interface UserProgress {
  flashcard_id: string;
  is_remembered: boolean;
}
