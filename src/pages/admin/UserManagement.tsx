import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionsContext } from '@/contexts/PermissionsContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Plus,
  Upload,
  Trash2,
  Key,
  Shield,
  Calendar,
  Search,
  Download,
  ArrowLeft
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/useToast';
import { createAuditLog } from '@/hooks/useAuditLogs';
import { getErrorMessage } from '@/lib/utils';
import { logger } from '@/lib/logger';

const log = logger('UserManagement');

interface ImportResultItem {
  success: boolean;
  email?: string;
  error?: string;
}

interface EnrichedUser {
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

const UserManagement = () => {
  const { user: currentUser, session } = useAuth();
  const { isAdmin, hasPermission, loading: roleLoading } = usePermissionsContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create user dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newUserExpires, setNewUserExpires] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Change password dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<EnrichedUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Bulk import dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const canView = hasPermission('users.view');
  const canCreate = hasPermission('users.create');
  const canEdit = hasPermission('users.edit');
  const canDelete = hasPermission('users.delete');
  const canAssignRoles = hasPermission('roles.assign');

  useEffect(() => {
    if (!roleLoading && !canView) {
      navigate('/');
      toast({
        title: "Không có quyền truy cập",
        description: "Bạn không có quyền quản lý người dùng",
        variant: "destructive",
      });
    }
  }, [canView, roleLoading, navigate, toast]);

