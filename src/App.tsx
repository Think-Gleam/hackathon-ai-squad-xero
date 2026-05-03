import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { OnboardingGate, ProtectedRoute, PublicOnlyRoute } from "@/components/auth/RouteGuards";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import AiTutorPage from "./pages/AiTutorPage";
import AuthLoginPage from "./pages/AuthLoginPage";
import AuthSignupPage from "./pages/AuthSignupPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CoursesPage from "./pages/CoursesPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import MyLearningPage from "./pages/MyLearningPage";
import OnboardingPage from "./pages/OnboardingPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/auth/login"
              element={
                <PublicOnlyRoute>
                  <AuthLoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/auth/signup"
              element={
                <PublicOnlyRoute>
                  <AuthSignupPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/auth/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPasswordPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

            <Route
              path="/onboarding"
              element={
                <OnboardingGate>
                  <OnboardingPage />
                </OnboardingGate>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/my-learning" element={<MyLearningPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:courseSlug" element={<CourseDetailPage />} />
              <Route path="/ai-tutor" element={<AiTutorPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
