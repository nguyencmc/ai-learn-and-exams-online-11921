import { useFlashcardStudy, FlashcardSetList, FlashcardStudyView } from "@/features/flashcardStudy";
import PageHeader from "@/components/layouts/PageHeader";

const Flashcards = () => {
  const {
    sets,
    cards,
    currentCard,
    selectedSet,
    currentIndex,
    isFlipped,
    localProgress,
    progressPercent,
    isComplete,
    setsLoading,
    cardsLoading,
    getRememberedCount,
    selectSet,
    goBackToList,
    toggleFlip,
    handleMarkRemembered,
    goToNext,
    goToPrev,
    resetCards,
  } = useFlashcardStudy();

  if (setsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!selectedSet) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <PageHeader
              breadcrumbs={[
                { label: "Trang chủ", href: "/" },
                { label: "Flashcards" },
              ]}
              showBack={true}
              backHref="/"
              className="mb-6"
            />
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Flashcards</h1>
              <p className="text-muted-foreground">
                Học từ vựng hiệu quả với phương pháp thẻ ghi nhớ
              </p>
            </div>

            <FlashcardSetList sets={sets} onSelectSet={selectSet} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-8">
        <FlashcardStudyView
          selectedSet={selectedSet}
          cards={cards}
          currentCard={currentCard}
          currentIndex={currentIndex}
          isFlipped={isFlipped}
          localProgress={localProgress}
          progressPercent={progressPercent}
          isComplete={isComplete}
          cardsLoading={cardsLoading}
          getRememberedCount={getRememberedCount}
          onGoBack={goBackToList}
          onToggleFlip={toggleFlip}
          onMarkRemembered={handleMarkRemembered}
          onNext={goToNext}
          onPrev={goToPrev}
          onReset={resetCards}
        />
      </main>
    </div>
  );
};

export default Flashcards;
