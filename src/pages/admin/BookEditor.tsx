import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowLeft, Save } from 'lucide-react';
import {
    useBookEditor,
    BookBasicInfo,
    BookCoverUpload,
    BookContent,
    BookChapters,
} from '@/features/bookEditor';

const BookEditor = () => {
    const {
        isEditing,
        loading,
        saving,
        uploadingCover,
        roleLoading,
        hasAccess,
        coverInputRef,

        title,
        slug,
        description,
        authorName,
        categoryId,
        difficulty,
        pageCount,
        coverUrl,
        content,
        chapters,
        categories,

        setSlug,
        setDescription,
        setAuthorName,
        setCategoryId,
        setDifficulty,
        setPageCount,
        setCoverUrl,
        setContent,

        handleTitleChange,
        handleCoverUpload,
        addChapter,
        updateChapter,
        removeChapter,
        handleSave,
    } = useBookEditor();

    if (roleLoading || loading) {
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

    if (!hasAccess) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/books">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                                <BookOpen className="w-8 h-8 text-emerald-500" />
                                {isEditing ? 'Chỉnh sửa sách' : 'Thêm sách mới'}
                            </h1>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        <Save className="w-4 h-4" />
                        {saving ? 'Đang lưu...' : 'Lưu sách'}
                    </Button>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    <BookBasicInfo
                        title={title}
                        slug={slug}
                        authorName={authorName}
                        description={description}
                        categoryId={categoryId}
                        difficulty={difficulty}
                        pageCount={pageCount}
                        categories={categories}
                        onTitleChange={handleTitleChange}
                        onSlugChange={setSlug}
                        onAuthorNameChange={setAuthorName}
                        onDescriptionChange={setDescription}
                        onCategoryIdChange={setCategoryId}
                        onDifficultyChange={setDifficulty}
                        onPageCountChange={setPageCount}
                    />

                    <BookCoverUpload
                        coverUrl={coverUrl}
                        uploadingCover={uploadingCover}
                        coverInputRef={coverInputRef}
                        onCoverUpload={handleCoverUpload}
                        onCoverUrlChange={setCoverUrl}
                    />

                    <BookContent
                        content={content}
                        onContentChange={setContent}
                    />

                    <BookChapters
                        chapters={chapters}
                        onAddChapter={addChapter}
                        onUpdateChapter={updateChapter}
                        onRemoveChapter={removeChapter}
                    />
                </div>
            </main>
        </div>
    );
};

export default BookEditor;
