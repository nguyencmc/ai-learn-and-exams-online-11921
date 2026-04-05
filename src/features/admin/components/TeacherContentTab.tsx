import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Headphones,
  Layers,
  ChevronRight,
  Users,
  FolderOpen,
  Library,
} from 'lucide-react';
import type { TeacherStats } from '@/features/admin/types';

interface TeacherContentTabProps {
  stats: TeacherStats;
}

export function TeacherContentTab({ stats }: TeacherContentTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Quản lý nội dung</h2>

      {/* Library shortcut */}
      <Link to="/teacher/library">
        <Card className="border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all cursor-pointer">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Library className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-400">Thư viện cá nhân</h3>
              <p className="text-sm text-muted-foreground">
                Quản lý bài giảng, tài liệu, đề thi, khoá học và thêm vào lớp học
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-indigo-400" />
          </CardContent>
        </Card>
      </Link>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/admin/flashcards">
          <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Flashcard</h3>
                <p className="text-sm text-muted-foreground">{stats.totalFlashcardSets} bộ thẻ</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/podcasts">
          <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Headphones className="w-6 h-6 text-pink-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Podcast</h3>
                <p className="text-sm text-muted-foreground">{stats.totalPodcasts} bài nghe</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/classes">
          <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Lớp học</h3>
                <p className="text-sm text-muted-foreground">{stats.totalClasses} lớp học</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/categories">
          <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-500/10 flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-gray-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Danh mục</h3>
                <p className="text-sm text-muted-foreground">Quản lý phân loại</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
