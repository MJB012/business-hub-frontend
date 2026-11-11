export const RouteNames = {
  HOME: '/',
  LOGIN: '/login',
  SIGN_UP: '/sign-up',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  CATEGORIES: '/categories',
  SUPPLIERS: '/suppliers',
  INVENTORY: '/inventory',
  SALES: '/sales',
  EXPENSES: '/expenses',
  REPORTS: '/reports',
  TEAM: '/team',
  SETTINGS: '/settings',
  SUPER_ADMIN: '/super-admin',
  ADMIN_BUSINESSES: '/admin/businesses',
  ADMIN_USERS: '/admin/users',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_SETTINGS: '/admin/settings',
} as const;

export type RouteName = (typeof RouteNames)[keyof typeof RouteNames];
