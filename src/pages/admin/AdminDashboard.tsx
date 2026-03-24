import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { Button } from '@/components/ui/button';
import { RealtimeNotifications } from '@/components/admin/RealtimeNotifications';
import { AdminMobileBottomNav } from '@/components/admin/AdminMobileBottomNav';
import {
  Users,
  Shield,
  Activity,
  Settings,
  FolderOpen,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { useAdminData } from '@/features/admin/hooks/useAdminData';
import { AdminOverviewTab } from '@/features/admin/components/AdminOverviewTab';
import { AdminUsersTab } from '@/features/admin/components/AdminUsersTab';
import { AdminContentTab } from '@/features/admin/components/AdminContentTab';
import { AdminSystemTab } from '@/features/admin/components/AdminSystemTab';
import type { AdminTab } from '@/features/admin/types';

const sidebarItems = [
  { id: 'overview' as const, label: 'Monitoring',  icon: Activity,    color: 'text-teal-400'    },
  { id: 'users'    as const, label: 'Người dùng',  icon: Users,       color: 'text-cyan-400'    },
  { id: 'content'  as const, label: 'Nội dung',    icon: FolderOpen,  color: 'text-emerald-400' },
  { id: 'system'   as const, label: 'Hệ thống',    icon: Settings,    color: 'text-slate-400'   },
];

const AdminDashboard = () => {
  const { isAdmin, loading: roleLoading } = usePermissionsContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const {
    stats,
    users,
    loading,
    refreshing,
    lastUpdated,
    fetchAllData,
    fetchUsers,
    handleRefresh,
    handleRoleChange,
  } = useAdminData();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/');
      toast({
        title: "Không có quyền truy cập",
        description: "Bạn cần quyền Admin để truy cập trang này",
        variant: "destructive",
      });
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin, fetchAllData]);

  // Loading skeleton
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar skeleton */}
            <div className="hidden lg:block lg:col-span-2">
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 rounded-xl bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 0.07}s` }} />
                ))}
              </div>
            </div>
            {/* Content skeleton */}
            <div className="lg:col-span-10 space-y-4">
              <div className="h-28 rounded-2xl bg-muted/40 animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 0.07}s` }} />
                ))}
              </div>
              <div className="h-64 rounded-xl bg-muted/40 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <AdminOverviewTab
            stats={stats}
            refreshing={refreshing}
            lastUpdated={lastUpdated}
            onRefresh={handleRefresh}
          />
        );
      case 'users':
        return (
          <AdminUsersTab
            users={users}
            loading={loading}
            onRoleChange={handleRoleChange}
            onRefreshUsers={fetchUsers}
          />
        );
      case 'content':
        return <AdminContentTab stats={stats} />;
      case 'system':
        return <AdminSystemTab />;
      default:
        return (
          <AdminOverviewTab
            stats={stats}
            refreshing={refreshing}
            lastUpdated={lastUpdated}
            onRefresh={handleRefresh}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 pb-28 lg:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6 animate-fade-slide-up">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md"
              style={{ backgroundImage: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <span className="db-shimmer-text" style={{
                  background: 'linear-gradient(90deg, #2dd4bf 0%, #0d9488 40%, #2dd4bf 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmer 3s linear infinite',
                }}>
                  Admin Dashboard
                </span>
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Monitoring &amp; Quản lý hệ thống</p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <RealtimeNotifications />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2 border-teal-500/20 text-teal-400 hover:bg-teal-500/10 hover:text-teal-300 transition-all"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-2">
            <nav className="space-y-0.5 sticky top-24 bg-card rounded-2xl border border-border/40 p-2 shadow-sm">
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 pt-2 pb-1.5">
                Navigation
              </p>
              {sidebarItems.map((item, i) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'animate-fade-slide-up w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
                      `stagger-${Math.min(i + 1, 6)}`,
                      isActive
                        ? 'text-white shadow-md db-nav-active-bar'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:translate-x-0.5'
                    )}
                    style={isActive ? {
                      backgroundImage: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                    } : undefined}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                      isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-accent'
                    )}>
                      <item.icon className={cn('w-4 h-4', isActive ? 'text-white' : item.color)} />
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

          {/* Main Content */}
          <div className="lg:col-span-10">
            {renderTabContent()}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminMobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default AdminDashboard;
