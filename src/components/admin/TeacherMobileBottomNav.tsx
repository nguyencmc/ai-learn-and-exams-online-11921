import { BarChart3, GraduationCap, FileText, FolderOpen, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardTab } from '@/features/admin/types';

interface NavItem {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const navItems: NavItem[] = [
  { id: 'overview',   label: 'Tổng quan', icon: BarChart3,      color: 'text-indigo-400' },
  { id: 'courses',    label: 'Khóa học',  icon: GraduationCap,  color: 'text-cyan-400'   },
  { id: 'exams',      label: 'Đề thi',    icon: FileText,       color: 'text-violet-400' },
  { id: 'content',    label: 'Nội dung',  icon: FolderOpen,     color: 'text-amber-400'  },
  { id: 'analytics',  label: 'Phân tích', icon: TrendingUp,     color: 'text-emerald-400'},
];

interface TeacherMobileBottomNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function TeacherMobileBottomNav({ activeTab, onTabChange }: TeacherMobileBottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/40 safe-area-pb">
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 min-w-[52px]',
                isActive ? 'text-white' : 'text-muted-foreground hover:text-foreground'
              )}
              style={isActive ? {
                backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
              } : undefined}
            >
              <Icon className={cn(
                'w-5 h-5 transition-transform',
                isActive ? 'text-white scale-110' : item.color
              )} />
              <span className={cn(
                'text-[9px] font-medium truncate max-w-[50px]',
                isActive ? 'text-white font-semibold' : ''
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
