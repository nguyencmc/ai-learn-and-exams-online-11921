import { lazy } from "react";
import { Route } from "react-router-dom";

const QuestionBankPage = lazy(() => import("@/features/practice/pages/QuestionBankPage"));
const PracticeSetup = lazy(() => import("@/features/practice/pages/PracticeSetup"));
const PracticeRunner = lazy(() => import("@/features/practice/pages/PracticeRunner"));
const ExamSetup = lazy(() => import("@/features/practice/pages/ExamSetup"));
const ExamRunner = lazy(() => import("@/features/practice/pages/ExamRunner"));
const ExamResult = lazy(() => import("@/features/practice/pages/ExamResult"));
const ReviewWrongRunner = lazy(() => import("@/features/practice/pages/ReviewWrongRunner"));
const MyPracticeSetsPage = lazy(() => import("@/features/practice/pages/MyPracticeSetsPage"));
const PracticeEditorPage = lazy(() => import("@/features/practice/pages/PracticeEditorPage"));

export const practiceRoutes = (
  <>
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
  </>
);
