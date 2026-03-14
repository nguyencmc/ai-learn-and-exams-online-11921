import { lazy } from "react";
import { Route } from "react-router-dom";

const Index = lazy(() => import("@/pages/Index"));
const Courses = lazy(() => import("@/pages/Courses"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const CourseViewer = lazy(() => import("@/pages/CourseViewer"));
const Exams = lazy(() => import("@/pages/Exams"));
const ExamCategoryDetail = lazy(() => import("@/pages/ExamCategoryDetail"));
const ExamDetail = lazy(() => import("@/pages/ExamDetail"));
const ExamTaking = lazy(() => import("@/pages/ExamTaking"));
const ExamHistory = lazy(() => import("@/pages/ExamHistory"));
const AttemptDetail = lazy(() => import("@/pages/AttemptDetail"));
const Podcasts = lazy(() => import("@/pages/Podcasts"));
const PodcastDetail = lazy(() => import("@/pages/PodcastDetail"));
const Books = lazy(() => import("@/pages/Books"));
const BookDetail = lazy(() => import("@/pages/BookDetail"));
const BookReader = lazy(() => import("@/pages/BookReader"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Settings = lazy(() => import("@/pages/Settings"));
const StudentDashboard = lazy(() => import("@/pages/StudentDashboard"));
const MyCourses = lazy(() => import("@/pages/MyCourses"));
const Achievements = lazy(() => import("@/pages/Achievements"));
const StudyGroups = lazy(() => import("@/pages/StudyGroups"));
const StudyGroupDetail = lazy(() => import("@/pages/StudyGroupDetail"));
const VerifyCertificate = lazy(() => import("@/pages/VerifyCertificate"));
const InstructorProfile = lazy(() => import("@/pages/InstructorProfile"));

export const coreRoutes = (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/courses" element={<Courses />} />
    <Route path="/course/:id" element={<CourseDetail />} />
    <Route path="/course/:id/learn" element={<CourseViewer />} />
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
  </>
);
