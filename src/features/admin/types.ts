export interface Stats {
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

export interface DailyStats {
  date: string;
  users: number;
  attempts: number;
  enrollments: number;
}

export interface ContentDistribution {
  name: string;
  value: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  created_at: string;
  roles: string[];
  last_activity?: string;
}

export type AdminTab = 'overview' | 'users' | 'content' | 'system';

export interface ImportResultItem {
  success: boolean;
  email?: string;
  error?: string;
}

export interface EnrichedUser {
  id: string;
  email: string;
  created_at: string;
  profile?: {
    user_id: string;
    expires_at: string | null;
    full_name: string | null;
    username: string | null;
    email: string | null;
  };
  roles: string[];
}

export type ViewMode = 'timeline' | 'table';

export interface AuditLogStatsData {
  todayCount: number;
  permissionChanges: number;
  roleChanges: number;
  criticalActions: number;
}

export interface GroupedLogEntry {
  date: string;
  label: string;
  logs: import('@/hooks/useAuditLogs').AuditLog[];
}

export interface ActionConfigItem {
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

export interface EntityLabelItem {
  label: string;
  icon: React.ReactNode;
}

export interface TimeFilterOption {
  value: string;
  label: string;
}

// Teacher Dashboard types
export interface TeacherStats {
  totalExams: number;
  totalQuestions: number;
  totalFlashcardSets: number;
  totalPodcasts: number;
  totalCourses: number;
  totalStudents: number;
  totalClasses: number;
  avgRating: number;
}

export interface RecentItem {
  id: string;
  title: string;
  type: 'exam' | 'course' | 'flashcard' | 'podcast' | 'class';
  created_at: string;
  stats?: string;
}

export interface CourseWithStats {
  id: string;
  title: string;
  image_url: string | null;
  student_count: number;
  rating: number | null;
  is_published: boolean;
  created_at: string;
}

export type DashboardTab = 'overview' | 'classes' | 'students' | 'courses' | 'exams' | 'content' | 'analytics' | 'library';

export interface ClassWithStats {
  id: string;
  title: string;
  description: string | null;
  class_code: string;
  is_active: boolean;
  created_at: string;
  member_count: number;
  total_assignments: number;
  pending_grading: number;
}

export interface StudentSource {
  type: 'class' | 'course';
  name: string;
  id: string;
  last_activity: string | null;
  progress: number;
}

export interface StudentSummary {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  sources: StudentSource[];
  last_activity: string | null;
}
