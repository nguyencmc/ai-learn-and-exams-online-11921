import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { DatabaseBackup } from '@/components/admin/DatabaseBackup';
import { UserGrowthChart, PopularExamsChart, RecentActivitiesCard } from '@/components/admin/EnhancedDashboardCharts';
import { UserBulkActions, UserSelectCheckbox } from '@/components/admin/UserBulkActions';
import { RealtimeNotifications } from '@/components/admin/RealtimeNotifications';
import { SystemHealthCheck } from '@/components/admin/SystemHealthCheck';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  BookOpen, 
  Headphones, 
  Layers,
  Shield,
  TrendingUp,
  Activity,
  ChevronRight,
  Download,
  HelpCircle,
  GraduationCap,
  Search,
  BarChart3,
  Settings,
  FolderOpen,
  Eye,
  Clock,
  UserCheck,
  ArrowUpRight,
  Database,
  Server,
  RefreshCw,
  PieChart,
  LineChart as LineChartIcon,
  Newspaper
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

const log = logger('AdminDashboard');

interface Stats {
  totalUsers: number;
  totalExams: number;
  totalQuestions: number;
  totalFlashcardSets: number;
  totalPodcasts: number;
  totalBooks: number;
  totalAttempts: number;
  totalCourses: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsersThisWeek: number;
  totalEnrollments: number;
  completedCourses: number;
}

interface DailyStats {
  date: string;
  users: number;
  attempts: number;
  enrollments: number;
}

interface ContentDistribution {
  name: string;
  value: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  created_at: string;
  roles: string[];
  last_activity?: string;
}

