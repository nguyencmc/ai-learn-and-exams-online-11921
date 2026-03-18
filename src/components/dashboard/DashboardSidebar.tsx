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
  Users
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
  { id: 'overview', label: 'Tổng quan', icon: BarChart3, color: 'text-primary' },
  { id: 'my-courses', label: 'Khóa học', icon: GraduationCap, color: 'text-blue-500' },
  { id: 'my-classes', label: 'Lớp học', icon: Users, color: 'text-indigo-500' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, color: 'text-cyan-500' },
  { id: 'history', label: 'Lịch sử', icon: Clock, color: 'text-purple-500' },
  { id: 'achievements', label: 'Thành tích', icon: Trophy, color: 'text-yellow-500' },
  { id: 'settings', label: 'Cài đặt', icon: Settings, color: 'text-gray-500' },
];

const quickLinks = [
  { label: 'Đề thi', href: '/exams', icon: Target, color: 'text-green-500' },
  { label: 'Podcast', href: '/podcasts', icon: Headphones, color: 'text-pink-500' },
  { label: 'Sách', href: '/books', icon: BookOpen, color: 'text-orange-500' },
];

interface DashboardSidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

export const DashboardSidebar = memo(function DashboardSidebar({ activeSection, onSectionChange }: DashboardSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Main Navigation */}
      <div className="bg-card rounded-xl border border-border/50 p-3 shadow-sm">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Menu
        </h3>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "" : item.color)} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Links */}
      <div className="bg-card rounded-xl border border-border/50 p-3 shadow-sm">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Truy cập nhanh
        </h3>
        <nav className="space-y-1">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
              >
                <Icon className={cn("w-4 h-4", link.color)} />
                <span>{link.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
});

DashboardSidebar.displayName = 'DashboardSidebar';
