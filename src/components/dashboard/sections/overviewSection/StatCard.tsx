import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  gradientFrom: string;
  iconColor: string;
  bgColor: string;
  delay?: string;
}

export function StatCard({ icon: Icon, value, label, gradientFrom, iconColor, bgColor, delay }: StatCardProps) {
  return (
    <Card
      className={cn(
        'border-border/40 relative overflow-hidden db-card-hover animate-fade-slide-up cursor-default'
      )}
      style={delay ? { animationDelay: delay } : undefined}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} to-transparent opacity-60`} />
      {/* Decorative circle */}
      <div className={cn('absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10', bgColor)} />

      <CardContent className="p-4 relative">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm animate-neon-pulse',
          bgColor
        )}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}
