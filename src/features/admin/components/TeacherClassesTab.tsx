import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Plus,
  Copy,
  ExternalLink,
  Users2,
  CheckCircle2,
  XCircle,
  ClipboardList,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import type { ClassWithStats } from '@/features/admin/types';

interface TeacherClassesTabProps {
  myClasses: ClassWithStats[];
  loading: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export function TeacherClassesTab({ myClasses, loading }: TeacherClassesTabProps) {
  const { toast } = useToast();

  const copyCode = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast({ title: 'Đã sao chép mã lớp!' });
  };

  const activeClasses = myClasses.filter((c) => c.is_active);
  const closedClasses = myClasses.filter((c) => !c.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Quản lý lớp học</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {myClasses.length} lớp · {activeClasses.length} đang hoạt động
          </p>
        </div>
        <Link to="/classes/create">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Tạo lớp mới
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : myClasses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <Users2 className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Chưa có lớp học nào</h3>
            <p className="text-muted-foreground mb-4 text-sm">Tạo lớp học để quản lý học sinh và bài tập</p>
            <Link to="/classes/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tạo lớp học đầu tiên
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeClasses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-muted-foreground">
                  Đang hoạt động ({activeClasses.length})
                </span>
              </div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeClasses.map((cls) => (
                  <ClassCard key={cls.id} cls={cls} onCopyCode={copyCode} />
                ))}
              </div>
            </div>
          )}

          {closedClasses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Đã đóng ({closedClasses.length})
                </span>
              </div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {closedClasses.map((cls) => (
                  <ClassCard key={cls.id} cls={cls} onCopyCode={copyCode} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {myClasses.length > 0 && (
        <div className="flex justify-center">
          <Link to="/classes">
            <Button variant="outline">
              Xem tất cả lớp học
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

interface ClassCardProps {
  cls: ClassWithStats;
  onCopyCode: (code: string, e: React.MouseEvent) => void;
}

function ClassCard({ cls, onCopyCode }: ClassCardProps) {
  return (
    <Card className="border-border/50 hover:border-indigo-500/50 hover:shadow-md transition-all duration-200 overflow-hidden group">
      <CardContent className="p-0">
        <div
          className="h-2 w-full"
          style={{
            background: cls.is_active
              ? 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'
              : 'linear-gradient(90deg, #9ca3af 0%, #6b7280 100%)',
          }}
        />
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-1 group-hover:text-indigo-500 transition-colors">
              {cls.title}
            </h3>
            <Badge
              variant={cls.is_active ? 'default' : 'secondary'}
              className={cls.is_active ? 'bg-green-500/10 text-green-600 border-green-500/20 flex-shrink-0' : 'flex-shrink-0'}
            >
              {cls.is_active ? 'Hoạt động' : 'Đã đóng'}
            </Badge>
          </div>

          {cls.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{cls.description}</p>
          )}

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {cls.member_count} học sinh
            </span>
            <span className="flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" />
              {cls.total_assignments} bài tập
            </span>
            {cls.pending_grading > 0 && (
              <span className="flex items-center gap-1 text-amber-500 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {cls.pending_grading} chờ chấm
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              className="flex items-center gap-1 text-xs font-mono bg-muted hover:bg-muted/80 px-2 py-1 rounded-md transition-colors"
              onClick={(e) => onCopyCode(cls.class_code, e)}
              title="Sao chép mã lớp"
            >
              <span>{cls.class_code}</span>
              <Copy className="w-3 h-3" />
            </button>
            <p className="text-xs text-muted-foreground/70">
              Tạo {formatDate(cls.created_at)}
            </p>
          </div>

          <Link to={`/classes/${cls.id}`} className="block">
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2 hover:bg-indigo-500/10 hover:text-indigo-500 hover:border-indigo-500/30 transition-colors"
            >
              Vào lớp
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
