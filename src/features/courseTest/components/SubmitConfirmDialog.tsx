import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, Loader2 } from 'lucide-react';

interface SubmitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answeredCount: number;
  totalQuestions: number;
  submitting: boolean;
  onSubmit: () => void;
}

export const SubmitConfirmDialog = ({
  open,
  onOpenChange,
  answeredCount,
  totalQuestions,
  submitting,
  onSubmit,
}: SubmitConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận nộp bài</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn đã trả lời {answeredCount}/{totalQuestions} câu hỏi.
            {answeredCount < totalQuestions && (
              <span className="text-orange-600 block mt-2">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Còn {totalQuestions - answeredCount} câu chưa trả lời!
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Tiếp tục làm bài</AlertDialogCancel>
          <AlertDialogAction onClick={onSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Nộp bài'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
