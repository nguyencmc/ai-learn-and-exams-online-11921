import { lazy } from "react";
import { Route } from "react-router-dom";

const ClassListPage = lazy(() => import("@/features/classroom/pages/ClassListPage"));
const CreateClassPage = lazy(() => import("@/features/classroom/pages/CreateClassPage"));
const JoinClassPage = lazy(() => import("@/features/classroom/pages/JoinClassPage"));
const ClassDetailPage = lazy(() => import("@/features/classroom/pages/ClassDetailPage"));

export const classroomRoutes = (
  <>
    <Route path="/classes" element={<ClassListPage />} />
    <Route path="/classes/new" element={<CreateClassPage />} />
    <Route path="/classes/join" element={<JoinClassPage />} />
    <Route path="/classes/:classId" element={<ClassDetailPage />} />
  </>
);
