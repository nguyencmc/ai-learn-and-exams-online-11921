import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { AuditLog } from '@/hooks/useAuditLogs';
import {
  getActionBadge,
  getRelativeTime,
  getDefaultEntityConfig,
} from '@/features/admin/constants/auditLogConfig';

export const AuditLogTable = ({ logs }: { logs: AuditLog[] }) => {
  return (
    <div className="border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px]">Thời gian</TableHead>
            <TableHead className="w-[140px]">Hành động</TableHead>
            <TableHead className="w-[140px]">Đối tượng</TableHead>
            <TableHead>Người thực hiện</TableHead>
            <TableHead className="w-[200px]">Chi tiết</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const entityConfig = getDefaultEntityConfig(log.entity_type);
            
            const getQuickDetail = () => {
              if (log.new_value && typeof log.new_value === 'object' && !Array.isArray(log.new_value)) {
                const val = log.new_value as Record<string, unknown>;
                if (val.permission) return String(val.permission);
                if (val.role) return String(val.role);
              }
              if (log.old_value && typeof log.old_value === 'object' && !Array.isArray(log.old_value)) {
                const val = log.old_value as Record<string, unknown>;
                if (val.permission) return String(val.permission);
                if (val.role) return String(val.role);
              }
              return log.entity_id ? `${log.entity_id.slice(0, 8)}...` : '-';
            };

            return (
              <TableRow key={log.id} className="group hover:bg-muted/50">
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="text-left">
                        <div className="text-sm">{getRelativeTime(log.created_at)}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'HH:mm', { locale: vi })}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(new Date(log.created_at), 'HH:mm:ss - dd/MM/yyyy', { locale: vi })}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-1 text-xs font-normal">
                    {entityConfig.icon}
                    {entityConfig.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm truncate max-w-[150px]">
                      {log.user_name || log.user_email || 'Hệ thống'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded truncate block max-w-[180px]">
                    {getQuickDetail()}
                  </code>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
