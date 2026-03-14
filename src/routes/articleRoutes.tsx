import { lazy } from "react";
import { Route } from "react-router-dom";

const ArticlesListPage = lazy(() => import("@/features/articles/pages/ArticlesListPage"));
const ArticleDetailPage = lazy(() => import("@/features/articles/pages/ArticleDetailPage"));
const ArticleEditorPage = lazy(() => import("@/features/articles/pages/ArticleEditorPage"));
const MyArticlesPage = lazy(() => import("@/features/articles/pages/MyArticlesPage"));
const ArticlePreviewPage = lazy(() => import("@/features/articles/pages/ArticlePreviewPage"));

export const articleRoutes = (
  <>
    <Route path="/articles" element={<ArticlesListPage />} />
    <Route path="/articles/my" element={<MyArticlesPage />} />
    <Route path="/articles/create" element={<ArticleEditorPage />} />
    <Route path="/articles/edit/:slug" element={<ArticleEditorPage />} />
    <Route path="/articles/:slug" element={<ArticleDetailPage />} />
    <Route path="/articles/preview/:id" element={<ArticlePreviewPage />} />
  </>
);
