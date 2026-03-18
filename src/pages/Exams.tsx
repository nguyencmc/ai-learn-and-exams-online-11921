/**
 * Exams Page - Refactored
 * 
 * Main exam listing page using extracted components:
 * - useExams hook for data/state management
 * - ExamFilters for filter UI
 * - ExamPagination for page controls
 * - ExamCard for individual cards
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  FileText,
  ArrowLeft,
  SlidersHorizontal,
  Sparkles,
  X,
  Grid3X3,
  List,
  RotateCcw,
} from "lucide-react";

import { useExams } from "@/features/exams/hooks/useExams";
import { ExamFilters, ExamPagination } from "@/components/exam";
import { ExamCard } from "@/components/exam/ExamCard";
import { cn } from "@/lib/utils";

const Exams = () => {
  const navigate = useNavigate();
  const {
    // Data
    categories,
    loading,
    paginatedExams,
    filteredExams,
    totalPages,
    // Filters
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedCategories,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedDuration,
    activeCategoryId,
    viewMode,
    setViewMode,
    savedExams,
    // Pagination
    currentPage,
    setCurrentPage,
    // Mobile UI
    mobileFilterOpen,
    setMobileFilterOpen,
    mobileSearchOpen,
    setMobileSearchOpen,
    // Handlers
    handleCategoryToggle,
    handleDurationToggle,
    handleReset,
    toggleSaveExam,
    getExamCategoryIndex,
  } = useExams();

  const hasActiveFilters = selectedCategories.length > 0 || selectedDifficulty || selectedDuration.length > 0 || activeCategoryId;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center justify-between px-4 h-14">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Quay lại trang trước">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg text-foreground">Thư viện đề thi</h1>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                aria-label={mobileSearchOpen ? 'Đóng tìm kiếm' : 'Mở tìm kiếm'}
              >
                <Search className="h-5 w-5" />
              </Button>
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="Mở bộ lọc đề thi">
                    <SlidersHorizontal className="h-5 w-5" />
                    {hasActiveFilters && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Bộ lọc</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                    <ExamFilters
                      categories={categories}
                      selectedCategories={selectedCategories}
                      selectedDifficulty={selectedDifficulty}
                      selectedDuration={selectedDuration}
                      onCategoryToggle={handleCategoryToggle}
                      onDifficultyChange={(v) => { setSelectedDifficulty(v); setCurrentPage(1); }}
                      onDurationToggle={handleDurationToggle}
                      onReset={handleReset}
                    />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Mobile Search */}
          {mobileSearchOpen && (
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm đề thi..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-10 h-10"
                  autoFocus
                />
              </div>
            </div>
          )}
        </header>

        {/* Desktop Layout */}
        <main className="hidden lg:block">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-purple-500/5 border-b">
            <div className="container mx-auto px-4 py-12 relative">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-primary mb-4">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">Khám phá & Luyện tập</span>
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-4">Thư viện đề thi</h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
                  Hàng nghìn đề thi chất lượng được biên soạn bởi đội ngũ chuyên gia và cộng đồng.
                </p>

                {/* Search */}
                <div className="relative max-w-2xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm đề thi theo tên, mã hoặc từ khóa..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-12 pr-4 h-14 text-base rounded-2xl border-2"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setSearchQuery("")}
                      aria-label="Xóa từ khóa tìm kiếm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-8">
            <div className="flex gap-8">
              {/* Sidebar Filters */}
              <aside className="w-72 shrink-0">
                <Card className="sticky top-8">
                  <CardContent className="p-6">
                    <ExamFilters
                      categories={categories}
                      selectedCategories={selectedCategories}
                      selectedDifficulty={selectedDifficulty}
                      selectedDuration={selectedDuration}
                      onCategoryToggle={handleCategoryToggle}
                      onDifficultyChange={(v) => { setSelectedDifficulty(v); setCurrentPage(1); }}
                      onDurationToggle={handleDurationToggle}
                      onReset={handleReset}
                    />
                  </CardContent>
                </Card>
              </aside>

              {/* Exam List */}
              <div className="flex-1">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">{filteredExams.length} đề thi</Badge>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Sắp xếp" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Mới nhất</SelectItem>
                        <SelectItem value="popular">Phổ biến</SelectItem>
                        <SelectItem value="name">Tên A-Z</SelectItem>
                        <SelectItem value="questions">Số câu hỏi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Exams Grid/List */}
                {paginatedExams.length === 0 ? (
                  <Card className="text-center py-16">
                    <CardContent>
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Không tìm thấy đề thi</h3>
                      <p className="text-muted-foreground mb-4">Thử thay đổi bộ lọc hoặc từ khóa</p>
                      <Button onClick={handleReset} variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Xóa bộ lọc
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={cn(
                    viewMode === 'grid'
                      ? "space-y-4"
                      : "space-y-3"
                  )}>
                    {paginatedExams.map((exam) => (
                      <ExamCard
                        key={exam.id}
                        id={exam.id}
                        title={exam.title}
                        slug={exam.slug}
                        description={exam.description}
                        questionCount={exam.question_count}
                        attemptCount={exam.attempt_count}
                        durationMinutes={exam.duration_minutes}
                        difficulty={exam.difficulty}
                        categoryName={exam.category?.name}
                        categoryIndex={getExamCategoryIndex(exam)}
                        creatorName={exam.creator_name}
                        creatorAvatar={exam.creator_avatar}
                        thumbnailUrl={exam.thumbnail_url}
                        source={exam.source}
                        isSaved={savedExams.has(exam.id)}
                        onToggleSave={toggleSaveExam}
                        reviewCount={exam.attempt_count || 0}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                <ExamPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Mobile Exam List */}
        <main className="lg:hidden">
          {/* Mobile Info Bar */}
          <div className="px-4 py-3 bg-muted/30 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{filteredExams.length} đề thi</span>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 h-8 text-xs bg-background">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mới nhất</SelectItem>
                  <SelectItem value="popular">Phổ biến</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exam Cards */}
          <div className="px-4 py-4">
            {paginatedExams.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">Không tìm thấy đề thi</h3>
                <p className="text-sm text-muted-foreground mb-4">Thử thay đổi bộ lọc hoặc từ khóa</p>
                {hasActiveFilters && (
                  <Button onClick={handleReset} variant="outline" size="sm">
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedExams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    id={exam.id}
                    title={exam.title}
                    slug={exam.slug}
                    description={exam.description}
                    questionCount={exam.question_count}
                    attemptCount={exam.attempt_count}
                    durationMinutes={exam.duration_minutes}
                    difficulty={exam.difficulty}
                    categoryName={exam.category?.name}
                    categoryIndex={getExamCategoryIndex(exam)}
                    creatorName={exam.creator_name}
                    creatorAvatar={exam.creator_avatar}
                    thumbnailUrl={exam.thumbnail_url}
                    source={exam.source}
                    isSaved={savedExams.has(exam.id)}
                    onToggleSave={toggleSaveExam}
                    reviewCount={exam.attempt_count || 0}
                  />
                ))}
              </div>
            )}

            {paginatedExams.length > 0 && (
              <ExamPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Exams;
