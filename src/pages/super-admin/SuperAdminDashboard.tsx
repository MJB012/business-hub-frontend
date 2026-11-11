import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Ban,
  DollarSign,
  Boxes,
  ShoppingCart,
  Search,
  X,
  Loader2,
  AlertTriangle,
  Store,
  Users,
  UserCheck,
  TrendingUp,
  Activity,
  Clock,
  Info,
  BarChart2,
  Settings as SettingsIcon,
  Server,
  Database,
  Mail,
  Eye,
  Calendar,
  MoreVertical,
  ChevronDown,
  Download,
  XCircle,
  AlertCircle,
  User,
  Shield,
  Save,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from '../../components/stat-card/StatCard';
import {
  superAdminService,
  type PlatformStats,
  type RegisteredBusiness,
  type BusinessStatsDetails,
} from '../../services/super-admin.service';
import { getCurrencySymbol } from '../../services/currency.service';
import { RouteNames } from '../../routes/RouteNames';

export interface SuperAdminDashboardProps {
  initialView?: 'dashboard' | 'businesses' | 'users' | 'analytics' | 'audit_logs' | 'settings';
}

/**
 * Seed businesses matching the exact UI design mockup
 */
const DEFAULT_BUSINESSES: (RegisteredBusiness & { profit?: number })[] = [
  {
    _id: 'biz_seed_demo_store',
    name: 'Demo Store',
    contact_email: 'john@demo.com',
    owner: {
      _id: 'user_john',
      full_name: 'John Doe',
      email: 'john@demo.com',
      role: 'admin',
    },
    type: 'Retail',
    status: 'active',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    products_count: 45,
    sales_count: 32,
    total_revenue: 25480.5,
    profit: 13129.75,
    currency: 'USD',
  },
  {
    _id: 'biz_seed_tech_haven',
    name: 'Tech Haven',
    contact_email: 'jane@techhaven.com',
    owner: {
      _id: 'user_jane',
      full_name: 'Jane Smith',
      email: 'jane@techhaven.com',
      role: 'admin',
    },
    type: 'Electronics',
    status: 'active',
    createdAt: '2024-02-20T00:00:00.000Z',
    updatedAt: '2024-02-20T00:00:00.000Z',
    products_count: 78,
    sales_count: 54,
    total_revenue: 48750.0,
    profit: 19850.0,
    currency: 'USD',
  },
  {
    _id: 'biz_seed_coffee_corner',
    name: 'Coffee Corner',
    contact_email: 'mike@coffeecorner.com',
    owner: {
      _id: 'user_mike',
      full_name: 'Mike Johnson',
      email: 'mike@coffeecorner.com',
      role: 'admin',
    },
    type: 'Restaurant',
    status: 'pending',
    createdAt: '2024-03-10T00:00:00.000Z',
    updatedAt: '2024-03-10T00:00:00.000Z',
    products_count: 23,
    sales_count: 18,
    total_revenue: 18650.25,
    profit: 3449.75,
    currency: 'USD',
  },
  {
    _id: 'biz_seed_fashion_hub',
    name: 'Fashion Hub',
    contact_email: 'sarah@fashionhub.com',
    owner: {
      _id: 'user_sarah',
      full_name: 'Sarah Williams',
      email: 'sarah@fashionhub.com',
      role: 'admin',
    },
    type: 'Retail',
    status: 'suspended',
    createdAt: '2024-04-05T00:00:00.000Z',
    updatedAt: '2024-04-05T00:00:00.000Z',
    products_count: 156,
    sales_count: 88,
    total_revenue: 32100.0,
    profit: 12300.0,
    currency: 'USD',
  },
];

export interface PlatformUser {
  id: string;
  initials: string;
  full_name: string;
  email: string;
  business_name: string;
  role: 'Business Admin' | 'Accountant' | 'Salesman' | string;
  status: 'Active' | 'Suspended' | 'Inactive';
  last_login: string;
  joined: string;
}

/**
 * Seed users matching the exact UI design mockup
 */
const DEFAULT_PLATFORM_USERS: PlatformUser[] = [
  {
    id: 'usr_1',
    initials: 'JS',
    full_name: 'John Smith',
    email: 'john@techstore.com',
    business_name: 'Tech Store',
    role: 'Business Admin',
    status: 'Active',
    last_login: '2 hours ago',
    joined: '2024-01-15',
  },
  {
    id: 'usr_2',
    initials: 'SJ',
    full_name: 'Sarah Johnson',
    email: 'sarah@techstore.com',
    business_name: 'Tech Store',
    role: 'Accountant',
    status: 'Active',
    last_login: '1 day ago',
    joined: '2024-02-01',
  },
  {
    id: 'usr_3',
    initials: 'MW',
    full_name: 'Mike Wilson',
    email: 'mike@techstore.com',
    business_name: 'Tech Store',
    role: 'Salesman',
    status: 'Active',
    last_login: '3 hours ago',
    joined: '2024-02-15',
  },
  {
    id: 'usr_4',
    initials: 'LA',
    full_name: 'Lisa Anderson',
    email: 'lisa@fashionhub.com',
    business_name: 'Fashion Hub',
    role: 'Business Admin',
    status: 'Suspended',
    last_login: '5 days ago',
    joined: '2024-01-20',
  },
  {
    id: 'usr_5',
    initials: 'DB',
    full_name: 'David Brown',
    email: 'david@fashionhub.com',
    business_name: 'Fashion Hub',
    role: 'Accountant',
    status: 'Active',
    last_login: '1 hour ago',
    joined: '2024-02-05',
  },
  {
    id: 'usr_6',
    initials: 'ED',
    full_name: 'Emily Davis',
    email: 'emily@coffeecorner.com',
    business_name: 'Coffee Corner',
    role: 'Business Admin',
    status: 'Inactive',
    last_login: '2 weeks ago',
    joined: '2024-03-10',
  },
];

/**
 * Monthly analytics dataset matching screenshot trends
 */
const MONTHLY_ANALYTICS_DATA = [
  { month: 'Jan', revenue: 46000, expenses: 28000, profit: 18000 },
  { month: 'Feb', revenue: 52000, expenses: 32000, profit: 20000 },
  { month: 'Mar', revenue: 48000, expenses: 30000, profit: 18000 },
  { month: 'Apr', revenue: 62000, expenses: 38000, profit: 24000 },
  { month: 'May', revenue: 58000, expenses: 35000, profit: 23000 },
  { month: 'Jun', revenue: 68000, expenses: 42000, profit: 26000 },
  { month: 'Jul', revenue: 72000, expenses: 40000, profit: 32000 },
  { month: 'Aug', revenue: 69000, expenses: 41000, profit: 28000 },
  { month: 'Sep', revenue: 78000, expenses: 46000, profit: 32000 },
  { month: 'Oct', revenue: 82000, expenses: 49000, profit: 33000 },
];

export interface AuditLogItem {
  id: string;
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
  user_initials: string;
  user_name: string;
  action: string;
  category: 'business' | 'user' | 'security' | 'settings' | 'payment' | 'system';
  details: string;
  ip_address: string;
}

/**
 * Seed audit logs dataset matching the exact UI design mockups
 */
const DEFAULT_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log_1',
    status: 'success',
    timestamp: '2024-10-19 14:30:25',
    user_initials: 'SA',
    user_name: 'Super Admin',
    action: 'Business Suspended',
    category: 'business',
    details: 'Suspended "Fashion Hub" for policy violation',
    ip_address: '192.168.1.1',
  },
  {
    id: 'log_2',
    status: 'success',
    timestamp: '2024-10-19 13:15:42',
    user_initials: 'SA',
    user_name: 'Super Admin',
    action: 'User Created',
    category: 'user',
    details: 'Created new user account for david@fashionhub.com',
    ip_address: '192.168.1.1',
  },
  {
    id: 'log_3',
    status: 'failed',
    timestamp: '2024-10-19 12:05:18',
    user_initials: 'JS',
    user_name: 'John Smith',
    action: 'Login Failed',
    category: 'security',
    details: 'Failed login attempt - incorrect password',
    ip_address: '192.168.1.50',
  },
  {
    id: 'log_4',
    status: 'success',
    timestamp: '2024-10-19 11:45:30',
    user_initials: 'SA',
    user_name: 'Super Admin',
    action: 'Settings Updated',
    category: 'settings',
    details: 'Updated platform security settings',
    ip_address: '192.168.1.1',
  },
  {
    id: 'log_5',
    status: 'success',
    timestamp: '2024-10-19 10:20:15',
    user_initials: 'S',
    user_name: 'System',
    action: 'Payment Processed',
    category: 'payment',
    details: 'Subscription payment received from Tech Store - $499.00',
    ip_address: '0.0.0.0',
  },
  {
    id: 'log_6',
    status: 'success',
    timestamp: '2024-10-19 09:30:55',
    user_initials: 'SA',
    user_name: 'Super Admin',
    action: 'Business Activated',
    category: 'business',
    details: 'Approved and activated "Coffee Corner"',
    ip_address: '192.168.1.1',
  },
  {
    id: 'log_7',
    status: 'success',
    timestamp: '2024-10-19 08:15:22',
    user_initials: 'S',
    user_name: 'System',
    action: 'Database Backup',
    category: 'system',
    details: 'Automated database backup completed',
    ip_address: '0.0.0.0',
  },
  {
    id: 'log_8',
    status: 'warning',
    timestamp: '2024-10-18 16:45:30',
    user_initials: 'SA',
    user_name: 'Super Admin',
    action: 'User Deleted',
    category: 'user',
    details: 'Deleted inactive user account',
    ip_address: '192.168.1.1',
  },
  {
    id: 'log_9',
    status: 'failed',
    timestamp: '2024-10-18 14:10:05',
    user_initials: 'JS',
    user_name: 'John Smith',
    action: 'API Rate Limit Exceeded',
    category: 'security',
    details: 'Too many requests from client endpoint',
    ip_address: '192.168.1.50',
  },
  {
    id: 'log_10',
    status: 'success',
    timestamp: '2024-10-18 11:20:00',
    user_initials: 'SA',
    user_name: 'Super Admin',
    action: 'Platform Initialized',
    category: 'system',
    details: 'System configuration and health verification complete',
    ip_address: '127.0.0.1',
  },
];

