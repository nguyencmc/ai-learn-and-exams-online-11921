import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  Shield,
  Server,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Clock,
  Zap,
} from 'lucide-react';
import { cn, getErrorMessage } from '@/lib/utils';

type HealthStatus = 'checking' | 'healthy' | 'degraded' | 'down';

interface HealthCheck {
  name: string;
  status: HealthStatus;
  latency: number | null;
  details: string;
  icon: React.ComponentType<{ className?: string }>;
  lastChecked: Date | null;
}

export function SystemHealthCheck() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    {
      name: 'Database',
      status: 'checking',
      latency: null,
      details: 'Đang kiểm tra...',
      icon: Database,
      lastChecked: null,
    },
    {
      name: 'Auth Service',
      status: 'checking',
      latency: null,
      details: 'Đang kiểm tra...',
      icon: Shield,
      lastChecked: null,
    },
    {
      name: 'RBAC System',
      status: 'checking',
      latency: null,
      details: 'Đang kiểm tra...',
      icon: Shield,
      lastChecked: null,
    },
    {
      name: 'Edge Functions',
      status: 'checking',
      latency: null,
      details: 'Đang kiểm tra...',
      icon: Zap,
      lastChecked: null,
    },
    {
      name: 'Storage',
      status: 'checking',
      latency: null,
      details: 'Đang kiểm tra...',
      icon: HardDrive,
      lastChecked: null,
    },
  ]);
  const [running, setRunning] = useState(false);
  const [overallScore, setOverallScore] = useState(0);

  const updateCheck = useCallback(
    (name: string, update: Partial<HealthCheck>) => {
      setChecks((prev) =>
        prev.map((c) => (c.name === name ? { ...c, ...update } : c))
      );
    },
    []
  );

  const runChecks = useCallback(async () => {
    setRunning(true);
    // Reset all to checking
    setChecks((prev) =>
      prev.map((c) => ({ ...c, status: 'checking' as const, latency: null, details: 'Đang kiểm tra...' }))
    );

    // 1. Database Check
    const dbCheck = async () => {
      const start = performance.now();
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        const latency = Math.round(performance.now() - start);

        if (error) {
          updateCheck('Database', {
            status: 'down',
            latency,
            details: `Lỗi: ${error.message}`,
            lastChecked: new Date(),
          });
          return false;
        }
        updateCheck('Database', {
          status: latency > 2000 ? 'degraded' : 'healthy',
          latency,
          details: `${count} profiles • ${latency}ms phản hồi`,
          lastChecked: new Date(),
        });
        return true;
      } catch (e: unknown) {
        updateCheck('Database', {
          status: 'down',
          latency: Math.round(performance.now() - start),
          details: `Không kết nối được: ${getErrorMessage(e)}`,
          lastChecked: new Date(),
        });
        return false;
      }
    };

    // 2. Auth Check
    const authCheck = async () => {
      const start = performance.now();
      try {
        const { data, error } = await supabase.auth.getSession();
        const latency = Math.round(performance.now() - start);
        if (error) {
          updateCheck('Auth Service', {
            status: 'down',
            latency,
            details: `Lỗi: ${error.message}`,
            lastChecked: new Date(),
          });
          return false;
        }
        updateCheck('Auth Service', {
          status: latency > 2000 ? 'degraded' : 'healthy',
          latency,
          details: `Session ${data.session ? 'active' : 'inactive'} • ${latency}ms`,
          lastChecked: new Date(),
        });
        return true;
      } catch (e: unknown) {
        updateCheck('Auth Service', {
          status: 'down',
          latency: Math.round(performance.now() - start),
          details: `Lỗi: ${getErrorMessage(e)}`,
          lastChecked: new Date(),
        });
        return false;
      }
    };

    // 3. RBAC Check
    const rbacCheck = async () => {
      const start = performance.now();
      try {
        const [rolesRes, permsRes, rolePermsRes] = await Promise.all([
          supabase.from('roles' as any).select('*', { count: 'exact', head: true }),
          supabase.from('permissions' as any).select('*', { count: 'exact', head: true }),
          supabase.from('role_permissions' as any).select('*', { count: 'exact', head: true }),
        ]);
        const latency = Math.round(performance.now() - start);

        const rolesCount = (rolesRes as any).count || 0;
        const permsCount = (permsRes as any).count || 0;
        const rolePermsCount = (rolePermsRes as any).count || 0;

        const hasError = rolesRes.error || permsRes.error || rolePermsRes.error;
        if (hasError) {
          updateCheck('RBAC System', {
            status: 'degraded',
            latency,
            details: `Một số bảng RBAC lỗi • ${latency}ms`,
            lastChecked: new Date(),
          });
          return false;
        }

        updateCheck('RBAC System', {
          status: 'healthy',
          latency,
          details: `${rolesCount} roles, ${permsCount} perms, ${rolePermsCount} mappings • ${latency}ms`,
          lastChecked: new Date(),
        });
        return true;
      } catch (e: unknown) {
        updateCheck('RBAC System', {
          status: 'down',
          latency: Math.round(performance.now() - start),
          details: `Lỗi: ${getErrorMessage(e)}`,
          lastChecked: new Date(),
        });
        return false;
      }
    };

    // 4. Edge Functions Check
    const edgeFnCheck = async () => {
      const start = performance.now();
      try {
        const { data, error } = await supabase.functions.invoke('export-schema', {
          method: 'POST',
          body: { healthCheck: true },
        });
        const latency = Math.round(performance.now() - start);
        // Even if we get an error response, the function being reachable means it's up
        updateCheck('Edge Functions', {
          status: latency > 5000 ? 'degraded' : 'healthy',
          latency,
          details: `Endpoint phản hồi • ${latency}ms`,
          lastChecked: new Date(),
        });
        return true;
      } catch (e: unknown) {
        const latency = Math.round(performance.now() - start);
        // Network error means truly down; other errors mean function is reachable
        const errMsg = getErrorMessage(e);
        if (errMsg.includes('NetworkError') || errMsg.includes('fetch')) {
          updateCheck('Edge Functions', {
            status: 'down',
            latency,
            details: `Không kết nối được • ${latency}ms`,
            lastChecked: new Date(),
          });
          return false;
        }
        updateCheck('Edge Functions', {
          status: 'healthy',
          latency,
          details: `Endpoint active • ${latency}ms`,
          lastChecked: new Date(),
        });
        return true;
      }
    };

    // 5. Storage Check
    const storageCheck = async () => {
      const start = performance.now();
      try {
        const { data, error } = await supabase.storage.listBuckets();
        const latency = Math.round(performance.now() - start);

        if (error) {
          updateCheck('Storage', {
            status: 'degraded',
            latency,
            details: `Lỗi: ${error.message} • ${latency}ms`,
            lastChecked: new Date(),
          });
          return false;
        }

        updateCheck('Storage', {
          status: latency > 2000 ? 'degraded' : 'healthy',
          latency,
          details: `${data?.length || 0} buckets • ${latency}ms`,
          lastChecked: new Date(),
        });
        return true;
      } catch (e: unknown) {
        updateCheck('Storage', {
          status: 'down',
          latency: Math.round(performance.now() - start),
          details: `Lỗi: ${getErrorMessage(e)}`,
          lastChecked: new Date(),
        });
        return false;
      }
    };

    // Run all checks
    const results = await Promise.all([
      dbCheck(),
      authCheck(),
      rbacCheck(),
      edgeFnCheck(),
      storageCheck(),
    ]);

    const healthyCount = results.filter(Boolean).length;
    setOverallScore(Math.round((healthyCount / results.length) * 100));
    setRunning(false);
  }, [updateCheck]);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const getStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
      case 'healthy':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case 'checking':
        return <Badge variant="outline" className="text-[10px]">Checking</Badge>;
      case 'healthy':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px]">Degraded</Badge>;
      case 'down':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]">Down</Badge>;
    }
  };

  const getOverallColor = () => {
    if (overallScore >= 80) return 'text-green-500';
    if (overallScore >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = () => {
    if (overallScore >= 80) return 'bg-green-500';
    if (overallScore >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            System Health Check
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={cn("text-2xl font-bold", getOverallColor())}>{overallScore}%</span>
              <span className="text-xs text-muted-foreground">Uptime</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runChecks}
              disabled={running}
              className="gap-1.5"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", running && "animate-spin")} />
              Kiểm tra lại
            </Button>
          </div>
        </div>
        <div className="mt-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", getProgressColor())}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checks.map((check) => (
            <div
              key={check.name}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg border transition-colors",
                check.status === 'healthy' && 'bg-green-500/5 border-green-500/20',
                check.status === 'degraded' && 'bg-yellow-500/5 border-yellow-500/20',
                check.status === 'down' && 'bg-red-500/5 border-red-500/20',
                check.status === 'checking' && 'bg-muted/30 border-border/50'
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {getStatusIcon(check.status)}
              </div>

              {/* Service Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <check.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{check.name}</span>
                  {getStatusBadge(check.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{check.details}</p>
              </div>

              {/* Latency */}
              <div className="flex-shrink-0 text-right">
                {check.latency !== null && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className={cn(
                      "text-sm font-mono",
                      check.latency < 500 ? 'text-green-500' :
                      check.latency < 2000 ? 'text-yellow-500' : 'text-red-500'
                    )}>
                      {check.latency}ms
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-muted-foreground">Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-[10px] text-muted-foreground">Degraded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-muted-foreground">Down</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
