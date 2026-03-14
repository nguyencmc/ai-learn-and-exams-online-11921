import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, LogIn } from "lucide-react";

interface GuestAccessBannerProps {
  totalQuestionsInExam: number;
}

export function GuestAccessBanner({
  totalQuestionsInExam,
}: GuestAccessBannerProps) {
  return (
    <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-xl">
      <div className="flex items-start gap-3">
        <Lock className="w-5 h-5 text-primary mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Bạn đang làm bản dùng thử</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Đăng nhập để làm toàn bộ {totalQuestionsInExam} câu hỏi của đề thi
            này.
          </p>
          <Link to="/auth">
            <Button size="sm">
              <LogIn className="w-4 h-4 mr-2" />
              Đăng nhập ngay
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
