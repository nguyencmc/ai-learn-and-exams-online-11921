import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  UserX,
  GraduationCap,
  Users2,
  Clock,
} from 'lucide-react';
import type { StudentSummary, ClassWithStats, CourseWithStats } from '@/features/admin/types';

interface TeacherStudentsTabProps {
  myStudents: StudentSummary[];
  myClasses: ClassWithStats[];
  myCourses: CourseWithStats[];
  loading: boolean;
}

function getInitials(name: string | null, email: string | null): string {
  if (name) return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
}

function getAvatarColor(id: string): string {
  const colors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500',
    'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-blue-500',
  ];
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function formatLastActivity(dateString: string | null): string {
  if (!dateString) return 'Chưa hoạt động';
  const date = new Date(dateString);
  const diffDays = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  return date.toLocaleDateString('vi-VN');
}

function isInactive(dateString: string | null): boolean {
  if (!dateString) return true;
  return Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)) > 7;
}

export function TeacherStudentsTab({ myStudents, myClasses, myCourses, loading }: TeacherStudentsTabProps) {
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');

  const filterOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [{ value: 'all', label: 'Tất cả' }];
    myClasses.forEach((c) => options.push({ value: `class:${c.id}`, label: `Lớp: ${c.title}` }));
    myCourses.forEach((c) => options.push({ value: `course:${c.id}`, label: `KH: ${c.title}` }));
    return options;
  }, [myClasses, myCourses]);

  const filteredStudents = useMemo(() => {
    let list = myStudents;

    if (filterSource !== 'all') {
      const [type, id] = filterSource.split(':');
      list = list.filter((s) =>
        s.sources.some((src) => src.type === type && src.id === id)
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          (s.full_name?.toLowerCase() ?? '').includes(q) ||
          (s.username?.toLowerCase() ?? '').includes(q) ||
          (s.email?.toLowerCase() ?? '').includes(q)
      );
    }

    return list;
  }, [myStudents, filterSource, search]);

  const inactiveCount = myStudents.filter((s) => isInactive(s.last_activity)).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Quản lý học sinh</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {myStudents.length} học sinh ·{' '}
          {inactiveCount > 0 && (
            <span className="text-amber-500">{inactiveCount} không hoạt động 7 ngày</span>
          )}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[160px]"
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <UserX className="w-14 h-14 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-base font-semibold mb-1">
              {myStudents.length === 0 ? 'Chưa có học sinh nào' : 'Không tìm thấy kết quả'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {myStudents.length === 0
                ? 'Học sinh sẽ xuất hiện khi tham gia lớp học hoặc đăng ký khóa học của bạn'
                : 'Thử thay đổi từ khóa hoặc bộ lọc'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {filteredStudents.map((student) => {
                const inactive = isInactive(student.last_activity);
                const displayName =
                  student.full_name || student.username || student.email || 'Học sinh';

                const courseSource = student.sources.find((s) => s.type === 'course');

                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold ${getAvatarColor(student.id)}`}
                    >
                      {student.avatar_url ? (
                        <img
                          src={student.avatar_url}
                          alt={displayName}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        getInitials(student.full_name, student.email)
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{displayName}</span>
                        {student.email && (
                          <span className="text-xs text-muted-foreground hidden sm:inline truncate">
                            {student.email}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {student.sources.map((src, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-[10px] h-4 px-1.5 gap-1 font-normal"
                          >
                            {src.type === 'class' ? (
                              <Users2 className="w-2.5 h-2.5" />
                            ) : (
                              <GraduationCap className="w-2.5 h-2.5" />
                            )}
                            <span className="truncate max-w-[100px]">{src.name}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {courseSource && (
                      <div className="hidden sm:flex flex-col gap-1 w-24 flex-shrink-0">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Tiến độ</span>
                          <span>{courseSource.progress}%</span>
                        </div>
                        <Progress value={courseSource.progress} className="h-1.5" />
                      </div>
                    )}

                    <div
                      className={`flex items-center gap-1 text-xs flex-shrink-0 ${inactive ? 'text-amber-500' : 'text-muted-foreground'}`}
                    >
                      <Clock className="w-3 h-3" />
                      <span className="hidden sm:inline">
                        {formatLastActivity(student.last_activity)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredStudents.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Hiển thị {filteredStudents.length} / {myStudents.length} học sinh
        </p>
      )}
    </div>
  );
}
