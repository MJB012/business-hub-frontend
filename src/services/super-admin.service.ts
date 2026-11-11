import { apiRequest } from './api.config';

export interface PlatformStats {
  total_businesses: number;
  active_businesses: number;
  pending_businesses?: number;
  blocked_businesses: number;
  inactive_businesses?: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  total_users?: number;
}

export interface BusinessOwner {
  _id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface RegisteredBusiness {
  _id: string;
  name: string;
  type: string;
  status: 'active' | 'blocked' | 'suspended' | 'pending' | 'inactive';
  logo?: string | null;
  contact_email?: string;
  contact_phone?: string;
  currency?: string;
  address?: string;
  low_stock_threshold?: number;
  blocked_at?: string | null;
  block_reason?: string;
  createdAt: string;
  updatedAt: string;
  owner?: BusinessOwner | null;
  products_count: number;
  sales_count: number;
  total_revenue: number;
}

export interface BusinessStatsDetails extends RegisteredBusiness {
  stats: {
    products_count: number;
    total_inventory_stock: number;
    low_stock_count: number;
    sales_count: number;
    total_revenue: number;
    avg_order_value: number;
  };
  products: any[];
  sales: any[];
}

export interface PlatformUser {
  id: string;
  initials?: string;
  full_name: string;
  email: string;
  business_name?: string;
  role: string;
  status: 'Active' | 'Suspended' | 'Inactive';
  last_login?: string;
  joined?: string;
  createdAt?: string;
}

export const superAdminService = {
  async getUsers(): Promise<PlatformUser[]> {
    return apiRequest<PlatformUser[]>('/super-admin/users', {
      method: 'GET',
    });
  },

  async getStats(): Promise<PlatformStats> {
    return apiRequest<PlatformStats>('/super-admin/stats', {
      method: 'GET',
    });
  },

  async getBusinesses(): Promise<RegisteredBusiness[]> {
    return apiRequest<RegisteredBusiness[]>('/super-admin/businesses', {
      method: 'GET',
    });
  },

  async getBusinessDetails(id: string): Promise<BusinessStatsDetails> {
    return apiRequest<BusinessStatsDetails>(`/super-admin/businesses/${id}`, {
      method: 'GET',
    });
  },

  async updateBusinessStatus(
    id: string,
    status: 'active' | 'blocked' | 'suspended' | 'pending' | 'inactive',
    reason?: string,
  ): Promise<RegisteredBusiness> {
    return apiRequest<RegisteredBusiness>(`/super-admin/businesses/${id}/status`, {
      method: 'PATCH',
      data: { status, reason },
    });
  },
};
