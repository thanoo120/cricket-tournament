import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import PublicDashboard from './pages/PublicDashboard';
import Fixtures from './pages/Fixtures';
import Leaderboard from './pages/Leaderboard';
import Scorecard from './pages/Scorecard';
import TournamentDetail from './pages/TournamentDetail';
import Teams from './pages/Teams';
import Players from './pages/Players';

// Auth
import Login from './pages/Login';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import Tournaments from './pages/Tournaments';
import AdminMatches from './pages/Matches';
import LiveScoring from './pages/LiveScoring';
import LiveMatchView from './pages/LiveMatchView';

import './App.css';

function PublicLayout({ children }) {
  return <Layout isAdmin={false}>{children}</Layout>;
}

function AdminLayout({ children }) {
  return <Layout isAdmin={true}>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* ===== PUBLIC ROUTES ===== */}
          <Route path="/dashboard" element={<PublicLayout><PublicDashboard /></PublicLayout>} />
          <Route path="/fixtures" element={<PublicLayout><Fixtures /></PublicLayout>} />
          <Route path="/tournaments/:id" element={<PublicLayout><TournamentDetail /></PublicLayout>} />
          <Route path="/tournaments/:id/teams" element={<PublicLayout><Teams readOnly /></PublicLayout>} />
          <Route path="/tournaments/:id/players" element={<PublicLayout><Players readOnly /></PublicLayout>} />
          <Route path="/tournaments/:id/leaderboard" element={<PublicLayout><Leaderboard /></PublicLayout>} />
          <Route path="/matches/:id/scorecard" element={<PublicLayout><Scorecard /></PublicLayout>} />
          <Route path="/matches/:id/live" element={<PublicLayout><LiveMatchView /></PublicLayout>} />

          {/* ===== ADMIN ROUTES (protected) ===== */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/admin/tournaments" element={
            <ProtectedRoute requireAdmin><AdminLayout><Tournaments /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/admin/tournaments/:id" element={
            <ProtectedRoute><AdminLayout><TournamentDetail admin /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/admin/tournaments/:id/teams" element={
            <ProtectedRoute requireAdmin><AdminLayout><Teams /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/admin/tournaments/:id/players" element={
            <ProtectedRoute requireAdmin><AdminLayout><Players /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/admin/tournaments/:id/matches" element={
            <ProtectedRoute><AdminLayout><AdminMatches /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/admin/tournaments/:id/leaderboard" element={
            <ProtectedRoute><AdminLayout><Leaderboard /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/admin/scorer" element={
            <ProtectedRoute><AdminLayout><LiveScoring /></AdminLayout></ProtectedRoute>
          } />
          <Route path="/admin/matches/:id/score" element={
            <ProtectedRoute><AdminLayout><LiveScoring /></AdminLayout></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
