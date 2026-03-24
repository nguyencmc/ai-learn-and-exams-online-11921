import { Activity, Users, FolderOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminTab } from '@/features/admin/types';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Monitoring', icon: Activity,    color: 'text-teal-400'  },
  { id: 'users',    label: 'Người dùng', icon: Users,       color: 'text-cyan-400'  },
  { id: 'content',  label: 'Nội dung',   icon: FolderOpen,  color: 'text-emerald-400' },
  { id: 'system',   label: 'Hệ thống',   icon: Settings,    color: 'text-slate-400' },
];

interface AdminMobileBottomNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export function AdminMobileBottomNav({ activeTab, onTabChange }: AdminMobileBottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/40 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]',
                isActive ? 'text-white' : 'text-muted-foreground hover:text-foreground'
              )}
              style={isActive ? {
                backgroundImage: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                boxShadow: '0 2px 12px rgba(13,148,136,0.35)',
              } : undefined}
            >
              <Icon className={cn(
                'w-5 h-5 transition-transform',
                isActive ? 'text-white scale-110' : item.color
              )} />
              <span className={cn(
                'text-[10px] font-medium truncate max-w-[56px]',
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
