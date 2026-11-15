import {
  ALL_PERMISSION_IDS,
  DEFAULT_ROLE_PERMISSIONS,
} from '../constants/permissions.constant';
import { UserRoleEnum } from '../enums/UserRoleEnum';

export interface StoredUser {
  _id?: string;
  id?: string;
  name?: string;
  full_name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  business?: any;
  businessName?: string;
  business_name?: string;
}

/**
 * Safely parse the authenticated user from localStorage.
 */
export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Determine if the role represents a business owner (admin) or super administrator.
 */
export function isAdminOrSuperAdmin(role?: string): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  return (
    normalized === UserRoleEnum.ADMIN ||
    normalized === 'admin' ||
    normalized === 'business owner' ||
    normalized === UserRoleEnum.SUPER_ADMIN ||
    normalized === 'super_admin' ||
    normalized === 'super admin'
  );
}

/**
 * Get resolved permissions for a user (or current user from localStorage),
 * resolving custom permissions first and falling back to role presets.
 */
export function getUserPermissions(user?: StoredUser | null): string[] {
  const targetUser = user !== undefined ? user : getStoredUser();
  if (!targetUser) return [];

  // Super admins and Business owners have all platform permissions
  if (isAdminOrSuperAdmin(targetUser.role)) {
    return ALL_PERMISSION_IDS;
  }

  if (Array.isArray(targetUser.permissions) && targetUser.permissions.length > 0) {
    return targetUser.permissions;
  }

  const role = (targetUser.role || '').toLowerCase().trim();
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if the user has a specific permission.
 */
export function hasPermission(permission: string, user?: StoredUser | null): boolean {
  const targetUser = user !== undefined ? user : getStoredUser();
  if (!targetUser) return false;

  if (isAdminOrSuperAdmin(targetUser.role)) {
    return true;
  }

  const permissions = getUserPermissions(targetUser);
  return permissions.includes(permission);
}

/**
 * Check if the user has at least one of the specified permissions.
 */
export function hasAnyPermission(permissions: string[], user?: StoredUser | null): boolean {
  const targetUser = user !== undefined ? user : getStoredUser();
  if (!targetUser) return false;

  if (isAdminOrSuperAdmin(targetUser.role)) {
    return true;
  }

  const userPerms = getUserPermissions(targetUser);
  return permissions.some((p) => userPerms.includes(p));
}

/**
 * Check if the user has all of the specified permissions.
 */
export function hasAllPermissions(permissions: string[], user?: StoredUser | null): boolean {
  const targetUser = user !== undefined ? user : getStoredUser();
  if (!targetUser) return false;

  if (isAdminOrSuperAdmin(targetUser.role)) {
    return true;
  }

  const userPerms = getUserPermissions(targetUser);
  return permissions.every((p) => userPerms.includes(p));
}
