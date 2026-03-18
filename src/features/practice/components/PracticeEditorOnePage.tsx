import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Sparkles,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Tags,
} from 'lucide-react';
import { AIQuestionGenerator } from '@/components/ai/AIQuestionGenerator';
import { ImportExportQuestions } from '@/components/admin/ImportExportQuestions';
import type { Question as ImportExportQuestion } from '@/components/admin/importExport';
import { PracticeQuestionEditor } from '@/components/admin/practice/PracticeQuestionEditor';
import type { PracticeQuestion } from '@/components/admin/practice/PracticeQuestionEditor';
import { SmartEditor } from '@/components/editor';
import { BadgeInput } from '@/components/ui/badge-input';
import type { PracticeEditorState, PracticeEditorActions, ExamCategory } from '../hooks/usePracticeEditor';

type PracticeEditorOnePageProps = Pick<
  PracticeEditorState,
  | 'title' | 'slug' | 'description' | 'level' | 'durationMinutes'
  | 'tags' | 'isPublished' | 'categoryId' | 'categories' | 'questions'
  | 'isEditMode' | 'saving'
> &
  Pick<
    PracticeEditorActions,
    | 'setTitle' | 'setSlug' | 'setDescription' | 'setLevel'
    | 'setDurationMinutes' | 'setTags' | 'setIsPublished' | 'setCategoryId'
    | 'setQuestions' | 'handleTitleChange' | 'handleSave' | 'handleImageUpload'
  >;

// ─── Left: Practice Info ─────────────────────────────────────────────────────────
function PracticeInfoPanel({
  title, slug, isEditMode, isPublished,
  onTitleChange, onSlugChange, onPublishedChange,
}: {
  title: string; slug: string; isEditMode: boolean; isPublished: boolean;
  onTitleChange: (v: string) => void; onSlugChange: (v: string) => void;
  onPublishedChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">
          Thông tin bộ đề
        </p>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold">Công khai</Label>
          <Switch checked={isPublished} onCheckedChange={onPublishedChange} />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Tên bộ đề luyện tập</Label>
        <Input value={title} onChange={e => onTitleChange(e.target.value)}
          placeholder="VD: Luyện thi HSK 4 - Đề 1"
          className="h-9 bg-muted/40 border-border/50 text-sm focus:bg-background" />
      </div>

      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Đường dẫn (Slug)</Label>
        <Input value={slug} onChange={e => onSlugChange(e.target.value)}
          placeholder="luyen-thi-hsk-4-de-1"
          className="h-9 bg-muted/40 border-border/50 text-xs font-mono focus:bg-background" />
      </div>
    </div>
  );
}

