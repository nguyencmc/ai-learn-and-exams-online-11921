import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Save, X } from 'lucide-react';
import type { BaseCategory, CategoryType, CategoryFormData } from '../types';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: CategoryType;
  editingCategory: BaseCategory | null;
  formData: CategoryFormData;
  onFormDataChange: (data: CategoryFormData) => void;
  onSave: () => void;
  saving: boolean;
  generateSlug: (name: string) => string;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  activeTab,
  editingCategory,
  formData,
  onFormDataChange,
  onSave,
  saving,
  generateSlug,
}: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'exam' ? 'Danh mục đề thi' : activeTab === 'podcast' ? 'Danh mục Podcast' : 'Danh mục Sách'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên danh mục *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                onFormDataChange({
                  ...formData,
                  name: e.target.value,
                  slug: editingCategory ? formData.slug : generateSlug(e.target.value),
                });
              }}
              placeholder="VD: Toán học"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => onFormDataChange({ ...formData, slug: e.target.value })}
              placeholder="vd: toan-hoc"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              placeholder="Mô tả ngắn về danh mục..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon_url">URL Icon</Label>
            <Input
              id="icon_url"
              value={formData.icon_url}
              onChange={(e) => onFormDataChange({ ...formData, icon_url: e.target.value })}
              placeholder="https://example.com/icon.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Thứ tự hiển thị</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) => onFormDataChange({ ...formData, display_order: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_featured">Đánh dấu nổi bật</Label>
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => onFormDataChange({ ...formData, is_featured: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Hủy
          </Button>
          <Button onClick={onSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
