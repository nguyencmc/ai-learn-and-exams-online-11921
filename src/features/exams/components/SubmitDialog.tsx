import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answeredCount: number;
  totalQuestions: number;
  unansweredCount: number;
  flaggedCount: number;
  onConfirm: () => void;
}

export function SubmitDialog({
  open,
  onOpenChange,
  answeredCount,
  totalQuestions,
  unansweredCount,
  flaggedCount,
  onConfirm,
}: SubmitDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận nộp bài?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p>
                Bạn đã trả lời {answeredCount}/{totalQuestions} câu hỏi.
              </p>
              {unansweredCount > 0 && (
                <p className="mt-2 text-orange-500 font-medium">
                  ⚠️ Còn {unansweredCount} câu chưa trả lời!
                </p>
              )}
              {flaggedCount > 0 && (
                <p className="mt-1 text-muted-foreground">
                  📌 {flaggedCount} câu được đánh dấu xem lại.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Tiếp tục làm bài</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Nộp bài ngay
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
