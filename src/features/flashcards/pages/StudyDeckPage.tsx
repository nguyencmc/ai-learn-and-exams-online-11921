import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDeckStudyCards, fetchDueCards } from '../api';
import { useStudySession } from '../hooks/useStudySession';
import { UserFlashcard } from '../types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FlashcardFlip } from '../components/FlashcardFlip';
import { GradeButtons } from '../components/GradeButtons';
import { ArrowLeft, CheckCircle, RotateCcw, Layers } from 'lucide-react';
import { logger } from '@/lib/logger';

const log = logger('StudyDeckPage');

export default function StudyDeckPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [cards, setCards] = useState<UserFlashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deckTitle, setDeckTitle] = useState('');

  const isFromToday = searchParams.get('from') === 'today';

  useEffect(() => {
    if (!user || !deckId) return;

    const loadCards = async () => {
      setIsLoading(true);
      try {
        const studyCards = await fetchDeckStudyCards(deckId, user.id, 20);
        setCards(studyCards);
        
        // Get deck title from first card
        if (studyCards.length > 0 && studyCards[0].deck) {
          setDeckTitle(studyCards[0].deck.title);
        }
      } catch (error) {
        log.error('Error loading cards', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCards();
  }, [user, deckId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
<div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="aspect-[3/2] w-full rounded-2xl" />
          </div>
        </div>
</div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-background">
<div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Layers className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Không có thẻ để học</h1>
          <p className="text-muted-foreground mb-6">
            Thêm thẻ vào bộ này hoặc chờ đến lịch ôn tập
          </p>
          <Link to={`/flashcards/decks/${deckId}`}>
            <Button>Quay lại bộ thẻ</Button>
          </Link>
        </div>
</div>
    );
  }

  return <StudySessionView cards={cards} deckId={deckId!} deckTitle={deckTitle} />;
}

function StudySessionView({
  cards,
  deckId,
  deckTitle,
}: {
  cards: UserFlashcard[];
  deckId: string;
  deckTitle: string;
}) {
  const {
    currentCard,
    currentIndex,
    totalCards,
    isFlipped,
    isComplete,
    isSubmitting,
    progress,
    completedCount,
    gradePreviews,
    flip,
    handleGrade,
    reset,
  } = useStudySession(cards);

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background">
<div className="container mx-auto px-4 py-20 text-center">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Hoàn thành! 🎉</h1>
          <p className="text-muted-foreground mb-8">
            Bạn đã ôn tập xong {completedCount} thẻ
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={reset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Học lại
            </Button>
            <Link to={`/flashcards/decks/${deckId}`}>
              <Button>Quay lại bộ thẻ</Button>
            </Link>
          </div>
        </div>
</div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
<div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <Link
            to={`/flashcards/decks/${deckId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {deckTitle || 'Quay lại'}
          </Link>

          {/* Progress */}
          <div className="flex items-center gap-4 mb-2">
            <span className="text-sm font-medium">
              {currentIndex + 1} / {totalCards}
            </span>
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="max-w-2xl mx-auto mb-8">
          {currentCard && (
            <FlashcardFlip
              front={currentCard.front}
              back={currentCard.back}
              hint={currentCard.hint}
              isFlipped={isFlipped}
              onFlip={flip}
            />
          )}
        </div>

        {/* Grade Buttons */}
        <div className="max-w-xl mx-auto">
          {!isFlipped ? (
            <div className="text-center">
              <Button onClick={flip} size="lg" className="px-12">
                Lật thẻ
              </Button>
            </div>
          ) : (
            <GradeButtons
              onGrade={handleGrade}
              previews={gradePreviews}
              disabled={isSubmitting}
            />
          )}
        </div>
      </div>
</div>
  );
}
