/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useInitializeAuth } from './hooks/useAuth';
import { clearLegacyMockDataOnce } from './services/storageService';
import { useAuthStore } from './stores/authStore';
import { ROUTE_MANIFEST } from './routes/manifest';
import { getDefaultRouteForUser } from './routes/landingPolicy';
import { RouteGuard } from './routes/RouteGuard';
import { AuthenticatedLayout } from './features/layout/AuthenticatedLayout';

import { LoginPage } from './features/auth/LoginPage';
import { Dashboard } from './features/dashboard/Dashboard';
import { EmployeeManager } from './features/hr/EmployeeManager';
import { AttendanceRecords } from './features/hr/AttendanceRecords';
import { PayrollRecords } from './features/hr/PayrollRecords';
import { LeaveRecords } from './features/hr/LeaveRecords';
import { TalentAcquisition } from './features/hr/TalentAcquisition';
import { FeedbackInbox } from './features/hr/FeedbackInbox';
import { AISearch } from './features/hr/AISerach';
import { Reports } from './features/hr/Reports';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { NotFoundPage } from './features/common/NotFoundPage';

function RootLandingRedirect() {
  const currentUser = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) return null;
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const destination = getDefaultRouteForUser(currentUser);
  return <Navigate to={destination} replace />;
}

export default function App() {
  useInitializeAuth();

  useEffect(() => {
    clearLegacyMockDataOnce();
  }, []);

  const getRouteItem = (id: string) =>
    ROUTE_MANIFEST.find((item) => item.id === id);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public authentication route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root path: dynamic policy-driven resolution */}
        <Route path="/" element={<RootLandingRedirect />} />

        {/* Authenticated Application Shell */}
        <Route
          element={
            <RouteGuard>
              <AuthenticatedLayout />
            </RouteGuard>
          }
        >
          <Route
            path="/dashboard"
            element={
              <RouteGuard routeItem={getRouteItem('dashboard')}>
                <Dashboard />
              </RouteGuard>
            }
          />
          <Route
            path="/administration"
            element={
              <RouteGuard routeItem={getRouteItem('administration')}>
                <AdminDashboard />
              </RouteGuard>
            }
          />
          <Route
            path="/employees"
            element={
              <RouteGuard routeItem={getRouteItem('employees')}>
                <EmployeeManager />
              </RouteGuard>
            }
          />
          <Route
            path="/attendance"
            element={
              <RouteGuard routeItem={getRouteItem('attendance')}>
                <AttendanceRecords />
              </RouteGuard>
            }
          />
          <Route
            path="/payroll"
            element={
              <RouteGuard routeItem={getRouteItem('payroll')}>
                <PayrollRecords />
              </RouteGuard>
            }
          />
          <Route
            path="/leaves"
            element={
              <RouteGuard routeItem={getRouteItem('leaves')}>
                <LeaveRecords />
              </RouteGuard>
            }
          />
          <Route
            path="/talent-acquisition"
            element={
              <RouteGuard routeItem={getRouteItem('talent-acquisition')}>
                <TalentAcquisition />
              </RouteGuard>
            }
          />
          <Route
            path="/feedback"
            element={
              <RouteGuard routeItem={getRouteItem('feedback')}>
                <FeedbackInbox />
              </RouteGuard>
            }
          />
          <Route
            path="/ai-chat"
            element={
              <RouteGuard routeItem={getRouteItem('ai-chat')}>
                <AISearch />
              </RouteGuard>
            }
          />
          <Route
            path="/reports"
            element={
              <RouteGuard routeItem={getRouteItem('reports')}>
                <Reports />
              </RouteGuard>
            }
          />
          <Route
            path="/reports/employment"
            element={
              <RouteGuard routeItem={getRouteItem('reports')}>
                <Reports initialType="Employment Report" />
              </RouteGuard>
            }
          />
          <Route
            path="/reports/promotion"
            element={
              <RouteGuard routeItem={getRouteItem('reports')}>
                <Reports initialType="Promotion Report" />
              </RouteGuard>
            }
          />

          {/* Legacy navigation aliases for backward compatibility */}
          <Route
            path="/ai-search"
            element={<Navigate to="/ai-chat" replace />}
          />
          <Route
            path="/add-employee"
            element={<Navigate to="/employees" replace />}
          />
          <Route
            path="/employment-report"
            element={<Navigate to="/reports/employment" replace />}
          />
          <Route
            path="/promotion-report"
            element={<Navigate to="/reports/promotion" replace />}
          />

          {/* Catch-all 404 inside layout */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
