import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';
import { QuestionSetCard } from './QuestionSetCard';
import { QuestionBankFilters } from './QuestionBankFilters';
import { useQuestionSets } from '../hooks/useQuestionSets';
import type { QuestionSet } from '../types';

export function PublicSetsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const { data: sets, isLoading } = useQuestionSets(
    levelFilter !== 'all' ? { level: levelFilter } : undefined,
  );

  const filteredSets = useMemo(
    () =>
      (sets || []).filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [sets, searchQuery],
  );

  return (
    <>
      <QuestionBankFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        levelFilter={levelFilter}
        onLevelChange={setLevelFilter}
        searchPlaceholder="Tìm kiếm bộ đề công khai..."
      />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && filteredSets.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-14 h-14 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-2">Không tìm thấy bộ đề</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'Thử thay đổi từ khóa tìm kiếm'
              : 'Hiện chưa có bộ đề công khai nào'}
          </p>
        </div>
      )}

      {!isLoading && filteredSets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSets.map((set) => (
            <QuestionSetCard key={set.id} set={set as QuestionSet} />
          ))}
        </div>
      )}
    </>
  );
}
