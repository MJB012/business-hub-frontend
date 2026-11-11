import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Box,
  Calendar,
  Download,
  Printer,
  ShoppingBag,
  CreditCard,
  Users,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { reportService } from '../../services/report.service';
import { categoryService } from '../../services/category.service';
import { useCurrency } from '../../services/currency.service';
import type {
  FinancialSummaryReport,
  SalesReport,
  ExpensesReport,
  InventoryReport,
} from '../../components/entities/report.entity';

type TabType = 'overview' | 'sales' | 'expenses' | 'inventory';
type TimeframeOption = 'today' | 'week' | 'month' | '30d' | 'year' | 'all' | 'custom';

// Helper to format local date without UTC conversion timezone skew
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Reports() {
  const currencySymbol = useCurrency();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [financialSummary, setFinancialSummary] = useState<FinancialSummaryReport | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [expensesReport, setExpensesReport] = useState<ExpensesReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);

  // Load custom business categories on mount
  useEffect(() => {
    categoryService
      .getCategories()
      .then((cats) => {
        if (Array.isArray(cats)) {
          setCategoriesList(cats.map((c) => c.name).filter((n): n is string => Boolean(n)));
        }
      })
      .catch((err) => {
        console.warn('Could not load custom categories:', err);
      });
  }, []);

  // Compute union of available categories
  const allCategories = useMemo(() => {
    const set = new Set<string>(categoriesList);
    if (expensesReport?.categories) {
      expensesReport.categories.forEach((c) => set.add(c.category));
    }
    if (set.size === 0) {
      ['Rent & Lease', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'Maintenance', 'General'].forEach((c) =>
        set.add(c),
      );
    }
    return Array.from(set).sort();
  }, [categoriesList, expensesReport]);

  // Calculate local date strings based on selected timeframe
  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStr = formatLocalDate(now);

    if (timeframe === 'today') {
      return { startDate: todayStr, endDate: todayStr };
    }
    if (timeframe === 'week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      startOfWeek.setDate(startOfWeek.getDate() + diff);
      return { startDate: formatLocalDate(startOfWeek), endDate: todayStr };
    }
    if (timeframe === '30d') {
      const past30 = new Date(now);
      past30.setDate(now.getDate() - 29);
      return { startDate: formatLocalDate(past30), endDate: todayStr };
    }
    if (timeframe === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: formatLocalDate(firstDay), endDate: todayStr };
    }
    if (timeframe === 'year') {
      const firstDayYear = new Date(now.getFullYear(), 0, 1);
      return { startDate: formatLocalDate(firstDayYear), endDate: todayStr };
    }
    if (timeframe === 'custom') {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
      };
    }
    // 'all'
    return {};
  }, [timeframe, customStartDate, customEndDate]);

  // Combined query parameters for backend
  const queryParams = useMemo(() => {
    return {
      ...dateRange,
      payment_method: selectedPaymentMethod !== 'all' ? selectedPaymentMethod : undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
    };
  }, [dateRange, selectedPaymentMethod, selectedCategory]);

  // Fetch report data
  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summary, sales, expenses, inventory] = await Promise.all([
        reportService.getFinancialSummary(queryParams),
        reportService.getSalesReport(queryParams),
        reportService.getExpensesReport(queryParams),
        reportService.getInventoryReport(),
      ]);
      setFinancialSummary(summary);
      setSalesReport(sales);
      setExpensesReport(expenses);
      setInventoryReport(inventory);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setError(err.message || 'Failed to load report analytics');
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Export CSV for active tab
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeTab === 'overview' && financialSummary) {
      headers = ['Metric', 'Value'];
      rows = [
        ['Total Revenue', financialSummary.total_revenue.toFixed(2)],
        ['Total Expenses', financialSummary.total_expenses.toFixed(2)],
        ['Net Profit', financialSummary.net_profit.toFixed(2)],
        ['Net Profit Margin (%)', financialSummary.net_profit_margin.toFixed(2)],
        ['Total Orders', financialSummary.total_orders],
        ['Total Units Sold', financialSummary.total_units_sold],
        ['Total Discounts', financialSummary.total_discounts.toFixed(2)],
        ['Average Order Value', financialSummary.average_order_value.toFixed(2)],
      ];
    } else if (activeTab === 'sales' && salesReport) {
      headers = ['Product Name', 'Units Sold', 'Orders Count', 'Revenue', 'Avg Unit Price', '% of Sales'];
      rows = salesReport.top_products.map((p) => [
        `"${p.name.replace(/"/g, '""')}"`,
        p.units_sold,
        p.orders_count,
        p.revenue.toFixed(2),
        p.average_price.toFixed(2),
        `${p.percentage_of_sales.toFixed(1)}%`,
      ]);
    } else if (activeTab === 'expenses' && expensesReport) {
      headers = ['Category', 'Entries Count', 'Total Amount', '% of Total Spend'];
      rows = expensesReport.categories.map((c) => [
        `"${c.category.replace(/"/g, '""')}"`,
        c.count,
        c.amount.toFixed(2),
        `${c.percentage.toFixed(1)}%`,
      ]);
    } else if (activeTab === 'inventory' && inventoryReport) {
      headers = ['Product Name', 'SKU', 'Category', 'Stock Qty', 'Price', 'Threshold', 'Status'];
      rows = inventoryReport.low_stock_alerts.map((item) => [
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.sku.replace(/"/g, '""')}"`,
        `"${item.category.replace(/"/g, '""')}"`,
        item.quantity,
        item.price.toFixed(2),
        item.threshold,
        item.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock',
      ]);
    }

    if (rows.length === 0) return;

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const businessName = useMemo(() => {
    try {
      const storedShop = localStorage.getItem('shop_settings');
      const shopParsed = storedShop ? JSON.parse(storedShop) : null;
      const stored = localStorage.getItem('user');
      const userParsed = stored ? JSON.parse(stored) : null;
      return (
        shopParsed?.shop_name ||
        shopParsed?.shopName ||
        userParsed?.business_name ||
        userParsed?.businessName ||
        'Business Hub'
      );
    } catch {
      return 'Business Hub';
    }
  }, []);

  const handlePrint = () => {
    const originalTitle = document.title;
    const tabName =
      activeTab === 'overview'
        ? 'Financial_Overview_Report'
        : activeTab === 'sales'
        ? 'Sales_Performance_Report'
        : activeTab === 'expenses'
        ? 'Expense_Analysis_Report'
        : 'Inventory_Valuation_Report';
    const dateStr = formatLocalDate(new Date());
    document.title = `${businessName.replace(/\s+/g, '_')}_${tabName}_${dateStr}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div id="printable-report" className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Printable Report Document Header (visible on print/PDF only) */}
      <div className="print-only pb-4 mb-6 border-b-2 border-gray-900">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
              {businessName}
            </h1>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {activeTab === 'overview'
                ? 'Financial Overview (Profit & Loss Statement)'
                : activeTab === 'sales'
                ? 'Sales Performance & Product Analytics Report'
                : activeTab === 'expenses'
                ? 'Expense Analysis & Disbursement Report'
                : 'Inventory Valuation & Stock Health Report'}
            </p>
          </div>
          <div className="text-right text-xs text-gray-600 space-y-0.5">
            <p>
              <span className="font-semibold text-gray-800">Reporting Window: </span>
              {queryParams.startDate ? `${queryParams.startDate} — ${queryParams.endDate || 'Present'}` : 'All Time History'}
            </p>
            {queryParams.payment_method && (
              <p>
                <span className="font-semibold text-gray-800">Payment: </span>
                {queryParams.payment_method}
              </p>
            )}
            {queryParams.category && (
              <p>
                <span className="font-semibold text-gray-800">Category: </span>
                {queryParams.category}
              </p>
            )}
            <p>
              <span className="font-semibold text-gray-800">Generated: </span>
              {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Header Area (screen only) */}
      <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-gray-400 mb-1">
            <BarChart3 size={15} className="text-gray-500" />
            <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              BUSINESS INTELLIGENCE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Executive Profit &amp; Loss statements, revenue velocity, expenditure tracking, and stock valuation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="no-print flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          <button
            type="button"
            onClick={loadReports}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition cursor-pointer"
            title="Print or export as PDF"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="no-print bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-2xs">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Filter Bar: Timeframe pills, Custom Dates, Category & Payment Method */}
      <div className="no-print bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 shadow-2xs space-y-3">
        {/* Row 1: Timeframe buttons & Custom Range */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: 'month', label: 'This Month' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'week', label: 'This Week' },
                { id: 'today', label: 'Today' },
                { id: 'year', label: 'This Year' },
                { id: 'all', label: 'All Time' },
                { id: 'custom', label: 'Custom' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  timeframe === t.id
                    ? 'bg-black text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          {timeframe === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Calendar size={13} className="text-gray-400" />
                <span>From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <span>To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Secondary Dropdown Filters (Payment Method, Category, Reset) */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Payment Method Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <CreditCard size={13} className="text-gray-400" />
              <label htmlFor="report-payment-filter" className="text-gray-500 font-medium">Payment:</label>
              <select
                id="report-payment-filter"
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-gray-400 cursor-pointer font-medium"
              >
                <option value="all">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Payment">Mobile Payment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Receipt size={13} className="text-gray-400" />
              <label htmlFor="report-category-filter" className="text-gray-500 font-medium">Category:</label>
              <select
                id="report-category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-gray-400 cursor-pointer font-medium"
              >
                <option value="all">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filters button if non-default filter is active */}
          {(timeframe !== 'month' || selectedPaymentMethod !== 'all' || selectedCategory !== 'all' || customStartDate || customEndDate) && (
            <button
              type="button"
              onClick={() => {
                setTimeframe('month');
                setSelectedPaymentMethod('all');
                setSelectedCategory('all');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-xs text-gray-500 hover:text-gray-800 font-semibold underline underline-offset-2 transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="no-print flex border-b border-gray-200 gap-6 sm:gap-8 overflow-x-auto text-xs font-semibold">
        {(
          [
            { id: 'overview', label: 'Financial Overview (P&L)', icon: DollarSign },
            { id: 'sales', label: 'Sales Performance', icon: ShoppingBag },
            { id: 'expenses', label: 'Expense Analysis', icon: Receipt },
            { id: 'inventory', label: 'Inventory Valuation', icon: Box },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-black text-gray-900 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Contents */}
      {isLoading ? (
        <div className="py-24 text-center text-xs text-gray-400">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-gray-400" />
          <span>Calculating financial reports...</span>
        </div>
      ) : (
        <div>
          {/* TAB 1: Financial Overview (P&L) */}
          {activeTab === 'overview' && financialSummary && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Total Revenue */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>Gross Revenue</span>
                    <TrendingUp size={15} className="text-emerald-600" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                      {currencySymbol}
                      {financialSummary.total_revenue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      From {financialSummary.total_orders} orders ({financialSummary.total_units_sold} units)
                    </p>
                  </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>Operating Expenses</span>
                    <TrendingDown size={15} className="text-rose-500" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                      {currencySymbol}
                      {financialSummary.total_expenses.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Across {financialSummary.total_expense_entries} expense vouchers
                    </p>
                  </div>
                </div>

                {/* Net Profit (Dark / Highlighted Card) */}
                <div className="bg-[#0b0f19] text-white rounded-2xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
                    <span>Net Profit</span>
                    {financialSummary.net_profit >= 0 ? (
                      <TrendingUp size={15} className="text-emerald-400" />
                    ) : (
                      <TrendingDown size={15} className="text-rose-400" />
                    )}
                  </div>
                  <div className="mt-3">
                    <div
                      className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                        financialSummary.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {currencySymbol}
                      {financialSummary.net_profit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <p className="text-xs text-gray-300 mt-1">
                      Net Margin: {financialSummary.net_profit_margin.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Average Order Value */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>Average Order Value (AOV)</span>
                    <DollarSign size={15} className="text-gray-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                      {currencySymbol}
                      {financialSummary.average_order_value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Discounts given: {currencySymbol}
                      {financialSummary.total_discounts.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profit & Loss Formal Statement Card */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 gap-2">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Profit &amp; Loss Statement</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Period summary breakdown of earnings versus operational outflows
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full self-start sm:self-auto">
                    {timeframe.toUpperCase()} REPORT
                  </span>
                </div>

                <div className="mt-4 divide-y divide-gray-100 text-xs">
                  {/* Revenue Section */}
                  <div className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900">Gross Sales Revenue</span>
                      <p className="text-[11px] text-gray-400">Total gross receipts before discounts</p>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      {currencySymbol}
                      {(financialSummary.total_revenue + financialSummary.total_discounts).toFixed(2)}
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between text-gray-600">
                    <span className="pl-3">Less: Discounts &amp; Allowances</span>
                    <span className="font-medium text-rose-600">
                      -{currencySymbol}
                      {financialSummary.total_discounts.toFixed(2)}
                    </span>
                  </div>

                  <div className="py-3.5 flex items-center justify-between bg-gray-50/70 px-3 rounded-lg font-bold text-gray-900">
                    <span>Net Sales Revenue</span>
                    <span className="text-sm">
                      {currencySymbol}
                      {financialSummary.total_revenue.toFixed(2)}
                    </span>
                  </div>

                  {/* Expenses Section */}
                  <div className="py-3 flex items-center justify-between text-gray-600">
                    <div>
                      <span className="font-semibold text-gray-900">Total Operating Expenses</span>
                      <p className="text-[11px] text-gray-400">
                        Sum of all business cost entries recorded
                      </p>
                    </div>
                    <span className="font-medium text-rose-600">
                      -{currencySymbol}
                      {financialSummary.total_expenses.toFixed(2)}
                    </span>
                  </div>

                  {/* Net Profit Section */}
                  <div
                    className={`py-4 flex items-center justify-between px-3 rounded-xl font-bold mt-2 ${
                      financialSummary.net_profit >= 0
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-100'
                        : 'bg-rose-50 text-rose-900 border border-rose-100'
                    }`}
                  >
                    <div>
                      <span className="text-sm">Net Operating Income (Profit)</span>
                      <p className="text-[11px] font-normal opacity-80">
                        Profit margin: {financialSummary.net_profit_margin.toFixed(2)}%
                      </p>
                    </div>
                    <span className="text-lg font-bold">
                      {currencySymbol}
                      {financialSummary.net_profit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Timeline Table */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Daily Cash Flow Breakdown</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Day-by-day revenue vs expense tracking for the selected window
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-800 font-semibold border-b border-gray-100">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Orders</th>
                        <th className="py-2.5 px-3 text-right">Revenue</th>
                        <th className="py-2.5 px-3 text-right">Expenses</th>
                        <th className="py-2.5 px-3 text-right">Net Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {financialSummary.daily_timeline.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400">
                            No transactions recorded in this period.
                          </td>
                        </tr>
                      ) : (
                        financialSummary.daily_timeline.map((d) => (
                          <tr key={d.date} className="hover:bg-gray-50/60 transition">
                            <td className="py-3 px-3 font-mono font-medium text-gray-700">
                              {d.date}
                            </td>
                            <td className="py-3 px-3 text-gray-600">{d.orders}</td>
                            <td className="py-3 px-3 text-right font-semibold text-gray-900">
                              {currencySymbol}
                              {d.revenue.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right text-gray-600">
                              {currencySymbol}
                              {d.expenses.toFixed(2)}
                            </td>
                            <td
                              className={`py-3 px-3 text-right font-bold ${
                                d.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {currencySymbol}
                              {d.net_profit.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Sales Performance */}
          {activeTab === 'sales' && salesReport && (
            <div className="space-y-6">
              {/* Sales KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium">Total Period Sales</span>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
                    {currencySymbol}
                    {salesReport.total_revenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{salesReport.total_orders} total orders</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium">Units Sold</span>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
                    {salesReport.total_units}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Across all catalog products</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium">Average Order Value</span>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
                    {currencySymbol}
                    {salesReport.average_order_value.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Per customer checkout</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium">Largest Single Sale</span>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
                    {currencySymbol}
                    {salesReport.largest_sale.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Max transaction recorded</p>
                </div>
              </div>

              {/* Two Column Grid: Top Products & Payment Methods */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Top Products Table (spans 8 cols) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Top Performing Products</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ranked by generated sales revenue and volume
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-800 font-semibold border-b border-gray-100">
                          <th className="py-2.5 px-3">Product</th>
                          <th className="py-2.5 px-3 text-center">Units Sold</th>
                          <th className="py-2.5 px-3 text-right">Avg Price</th>
                          <th className="py-2.5 px-3 text-right">Revenue</th>
                          <th className="py-2.5 px-3 text-right">% Sales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {salesReport.top_products.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-400">
                              No sales records found for this timeframe.
                            </td>
                          </tr>
                        ) : (
                          salesReport.top_products.map((p, idx) => (
                            <tr key={p.name} className="hover:bg-gray-50/60 transition">
                              <td className="py-3 px-3 font-semibold text-gray-900">
                                <span className="text-gray-400 font-mono mr-2">#{idx + 1}</span>
                                {p.name}
                              </td>
                              <td className="py-3 px-3 text-center text-gray-700 font-medium">
                                {p.units_sold}
                              </td>
                              <td className="py-3 px-3 text-right text-gray-600">
                                {currencySymbol}
                                {p.average_price.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-gray-900">
                                {currencySymbol}
                                {p.revenue.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-800">
                                  {p.percentage_of_sales.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Methods Breakdown (spans 4 cols) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Payment Breakdown</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Sales by checkout method</p>

                    <div className="mt-5 space-y-4">
                      {salesReport.payment_methods.length === 0 ? (
                        <p className="text-xs text-gray-400 py-4 text-center">No payment data</p>
                      ) : (
                        salesReport.payment_methods.map((pm) => (
                          <div key={pm.method} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="flex items-center gap-1.5 text-gray-800">
                                <CreditCard size={13} className="text-gray-400" />
                                {pm.method}
                              </span>
                              <span className="text-gray-900 font-bold">
                                {currencySymbol}
                                {pm.amount.toFixed(2)} ({pm.percentage.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-black h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(pm.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Top Customers widget */}
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                      <Users size={13} className="text-gray-500" />
                      Top Customers
                    </h4>
                    <div className="space-y-2">
                      {salesReport.top_customers.slice(0, 3).map((c) => (
                        <div key={c.name} className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 truncate max-w-[140px]">{c.name}</span>
                          <span className="font-semibold text-gray-900">
                            {currencySymbol}
                            {c.total_spent.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Expense Analysis */}
          {activeTab === 'expenses' && expensesReport && (
            <div className="space-y-6">
              {/* Expense KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium">Total Outflows</span>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
                    {currencySymbol}
                    {expensesReport.total_expenses.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Across {expensesReport.entries_count} recorded expenses
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium">Average Expense</span>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
                    {currencySymbol}
                    {expensesReport.average_expense.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Per recorded transaction</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium">Largest Single Expense</span>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
                    {currencySymbol}
                    {expensesReport.largest_expense.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Within selected period</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium">Active Categories</span>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
                    {expensesReport.categories.length}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Expense buckets used</p>
                </div>
              </div>

              {/* Two Column Grid: Categories Breakdown & Vendors */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Categories Breakdown (spans 7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Expenses by Category</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Where money is going across your business departments
                    </p>
                  </div>

                  <div className="space-y-3.5 mt-4">
                    {expensesReport.categories.length === 0 ? (
                      <p className="text-xs text-gray-400 py-8 text-center">
                        No expenses recorded for this timeframe.
                      </p>
                    ) : (
                      expensesReport.categories.map((c) => (
                        <div key={c.category} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-gray-800">{c.category}</span>
                            <span className="font-bold text-gray-900">
                              {currencySymbol}
                              {c.amount.toFixed(2)}{' '}
                              <span className="text-gray-400 font-normal">
                                ({c.percentage.toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#5e636e] h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(c.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Vendors Leaderboard (spans 5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Top Vendors &amp; Payees</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Suppliers with the largest disbursements
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-800 font-semibold border-b border-gray-100">
                          <th className="py-2.5 px-3">Vendor</th>
                          <th className="py-2.5 px-3 text-center">Entries</th>
                          <th className="py-2.5 px-3 text-right">Total Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {expensesReport.top_vendors.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-gray-400">
                              No vendor data recorded.
                            </td>
                          </tr>
                        ) : (
                          expensesReport.top_vendors.map((v) => (
                            <tr key={v.vendor} className="hover:bg-gray-50/60 transition">
                              <td className="py-3 px-3 font-semibold text-gray-900">{v.vendor}</td>
                              <td className="py-3 px-3 text-center text-gray-600">{v.count}</td>
                              <td className="py-3 px-3 text-right font-bold text-gray-900">
                                {currencySymbol}
                                {v.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Inventory Valuation & Stock Health */}
          {activeTab === 'inventory' && inventoryReport && (
            <div className="space-y-6">
              {/* Inventory KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium">Retail Inventory Value</span>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
                    {currencySymbol}
                    {inventoryReport.total_inventory_valuation.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Estimated asset stock value</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium">Total On-Hand Units</span>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
                    {inventoryReport.total_stock_quantity.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Across all product lines</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium">Catalog SKUs</span>
                  <div className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
                    {inventoryReport.total_products}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Unique active products</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium">Stock Health Status</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {inventoryReport.health_summary.in_stock} In Stock
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {inventoryReport.health_summary.low_stock} Low
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {inventoryReport.health_summary.out_of_stock} Out
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {inventoryReport.low_stock_alerts.length} items require attention
                  </p>
                </div>
              </div>

              {/* Two Column Grid: Low Stock Alert & Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Low Stock Alerts Table (spans 8 cols) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        Restock Priority Alert
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Products currently at or below minimum threshold
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-800 font-semibold border-b border-gray-100">
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-center">Remaining</th>
                          <th className="py-2.5 px-3 text-center">Threshold</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {inventoryReport.low_stock_alerts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-400">
                              All inventory stock levels are healthy!
                            </td>
                          </tr>
                        ) : (
                          inventoryReport.low_stock_alerts.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/60 transition">
                              <td className="py-3 px-3 font-semibold text-gray-900">{item.name}</td>
                              <td className="py-3 px-3 font-mono text-gray-500 text-[11px]">
                                {item.sku || '—'}
                              </td>
                              <td className="py-3 px-3 text-gray-600">{item.category}</td>
                              <td className="py-3 px-3 text-center font-bold text-gray-900">
                                {item.quantity}
                              </td>
                              <td className="py-3 px-3 text-center text-gray-500">
                                {item.threshold}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {item.status === 'out_of_stock' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                    Out of stock
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    Low stock
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Stock Valuation by Category (spans 4 cols) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Valuation by Category</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Asset distribution by department</p>
                  </div>

                  <div className="space-y-4 mt-2">
                    {inventoryReport.category_breakdown.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">No catalog products</p>
                    ) : (
                      inventoryReport.category_breakdown.map((cat) => (
                        <div key={cat.category} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-gray-800">{cat.category}</span>
                            <span className="font-bold text-gray-900">
                              {currencySymbol}
                              {cat.total_value.toFixed(2)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-black h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(cat.percentage_of_value, 100)}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-gray-400">
                            {cat.products_count} products · {cat.total_quantity} units in stock
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable Document Footer */}
      <div className="print-only pt-6 mt-8 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Executive Financial Report · Generated from Business Hub on {new Date().toLocaleDateString()} · Confidential</p>
      </div>
    </div>
  );
}
