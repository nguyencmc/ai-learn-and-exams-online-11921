import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Plus, FileQuestion, Globe, TrendingUp } from 'lucide-react';
import { OverviewTab } from '../components/OverviewTab';
import { MySetsTab } from '../components/MySetsTab';
import { PublicSetsTab } from '../components/PublicSetsTab';

export default function QuestionBankPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get('tab') || 'overview';

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              Luyện tập
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý bộ đề, luyện tập và theo dõi tiến độ
            </p>
          </div>
          {user && (
            <Button onClick={() => navigate('/practice/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo bộ đề mới
            </Button>
          )}
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview" className="gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="my-sets" className="gap-1.5">
              <FileQuestion className="h-4 w-4" />
              Của tôi
            </TabsTrigger>
            <TabsTrigger value="public" className="gap-1.5">
              <Globe className="h-4 w-4" />
              Kho đề
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="my-sets">
            <MySetsTab />
          </TabsContent>

          <TabsContent value="public">
            <PublicSetsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
