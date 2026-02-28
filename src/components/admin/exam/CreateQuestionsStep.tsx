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
import { QuestionEditor, type Question } from './QuestionEditor';

interface CreateQuestionsStepProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  onImageUpload?: (file: File, questionIndex: number, field: string) => Promise<string>;
  imageBucket?: string;
}

const QUESTIONS_PER_PAGE = 10;

export const CreateQuestionsStep = ({
  questions,
  onQuestionsChange,
  onImageUpload,
  imageBucket,
}: CreateQuestionsStepProps) => {
  const [activeTab, setActiveTab] = useState('manual');
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE));
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const endIndex = startIndex + QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(startIndex, endIndex);

  const addQuestion = () => {
    const newQuestion: Question = {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      option_e: '',
      option_f: '',
      option_g: '',
      option_h: '',
      correct_answer: 'A',
      explanation: '',
      question_order: questions.length + 1,
    };
    onQuestionsChange([...questions, newQuestion]);
    // Navigate to the last page where the new question is
    const newTotalPages = Math.ceil((questions.length + 1) / QUESTIONS_PER_PAGE);
    setCurrentPage(newTotalPages);
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    onQuestionsChange(updated);
  };

  const removeQuestion = (index: number) => {
    onQuestionsChange(questions.filter((_, i) => i !== index));
    // Adjust current page if needed
    const newTotalPages = Math.max(1, Math.ceil((questions.length - 1) / QUESTIONS_PER_PAGE));
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  };

  const handleAIQuestionsGenerated = (newQuestions: any[]) => {
    const mapped = newQuestions.map((q, i) => ({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      option_e: '',
      option_f: '',
      option_g: '',
      option_h: '',
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      question_order: questions.length + i + 1,
    }));
    onQuestionsChange([...questions, ...mapped]);
    setActiveTab('manual');
    // Navigate to first page of new questions
    const newTotalPages = Math.ceil((questions.length + mapped.length) / QUESTIONS_PER_PAGE);
    setCurrentPage(Math.ceil((questions.length + 1) / QUESTIONS_PER_PAGE));
  };

  const handleImport = (importedQuestions: Question[]) => {
    onQuestionsChange(importedQuestions);
    setActiveTab('manual');
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Generate page numbers to show
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

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-medium">{questions.length}</span>
            <span className="text-muted-foreground">câu hỏi</span>
          </div>
          {questions.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Trang {currentPage} / {totalPages}
            </div>
          )}
        </div>
        <ImportExportQuestions 
          questions={questions} 
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
          {/* Question List */}
          {questions.length === 0 ? (
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
              {currentQuestions.map((question, index) => (
                <QuestionEditor
                  key={startIndex + index}
                  question={question}
                  index={startIndex + index}
                  onUpdate={updateQuestion}
                  onRemove={removeQuestion}
                  onImageUpload={onImageUpload}
                  imageBucket={imageBucket}
                />
              ))}

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
                Hỗ trợ định dạng CSV, TXT, JSON với tối đa 8 đáp án (A-H)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-4 bg-muted/30">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Badge variant="outline">TXT</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Câu hỏi bắt đầu bằng "Question" hoặc "Câu", đáp án A-H trên từng dòng, dùng * đánh dấu đáp án đúng
                  </p>
                </Card>
                <Card className="p-4 bg-muted/30">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Badge variant="outline">CSV</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Cột: Câu hỏi, A, B, C, D, E, F, G, H, Đáp án đúng, Giải thích
                  </p>
                </Card>
                <Card className="p-4 bg-muted/30">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Badge variant="outline">JSON</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Mảng object với các field: question_text, option_a-h, correct_answer
                  </p>
                </Card>
              </div>
              
              <div className="pt-4 border-t">
                <ImportExportQuestions 
                  questions={questions} 
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
