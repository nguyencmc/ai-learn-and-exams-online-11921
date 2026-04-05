import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, LogIn, GraduationCap, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { useClasses } from '../hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const CLASS_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-red-600',
  'from-cyan-500 to-blue-600',
];

function getClassColor(id: string) {
  const idx = id.charCodeAt(0) % CLASS_COLORS.length;
  return CLASS_COLORS[idx];
}

const ClassListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTeacher, isAdmin } = usePermissionsContext();
  const { data: classes, isLoading } = useClasses();

  if (!user) {
    navigate('/auth');
    return null;
  }

  const canCreate = isTeacher || isAdmin;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-6xl">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Lớp học của tôi</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              {classes?.length
                ? `Bạn đang tham gia ${classes.length} lớp học`
                : 'Quản lý và tham gia các lớp học của bạn'}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate('/classes/join')}>
              <LogIn className="mr-2 h-4 w-4" />
              Tham gia lớp
            </Button>
            {canCreate && (
              <Button size="sm" onClick={() => navigate('/classes/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo lớp mới
              </Button>
            )}
          </div>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border bg-card">
                <Skeleton className="h-32 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && (!classes || classes.length === 0) && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Chưa có lớp học nào</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-8">
              {canCreate
                ? 'Tạo lớp học đầu tiên của bạn hoặc tham gia lớp bằng mã lớp từ giáo viên.'
                : 'Tham gia lớp học bằng mã lớp do giáo viên cung cấp.'}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/classes/join')}>
                <LogIn className="mr-2 h-4 w-4" />
                Tham gia lớp
              </Button>
              {canCreate && (
                <Button onClick={() => navigate('/classes/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo lớp mới
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── Class grid ── */}
        {!isLoading && classes && classes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls) => {
              const gradient = getClassColor(cls.id);
              return (
                <Link key={cls.id} to={`/classes/${cls.id}`}>
                  <div className="group rounded-2xl overflow-hidden border bg-card hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
                    {/* Cover */}
                    <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
                      {cls.cover_image && (
                        <img
                          src={cls.cover_image}
                          alt={cls.title}
                          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="absolute top-3 right-3">
                        {cls.is_active ? (
                          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-300 mr-1.5 inline-block" />
                            Đang hoạt động
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-black/30 text-white border-0 text-xs">
                            Đã đóng
                          </Badge>
                        )}
                      </div>
                      <div className="absolute bottom-3 left-4">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-5">
                      <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors mb-1">
                        {cls.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                        {cls.description || 'Chưa có mô tả cho lớp học này.'}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>Mã: <code className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">{cls.class_code}</code></span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Create new card */}
            {canCreate && (
              <button
                onClick={() => navigate('/classes/new')}
                className="rounded-2xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 min-h-[200px] flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary group"
              >
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:border-solid transition-all">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Tạo lớp mới</span>
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClassListPage;
