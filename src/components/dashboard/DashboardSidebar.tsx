import { memo } from 'react';
import { 
  Target, 
  Layers, 
  GraduationCap, 
  Headphones, 
  Trophy, 
  Clock,
  Settings,
  BarChart3,
  BookOpen,
  Users,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DashboardSection = 
  | 'overview' 
  | 'my-courses' 
  | 'my-classes'
  | 'flashcards' 
  | 'history' 
  | 'achievements' 
  | 'settings';

interface NavItem {
  id: DashboardSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const navItems: NavItem[] = [
  { id: 'overview',      label: 'Tổng quan',  icon: BarChart3,     color: 'text-indigo-400'  },
  { id: 'my-courses',   label: 'Khóa học',   icon: GraduationCap, color: 'text-blue-400'    },
  { id: 'my-classes',   label: 'Lớp học',    icon: Users,          color: 'text-cyan-400'    },
  { id: 'flashcards',   label: 'Flashcards', icon: Layers,         color: 'text-violet-400'  },
  { id: 'history',      label: 'Lịch sử',   icon: Clock,          color: 'text-purple-400'  },
  { id: 'achievements', label: 'Thành tích', icon: Trophy,         color: 'text-amber-400'   },
  { id: 'settings',     label: 'Cài đặt',   icon: Settings,       color: 'text-slate-400'   },
];

const quickLinks = [
  { label: 'Đề thi',  href: '/exams',    icon: Target,     color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Podcast', href: '/podcasts', icon: Headphones, color: 'text-pink-400',    bg: 'bg-pink-500/10'    },
  { label: 'Sách',    href: '/books',    icon: BookOpen,   color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
];

interface DashboardSidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

export const DashboardSidebar = memo(function DashboardSidebar({ activeSection, onSectionChange }: DashboardSidebarProps) {
  return (
    <aside className="space-y-4">
      {/* Main Navigation */}
      <div className="bg-card rounded-2xl border border-border/40 p-2 shadow-sm overflow-hidden">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 pt-2 pb-1.5">
          Menu
        </p>
        <nav className="space-y-0.5">
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'animate-fade-slide-up w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
                  `stagger-${Math.min(i + 1, 6)}`,
                  isActive
                    ? 'text-white shadow-md db-nav-active-bar'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:translate-x-0.5'
                )}
                style={isActive ? {
                  backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                } : undefined}
              >
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                  isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-accent'
                )}>
                  <Icon className={cn('w-4 h-4', isActive ? 'text-white' : item.color)} />
                </div>
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Links */}
      <div className="bg-card rounded-2xl border border-border/40 p-2 shadow-sm">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 pt-2 pb-1.5">
          Truy cập nhanh
        </p>
        <nav className="space-y-0.5">
          {quickLinks.map((link, i) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'animate-fade-slide-up flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 group',
                  `stagger-${Math.min(i + 1, 6)}`
                )}
              >
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', link.bg)}>
                  <Icon className={cn('w-4 h-4', link.color)} />
                </div>
                <span className="flex-1 truncate">{link.label}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
});

DashboardSidebar.displayName = 'DashboardSidebar';
