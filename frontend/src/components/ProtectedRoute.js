import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin }) {
  const { isAuthenticated, isAdmin, isScorer } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (!isScorer) return <Navigate to="/login" replace />;
  return children;
}
