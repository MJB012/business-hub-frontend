import { apiRequest } from './api.config';
import { ExpenseEntity } from '../components/entities/expense.entity';

const STORAGE_KEY = 'business_expenses';

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  payment_method?: string;
  search?: string;
}

export interface ExpenseStats {
  total_expenses: number;
  monthly_expenses: number;
  today_expenses: number;
  entries_count: number;
  average_expense: number;
  largest_expense: number;
  top_category: { category: string; amount: number; percentage: number } | null;
  category_breakdown: Array<{ category: string; amount: number; percentage: number }>;
}

let syncAttempted = false;

export const expenseService = {
  /**
   * Automatically migrate any locally saved legacy expenses to backend once
   */
  async syncLegacyLocalExpenses(): Promise<void> {
    if (syncAttempted) return;
    syncAttempted = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const items: Partial<ExpenseEntity>[] = JSON.parse(stored);
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          // If item already has a non-temporary MongoDB ID, skip
          if (item._id && !item._id.startsWith('exp_')) continue;
          try {
            await apiRequest('/expenses', {
              method: 'POST',
              data: {
                description: item.description,
                amount: Number(item.amount),
                date: item.date,
                category: item.category,
                payment_method: item.payment_method || 'Cash',
                vendor: item.vendor || '',
                receipt_no: item.receipt_no || '',
                notes: item.notes || '',
              },
            });
          } catch {
            // ignore individual failure
          }
        }
      }
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  async getExpenses(filters?: ExpenseFilters): Promise<ExpenseEntity[]> {
    await this.syncLegacyLocalExpenses();

    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters?.payment_method && filters.payment_method !== 'all') params.append('payment_method', filters.payment_method);
    if (filters?.search && filters.search.trim()) params.append('search', filters.search.trim());

    const queryString = params.toString();
    const endpoint = queryString ? `/expenses?${queryString}` : '/expenses';

    return await apiRequest<ExpenseEntity[]>(endpoint, {
      method: 'GET',
    });
  },

  async getExpense(id: string | number): Promise<ExpenseEntity> {
    return await apiRequest<ExpenseEntity>(`/expenses/${id}`, {
      method: 'GET',
    });
  },

  async getExpenseStats(): Promise<ExpenseStats> {
    return await apiRequest<ExpenseStats>('/expenses/stats', {
      method: 'GET',
    });
  },

  async createExpense(data: Partial<ExpenseEntity>): Promise<ExpenseEntity> {
    const payload = {
      description: data.description,
      amount: Number(data.amount),
      date: data.date,
      category: data.category,
      payment_method: data.payment_method || 'Cash',
      vendor: data.vendor || '',
      receipt_no: data.receipt_no || '',
      notes: data.notes || '',
    };

    const response = await apiRequest<ExpenseEntity>('/expenses', {
      method: 'POST',
      data: payload,
    });

    window.dispatchEvent(new Event('expenses_updated'));
    return response;
  },

  async updateExpense(id: string | number, data: Partial<ExpenseEntity>): Promise<ExpenseEntity> {
    const payload: Record<string, any> = {};
    if (data.description !== undefined) payload.description = data.description;
    if (data.amount !== undefined) payload.amount = Number(data.amount);
    if (data.date !== undefined) payload.date = data.date;
    if (data.category !== undefined) payload.category = data.category;
    if (data.payment_method !== undefined) payload.payment_method = data.payment_method;
    if (data.vendor !== undefined) payload.vendor = data.vendor;
    if (data.receipt_no !== undefined) payload.receipt_no = data.receipt_no;
    if (data.notes !== undefined) payload.notes = data.notes;

    const response = await apiRequest<ExpenseEntity>(`/expenses/${id}`, {
      method: 'PATCH',
      data: payload,
    });

    window.dispatchEvent(new Event('expenses_updated'));
    return response;
  },

  async deleteExpense(id: string | number): Promise<{ message: string }> {
    const response = await apiRequest<{ message: string }>(`/expenses/${id}`, {
      method: 'DELETE',
    });

    window.dispatchEvent(new Event('expenses_updated'));
    return response;
  },
};
