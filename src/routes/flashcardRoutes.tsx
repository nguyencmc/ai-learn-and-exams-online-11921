import { lazy } from "react";
import { Route } from "react-router-dom";

const DeckListPage = lazy(() => import("@/features/flashcards/pages/DeckListPage"));
const DeckDetailPage = lazy(() => import("@/features/flashcards/pages/DeckDetailPage"));
const StudyDeckPage = lazy(() => import("@/features/flashcards/pages/StudyDeckPage"));
const TodayPage = lazy(() => import("@/features/flashcards/pages/TodayPage"));

export const flashcardRoutes = (
  <>
    <Route path="/flashcards" element={<DeckListPage />} />
    <Route path="/flashcards/decks/:deckId" element={<DeckDetailPage />} />
    <Route path="/flashcards/study/:deckId" element={<StudyDeckPage />} />
    <Route path="/flashcards/today" element={<TodayPage />} />
  </>
);
