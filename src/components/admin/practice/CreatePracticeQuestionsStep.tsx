import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Upload, 
  Plus,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { AIQuestionGenerator } from '@/components/ai/AIQuestionGenerator';
import { ImportExportQuestions } from '@/components/admin/ImportExportQuestions';
import { PracticeQuestionEditor, type PracticeQuestion } from './PracticeQuestionEditor';

interface CreatePracticeQuestionsStepProps {
  questions: PracticeQuestion[];
  onQuestionsChange: (questions: PracticeQuestion[]) => void;
  defaultDifficulty?: string;
  onImageUpload?: (file: File, questionIndex: number, field: string) => Promise<string>;
  imageBucket?: string;
}

const QUESTIONS_PER_PAGE = 10;

export const CreatePracticeQuestionsStep = ({
  questions,
  onQuestionsChange,
  defaultDifficulty = 'medium',
  onImageUpload,
  imageBucket,
}: CreatePracticeQuestionsStepProps) => {
  const [activeTab, setActiveTab] = useState('manual');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter out deleted questions for display
  const visibleQuestions = questions.filter(q => !q.isDeleted);
  const totalPages = Math.max(1, Math.ceil(visibleQuestions.length / QUESTIONS_PER_PAGE));
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const endIndex = startIndex + QUESTIONS_PER_PAGE;
  const currentQuestions = visibleQuestions.slice(startIndex, endIndex);

  const addQuestion = () => {
    const newQuestion: PracticeQuestion = {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      explanation: '',
      difficulty: defaultDifficulty,
      tags: [],
      question_order: questions.length + 1,
      isNew: true,
    };
    onQuestionsChange([...questions, newQuestion]);
    const newTotalPages = Math.ceil((visibleQuestions.length + 1) / QUESTIONS_PER_PAGE);
    setCurrentPage(newTotalPages);
  };

  const updateQuestion = (visibleIndex: number, field: keyof PracticeQuestion, value: any) => {
    // Find the actual index in the original array
    const question = currentQuestions[visibleIndex - startIndex];
    const actualIndex = questions.findIndex(q => q === question);
    if (actualIndex === -1) return;

    const updated = [...questions];
    (updated[actualIndex] as any)[field] = value;
    onQuestionsChange(updated);
  };

  const removeQuestion = (visibleIndex: number) => {
    const question = currentQuestions[visibleIndex - startIndex];
    const actualIndex = questions.findIndex(q => q === question);
    if (actualIndex === -1) return;

    if (question.id) {
      // Mark existing question for deletion
      const updated = [...questions];
      updated[actualIndex] = { ...question, isDeleted: true };
      onQuestionsChange(updated);
    } else {
      // Remove new question entirely
      onQuestionsChange(questions.filter((_, i) => i !== actualIndex));
    }

    const newTotalPages = Math.max(1, Math.ceil((visibleQuestions.length - 1) / QUESTIONS_PER_PAGE));
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  };

  const handleAIQuestionsGenerated = (newQuestions: any[]) => {
    const mapped: PracticeQuestion[] = newQuestions.map((q, i) => ({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
      difficulty: defaultDifficulty,
      tags: [],
      question_order: questions.length + i + 1,
      isNew: true,
    }));
    onQuestionsChange([...questions, ...mapped]);
    setActiveTab('manual');
    setCurrentPage(Math.ceil((visibleQuestions.length + 1) / QUESTIONS_PER_PAGE));
  };

  const handleImport = (importedQuestions: any[]) => {
    const mapped: PracticeQuestion[] = importedQuestions.map((q, i) => ({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      option_e: q.option_e || '',
      option_f: q.option_f || '',
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
      difficulty: q.difficulty || defaultDifficulty,
      tags: q.tags || [],
      question_order: i + 1,
      isNew: true,
    }));
    onQuestionsChange(mapped);
    setActiveTab('manual');
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Map questions for export (without internal flags)
  const exportQuestions = visibleQuestions.map((q, i) => ({
    question_text: q.question_text,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    option_e: q.option_e || '',
    option_f: q.option_f || '',
    option_g: '',
    option_h: '',
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    question_order: i + 1,
  }));

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-medium">{visibleQuestions.length}</span>
            <span className="text-muted-foreground">câu hỏi</span>
          </div>
          {visibleQuestions.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Trang {currentPage} / {totalPages}
            </div>
          )}
        </div>
        <ImportExportQuestions 
          questions={exportQuestions} 
          onImport={handleImport}
        />
      </div>

      {/* Creation Methods */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="manual" className="flex items-center gap-2 py-3">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thủ công</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2 py-3">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2 py-3">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6 space-y-4">
          {visibleQuestions.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">Chưa có câu hỏi nào</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Bắt đầu bằng cách thêm câu hỏi thủ công hoặc sử dụng AI
                </p>
                <Button onClick={addQuestion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm câu hỏi đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Pagination Top */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {getPageNumbers().map((page, idx) => (
                    typeof page === 'number' ? (
                      <Button
                        key={idx}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Button>
                    ) : (
                      <span key={idx} className="px-2 text-muted-foreground">...</span>
                    )
                  ))}
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Questions for current page */}
              {currentQuestions.map((question, idx) => {
                const visibleIndex = startIndex + idx;
                return (
                  <PracticeQuestionEditor
                    key={question.id || `new-${visibleIndex}`}
                    question={question}
                    index={visibleIndex}
                    onUpdate={(_, field, value) => updateQuestion(visibleIndex, field, value)}
                    onRemove={() => removeQuestion(visibleIndex)}
                    onImageUpload={onImageUpload}
                    imageBucket={imageBucket}
                  />
                );
              })}

              {/* Pagination Bottom */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 flex-wrap pt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {getPageNumbers().map((page, idx) => (
                    typeof page === 'number' ? (
                      <Button
                        key={idx}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Button>
                    ) : (
                      <span key={idx} className="px-2 text-muted-foreground">...</span>
                    )
                  ))}
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <Button 
                onClick={addQuestion} 
                variant="outline" 
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm câu hỏi mới
              </Button>
            </>
          )}
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <AIQuestionGenerator 
            onQuestionsGenerated={handleAIQuestionsGenerated}
          />
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Import câu hỏi từ file
              </CardTitle>
              <CardDescription>
                Hỗ trợ định dạng CSV, TXT, JSON với tối đa 6 đáp án (A-F)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-4 bg-muted/30">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Badge variant="outline">TXT</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Câu hỏi bắt đầu bằng "Question" hoặc "Câu", đáp án A-F trên từng dòng, dùng * đánh dấu đáp án đúng
                  </p>
                </Card>
                <Card className="p-4 bg-muted/30">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Badge variant="outline">CSV</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Cột: Câu hỏi, A, B, C, D, E, F, Đáp án đúng, Giải thích
                  </p>
                </Card>
                <Card className="p-4 bg-muted/30">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Badge variant="outline">JSON</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Mảng object với các field: question_text, option_a-f, correct_answer
                  </p>
                </Card>
              </div>
              
              <div className="pt-4 border-t">
                <ImportExportQuestions 
                  questions={exportQuestions} 
                  onImport={handleImport}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
