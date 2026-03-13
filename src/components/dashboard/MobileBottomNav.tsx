import { 
  BarChart3, 
  GraduationCap, 
  Layers, 
  Trophy, 
  Settings,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardSection } from './DashboardSidebar';

interface NavItem {
  id: DashboardSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
  { id: 'my-courses', label: 'Khóa học', icon: GraduationCap },
  { id: 'my-classes', label: 'Lớp học', icon: Users },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'achievements', label: 'Thành tích', icon: Trophy },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
];

interface MobileBottomNavProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

export function MobileBottomNav({ activeSection, onSectionChange }: MobileBottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[56px]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] font-medium truncate max-w-[56px]",
                isActive && "font-semibold"
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
