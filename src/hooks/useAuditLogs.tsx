import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

const log = logger('useAuditLogs');

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Json | null;
  new_value: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Json;
  created_at: string;
  // Joined data
  user_email?: string;
  user_name?: string;
}

interface UseAuditLogsOptions {
  entityType?: string;
  action?: string;
  userId?: string;
  limit?: number;
}

export const useAuditLogs = (options: UseAuditLogsOptions = {}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options.limit || 100);

      if (options.entityType) {
        query = query.eq('entity_type', options.entityType);
      }
      if (options.action) {
        query = query.eq('action', options.action);
      }
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Fetch user profiles for the logs
      const userIds = [...new Set((data || []).map(log => log.user_id).filter(Boolean))];
      
      let profiles: Record<string, { email: string; full_name: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', userIds);
        
        if (profileData) {
          profiles = profileData.reduce((acc, p) => {
            acc[p.user_id] = { email: p.email || '', full_name: p.full_name };
            return acc;
          }, {} as Record<string, { email: string; full_name: string | null }>);
        }
      }

      const enrichedLogs: AuditLog[] = (data || []).map(log => ({
        ...log,
        user_email: log.user_id ? profiles[log.user_id]?.email : undefined,
        user_name: log.user_id ? profiles[log.user_id]?.full_name || undefined : undefined,
      }));

      setLogs(enrichedLogs);
    } catch (err) {
      log.error('Error fetching audit logs', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [options.entityType, options.action, options.userId, options.limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
};

// Helper function to create audit log from frontend
export const createAuditLog = async (
  action: string,
  entityType: string,
  entityId?: string,
  oldValue?: Json,
  newValue?: Json,
  metadata?: Json
) => {
  try {
    const { data, error } = await supabase.rpc('create_audit_log', {
      _action: action,
      _entity_type: entityType,
      _entity_id: entityId || null,
      _old_value: oldValue || null,
      _new_value: newValue || null,
      _metadata: metadata || {},
    });

    if (error) throw error;
    return data;
  } catch (err) {
    log.error('Error creating audit log', err);
    throw err;
  }
};
