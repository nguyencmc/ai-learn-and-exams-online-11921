import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";
import type { ExamData } from "../types";

interface ExamCtaCardProps {
  exam: ExamData;
  totalQ: number;
  totalAttempts: number;
  bestScore: number | null;
  onStart: () => void;
}

export function ExamCtaCard({ exam, totalQ, totalAttempts, bestScore, onStart }: ExamCtaCardProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Play className="w-7 h-7 text-primary fill-primary/30" />
        </div>
        <div>
          <p className="font-semibold text-base">Sẵn sàng bắt đầu?</p>
          <p className="text-sm text-muted-foreground mt-1">
            {totalQ} câu · {exam.duration_minutes || 60} phút
          </p>
        </div>
        <Button size="lg" className="w-full gap-2 h-11" onClick={onStart}>
          <Play className="w-4 h-4 fill-current" />
          Bắt đầu làm bài
        </Button>
        {totalAttempts > 0 && (
          <p className="text-xs text-muted-foreground">
            Bạn đã thi <strong>{totalAttempts}</strong> lần · Cao nhất: <strong className={(bestScore ?? 0) >= 70 ? "text-emerald-500" : "text-rose-500"}>{bestScore}%</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
