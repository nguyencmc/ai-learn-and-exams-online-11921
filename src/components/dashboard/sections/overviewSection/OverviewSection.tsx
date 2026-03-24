import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Sun,
  Moon,
  Sunrise,
  Flame,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOverviewData } from './useOverviewData';
import { StatCard } from './StatCard';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import type { OverviewSectionProps, WeeklyProgress } from './types';

function getGreeting(): { text: string; icon: React.ComponentType<{ className?: string }> } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Chào buổi sáng', icon: Sunrise };
  if (hour >= 12 && hour < 18) return { text: 'Chào buổi chiều', icon: Sun };
  return { text: 'Chào buổi tối', icon: Moon };
}

function WeeklyChart({ weeklyProgress }: { weeklyProgress: WeeklyProgress[] }) {
  const hoursData = weeklyProgress.map(d => ({ ...d, hours: d.attempts * 0.25 }));
  const maxHours = Math.max(...hoursData.map(d => d.hours), 2);
  const maxYAxis = Math.ceil(maxHours * 2) / 2;
  const yAxisSteps = Math.ceil(maxYAxis / 0.5) + 1;
  const yAxisLabels = Array.from({ length: Math.min(yAxisSteps, 9) }, (_, i) => {
    const step = maxYAxis / (Math.min(yAxisSteps, 9) - 1);
    return (maxYAxis - i * step).toFixed(1);
  });

  return (
    <Card className="border-border/40 animate-fade-slide-up stagger-5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          Hoạt động tuần này
        </CardTitle>
        <CardDescription className="text-xs">Thời gian học tập theo ngày (giờ)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <div className="flex flex-col justify-between h-40 py-1 pr-1 text-right min-w-[28px]">
            {yAxisLabels.map((val, i) => (
              <span key={i} className="text-[10px] text-muted-foreground/60 leading-none">
                {parseFloat(val) % 1 === 0 ? parseInt(val) : val}
              </span>
            ))}
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {yAxisLabels.map((_, i) => (
                <div key={i} className={cn('w-full border-t', i === yAxisLabels.length - 1 ? 'border-border/40' : 'border-border/20 border-dashed')} />
              ))}
            </div>
            <div className="relative flex items-end justify-between gap-2 h-40">
              {hoursData.map((day, index) => {
                const height = maxYAxis > 0 ? (day.hours / maxYAxis) * 100 : 0;
                const isToday = index === new Date().getDay();
                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center z-10">
                    <div className="w-full flex flex-col items-center justify-end h-40">
                      <div
                        className={cn(
                          'w-full max-w-10 rounded-t-lg transition-all relative group',
                          day.hours > 0 && 'hover:opacity-90 cursor-pointer'
                        )}
                        style={{
                          height: `${Math.max(height, 2)}%`,
                          background: isToday
                            ? 'linear-gradient(180deg, #818cf8 0%, #6366f1 100%)'
                            : 'linear-gradient(180deg, #6366f133 0%, #6366f122 100%)',
                          boxShadow: isToday && day.hours > 0 ? '0 0 10px rgba(99,102,241,0.3)' : 'none',
                        }}
                      >
                        {day.hours > 0 && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border border-border/40 text-popover-foreground text-xs px-2 py-1 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
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
        <div className="flex gap-3 mt-3">
          <div className="min-w-[28px]" />
          <div className="flex-1 flex justify-between">
            {weeklyProgress.map((day, index) => {
              const isToday = index === new Date().getDay();
              const hours = day.attempts * 0.25;
              return (
                <div key={day.day} className="flex-1 text-center">
                  <span className={cn(
                    'text-xs block font-medium',
                    isToday ? 'text-indigo-400' : 'text-muted-foreground/60'
                  )}>{day.day}</span>
                  {hours > 0 && (
                    <span className="text-[9px] text-muted-foreground/50">{hours.toFixed(1)}h</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewSection({
  stats,
  weeklyProgress,
  levelProgress: _levelProgress,
  pointsToNextLevel: _pointsToNextLevel,
  accuracy,
}: OverviewSectionProps) {
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const { continueLearning, displayName } = useOverviewData();
  const streakDays = weeklyProgress.filter(d => d.attempts > 0).length;

  return (
    <div className="space-y-5">
      {/* Greeting Card */}
      <div
        className="relative rounded-2xl overflow-hidden animate-fade-slide-up stagger-1"
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #9333ea 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute top-3 right-16 w-6 h-6 rounded-full bg-white/10" />

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/70">
                <GreetingIcon className="w-4 h-4" />
                <span className="text-sm">{greeting.text}</span>
              </div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {displayName}! 
                <span className="animate-[wave_1.5s_ease-in-out_infinite]">👋</span>
              </h2>
              <p className="text-sm text-white/60 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                Hãy tiếp tục hành trình học tập của bạn!
              </p>
            </div>
            {streakDays > 0 && (
              <div className="flex-shrink-0 text-right">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Flame className="w-5 h-5 text-orange-300" style={{ animation: 'flamePulse 1.5s ease-in-out infinite' }} />
                    <span className="text-2xl font-bold text-white">{streakDays}</span>
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">ngày streak</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <QuickActions />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Trophy}
          value={stats.points.toLocaleString()}
          label="Điểm XP"
          gradientFrom="from-indigo-500/8"
          iconColor="text-indigo-400"
          bgColor="bg-indigo-500/10"
          delay="0.05s"
        />
        <StatCard
          icon={Target}
          value={`${accuracy}%`}
          label="Độ chính xác"
          gradientFrom="from-emerald-500/8"
          iconColor="text-emerald-400"
          bgColor="bg-emerald-500/10"
          delay="0.10s"
        />
        <StatCard
          icon={CheckCircle2}
          value={stats.totalExamsTaken}
          label="Đề đã làm"
          gradientFrom="from-violet-500/8"
          iconColor="text-violet-400"
          bgColor="bg-violet-500/10"
          delay="0.15s"
        />
        <StatCard
          icon={TrendingUp}
          value={stats.totalQuestionsAnswered}
          label="Tổng câu hỏi"
          gradientFrom="from-blue-500/8"
          iconColor="text-blue-400"
          bgColor="bg-blue-500/10"
          delay="0.20s"
        />
      </div>

      <RecentActivity continueLearning={continueLearning} />
      <WeeklyChart weeklyProgress={weeklyProgress} />
    </div>
  );
}
