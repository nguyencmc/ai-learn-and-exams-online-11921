import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { createAuditLog } from '@/hooks/useAuditLogs';
import { ArrowLeft, Shield, Save, Loader2, Users, GraduationCap, UserCheck, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logger } from '@/lib/logger';

const log = logger('PermissionManagement');

interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

interface RolePermission {
  role: string;
  permission_id: string;
}

type AppRole = 'admin' | 'moderator' | 'teacher' | 'user';

const ROLES: { value: AppRole; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'admin', label: 'Admin', icon: Shield, color: 'text-red-500' },
  { value: 'moderator', label: 'Moderator', icon: UserCheck, color: 'text-orange-500' },
  { value: 'teacher', label: 'Teacher', icon: GraduationCap, color: 'text-blue-500' },
  { value: 'user', label: 'User', icon: User, color: 'text-green-500' },
];

const CATEGORY_LABELS: Record<string, string> = {
  admin: 'Quản trị',
  teacher: 'Giảng viên',
  users: 'Người dùng',
  classes: 'Lớp học',
  exams: 'Đề thi',
  courses: 'Khóa học',
  podcasts: 'Podcast',
  flashcards: 'Flashcard',
  question_sets: 'Bộ câu hỏi',
  categories: 'Danh mục',
};

const PermissionManagement = () => {
  const { isAdmin, loading: roleLoading } = usePermissionsContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [activeRole, setActiveRole] = useState<AppRole>('teacher');

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/');
      toast({
        title: "Không có quyền truy cập",
        description: "Chỉ Admin mới có thể quản lý phân quyền",
        variant: "destructive",
      });
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [permissionsRes, rolePermissionsRes] = await Promise.all([
        supabase.from('permissions').select('*').order('category').order('name'),
        supabase.from('role_permissions').select('role, permission_id'),
      ]);

      if (permissionsRes.error) throw permissionsRes.error;
      if (rolePermissionsRes.error) throw rolePermissionsRes.error;

      setPermissions(permissionsRes.data || []);
      setRolePermissions(rolePermissionsRes.data || []);
    } catch (error) {
      log.error('Error fetching data', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu phân quyền",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (role: AppRole, permissionId: string): boolean => {
    const key = `${role}:${permissionId}`;
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key)!;
    }
    return rolePermissions.some(rp => rp.role === role && rp.permission_id === permissionId);
  };

  const togglePermission = (role: AppRole, permissionId: string) => {
    // Don't allow modifying admin permissions
    if (role === 'admin') {
      toast({
        title: "Không thể thay đổi",
        description: "Không thể thay đổi quyền của Admin",
        variant: "destructive",
      });
      return;
    }

    const key = `${role}:${permissionId}`;
    const currentValue = hasPermission(role, permissionId);
    
    setPendingChanges(prev => {
      const newChanges = new Map(prev);
      const originalValue = rolePermissions.some(rp => rp.role === role && rp.permission_id === permissionId);
      
      if ((!currentValue) === originalValue) {
        // New value matches original, remove from pending
        newChanges.delete(key);
      } else {
        newChanges.set(key, !currentValue);
      }
      return newChanges;
    });
  };

  const saveChanges = async () => {
    if (pendingChanges.size === 0) return;

    setSaving(true);
    try {
      const toAdd: { role: AppRole; permission_id: string }[] = [];
      const toRemove: { role: AppRole; permission_id: string }[] = [];

      pendingChanges.forEach((newValue, key) => {
        const [role, permissionId] = key.split(':') as [AppRole, string];
        if (newValue) {
          toAdd.push({ role, permission_id: permissionId });
        } else {
          toRemove.push({ role, permission_id: permissionId });
        }
      });

      // Get permission names for logging
      const getPermissionName = (id: string) => permissions.find(p => p.id === id)?.name || id;

      // Remove permissions
      for (const item of toRemove) {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role', item.role)
          .eq('permission_id', item.permission_id);
        if (error) throw error;

        // Log permission removal
        await createAuditLog(
          'permission_revoked',
          'role_permission',
          item.permission_id,
          { role: item.role, permission: getPermissionName(item.permission_id) },
          null,
          { role: item.role }
        );
      }

      // Add permissions
      if (toAdd.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .insert(toAdd);
        if (error) throw error;

        // Log permission grants
        for (const item of toAdd) {
          await createAuditLog(
            'permission_granted',
            'role_permission',
            item.permission_id,
            null,
            { role: item.role, permission: getPermissionName(item.permission_id) },
            { role: item.role }
          );
        }
      }

      toast({
        title: "Thành công",
        description: `Đã cập nhật ${pendingChanges.size} quyền`,
      });

      setPendingChanges(new Map());
      await fetchData();
    } catch (error) {
      log.error('Error saving', error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu thay đổi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setPendingChanges(new Map());
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getRoleStats = (role: AppRole) => {
    let count = 0;
    permissions.forEach(p => {
      if (hasPermission(role, p.id)) count++;
    });
    return count;
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
<div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Quản lý phân quyền</h1>
              <p className="text-muted-foreground text-sm">
                Cấu hình quyền cho từng vai trò trong hệ thống
              </p>
            </div>
          </div>
          
          {pendingChanges.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {pendingChanges.size} thay đổi chưa lưu
              </Badge>
              <Button variant="outline" size="sm" onClick={discardChanges}>
                Hủy
              </Button>
              <Button size="sm" onClick={saveChanges} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Lưu
              </Button>
            </div>
          )}
        </div>

        {/* Role Tabs */}
        <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as AppRole)}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {ROLES.map(role => (
              <TabsTrigger key={role.value} value={role.value} className="flex items-center gap-2">
                <role.icon className={`h-4 w-4 ${role.color}`} />
                <span className="hidden sm:inline">{role.label}</span>
                <Badge variant="outline" className="ml-1 text-xs">
                  {getRoleStats(role.value)}/{permissions.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {ROLES.map(role => (
            <TabsContent key={role.value} value={role.value}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <role.icon className={`h-5 w-5 ${role.color}`} />
                    <CardTitle>{role.label}</CardTitle>
                  </div>
                  <CardDescription>
                    {role.value === 'admin' 
                      ? 'Admin có tất cả các quyền và không thể thay đổi'
                      : `Cấu hình quyền cho vai trò ${role.label}`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[60vh]">
                    <div className="space-y-6">
                      {Object.entries(groupedPermissions).map(([category, perms]) => (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                              {CATEGORY_LABELS[category] || category}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {perms.filter(p => hasPermission(role.value, p.id)).length}/{perms.length}
                            </Badge>
                          </div>
                          <div className="grid gap-2">
                            {perms.map(permission => {
                              const checked = hasPermission(role.value, permission.id);
                              const key = `${role.value}:${permission.id}`;
                              const isPending = pendingChanges.has(key);
                              
                              return (
                                <label
                                  key={permission.id}
                                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                                    ${checked ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-transparent'}
                                    ${isPending ? 'ring-2 ring-primary/50' : ''}
                                    ${role.value === 'admin' ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/50'}
                                  `}
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={() => togglePermission(role.value, permission.id)}
                                    disabled={role.value === 'admin'}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                        {permission.name}
                                      </code>
                                      {isPending && (
                                        <Badge variant="secondary" className="text-xs">
                                          Đã thay đổi
                                        </Badge>
                                      )}
                                    </div>
                                    {permission.description && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {permission.description}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {ROLES.map(role => (
            <Card key={role.value}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <role.icon className={`h-4 w-4 ${role.color}`} />
                  <span className="font-medium text-sm">{role.label}</span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{getRoleStats(role.value)}</span>
                  <span className="text-muted-foreground text-sm">/{permissions.length} quyền</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default PermissionManagement;
