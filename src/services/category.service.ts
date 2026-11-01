import { apiRequest } from './api.config';
import { CategoryEntity } from '../components/entities/category.entity';

export const categoryService = {
  async getCategories(): Promise<CategoryEntity[]> {
    return apiRequest<CategoryEntity[]>('/categories', {
      method: 'GET',
    });
  },

  async getCategory(id: string | number): Promise<CategoryEntity> {
    return apiRequest<CategoryEntity>(`/categories/${id}`, {
      method: 'GET',
    });
  },

  async createCategory(data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    return apiRequest<CategoryEntity>('/categories', {
      method: 'POST',
      data,
    });
  },

  async updateCategory(id: string | number, data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    return apiRequest<CategoryEntity>(`/categories/${id}`, {
      method: 'PATCH',
      data,
    });
  },

  async deleteCategory(id: string | number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};
