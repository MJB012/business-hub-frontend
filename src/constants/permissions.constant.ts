import { UserRoleEnum } from '../enums/UserRoleEnum';

export interface PermissionDefinition {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface PermissionModule {
  id: string;
  name: string;
  iconName: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: 'sales',
    name: 'Sales & POS',
    iconName: 'CreditCard',
    permissions: [
      { id: 'sales:view', name: 'View Sales', description: 'Access customer sales records and receipts', module: 'sales' },
      { id: 'sales:create', name: 'Record Sales', description: 'Checkout multi-product sales & generate invoices', module: 'sales' },
      { id: 'sales:edit', name: 'Edit Sales', description: 'Update recorded transactions, prices, and discounts', module: 'sales' },
      { id: 'sales:delete', name: 'Delete Sales', description: 'Remove or void sales records from database', module: 'sales' },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory & Products',
    iconName: 'Box',
    permissions: [
      { id: 'inventory:view', name: 'View Inventory', description: 'Browse product catalog and check live stock levels', module: 'inventory' },
      { id: 'inventory:manage', name: 'Manage Products', description: 'Create, update products, SKUs, and adjust stock counts', module: 'inventory' },
      { id: 'inventory:delete', name: 'Delete Products', description: 'Delete products from catalog', module: 'inventory' },
    ],
  },
  {
    id: 'expenses',
    name: 'Expenses & Cash Outflow',
    iconName: 'Receipt',
    permissions: [
      { id: 'expenses:view', name: 'View Expenses', description: 'Review operational expenditures and outflow receipts', module: 'expenses' },
      { id: 'expenses:manage', name: 'Record Expenses', description: 'Add new business expense records and invoices', module: 'expenses' },
      { id: 'expenses:delete', name: 'Delete Expenses', description: 'Remove expenditure items from accounting log', module: 'expenses' },
    ],
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    iconName: 'BarChart3',
    permissions: [
      { id: 'reports:view', name: 'View Analytics', description: 'Access executive profit & loss summaries and analytics', module: 'reports' },
      { id: 'reports:export', name: 'Export Reports', description: 'Print executive PDF reports and export CSV spreadsheets', module: 'reports' },
    ],
  },
  {
    id: 'operations',
    name: 'Suppliers & Categories',
    iconName: 'Folder',
    permissions: [
      { id: 'suppliers:manage', name: 'Manage Suppliers', description: 'Maintain vendor relationships and supplier directory', module: 'operations' },
      { id: 'categories:manage', name: 'Manage Categories', description: 'Organize products into classification categories', module: 'operations' },
    ],
  },
  {
    id: 'team',
    name: 'Team & Staffing',
    iconName: 'Users',
    permissions: [
      { id: 'team:manage', name: 'Manage Team', description: 'Invite staff members, assign roles, and configure permissions', module: 'team' },
    ],
  },
];

export const ALL_PERMISSION_IDS: string[] = PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.id)
);

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  [UserRoleEnum.ADMIN]: ALL_PERMISSION_IDS,
  [UserRoleEnum.MANAGER]: [
    'sales:view',
    'sales:create',
    'sales:edit',
    'sales:delete',
    'inventory:view',
    'inventory:manage',
    'inventory:delete',
    'expenses:view',
    'expenses:manage',
    'reports:view',
    'reports:export',
    'suppliers:manage',
    'categories:manage',
  ],
  [UserRoleEnum.CASHIER]: [
    'sales:view',
    'sales:create',
    'inventory:view',
  ],
  [UserRoleEnum.ACCOUNTANT]: [
    'expenses:view',
    'expenses:manage',
    'expenses:delete',
    'sales:view',
    'reports:view',
    'reports:export',
  ],
  [UserRoleEnum.STAFF]: [
    'sales:view',
    'inventory:view',
  ],
};
