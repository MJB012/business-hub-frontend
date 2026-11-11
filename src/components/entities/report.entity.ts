export interface ReportQuery {
  startDate?: string;
  endDate?: string;
  category?: string;
  payment_method?: string;
}

export interface DailyTimelineItem {
  date: string;
  revenue: number;
  expenses: number;
  net_profit: number;
  orders: number;
}

export interface FinancialSummaryReport {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  net_profit_margin: number;
  total_orders: number;
  total_units_sold: number;
  total_discounts: number;
  average_order_value: number;
  total_expense_entries: number;
  daily_timeline: DailyTimelineItem[];
}

export interface TopProductItem {
  name: string;
  units_sold: number;
  revenue: number;
  orders_count: number;
  average_price: number;
  percentage_of_sales: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface TopCustomerItem {
  name: string;
  total_spent: number;
  orders_count: number;
}

export interface SalesReport {
  total_revenue: number;
  total_units: number;
  total_orders: number;
  total_discounts: number;
  average_order_value: number;
  largest_sale: number;
  top_products: TopProductItem[];
  payment_methods: PaymentMethodBreakdown[];
  top_customers: TopCustomerItem[];
  sales_trend: Array<{
    date: string;
    revenue: number;
    orders: number;
    units: number;
  }>;
}

export interface ExpenseCategoryBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface TopVendorItem {
  vendor: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface ExpensesReport {
  total_expenses: number;
  entries_count: number;
  average_expense: number;
  largest_expense: number;
  categories: ExpenseCategoryBreakdown[];
  payment_methods: PaymentMethodBreakdown[];
  top_vendors: TopVendorItem[];
  expense_trend: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
}

export interface InventoryCategoryBreakdown {
  category: string;
  products_count: number;
  total_quantity: number;
  total_value: number;
  percentage_of_value: number;
}

export interface LowStockAlertItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  threshold: number;
  status: 'low_stock' | 'out_of_stock';
}

export interface InventoryReport {
  total_products: number;
  total_stock_quantity: number;
  total_inventory_valuation: number;
  health_summary: {
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
  };
  category_breakdown: InventoryCategoryBreakdown[];
  low_stock_alerts: LowStockAlertItem[];
}
