import { Link } from 'react-router-dom';
import {
  ClipboardCheck, ArrowRight, Loader2, Clock, CheckCircle2,
  AlertCircle, ExternalLink, X, Trophy, Target, BookOpen
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  useClassExamAssignments,
  useRemoveClassExamAssignment,
} from '../hooks/useClassLibrary';
import { useClassAssignments } from '../hooks/useAssignments';
import { ClassAssignment } from '../types';

interface ExamsTabProps {
  classId: string;
  isManager: boolean;
}

function getDueStatus(dueAt: string | null) {
  if (!dueAt) return null;
  const date = new Date(dueAt);
  if (isPast(date)) return { label: 'Quá hạn', variant: 'destructive' as const, icon: <AlertCircle className="h-3 w-3" /> };
  if (isToday(date)) return { label: 'Hôm nay', variant: 'default' as const, icon: <Clock className="h-3 w-3" /> };
  if (isTomorrow(date)) return { label: 'Ngày mai', variant: 'secondary' as const, icon: <Clock className="h-3 w-3" /> };
  return {
    label: format(date, 'dd/MM/yyyy', { locale: vi }),
    variant: 'outline' as const,
    icon: <Clock className="h-3 w-3" />,
  };
}

const ExamsTab = ({ classId, isManager }: ExamsTabProps) => {
  const { data: libraryExams, isLoading: loadingLibrary } = useClassExamAssignments(classId);
  const { data: assignmentsList, isLoading: loadingAssignments } = useClassAssignments(classId);
  const removeExam = useRemoveClassExamAssignment();

  const isLoading = loadingLibrary || loadingAssignments;

  // Filter only exam-type formal assignments
  const formalExams = (assignmentsList ?? []).filter(a => a.type === 'exam');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải bài kiểm tra...</p>
      </div>
    );
  }

  const hasLibrary = (libraryExams?.length ?? 0) > 0;
  const hasFormal = formalExams.length > 0;

  if (!hasLibrary && !hasFormal) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-950 flex items-center justify-center mb-5">
          <ClipboardCheck className="h-10 w-10 text-red-400" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Chưa có bài kiểm tra nào</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {isManager
            ? 'Gán đề thi vào lớp từ Thư viện cá nhân, hoặc tạo bài tập kiểm tra từ tab Bài tập.'
            : 'Giáo viên chưa giao bài kiểm tra nào cho lớp này.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* ── Bài tập kiểm tra (có hạn nộp) ── */}
      {hasFormal && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-red-500" />
            <h3 className="font-semibold text-sm">Bài kiểm tra được giao</h3>
            <span className="text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded-full">
              {formalExams.length}
            </span>
          </div>
          <div className="space-y-3">
            {formalExams.map((assignment) => {
              const due = getDueStatus(assignment.due_at);
              const isSubmitted = assignment.my_submission && assignment.my_submission.status !== 'pending';
              const isGraded = assignment.my_submission?.status === 'graded';
              const score = assignment.my_submission?.score;

              return (
                <div
                  key={assignment.id}
                  className={`group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-all
                    ${isSubmitted ? 'bg-muted/40 border-muted' : 'bg-card hover:border-red-300 hover:shadow-sm'}`}
                >
                  {/* Left: icon + info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                      ${isSubmitted ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'}`}>
                      {isSubmitted
                        ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                        : <ClipboardCheck className="h-5 w-5 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${isSubmitted ? 'text-muted-foreground' : ''}`}>
                        {assignment.title}
                      </p>
                      {assignment.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{assignment.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <Badge variant="outline" className="text-[10px] border-red-200 text-red-600 bg-red-50 dark:bg-red-950 dark:border-red-800">
                          Thi thật
                        </Badge>
                        {due && (
                          <Badge variant={due.variant} className="text-[10px] flex items-center gap-1">
                            {due.icon}
                            {due.label}
                          </Badge>
                        )}
                        {isGraded && score !== null && (
                          <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                            <Trophy className="h-2.5 w-2.5" />
                            Điểm: {score}
                          </Badge>
                        )}
                        {isSubmitted && !isGraded && (
                          <Badge variant="secondary" className="text-[10px]">Đã nộp</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: action */}
                  {!isManager && (
                    <div className="shrink-0">
                      {isSubmitted ? (
                        <Link to={`/exam/${assignment.ref_id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            Xem lại
                            <ExternalLink className="ml-1.5 h-3 w-3" />
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/exam/${assignment.ref_id}?type=exam`}>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs">
                            Bắt đầu thi
                            <ArrowRight className="ml-1.5 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {hasFormal && hasLibrary && (
        <Separator />
      )}

      {/* ── Đề thi tham khảo (từ thư viện) ── */}
      {hasLibrary && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-orange-500" />
            <h3 className="font-semibold text-sm">Đề thi tham khảo</h3>
            <span className="text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 px-2 py-0.5 rounded-full">
              {libraryExams!.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {libraryExams!.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-orange-300 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">
                    {item.exam?.title ?? 'Đề thi'}
                  </p>
                  {item.exam?.subject && (
                    <Badge variant="outline" className="text-[10px] mt-1">{item.exam.subject}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link to={`/exam/${item.exam_id}`}>
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2.5">
                      Luyện tập
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                  {isManager && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeExam.mutate({ id: item.id, classId })}
                      disabled={removeExam.isPending}
                    >
                      {removeExam.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ExamsTab;
