import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Receipt,
  Download,
  Plus,
  ArrowDownRight,
  Calendar,
  Search,
  ChevronDown,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import { AddExpenseModal } from '../../components/add-expense-modal';
import { DeleteModal } from '../../components/delete-modal/DeleteModal';
import { ExpenseEntity } from '../../components/entities/expense.entity';
import { expenseService } from '../../services/expense.service';
import { categoryService } from '../../services/category.service';
import { useCurrency } from '../../services/currency.service';

export default function Expenses() {
  const [expenses, setExpenses] = useState<ExpenseEntity[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('30d');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseEntity | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Global dynamic currency symbol
  const currencySymbol = useCurrency();

  // Load custom business categories
  useEffect(() => {
    categoryService
      .getCategories()
      .then((cats) => {
        if (Array.isArray(cats)) {
          setCustomCategories(cats.map((c) => c.name).filter((n): n is string => Boolean(n)));
        }
      })
      .catch((err) => {
        console.warn('Could not load categories:', err);
      });
  }, []);

  // Load expenses
  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await expenseService.getExpenses();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn('Failed to load expenses:', err);
      setActionError(err.message || 'Failed to load expenses from server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();

    // Listen to expense updates across tabs/components
    const handleExpensesUpdated = () => {
      loadExpenses();
    };
    window.addEventListener('expenses_updated', handleExpensesUpdated);
    return () => {
      window.removeEventListener('expenses_updated', handleExpensesUpdated);
    };
  }, [loadExpenses]);

  // Unique categories in dataset or default options
  const availableCategories = useMemo(() => {
    const defaultCats = [
      'Rent & Lease',
      'Utilities',
      'Internet & Telephone',
      'Salaries & Wages',
      'Inventory & Supplies',
      'Marketing & Advertising',
      'Maintenance & Repairs',
      'Transportation & Delivery',
      'Software & Subscriptions',
      'Taxes & Licenses',
      'Insurance',
      'Office Supplies',
      'Other',
    ];
    const fromExpenses = expenses
      .map((e) => e.category)
      .filter((c): c is string => Boolean(c && c.trim()));
    return Array.from(new Set([...defaultCats, ...customCategories, ...fromExpenses]));
  }, [expenses, customCategories]);

  // Filtered expenses based on all active criteria
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return expenses.filter((expense) => {
      // 1. Text Search (description, vendor, receipt_no, notes)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesDesc = (expense.description || '').toLowerCase().includes(query);
        const matchesVendor = (expense.vendor || '').toLowerCase().includes(query);
        const matchesReceipt = (expense.receipt_no || '').toLowerCase().includes(query);
        const matchesCategory = (expense.category || '').toLowerCase().includes(query);
        const matchesNotes = (expense.notes || '').toLowerCase().includes(query);
        if (!matchesDesc && !matchesVendor && !matchesReceipt && !matchesCategory && !matchesNotes) {
          return false;
        }
      }

      // 2. Category Filter
      if (categoryFilter !== 'all') {
        if ((expense.category || '').toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Payment Method Filter
      if (paymentMethodFilter !== 'all') {
        if ((expense.payment_method || '').toLowerCase() !== paymentMethodFilter.toLowerCase()) {
          return false;
        }
      }

      // 4. Timeframe Filter
      if (timeframe !== 'all' && expense.date) {
        const expDate = new Date(expense.date);
        if (isNaN(expDate.getTime())) return true;

        if (timeframe === 'today') {
          if (expense.date !== todayStr) return false;
        } else if (timeframe === 'week') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (expDate < sevenDaysAgo) return false;
        } else if (timeframe === '30d') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          if (expDate < thirtyDaysAgo) return false;
        } else if (timeframe === 'month') {
          if (
            expDate.getFullYear() !== now.getFullYear() ||
            expDate.getMonth() !== now.getMonth()
          ) {
            return false;
          }
        } else if (timeframe === 'year') {
          if (expDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [expenses, searchTerm, categoryFilter, paymentMethodFilter, timeframe]);

  // Calculations for StatCards
  const periodSpend = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const averageExpense = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    return periodSpend / filteredExpenses.length;
  }, [filteredExpenses.length, periodSpend]);

  const largestExpense = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    return Math.max(...filteredExpenses.map((e) => Number(e.amount) || 0));
  }, [filteredExpenses]);

  const topCategoryInfo = useMemo(() => {
    if (filteredExpenses.length === 0) return null;
    const catMap: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + (Number(e.amount) || 0);
    });
    const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return null;
    const [name, amount] = entries[0];
    const percentage = periodSpend > 0 ? Math.round((amount / periodSpend) * 100) : 0;
    return { name, amount, percentage };
  }, [filteredExpenses, periodSpend]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setTimeframe('30d');
    setCategoryFilter('all');
    setPaymentMethodFilter('all');
  };

  // Add / Save expense
  const handleRecordExpense = async (saved: ExpenseEntity) => {
    try {
      if (expenseToEdit) {
        const id = expenseToEdit._id || expenseToEdit.id;
        if (id) {
          await expenseService.updateExpense(id, saved);
        }
      } else {
        await expenseService.createExpense(saved);
      }
      setIsAddModalOpen(false);
      setExpenseToEdit(null);
      await loadExpenses();
    } catch (err: any) {
      console.error('Error saving expense:', err);
      setActionError(err.message || 'Failed to save expense');
    }
  };

  // Delete expense confirmation
  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      const id = expenseToDelete._id || expenseToDelete.id;
      if (id) {
        await expenseService.deleteExpense(id);
      }
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
      await loadExpenses();
    } catch (err: any) {
      console.error('Failed to delete expense:', err);
      setActionError(err.message || 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return;
    const headers = [
      'Date',
      'Description',
      'Category',
      'Vendor',
      'Payment Method',
      'Receipt/Ref',
      'Amount',
      'Notes',
    ];
    const rows = filteredExpenses.map((e) => [
      `"${e.date || ''}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      `"${(e.vendor || '').replace(/"/g, '""')}"`,
      `"${(e.payment_method || '').replace(/"/g, '""')}"`,
      `"${(e.receipt_no || '').replace(/"/g, '""')}"`,
      `"${Number(e.amount || 0).toFixed(2)}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `expenses_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* Eyebrow */}
          <div className="flex items-center gap-1.5 text-gray-400 mb-1">
            <Receipt size={14} className="text-gray-400" />
            <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              FINANCE WORKSPACE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Expenses
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Record spending, find trends, and keep every business cost accounted for.
          </p>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredExpenses.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-800 hover:bg-gray-50 hover:border-gray-300 shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {/* + Add expense Button */}
          <button
            type="button"
            onClick={() => {
              setExpenseToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Add expense</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cards Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Period spend (Dark Card matching screenshot) */}
        <div className="bg-[#0b0f19] text-white rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Period spend</span>
            <ArrowDownRight size={15} className="text-gray-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-3">
              {currencySymbol}
              {periodSpend.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Across {filteredExpenses.length} entries
            </p>
          </div>
        </div>

        {/* Card 2: Average expense */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-gray-500 font-medium">Average expense</span>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-3">
              {currencySymbol}
              {averageExpense.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-400 mt-1">Per recorded transaction</p>
          </div>
        </div>

        {/* Card 3: Largest expense */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-gray-500 font-medium">Largest expense</span>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-3">
              {currencySymbol}
              {largestExpense.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-400 mt-1">Within the selected period</p>
          </div>
        </div>

        {/* Card 4: Top category */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-gray-500 font-medium">Top category</span>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mt-3 truncate">
              {topCategoryInfo ? topCategoryInfo.name : 'No data'}
            </div>
            <p className="text-xs text-gray-400 mt-1 truncate">
              {topCategoryInfo
                ? `${currencySymbol}${topCategoryInfo.amount.toFixed(2)} (${topCategoryInfo.percentage}% of spend)`
                : 'Record an expense to begin'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Expense Ledger Card */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Ledger Header & Clear Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">Expense ledger</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing {filteredExpenses.length} of {expenses.length} records
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs font-semibold text-gray-700 hover:text-black cursor-pointer transition self-start sm:self-auto"
          >
            Clear filters
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input (spans 5 cols on desktop) */}
          <div className="relative md:col-span-5">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search description, vendor, or receipt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-gray-400 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Timeframe Select (spans 2.5 cols) */}
          <div className="relative md:col-span-2 sm:col-span-4">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full appearance-none pl-8 pr-8 py-2 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-gray-400 cursor-pointer"
            >
              <option value="30d">Last 30 days</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
              <option value="all">All time</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Category Select (spans 2.5 cols) */}
          <div className="relative md:col-span-2 sm:col-span-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full appearance-none px-3.5 pr-8 py-2 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-gray-400 cursor-pointer"
            >
              <option value="all">All categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Payment Method Select (spans 2.5 cols) */}
          <div className="relative md:col-span-3 sm:col-span-4">
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full appearance-none px-3.5 pr-8 py-2 bg-gray-50/80 border border-gray-200/90 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-gray-400 cursor-pointer"
            >
              <option value="all">All payment methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Mobile Payment">Mobile Payment</option>
              <option value="Check">Check</option>
              <option value="Other">Other</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Ledger Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 text-gray-900 font-semibold text-xs border border-gray-100 rounded-xl">
                <th className="py-3 px-4 rounded-l-xl font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Vendor</th>
                <th className="py-3 px-4 font-semibold">Payment</th>
                <th className="py-3 px-4 text-right font-semibold">Amount</th>
                <th className="py-3 px-4 text-right rounded-r-xl font-semibold w-20">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100">
              {isLoading && expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                /* Empty State (Matching exact mockup uploaded_media_1793784028509.png) */
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3 shadow-2xs">
                      <Receipt size={26} className="text-gray-400" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Your expense ledger is empty
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      Record your first business cost to start tracking spending and category trends.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseToEdit(null);
                        setIsAddModalOpen(true);
                      }}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add first expense</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const id = expense.id || expense._id;
                  return (
                    <tr key={String(id)} className="hover:bg-gray-50/60 transition">
                      {/* Date */}
                      <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px] whitespace-nowrap">
                        {expense.date || '—'}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 text-xs">
                          {expense.description}
                        </div>
                        {expense.receipt_no && (
                          <span className="inline-block text-[10px] text-gray-400 font-mono mt-0.5">
                            Ref: {expense.receipt_no}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {expense.category || 'General'}
                        </span>
                      </td>

                      {/* Vendor */}
                      <td className="py-3.5 px-4 text-gray-600 text-xs whitespace-nowrap">
                        {expense.vendor || '—'}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4 text-gray-600 text-xs whitespace-nowrap">
                        {expense.payment_method || 'Cash'}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-bold text-gray-900 text-xs whitespace-nowrap">
                        {currencySymbol}
                        {Number(expense.amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setExpenseToEdit(expense);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                            title="Edit expense"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setExpenseToDelete(expense);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete expense"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSubmit={handleRecordExpense}
        expense={expenseToEdit}
        categories={availableCategories}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Expense"
        description="Are you sure you want to delete this expense record? This action cannot be undone."
        itemName={expenseToDelete?.description}
        isLoading={isDeleting}
      />
    </div>
  );
}
