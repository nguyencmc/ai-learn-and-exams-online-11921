import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

const log = logger('PermissionsContext');

export interface Permission {
  permission_name: string;
  permission_category: string;
}

export type AppRole = 'admin' | 'moderator' | 'teacher' | 'user';

interface PermissionsContextType {
  // Roles
  roles: AppRole[];
  isAdmin: boolean;
  isTeacher: boolean;
  isModerator: boolean;
  hasRole: (role: AppRole) => boolean;
  
  // Permissions
  permissions: Permission[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canEditOwn: (resource: string, creatorId?: string | null) => boolean;
  canDeleteOwn: (resource: string, creatorId?: string | null) => boolean;
  
  // Loading state
  loading: boolean;
  refetch: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRolesAndPermissions = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch roles and permissions in parallel
      const [rolesResult, permissionsResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id),
        supabase
          .rpc('get_user_permissions', { _user_id: user.id })
      ]);

      if (rolesResult.error) {
        log.error('Error fetching roles', rolesResult.error);
        setRoles([]);
      } else {
        setRoles((rolesResult.data || []).map(r => r.role as AppRole));
      }

      if (permissionsResult.error) {
        log.error('Error fetching permissions', permissionsResult.error);
        setPermissions([]);
      } else {
        setPermissions(permissionsResult.data || []);
      }
    } catch (err) {
      log.error('Error fetching roles/permissions', err);
      setRoles([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, [fetchRolesAndPermissions]);

  // Role helpers
  const hasRole = useCallback((role: AppRole): boolean => roles.includes(role), [roles]);
  const isAdmin = useMemo(() => roles.includes('admin'), [roles]);
  const isTeacher = useMemo(() => roles.includes('teacher'), [roles]);
  const isModerator = useMemo(() => roles.includes('moderator'), [roles]);

  // Permission helpers
  const permissionNames = useMemo(() => 
    new Set(permissions.map(p => p.permission_name)),
    [permissions]
  );

  const hasPermission = useCallback((permission: string): boolean => {
    return permissionNames.has(permission);
  }, [permissionNames]);

  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    return perms.some(p => permissionNames.has(p));
  }, [permissionNames]);

  const hasAllPermissions = useCallback((perms: string[]): boolean => {
    return perms.every(p => permissionNames.has(p));
  }, [permissionNames]);

  const canEditOwn = useCallback((resource: string, creatorId?: string | null): boolean => {
    if (hasPermission(`${resource}.edit`)) return true;
    if (hasPermission(`${resource}.edit_own`) && creatorId === user?.id) return true;
    return false;
  }, [hasPermission, user?.id]);

  const canDeleteOwn = useCallback((resource: string, creatorId?: string | null): boolean => {
    if (hasPermission(`${resource}.delete`)) return true;
    if (hasPermission(`${resource}.delete_own`) && creatorId === user?.id) return true;
    return false;
  }, [hasPermission, user?.id]);

  const value = useMemo(() => ({
    roles,
    isAdmin,
    isTeacher,
    isModerator,
    hasRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canEditOwn,
    canDeleteOwn,
    loading,
    refetch: fetchRolesAndPermissions,
  }), [
    roles, isAdmin, isTeacher, isModerator, hasRole,
    permissions, hasPermission, hasAnyPermission, hasAllPermissions,
    canEditOwn, canDeleteOwn, loading, fetchRolesAndPermissions
  ]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }
  return context;
};

// Re-export for backwards compatibility with useUserRole
export const useRBAC = usePermissionsContext;
