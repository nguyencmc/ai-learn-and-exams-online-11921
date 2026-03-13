import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger('MyClassesSection');
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, BookOpen, Clock, Plus, ArrowRight, GraduationCap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ClassMember {
  id: string;
  role: 'teacher' | 'assistant' | 'student';
  status: 'active' | 'pending' | 'rejected';
  class_id: string;
  classes: {
    id: string;
    title: string;
    description: string | null;
    cover_image: string | null;
    class_code: string;
    creator_id: string;
  };
}

export function MyClassesSection() {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyClasses();
    }
  }, [user]);

  const fetchMyClasses = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('class_members')
      .select(`
        id,
        role,
        status,
        class_id,
        classes (
          id,
          title,
          description,
          cover_image,
          class_code,
          creator_id
        )
      `)
      .eq('user_id', user?.id)
      .order('joined_at', { ascending: false });

    if (error) {
      log.error('Error fetching classes', error);
    } else {
      setMemberships((data || []) as unknown as ClassMember[]);
    }
    
    setLoading(false);
  };

  const activeClasses = memberships.filter(m => m.status === 'active');
  const pendingClasses = memberships.filter(m => m.status === 'pending');
  const teachingClasses = activeClasses.filter(m => m.role === 'teacher' || m.role === 'assistant');
  const enrolledClasses = activeClasses.filter(m => m.role === 'student');

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'teacher':
        return <Badge className="bg-blue-500">Giảng viên</Badge>;
      case 'assistant':
        return <Badge className="bg-purple-500">Trợ giảng</Badge>;
      default:
        return <Badge variant="secondary">Học viên</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const ClassCard = ({ membership }: { membership: ClassMember }) => (
    <Link to={`/classes/${membership.classes.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {membership.classes.cover_image ? (
              <img 
                src={membership.classes.cover_image} 
                alt={membership.classes.title}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-8 h-8 text-white" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {membership.classes.title}
                </h3>
                {getRoleBadge(membership.role)}
              </div>
              
              {membership.classes.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {membership.classes.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Mã: {membership.classes.class_code}
                </span>
              </div>
            </div>
            
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 self-center" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Lớp học của tôi
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các lớp học bạn tham gia
          </p>
        </div>
        <Link to="/classes/join">
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Tham gia lớp
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="enrolled" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enrolled" className="text-xs sm:text-sm">
            Đang học ({enrolledClasses.length})
          </TabsTrigger>
          <TabsTrigger value="teaching" className="text-xs sm:text-sm">
            Giảng dạy ({teachingClasses.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            Chờ duyệt ({pendingClasses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="mt-4 space-y-3">
          {enrolledClasses.length > 0 ? (
            enrolledClasses.map(m => <ClassCard key={m.id} membership={m} />)
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">
                  Bạn chưa tham gia lớp học nào
                </p>
                <Link to="/classes/join">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Tham gia lớp học
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="teaching" className="mt-4 space-y-3">
          {teachingClasses.length > 0 ? (
            teachingClasses.map(m => <ClassCard key={m.id} membership={m} />)
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">
                  Bạn chưa giảng dạy lớp học nào
                </p>
                <Link to="/classes/new">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Tạo lớp học mới
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pendingClasses.length > 0 ? (
            pendingClasses.map(m => (
              <Card key={m.id} className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10">
                <CardContent className="p-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{m.classes.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Đang chờ giảng viên phê duyệt
                      </p>
                    </div>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                      Chờ duyệt
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Không có yêu cầu nào đang chờ duyệt
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
