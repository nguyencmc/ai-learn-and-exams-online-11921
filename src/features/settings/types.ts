export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  points: number | null;
  level: number | null;
}