type AdminTab = 'overview' | 'users' | 'content' | 'system';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isAdmin, hasPermission, loading: roleLoading } = usePermissionsContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalExams: 0,
    totalQuestions: 0,
    totalFlashcardSets: 0,
    totalPodcasts: 0,
    totalBooks: 0,
    totalAttempts: 0,
    totalCourses: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    activeUsersThisWeek: 0,
    totalEnrollments: 0,
    completedCourses: 0,
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const canViewAnalytics = hasPermission('analytics.view');
  const canManageUsers = hasPermission('users.view');
  const canManageRoles = hasPermission('roles.assign');

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
  }, [isAdmin]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchDailyStats(),
      fetchUsers(),
    ]);
    setLastUpdated(new Date());
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast({
      title: "Đã cập nhật",
      description: "Dữ liệu đã được làm mới",
    });
  };

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      { count: usersCount },
      { count: examsCount },
      { count: questionsCount },
      { count: flashcardsCount },
      { count: podcastsCount },
      { count: booksCount },
      { count: attemptsCount },
      { count: coursesCount },
      { count: newUsersToday },
      { count: newUsersThisWeek },
      { count: newUsersThisMonth },
      { count: enrollmentsCount },
      { count: completedCoursesCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('exams').select('*', { count: 'exact', head: true }),
      supabase.from('questions').select('*', { count: 'exact', head: true }),
      supabase.from('flashcard_sets').select('*', { count: 'exact', head: true }),
      supabase.from('podcasts').select('*', { count: 'exact', head: true }),
      supabase.from('books').select('*', { count: 'exact', head: true }),
      supabase.from('exam_attempts').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
      supabase.from('user_course_enrollments').select('*', { count: 'exact', head: true }),
      supabase.from('user_course_enrollments').select('*', { count: 'exact', head: true }).not('completed_at', 'is', null),
    ]);

    setStats({
      totalUsers: usersCount || 0,
      totalExams: examsCount || 0,
      totalQuestions: questionsCount || 0,
      totalFlashcardSets: flashcardsCount || 0,
      totalPodcasts: podcastsCount || 0,
      totalBooks: booksCount || 0,
      totalAttempts: attemptsCount || 0,
      totalCourses: coursesCount || 0,
      newUsersToday: newUsersToday || 0,
      newUsersThisWeek: newUsersThisWeek || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      activeUsersThisWeek: 0,
      totalEnrollments: enrollmentsCount || 0,
      completedCourses: completedCoursesCount || 0,
    });
  };

  const fetchDailyStats = async () => {
    // Generate mock daily stats for the last 7 days
    // In production, this should come from analytics tables
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' }),
        users: Math.floor(Math.random() * 20) + 5,
        attempts: Math.floor(Math.random() * 50) + 10,
        enrollments: Math.floor(Math.random() * 15) + 2,
      });
    }
    setDailyStats(days);
  };

  const fetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (profilesError) {
      log.error('Error fetching profiles', profilesError);
      return;
    }

    const { data: allRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      log.error('Error fetching roles', rolesError);
    }

    const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
      id: profile.id,
      user_id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      username: profile.username,
      created_at: profile.created_at,
      roles: (allRoles || [])
        .filter(r => r.user_id === profile.user_id)
        .map(r => r.role),
    }));

    setUsers(usersWithRoles);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = searchQuery === '' || 
        (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.username?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRole = roleFilter === 'all' || 
        (roleFilter === 'none' && u.roles.length === 0) ||
        u.roles.includes(roleFilter);
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (newRole === 'none') {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật quyền",
          variant: "destructive",
        });
        return;
      }
    } else {
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        log.error('Error deleting old roles', deleteError);
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole as 'admin' | 'moderator' | 'teacher' | 'user' });

      if (error) {
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật quyền",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Thành công",
      description: "Đã cập nhật quyền người dùng",
    });
    
    fetchUsers();
  };

  // Export functionality moved to DatabaseBackup component

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const sidebarItems = [
    { id: 'overview' as const, label: 'Monitoring', icon: Activity, color: 'text-primary' },
    { id: 'users' as const, label: 'Người dùng', icon: Users, color: 'text-blue-500' },
    { id: 'content' as const, label: 'Nội dung', icon: FolderOpen, color: 'text-orange-500' },
    { id: 'system' as const, label: 'Hệ thống', icon: Settings, color: 'text-gray-500' },
  ];

  // Content distribution for pie chart visualization
  const contentDistribution: ContentDistribution[] = [
    { name: 'Khóa học', value: stats.totalCourses, color: 'bg-cyan-500', icon: GraduationCap },
    { name: 'Đề thi', value: stats.totalExams, color: 'bg-purple-500', icon: FileText },
    { name: 'Câu hỏi', value: stats.totalQuestions, color: 'bg-teal-500', icon: HelpCircle },
    { name: 'Flashcard', value: stats.totalFlashcardSets, color: 'bg-orange-500', icon: Layers },
    { name: 'Podcast', value: stats.totalPodcasts, color: 'bg-pink-500', icon: Headphones },
    { name: 'Sách', value: stats.totalBooks, color: 'bg-amber-500', icon: BookOpen },
  ];

  const totalContent = contentDistribution.reduce((acc, item) => acc + item.value, 0);

  const contentLinks = [
    { title: 'Khóa học', count: stats.totalCourses, icon: GraduationCap, href: '/admin/courses', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { title: 'Đề thi', count: stats.totalExams, icon: FileText, href: '/admin/exams', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Bộ câu hỏi', count: stats.totalQuestions, icon: HelpCircle, href: '/admin/question-sets', color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { title: 'Flashcard', count: stats.totalFlashcardSets, icon: Layers, href: '/admin/flashcards', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Podcast', count: stats.totalPodcasts, icon: Headphones, href: '/admin/podcasts', color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { title: 'Sách', count: stats.totalBooks, icon: BookOpen, href: '/admin/books', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const systemLinks = [
    { title: 'Quản lý người dùng', desc: 'Xem và quản lý tất cả users', icon: Users, href: '/admin/users', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Duyệt bài viết', desc: 'Xem xét và phê duyệt bài viết', icon: Newspaper, href: '/admin/articles', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Phân quyền RBAC', desc: 'Cấu hình vai trò và quyền', icon: Shield, href: '/admin/permissions', color: 'text-red-500', bg: 'bg-red-500/10' },
    { title: 'Audit Logs', desc: 'Theo dõi hoạt động hệ thống', icon: Activity, href: '/admin/audit-logs', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Quản lý danh mục', desc: 'Phân loại nội dung', icon: FolderOpen, href: '/admin/categories', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Lớp học', desc: 'Quản lý lớp học trực tuyến', icon: GraduationCap, href: '/classes', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'teacher': return 'secondary';
      case 'moderator': return 'outline';
      default: return 'outline';
    }
  };

  // Calculate growth rates (mock for now)
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  };

  const userGrowthRate = stats.newUsersThisWeek > 0 ? Math.round((stats.newUsersThisWeek / stats.totalUsers) * 100) : 0;
  const completionRate = stats.totalEnrollments > 0 ? Math.round((stats.completedCourses / stats.totalEnrollments) * 100) : 0;

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            System Monitoring
          </h2>
          <p className="text-sm text-muted-foreground">
            Cập nhật lúc: {lastUpdated.toLocaleTimeString('vi-VN')}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardContent className="p-4 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng người dùng</p>
                <p className="text-3xl font-bold mt-1">{stats.totalUsers.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-medium">+{stats.newUsersToday}</span>
                  <span className="text-muted-foreground">hôm nay</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Enrollments */}
        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
          <CardContent className="p-4 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đăng ký khóa học</p>
                <p className="text-3xl font-bold mt-1">{stats.totalEnrollments.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="text-muted-foreground">{completionRate}% hoàn thành</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Exam Attempts */}
        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
          <CardContent className="p-4 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lượt làm bài</p>
                <p className="text-3xl font-bold mt-1">{stats.totalAttempts.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-yellow-500" />
                  <span className="text-muted-foreground">Đang hoạt động</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Content */}
        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
          <CardContent className="p-4 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng nội dung</p>
                <p className="text-3xl font-bold mt-1">{totalContent.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <Database className="w-4 h-4 text-green-500" />
                  <span className="text-muted-foreground">Đa dạng</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Enhanced with real recharts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <UserGrowthChart />
        <PopularExamsChart />
      </div>

      {/* Content Distribution */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            Phân bố nội dung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {contentDistribution.map((item) => {
              const percentage = totalContent > 0 ? (item.value / totalContent) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.color + '/10')}>
                    <item.icon className={cn("w-4 h-4", item.color.replace('bg-', 'text-'))} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all", item.color)}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* User Growth Stats */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Tăng trưởng người dùng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <p className="text-3xl font-bold text-green-600">+{stats.newUsersToday}</p>
              <p className="text-sm text-muted-foreground mt-1">Hôm nay</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <p className="text-3xl font-bold text-blue-600">+{stats.newUsersThisWeek}</p>
              <p className="text-sm text-muted-foreground mt-1">Tuần này</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <p className="text-3xl font-bold text-purple-600">+{stats.newUsersThisMonth}</p>
              <p className="text-sm text-muted-foreground mt-1">Tháng này</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <GraduationCap className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
            <p className="text-lg font-bold">{stats.totalCourses}</p>
            <p className="text-xs text-muted-foreground">Khóa học</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <FileText className="w-5 h-5 mx-auto mb-1 text-purple-500" />
            <p className="text-lg font-bold">{stats.totalExams}</p>
            <p className="text-xs text-muted-foreground">Đề thi</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <HelpCircle className="w-5 h-5 mx-auto mb-1 text-teal-500" />
            <p className="text-lg font-bold">{stats.totalQuestions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Câu hỏi</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <Layers className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <p className="text-lg font-bold">{stats.totalFlashcardSets}</p>
            <p className="text-xs text-muted-foreground">Flashcard</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <Headphones className="w-5 h-5 mx-auto mb-1 text-pink-500" />
            <p className="text-lg font-bold">{stats.totalPodcasts}</p>
            <p className="text-xs text-muted-foreground">Podcast</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <BookOpen className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold">{stats.totalBooks}</p>
            <p className="text-xs text-muted-foreground">Sách</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities + System Health */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RecentActivitiesCard />
        <SystemHealthCheck />
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, email, username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Lọc vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="none">User thường</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Link to="/admin/users">
              <Button variant="outline" className="w-full md:w-auto gap-2">
                <Eye className="w-4 h-4" />
                Quản lý chi tiết
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      <UserBulkActions
        users={filteredUsers}
        selectedUsers={selectedUsers}
        onSelectionChange={setSelectedUsers}
        onRefresh={fetchUsers}
      />

      {/* Users Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {filteredUsers.length} người dùng {roleFilter !== 'all' && `(${roleFilter})`}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="md:hidden divide-y divide-border">
                {filteredUsers.slice(0, 20).map((u) => (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <UserSelectCheckbox
                          userId={u.user_id}
                          checked={selectedUsers.has(u.user_id)}
                          onToggle={(id) => {
                            const s = new Set(selectedUsers);
                            if (s.has(id)) { s.delete(id); } else { s.add(id); }
                            setSelectedUsers(s);
                          }}
                        />
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium">
                            {(u.full_name?.[0] || u.email?.[0] || '?').toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.full_name || 'Chưa đặt tên'}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {u.roles.length === 0 ? (
                          <Badge variant="outline" className="text-xs">User</Badge>
                        ) : (
                          u.roles.map(role => (
                            <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-xs">{role}</Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{formatDate(u.created_at)}</span>
                      <Select 
                        value={u.roles[0] || 'none'} 
                        onValueChange={(value) => handleRoleChange(u.user_id, value)}
                        disabled={u.user_id === user?.id}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">User</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.slice(0, 20).map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <UserSelectCheckbox
                            userId={u.user_id}
                            checked={selectedUsers.has(u.user_id)}
                            onToggle={(id) => {
                              const s = new Set(selectedUsers);
                              if (s.has(id)) { s.delete(id); } else { s.add(id); }
                              setSelectedUsers(s);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {(u.full_name?.[0] || u.email?.[0] || '?').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{u.full_name || 'Chưa đặt tên'}</p>
                              {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(u.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {u.roles.length === 0 ? (
                              <Badge variant="outline">User</Badge>
                            ) : (
                              u.roles.map(role => (
                                <Badge key={role} variant={getRoleBadgeVariant(role)}>{role}</Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Select 
                            value={u.roles[0] || 'none'} 
                            onValueChange={(value) => handleRoleChange(u.user_id, value)}
                            disabled={u.user_id === user?.id}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">User</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Quản lý nội dung</h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contentLinks.map((item) => (
          <Link key={item.href} to={item.href}>
            <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.count.toLocaleString()} mục</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Quản lý hệ thống</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {systemLinks.map((item) => (
          <Link key={item.href} to={item.href}>
            <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* System Health Check - Full */}
      <SystemHealthCheck />

      {/* Database Backup */}
      <DatabaseBackup />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'users': return renderUsersTab();
      case 'content': return renderContentTab();
      case 'system': return renderSystemTab();
      default: return renderOverviewTab();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Monitoring & Quản lý hệ thống</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RealtimeNotifications />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block lg:col-span-2">
            <nav className="space-y-1 sticky top-24">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", activeTab === item.id ? item.color : "")} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile Tabs */}
          <div className="lg:hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)}>
              <TabsList className="grid w-full grid-cols-4">
                {sidebarItems.map((item) => (
                  <TabsTrigger key={item.id} value={item.id} className="text-xs px-2">
                    <item.icon className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-10">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
