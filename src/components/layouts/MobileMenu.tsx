import { Link } from "react-router-dom";
import type { User as AuthUser } from '@supabase/supabase-js';
import { 
  Layers, 
  Headphones, 
  GraduationCap, 
  BookOpen, 
  LayoutDashboard,
  User,
  History,
  Settings,
  Shield,
  LogOut,
  Sparkles,
  Award,
  X,
  FileText,
  Newspaper
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import logo from "@/assets/logo.png";

interface UserProfile {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  level: number | null;
  points: number | null;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  profile: UserProfile | null;
  displayName: string;
  isAdmin: boolean;
  isTeacher: boolean;
  onSignOut: () => void;
}

const studyLinks = [
  { name: "Đề thi", href: "/exams", icon: FileText },
  { name: "Bài viết", href: "/articles", icon: Newspaper },
  { name: "Flashcards", href: "/flashcards", icon: Layers },
  { name: "Podcasts", href: "/podcasts", icon: Headphones },
  { name: "Khóa học", href: "/courses", icon: GraduationCap },
  { name: "Sách", href: "/books", icon: BookOpen },
  { name: "Thành tựu", href: "/achievements", icon: Award },
];

const accountLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Hồ sơ", href: "/profile", icon: User, needsUsername: true },
  { name: "Lịch sử", href: "/history", icon: History },
  { name: "Thiết lập", href: "/settings", icon: Settings },
];

export const MobileMenu = ({
  isOpen,
  onClose,
  user,
  profile,
  displayName,
  isAdmin,
  isTeacher,
  onSignOut,
}: MobileMenuProps) => {
  const getProfileLink = (link: typeof accountLinks[0]) => {
    if (link.needsUsername && profile?.username) {
      return `/@${profile.username}`;
    }
    return link.href;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full max-w-md p-0 border-l border-border/50">
        <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
          {/* Header */}
          <SheetHeader className="p-4 border-b border-border/50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <Link to="/" onClick={onClose} className="flex items-center gap-2">
                <img src={logo} alt="AI-Exam.cloud" className="h-7 w-auto" />
                <SheetTitle className="text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AI-Exam.cloud
                </SheetTitle>
              </Link>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
              {/* User Profile Card - Only when logged in */}
              {user && profile && (
                <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-2xl p-4 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate text-sm">{displayName}</h3>
                      {profile.username && (
                        <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                          Lv.{profile.level || 1}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {(profile.points || 0).toLocaleString()} điểm
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid Layout - Same for both logged in and logged out */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider px-1">
                  📚 Khám phá
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {studyLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={onClose}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover:bg-muted/80 active:bg-muted transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <link.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-foreground text-center">{link.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Account Section - Only for logged in users */}
              {user && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-accent uppercase tracking-wider px-1">
                    👤 Tài khoản
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {accountLinks.map((link) => {
                      if (link.needsUsername && !profile?.username) return null;
                      return (
                        <Link
                          key={link.name}
                          to={getProfileLink(link)}
                          onClick={onClose}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover:bg-muted/80 active:bg-muted transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                            <link.icon className="w-5 h-5 text-accent" />
                          </div>
                          <span className="text-xs font-medium text-foreground text-center">{link.name}</span>
                        </Link>
                      );
                    })}
                    
                    {/* Admin/Teacher Dashboard */}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={onClose}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 active:bg-primary/15 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-primary text-center">Admin</span>
                      </Link>
                    )}
                    {isTeacher && !isAdmin && (
                      <Link
                        to="/teacher"
                        onClick={onClose}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 active:bg-accent/15 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-accent" />
                        </div>
                        <span className="text-xs font-semibold text-accent text-center">Teacher</span>
                      </Link>
                    )}

                    {/* Logout */}
                    <button
                      onClick={() => {
                        onSignOut();
                        onClose();
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover:bg-destructive/10 active:bg-destructive/15 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <LogOut className="w-5 h-5 text-destructive" />
                      </div>
                      <span className="text-xs font-medium text-destructive text-center">Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Auth Buttons - Only for guests */}
              {!user && (
                <div className="space-y-3 pt-4">
                  <Link to="/auth" onClick={onClose} className="block">
                    <Button className="w-full h-11 rounded-xl shadow-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity font-semibold">
                      Đăng ký miễn phí
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={onClose} className="block">
                    <Button variant="outline" className="w-full h-11 rounded-xl font-medium">
                      Đăng nhập
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-muted/30 flex-shrink-0">
            <p className="text-[10px] text-center text-muted-foreground">
              © 2025 AI-Exam.cloud - Nền tảng học tập thông minh
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
