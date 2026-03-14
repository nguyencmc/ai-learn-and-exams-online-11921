import { lazy } from "react";
import { Route } from "react-router-dom";

const ArticleModerationPage = lazy(() => import("@/features/articles/pages/ArticleModerationPage"));

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const TeacherDashboard = lazy(() => import("@/pages/admin/TeacherDashboard"));
const ExamManagement = lazy(() => import("@/pages/admin/ExamManagement"));
const ExamEditor = lazy(() => import("@/pages/admin/ExamEditor"));
const FlashcardManagement = lazy(() => import("@/pages/admin/FlashcardManagement"));
const FlashcardEditor = lazy(() => import("@/pages/admin/FlashcardEditor"));
const PodcastManagement = lazy(() => import("@/pages/admin/PodcastManagement"));
const PodcastEditor = lazy(() => import("@/pages/admin/PodcastEditor"));
const BookManagement = lazy(() => import("@/pages/admin/BookManagement"));
const BookEditor = lazy(() => import("@/pages/admin/BookEditor"));
const CategoryManagement = lazy(() => import("@/pages/admin/CategoryManagement"));
const UserManagement = lazy(() => import("@/pages/admin/UserManagement"));
const CourseManagement = lazy(() => import("@/pages/admin/CourseManagement"));
const CourseEditor = lazy(() => import("@/pages/admin/CourseEditor"));
const QuestionSetManagement = lazy(() => import("@/pages/admin/QuestionSetManagement"));
const QuestionSetEditor = lazy(() => import("@/pages/admin/QuestionSetEditor"));
const PermissionManagement = lazy(() => import("@/pages/admin/PermissionManagement"));
const AuditLogs = lazy(() => import("@/pages/admin/AuditLogs"));

export const adminRoutes = (
  <>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/articles" element={<ArticleModerationPage />} />
    <Route path="/teacher" element={<TeacherDashboard />} />
    <Route path="/admin/users" element={<UserManagement />} />
    <Route path="/admin/permissions" element={<PermissionManagement />} />
    <Route path="/admin/audit-logs" element={<AuditLogs />} />
    <Route path="/admin/categories" element={<CategoryManagement />} />
    <Route path="/admin/exams" element={<ExamManagement />} />
    <Route path="/admin/exams/create" element={<ExamEditor />} />
    <Route path="/admin/exams/:id" element={<ExamEditor />} />
    <Route path="/admin/flashcards" element={<FlashcardManagement />} />
    <Route path="/admin/flashcards/create" element={<FlashcardEditor />} />
    <Route path="/admin/flashcards/:id" element={<FlashcardEditor />} />
    <Route path="/admin/podcasts" element={<PodcastManagement />} />
    <Route path="/admin/podcasts/create" element={<PodcastEditor />} />
    <Route path="/admin/podcasts/:id" element={<PodcastEditor />} />
    <Route path="/admin/books" element={<BookManagement />} />
    <Route path="/admin/books/create" element={<BookEditor />} />
    <Route path="/admin/books/:id" element={<BookEditor />} />
    <Route path="/admin/courses" element={<CourseManagement />} />
    <Route path="/admin/courses/create" element={<CourseEditor />} />
    <Route path="/admin/courses/:id" element={<CourseEditor />} />
    <Route path="/admin/question-sets" element={<QuestionSetManagement />} />
    <Route path="/admin/question-sets/create" element={<QuestionSetEditor />} />
    <Route path="/admin/question-sets/:id" element={<QuestionSetEditor />} />
  </>
);
