import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Headphones, BookOpen } from 'lucide-react';
import type { CategoryType } from '../types';

interface CategoryTabsProps {
  activeTab: CategoryType;
  onTabChange: (tab: CategoryType) => void;
  examCount: number;
  podcastCount: number;
  bookCount: number;
  children: ReactNode;
}

export function CategoryTabs({
  activeTab,
  onTabChange,
  examCount,
  podcastCount,
  bookCount,
  children,
}: CategoryTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as CategoryType)} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="exam" className="gap-2">
          <FileText className="w-4 h-4" />
          Đề thi ({examCount})
        </TabsTrigger>
        <TabsTrigger value="podcast" className="gap-2">
          <Headphones className="w-4 h-4" />
          Podcast ({podcastCount})
        </TabsTrigger>
        <TabsTrigger value="book" className="gap-2">
          <BookOpen className="w-4 h-4" />
          Sách ({bookCount})
        </TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab}>
        {children}
      </TabsContent>
    </Tabs>
  );
}
