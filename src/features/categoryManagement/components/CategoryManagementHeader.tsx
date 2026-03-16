import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus, ArrowLeft } from 'lucide-react';

interface CategoryManagementHeaderProps {
  isAdmin: boolean;
  canCreate: boolean;
  onCreateClick: () => void;
}

export function CategoryManagementHeader({
  isAdmin,
  canCreate,
  onCreateClick,
}: CategoryManagementHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Link to={isAdmin ? "/admin" : "/teacher"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-primary" />
            Quản lý danh mục
          </h1>
          <p className="text-muted-foreground mt-1">Tạo và quản lý các danh mục nội dung</p>
        </div>
      </div>
      {canCreate && (
        <Button onClick={onCreateClick} className="gap-2">
          <Plus className="w-4 h-4" />
          Tạo danh mục mới
        </Button>
      )}
    </div>
  );
}
