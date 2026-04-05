import { Link } from 'react-router-dom';
import { BarChart3, GraduationCap, FileText, FolderOpen, TrendingUp, Users2, UserCheck, Library } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardTab } from '@/features/admin/types';

interface NavItem {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href?: string;
}

const navItems: NavItem[] = [
  { id: 'overview',   label: 'Tổng quan',  icon: BarChart3,     color: 'text-indigo-400'  },
  { id: 'classes',    label: 'Lớp học',    icon: Users2,        color: 'text-blue-400'    },
  { id: 'students',   label: 'Học sinh',   icon: UserCheck,     color: 'text-teal-400'    },
  { id: 'courses',    label: 'Khóa học',   icon: GraduationCap, color: 'text-cyan-400'    },
  { id: 'exams',      label: 'Đề thi',     icon: FileText,      color: 'text-violet-400'  },
  { id: 'content',    label: 'Nội dung',   icon: FolderOpen,    color: 'text-amber-400'   },
  { id: 'analytics',  label: 'Phân tích',  icon: TrendingUp,    color: 'text-emerald-400' },
  { id: 'library',    label: 'Thư viện',   icon: Library,       color: 'text-purple-400', href: '/teacher/library' },
];

interface TeacherMobileBottomNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function TeacherMobileBottomNav({ activeTab, onTabChange }: TeacherMobileBottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/40 safe-area-pb">
      <div className="flex items-center justify-around px-1 py-2 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const cls = cn(
            'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 min-w-[44px] flex-shrink-0',
            isActive ? 'text-white' : 'text-muted-foreground hover:text-foreground'
          );
          const st = isActive ? {
            backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
          } : undefined;
          const inner = (
            <>
              <Icon className={cn('w-4 h-4 transition-transform', isActive ? 'text-white scale-110' : item.color)} />
              <span className={cn('text-[9px] font-medium truncate max-w-[44px]', isActive ? 'text-white font-semibold' : '')}>
                {item.label}
              </span>
            </>
          );

          return item.href ? (
            <Link key={item.id} to={item.href} className={cls} style={st}>
              {inner}
            </Link>
          ) : (
            <button key={item.id} onClick={() => onTabChange(item.id)} className={cls} style={st}>
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
