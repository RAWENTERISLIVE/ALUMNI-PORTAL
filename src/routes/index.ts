import { lazy } from 'react';

// Public Pages
export const HomePage = lazy(() => import('@/pages/HomePage'));
export const LoginPage = lazy(() => import('@/pages/AuthPages/LoginPage'));
export const RegisterPage = lazy(() => import('@/pages/AuthPages/RegisterPage'));
export const NotFound = lazy(() => import('@/pages/NotFound'));

// Protected Pages
export const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
export const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
export const DirectoryPage = lazy(() => import('@/pages/DirectoryPage'));
export const ConnectionsPage = lazy(() => import('@/pages/ConnectionsPage'));
export const PostsPage = lazy(() => import('@/pages/PostsPage'));
export const GroupsPage = lazy(() => import('@/pages/GroupsPage'));
export const MentorshipPage = lazy(() => import('@/pages/MentorshipPage'));
export const JobsPage = lazy(() => import('@/pages/JobsPage'));
export const EventsPage = lazy(() => import('@/pages/EventsPage'));
export const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
export const AdminPage = lazy(() => import('@/pages/AdminPage'));
export const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
