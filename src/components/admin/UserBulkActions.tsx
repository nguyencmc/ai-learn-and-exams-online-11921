import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/useToast';
import { Download, MoreHorizontal, Shield, CheckSquare, XSquare } from 'lucide-react';

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  created_at: string;
  roles: string[];
}

interface UserBulkActionsProps {
  users: UserWithRole[];
  selectedUsers: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onRefresh: () => void;
}

export function UserBulkActions({
  users,
  selectedUsers,
  onSelectionChange,
  onRefresh,
}: UserBulkActionsProps) {
  const { toast } = useToast();
  const [bulkRole, setBulkRole] = useState<string>('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const selectedCount = selectedUsers.size;

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(users.map((u) => u.user_id)));
    }
  };

  const handleClearSelection = () => {
    onSelectionChange(new Set());
  };

  const handleBulkRoleAssign = async () => {
    if (!bulkRole || selectedCount === 0) return;

    setBulkLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const userId of selectedUsers) {
      try {
        // Delete old roles
        await supabase.from('user_roles').delete().eq('user_id', userId);

        if (bulkRole !== 'none') {
          const { error } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: bulkRole as 'admin' | 'moderator' | 'teacher' | 'user' });

          if (error) {
            errorCount++;
            continue;
          }
        }
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setBulkLoading(false);
    setBulkRole('');
    onSelectionChange(new Set());
    onRefresh();

    toast({
      title: 'Cập nhật hàng loạt',
      description: `Thành công: ${successCount}, Lỗi: ${errorCount}`,
      variant: errorCount > 0 ? 'destructive' : 'default',
    });
  };

  const handleExportCSV = () => {
    const exportUsers = selectedCount > 0
      ? users.filter((u) => selectedUsers.has(u.user_id))
      : users;

    const headers = ['Tên', 'Email', 'Username', 'Vai trò', 'Ngày tạo'];
    const rows = exportUsers.map((u) => [
      u.full_name || '',
      u.email || '',
      u.username || '',
      u.roles.length > 0 ? u.roles.join(', ') : 'user',
      new Date(u.created_at).toLocaleDateString('vi-VN'),
    ]);

    const csvContent = [
      '\ufeff' + headers.join(','),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Xuất CSV thành công',
      description: `Đã xuất ${exportUsers.length} người dùng`,
    });
  };

  const _toggleUser = (userId: string) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    onSelectionChange(newSet);
  };

  return (
    <div className="space-y-3">
      {/* Bulk Action Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedCount > 0 && selectedCount === users.length}
            onCheckedChange={handleSelectAll}
            className="mr-1"
          />
          <span className="text-sm text-muted-foreground">
            {selectedCount > 0 ? (
              <>
                <Badge variant="secondary" className="mr-1">{selectedCount}</Badge>
                đã chọn
              </>
            ) : (
              'Chọn tất cả'
            )}
          </span>
        </div>

        {selectedCount > 0 && (
          <>
            <div className="h-4 w-px bg-border" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="gap-1 text-xs h-7"
            >
              <XSquare className="w-3 h-3" />
              Bỏ chọn
            </Button>

            <div className="h-4 w-px bg-border" />

            {/* Bulk Role Assignment */}
            <div className="flex items-center gap-2">
              <Select value={bulkRole} onValueChange={setBulkRole}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="Gán vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">User</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleBulkRoleAssign}
                disabled={!bulkRole || bulkLoading}
                className="gap-1 h-8 text-xs"
              >
                <Shield className="w-3 h-3" />
                {bulkLoading ? 'Đang xử lý...' : 'Áp dụng'}
              </Button>
            </div>
          </>
        )}

        <div className="flex-1" />

        {/* Export CSV */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
              <MoreHorizontal className="w-3.5 h-3.5" />
              Thao tác
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Xuất CSV {selectedCount > 0 ? `(${selectedCount} người)` : '(Tất cả)'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSelectAll} className="gap-2">
              <CheckSquare className="w-4 h-4" />
              Chọn tất cả ({users.length})
            </DropdownMenuItem>
            {selectedCount > 0 && (
              <DropdownMenuItem onClick={handleClearSelection} className="gap-2">
                <XSquare className="w-4 h-4" />
                Bỏ chọn tất cả
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function UserSelectCheckbox({
  userId,
  checked,
  onToggle,
}: {
  userId: string;
  checked: boolean;
  onToggle: (userId: string) => void;
}) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={() => onToggle(userId)}
      className="mr-2"
      onClick={(e) => e.stopPropagation()}
    />
  );
}
