import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  ChevronRight,
  Plus,
  Target,
} from 'lucide-react';
import type { TeacherStats } from '@/features/admin/types';

interface TeacherExamsTabProps {
  stats: TeacherStats;
  canCreateExams: boolean;
}

export function TeacherExamsTab({ stats, canCreateExams }: TeacherExamsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Quản lý đề thi</h2>
        {canCreateExams && (
          <Link to="/admin/exams/create">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Tạo đề thi
            </Button>
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/admin/exams">
          <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Đề thi</h3>
                <p className="text-sm text-muted-foreground">{stats.totalExams} đề thi</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/question-sets">
          <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-teal-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Bộ câu hỏi luyện tập</h3>
                <p className="text-sm text-muted-foreground">Quản lý câu hỏi</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
