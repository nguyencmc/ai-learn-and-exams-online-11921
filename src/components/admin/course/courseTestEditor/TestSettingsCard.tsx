import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';
import type { CourseTest } from './types';

interface TestSettingsCardProps {
  test: CourseTest;
  onTestChange: (updater: (prev: CourseTest) => CourseTest) => void;
}

export const TestSettingsCard = ({ test, onTestChange }: TestSettingsCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Cài đặt bài test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tên bài test</Label>
            <Input
              value={test.title}
              onChange={(e) => onTestChange(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Tên bài test"
            />
          </div>
          <div className="space-y-2">
            <Label>Thời gian (phút)</Label>
            <Input
              type="number"
              value={test.duration_minutes}
              onChange={(e) => onTestChange(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Điểm đạt (%)</Label>
            <Input
              type="number"
              value={test.pass_percentage}
              onChange={(e) => onTestChange(prev => ({ ...prev, pass_percentage: parseInt(e.target.value) || 70 }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Số lần làm tối đa</Label>
            <Input
              type="number"
              value={test.max_attempts}
              onChange={(e) => onTestChange(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 3 }))}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch
              checked={test.is_required}
              onCheckedChange={(checked) => onTestChange(prev => ({ ...prev, is_required: checked }))}
            />
            <Label>Bắt buộc hoàn thành</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Mô tả</Label>
          <Textarea
            value={test.description || ''}
            onChange={(e) => onTestChange(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Mô tả về bài test..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
};
