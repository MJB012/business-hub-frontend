import type { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutGrid,
  Folder,
  Truck,
  Box,
  DollarSign,
  Receipt,
  Users,
  Settings as SettingsIcon,
  ShieldCheck,
  Store,
  BarChart2,
  BarChart3,
  FileText,
} from 'lucide-react';
import { RouteNames } from './RouteNames';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/protected-route/ProtectedRoute';
import Dashboard from '../pages/dashboard/Dashboard';
import Category from '../pages/category/Category';
import Supplier from '../pages/supplier/Supplier';
import Inventory from '../pages/inventory/Inventory';
import Sales from '../pages/sales/Sales';
import Expenses from '../pages/expenses/Expenses';
import Reports from '../pages/reports/Reports';
import Team from '../pages/team/Team';
import Settings from '../pages/settings/Settings';
import SuperAdminDashboard from '../pages/super-admin/SuperAdminDashboard';
import Login from '../pages/login/Login';
import SignUp from '../pages/sign-up/SignUp';
import ForgotPassword from '../pages/forgot-password/ForgotPassword';

// Export route names so other files can import directly from routes.tsx
export { RouteNames } from './RouteNames';
export type { RouteName } from './RouteNames';

export interface AppRoute {
  path: string;
  label: string;
  icon?: ReactNode;
  element: ReactNode;
  showInSidebar?: boolean;
  superAdminOnly?: boolean;
  requiredPermissions?: string[];
  allowedRoles?: string[];
}

/**
 * Sidebar navigation routes matching exact design and RBAC rules
 */
export const sidebarRoutes: AppRoute[] = [
  {
    path: RouteNames.DASHBOARD,
    label: 'Dashboard',
    icon: <LayoutGrid size={18} strokeWidth={2} />,
    element: <Dashboard />,
    showInSidebar: true,
  },
  {
    path: RouteNames.CATEGORIES,
    label: 'Categories',
    icon: <Folder size={18} strokeWidth={2} />,
    element: <Category />,
    showInSidebar: true,
    requiredPermissions: ['categories:manage'],
  },
  {
    path: RouteNames.SUPPLIERS,
    label: 'Suppliers',
    icon: <Truck size={18} strokeWidth={2} />,
    element: <Supplier />,
    showInSidebar: true,
    requiredPermissions: ['suppliers:manage'],
  },
  {
    path: RouteNames.INVENTORY,
    label: 'Inventory',
    icon: <Box size={18} strokeWidth={2} />,
    element: <Inventory />,
    showInSidebar: true,
    requiredPermissions: ['inventory:view', 'inventory:manage'],
  },
  {
    path: RouteNames.SALES,
    label: 'Sales',
    icon: <DollarSign size={18} strokeWidth={2} />,
    element: <Sales />,
    showInSidebar: true,
    requiredPermissions: ['sales:view', 'sales:create'],
  },
  {
    path: RouteNames.EXPENSES,
    label: 'Expenses',
    icon: <Receipt size={18} strokeWidth={2} />,
    element: <Expenses />,
    showInSidebar: true,
    requiredPermissions: ['expenses:view', 'expenses:manage'],
  },
  {
    path: RouteNames.REPORTS,
    label: 'Reports',
    icon: <BarChart3 size={18} strokeWidth={2} />,
    element: <Reports />,
    showInSidebar: true,
    requiredPermissions: ['reports:view'],
  },
  {
    path: RouteNames.TEAM,
    label: 'Team',
    icon: <Users size={18} strokeWidth={2} />,
    element: <Team />,
    showInSidebar: true,
    requiredPermissions: ['team:manage'],
    allowedRoles: ['admin', 'manager', 'super_admin'],
  },
  {
    path: RouteNames.SETTINGS,
    label: 'Settings',
    icon: <SettingsIcon size={18} strokeWidth={2} />,
    element: <Settings />,
    showInSidebar: true,
    allowedRoles: ['admin', 'manager', 'super_admin'],
  },
  {
    path: RouteNames.SUPER_ADMIN,
    label: 'Platform Businesses',
    icon: <ShieldCheck size={18} strokeWidth={2} />,
    element: <SuperAdminDashboard />,
    showInSidebar: false,
    superAdminOnly: true,
  },
  {
    path: RouteNames.ADMIN_BUSINESSES,
    label: 'Businesses',
    icon: <Store size={18} strokeWidth={2} />,
    element: <SuperAdminDashboard initialView="businesses" />,
    showInSidebar: false,
    superAdminOnly: true,
  },
  {
    path: RouteNames.ADMIN_USERS,
    label: 'User Management',
    icon: <Users size={18} strokeWidth={2} />,
    element: <SuperAdminDashboard initialView="users" />,
    showInSidebar: false,
    superAdminOnly: true,
  },
  {
    path: RouteNames.ADMIN_ANALYTICS,
    label: 'Analytics',
    icon: <BarChart2 size={18} strokeWidth={2} />,
    element: <SuperAdminDashboard initialView="analytics" />,
    showInSidebar: false,
    superAdminOnly: true,
  },
  {
    path: RouteNames.ADMIN_AUDIT_LOGS,
    label: 'Audit Logs',
    icon: <FileText size={18} strokeWidth={2} />,
    element: <SuperAdminDashboard initialView="audit_logs" />,
    showInSidebar: false,
    superAdminOnly: true,
  },
  {
    path: RouteNames.ADMIN_SETTINGS,
    label: 'Platform Settings',
    icon: <SettingsIcon size={18} strokeWidth={2} />,
    element: <SuperAdminDashboard initialView="settings" />,
    showInSidebar: false,
    superAdminOnly: true,
  },
];

/**
 * Public routes (authentication, login, register)
 */
export const publicRoutes: AppRoute[] = [
  {
    path: RouteNames.LOGIN,
    label: 'Login',
    element: <Login />,
    showInSidebar: false,
  },
  {
    path: RouteNames.SIGN_UP,
    label: 'Sign Up',
    element: <SignUp />,
    showInSidebar: false,
  },
  {
    path: RouteNames.FORGOT_PASSWORD,
    label: 'Forgot Password',
    element: <ForgotPassword />,
    showInSidebar: false,
  },
];

/**
 * Root Application Routes component
 */
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes without sidebar layout */}
      {publicRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {/* Authenticated routes wrapped with Layout containing Sidebar */}
      <Route element={<Layout />}>
        {sidebarRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute
                requiredPermissions={route.requiredPermissions}
                allowedRoles={route.allowedRoles}
                superAdminOnly={route.superAdminOnly}
              >
                {route.element}
              </ProtectedRoute>
            }
          />
        ))}
      </Route>

      {/* Root redirect */}
      <Route path={RouteNames.HOME} element={<Navigate to={RouteNames.LOGIN} replace />} />

      {/* 404 / Catch-all redirect */}
      <Route path="*" element={<Navigate to={RouteNames.LOGIN} replace />} />
    </Routes>
  );
};

export default AppRoutes;
