import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarItem } from '../sidebar-item/SideBarItem';
import {
  Store,
  LogOut,
  X,
  Shield,
  LayoutGrid,
  Users,
  BarChart2,
  FileText,
  Settings,
} from 'lucide-react';
import { sidebarRoutes } from '../../routes/routes';
import { RouteNames } from '../../routes/RouteNames';
import { UserRoleEnum } from '../../enums/UserRoleEnum';

export interface UserProfile {
  name: string;
  businessName: string;
  role: string;
  email: string;
  logo?: string | null;
}

interface SidebarProps {
  onClose?: () => void;
  user?: Partial<UserProfile>;
}

const DEFAULT_USER: UserProfile = {
  name: 'User',
  businessName: 'Business Hub',
  role: 'Business Owner',
  email: '',
  logo: null,
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Sidebar: FC<SidebarProps> = ({ onClose, user: propUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const storedShop = localStorage.getItem('shop_settings');
      const shopParsed = storedShop ? JSON.parse(storedShop) : null;
      const stored = localStorage.getItem('user');
      if (stored || shopParsed) {
        const parsed = stored ? JSON.parse(stored) : {};
        return {
          name: parsed.full_name || parsed.name || DEFAULT_USER.name,
          businessName:
            shopParsed?.shop_name ||
            shopParsed?.shopName ||
            parsed.business_name ||
            parsed.businessName ||
            DEFAULT_USER.businessName,
          role:
            parsed.role === UserRoleEnum.ADMIN || parsed.role === 'admin'
              ? 'Business Owner'
              : parsed.role === UserRoleEnum.SUPER_ADMIN || parsed.role === 'super_admin'
              ? 'Super Admin'
              : parsed.role || DEFAULT_USER.role,
          email: parsed.email || DEFAULT_USER.email,
          logo: shopParsed?.shop_logo !== undefined ? shopParsed.shop_logo : (shopParsed?.shopLogo || null),
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_USER;
  });

  useEffect(() => {
    if (propUser) {
      setCurrentUser((prev) => ({
        ...prev,
        ...propUser,
      }));
    }
  }, [propUser]);

  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const storedShop = localStorage.getItem('shop_settings');
        const stored = localStorage.getItem('user');
        const shopParsed = storedShop ? JSON.parse(storedShop) : null;
        const parsed = stored ? JSON.parse(stored) : null;
        if (shopParsed || parsed) {
          setCurrentUser((prev) => ({
            ...prev,
            businessName:
              shopParsed?.shop_name ||
              shopParsed?.shopName ||
              parsed?.business_name ||
              parsed?.businessName ||
              prev.businessName,
            logo: shopParsed?.shop_logo !== undefined ? shopParsed.shop_logo : (shopParsed?.shopLogo ?? prev.logo),
          }));
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {
      // ignore
    }
    if (onClose) {
      onClose();
    }
    navigate(RouteNames.LOGIN);
  };

  const isSuperAdmin =
    currentUser.role === 'Super Admin' ||
    currentUser.role === UserRoleEnum.SUPER_ADMIN ||
    currentUser.role === 'super_admin';

  // Super Admin sidebar items matching exact design
  const superAdminRoutes = [
    {
      path: RouteNames.DASHBOARD,
      label: 'Dashboard',
      icon: <LayoutGrid size={18} strokeWidth={2} />,
    },
    {
      path: RouteNames.ADMIN_BUSINESSES,
      label: 'Businesses',
      icon: <Store size={18} strokeWidth={2} />,
    },
    {
      path: RouteNames.ADMIN_USERS,
      label: 'User Management',
      icon: <Users size={18} strokeWidth={2} />,
    },
    {
      path: RouteNames.ADMIN_ANALYTICS,
      label: 'Analytics',
      icon: <BarChart2 size={18} strokeWidth={2} />,
    },
    {
      path: RouteNames.ADMIN_AUDIT_LOGS,
      label: 'Audit Logs',
      icon: <FileText size={18} strokeWidth={2} />,
    },
    {
      path: RouteNames.SETTINGS,
      label: 'Settings',
      icon: <Settings size={18} strokeWidth={2} />,
    },
  ];

  // Only render routes configured to show in sidebar
  const visibleRoutes = isSuperAdmin
    ? superAdminRoutes
    : sidebarRoutes.filter((route) => {
        if (route.showInSidebar === false) return false;
        if (route.superAdminOnly) return false;
        return true;
      });

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            {isSuperAdmin ? (
              <Shield className="text-white" size={20} />
            ) : currentUser.logo ? (
              <img
                src={currentUser.logo}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <Store className="text-white" size={20} />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-bold text-gray-900 leading-tight tracking-tight">
              Business Hub
            </span>
            <span className="text-xs text-gray-500 font-normal leading-tight mt-0.5 truncate">
              {isSuperAdmin ? 'Admin Panel' : currentUser.businessName}
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleRoutes.map((route) => (
          <div key={route.path} onClick={() => handleNavigate(route.path)}>
            <SidebarItem
              icon={route.icon}
              label={route.label}
              active={
                location.pathname === route.path ||
                (route.path === RouteNames.DASHBOARD && location.pathname === RouteNames.SUPER_ADMIN) ||
                (route.path === RouteNames.SETTINGS && location.pathname === RouteNames.ADMIN_SETTINGS) ||
                (route.path === RouteNames.ADMIN_SETTINGS && location.pathname === RouteNames.SETTINGS)
              }
            />
          </div>
        ))}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-gray-200">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
            {isSuperAdmin ? 'SA' : getInitials(currentUser.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-gray-900 leading-tight truncate">
              {isSuperAdmin ? 'Super Admin' : currentUser.name}
            </span>
            <span
              className={`${
                isSuperAdmin
                  ? 'bg-black text-white text-[10px] font-semibold px-2 py-0.5 rounded-full'
                  : 'bg-gray-100 text-gray-700 text-[11px] font-medium px-2 py-0.5 rounded'
              } inline-block w-fit mt-1 leading-tight`}
            >
              {currentUser.role}
            </span>
            <span className="text-xs text-gray-400 mt-1 leading-tight truncate">
              {currentUser.email}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-4 pt-1">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-semibold transition-colors cursor-pointer w-fit"
          >
            <LogOut size={16} className="text-red-600" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
