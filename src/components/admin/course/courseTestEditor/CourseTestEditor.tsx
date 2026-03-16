import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClipboardList, Loader2, Save } from 'lucide-react';
import type { CourseTestEditorProps } from './types';
import { useCourseTestEditor } from './useCourseTestEditor';
import { TestSettingsCard } from './TestSettingsCard';
import { QuestionsListCard } from './QuestionsListCard';

export const CourseTestEditor = ({ lessonId, lessonTitle }: CourseTestEditorProps) => {
  const {
    open,
    setOpen,
    loading,
    saving,
    test,
    setTest,
    questions,
    addQuestion,
    updateQuestion,
    removeQuestion,
    handleSave,
  } = useCourseTestEditor(lessonId, lessonTitle);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <ClipboardList className="w-3 h-3" />
          Quản lý bài test
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Quản lý bài test - {lessonTitle}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <TestSettingsCard test={test} onTestChange={setTest} />

            <QuestionsListCard
              questions={questions}
              onAdd={addQuestion}
              onUpdate={updateQuestion}
              onRemove={removeQuestion}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Đóng
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Lưu bài test
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
