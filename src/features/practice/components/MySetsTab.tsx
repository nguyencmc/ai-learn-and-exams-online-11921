import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileQuestion, Plus } from 'lucide-react';
import { QuestionSetCard } from './QuestionSetCard';
import { QuestionBankFilters } from './QuestionBankFilters';
import { DeleteSetDialog } from './DeleteSetDialog';
import { useMySets } from '../hooks/useMySets';

export function MySetsTab() {
  const navigate = useNavigate();
  const {
    user,
    sets,
    loading,
    filteredSets,
    searchQuery,
    setSearchQuery,
    levelFilter,
    setLevelFilter,
    deleteId,
    setDeleteId,
    deleting,
    togglePublish,
    handleDelete,
  } = useMySets();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Đăng nhập để quản lý bộ đề của bạn</p>
        <Button onClick={() => navigate('/auth')}>Đăng nhập</Button>
      </div>
    );
  }

  return (
    <>
      {/* Stats row */}
      {!loading && sets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Tổng số bộ đề', value: sets.length, color: 'text-foreground' },
            {
              label: 'Tổng câu hỏi',
              value: sets.reduce((a, s) => a + (s.question_count || 0), 0),
              color: 'text-foreground',
            },
            {
              label: 'Đã công khai',
              value: sets.filter((s) => s.is_published).length,
              color: 'text-green-600',
            },
            {
              label: 'Riêng tư',
              value: sets.filter((s) => !s.is_published).length,
              color: 'text-muted-foreground',
            },
          ].map(({ label, value, color }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="p-4">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <p className="text-sm text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <QuestionBankFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        levelFilter={levelFilter}
        onLevelChange={setLevelFilter}
      >
        <Button onClick={() => navigate('/practice/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo bộ đề
        </Button>
      </QuestionBankFilters>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filteredSets.length === 0 && (
        <div className="text-center py-12">
          <FileQuestion className="w-14 h-14 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || levelFilter !== 'all' ? 'Không tìm thấy bộ đề' : 'Chưa có bộ đề nào'}
          </h3>
          <p className="text-muted-foreground mb-5 text-sm">
            {searchQuery || levelFilter !== 'all'
              ? 'Thử thay đổi từ khóa hoặc bộ lọc'
              : 'Tạo bộ đề đầu tiên để bắt đầu luyện tập'}
          </p>
          {!searchQuery && levelFilter === 'all' && (
            <Button onClick={() => navigate('/practice/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo bộ đề đầu tiên
            </Button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && filteredSets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSets.map((set) => (
            <QuestionSetCard
              key={set.id}
              set={set}
              isOwner
              onEdit={() => navigate(`/practice/edit/${set.id}`)}
              onDelete={() => setDeleteId(set.id)}
              onTogglePublish={() => togglePublish(set)}
            />
          ))}
        </div>
      )}

      <DeleteSetDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </>
  );
}