// ─── Left: Question Grid ──────────────────────────────────────────────────────
function QuestionGrid({
  questions, activeIndex, onSelect, onAdd,
}: {
  questions: PracticeQuestion[]; activeIndex: number;
  onSelect: (i: number) => void; onAdd: () => void;
}) {
  const activeQuestions = questions.filter(q => !q.isDeleted);
  const completed = activeQuestions.filter(q => q.question_text?.trim() && q.correct_answer?.trim()).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">Danh sách câu hỏi</p>
        <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0">
          {completed}/{activeQuestions.length}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {activeQuestions.map((q, rawIndex) => {
          // Find original index to pass to onSelect
          const originalIndex = questions.findIndex(orig => orig === q);
          
          const done = !!(q.question_text?.trim() && q.correct_answer?.trim());
          const active = originalIndex === activeIndex;
          return (
            <button key={originalIndex} onClick={() => onSelect(originalIndex)}
              title={`Câu ${rawIndex + 1}${done ? ` · Đáp án: ${q.correct_answer}` : ' · Chưa hoàn chỉnh'}`}
              className={`h-11 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all text-xs font-bold border
                ${active
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-105'
                  : done
                    ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                    : 'bg-muted/50 text-muted-foreground border-border/30 hover:bg-muted'
                }`}
            >
              <span>{rawIndex + 1}</span>
              {done && !active && (
                <span className="text-[9px] leading-none opacity-70">{q.correct_answer}</span>
              )}
            </button>
          );
        })}

        <button onClick={onAdd}
          className="h-11 rounded-lg border-2 border-dashed border-border/40 text-muted-foreground/60
            hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Center: Single Question Editor ──────────────────────────────────────────
function QuestionEditorPanel({
  questions, activeIndex, onQuestionsChange, onImageUpload, onAddQuestion, onSelectIndex,
}: {
  questions: PracticeQuestion[];
  activeIndex: number;
  onQuestionsChange: React.Dispatch<React.SetStateAction<PracticeQuestion[]>>;
  onImageUpload?: (f: File, qi: number, field: string) => Promise<string>;
  onAddQuestion: () => void;
  onSelectIndex: (i: number) => void;
}) {
  const [tab, setTab] = useState('manual');

  const update = useCallback((index: number, field: keyof PracticeQuestion, value: string | number) => {
    onQuestionsChange(prev => {
      const u = [...prev];
      u[index] = { ...u[index], [field]: value };
      return u;
    });
  }, [onQuestionsChange]);

  const remove = useCallback((index: number) => {
    onQuestionsChange(prev => {
      const updated = [...prev];
      if (updated[index].id) {
        updated[index] = { ...updated[index], isDeleted: true };
      } else {
        updated.splice(index, 1);
      }
      return updated;
    });

    // Find next valid index
    onQuestionsChange(currentQs => {
      const validQs = currentQs.map((q, i) => ({ ...q, i })).filter(q => !q.isDeleted);
      if (validQs.length > 0) {
        // Try to select the one before the deleted, or the first available
        const currentValidIndex = validQs.findIndex(q => q.i > index);
        if (currentValidIndex > 0) {
          onSelectIndex(validQs[currentValidIndex - 1].i);
        } else {
          onSelectIndex(validQs[0].i);
        }
      } else {
        onSelectIndex(0);
      }
      return currentQs;
    });
  }, [onQuestionsChange, onSelectIndex]);

  const handleAI = (newQs: Pick<PracticeQuestion, 'question_text' | 'option_a' | 'option_b' | 'option_c' | 'option_d' | 'correct_answer' | 'explanation'>[]) => {
    const mapped: PracticeQuestion[] = newQs.map((q, i) => ({
      ...q, option_e: '', option_f: '', option_g: '', option_h: '',
      difficulty: 'medium', tags: [], isNew: true,
      question_order: questions.length + i + 1,
    }));
    onQuestionsChange(prev => [...prev, ...mapped]);
    setTab('manual');
    onSelectIndex(questions.length);
  };

  const handleImport = (imported: ImportExportQuestion[]) => {
    const mapped: PracticeQuestion[] = imported.map((q, i) => ({
      ...q,
      option_e: q.option_e || '',
      option_f: q.option_f || '',
      option_g: q.option_g || '',
      option_h: q.option_h || '',
      isNew: true,
      difficulty: 'medium',
      tags: [],
      question_order: questions.length + i + 1,
    }));
    onQuestionsChange(prev => [...prev, ...mapped]);
    setTab('manual');
    onSelectIndex(questions.length > 0 ? questions.length : 0);
  };

  const importableQuestions: ImportExportQuestion[] = questions.map((q, i) => ({
    id: q.id,
    question_text: q.question_text,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    option_e: q.option_e || '',
    option_f: q.option_f || '',
    option_g: q.option_g || '',
    option_h: q.option_h || '',
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    question_order: q.question_order || i + 1,
  }));

  const currentQ = questions[activeIndex];
  const activeQuestions = questions.filter(q => !q.isDeleted);
  const total = activeQuestions.length;

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex items-center gap-3">
        <TabsList className="bg-muted/40 border border-border/40 p-1 rounded-xl h-auto flex-shrink-0">
          <TabsTrigger value="manual"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileText className="w-3.5 h-3.5" /> Nhập thủ công
          </TabsTrigger>
          <TabsTrigger value="import"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Import CSV
          </TabsTrigger>
          <TabsTrigger value="ai"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> AI Tạo câu hỏi
          </TabsTrigger>
        </TabsList>

        {/* Question nav arrows (only in manual mode) */}
        {tab === 'manual' && total > 0 && currentQ && !currentQ.isDeleted && (
          <div className="flex items-center gap-1 ml-auto">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
              onClick={() => {
                const prevValid = activeQuestions.findIndex(q => q === currentQ) - 1;
                if (prevValid >= 0) {
                  const origIdx = questions.findIndex(q => q === activeQuestions[prevValid]);
                  onSelectIndex(origIdx);
                }
              }}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground px-1 font-medium">
              {activeQuestions.findIndex(q => q === currentQ) + 1} / {total}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
              onClick={() => {
                const nextValid = activeQuestions.findIndex(q => q === currentQ) + 1;
                if (nextValid < total) {
                  const origIdx = questions.findIndex(q => q === activeQuestions[nextValid]);
                  onSelectIndex(origIdx);
                }
              }}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      <TabsContent value="manual" className="mt-0">
        {total === 0 || !currentQ || currentQ.isDeleted ? (
          <div className="border-2 border-dashed border-border/40 rounded-2xl py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Chưa có câu hỏi nào</h3>
            <p className="text-sm text-muted-foreground mb-5">Bắt đầu thêm câu hỏi thủ công hoặc dùng AI</p>
            <Button onClick={onAddQuestion} size="sm" className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" /> Thêm câu hỏi đầu tiên
            </Button>
          </div>
        ) : (
          <PracticeQuestionEditor
            key={activeIndex}
            question={currentQ}
            index={activeIndex}
            onUpdate={update}
            onRemove={remove}
            onImageUpload={onImageUpload}
          />
        )}

        {/* Add button at bottom */}
        {total > 0 && (
          <Button onClick={onAddQuestion} variant="outline"
            className="w-full mt-4 border-dashed rounded-xl gap-2 text-sm">
            <Plus className="w-4 h-4" /> Thêm câu hỏi mới
          </Button>
        )}
      </TabsContent>

      <TabsContent value="ai" className="mt-0">
        <AIQuestionGenerator onQuestionsGenerated={handleAI} />
      </TabsContent>

      <TabsContent value="import" className="mt-0">
        <div className="rounded-2xl border border-border/50 p-5 space-y-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-1 text-sm">
              <FileSpreadsheet className="w-4 h-4 text-primary" /> Import câu hỏi từ file
            </h3>
            <p className="text-xs text-muted-foreground">Hỗ trợ các định dạng CSV, TXT, JSON (tối đa 8 lựa chọn A–H)</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: 'TXT', desc: 'Dòng: Câu hỏi/Question, các lựa chọn A-H, dấu * ở đáp án đúng' },
              { type: 'CSV', desc: 'Cột: Question, A, B, C, D, E, F, G, H, Answer, Explanation' },
              { type: 'JSON', desc: 'Mảng object: question_text, option_a-h, correct_answer' },
            ].map(({ type, desc }) => (
              <div key={type} className="rounded-xl border border-border/40 bg-muted/30 p-3">
                <Badge variant="outline" className="mb-1.5 text-[10px]">{type}</Badge>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <ImportExportQuestions questions={importableQuestions} onImport={handleImport} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ─── Right: Settings Panel ────────────────────────────────────────────────────
function SettingsPanel({
  categories, categoryId, level, durationMinutes, description, tags, questions,
  onCategoryChange, onLevelChange, onDurationChange, onDescriptionChange, onTagsChange,
}: {
  categories: ExamCategory[]; categoryId: string; level: string;
  durationMinutes: number; description: string; tags: string[]; questions: PracticeQuestion[];
  onCategoryChange: (v: string) => void; onLevelChange: (v: string) => void;
  onDurationChange: (v: number) => void; onDescriptionChange: (v: string) => void;
  onTagsChange: (v: string[]) => void;
}) {
  const activeQs = questions.filter(q => !q.isDeleted);
  const completed = activeQs.filter(q => q.question_text?.trim() && q.correct_answer?.trim()).length;
  const avgTime = activeQs.length > 0
    ? `${Math.round(durationMinutes / activeQs.length * 60)}s`
    : '—';

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">
        Cài đặt luyện tập
      </p>

      {/* Category */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Danh mục</Label>
        <Select value={categoryId} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-9 bg-muted/40 border-border/50 text-sm">
            <SelectValue placeholder="Chọn danh mục" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Level */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Cấp độ</Label>
        <div className="flex gap-1.5">
          {[
            { v: 'easy', l: 'Dễ', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
            { v: 'medium', l: 'TB', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
            { v: 'hard', l: 'Khó', cls: 'bg-rose-100 text-rose-700 border-rose-300' },
          ].map(({ v, l, cls }) => (
            <button key={v} onClick={() => onLevelChange(v)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all
                ${level === v ? cls + ' shadow-sm' : 'bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Time */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Thời gian làm bài (phút)</Label>
        <Input type="number" value={durationMinutes}
          onChange={e => onDurationChange(parseInt(e.target.value) || 60)}
          min={1} max={300}
          className="h-9 bg-muted/40 border-border/50 text-sm" />
        <div className="flex flex-wrap gap-1 pt-1">
          {[15, 30, 45, 60, 90].map(m => (
            <button key={m} onClick={() => onDurationChange(m)}
              className={`px-2 py-1 text-[11px] rounded-md border transition-all
                ${durationMinutes === m
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted'}`}>
              {m}p
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <Label className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
          <Tags className="w-3.5 h-3.5" /> Thẻ (Tags)
        </Label>
        <BadgeInput
          value={tags}
          onChange={onTagsChange}
          placeholder="Thêm thẻ (VD: HSK4, Ngữ pháp)..."
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Mô tả</Label>
        <SmartEditor content={description} onChange={onDescriptionChange}
          placeholder="Mô tả ngắn gọn về bộ đề..." miniMinHeight="80px" fullMinHeight="130px" />
      </div>

      <div className="border-t border-border/40 pt-4 space-y-2">
        <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Thống kê trực tiếp</p>
        {[
          { label: 'Tổng số câu', value: `${activeQs.length}` },
          { label: 'Đã hoàn thành', value: `${completed} / ${activeQs.length}` },
          { label: 'T.gian TB/Câu', value: avgTime },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs font-bold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function PracticeEditorOnePage(props: PracticeEditorOnePageProps) {
  const {
    title, slug, description, categoryId, level, durationMinutes, tags,
    isPublished, categories, isEditMode, questions, saving,
    handleTitleChange, setSlug, setDescription, setCategoryId, setLevel,
    setDurationMinutes, setTags, setIsPublished, setQuestions,
    handleImageUpload, handleSave,
  } = props;

  const [activeIndex, setActiveIndex] = useState(0);

  const addQuestion = useCallback(() => {
    const newQ: PracticeQuestion = {
      isNew: true,
      question_text: '', option_a: '', option_b: '',
      option_c: '', option_d: '', option_e: '', option_f: '',
      explanation: '', correct_answer: 'A', difficulty: 'medium', tags: [],
      question_order: questions.length + 1,
    };
    setQuestions(prev => {
      const next = [...prev, newQ];
      setActiveIndex(next.length - 1);
      return next;
    });
  }, [questions.length, setQuestions]);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/50 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Link to="/practice/my-sets">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="leading-tight">
              <h1 className="text-sm font-bold">{isEditMode ? 'Chỉnh sửa bộ đề' : 'Tạo bộ đề Luyện tập'}</h1>
              <p className="text-[11px] text-muted-foreground">
                {title || 'Chưa có tiêu đề'} · {questions.filter(q => !q.isDeleted).length} câu hỏi
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}
              className="h-8 px-4 rounded-xl gap-1.5 text-xs">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Lưu bản nháp
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}
              className="h-8 px-5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 gap-1.5">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Lưu & Xuất bản
            </Button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-[240px_1fr_260px] gap-5 items-start">

          {/* LEFT */}
          <div className="sticky top-20 space-y-5 bg-background rounded-2xl border border-border/50 p-4 shadow-sm">
            <PracticeInfoPanel
              title={title} slug={slug} isEditMode={isEditMode} isPublished={isPublished}
              onTitleChange={handleTitleChange} onSlugChange={setSlug} onPublishedChange={setIsPublished}
            />
            <div className="border-t border-border/40" />
            <QuestionGrid
              questions={questions} activeIndex={activeIndex}
              onSelect={setActiveIndex} onAdd={addQuestion}
            />
          </div>

          {/* CENTER */}
          <div className="bg-background rounded-2xl border border-border/50 p-5 shadow-sm min-h-[600px] min-w-0">
            <QuestionEditorPanel
              questions={questions}
              activeIndex={activeIndex}
              onQuestionsChange={setQuestions}
              onImageUpload={handleImageUpload}
              onAddQuestion={addQuestion}
              onSelectIndex={setActiveIndex}
            />
          </div>

          {/* RIGHT */}
          <div className="sticky top-20 bg-background rounded-2xl border border-border/50 p-4 shadow-sm">
            <SettingsPanel
              categories={categories} categoryId={categoryId} level={level}
              durationMinutes={durationMinutes} description={description} tags={tags} questions={questions}
              onCategoryChange={setCategoryId} onLevelChange={setLevel}
              onDurationChange={setDurationMinutes} onDescriptionChange={setDescription} onTagsChange={setTags}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
