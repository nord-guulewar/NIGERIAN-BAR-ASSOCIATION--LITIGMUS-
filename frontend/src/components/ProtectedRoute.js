import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DashboardLogoutButton from './DashboardLogoutButton';

const dashboardRoutes = {
  judge: '/judge-dashboard',
  registrar: '/registrar-dashboard',
  secretary: '/secretary-dashboard',
  clerk: '/clerk-dashboard',
  cashier: '/cashier-dashboard',
  accountant: '/accountant-dashboard',
  bailiff: '/bailiff-dashboard',
  admin: '/admin-dashboard',
  record_officer: '/records-dashboard',
  court_reporter: '/court-reporter-dashboard',
  usher: '/usher-dashboard',
  security: '/security-dashboard',
  librarian: '/librarian-dashboard',
  litigation: '/litigation-dashboard',
  prosecutor: '/prosecutor-dashboard',
  probate: '/probate-dashboard'
};

/**
 * Validates user authentication and role-based access
 * Redirects to appropriate dashboard if user doesn't have access
 */
export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const { isDarkMode } = useTheme();

  if (loading) return <div className={`route-loading-shell ${isDarkMode ? 'dark' : 'light'}`}>Loading...</div>;
  
  return user ? children : <Navigate to="/login" replace />;
}

/**
 * Validates user has specific role(s) to access a dashboard
 * Redirects to their correct role dashboard if unauthorized
 */
export function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const { isDarkMode } = useTheme();

  if (loading) return <div className={`route-loading-shell ${isDarkMode ? 'dark' : 'light'}`}>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is in allowed roles
  if (!allowedRoles.includes(user.role)) {
    const correctDashboard = dashboardRoutes[user.role] || '/';
    return <Navigate to={correctDashboard} replace />;
  }

  return (
    <>
      <DashboardLogoutButton />
      {children}
    </>
  );
}

export function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const { isDarkMode } = useTheme();
  
  if (loading) return <div className={`route-loading-shell ${isDarkMode ? 'dark' : 'light'}`}>Loading...</div>;
  
  if (user) {
    const userDashboard = dashboardRoutes[user.role] || '/dashboard';
    return <Navigate to={userDashboard} replace />;
  }

  return children;
}
