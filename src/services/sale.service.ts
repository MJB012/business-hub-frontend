import { apiRequest } from './api.config';
import { SaleEntity } from '../components/entities/sale.entity';

export interface SalesStats {
  total_revenue: number;
  today_revenue: number;
  total_orders: number;
  today_orders: number;
}

export const saleService = {
  async getSales(): Promise<SaleEntity[]> {
    return apiRequest<SaleEntity[]>('/sales', {
      method: 'GET',
    });
  },

  async getSale(id: string | number): Promise<SaleEntity> {
    return apiRequest<SaleEntity>(`/sales/${id}`, {
      method: 'GET',
    });
  },

  async getSalesStats(): Promise<SalesStats> {
    return apiRequest<SalesStats>('/sales/stats', {
      method: 'GET',
    });
  },

  async createSale(data: Partial<SaleEntity>): Promise<SaleEntity> {
    return apiRequest<SaleEntity>('/sales', {
      method: 'POST',
      data,
    });
  },

  async updateSale(id: string | number, data: Partial<SaleEntity>): Promise<SaleEntity> {
    return apiRequest<SaleEntity>(`/sales/${id}`, {
      method: 'PATCH',
      data,
    });
  },

  async deleteSale(id: string | number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/sales/${id}`, {
      method: 'DELETE',
    });
  },
};
