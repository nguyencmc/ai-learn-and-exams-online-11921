import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { ErrorBoundary } from "@/components/layouts/ErrorBoundary";
import { MiniPlayer } from "@/components/podcast/MiniPlayer";
import {
  coreRoutes,
  practiceRoutes,
  flashcardRoutes,
  classroomRoutes,
  articleRoutes,
  adminRoutes,
} from "@/routes";

const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MainLayout = lazy(() => import("./components/layouts/MainLayout"));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      <p className="mt-2 text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Auth route - outside MainLayout */}
            <Route path="/auth" element={<Auth />} />

            {/* All other routes wrapped in MainLayout */}
            <Route element={<MainLayout />}>
              {coreRoutes}
              {practiceRoutes}
              {flashcardRoutes}
              {classroomRoutes}
              {articleRoutes}
              {adminRoutes}

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <MiniPlayer />
    </BrowserRouter>
  </AppProviders>
);

export default App;