  useEffect(() => {
    if (canView && session) {
      fetchUsers();
    }
  }, [canView, session]);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = new URL(`${SUPABASE_URL}/functions/v1/admin-users`);
      url.searchParams.set('action', 'list');
      
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({})
      });
      
      const result = await res.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setUsers(result.users || []);
    } catch (err) {
      log.error('Error fetching users', err);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách người dùng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const callAdminFunction = async (action: string, body: object) => {
    const url = new URL(`${SUPABASE_URL}/functions/v1/admin-users`);
    url.searchParams.set('action', action);
    
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(body)
    });
    
    return res.json();
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập email và mật khẩu",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const result = await callAdminFunction('create', {
        email: newUserEmail,
        password: newUserPassword,
        full_name: newUserName,
        role: newUserRole,
        expires_at: newUserExpires || null
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Create audit log
      await createAuditLog(
        'create',
        'user',
        result.user?.id,
        null,
        { email: newUserEmail, full_name: newUserName, role: newUserRole }
      );

      toast({
        title: "Thành công",
        description: "Đã tạo người dùng mới",
      });
      
      setCreateDialogOpen(false);
      resetCreateForm();
      fetchUsers();
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(err) || "Không thể tạo người dùng",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserName('');
    setNewUserRole('user');
    setNewUserExpires('');
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;

    setChangingPassword(true);
    try {
      const result = await callAdminFunction('update-password', {
        user_id: selectedUser.id,
        new_password: newPassword
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Create audit log
      await createAuditLog(
        'update_password',
        'user',
        selectedUser.id,
        null,
        { email: selectedUser.email },
        { action_detail: 'Password changed by admin' }
      );

      toast({
        title: "Thành công",
        description: "Đã đổi mật khẩu",
      });
      
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(err) || "Không thể đổi mật khẩu",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const result = await callAdminFunction('delete', {
        user_id: userToDelete.id
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Create audit log
      await createAuditLog(
        'delete',
        'user',
        userToDelete.id,
        { email: userToDelete.email, full_name: userToDelete.profile?.full_name, roles: userToDelete.roles },
        null
      );

      toast({
        title: "Thành công",
        description: "Đã xóa người dùng",
      });
      
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(err) || "Không thể xóa người dùng",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const result = await callAdminFunction('update', {
        user_id: userId,
        role: newRole === 'none' ? 'user' : newRole
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Get user info for audit log
      const userInfo = users.find(u => u.id === userId);
      const oldRoles = userInfo?.roles || [];

      // Create audit log
      await createAuditLog(
        'update_role',
        'user',
        userId,
        { roles: oldRoles },
        { roles: [newRole === 'none' ? 'user' : newRole] },
        { email: userInfo?.email }
      );

      toast({
        title: "Thành công",
        description: "Đã cập nhật vai trò",
      });
      
      fetchUsers();
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(err) || "Không thể cập nhật vai trò",
        variant: "destructive",
      });
    }
  };

  const handleExpirationChange = async (userId: string, expiresAt: string | null) => {
    try {
      const result = await callAdminFunction('update', {
        user_id: userId,
        expires_at: expiresAt
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Thành công",
        description: "Đã cập nhật thời hạn",
      });
      
      fetchUsers();
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(err) || "Không thể cập nhật thời hạn",
        variant: "destructive",
      });
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      let lines = text.split('\n').filter(line => line.trim());
      
      // Skip sep= line if present (Excel compatibility)
      if (lines[0]?.toLowerCase().startsWith('sep=')) {
        lines = lines.slice(1);
      }
      
      // Skip header row if present
      const startIndex = lines[0]?.toLowerCase().includes('email') ? 1 : 0;
      
      // Helper to convert DD/MM/YYYY to ISO date
      const parseDate = (dateStr: string): string | null => {
        if (!dateStr) return null;
        // Try DD/MM/YYYY format
        const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyy) {
          const [, day, month, year] = ddmmyyyy;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // Already in ISO format or other valid format
        return dateStr;
      };
      
      const usersToCreate = [];
      for (let i = startIndex; i < lines.length; i++) {
        // Support both semicolon and comma separators
        const separator = lines[i].includes(';') ? ';' : ',';
        const cols = lines[i].split(separator).map(c => c.trim().replace(/^\r|\r$/g, ''));
        if (cols.length >= 2 && cols[0]) {
          // Columns: email, password, full_name, username, bio, role, expires_at
          usersToCreate.push({
            email: cols[0],
            password: cols[1],
            full_name: cols[2] || '',
            username: cols[3] || null,
            bio: cols[4] || null,
            role: cols[5] || 'user',
            expires_at: parseDate(cols[6] || '')
          });
        }
      }

      if (usersToCreate.length === 0) {
        throw new Error('Không tìm thấy dữ liệu hợp lệ trong file');
      }

      const result = await callAdminFunction('bulk-create', {
        users: usersToCreate
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const successCount = result.results?.filter((r: ImportResultItem) => r.success).length || 0;
      const failCount = result.results?.filter((r: ImportResultItem) => !r.success).length || 0;

      toast({
        title: "Import hoàn tất",
        description: `Thành công: ${successCount}, Thất bại: ${failCount}`,
      });
      
      setBulkDialogOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description: getErrorMessage(err) || "Không thể import người dùng",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadCSVTemplate = () => {
    // Use semicolon separator for better Excel compatibility
    const template = 'sep=;;;;;;\nemail;password;full_name;username;bio;role;expires_at\nhocsinh1@demo.com;Matkhau123;Nguyễn Văn A;nguyenvana;Tôi là học sinh;user;31/12/2026';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau_import_nguoi_dung.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(u => {
    const searchLower = searchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(searchLower) ||
      u.profile?.full_name?.toLowerCase().includes(searchLower) ||
      u.profile?.username?.toLowerCase().includes(searchLower)
    );
  });

  const isExpired = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background">
<div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!canView) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
<main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                Quản lý người dùng
              </h1>
              <p className="text-muted-foreground mt-1">Tạo, xóa, phân quyền và quản lý thời hạn người dùng</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import người dùng từ CSV</DialogTitle>
                  <DialogDescription>
                    Tải lên file CSV để tạo nhiều người dùng cùng lúc
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">Format CSV (dùng dấu chấm phẩy):</p>
                    <code className="bg-muted p-2 rounded block text-xs overflow-x-auto">
                      email;password;full_name;username;bio;role;expires_at
                    </code>
                    <p className="mt-2 text-xs">Ngày hết hạn: DD/MM/YYYY (ví dụ: 31/12/2026)</p>
                  </div>
                  <Button variant="outline" onClick={downloadCSVTemplate} className="gap-2">
                    <Download className="w-4 h-4" />
                    Tải template mẫu
                  </Button>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <Label htmlFor="csv-upload">
                      <Button 
                        variant="default" 
                        className="gap-2 cursor-pointer" 
                        disabled={importing}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {importing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Đang import...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Chọn file CSV
                          </>
                        )}
                      </Button>
                    </Label>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Tạo người dùng
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo người dùng mới</DialogTitle>
                  <DialogDescription>
                    Điền thông tin để tạo tài khoản mới
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Họ tên</Label>
                    <Input
                      id="name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Vai trò</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires">Thời hạn tài khoản</Label>
                    <Input
                      id="expires"
                      type="date"
                      value={newUserExpires}
                      onChange={(e) => setNewUserExpires(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Để trống nếu không giới hạn</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleCreateUser} disabled={creating}>
                    {creating ? 'Đang tạo...' : 'Tạo người dùng'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo email, tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Danh sách người dùng ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Quản lý tất cả người dùng trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Thời hạn</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className={isExpired(u.profile?.expires_at) ? 'opacity-50' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{u.profile?.full_name || 'Chưa đặt tên'}</p>
                          {u.profile?.username && (
                            <p className="text-sm text-muted-foreground">@{u.profile.username}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Select 
                          value={u.roles[0] || 'user'} 
                          onValueChange={(value) => handleRoleChange(u.id, value)}
                          disabled={u.id === currentUser?.id}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={u.profile?.expires_at ? u.profile.expires_at.split('T')[0] : ''}
                            onChange={(e) => handleExpirationChange(u.id, e.target.value || null)}
                            className="w-36"
                          />
                          {isExpired(u.profile?.expires_at) && (
                            <Badge variant="destructive">Hết hạn</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(u);
                              setPasswordDialogOpen(true);
                            }}
                            title="Đổi mật khẩu"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setUserToDelete(u);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={u.id === currentUser?.id}
                            title="Xóa người dùng"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>
              Đổi mật khẩu cho: {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword}>
              {changingPassword ? 'Đang lưu...' : 'Đổi mật khẩu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete?.email}</strong>? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Đang xóa...' : 'Xóa người dùng'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
