import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/shared/layout/MainLayout";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/components/theme-provider";
import { PWAInstallBanner } from "@/components/mobile/InstallPrompt";
import { HelmetProvider } from "react-helmet-async";
// Public Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/AuthPages/LoginPage";
import RegisterPage from "./pages/AuthPages/RegisterPage";
import ForgotPasswordPage from "./pages/AuthPages/ForgotPasswordPage";
import PublicInfoPage from "./pages/PublicInfoPage";
import NotFound from "./pages/NotFound";

// Protected Pages
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import DirectoryPage from "./pages/DirectoryPage";
import PostsPage from "./pages/PostsPage";
import GroupsPage from "./pages/GroupsPage";
import MentorshipPage from "./pages/MentorshipPage";
import JobsPage from "./pages/JobsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import EventsPage from "./pages/EventsPage";
import MessagesPage from "./pages/MessagesPage";

import { GlobalErrorBoundary, NetworkStatusManager } from "@/components/NetworkStatusManager";

import { useEffect } from "react";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Mobile/PWA init logic can go here if needed later
  }, []);

  return (
    <HelmetProvider>
      <GlobalErrorBoundary>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <NetworkStatusManager>
            <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PWAInstallBanner />
            <BrowserRouter>
              <AuthProvider>
                <NotificationProvider>
                  <Routes>
                  {/* Public routes */}
                  <Route path="/" element={
                    <ProtectedRoute requireAuth={false}>
                      <HomePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/login" element={
                    <ProtectedRoute requireAuth={false}>
                      <LoginPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/register" element={
                    <ProtectedRoute requireAuth={false}>
                      <RegisterPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/forgot-password" element={
                    <ProtectedRoute requireAuth={false}>
                      <ForgotPasswordPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/about" element={<PublicInfoPage pageKey="about" />} />
                  <Route path="/news" element={<PublicInfoPage pageKey="news" />} />
                  <Route path="/donate" element={<PublicInfoPage pageKey="donate" />} />
                  <Route path="/privacy" element={<PublicInfoPage pageKey="privacy" />} />
                  <Route path="/terms" element={<PublicInfoPage pageKey="terms" />} />
                  <Route path="/contact" element={<PublicInfoPage pageKey="contact" />} />

                  {/* Protected routes with layout */}
                  <Route element={
                    <ProtectedRoute requireAuth={true}>
                      <MainLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/directory" element={<DirectoryPage />} />
                    <Route path="/directory/profile/:id" element={<ProfilePage />} />
                    <Route path="/posts" element={<PostsPage />} />
                    <Route path="/groups" element={<GroupsPage />} />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/mentorship" element={<MentorshipPage />} />
                    <Route path="/jobs" element={<JobsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                  </Route>

                  {/* 404 route */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                </NotificationProvider>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
            </QueryClientProvider>
          </NetworkStatusManager>
        </ThemeProvider>
      </GlobalErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
