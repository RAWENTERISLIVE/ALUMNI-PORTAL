import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import * as Pages from '.';

const AppRoutes = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<ProtectedRoute requireAuth={false}><Pages.HomePage /></ProtectedRoute>} />
      <Route path="/login" element={<ProtectedRoute requireAuth={false}><Pages.LoginPage /></ProtectedRoute>} />
      <Route path="/register" element={<ProtectedRoute requireAuth={false}><Pages.RegisterPage /></ProtectedRoute>} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute requireAuth={true}><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Pages.DashboardPage />} />
        <Route path="/profile" element={<Pages.ProfilePage />} />
        <Route path="/directory" element={<Pages.DirectoryPage />} />
        <Route path="/directory/profile/:id" element={<Pages.ProfilePage />} />
        <Route path="/connections" element={<Pages.ConnectionsPage />} />
        <Route path="/posts" element={<Pages.PostsPage />} />
        <Route path="/groups" element={<Pages.GroupsPage />} />
        <Route path="/mentorship" element={<Pages.MentorshipPage />} />
        <Route path="/jobs" element={<Pages.JobsPage />} />
        <Route path="/events" element={<Pages.EventsPage />} />
        <Route path="/settings" element={<Pages.SettingsPage />} />
        <Route path="/admin" element={<Pages.AdminPage />} />
        <Route path="/analytics" element={<Pages.AnalyticsPage />} />
      </Route>

      {/* 404 route */}
      <Route path="*" element={<Pages.NotFound />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
