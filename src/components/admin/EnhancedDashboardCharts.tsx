import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger('EnhancedDashboardCharts');
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

interface ExamPopularityData {
  name: string;
  attempts: number;
  avgScore: number;
}

interface RecentActivity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  user_id: string | null;
}

export function UserGrowthChart() {
  const [data, setData] = useState<UserGrowthData[]>([]);
  const [range, setRange] = useState<'7' | '14' | '30'>('7');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserGrowth();
  }, [range]);

  const fetchUserGrowth = async () => {
    setLoading(true);
    const days = parseInt(range);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      log.error('Error fetching user growth', error);
      setLoading(false);
      return;
    }

    // Get total user count before the period
    const { count: previousCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', startDate.toISOString());

    // Group by date
    const dailyMap = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, 0);
    }

    (profiles || []).forEach((p) => {
      const key = new Date(p.created_at).toISOString().split('T')[0];
      dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
    });

    let runningTotal = previousCount || 0;
    const chartData: UserGrowthData[] = [];
    dailyMap.forEach((count, date) => {
      runningTotal += count;
      chartData.push({
        date: new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        newUsers: count,
        totalUsers: runningTotal,
      });
    });

    setData(chartData);
    setLoading(false);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Tăng trưởng người dùng
          </CardTitle>
          <Select value={range} onValueChange={(v) => setRange(v as '7' | '14' | '30')}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ngày</SelectItem>
              <SelectItem value="14">14 ngày</SelectItem>
              <SelectItem value="30">30 ngày</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="newUsers"
                name="Người dùng mới"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorNewUsers)"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="totalUsers"
                name="Tổng cộng"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorTotal)"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function PopularExamsChart() {
  const [data, setData] = useState<ExamPopularityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularExams();
  }, []);

  const fetchPopularExams = async () => {
    setLoading(true);

    // Fetch exam attempts grouped by exam
    const { data: attempts, error } = await supabase
      .from('exam_attempts')
      .select('exam_id, score, exams(title)')
      .not('exam_id', 'is', null);

    if (error) {
      log.error('Error fetching popular exams', error);
      setLoading(false);
      return;
    }

    // Group by exam
    const examMap = new Map<string, { title: string; attempts: number; totalScore: number }>();
    (attempts || []).forEach((a: { exam_id: string; score: number | null; exams: { title: string } | null }) => {
      const id = a.exam_id;
      const title = a.exams?.title || 'Unknown';
      if (!examMap.has(id)) {
        examMap.set(id, { title, attempts: 0, totalScore: 0 });
      }
      const entry = examMap.get(id)!;
      entry.attempts += 1;
      entry.totalScore += (a.score || 0);
    });

    const chartData = Array.from(examMap.values())
      .map((e) => ({
        name: e.title.length > 20 ? e.title.substring(0, 20) + '...' : e.title,
        attempts: e.attempts,
        avgScore: e.attempts > 0 ? Math.round(e.totalScore / e.attempts) : 0,
      }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 8);

    setData(chartData);
    setLoading(false);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-500" />
          Đề thi phổ biến
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Chưa có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                dataKey="attempts"
                name="Lượt thi"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="avgScore"
                name="Điểm TB"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentActivitiesCard() {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      log.error('Error fetching activities', error);
    }
    setActivities(data || []);
    setLoading(false);
  };

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      'create': '➕ Tạo mới',
      'update': '✏️ Cập nhật',
      'delete': '🗑️ Xóa',
      'login': '🔑 Đăng nhập',
      'logout': '🚪 Đăng xuất',
      'role_change': '🛡️ Đổi quyền',
      'export': '📤 Xuất dữ liệu',
      'import': '📥 Nhập dữ liệu',
    };
    return map[action] || `📋 ${action}`;
  };

  const getEntityLabel = (type: string) => {
    const map: Record<string, string> = {
      'user': 'Người dùng',
      'exam': 'Đề thi',
      'course': 'Khóa học',
      'question': 'Câu hỏi',
      'flashcard': 'Flashcard',
      'role': 'Vai trò',
      'permission': 'Quyền',
    };
    return map[type] || type;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          📋 Hoạt động gần đây
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Chưa có hoạt động nào</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {activities.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                <div className="text-lg leading-none mt-0.5">
                  {getActionLabel(a.action).split(' ')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getActionLabel(a.action).split(' ').slice(1).join(' ')}{' '}
                    <span className="text-muted-foreground">{getEntityLabel(a.entity_type)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {timeAgo(a.created_at)}
                    {a.entity_id && (
                      <span className="ml-2 font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        {a.entity_id.substring(0, 8)}...
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
