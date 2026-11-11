import { apiRequest } from './api.config';
import type {
  ReportQuery,
  FinancialSummaryReport,
  SalesReport,
  ExpensesReport,
  InventoryReport,
} from '../components/entities/report.entity';

const buildQueryString = (query?: ReportQuery): string => {
  if (!query) return '';
  const params = new URLSearchParams();
  if (query.startDate) params.append('startDate', query.startDate);
  if (query.endDate) params.append('endDate', query.endDate);
  if (query.category && query.category !== 'all') params.append('category', query.category);
  if (query.payment_method && query.payment_method !== 'all') {
    params.append('payment_method', query.payment_method);
  }
  const str = params.toString();
  return str ? `?${str}` : '';
};

export const reportService = {
  async getFinancialSummary(query?: ReportQuery): Promise<FinancialSummaryReport> {
    const qs = buildQueryString(query);
    return apiRequest<FinancialSummaryReport>(`/reports/summary${qs}`, {
      method: 'GET',
    });
  },

  async getSalesReport(query?: ReportQuery): Promise<SalesReport> {
    const qs = buildQueryString(query);
    return apiRequest<SalesReport>(`/reports/sales${qs}`, {
      method: 'GET',
    });
  },

  async getExpensesReport(query?: ReportQuery): Promise<ExpensesReport> {
    const qs = buildQueryString(query);
    return apiRequest<ExpensesReport>(`/reports/expenses${qs}`, {
      method: 'GET',
    });
  },

  async getInventoryReport(): Promise<InventoryReport> {
    return apiRequest<InventoryReport>('/reports/inventory', {
      method: 'GET',
    });
  },
};
