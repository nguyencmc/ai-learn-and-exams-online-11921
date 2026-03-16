import type { Profile } from '../types';

interface ProfileStatsDisplayProps {
  profile: Profile;
}

export function ProfileStatsDisplay({ profile }: ProfileStatsDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">{profile.points?.toLocaleString() || 0}</p>
        <p className="text-sm text-muted-foreground">Điểm tích lũy</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-accent">Level {profile.level || 1}</p>
        <p className="text-sm text-muted-foreground">Cấp độ</p>
      </div>
    </div>
  );
}
