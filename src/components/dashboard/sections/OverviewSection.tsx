import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Play,
  BookOpen,
  Headphones,
  Layers,
  Sun,
  Moon,
  Sunrise,
  ChevronRight,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeeklyProgress {
  day: string;
  attempts: number;
  correct: number;
}

interface ContinueLearningItem {
  id: string;
  type: 'course' | 'exam' | 'flashcard';
  title: string;
  progress: number;
  lastActivity: string;
  slug?: string;
  imageUrl?: string;
}

interface OverviewSectionProps {
  stats: {
    totalExamsTaken: number;
    totalQuestionsAnswered: number;
    totalCorrectAnswers: number;
    points: number;
    level: number;
  };
  weeklyProgress: WeeklyProgress[];
  levelProgress: number;
  pointsToNextLevel: number;
  accuracy: number;
}

// Get greeting based on time of day
function getGreeting(): { text: string; icon: React.ComponentType<{ className?: string }> } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: 'Chào buổi sáng', icon: Sunrise };
  } else if (hour >= 12 && hour < 18) {
    return { text: 'Chào buổi chiều', icon: Sun };
  } else {
    return { text: 'Chào buổi tối', icon: Moon };
  }
}

// Quick action items
const quickActions = [
  { 
    label: 'Luyện tập', 
    href: '/practice', 
    icon: Target, 
    color: 'bg-primary/10 text-primary hover:bg-primary/20',
    description: 'Làm bài ngay'
  },
  { 
    label: 'Flashcard', 
    href: '/flashcards/today', 
    icon: Layers, 
    color: 'bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20',
    description: 'Ôn thẻ nhớ'
  },
  { 
    label: 'Khóa học', 
    href: '/courses', 
    icon: BookOpen, 
    color: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
    description: 'Học tiếp'
  },
  { 
    label: 'Podcast', 
    href: '/podcasts', 
    icon: Headphones, 
    color: 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20',
    description: 'Nghe audio'
  },
];

