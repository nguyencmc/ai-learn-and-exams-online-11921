import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { MiniPlayerProvider } from "@/contexts/MiniPlayerContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MiniPlayer } from "@/components/podcast/MiniPlayer";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const CourseViewer = lazy(() => import("./pages/CourseViewer"));
const Exams = lazy(() => import("./pages/Exams"));
const Podcasts = lazy(() => import("./pages/Podcasts"));
const PodcastDetail = lazy(() => import("./pages/PodcastDetail"));
const Books = lazy(() => import("./pages/Books"));
const BookDetail = lazy(() => import("./pages/BookDetail"));
const BookReader = lazy(() => import("./pages/BookReader"));
const ExamCategoryDetail = lazy(() => import("./pages/ExamCategoryDetail"));
const ExamDetail = lazy(() => import("./pages/ExamDetail"));
const ExamTaking = lazy(() => import("./pages/ExamTaking"));
const ExamHistory = lazy(() => import("./pages/ExamHistory"));
const AttemptDetail = lazy(() => import("./pages/AttemptDetail"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin & Teacher pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const TeacherDashboard = lazy(() => import("./pages/admin/TeacherDashboard"));
const ExamManagement = lazy(() => import("./pages/admin/ExamManagement"));
const ExamEditor = lazy(() => import("./pages/admin/ExamEditor"));
const FlashcardManagement = lazy(() => import("./pages/admin/FlashcardManagement"));
const FlashcardEditor = lazy(() => import("./pages/admin/FlashcardEditor"));
const PodcastManagement = lazy(() => import("./pages/admin/PodcastManagement"));
const PodcastEditor = lazy(() => import("./pages/admin/PodcastEditor"));
const BookManagement = lazy(() => import("./pages/admin/BookManagement"));
const BookEditor = lazy(() => import("./pages/admin/BookEditor"));
const CategoryManagement = lazy(() => import("./pages/admin/CategoryManagement"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const CourseManagement = lazy(() => import("./pages/admin/CourseManagement"));
const CourseEditor = lazy(() => import("./pages/admin/CourseEditor"));
const QuestionSetManagement = lazy(() => import("./pages/admin/QuestionSetManagement"));
const QuestionSetEditor = lazy(() => import("./pages/admin/QuestionSetEditor"));
const PermissionManagement = lazy(() => import("./pages/admin/PermissionManagement"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const Achievements = lazy(() => import("./pages/Achievements"));
const StudyGroups = lazy(() => import("./pages/StudyGroups"));
const StudyGroupDetail = lazy(() => import("./pages/StudyGroupDetail"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const InstructorProfile = lazy(() => import("./pages/InstructorProfile"));
const MyCourses = lazy(() => import("./pages/MyCourses"));

// Practice feature pages
const QuestionBankPage = lazy(() => import("./features/practice/pages/QuestionBankPage"));
const PracticeSetup = lazy(() => import("./features/practice/pages/PracticeSetup"));
const PracticeRunner = lazy(() => import("./features/practice/pages/PracticeRunner"));
const ExamSetup = lazy(() => import("./features/practice/pages/ExamSetup"));
const ExamRunner = lazy(() => import("./features/practice/pages/ExamRunner"));
const ExamResult = lazy(() => import("./features/practice/pages/ExamResult"));
const ReviewWrongRunner = lazy(() => import("./features/practice/pages/ReviewWrongRunner"));
const MyPracticeSetsPage = lazy(() => import("./features/practice/pages/MyPracticeSetsPage"));
const PracticeEditorPage = lazy(() => import("./features/practice/pages/PracticeEditorPage"));

// Flashcards feature pages
const DeckListPage = lazy(() => import("./features/flashcards/pages/DeckListPage"));
const DeckDetailPage = lazy(() => import("./features/flashcards/pages/DeckDetailPage"));
const StudyDeckPage = lazy(() => import("./features/flashcards/pages/StudyDeckPage"));

// Classroom feature pages
const ClassListPage = lazy(() => import("./features/classroom/pages/ClassListPage"));
const CreateClassPage = lazy(() => import("./features/classroom/pages/CreateClassPage"));
const JoinClassPage = lazy(() => import("./features/classroom/pages/JoinClassPage"));
const ClassDetailPage = lazy(() => import("./features/classroom/pages/ClassDetailPage"));
const TodayPage = lazy(() => import("./features/flashcards/pages/TodayPage"));

// Articles feature pages
const ArticlesListPage = lazy(() => import("./features/articles/pages/ArticlesListPage"));
const ArticleDetailPage = lazy(() => import("./features/articles/pages/ArticleDetailPage"));
const ArticleEditorPage = lazy(() => import("./features/articles/pages/ArticleEditorPage"));
const MyArticlesPage = lazy(() => import("./features/articles/pages/MyArticlesPage"));
const ArticleModerationPage = lazy(() => import("./features/articles/pages/ArticleModerationPage"));
const ArticlePreviewPage = lazy(() => import("./features/articles/pages/ArticlePreviewPage"));

// Layout
const MainLayout = lazy(() => import("./components/layouts/MainLayout"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      <p className="mt-2 text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes (garbage collection)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <AuthProvider>
          <PermissionsProvider>
            <MiniPlayerProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                    {/* Auth route - outside MainLayout */}
                    <Route path="/auth" element={<Auth />} />

                    {/* All other routes wrapped in MainLayout */}
                    <Route element={<MainLayout />}>
                      <Route path="/" element={<Index />} />
                      <Route path="/courses" element={<Courses />} />
                      <Route path="/course/:id" element={<CourseDetail />} />
                      <Route path="/course/:id/learn" element={<CourseViewer />} />
                      {/* Old flashcards route removed - now using DeckListPage at /flashcards */}
                      <Route path="/podcasts" element={<Podcasts />} />
                      <Route path="/podcast/:slug" element={<PodcastDetail />} />
                      <Route path="/exams" element={<Exams />} />
                      <Route path="/exams/:slug" element={<ExamCategoryDetail />} />
                      <Route path="/books" element={<Books />} />
                      <Route path="/book/:slug" element={<BookDetail />} />
                      <Route path="/book/:slug/read" element={<BookReader />} />
                      <Route path="/exam/:slug" element={<ExamDetail />} />
                      <Route path="/exam/:slug/take" element={<ExamTaking />} />
                      <Route path="/history" element={<ExamHistory />} />
                      <Route path="/history/:attemptId" element={<AttemptDetail />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/dashboard" element={<StudentDashboard />} />
                      <Route path="/my-courses" element={<MyCourses />} />
                      <Route path="/achievements" element={<Achievements />} />
                      <Route path="/study-groups" element={<StudyGroups />} />
                      <Route path="/study-groups/:groupId" element={<StudyGroupDetail />} />
                      <Route path="/@:username" element={<UserProfile />} />
                      <Route path="/verify-certificate/:certificateNumber" element={<VerifyCertificate />} />
                      <Route path="/instructor/:instructorId" element={<InstructorProfile />} />

                      {/* Practice feature routes */}
                      <Route path="/practice" element={<QuestionBankPage />} />
                      <Route path="/practice/question-bank" element={<QuestionBankPage />} />
                      <Route path="/practice/my-sets" element={<MyPracticeSetsPage />} />
                      <Route path="/practice/create" element={<PracticeEditorPage />} />
                      <Route path="/practice/edit/:id" element={<PracticeEditorPage />} />
                      <Route path="/practice/setup/:setId" element={<PracticeSetup />} />
                      <Route path="/practice/run/:setId" element={<PracticeRunner />} />
                      <Route path="/practice/exam-setup/:setId" element={<ExamSetup />} />
                      <Route path="/practice/exam/:setId" element={<ExamRunner />} />
                      <Route path="/practice/result/:sessionId" element={<ExamResult />} />
                      <Route path="/practice/review" element={<ReviewWrongRunner />} />

                      {/* Flashcards feature routes */}
                      <Route path="/flashcards" element={<DeckListPage />} />
                      <Route path="/flashcards/decks/:deckId" element={<DeckDetailPage />} />
                      <Route path="/flashcards/study/:deckId" element={<StudyDeckPage />} />
                      <Route path="/flashcards/today" element={<TodayPage />} />

                      {/* Classroom feature routes */}
                      <Route path="/classes" element={<ClassListPage />} />
                      <Route path="/classes/new" element={<CreateClassPage />} />
                      <Route path="/classes/join" element={<JoinClassPage />} />
                      <Route path="/classes/:classId" element={<ClassDetailPage />} />

                      {/* Articles feature routes */}
                      <Route path="/articles" element={<ArticlesListPage />} />
                      <Route path="/articles/my" element={<MyArticlesPage />} />
                      <Route path="/articles/create" element={<ArticleEditorPage />} />
                      <Route path="/articles/edit/:slug" element={<ArticleEditorPage />} />
                      <Route path="/articles/:slug" element={<ArticleDetailPage />} />
                      <Route path="/articles/preview/:id" element={<ArticlePreviewPage />} />

                      {/* Admin & Teacher routes */}
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

                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Route>
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
                <MiniPlayer />
              </BrowserRouter>
            </MiniPlayerProvider>
          </PermissionsProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
