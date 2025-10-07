import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";

// Public Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/AuthPages/LoginPage";
import RegisterPage from "./pages/AuthPages/RegisterPage";
import NotFound from "./pages/NotFound";

// Protected Pages
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import DirectoryPage from "./pages/DirectoryPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import PostsPage from "./pages/PostsPage";
import GroupsPage from "./pages/GroupsPage";
import MentorshipPage from "./pages/MentorshipPage";
import JobsPage from "./pages/JobsPage";
import EventsPage from "./pages/EventsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import AnalyticsPage from "./pages/AnalyticsPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
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
                <Route path="/connections" element={<ConnectionsPage />} />
                <Route path="/posts" element={<PostsPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/mentorship" element={<MentorshipPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
              </Route>

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