export function OverviewSection({
  stats,
  weeklyProgress,
  levelProgress,
  pointsToNextLevel,
  accuracy,
}: OverviewSectionProps) {
  const { user } = useAuth();
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  
  const [continueLearning, setContinueLearning] = useState<ContinueLearningItem[]>([]);
  const [displayName, setDisplayName] = useState('bạn');

  useEffect(() => {
    if (user) {
      // Fetch profile for display name
      supabase
        .from('profiles')
        .select('full_name, username')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            const name = data.full_name?.split(' ').pop() || data.username || 'bạn';
            setDisplayName(name);
          }
        });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchContinueLearning();
    }
  }, [user]);

  const fetchContinueLearning = async () => {
    // Fetch recent course enrollments
    const { data: enrollments } = await supabase
      .from('user_course_enrollments')
      .select(`
        course_id,
        progress_percentage,
        updated_at,
        courses:course_id (
          id,
          title,
          slug,
          image_url
        )
      `)
      .eq('user_id', user?.id)
      .lt('progress_percentage', 100)
      .order('updated_at', { ascending: false })
      .limit(3);

    const items: ContinueLearningItem[] = [];
    
    if (enrollments) {
      enrollments.forEach((e: { course_id: string; progress_percentage: number; updated_at: string; courses: { id: string; title: string; slug: string; image_url: string } | null }) => {
        if (e.courses) {
          items.push({
            id: e.course_id,
            type: 'course',
            title: e.courses.title,
            progress: e.progress_percentage || 0,
            lastActivity: e.updated_at,
            slug: e.courses.slug,
            imageUrl: e.courses.image_url,
          });
        }
      });
    }

    setContinueLearning(items);
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6">
      {/* Greeting Card */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GreetingIcon className="w-4 h-4" />
                <span className="text-sm">{greeting.text}</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {displayName}! 👋
              </h2>
              <p className="text-sm text-muted-foreground">
                🚀 Hãy tiếp tục hành trình học tập của bạn!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-2xl font-bold">{weeklyProgress.filter(d => d.attempts > 0).length}</span>
                </div>
                <p className="text-xs text-muted-foreground">ngày streak</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link key={action.href} to={action.href}>
            <Card className={cn(
              "border-border/50 hover:border-primary/30 transition-all cursor-pointer group h-full",
              "hover:shadow-md hover:-translate-y-0.5"
            )}>
              <CardContent className="p-4 text-center">
                <div className={cn(
                  "w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center transition-colors",
                  action.color
                )}>
                  <action.icon className="w-6 h-6" />
                </div>
                <p className="font-medium text-sm group-hover:text-primary transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Continue Learning */}
      {continueLearning.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                Tiếp tục học
              </CardTitle>
              <Link to="/dashboard?section=my-courses">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  Xem tất cả
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {continueLearning.map((item) => (
              <Link 
                key={item.id} 
                to={item.type === 'course' ? `/courses/${item.slug}` : '#'}
                className="block"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={item.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.progress}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatLastActivity(item.lastActivity)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.points.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Điểm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{accuracy}%</p>
                <p className="text-xs text-muted-foreground">Độ chính xác</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.totalExamsTaken}</p>
                <p className="text-xs text-muted-foreground">Đề đã làm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.totalQuestionsAnswered}</p>
                <p className="text-xs text-muted-foreground">Tổng câu hỏi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5" />
            Hoạt động tuần này
          </CardTitle>
          <CardDescription>Thời gian học tập theo ngày (giờ)</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            // Calculate hours from attempts (mock: each attempt = ~15 mins)
            const hoursData = weeklyProgress.map(d => ({
              ...d,
              hours: d.attempts * 0.25 // Convert attempts to hours
            }));
            const maxHours = Math.max(...hoursData.map(d => d.hours), 2);
            // Round up to nearest 0.5
            const maxYAxis = Math.ceil(maxHours * 2) / 2;
            // Generate Y-axis labels (0, 0.5, 1, 1.5, ...)
            const yAxisSteps = Math.ceil(maxYAxis / 0.5) + 1;
            const yAxisLabels = Array.from({ length: Math.min(yAxisSteps, 9) }, (_, i) => {
              const step = maxYAxis / (Math.min(yAxisSteps, 9) - 1);
              return (maxYAxis - i * step).toFixed(1);
            });

            return (
              <div className="flex gap-3">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between h-40 py-1 pr-1 text-right min-w-[28px]">
                  {yAxisLabels.map((val, i) => (
                    <span key={i} className="text-[10px] text-muted-foreground leading-none">
                      {parseFloat(val) % 1 === 0 ? parseInt(val) : val}
                    </span>
                  ))}
                </div>
                
                {/* Chart area with grid */}
                <div className="flex-1 relative">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {yAxisLabels.map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-full border-t",
                          i === yAxisLabels.length - 1 ? "border-border" : "border-border/30 border-dashed"
                        )}
                      />
                    ))}
                  </div>

                  {/* Chart bars */}
                  <div className="relative flex items-end justify-between gap-2 h-40">
                    {hoursData.map((day, index) => {
                      const height = maxYAxis > 0 ? (day.hours / maxYAxis) * 100 : 0;
                      const isToday = index === new Date().getDay();
                      
                      return (
                        <div key={day.day} className="flex-1 flex flex-col items-center z-10">
                          <div className="w-full flex flex-col items-center justify-end h-40">
                            <div 
                              className={cn(
                                "w-full max-w-10 rounded-t-md transition-all relative group",
                                isToday ? 'bg-primary' : 'bg-primary/40',
                                day.hours > 0 && "hover:opacity-80 cursor-pointer"
                              )}
                              style={{ height: `${Math.max(height, 2)}%` }}
                            >
                              {/* Tooltip */}
                              {day.hours > 0 && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                  {day.hours.toFixed(1)}h
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* X-axis labels */}
          <div className="flex gap-3 mt-2">
            <div className="min-w-[28px]" /> {/* Spacer for Y-axis */}
            <div className="flex-1 flex justify-between">
              {weeklyProgress.map((day, index) => {
                const isToday = index === new Date().getDay();
                const hours = day.attempts * 0.25;
                return (
                  <div key={day.day} className="flex-1 text-center">
                    <span className={cn(
                      "text-xs block",
                      isToday ? 'font-bold text-primary' : 'text-muted-foreground'
                    )}>
                      {day.day}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {hours > 0 ? `${hours.toFixed(1)}h` : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
