import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  getDashboardRouteByRole,
  getUser,
  isAuthenticated,
  type UserRole,
} from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    // Жүйеге кірмеген қолданушыны логинге бағыттау
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const user = getUser();
  const userRole = user?.role;

  // Егер нақты рөлдер талап етілсе және қолданушының рөлі сәйкес келмесе
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    // Өз рөліне сәйкес тиісті кабинетке бағыттау (redirect loop-ты болдырмау үшін)
    const targetDashboard = getDashboardRouteByRole(userRole);
    return <Navigate to={targetDashboard} replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  if (isAuthenticated()) {
    const user = getUser();
    const targetDashboard = getDashboardRouteByRole(user?.role);
    return <Navigate to={targetDashboard} replace />;
  }

  return <>{children}</>;
}
