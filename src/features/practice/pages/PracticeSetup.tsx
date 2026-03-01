import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  PlayCircle,
  BookOpen,
  Hash,
  Zap,
  Shuffle,
  ListOrdered,
  Target,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useQuestionSet } from '../hooks/useQuestionSets';

export default function PracticeSetup() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { data: questionSet, isLoading, error } = useQuestionSet(setId);

  const [questionCount, setQuestionCount] = useState('10');
  const [difficulty, setDifficulty] = useState('all');
  const [shuffle, setShuffle] = useState(true);

  const handleStartPractice = () => {
    const params = new URLSearchParams({
      count: questionCount,
      difficulty,
      shuffle: shuffle ? '1' : '0',
    });
    navigate(`/practice/run/${setId}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !questionSet) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 text-center">
          <p className="text-destructive mb-4">Không tìm thấy bộ đề</p>
          <Button variant="link" onClick={() => navigate('/practice')}>
            Quay lại
          </Button>
        </main>
      </div>
    );
  }

  const maxQuestions = questionSet.question_count;
  const questionOptions = [5, 10, 15, 20, 30, 50].filter((n) => n <= maxQuestions);
  if (maxQuestions > 0 && !questionOptions.includes(maxQuestions)) {
    questionOptions.push(maxQuestions);
  }

  const estimatedMinutes = Math.ceil(parseInt(questionCount) * 0.75);

  const difficultyLabel: Record<string, string> = {
    all: 'Tất cả',
    easy: 'Dễ',
    medium: 'Trung bình',
    hard: 'Khó',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-8 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/practice')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5">
              <BookOpen className="mr-1 h-3 w-3" />
              Luyện tập
            </Badge>
            <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5">
              <Hash className="mr-1 h-3 w-3" />
              {maxQuestions} câu hỏi
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{questionSet.title}</h1>
          {questionSet.description && (
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              {questionSet.description}
            </p>
          )}
        </div>

        {/* Settings Cards */}
        <div className="space-y-3 mb-6">
          {/* Question Count */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Số câu hỏi</Label>
                    <p className="text-xs text-muted-foreground">Tối đa {maxQuestions} câu</p>
                  </div>
                </div>
                <Select value={questionCount} onValueChange={setQuestionCount}>
                  <SelectTrigger className="w-32 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionOptions.map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} câu
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Difficulty */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Độ khó</Label>
                    <p className="text-xs text-muted-foreground">
                      Lọc theo mức độ câu hỏi
                    </p>
                  </div>
                </div>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="w-32 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="easy">Dễ (1–2)</SelectItem>
                    <SelectItem value="medium">Trung bình (3)</SelectItem>
                    <SelectItem value="hard">Khó (4–5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Shuffle Toggle */}
          <Card
            className={`border-border/60 shadow-sm cursor-pointer transition-colors ${
              shuffle ? 'bg-violet-500/5 border-violet-500/30' : ''
            }`}
            onClick={() => setShuffle((v) => !v)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                      shuffle
                        ? 'bg-violet-500/15 text-violet-500'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {shuffle ? (
                      <Shuffle className="h-4 w-4" />
                    ) : (
                      <ListOrdered className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium pointer-events-none">
                      {shuffle ? 'Xáo trộn câu hỏi' : 'Theo thứ tự'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {shuffle
                        ? 'Câu hỏi xuất hiện ngẫu nhiên mỗi lần luyện'
                        : 'Câu hỏi theo thứ tự trong bộ đề'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={shuffle}
                  onCheckedChange={setShuffle}
                  onClick={(e) => e.stopPropagation()}
                  className="data-[state=checked]:bg-violet-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Info */}
        <div className="flex items-center gap-4 px-1 mb-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            {questionCount} câu · {difficultyLabel[difficulty]}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-500" />
            ~{estimatedMinutes} phút
          </span>
          <span className="flex items-center gap-1.5">
            {shuffle ? (
              <Shuffle className="h-4 w-4 text-violet-500" />
            ) : (
              <ListOrdered className="h-4 w-4 text-muted-foreground" />
            )}
            {shuffle ? 'Ngẫu nhiên' : 'Tuần tự'}
          </span>
        </div>

        {/* Start Button */}
        <Button
          size="lg"
          className="w-full h-12 text-base font-semibold shadow-md"
          onClick={handleStartPractice}
          disabled={maxQuestions === 0}
        >
          <PlayCircle className="mr-2 h-5 w-5" />
          Bắt đầu luyện tập
        </Button>

        {maxQuestions === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-3">
            Bộ đề này chưa có câu hỏi
          </p>
        )}

        {/* Tip */}
        <p className="text-xs text-muted-foreground text-center mt-4 px-4">
          💡 Luyện tập cho phép xem đáp án ngay sau mỗi câu — phù hợp để học và ghi nhớ kiến thức
        </p>
      </main>
    </div>
  );
}
