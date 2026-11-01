import { apiRequest } from './api.config';
import { SupplierEntity } from '../components/entities/supplier.entity';

export const supplierService = {
  async getSuppliers(): Promise<SupplierEntity[]> {
    return apiRequest<SupplierEntity[]>('/suppliers', {
      method: 'GET',
    });
  },

  async getSupplier(id: string | number): Promise<SupplierEntity> {
    return apiRequest<SupplierEntity>(`/suppliers/${id}`, {
      method: 'GET',
    });
  },

  async createSupplier(data: Partial<SupplierEntity>): Promise<SupplierEntity> {
    return apiRequest<SupplierEntity>('/suppliers', {
      method: 'POST',
      data,
    });
  },

  async updateSupplier(id: string | number, data: Partial<SupplierEntity>): Promise<SupplierEntity> {
    return apiRequest<SupplierEntity>(`/suppliers/${id}`, {
      method: 'PATCH',
      data,
    });
  },

  async deleteSupplier(id: string | number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  },
};