export default function SuperAdminDashboard({ initialView }: SuperAdminDashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isBusinessesView =
    location.pathname === RouteNames.ADMIN_BUSINESSES || initialView === 'businesses';
  const isUsersView =
    location.pathname === RouteNames.ADMIN_USERS || initialView === 'users';
  const isAnalyticsView =
    location.pathname === RouteNames.ADMIN_ANALYTICS || initialView === 'analytics';
  const isAuditLogsView =
    location.pathname === RouteNames.ADMIN_AUDIT_LOGS || initialView === 'audit_logs';
  const isSettingsView =
    location.pathname === RouteNames.SETTINGS ||
    location.pathname === RouteNames.ADMIN_SETTINGS ||
    initialView === 'settings';

  // Super Admin Platform Settings State
  const [platformSettingsTab, setPlatformSettingsTab] = useState<
    'general' | 'security' | 'email' | 'notifications' | 'database'
  >('general');
  const [platformName, setPlatformName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('super_admin_general_settings');
      if (saved) return JSON.parse(saved).platformName || 'Business Hub';
    } catch {}
    return 'Business Hub';
  });
  const [supportEmail, setSupportEmail] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('super_admin_general_settings');
      if (saved) return JSON.parse(saved).supportEmail || 'support@businesshub.com';
    } catch {}
    return 'support@businesshub.com';
  });
  const [maxBusinessesPerUser, setMaxBusinessesPerUser] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('super_admin_general_settings');
      if (saved) return JSON.parse(saved).maxBusinessesPerUser || '5';
    } catch {}
    return '5';
  });
  const [allowPublicRegistration, setAllowPublicRegistration] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('super_admin_general_settings');
      if (saved) return JSON.parse(saved).allowPublicRegistration !== false;
    } catch {}
    return true;
  });
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('super_admin_general_settings');
      if (saved) return Boolean(JSON.parse(saved).maintenanceMode);
    } catch {}
    return false;
  });

  const handleSaveGeneralSettings = () => {
    const payload = {
      platformName,
      supportEmail,
      maxBusinessesPerUser,
      allowPublicRegistration,
      maintenanceMode,
    };
    try {
      localStorage.setItem('super_admin_general_settings', JSON.stringify(payload));
    } catch {}
    setFeedbackMessage({
      type: 'success',
      text: 'General platform settings saved successfully!',
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Super Admin Security Settings State (matching uploaded_media_1793776451088.png)
  const [requireEmailVerification, setRequireEmailVerification] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('super_admin_security_settings');
      if (saved) return JSON.parse(saved).requireEmailVerification !== false;
    } catch {}
    return true;
  });
  const [enforceStrongPasswords, setEnforceStrongPasswords] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('super_admin_security_settings');
      if (saved) return JSON.parse(saved).enforceStrongPasswords !== false;
    } catch {}
    return true;
  });
  const [twoFactorAuth, setTwoFactorAuth] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('super_admin_security_settings');
      if (saved) return Boolean(JSON.parse(saved).twoFactorAuth);
    } catch {}
    return false;
  });
  const [sessionTimeout, setSessionTimeout] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('super_admin_security_settings');
      if (saved) return JSON.parse(saved).sessionTimeout || '30';
    } catch {}
    return '30';
  });
  const [maxLoginAttempts, setMaxLoginAttempts] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('super_admin_security_settings');
      if (saved) return JSON.parse(saved).maxLoginAttempts || '5';
    } catch {}
    return '5';
  });

  const handleSaveSecuritySettings = () => {
    const payload = {
      requireEmailVerification,
      enforceStrongPasswords,
      twoFactorAuth,
      sessionTimeout,
      maxLoginAttempts,
    };
    try {
      localStorage.setItem('super_admin_security_settings', JSON.stringify(payload));
    } catch {}
    setFeedbackMessage({
      type: 'success',
      text: 'Security settings saved successfully!',
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Super Admin Email Settings State (matching uploaded_media_1793776704398.png)
  const [smtpServer, setSmtpServer] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('super_admin_email_settings');
      if (saved) return JSON.parse(saved).smtpServer || 'smtp.businesshub.com';
    } catch {}
    return 'smtp.businesshub.com';
  });
  const [smtpPort, setSmtpPort] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('super_admin_email_settings');
      if (saved) return JSON.parse(saved).smtpPort || '587';
    } catch {}
    return '587';
  });
  const [smtpUsername, setSmtpUsername] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('super_admin_email_settings');
      if (saved) return JSON.parse(saved).smtpUsername || 'noreply@businesshub.com';
    } catch {}
    return 'noreply@businesshub.com';
  });
  const [enableEmailNotifications, setEnableEmailNotifications] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('super_admin_email_settings');
      if (saved) return JSON.parse(saved).enableEmailNotifications !== false;
    } catch {}
    return true;
  });

  const handleSaveEmailSettings = () => {
    const payload = {
      smtpServer,
      smtpPort,
      smtpUsername,
      enableEmailNotifications,
    };
    try {
      localStorage.setItem('super_admin_email_settings', JSON.stringify(payload));
    } catch {}
    setFeedbackMessage({
      type: 'success',
      text: 'Email settings saved successfully!',
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleSendTestEmail = () => {
    setFeedbackMessage({
      type: 'success',
      text: 'Test email sent successfully to superadmin@example.com!',
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Super Admin Notification Settings State (matching uploaded_media_1793777231235.png)
  const [notifyBusinessRegistration, setNotifyBusinessRegistration] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('super_admin_notification_settings');
      if (saved) return JSON.parse(saved).notifyBusinessRegistration !== false;
    } catch {}
    return true;
  });
  const [notifyPaymentProcessed, setNotifyPaymentProcessed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('super_admin_notification_settings');
      if (saved) return JSON.parse(saved).notifyPaymentProcessed !== false;
    } catch {}
    return true;
  });
  const [notifySuspensionAlerts, setNotifySuspensionAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('super_admin_notification_settings');
      if (saved) return JSON.parse(saved).notifySuspensionAlerts !== false;
    } catch {}
    return true;
  });
  const [notifySystemErrors, setNotifySystemErrors] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('super_admin_notification_settings');
      if (saved) return JSON.parse(saved).notifySystemErrors !== false;
    } catch {}
    return true;
  });
  const [notifyWeeklyReports, setNotifyWeeklyReports] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('super_admin_notification_settings');
      if (saved) return Boolean(JSON.parse(saved).notifyWeeklyReports);
    } catch {}
    return false;
  });

  const handleSaveNotificationSettings = () => {
    const payload = {
      notifyBusinessRegistration,
      notifyPaymentProcessed,
      notifySuspensionAlerts,
      notifySystemErrors,
      notifyWeeklyReports,
    };
    try {
      localStorage.setItem('super_admin_notification_settings', JSON.stringify(payload));
    } catch {}
    setFeedbackMessage({
      type: 'success',
      text: 'Notification settings saved successfully!',
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Super Admin Database Tab State (matching uploaded_media_1793777533202.png)
  const [dbStatus, setDbStatus] = useState(() => {
    try {
      const saved = localStorage.getItem('super_admin_db_status');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      size: '2.4 GB',
      tables: 24,
      records: '45,231',
      lastBackup: '2 hours ago',
    };
  });
  const [dbOpLoading, setDbOpLoading] = useState<string | null>(null);

  const handleOptimizeDb = () => {
    setDbOpLoading('optimize');
    setTimeout(() => {
      setDbOpLoading(null);
      setFeedbackMessage({
        type: 'success',
        text: 'Database tables optimized and re-indexed successfully!',
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    }, 600);
  };

  const handleCreateBackup = () => {
    setDbOpLoading('backup');
    setTimeout(() => {
      const updated = { ...dbStatus, lastBackup: 'Just now' };
      setDbStatus(updated);
      try {
        localStorage.setItem('super_admin_db_status', JSON.stringify(updated));
      } catch {}
      setDbOpLoading(null);
      setFeedbackMessage({
        type: 'success',
        text: 'Database backup created and archived successfully!',
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    }, 600);
  };

  const handleClearCache = () => {
    setDbOpLoading('cache');
    setTimeout(() => {
      setDbOpLoading(null);
      setFeedbackMessage({
        type: 'success',
        text: 'System and query caches cleared successfully!',
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    }, 600);
  };

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [businesses, setBusinesses] = useState<RegisteredBusiness[]>(DEFAULT_BUSINESSES);
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>(DEFAULT_PLATFORM_USERS);
  const [auditLogs] = useState<AuditLogItem[]>(DEFAULT_AUDIT_LOGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Business directory filters
  const [searchTerm, setSearchTerm] = useState<string>('');

  // User directory filters
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilterDropdown, setStatusFilterDropdown] = useState<string>('all');
  const [openUserMenuId, setOpenUserMenuId] = useState<string | null>(null);

  // Analytics View State
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<string>('90d');
  const [analyticsTab, setAnalyticsTab] = useState<'revenue' | 'growth' | 'distribution'>('revenue');
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(6); // Default 6 is 'Jul' as in screenshot

  // Audit Logs View State
  const [logSearchTerm, setLogSearchTerm] = useState<string>('');
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('all');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');

  // Dashboard Sub-Tabs: Overview, Performance, Recent Activity, System Health
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'recent_activity' | 'system_health'>(() => {
    if (initialView === 'analytics' || location.pathname === RouteNames.ADMIN_ANALYTICS) return 'performance';
    if (initialView === 'audit_logs' || location.pathname === RouteNames.ADMIN_AUDIT_LOGS) return 'recent_activity';
    return 'overview';
  });

  useEffect(() => {
    if (location.pathname === RouteNames.ADMIN_ANALYTICS) {
      setActiveTab('performance');
    } else if (location.pathname === RouteNames.ADMIN_AUDIT_LOGS) {
      setActiveTab('recent_activity');
    }
  }, [location.pathname]);

  // Close open user actions menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setOpenUserMenuId(null);
    if (openUserMenuId) {
      window.addEventListener('click', handleOutsideClick);
      return () => window.removeEventListener('click', handleOutsideClick);
    }
  }, [openUserMenuId]);

  // Detailed Business Stats Modal State
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businessDetails, setBusinessDetails] = useState<BusinessStatsDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState<'overview' | 'sales' | 'products'>('overview');

  // Action Modals State
  const [businessToBlock, setBusinessToBlock] = useState<RegisteredBusiness | null>(null);
  const [businessToUnblock, setBusinessToUnblock] = useState<RegisteredBusiness | null>(null);
  const [blockReason, setBlockReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Load platform stats, businesses list, and users list
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, bizData, usersData] = await Promise.allSettled([
        superAdminService.getStats(),
        superAdminService.getBusinesses(),
        superAdminService.getUsers(),
      ]);

      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }

      if (bizData.status === 'fulfilled' && Array.isArray(bizData.value) && bizData.value.length > 0) {
        setBusinesses(bizData.value);
      } else {
        setBusinesses(DEFAULT_BUSINESSES);
      }

      if (usersData.status === 'fulfilled' && Array.isArray(usersData.value) && usersData.value.length > 0) {
        const mappedUsers: PlatformUser[] = usersData.value.map((u, i) => {
          const initials = u.full_name
            ? u.full_name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            : 'U';
          return {
            id: (u as any)._id || u.id || `usr_db_${i}`,
            initials,
            full_name: u.full_name,
            email: u.email,
            business_name: u.business_name || 'N/A',
            role: u.role === 'admin' ? 'Business Admin' : u.role,
            status: (u.status as any) || 'Active',
            last_login: u.last_login || 'Recently',
            joined: u.createdAt ? u.createdAt.slice(0, 10) : '2024-01-15',
          };
        });
        setPlatformUsers(mappedUsers);
      } else {
        setPlatformUsers(DEFAULT_PLATFORM_USERS);
      }
    } catch (err: any) {
      console.warn('Super Admin fetch error:', err);
      setBusinesses(DEFAULT_BUSINESSES);
      setPlatformUsers(DEFAULT_PLATFORM_USERS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered businesses based on search term
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        (b.name || '').toLowerCase().includes(term) ||
        (b.type || '').toLowerCase().includes(term) ||
        (b.owner?.full_name || '').toLowerCase().includes(term) ||
        (b.owner?.email || '').toLowerCase().includes(term) ||
        (b.contact_email || '').toLowerCase().includes(term) ||
        (b.status || '').toLowerCase().includes(term)
      );
    });
  }, [businesses, searchTerm]);

  // Filtered platform users based on search term, role, and status
  const filteredUsers = useMemo(() => {
    return platformUsers.filter((u) => {
      const term = userSearchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        u.full_name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.business_name.toLowerCase().includes(term);

      const matchesRole =
        roleFilter === 'all' ||
        u.role.toLowerCase() === roleFilter.toLowerCase();

      const matchesStatus =
        statusFilterDropdown === 'all' ||
        u.status.toLowerCase() === statusFilterDropdown.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [platformUsers, userSearchTerm, roleFilter, statusFilterDropdown]);

  // Filtered audit logs based on search term, category, and status
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const term = logSearchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        log.user_name.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term) ||
        log.ip_address.includes(term) ||
        log.category.toLowerCase().includes(term);

      const matchesCategory =
        logCategoryFilter === 'all' ||
        log.category.toLowerCase() === logCategoryFilter.toLowerCase();

      const matchesStatus =
        logStatusFilter === 'all' ||
        log.status.toLowerCase() === logStatusFilter.toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [auditLogs, logSearchTerm, logCategoryFilter, logStatusFilter]);

  // Derived audit logs statistics for stat cards
  const auditLogStats = useMemo(() => {
    let success = 0;
    let failed = 0;
    let warning = 0;

    auditLogs.forEach((l) => {
      if (l.status === 'success') success++;
      else if (l.status === 'failed') failed++;
      else if (l.status === 'warning') warning++;
    });

    const total = auditLogs.length || 1;
    const successPercent = Math.round((success / total) * 100);

    return {
      total: auditLogs.length,
      success,
      failed,
      warning,
      successPercent,
    };
  }, [auditLogs]);

  // Export audit logs to CSV
  const handleExportLogs = () => {
    const headers = 'ID,Status,Timestamp,User,Action,Category,Details,IP Address\n';
    const rows = filteredAuditLogs
      .map(
        (l) =>
          `"${l.id}","${l.status}","${l.timestamp}","${l.user_name}","${l.action}","${l.category}","${l.details.replace(/"/g, '""')}","${l.ip_address}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `platform_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedbackMessage({
      type: 'success',
      text: `Exported ${filteredAuditLogs.length} audit log entries to CSV.`,
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Helper to render category badges matching design
  const renderCategoryBadge = (category: string) => {
    switch (category.toLowerCase()) {
      case 'business':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800 border border-gray-200">
            <Store size={12} className="text-gray-500" />
            <span>business</span>
          </span>
        );
      case 'user':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-black text-white">
            <User size={12} />
            <span>user</span>
          </span>
        );
      case 'security':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#dc2626] text-white">
            <Shield size={12} />
            <span>security</span>
          </span>
        );
      case 'settings':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800 border border-gray-200">
            <SettingsIcon size={12} className="text-gray-500" />
            <span>settings</span>
          </span>
        );
      case 'payment':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-black text-white">
            <DollarSign size={12} />
            <span>payment</span>
          </span>
        );
      case 'system':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800 border border-gray-200">
            <Server size={12} className="text-gray-500" />
            <span>system</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800 border border-gray-200">
            <span>{category}</span>
          </span>
        );
    }
  };

  // Derived user statistics for User Management StatCards
  const userStats = useMemo(() => {
    let active = 0;
    let suspended = 0;
    let inactive = 0;

    platformUsers.forEach((u) => {
      const s = u.status.toLowerCase();
      if (s === 'active') active++;
      else if (s === 'suspended' || s === 'blocked') suspended++;
      else if (s === 'inactive') inactive++;
      else active++;
    });

    const total = platformUsers.length || 1;
    const activePercent = Math.round((active / total) * 100);

    return {
      total: platformUsers.length,
      active,
      suspended,
      inactive,
      activePercent,
    };
  }, [platformUsers]);

  // Derived counts for business status distribution
  const statusCounts = useMemo(() => {
    let active = 0;
    let pending = 0;
    let suspended = 0;
    let inactive = 0;

    businesses.forEach((b) => {
      const s = (b.status || 'active').toLowerCase();
      if (s === 'active' || s === 'approved') active++;
      else if (s === 'pending') pending++;
      else if (s === 'blocked' || s === 'suspended') suspended++;
      else if (s === 'inactive') inactive++;
      else active++;
    });

    return {
      active,
      pending,
      suspended,
      inactive,
      total: businesses.length,
    };
  }, [businesses]);

  // Derived category distribution
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    businesses.forEach((b) => {
      const t = b.type ? b.type.trim() : 'Retail';
      map.set(t, (map.get(t) || 0) + 1);
    });

    const total = businesses.length || 1;
    const list: { type: string; count: number; percent: number }[] = [];
    map.forEach((count, type) => {
      list.push({
        type,
        count,
        percent: Math.round((count / total) * 100),
      });
    });

    if (list.length === 0) {
      return [
        { type: 'Retail', count: 2, percent: 50 },
        { type: 'Electronics', count: 1, percent: 25 },
        { type: 'Restaurant', count: 1, percent: 25 },
      ];
    }

    return list.slice(0, 5);
  }, [businesses]);

  // Formatted platform stats for the 4 stat cards
  const totalBusinessesCount = businesses.length || (stats?.total_businesses ?? 4);
  const platformRevenueVal =
    stats?.total_revenue && stats.total_revenue > 0
      ? stats.total_revenue
      : businesses.reduce((sum, b) => sum + (b.total_revenue || 0), 0);

  // Formatted for dashboard overview (short K format)
  const formattedRevenueShort = `$${(platformRevenueVal / 1000).toFixed(1)}K`;
  const avgPerBusiness = Math.round(platformRevenueVal / (statusCounts.active || 2));
  const formattedAvgRevenueShort = `$${avgPerBusiness.toLocaleString()}`;

  // Formatted for dedicated businesses and analytics pages (matching exact numbers: $124,980.75)
  const formattedRevenueExact = `$${platformRevenueVal.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const avgPerActiveBizExact = platformRevenueVal / (statusCounts.active || 1);
  const formattedAvgRevenueExact = `$${avgPerActiveBizExact.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  // Platform Profit (approx 39% margin matching screenshot)
  const platformProfitVal = Math.round(platformRevenueVal * 0.39);
  const formattedProfit = `$${(platformProfitVal / 1000).toFixed(1)}K`;

  // Active Users count
  const activeUsersCount = stats?.total_users ? Math.max(stats.total_users, 127) : 127;

  // Handle clicking on a business to view its live statistics and performance
  const handleOpenBusinessDetails = async (biz: RegisteredBusiness) => {
    setSelectedBusinessId(biz._id);
    setActiveDetailsTab('overview');
    setDetailsLoading(true);
    try {
      if (!biz._id.startsWith('biz_seed_')) {
        const details = await superAdminService.getBusinessDetails(biz._id);
        setBusinessDetails(details);
        return;
      }

      // Seed items fallback details
      const rev = biz.total_revenue || 0;
      setBusinessDetails({
        ...biz,
        stats: {
          products_count: biz.products_count || 0,
          total_inventory_stock: (biz.products_count || 10) * 12,
          low_stock_count: 2,
          sales_count: biz.sales_count || 0,
          total_revenue: rev,
          avg_order_value:
            biz.sales_count > 0 ? rev / biz.sales_count : 0,
        },
        products: [
          {
            _id: `${biz._id}_p1`,
            name: `${biz.name} Item Alpha`,
            sku: 'SKU-001',
            stock_quantity: 45,
            cost_price: 15.0,
            selling_price: 28.5,
          },
          {
            _id: `${biz._id}_p2`,
            name: `${biz.name} Item Beta`,
            sku: 'SKU-002',
            stock_quantity: 6,
            cost_price: 35.0,
            selling_price: 65.0,
          },
        ],
        sales: [
          {
            _id: `${biz._id}_s1`,
            customer_name: 'Customer 1',
            customer_email: 'customer1@example.com',
            total_amount: Math.round(rev * 0.4),
            status: 'completed',
            createdAt: new Date().toISOString(),
          },
          {
            _id: `${biz._id}_s2`,
            customer_name: 'Customer 2',
            customer_email: 'customer2@example.com',
            total_amount: Math.round(rev * 0.6),
            status: 'completed',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      });
    } catch (err: any) {
      console.warn('Failed to fetch business details:', err);
      setBusinessDetails({
        ...biz,
        stats: {
          products_count: biz.products_count || 0,
          total_inventory_stock: 0,
          low_stock_count: 0,
          sales_count: biz.sales_count || 0,
          total_revenue: biz.total_revenue || 0,
          avg_order_value: biz.sales_count > 0 ? biz.total_revenue / biz.sales_count : 0,
        },
        products: [],
        sales: [],
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseBusinessDetails = () => {
    setSelectedBusinessId(null);
    setBusinessDetails(null);
  };

  // Quick direct status update for businesses (Deactivate / Approve / Activate)
  const handleQuickUpdateStatus = async (
    bizId: string,
    newStatus: 'active' | 'suspended' | 'blocked',
    reason?: string
  ) => {
    setActionLoading(true);
    try {
      if (!bizId.startsWith('biz_seed_')) {
        await superAdminService.updateBusinessStatus(bizId, newStatus, reason);
      }

      setBusinesses((prev) =>
        prev.map((b) =>
          b._id === bizId
            ? {
                ...b,
                status: newStatus,
                block_reason: reason || '',
                blocked_at: newStatus === 'active' ? null : new Date().toISOString(),
              }
            : b
        )
      );

      if (businessDetails && businessDetails._id === bizId) {
        setBusinessDetails((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                block_reason: reason || '',
                blocked_at: newStatus === 'active' ? null : new Date().toISOString(),
              }
            : null
        );
      }

      const actionText =
        newStatus === 'active'
          ? 'activated'
          : 'deactivated and suspended';

      setFeedbackMessage({
        type: 'success',
        text: `Business status successfully updated: ${actionText}.`,
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to update business status.',
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  // Quick status update for users
  const handleUpdateUserStatus = (userId: string, newStatus: 'Active' | 'Suspended' | 'Inactive') => {
    setPlatformUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    setOpenUserMenuId(null);
    setFeedbackMessage({
      type: 'success',
      text: `User status changed to ${newStatus}.`,
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Cycle user role
  const handleCycleRole = (userId: string) => {
    setPlatformUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const nextRole =
          u.role === 'Business Admin'
            ? 'Accountant'
            : u.role === 'Accountant'
            ? 'Salesman'
            : 'Business Admin';
        return { ...u, role: nextRole };
      })
    );
    setOpenUserMenuId(null);
    setFeedbackMessage({
      type: 'success',
      text: `User role updated successfully.`,
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Reset user password
  const handleResetPassword = (email: string) => {
    setOpenUserMenuId(null);
    setFeedbackMessage({
      type: 'success',
      text: `Password reset instructions sent to ${email}.`,
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Handle Block Business Confirmation Modal
  const handleConfirmBlock = async () => {
    if (!businessToBlock) return;
    setActionLoading(true);
    try {
      if (!businessToBlock._id.startsWith('biz_seed_')) {
        await superAdminService.updateBusinessStatus(
          businessToBlock._id,
          'suspended',
          blockReason || 'Suspended by Super Administrator'
        );
      }

      setBusinesses((prev) =>
        prev.map((item) =>
          item._id === businessToBlock._id
            ? {
                ...item,
                status: 'suspended',
                block_reason: blockReason || 'Suspended by Super Administrator',
                blocked_at: new Date().toISOString(),
              }
            : item
        )
      );

      setFeedbackMessage({
        type: 'success',
        text: `Business "${businessToBlock.name}" has been suspended. Its owner can no longer log in.`,
      });
      setBusinessToBlock(null);
      setBlockReason('');
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to suspend business.',
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  // Handle Unblock Business Confirmation Modal
  const handleConfirmUnblock = async () => {
    if (!businessToUnblock) return;
    setActionLoading(true);
    try {
      if (!businessToUnblock._id.startsWith('biz_seed_')) {
        await superAdminService.updateBusinessStatus(
          businessToUnblock._id,
          'active'
        );
      }

      setBusinesses((prev) =>
        prev.map((item) =>
          item._id === businessToUnblock._id
            ? {
                ...item,
                status: 'active',
                block_reason: '',
                blocked_at: null,
              }
            : item
        )
      );

      setFeedbackMessage({
        type: 'success',
        text: `Business "${businessToUnblock.name}" has been reactivated. Login access restored.`,
      });
      setBusinessToUnblock(null);
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to unblock business.',
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  // Cubic spline generator for smooth area/line charts
  const getCubicPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  // Generate coordinates for Revenue & Profit Trends Chart
  const revenuePoints = useMemo(() => {
    return MONTHLY_ANALYTICS_DATA.map((d, i) => {
      const x = 50 + i * 103;
      // y ranges from 270 ($0k) to 30 ($100k)
      const y = 270 - (d.revenue / 100000) * 240;
      return { x, y, ...d };
    });
  }, []);

  const profitPoints = useMemo(() => {
    return MONTHLY_ANALYTICS_DATA.map((d, i) => {
      const x = 50 + i * 103;
      const y = 270 - (d.profit / 100000) * 240;
      return { x, y, ...d };
    });
  }, []);

  const revenueLinePath = useMemo(() => getCubicPath(revenuePoints), [revenuePoints]);
  const revenueAreaPath = useMemo(() => {
    if (revenuePoints.length === 0) return '';
    const lastX = revenuePoints[revenuePoints.length - 1].x;
    return `${revenueLinePath} L ${lastX} 270 L 50 270 Z`;
  }, [revenueLinePath, revenuePoints]);

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Feedback Toast Notification */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-xs transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={18} className="text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* VIEW 1: Dedicated Businesses Page (/admin/businesses) matching screenshot uploaded_media_1793687718504.png */}
      {isBusinessesView ? (
        <div className="space-y-6">
          {/* Header matching screenshot */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Super Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and monitor all registered businesses
            </p>
          </div>

          {/* 4 StatCards matching screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Total Businesses */}
            <StatCard
              title="Total Businesses"
              icon={<Store size={18} strokeWidth={1.5} className="text-gray-400" />}
              value={totalBusinessesCount}
              subtitle={`${statusCounts.active} active`}
            />

            {/* Card 2: Pending Approval */}
            <StatCard
              title="Pending Approval"
              icon={<Store size={18} strokeWidth={1.5} className="text-amber-500" />}
              value={statusCounts.pending}
              subtitle="Awaiting review"
            />

            {/* Card 3: Platform Revenue */}
            <StatCard
              title="Platform Revenue"
              icon={<DollarSign size={18} strokeWidth={1.5} className="text-gray-400" />}
              value={formattedRevenueExact}
              subtitle="All businesses"
            />

            {/* Card 4: Avg Revenue */}
            <StatCard
              title="Avg Revenue"
              icon={<TrendingUp size={18} strokeWidth={1.5} className="text-gray-400" />}
              value={formattedAvgRevenueExact}
              subtitle="Per business"
            />
          </div>

          {/* Businesses Table Container matching screenshot */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Businesses</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage business accounts and permissions
                </p>
              </div>

              {/* Search businesses input */}
              <div className="relative w-full sm:w-72">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-gray-400 transition"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Businesses List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-900 font-semibold text-xs">
                    <th className="py-3 pr-4 font-semibold">Business Name</th>
                    <th className="py-3 px-4 font-semibold">Owner</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Registered</th>
                    <th className="py-3 px-4 font-semibold">Products</th>
                    <th className="py-3 px-4 font-semibold">Revenue</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 pl-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading && businesses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        <Loader2 className="animate-spin mx-auto mb-2 text-gray-600" size={24} />
                        Loading businesses records...
                      </td>
                    </tr>
                  ) : filteredBusinesses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        <Building2 className="mx-auto mb-2 text-gray-300" size={32} />
                        No businesses match the search query.
                      </td>
                    </tr>
                  ) : (
                    filteredBusinesses.map((biz) => {
                      const isBlocked = biz.status === 'blocked' || biz.status === 'suspended';
                      const isPending = biz.status === 'pending';
                      const regDate = biz.createdAt
                        ? biz.createdAt.slice(0, 10)
                        : '2024-01-15';
                      const revVal = biz.total_revenue || 0;
                      const profitVal =
                        (biz as any).profit !== undefined
                          ? (biz as any).profit
                          : revVal * 0.39;

                      return (
                        <tr key={biz._id} className="hover:bg-gray-50/60 transition">
                          {/* Business Name & Email */}
                          <td className="py-3.5 pr-4">
                            <span className="font-semibold text-gray-900 block text-sm">
                              {biz.name}
                            </span>
                            <span className="text-xs text-gray-400 block truncate mt-0.5">
                              {biz.contact_email || biz.owner?.email || 'No email'}
                            </span>
                          </td>

                          {/* Owner */}
                          <td className="py-3.5 px-4 text-sm text-gray-700">
                            {biz.owner?.full_name || 'N/A'}
                          </td>

                          {/* Type */}
                          <td className="py-3.5 px-4 text-sm text-gray-700 capitalize">
                            {biz.type || (biz as any).business_type || 'Retail'}
                          </td>

                          {/* Registered */}
                          <td className="py-3.5 px-4 text-sm text-gray-700">
                            {regDate}
                          </td>

                          {/* Products */}
                          <td className="py-3.5 px-4 text-sm text-gray-700">
                            {biz.products_count ?? 0}
                          </td>

                          {/* Revenue & Profit */}
                          <td className="py-3.5 px-4">
                            <span className="text-sm font-medium text-gray-900 block">
                              ${revVal.toFixed(2)}
                            </span>
                            <span className="text-xs text-emerald-600 font-medium block mt-0.5">
                              Profit: ${profitVal.toFixed(2)}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            {isBlocked ? (
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-[#dc2626] text-white min-w-[76px]">
                                suspended
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-gray-300 text-gray-700 min-w-[76px]">
                                pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-black text-white min-w-[76px]">
                                active
                              </span>
                            )}
                          </td>

                          {/* Actions: Eye Inspect + Status Action Button */}
                          <td className="py-3.5 pl-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Inspect Eye Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenBusinessDetails(biz)}
                                className="p-1.5 border border-gray-200 hover:border-gray-400 rounded-lg text-gray-600 hover:text-black hover:bg-gray-50 transition cursor-pointer"
                                title="Inspect business details"
                              >
                                <Eye size={16} />
                              </button>

                              {/* Action Button: Deactivate / Approve / Activate */}
                              {isBlocked ? (
                                <button
                                  type="button"
                                  onClick={() => handleQuickUpdateStatus(biz._id, 'active')}
                                  className="px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer min-w-[80px]"
                                >
                                  Activate
                                </button>
                              ) : isPending ? (
                                <button
                                  type="button"
                                  onClick={() => handleQuickUpdateStatus(biz._id, 'active')}
                                  className="px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer min-w-[80px]"
                                >
                                  Approve
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuickUpdateStatus(
                                      biz._id,
                                      'suspended',
                                      'Suspended by super admin'
                                    )
                                  }
                                  className="px-3.5 py-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-800 transition cursor-pointer min-w-[80px]"
                                >
                                  Deactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : isUsersView ? (
        /* VIEW 2: Dedicated User Management Page (/admin/users) matching screenshot uploaded_media_1793709692201.png */
        <div className="space-y-6">
          {/* Header matching screenshot */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Platform User Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage all users across the platform
            </p>
          </div>

          {/* 4 StatCards matching screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Total Users */}
            <StatCard
              title="Total Users"
              value={userStats.total}
              subtitle="Across all businesses"
            />

            {/* Card 2: Active Users */}
            <StatCard
              title={
                <span className="flex items-center gap-1.5 text-gray-600 font-medium text-sm">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Active Users</span>
                </span>
              }
              value={userStats.active}
              subtitle={`${userStats.activePercent}% of total`}
            />

            {/* Card 3: Suspended */}
            <StatCard
              title={
                <span className="flex items-center gap-1.5 text-gray-600 font-medium text-sm">
                  <Ban size={16} className="text-red-500 shrink-0" />
                  <span>Suspended</span>
                </span>
              }
              value={userStats.suspended}
              subtitle="Require attention"
            />

            {/* Card 4: Inactive Users */}
            <StatCard
              title="Inactive Users"
              value={userStats.inactive}
              subtitle="Not logged in recently"
            />
          </div>

          {/* User Directory Container matching screenshot */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">User Directory</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Search and filter platform users
                </p>
              </div>

              {/* Filters: Search + Role Select + Status Select */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by name, email, or business..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-gray-400 transition"
                  />
                  {userSearchTerm && (
                    <button
                      onClick={() => setUserSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3.5 py-2 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-gray-400 cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="Business Admin">Business Admin</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Salesman">Salesman</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilterDropdown}
                  onChange={(e) => setStatusFilterDropdown(e.target.value)}
                  className="px-3.5 py-2 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-gray-400 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Users List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-900 font-semibold text-xs">
                    <th className="py-3 pr-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Business</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Last Login</th>
                    <th className="py-3 px-4 font-semibold">Joined</th>
                    <th className="py-3 pl-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading && platformUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <Loader2 className="animate-spin mx-auto mb-2 text-gray-600" size={24} />
                        Loading platform users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <Users className="mx-auto mb-2 text-gray-300" size={32} />
                        No users match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/60 transition">
                        {/* User Avatar, Name & Email */}
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-xs text-gray-700 shrink-0">
                              {user.initials || user.full_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-gray-900 block text-sm">
                                {user.full_name}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Mail size={12} className="text-gray-400 shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Business */}
                        <td className="py-3.5 px-4 text-sm text-gray-800 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Store size={14} className="text-gray-400 shrink-0" />
                            <span>{user.business_name}</span>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          {user.role === 'Business Admin' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-black text-white">
                              Business Admin
                            </span>
                          ) : user.role === 'Accountant' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-gray-300 text-gray-700">
                              Accountant
                            </span>
                          ) : user.role === 'Salesman' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-gray-300 text-gray-700">
                              Salesman
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {user.role}
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          {user.status === 'Active' ? (
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-[#16a34a] text-white min-w-[76px]">
                              Active
                            </span>
                          ) : user.status === 'Suspended' ? (
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-[#dc2626] text-white min-w-[76px]">
                              Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 border border-gray-300 text-gray-600 min-w-[76px]">
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Last Login */}
                        <td className="py-3.5 px-4 text-sm text-gray-600">
                          {user.last_login}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-gray-400 shrink-0" />
                            <span>{user.joined}</span>
                          </div>
                        </td>

                        {/* Actions 3-dots with Popover */}
                        <td className="py-3.5 pl-4 text-right relative">
                          <div className="inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenUserMenuId(
                                  openUserMenuId === user.id ? null : user.id
                                );
                              }}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition cursor-pointer"
                              title="User Options"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openUserMenuId === user.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-20 text-xs text-left"
                              >
                                {user.status === 'Suspended' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateUserStatus(user.id, 'Active')}
                                    className="w-full text-left px-3.5 py-2 text-emerald-600 hover:bg-emerald-50 font-medium flex items-center gap-2 cursor-pointer"
                                  >
                                    <CheckCircle2 size={14} />
                                    <span>Activate User</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateUserStatus(user.id, 'Suspended')}
                                    className="w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50 font-medium flex items-center gap-2 cursor-pointer"
                                  >
                                    <Ban size={14} />
                                    <span>Suspend User</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleCycleRole(user.id)}
                                  className="w-full text-left px-3.5 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <UserCheck size={14} />
                                  <span>Change Role</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResetPassword(user.email)}
                                  className="w-full text-left px-3.5 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Mail size={14} />
                                  <span>Reset Password</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : isAnalyticsView ? (
        /* VIEW 3: Dedicated Platform Analytics Page (/admin/analytics) matching screenshot uploaded_media_1793770493533.png */
        <div className="space-y-6">
          {/* Header Area matching screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Platform Analytics
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Comprehensive platform performance insights
              </p>
            </div>

            {/* Timeframe Selector Dropdown */}
            <div className="relative self-start sm:self-auto">
              <select
                value={analyticsTimeframe}
                onChange={(e) => setAnalyticsTimeframe(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 bg-white border border-gray-200/90 rounded-xl text-xs font-medium text-gray-700 shadow-xs focus:outline-none focus:border-gray-400 cursor-pointer"
              >
                <option value="90d">Last 90 days</option>
                <option value="30d">Last 30 days</option>
                <option value="6m">Last 6 months</option>
                <option value="1y">This Year</option>
                <option value="all">All Time</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* 4 StatCards matching screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Total Revenue */}
            <StatCard
              title="Total Revenue"
              icon={<DollarSign size={18} strokeWidth={1.5} className="text-gray-400" />}
              value="$124,980.75"
              subtitle={
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-emerald-600 font-semibold text-xs">↑ 15.7%</span>
                  <span className="text-gray-500 text-xs">from last period</span>
                </div>
              }
            />

            {/* Card 2: Net Profit */}
            <StatCard
              title="Net Profit"
              icon={<TrendingUp size={18} strokeWidth={1.5} className="text-gray-400" />}
              value="$48,729.5"
              valueColor="text-[#16a34a]"
              subtitle={
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-emerald-600 font-semibold text-xs">↑ 12.3%</span>
                  <span className="text-gray-500 text-xs">from last period</span>
                </div>
              }
            />

            {/* Card 3: Active Businesses */}
            <StatCard
              title="Active Businesses"
              icon={<BarChart2 size={18} strokeWidth={1.5} className="text-gray-400" />}
              value={statusCounts.active || 2}
              subtitle={
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-emerald-600 font-semibold text-xs">↑ 25%</span>
                  <span className="text-gray-500 text-xs">from last period</span>
                </div>
              }
            />

            {/* Card 4: Avg Revenue/Business */}
            <StatCard
              title="Avg Revenue/Business"
              icon={<Activity size={18} strokeWidth={1.5} className="text-gray-400" />}
              value="$31,245"
              subtitle={
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-emerald-600 font-semibold text-xs">↑ 18.5%</span>
                  <span className="text-gray-500 text-xs">from last period</span>
                </div>
              }
            />
          </div>

          {/* Pill Tabs matching screenshot */}
          <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            {[
              { id: 'revenue', label: 'Revenue Analysis' },
              { id: 'growth', label: 'Growth Metrics' },
              { id: 'distribution', label: 'Distribution' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAnalyticsTab(tab.id as any)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  analyticsTab === tab.id
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Revenue Analysis (Matching screenshot layout) */}
          {analyticsTab === 'revenue' && (
            <div className="space-y-6">
              {/* Top Chart Card: Revenue & Profit Trends */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    Revenue & Profit Trends
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Monthly revenue, expenses, and profit over time
                  </p>
                </div>

                {/* Smooth Area Chart */}
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[640px]">
                    <svg
                      viewBox="0 0 1000 300"
                      className="w-full h-72 sm:h-80 overflow-visible"
                    >
                      <defs>
                        <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                          <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.01" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid Lines */}
                      {[
                        { label: '$100k', y: 30 },
                        { label: '$75k', y: 90 },
                        { label: '$50k', y: 150 },
                        { label: '$25k', y: 210 },
                        { label: '$0k', y: 270 },
                      ].map((grid) => (
                        <g key={grid.label}>
                          <line
                            x1="50"
                            y1={grid.y}
                            x2="980"
                            y2={grid.y}
                            stroke="#f1f5f9"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x="42"
                            y={grid.y + 3.5}
                            textAnchor="end"
                            fill="#9ca3af"
                            fontSize="10"
                            fontFamily="sans-serif"
                          >
                            {grid.label}
                          </text>
                        </g>
                      ))}

                      {/* Area Fill */}
                      <path d={revenueAreaPath} fill="url(#revenueAreaGrad)" />

                      {/* Smooth Area Stroke Line */}
                      <path
                        d={revenueLinePath}
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2.5"
                      />

                      {/* Profit Line (Smooth lower curve) */}
                      <path
                        d={getCubicPath(profitPoints)}
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="2"
                        strokeDasharray="5 4"
                        opacity="0.85"
                      />

                      {/* X-Axis Baseline & Month Labels */}
                      <line x1="50" y1="270" x2="980" y2="270" stroke="#e5e7eb" strokeWidth="1" />
                      {revenuePoints.map((pt) => (
                        <g key={pt.month}>
                          <text
                            x={pt.x}
                            y="288"
                            textAnchor="middle"
                            fill="#6b7280"
                            fontSize="10"
                            fontFamily="sans-serif"
                          >
                            {pt.month}
                          </text>
                          {/* Point dots */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="3"
                            fill="#0284c7"
                            className="transition-transform hover:scale-150 cursor-pointer"
                          />
                        </g>
                      ))}
                    </svg>

                    {/* Chart Legend matching screenshot */}
                    <div className="flex items-center justify-center gap-6 pt-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#6366f1] font-mono font-bold leading-none">
                          --○--
                        </span>
                        <span className="text-gray-700 font-medium">Revenue</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#16a34a] font-mono font-bold leading-none">
                          --○--
                        </span>
                        <span className="text-gray-700 font-medium">Profit</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Two Cards: Monthly Comparison & Performance Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                {/* Left Card: Monthly Comparison */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">
                      Monthly Comparison
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Revenue vs Expenses breakdown
                    </p>
                  </div>

                  {/* SVG Bar Chart */}
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[480px]">
                      <svg
                        viewBox="0 0 600 240"
                        className="w-full h-56 sm:h-64 overflow-visible"
                      >
                        {/* Grid lines */}
                        {[
                          { label: '$100k', y: 25 },
                          { label: '$75k', y: 72 },
                          { label: '$50k', y: 120 },
                          { label: '$25k', y: 168 },
                          { label: '$0k', y: 215 },
                        ].map((grid) => (
                          <g key={grid.label}>
                            <line
                              x1="45"
                              y1={grid.y}
                              x2="585"
                              y2={grid.y}
                              stroke="#f1f5f9"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <text
                              x="38"
                              y={grid.y + 3.5}
                              textAnchor="end"
                              fill="#9ca3af"
                              fontSize="9"
                              fontFamily="sans-serif"
                            >
                              {grid.label}
                            </text>
                          </g>
                        ))}

                        {/* Baseline */}
                        <line x1="45" y1="215" x2="585" y2="215" stroke="#e5e7eb" strokeWidth="1" />

                        {/* Month Bars */}
                        {MONTHLY_ANALYTICS_DATA.map((d, i) => {
                          const slotWidth = 53;
                          const barX = 52 + i * slotWidth;
                          const barWidth = 20;
                          const barHeight = (d.expenses / 100000) * 190;
                          const barY = 215 - barHeight;
                          const isHovered = hoveredMonthIndex === i;

                          return (
                            <g
                              key={d.month}
                              onMouseEnter={() => setHoveredMonthIndex(i)}
                              className="cursor-pointer"
                            >
                              {/* Highlight box behind active/hovered bar (Jul default in screenshot) */}
                              {isHovered && (
                                <g>
                                  <rect
                                    x={barX - 16}
                                    y={15}
                                    width={52}
                                    height={200}
                                    rx={4}
                                    fill="#e5e7eb"
                                    opacity="0.85"
                                  />
                                  <text
                                    x={barX + barWidth / 2}
                                    y={105}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fontWeight="bold"
                                    fill="#1f2937"
                                  >
                                    {d.month}
                                  </text>
                                  <text
                                    x={barX + barWidth / 2}
                                    y={120}
                                    textAnchor="middle"
                                    fontSize="9.5"
                                    fontWeight="600"
                                    fill="#6366f1"
                                  >
                                    : ${(d.revenue).toLocaleString()}
                                  </text>
                                  <text
                                    x={barX + barWidth / 2}
                                    y={134}
                                    textAnchor="middle"
                                    fontSize="9.5"
                                    fontWeight="600"
                                    fill="#ef4444"
                                  >
                                    : ${(d.expenses).toLocaleString()}
                                  </text>
                                </g>
                              )}

                              {/* Red / Coral bar for expenses */}
                              <rect
                                x={barX}
                                y={barY}
                                width={barWidth}
                                height={barHeight}
                                rx="2"
                                fill="#ef4444"
                                className="transition-all hover:opacity-90"
                              />

                              {/* Month label */}
                              <text
                                x={barX + barWidth / 2}
                                y="230"
                                textAnchor="middle"
                                fill="#6b7280"
                                fontSize="9.5"
                                fontFamily="sans-serif"
                              >
                                {d.month}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* Legend matching screenshot */}
                      <div className="flex items-center justify-center gap-6 pt-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-xs bg-[#6366f1]" />
                          <span className="text-gray-700 font-medium">Revenue</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-xs bg-[#ef4444]" />
                          <span className="text-gray-700 font-medium">Expenses</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Performance Summary */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">
                      Performance Summary
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 mb-6">
                      Key metrics at a glance
                    </p>

                    {/* Financials List */}
                    <div className="space-y-3.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">Total Revenue</span>
                        <span className="text-sm font-bold text-gray-900">$124,980.75</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">Total Expenses</span>
                        <span className="text-sm font-bold text-gray-900">$76,251.25</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">Net Profit</span>
                        <span className="text-sm font-bold text-[#16a34a]">$48,729.5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">Profit Margin</span>
                        <span className="text-sm font-bold text-gray-900">39.0%</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-5" />

                    {/* Growth Indicators */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-800 mb-3.5">
                        Growth Indicators
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 font-medium">Revenue Growth</span>
                          <span className="text-xs font-semibold text-emerald-600">↑ 15.7%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 font-medium">Profit Growth</span>
                          <span className="text-xs font-semibold text-emerald-600">↑ 12.3%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 font-medium">Business Growth</span>
                          <span className="text-xs font-semibold text-emerald-600">↑ 25%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Growth Metrics */}
          {analyticsTab === 'growth' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-bold text-base text-gray-900">Platform Growth Dynamics</h3>
                <p className="text-xs text-gray-500 mt-0.5">Quarter-over-quarter commercial expansion velocity</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70">
                  <span className="text-gray-500 font-medium block">Average Monthly Growth</span>
                  <span className="text-xl font-bold text-gray-900 mt-1 block">+18.4%</span>
                  <span className="text-gray-400 text-[11px] mt-0.5 block">Consistent quarterly revenue rise</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70">
                  <span className="text-gray-500 font-medium block">Active Merchant Retention</span>
                  <span className="text-xl font-bold text-gray-900 mt-1 block">96.8%</span>
                  <span className="text-gray-400 text-[11px] mt-0.5 block">Industry leading merchant stability</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70">
                  <span className="text-gray-500 font-medium block">Customer Average Order Value</span>
                  <span className="text-xl font-bold text-gray-900 mt-1 block">$880.14</span>
                  <span className="text-gray-400 text-[11px] mt-0.5 block">High commercial transaction volume</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Distribution */}
          {analyticsTab === 'distribution' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-gray-900">Category Share Distribution</h3>
                <div className="space-y-4">
                  {categoryStats.map((cat) => (
                    <div key={cat.type} className="flex items-center justify-between gap-4 text-xs">
                      <span className="font-medium text-gray-800 min-w-[90px]">{cat.type}</span>
                      <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-black h-full rounded-full transition-all duration-500"
                          style={{ width: `${cat.percent}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 shrink-0">
                        {cat.count} ({cat.percent}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-base text-gray-900">Regional & Currency Distribution</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">USD ($) Transactions</span>
                    <span className="font-bold text-gray-900">68%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">PKR (Rs) Transactions</span>
                    <span className="font-bold text-gray-900">22%</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600 font-medium">EUR (€) Transactions</span>
                    <span className="font-bold text-gray-900">10%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : isAuditLogsView ? (
        /* VIEW 4: Dedicated Audit Logs Page matching uploaded_media_0_1793772458867.png & uploaded_media_1_1793772458867.png */
        <div className="space-y-6">
          {/* Header Area matching screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Audit Logs
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Track all platform activities and changes
              </p>
            </div>

            {/* Export Logs Button */}
            <button
              type="button"
              onClick={handleExportLogs}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
            >
              <Download size={14} />
              <span>Export Logs</span>
            </button>
          </div>

          {/* 4 StatCards matching screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Total Events */}
            <StatCard
              title="Total Events"
              value={auditLogStats.total}
              subtitle="Last 30 days"
            />

            {/* Card 2: Success */}
            <StatCard
              title={
                <span className="flex items-center gap-1.5 text-gray-600 font-medium text-sm">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Success</span>
                </span>
              }
              value={auditLogStats.success}
              subtitle={`${auditLogStats.successPercent}% of total`}
            />

            {/* Card 3: Failed */}
            <StatCard
              title={
                <span className="flex items-center gap-1.5 text-gray-600 font-medium text-sm">
                  <XCircle size={16} className="text-red-500 shrink-0" />
                  <span>Failed</span>
                </span>
              }
              value={auditLogStats.failed}
              subtitle="Require attention"
            />

            {/* Card 4: Warnings */}
            <StatCard
              title={
                <span className="flex items-center gap-1.5 text-gray-600 font-medium text-sm">
                  <AlertCircle size={16} className="text-amber-500 shrink-0" />
                  <span>Warnings</span>
                </span>
              }
              value={auditLogStats.warning}
              subtitle="Review recommended"
            />
          </div>

          {/* Activity Log Container matching screenshot */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Activity Log</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Detailed record of all platform events
                </p>
              </div>

              {/* Filters: Search + Category Select + Status Select */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search input */}
                <div className="relative w-full sm:w-80">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search logs by user, action, or details..."
                    value={logSearchTerm}
                    onChange={(e) => setLogSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-gray-400 transition"
                  />
                  {logSearchTerm && (
                    <button
                      onClick={() => setLogSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <select
                  value={logCategoryFilter}
                  onChange={(e) => setLogCategoryFilter(e.target.value)}
                  className="px-3.5 py-2 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-gray-400 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="user">User</option>
                  <option value="business">Business</option>
                  <option value="security">Security</option>
                  <option value="payment">Payment</option>
                  <option value="settings">Settings</option>
                  <option value="system">System</option>
                </select>

                {/* Status Filter */}
                <select
                  value={logStatusFilter}
                  onChange={(e) => setLogStatusFilter(e.target.value)}
                  className="px-3.5 py-2 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-gray-400 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="warning">Warning</option>
                </select>
              </div>
            </div>

            {/* Logs List Table matching screenshot */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-900 font-semibold text-xs">
                    <th className="py-3 pr-3 font-semibold w-12">Status</th>
                    <th className="py-3 px-3 font-semibold">Timestamp</th>
                    <th className="py-3 px-3 font-semibold">User</th>
                    <th className="py-3 px-3 font-semibold">Action</th>
                    <th className="py-3 px-3 font-semibold">Category</th>
                    <th className="py-3 px-3 font-semibold">Details</th>
                    <th className="py-3 pl-3 text-right font-semibold">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <Info className="mx-auto mb-2 text-gray-300" size={32} />
                        No audit events match current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/60 transition">
                        {/* Status Icon */}
                        <td className="py-3.5 pr-3">
                          {log.status === 'success' ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : log.status === 'failed' ? (
                            <XCircle size={16} className="text-red-500" />
                          ) : (
                            <AlertCircle size={16} className="text-amber-500" />
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-3 text-gray-600 font-mono text-[11px] whitespace-nowrap">
                          {log.timestamp}
                        </td>

                        {/* User */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-700 shrink-0">
                              {log.user_initials}
                            </div>
                            <span className="font-medium text-gray-800 text-xs whitespace-nowrap">
                              {log.user_name}
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-3 font-semibold text-gray-900 text-xs whitespace-nowrap">
                          {log.action}
                        </td>

                        {/* Category Badge */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {renderCategoryBadge(log.category)}
                        </td>

                        {/* Details */}
                        <td className="py-3.5 px-3 text-gray-600 text-xs">
                          {log.details}
                        </td>

                        {/* IP Address */}
                        <td className="py-3.5 pl-3 text-right font-mono text-gray-500 text-[11px] whitespace-nowrap">
                          {log.ip_address}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : isSettingsView ? (
        /* VIEW 5: Dedicated Platform Settings Page matching uploaded_media_1793775574203.png */
        <div className="space-y-6">
          {/* Header Area matching screenshot */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Platform Settings
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure platform-wide settings and preferences
            </p>
          </div>

          {/* Pill Tabs: General, Security, Email, Notifications, Database */}
          <div className="inline-flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl flex-wrap">
            <button
              type="button"
              onClick={() => setPlatformSettingsTab('general')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                platformSettingsTab === 'general'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80'
                  : 'text-gray-600 hover:text-gray-900 font-medium'
              }`}
            >
              <SettingsIcon
                size={14}
                className={platformSettingsTab === 'general' ? 'text-gray-900' : 'text-gray-500'}
              />
              <span>General</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatformSettingsTab('security')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                platformSettingsTab === 'security'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80'
                  : 'text-gray-600 hover:text-gray-900 font-medium'
              }`}
            >
              <Shield
                size={14}
                className={platformSettingsTab === 'security' ? 'text-gray-900' : 'text-gray-500'}
              />
              <span>Security</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatformSettingsTab('email')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                platformSettingsTab === 'email'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80'
                  : 'text-gray-600 hover:text-gray-900 font-medium'
              }`}
            >
              <Mail
                size={14}
                className={platformSettingsTab === 'email' ? 'text-gray-900' : 'text-gray-500'}
              />
              <span>Email</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatformSettingsTab('notifications')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                platformSettingsTab === 'notifications'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80'
                  : 'text-gray-600 hover:text-gray-900 font-medium'
              }`}
            >
              <Bell
                size={14}
                className={
                  platformSettingsTab === 'notifications' ? 'text-gray-900' : 'text-gray-500'
                }
              />
              <span>Notifications</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatformSettingsTab('database')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                platformSettingsTab === 'database'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80'
                  : 'text-gray-600 hover:text-gray-900 font-medium'
              }`}
            >
              <Database
                size={14}
                className={platformSettingsTab === 'database' ? 'text-gray-900' : 'text-gray-500'}
              />
              <span>Database</span>
            </button>
          </div>

          {/* Tab 1: General Platform Settings (Matching exact mockup uploaded_media_1793775574203.png) */}
          {platformSettingsTab === 'general' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">General Platform Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure basic platform information and behavior
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                {/* 1. Platform Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-800">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50/90 border border-gray-200/90 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition"
                    placeholder="Business Hub"
                  />
                  <p className="text-[11px] text-gray-400">
                    The name displayed across the platform
                  </p>
                </div>

                {/* 2. Support Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-800">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50/90 border border-gray-200/90 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition"
                    placeholder="support@businesshub.com"
                  />
                  <p className="text-[11px] text-gray-400">
                    Email address for user support inquiries
                  </p>
                </div>

                {/* 3. Max Businesses Per User */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-800">
                    Max Businesses Per User
                  </label>
                  <div className="relative">
                    <select
                      value={maxBusinessesPerUser}
                      onChange={(e) => setMaxBusinessesPerUser(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 bg-gray-50/90 border border-gray-200/90 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition cursor-pointer pr-10"
                    >
                      <option value="1">1 Business</option>
                      <option value="2">2 Businesses</option>
                      <option value="3">3 Businesses</option>
                      <option value="5">5 Businesses</option>
                      <option value="10">10 Businesses</option>
                      <option value="unlimited">Unlimited</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Maximum number of businesses a user can create
                  </p>
                </div>

                {/* 4. Allow Public Registration */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800">
                      Allow Public Registration
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Enable new businesses to register without invitation
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowPublicRegistration}
                    onClick={() => setAllowPublicRegistration((prev) => !prev)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer ${
                      allowPublicRegistration ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200 ease-in-out ${
                        allowPublicRegistration ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* 5. Maintenance Mode */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800">Maintenance Mode</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Temporarily disable access for maintenance
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={maintenanceMode}
                    onClick={() => setMaintenanceMode((prev) => !prev)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer ${
                      maintenanceMode ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200 ease-in-out ${
                        maintenanceMode ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Save Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveGeneralSettings}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Save General Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Security & Authentication (Matching exact mockup uploaded_media_1793776451088.png) */}
          {platformSettingsTab === 'security' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Security & Authentication</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure security policies and authentication requirements
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                {/* 1. Require Email Verification */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800">
                      Require Email Verification
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Users must verify email before accessing platform
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={requireEmailVerification}
                    onClick={() => setRequireEmailVerification((prev) => !prev)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer ${
                      requireEmailVerification ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200 ease-in-out ${
                        requireEmailVerification ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Enforce Strong Passwords */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800">
                      Enforce Strong Passwords
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Require passwords with minimum complexity
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enforceStrongPasswords}
                    onClick={() => setEnforceStrongPasswords((prev) => !prev)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer ${
                      enforceStrongPasswords ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200 ease-in-out ${
                        enforceStrongPasswords ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Two-Factor Authentication */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Require 2FA for all super admin accounts
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={twoFactorAuth}
                    onClick={() => setTwoFactorAuth((prev) => !prev)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer ${
                      twoFactorAuth ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200 ease-in-out ${
                        twoFactorAuth ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Session Timeout (minutes) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-800">
                    Session Timeout (minutes)
                  </label>
                  <div className="relative">
                    <select
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 bg-gray-50/90 border border-gray-200/90 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition cursor-pointer pr-10"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="120">120 minutes</option>
                      <option value="240">240 minutes</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Automatically log out inactive users
                  </p>
                </div>

                {/* 5. Max Login Attempts */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-800">
                    Max Login Attempts
                  </label>
                  <div className="relative">
                    <select
                      value={maxLoginAttempts}
                      onChange={(e) => setMaxLoginAttempts(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 bg-gray-50/90 border border-gray-200/90 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition cursor-pointer pr-10"
                    >
                      <option value="3">3 attempts</option>
                      <option value="5">5 attempts</option>
                      <option value="10">10 attempts</option>
                      <option value="unlimited">Unlimited</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Lock account after failed login attempts
                  </p>
                </div>

                {/* Save Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveSecuritySettings}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Save Security Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Email Configuration (Matching exact mockup uploaded_media_1793776704398.png) */}
          {platformSettingsTab === 'email' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Email Configuration</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure SMTP server and email settings
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                {/* 1. SMTP Server */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-800">
                    SMTP Server
                  </label>
                  <input
                    type="text"
                    value={smtpServer}
                    onChange={(e) => setSmtpServer(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50/90 border border-gray-200/90 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition"
                    placeholder="smtp.businesshub.com"
                  />
                </div>

                {/* 2. SMTP Port */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-800">
                    SMTP Port
                  </label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50/90 border border-gray-200/90 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition"
                    placeholder="587"
                  />
                </div>

                {/* 3. SMTP Username */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-800">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    value={smtpUsername}
                    onChange={(e) => setSmtpUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50/90 border border-gray-200/90 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition"
                    placeholder="noreply@businesshub.com"
                  />
                </div>

                {/* 4. Enable Email Notifications */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800">
                      Enable Email Notifications
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Allow platform to send email notifications
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enableEmailNotifications}
                    onClick={() => setEnableEmailNotifications((prev) => !prev)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer ${
                      enableEmailNotifications ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200 ease-in-out ${
                        enableEmailNotifications ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSaveEmailSettings}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Save Email Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Mail size={14} />
                    <span>Send Test Email</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Notification Preferences (Matching exact mockup uploaded_media_1793777231235.png) */}
          {platformSettingsTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Notification Preferences</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure which events trigger notifications
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                {/* 1. Business Registration */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800">
                      Business Registration
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Notify when new businesses register
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifyBusinessRegistration}
                    onClick={() => setNotifyBusinessRegistration((prev) => !prev)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer ${
                      notifyBusinessRegistration ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200 ease-in-out ${
                        notifyBusinessRegistration ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Payment Processed */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800">
                      Payment Processed
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Notify on successful payment transactions
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifyPaymentProcessed}
                    onClick={() => setNotifyPaymentProcessed((prev) => !prev)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer ${
                      notifyPaymentProcessed ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200 ease-in-out ${
                        notifyPaymentProcessed ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Suspension Alerts */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800">
                      Suspension Alerts
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Notify when businesses are suspended
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifySuspensionAlerts}
                    onClick={() => setNotifySuspensionAlerts((prev) => !prev)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer ${
                      notifySuspensionAlerts ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200 ease-in-out ${
                        notifySuspensionAlerts ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* 4. System Errors */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800">
                      System Errors
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Notify on critical system errors
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifySystemErrors}
                    onClick={() => setNotifySystemErrors((prev) => !prev)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer ${
                      notifySystemErrors ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200 ease-in-out ${
                        notifySystemErrors ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* 5. Weekly Reports */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800">
                      Weekly Reports
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Receive weekly platform performance reports
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifyWeeklyReports}
                    onClick={() => setNotifyWeeklyReports((prev) => !prev)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out cursor-pointer ${
                      notifyWeeklyReports ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200 ease-in-out ${
                        notifyWeeklyReports ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Save Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveNotificationSettings}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Save Notification Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Database Management (Matching exact mockup uploaded_media_1793777533202.png without Danger Zone) */}
          {platformSettingsTab === 'database' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Database Management</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage database operations and maintenance
                </p>
              </div>

              {/* 1. Database Status Box */}
              <div className="border border-gray-200/90 rounded-2xl p-5 sm:p-6 bg-white space-y-5">
                <h3 className="text-xs font-bold text-gray-900">Database Status</h3>

                <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                  {/* Left Column 1: Size */}
                  <div>
                    <span className="block text-xs text-gray-400 font-medium">Size</span>
                    <span className="block text-sm sm:text-base font-bold text-gray-900 mt-1">
                      {dbStatus.size}
                    </span>
                  </div>

                  {/* Right Column 1: Tables */}
                  <div>
                    <span className="block text-xs text-gray-400 font-medium">Tables</span>
                    <span className="block text-sm sm:text-base font-bold text-gray-900 mt-1">
                      {dbStatus.tables}
                    </span>
                  </div>

                  {/* Left Column 2: Records */}
                  <div>
                    <span className="block text-xs text-gray-400 font-medium">Records</span>
                    <span className="block text-sm sm:text-base font-bold text-gray-900 mt-1">
                      {dbStatus.records}
                    </span>
                  </div>

                  {/* Right Column 2: Last Backup */}
                  <div>
                    <span className="block text-xs text-gray-400 font-medium">Last Backup</span>
                    <span className="block text-sm sm:text-base font-bold text-gray-900 mt-1">
                      {dbStatus.lastBackup}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Database Operations */}
              <div className="space-y-3 pt-1">
                <h3 className="text-xs font-bold text-gray-900">Database Operations</h3>

                <div className="space-y-2.5">
                  {/* Optimize Database Button */}
                  <button
                    type="button"
                    onClick={handleOptimizeDb}
                    disabled={dbOpLoading !== null}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50/80 border border-gray-200/90 rounded-xl transition cursor-pointer text-left shadow-2xs group disabled:opacity-60"
                  >
                    <RefreshCw
                      size={15}
                      className={`text-gray-600 group-hover:text-gray-900 shrink-0 ${
                        dbOpLoading === 'optimize' ? 'animate-spin' : ''
                      }`}
                    />
                    <span className="text-xs font-medium text-gray-800 group-hover:text-gray-900">
                      Optimize Database
                    </span>
                  </button>

                  {/* Create Backup Button */}
                  <button
                    type="button"
                    onClick={handleCreateBackup}
                    disabled={dbOpLoading !== null}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50/80 border border-gray-200/90 rounded-xl transition cursor-pointer text-left shadow-2xs group disabled:opacity-60"
                  >
                    <Database
                      size={15}
                      className={`text-gray-600 group-hover:text-gray-900 shrink-0 ${
                        dbOpLoading === 'backup' ? 'animate-pulse' : ''
                      }`}
                    />
                    <span className="text-xs font-medium text-gray-800 group-hover:text-gray-900">
                      Create Backup
                    </span>
                  </button>

                  {/* Clear Cache Button */}
                  <button
                    type="button"
                    onClick={handleClearCache}
                    disabled={dbOpLoading !== null}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50/80 border border-gray-200/90 rounded-xl transition cursor-pointer text-left shadow-2xs group disabled:opacity-60"
                  >
                    <RefreshCw
                      size={15}
                      className={`text-gray-600 group-hover:text-gray-900 shrink-0 ${
                        dbOpLoading === 'cache' ? 'animate-spin' : ''
                      }`}
                    />
                    <span className="text-xs font-medium text-gray-800 group-hover:text-gray-900">
                      Clear Cache
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VIEW 5: Super Admin Dashboard Overview (matching mockup screenshot uploaded_media_1793637014371.png) */
        <div className="space-y-6">
          {/* Header Area */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Super Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Platform overview and management
              </p>
            </div>

            {/* Top-Right Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => navigate(RouteNames.ADMIN_USERS)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-xs transition cursor-pointer"
              >
                <UserCheck size={15} className="text-gray-600" />
                <span>User Management</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(RouteNames.ADMIN_ANALYTICS)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-xs transition cursor-pointer"
              >
                <BarChart2 size={15} className="text-gray-600" />
                <span>Analytics</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(RouteNames.SETTINGS)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-xs transition cursor-pointer"
              >
                <SettingsIcon size={15} className="text-gray-600" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* Action Required Banner */}
          <div className="bg-[#fffbeb] border border-amber-300/90 rounded-2xl p-5 sm:p-6 shadow-xs flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0 font-bold text-base shadow-xs">
              !
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base">Action Required</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                You have {statusCounts.pending > 0 ? statusCounts.pending : 1} business pending approval
              </p>
              <button
                type="button"
                onClick={() => {
                  navigate(RouteNames.ADMIN_BUSINESSES);
                }}
                className="mt-3 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Review Pending Businesses
              </button>
            </div>
          </div>

          {/* 4 StatCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Total Businesses */}
            <StatCard
              title="Total Businesses"
              icon={<Store size={18} strokeWidth={1.5} className="text-gray-400" />}
              value={totalBusinessesCount}
              trend="↑ 8.3%"
              trendPositive={true}
              progress={{
                value: (statusCounts.active / totalBusinessesCount) * 100,
                label: `${statusCounts.active} active`,
              }}
            />

            {/* Card 2: Platform Revenue */}
            <StatCard
              title="Platform Revenue"
              icon={<DollarSign size={18} strokeWidth={1.5} className="text-gray-400" />}
              value={formattedRevenueShort}
              trend="↑ 15.7%"
              trendPositive={true}
              subtitle={`${formattedAvgRevenueShort} avg per business`}
            />

            {/* Card 3: Platform Profit */}
            <StatCard
              title="Platform Profit"
              icon={<TrendingUp size={18} strokeWidth={1.5} className="text-gray-400" />}
              value={formattedProfit}
              valueColor="text-[#16a34a]"
              trend="↑ 12.5%"
              trendPositive={true}
              subtitle="39.0% profit margin"
            />

            {/* Card 4: Active Users */}
            <StatCard
              title="Active Users"
              icon={<Users size={18} strokeWidth={1.5} className="text-gray-400" />}
              value={activeUsersCount}
              statusBadge={
                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                  <Activity size={12} className="animate-pulse" /> Online
                </span>
              }
              subtitle={`Across ${statusCounts.active} businesses`}
            />
          </div>

          {/* Pill Tabs */}
          <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'performance', label: 'Performance' },
              { id: 'recent_activity', label: 'Recent Activity' },
              { id: 'system_health', label: 'System Health' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview - ONLY the 2 Cards */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Card: Business Status Overview */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-gray-900">Business Status Overview</h3>
                  <p className="text-xs text-gray-400 mt-0.5 mb-5">Current status distribution</p>

                  <div className="space-y-4">
                    {/* Active */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 min-w-[100px]">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-800">Active</span>
                      </div>
                      <div className="flex-1 max-w-[160px] bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-black h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(statusCounts.active / totalBusinessesCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 text-right w-6">
                        {statusCounts.active}
                      </span>
                    </div>

                    {/* Pending */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 min-w-[100px]">
                        <Clock size={16} className="text-amber-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-800">Pending</span>
                      </div>
                      <div className="flex-1 max-w-[160px] bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-black h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(statusCounts.pending / totalBusinessesCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 text-right w-6">
                        {statusCounts.pending}
                      </span>
                    </div>

                    {/* Suspended */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 min-w-[100px]">
                        <Ban size={16} className="text-red-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-800">Suspended</span>
                      </div>
                      <div className="flex-1 max-w-[160px] bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-black h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(statusCounts.suspended / totalBusinessesCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 text-right w-6">
                        {statusCounts.suspended}
                      </span>
                    </div>

                    {/* Inactive */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 min-w-[100px]">
                        <Info size={16} className="text-gray-400 shrink-0" />
                        <span className="text-xs font-medium text-gray-800">Inactive</span>
                      </div>
                      <div className="flex-1 max-w-[160px] bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-black h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(statusCounts.inactive / totalBusinessesCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 text-right w-6">
                        {statusCounts.inactive}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Card: Business Categories */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-gray-900">Business Categories</h3>
                  <p className="text-xs text-gray-400 mt-0.5 mb-5">Distribution by type</p>

                  <div className="space-y-4">
                    {categoryStats.map((cat) => (
                      <div key={cat.type} className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-gray-800 truncate min-w-[90px]">
                          {cat.type}
                        </span>
                        <div className="flex-1 max-w-[160px] bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-black h-full rounded-full transition-all duration-500"
                            style={{ width: `${cat.percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-900 text-right shrink-0">
                          {cat.count} ({cat.percent}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Performance */}
          {activeTab === 'performance' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-gray-900">Platform Performance Trends</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Live store revenue generation and growth statistics</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Platform Health 99.8%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70">
                  <span className="text-xs text-gray-500 font-medium block">Average Monthly Growth</span>
                  <span className="text-xl font-bold text-gray-900 mt-1 block">+18.4%</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Consistent quarter-over-quarter expansion</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70">
                  <span className="text-xs text-gray-500 font-medium block">Total Platform Units Sold</span>
                  <span className="text-xl font-bold text-gray-900 mt-1 block">{stats?.total_orders || 142} orders</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Across all registered commercial points</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/70">
                  <span className="text-xs text-gray-500 font-medium block">Average Order Value</span>
                  <span className="text-xl font-bold text-gray-900 mt-1 block">$880.14</span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Healthy customer purchasing volume</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Recent Activity */}
          {activeTab === 'recent_activity' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-gray-900">Platform Activity & Audit Logs</h3>
              <p className="text-xs text-gray-500 mt-0.5">Chronological record of recent administrative and commercial events</p>

              <div className="divide-y divide-gray-100">
                {businesses.slice(0, 6).map((b, i) => (
                  <div key={b._id || i} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 block">
                          Business status active: {b.name}
                        </span>
                        <span className="text-[11px] text-gray-400 block">
                          Owner: {b.owner?.email || b.contact_email || 'N/A'} • Type: {b.type}
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-400 text-[11px]">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: System Health */}
          {activeTab === 'system_health' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-bold text-base text-gray-900">Platform System Health</h3>
                <p className="text-xs text-gray-500 mt-0.5">Operational integrity and infrastructure monitoring</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center gap-3">
                  <Server className="text-emerald-600 shrink-0" size={24} />
                  <div>
                    <span className="font-bold text-emerald-900 block">Backend API Service</span>
                    <span className="text-emerald-700 text-[11px] block">Operational</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center gap-3">
                  <Database className="text-emerald-600 shrink-0" size={24} />
                  <div>
                    <span className="font-bold text-emerald-900 block">MongoDB Database</span>
                    <span className="text-emerald-700 text-[11px] block">Connected & Healthy</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center gap-3">
                  <Mail className="text-emerald-600 shrink-0" size={24} />
                  <div>
                    <span className="font-bold text-emerald-900 block">Brevo SMTP Relay</span>
                    <span className="text-emerald-700 text-[11px] block">Authenticated & Delivering</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Business Stats Modal */}
      {selectedBusinessId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  {businessDetails?.name?.slice(0, 2).toUpperCase() || 'BH'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">
                      {businessDetails?.name}
                    </h3>
                    {businessDetails?.status === 'blocked' || businessDetails?.status === 'suspended' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200">
                        <Ban size={11} /> Suspended
                      </span>
                    ) : businessDetails?.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock size={11} /> Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={11} /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Owner: <strong className="text-gray-700">{businessDetails?.owner?.full_name || 'N/A'}</strong> ({businessDetails?.owner?.email || businessDetails?.contact_email}) • Type: {businessDetails?.type}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {businessDetails?.status === 'blocked' || businessDetails?.status === 'suspended' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (businessDetails) {
                        setBusinessToUnblock(businessDetails);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>Reactivate</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (businessDetails) {
                        setBusinessToBlock(businessDetails);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Ban size={14} />
                    <span>Suspend Business</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCloseBusinessDetails}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {detailsLoading ? (
                <div className="py-16 text-center text-gray-400">
                  <Loader2 className="animate-spin mx-auto mb-2 text-gray-600" size={32} />
                  Loading live performance metrics and inventory...
                </div>
              ) : businessDetails ? (
                <>
                  {/* Business Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between text-gray-500 mb-1">
                        <span className="text-xs font-medium">Revenue</span>
                        <DollarSign size={16} />
                      </div>
                      <span className="text-lg sm:text-xl font-bold text-gray-900 block">
                        {getCurrencySymbol(businessDetails.currency)}
                        {(businessDetails.stats?.total_revenue || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">Gross sales volume</span>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between text-gray-500 mb-1">
                        <span className="text-xs font-medium">Completed Orders</span>
                        <ShoppingCart size={16} />
                      </div>
                      <span className="text-lg sm:text-xl font-bold text-gray-900 block">
                        {businessDetails.stats?.sales_count || 0}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">Customer transactions</span>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between text-gray-500 mb-1">
                        <span className="text-xs font-medium">Catalog Products</span>
                        <Boxes size={16} />
                      </div>
                      <span className="text-lg sm:text-xl font-bold text-gray-900 block">
                        {businessDetails.stats?.products_count || 0}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">Active SKUs</span>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between text-gray-500 mb-1">
                        <span className="text-xs font-medium">Stock Units</span>
                        <Building2 size={16} />
                      </div>
                      <span className="text-lg sm:text-xl font-bold text-gray-900 block">
                        {businessDetails.stats?.total_inventory_stock || 0}
                      </span>
                      <span className="text-[10px] text-amber-600 mt-0.5 block">
                        {businessDetails.stats?.low_stock_count || 0} low stock
                      </span>
                    </div>
                  </div>

                  {/* Modal Sub-Tabs */}
                  <div className="border-b border-gray-200">
                    <div className="flex gap-4">
                      {(['overview', 'sales', 'products'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveDetailsTab(tab)}
                          className={`pb-3 text-xs font-semibold capitalize border-b-2 transition cursor-pointer ${
                            activeDetailsTab === tab
                              ? 'border-black text-black'
                              : 'border-transparent text-gray-400 hover:text-gray-700'
                          }`}
                        >
                          {tab === 'overview'
                            ? 'Overview & Contact'
                            : tab === 'sales'
                            ? `Recent Sales (${businessDetails.sales?.length || 0})`
                            : `Products Catalog (${businessDetails.products?.length || 0})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sub-Tab Content */}
                  <div>
                    {/* Overview Sub-tab */}
                    {activeDetailsTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2">
                          <h4 className="font-bold text-gray-900 text-sm">Commercial Profile</h4>
                          <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-500">Business Name:</span>
                            <span className="font-semibold text-gray-800">{businessDetails.name}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-500">Business Type:</span>
                            <span className="font-semibold text-gray-800">{businessDetails.type}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-500">Currency:</span>
                            <span className="font-semibold text-gray-800">{businessDetails.currency || 'USD'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-500">Registered Date:</span>
                            <span className="font-semibold text-gray-800">
                              {new Date(businessDetails.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">Low Stock Threshold:</span>
                            <span className="font-semibold text-gray-800">{businessDetails.low_stock_threshold ?? 10} units</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2">
                          <h4 className="font-bold text-gray-900 text-sm">Account Owner Contact</h4>
                          <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-500">Primary Contact:</span>
                            <span className="font-semibold text-gray-800">{businessDetails.owner?.full_name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-500">Owner Email:</span>
                            <span className="font-semibold text-gray-800 font-mono">{businessDetails.owner?.email || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-500">Store Email:</span>
                            <span className="font-semibold text-gray-800">{businessDetails.contact_email || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-500">Phone:</span>
                            <span className="font-semibold text-gray-800">{businessDetails.contact_phone || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">Address:</span>
                            <span className="font-semibold text-gray-800">{businessDetails.address || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sales Sub-tab */}
                    {activeDetailsTab === 'sales' && (
                      <div className="pt-3">
                        {businessDetails.sales?.length === 0 ? (
                          <p className="text-xs text-gray-400 py-6 text-center">
                            No sales records found for this business yet.
                          </p>
                        ) : (
                          <div className="overflow-x-auto border border-gray-200 rounded-xl">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                                <tr>
                                  <th className="px-3 py-2">Date</th>
                                  <th className="px-3 py-2">Customer</th>
                                  <th className="px-3 py-2">Payment</th>
                                  <th className="px-3 py-2">Total Amount</th>
                                  <th className="px-3 py-2">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {businessDetails.sales?.slice(0, 10).map((s: any) => (
                                  <tr key={s._id} className="hover:bg-gray-50/60">
                                    <td className="px-3 py-2 font-mono text-gray-600">
                                      {new Date(s.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-2 font-medium text-gray-900">
                                      {s.customer_name || 'Walk-in'}
                                    </td>
                                    <td className="px-3 py-2 capitalize text-gray-600">
                                      {s.payment_method || 'Cash'}
                                    </td>
                                    <td className="px-3 py-2 font-bold text-gray-900">
                                      {getCurrencySymbol(businessDetails.currency)}{s.total_amount}
                                    </td>
                                    <td className="px-3 py-2">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                        Completed
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Products Sub-tab */}
                    {activeDetailsTab === 'products' && (
                      <div className="pt-3">
                        {businessDetails.products?.length === 0 ? (
                          <p className="text-xs text-gray-400 py-6 text-center">
                            No products currently registered for this business.
                          </p>
                        ) : (
                          <div className="overflow-x-auto border border-gray-200 rounded-xl">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                                <tr>
                                  <th className="px-3 py-2">Product Name</th>
                                  <th className="px-3 py-2">SKU</th>
                                  <th className="px-3 py-2">Current Stock</th>
                                  <th className="px-3 py-2">Cost Price</th>
                                  <th className="px-3 py-2">Selling Price</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {businessDetails.products?.slice(0, 10).map((p: any) => (
                                  <tr key={p._id} className="hover:bg-gray-50/60">
                                    <td className="px-3 py-2 font-medium text-gray-900">{p.name}</td>
                                    <td className="px-3 py-2 font-mono text-gray-500">{p.sku || '-'}</td>
                                    <td className="px-3 py-2 font-semibold">
                                      <span
                                        className={
                                          p.stock_quantity <= (businessDetails.low_stock_threshold || 10)
                                            ? 'text-amber-600'
                                            : 'text-gray-700'
                                        }
                                      >
                                        {p.stock_quantity}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">
                                      {getCurrencySymbol(businessDetails.currency)}{p.cost_price}
                                    </td>
                                    <td className="px-3 py-2 font-bold text-gray-900">
                                      {getCurrencySymbol(businessDetails.currency)}{p.selling_price}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Block / Suspend Business */}
      {businessToBlock && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Ban size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Suspend Business Account</h3>
                <p className="text-xs text-gray-500">Access suspension confirmation</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to suspend <strong className="text-gray-900">{businessToBlock.name}</strong>?
              Its owner (<span className="text-gray-800 font-mono">{businessToBlock.owner?.email || businessToBlock.contact_email}</span>) and associated team will be immediately barred from logging in.
            </p>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Reason for Suspension (Optional):
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g. Terms of Service violation, non-payment, pending investigation..."
                rows={3}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-red-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBusinessToBlock(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading && <Loader2 size={13} className="animate-spin" />}
                <span>Confirm Suspension</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reactivate Business */}
      {businessToUnblock && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Reactivate Business Account</h3>
                <p className="text-xs text-gray-500">Restore complete platform access</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Reactivating <strong className="text-gray-900">{businessToUnblock.name}</strong> will immediately restore login and operational capabilities for owner <span className="text-gray-800 font-mono">{businessToUnblock.owner?.email || businessToUnblock.contact_email}</span>.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBusinessToUnblock(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnblock}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading && <Loader2 size={13} className="animate-spin" />}
                <span>Confirm Reactivation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}