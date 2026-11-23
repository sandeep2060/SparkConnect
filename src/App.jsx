import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';

// Route Guard
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupWizard from './pages/SignupWizard';
import VerifyPendingPage from './pages/VerifyPendingPage';
import VerifyIdPage from './pages/VerifyIdPage';
import NotFoundPage from './pages/NotFoundPage';

// Authenticated App Pages
import FeedPage from './pages/FeedPage';
import DiscoverPage from './pages/DiscoverPage';
import MapPage from './pages/MapPage';
import ProfileDetailPage from './pages/ProfileDetailPage';
import MyProfilePage from './pages/MyProfilePage';
import ChatsPage from './pages/ChatsPage';
import EditProfilePage from './pages/EditProfilePage';
import SettingsPage from './pages/SettingsPage';

// Admin Moderation Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminVerifyQueuePage from './pages/admin/AdminVerifyQueuePage';

export function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupWizard />} />
        <Route path="/verify" element={<VerifyPendingPage />} />
        <Route path="/verify-id" element={<VerifyIdPage />} />
      </Route>

      {/* Authenticated Member App */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FeedPage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="profile/:id" element={<ProfileDetailPage />} />
        <Route path="profile/me" element={<MyProfilePage />} />
        <Route path="profile/edit" element={<EditProfilePage />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="chats/:id" element={<ChatsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Administrative Control Panel */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:id" element={<AdminUserDetailPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="verify" element={<AdminVerifyQueuePage />} />
      </Route>

      {/* 404 Unknown Routes */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
