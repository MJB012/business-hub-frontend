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
} from 'lucide-react';
import { RouteNames } from './RouteNames';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/dashboard/Dashboard';
import Category from '../pages/category/Category';
import Supplier from '../pages/supplier/Supplier';
import Inventory from '../pages/inventory/Inventory';
import Sales from '../pages/sales/Sales';
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
}

/**
 * Sidebar navigation routes matching exact design
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
  },
  {
    path: RouteNames.SUPPLIERS,
    label: 'Suppliers',
    icon: <Truck size={18} strokeWidth={2} />,
    element: <Supplier />,
    showInSidebar: true,
  },
  {
    path: RouteNames.INVENTORY,
    label: 'Inventory',
    icon: <Box size={18} strokeWidth={2} />,
    element: <Inventory />,
    showInSidebar: true,
  },
  {
    path: RouteNames.SALES,
    label: 'Sales',
    icon: <DollarSign size={18} strokeWidth={2} />,
    element: <Sales />,
    showInSidebar: true,
  },
  {
    path: RouteNames.EXPENSES,
    label: 'Expenses',
    icon: <Receipt size={18} strokeWidth={2} />,
    element: (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <p className="text-gray-500 mt-1">Track operating expenses, receipts, and costs</p>
      </div>
    ),
    showInSidebar: true,
  },
  {
    path: RouteNames.TEAM,
    label: 'Team',
    icon: <Users size={18} strokeWidth={2} />,
    element: (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-gray-500 mt-1">Manage team members, roles, and permissions</p>
      </div>
    ),
    showInSidebar: false,
  },
  {
    path: RouteNames.SETTINGS,
    label: 'Settings',
    icon: <SettingsIcon size={18} strokeWidth={2} />,
    element: <Settings />,
    showInSidebar: true,
  },
  {
    path: RouteNames.SUPER_ADMIN,
    label: 'Platform Businesses',
    icon: <ShieldCheck size={18} strokeWidth={2} />,
    element: <SuperAdminDashboard />,
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
          <Route key={route.path} path={route.path} element={route.element} />
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
