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
  TEAM: '/team',
  SETTINGS: '/settings',
  SUPER_ADMIN: '/super-admin',
} as const;

export type RouteName = (typeof RouteNames)[keyof typeof RouteNames];
