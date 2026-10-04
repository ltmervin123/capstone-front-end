import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { canAccessRoute } from './landingPolicy';
import type { RouteItem } from './manifest';
import { AccessLimitationNotice } from '../features/common/AccessLimitationNotice';

interface RouteGuardProps {
  routeItem?: RouteItem;
  children?: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ routeItem, children }) => {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const currentUser = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!isInitialized) {
    return null;
  }

  // Not authenticated: redirect to login and preserve intended destination
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Permission check if route specification is present
  if (routeItem && !canAccessRoute(currentUser, routeItem)) {
    return <AccessLimitationNotice />;
  }

  return children ? <>{children}</> : <Outlet />;
};
