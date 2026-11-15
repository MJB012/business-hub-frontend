import type { FC, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { RouteNames } from '../../routes/RouteNames';
import {
  getStoredUser,
  isAdminOrSuperAdmin,
  hasAnyPermission,
} from '../../utils/permissions';
import { UserRoleEnum } from '../../enums/UserRoleEnum';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
  allowedRoles?: string[];
  superAdminOnly?: boolean;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions,
  allowedRoles,
  superAdminOnly,
}) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = getStoredUser();

  // If not logged in, redirect to login
  if (!token || !user) {
    return <Navigate to={RouteNames.LOGIN} state={{ from: location }} replace />;
  }

  const role = (user.role || '').toLowerCase().trim();
  const isSuperAdmin =
    role === UserRoleEnum.SUPER_ADMIN ||
    role === 'super_admin' ||
    role === 'super admin';

  // Super Admin route check
  if (superAdminOnly) {
    if (!isSuperAdmin) {
      return <Navigate to={RouteNames.DASHBOARD} replace />;
    }
    return <>{children}</>;
  }

  // Super Admin and Business Owner (Admin) have full access to business routes
  if (isAdminOrSuperAdmin(role)) {
    return <>{children}</>;
  }

  // Allowed roles check (e.g., Settings/Team)
  if (allowedRoles && allowedRoles.length > 0) {
    const isRoleAllowed = allowedRoles.some(
      (r) => r.toLowerCase().trim() === role
    );
    if (!isRoleAllowed) {
      // If user has specific permission override, allow
      if (requiredPermissions && hasAnyPermission(requiredPermissions, user)) {
        return <>{children}</>;
      }
      return <Navigate to={RouteNames.DASHBOARD} replace />;
    }
  }

  // Required permissions check
  if (requiredPermissions && requiredPermissions.length > 0) {
    const authorized = hasAnyPermission(requiredPermissions, user);
    if (!authorized) {
      return <Navigate to={RouteNames.DASHBOARD} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
