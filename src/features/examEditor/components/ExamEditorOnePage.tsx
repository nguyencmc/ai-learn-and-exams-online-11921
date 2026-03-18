import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Image as ImageIcon,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AIQuestionGenerator } from '@/components/ai/AIQuestionGenerator';
import { ImportExportQuestions } from '@/components/admin/ImportExportQuestions';
import { QuestionEditor, type Question } from '@/components/admin/exam/QuestionEditor';
import { SmartEditor } from '@/components/editor';
import type { ExamEditorState, ExamEditorActions, ExamCategory } from '../types';

type ExamEditorOnePageProps = Pick<
  ExamEditorState,
  | 'title' | 'slug' | 'description' | 'categoryId' | 'difficulty'
  | 'durationMinutes' | 'thumbnailUrl' | 'categories' | 'isEditing'
  | 'questions' | 'saving'
> &
  Pick<
    ExamEditorActions,
    | 'setTitle' | 'setSlug' | 'setDescription' | 'setCategoryId'
    | 'setDifficulty' | 'setDurationMinutes' | 'setQuestions'
    | 'handleThumbnailUpload' | 'handleThumbnailRemove'
    | 'handleImageUpload' | 'handleSave'
  >;

// ─── Left: Exam Info ─────────────────────────────────────────────────────────
function ExamInfoPanel({
  title, slug, isEditing, thumbnailUrl,
  onTitleChange, onSlugChange, onThumbnailUpload, onThumbnailRemove,
}: {
  title: string; slug: string; isEditing: boolean; thumbnailUrl: string;
  onTitleChange: (v: string) => void; onSlugChange: (v: string) => void;
  onThumbnailUpload: (f: File) => Promise<string>; onThumbnailRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const toSlug = (t: string) =>
    t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const onTitle = (v: string) => {
    onTitleChange(v);
    if (!isEditing) onSlugChange(toSlug(v));
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try { await onThumbnailUpload(file); } finally { setUploading(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">
        Thông tin đề thi
      </p>

      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Tên đề thi</Label>
        <Input value={title} onChange={e => onTitle(e.target.value)}
          placeholder="VD: Đề thi Toán lớp 12"
          className="h-9 bg-muted/40 border-border/50 text-sm focus:bg-background" />
      </div>

      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Đường dẫn (Slug)</Label>
        <Input value={slug} onChange={e => onSlugChange(e.target.value)}
          placeholder="de-thi-toan-lop-12"
          className="h-9 bg-muted/40 border-border/50 text-xs font-mono focus:bg-background" />
      </div>

      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Ảnh bìa</Label>
        {thumbnailUrl ? (
          <div className="relative group rounded-xl overflow-hidden border border-border/50">
            <img src={thumbnailUrl} alt="Ảnh bìa đề thi" className="w-full h-28 object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="destructive" size="sm" onClick={onThumbnailRemove} className="gap-1 text-xs h-7 px-3">
                <X className="w-3 h-3" /> Xóa ảnh
              </Button>
            </div>
          </div>
        ) : (
          <div
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
              ${drag ? 'border-primary bg-primary/5' : 'border-border/40 hover:border-primary/40 hover:bg-muted/20'}`}
          >
            {uploading
              ? <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
              : <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Click hoặc kéo thả ảnh vào đây</p>
                </div>
            }
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      </div>
    </div>
  );
}

// ─── Left: Question Grid ──────────────────────────────────────────────────────
function QuestionGrid({
  questions, activeIndex, onSelect, onAdd,
}: {
  questions: Question[]; activeIndex: number;
  onSelect: (i: number) => void; onAdd: () => void;
}) {
  const completed = questions.filter(q => q.question_text?.trim() && q.correct_answer?.trim()).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">Danh sách câu hỏi</p>
        <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0">
          {completed}/{questions.length}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {questions.map((q, i) => {
          const done = !!(q.question_text?.trim() && q.correct_answer?.trim());
          const active = i === activeIndex;
          return (
            <button key={i} onClick={() => onSelect(i)}
              title={`Câu ${i + 1}${done ? ` · Đáp án: ${q.correct_answer}` : ' · Chưa hoàn chỉnh'}`}
              className={`h-11 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all text-xs font-bold border
                ${active
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-105'
                  : done
                    ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                    : 'bg-muted/50 text-muted-foreground border-border/30 hover:bg-muted'
                }`}
            >
              <span>{i + 1}</span>
              {done && !active && (
                <span className="text-[9px] leading-none opacity-70">{q.correct_answer}</span>
              )}
            </button>
          );
        })}

        {questions.length < 50 && (
          <button onClick={onAdd}
            className="h-11 rounded-lg border-2 border-dashed border-border/40 text-muted-foreground/60
              hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center">
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Center: Single Question Editor ──────────────────────────────────────────
function QuestionEditorPanel({
  questions, activeIndex, onQuestionsChange, onImageUpload, onAddQuestion, onSelectIndex,
}: {
  questions: Question[];
  activeIndex: number;
  onQuestionsChange: React.Dispatch<React.SetStateAction<Question[]>>;
  onImageUpload?: (f: File, qi: number, field: string) => Promise<string>;
  onAddQuestion: () => void;
  onSelectIndex: (i: number) => void;
}) {
  const [tab, setTab] = useState('manual');

  const update = useCallback((index: number, field: keyof Question, value: string | number) => {
    onQuestionsChange(prev => {
      const u = [...prev];
      u[index] = { ...u[index], [field]: value };
      return u;
    });
  }, [onQuestionsChange]);

  const remove = useCallback((index: number) => {
    onQuestionsChange(prev => prev.filter((_, i) => i !== index));
    // Move selection
    onSelectIndex(Math.max(0, index - 1));
  }, [onQuestionsChange, onSelectIndex]);

  const handleAI = (newQs: Pick<Question, 'question_text' | 'option_a' | 'option_b' | 'option_c' | 'option_d' | 'correct_answer' | 'explanation'>[]) => {
    const mapped = newQs.map((q, i) => ({
      ...q, option_e: '', option_f: '', option_g: '', option_h: '',
      question_order: questions.length + i + 1,
    }));
    onQuestionsChange(prev => [...prev, ...mapped]);
    setTab('manual');
    onSelectIndex(questions.length);
  };

  const handleImport = (imported: Question[]) => {
    onQuestionsChange(imported);
    setTab('manual');
    onSelectIndex(0);
  };

  const currentQ = questions[activeIndex];
  const total = questions.length;

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
        {tab === 'manual' && total > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
              disabled={activeIndex === 0}
              onClick={() => onSelectIndex(activeIndex - 1)}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground px-1 font-medium">
              {activeIndex + 1} / {total}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
              disabled={activeIndex === total - 1}
              onClick={() => onSelectIndex(activeIndex + 1)}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      <TabsContent value="manual" className="mt-0">
        {total === 0 ? (
          <div className="border-2 border-dashed border-border/40 rounded-2xl py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Chưa có câu hỏi nào</h3>
            <p className="text-sm text-muted-foreground mb-5">Bắt đầu thêm câu hỏi thủ công, import hoặc dùng AI</p>
            <Button onClick={onAddQuestion} size="sm" className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" /> Thêm câu hỏi đầu tiên
            </Button>
          </div>
        ) : currentQ ? (
          /* Single question view */
          <QuestionEditor
            key={activeIndex}
            question={currentQ}
            index={activeIndex}
            onUpdate={update}
            onRemove={remove}
            onImageUpload={onImageUpload}
            imageBucket="question-images"
          />
        ) : null}

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
              { type: 'TXT', desc: 'Dòng: Question/Câu, các lựa chọn A-H, dấu * cho đáp án đúng' },
              { type: 'CSV', desc: 'Cột: Question, A-H, Correct, Explanation' },
              { type: 'JSON', desc: 'Mảng: question_text, option_a-h, correct_answer' },
            ].map(({ type, desc }) => (
              <div key={type} className="rounded-xl border border-border/40 bg-muted/30 p-3">
                <Badge variant="outline" className="mb-1.5 text-[10px]">{type}</Badge>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <ImportExportQuestions questions={questions} onImport={handleImport} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ─── Right: Settings Panel ────────────────────────────────────────────────────
function SettingsPanel({
  categories, categoryId, difficulty, durationMinutes, description, questions,
  onCategoryChange, onDifficultyChange, onDurationChange, onDescriptionChange,
}: {
  categories: ExamCategory[]; categoryId: string; difficulty: string;
  durationMinutes: number; description: string; questions: Question[];
  onCategoryChange: (v: string) => void; onDifficultyChange: (v: string) => void;
  onDurationChange: (v: number) => void; onDescriptionChange: (v: string) => void;
}) {
  const completed = questions.filter(q => q.question_text?.trim() && q.correct_answer?.trim()).length;
  const totalPoints = questions.length * 10;
  const avgTime = questions.length > 0
    ? `${Math.round(durationMinutes / questions.length * 60)}s`
    : '—';

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">
        Cài đặt đề thi
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

      {/* Difficulty */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Mức độ khó</Label>
        <div className="flex gap-1.5">
          {[
            { v: 'easy', l: 'Dễ', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
            { v: 'medium', l: 'TB', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
            { v: 'hard', l: 'Khó', cls: 'bg-rose-100 text-rose-700 border-rose-300' },
          ].map(({ v, l, cls }) => (
            <button key={v} onClick={() => onDifficultyChange(v)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all
                ${difficulty === v ? cls + ' shadow-sm' : 'bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Time */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Thời gian (phút)</Label>
        <Input type="number" value={durationMinutes}
          onChange={e => onDurationChange(parseInt(e.target.value) || 60)}
          min={1} max={300}
          className="h-9 bg-muted/40 border-border/50 text-sm" />
        <div className="flex flex-wrap gap-1 pt-1">
          {[30, 45, 60, 90, 120].map(m => (
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

      {/* Description */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Mô tả</Label>
        <SmartEditor content={description} onChange={onDescriptionChange}
          placeholder="Mô tả ngắn gọn về đề thi..." miniMinHeight="80px" fullMinHeight="130px" />
      </div>

      <div className="border-t border-border/40 pt-4 space-y-2">
        <p className="text-[10px] font-bold tracking-widest text-primary uppercase">Thống kê trực tiếp</p>
        {[
          { label: 'Tổng số câu', value: `${questions.length}` },
          { label: 'Đã hoàn thành', value: `${completed} / ${questions.length}` },
          { label: 'Tổng điểm', value: `${totalPoints} đ` },
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
export function ExamEditorOnePage(props: ExamEditorOnePageProps) {
  const {
    title, slug, description, categoryId, difficulty, durationMinutes,
    thumbnailUrl, categories, isEditing, questions, saving,
    setTitle, setSlug, setDescription, setCategoryId, setDifficulty,
    setDurationMinutes, setQuestions, handleThumbnailUpload,
    handleThumbnailRemove, handleImageUpload, handleSave,
  } = props;

  const [activeIndex, setActiveIndex] = useState(0);

  const addQuestion = useCallback(() => {
    const newQ: Question = {
      question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
      option_e: '', option_f: '', option_g: '', option_h: '',
      correct_answer: 'A', explanation: '', question_order: questions.length + 1,
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
            <Link to="/admin/exams">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="leading-tight">
              <h1 className="text-sm font-bold">{isEditing ? 'Chỉnh sửa Đề thi' : 'Tạo Đề thi Mới'}</h1>
              <p className="text-[11px] text-muted-foreground">{title || 'Chưa có tiêu đề'} · {questions.length} câu hỏi</p>
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
              Xuất bản Đề thi
            </Button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-[220px_1fr_240px] gap-5 items-start">

          {/* LEFT */}
          <div className="sticky top-20 space-y-5 bg-background rounded-2xl border border-border/50 p-4 shadow-sm">
            <ExamInfoPanel
              title={title} slug={slug} isEditing={isEditing} thumbnailUrl={thumbnailUrl}
              onTitleChange={setTitle} onSlugChange={setSlug}
              onThumbnailUpload={handleThumbnailUpload} onThumbnailRemove={handleThumbnailRemove}
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
              categories={categories} categoryId={categoryId} difficulty={difficulty}
              durationMinutes={durationMinutes} description={description} questions={questions}
              onCategoryChange={setCategoryId} onDifficultyChange={setDifficulty}
              onDurationChange={setDurationMinutes} onDescriptionChange={setDescription}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
