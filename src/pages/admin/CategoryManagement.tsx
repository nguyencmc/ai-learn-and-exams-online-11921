import {
  useCategoryManagement,
  CategoryManagementHeader,
  CategoryTabs,
  CategoryTable,
  CategoryFormDialog,
} from '@/features/categoryManagement';

const CategoryManagement = () => {
  const {
    activeTab,
    setActiveTab,
    loading,
    saving,
    dialogOpen,
    setDialogOpen,
    editingCategory,
    formData,
    setFormData,
    categories,
    examCategoryCount,
    podcastCategoryCount,
    bookCategoryCount,
    canView,
    canCreate,
    roleLoading,
    isAdmin,
    handleOpenCreate,
    handleOpenEdit,
    handleSave,
    handleDelete,
    generateSlug,
  } = useCategoryManagement();

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
        <CategoryManagementHeader
          isAdmin={isAdmin}
          canCreate={canCreate}
          onCreateClick={handleOpenCreate}
        />

        <CategoryTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          examCount={examCategoryCount}
          podcastCount={podcastCategoryCount}
          bookCount={bookCategoryCount}
        >
          <CategoryTable
            activeTab={activeTab}
            categories={categories}
            loading={loading}
            onCreateClick={handleOpenCreate}
            onEditClick={handleOpenEdit}
            onDeleteClick={handleDelete}
          />
        </CategoryTabs>
      </main>

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        activeTab={activeTab}
        editingCategory={editingCategory}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSave}
        saving={saving}
        generateSlug={generateSlug}
      />
    </div>
  );
};

export default CategoryManagement;
