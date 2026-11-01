import { apiRequest } from './api.config';
import { ProductEntity } from '../components/entities/product.entity';

export const productService = {
  async getProducts(): Promise<ProductEntity[]> {
    return apiRequest<ProductEntity[]>('/products', {
      method: 'GET',
    });
  },

  async getProduct(id: string | number): Promise<ProductEntity> {
    return apiRequest<ProductEntity>(`/products/${id}`, {
      method: 'GET',
    });
  },

  async createProduct(data: Partial<ProductEntity>): Promise<ProductEntity> {
    return apiRequest<ProductEntity>('/products', {
      method: 'POST',
      data,
    });
  },

  async updateProduct(id: string | number, data: Partial<ProductEntity>): Promise<ProductEntity> {
    return apiRequest<ProductEntity>(`/products/${id}`, {
      method: 'PATCH',
      data,
    });
  },

  async deleteProduct(id: string | number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};
