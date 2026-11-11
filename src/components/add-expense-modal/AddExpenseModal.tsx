"use client";

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useFormik } from 'formik';
import { X, ChevronDown, Calendar, AlertCircle } from 'lucide-react';
import { ExpenseEntity } from '../entities/expense.entity';

export interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (expense: ExpenseEntity) => void;
  onSave?: (expense: ExpenseEntity) => void;
  onAdd?: (expense: ExpenseEntity) => void;
  expense?: Partial<ExpenseEntity> | null;
  categories?: string[];
  paymentMethods?: string[];
}

export const DEFAULT_EXPENSE_CATEGORIES = [
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

export const DEFAULT_PAYMENT_METHODS = [
  'Cash',
  'Card',
  'Bank Transfer',
  'Mobile Payment',
  'Check',
  'Other',
];

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  onSave,
  onAdd,
  expense = null,
  categories = DEFAULT_EXPENSE_CATEGORIES,
  paymentMethods = DEFAULT_PAYMENT_METHODS,
}: AddExpenseModalProps) {
  const isEdit = Boolean(expense && (expense.id !== undefined || expense._id !== undefined));
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Default to today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const initialValues = useMemo<ExpenseEntity>(() => {
    if (expense) {
      return {
        id: expense.id,
        _id: expense._id,
        description: expense.description || '',
        amount:
          expense.amount !== undefined && expense.amount !== null
            ? expense.amount
            : '',
        date: expense.date || getTodayDateString(),
        category: expense.category || '',
        payment_method: expense.payment_method || 'Cash',
        vendor: expense.vendor || '',
        receipt_no: expense.receipt_no || '',
        notes: expense.notes || '',
        created_at: expense.created_at,
        updated_at: expense.updated_at,
      };
    }
    return {
      description: '',
      amount: '',
      date: getTodayDateString(),
      category: '',
      payment_method: 'Cash',
      vendor: '',
      receipt_no: '',
      notes: '',
    };
  }, [expense]);

  const formik = useFormik<ExpenseEntity>({
    initialValues,
    enableReinitialize: true,
    validationSchema: ExpenseEntity.yupSchema(),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload: ExpenseEntity = {
          ...values,
          description: values.description.trim(),
          amount: Number(values.amount),
          category: values.category.trim(),
          payment_method: values.payment_method || 'Cash',
          vendor: values.vendor ? values.vendor.trim() : '',
          receipt_no: values.receipt_no ? values.receipt_no.trim() : '',
          notes: values.notes ? values.notes.trim() : '',
        };

        if (onSubmit) onSubmit(payload);
        if (isEdit && onSave) onSave(payload);
        if (!isEdit && onAdd) onAdd(payload);

        onClose();
      } catch (err) {
        console.error('Error submitting expense:', err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Handle ESC key press
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      formik.resetForm({ values: initialValues });
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown, initialValues]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-xl shadow-2xl border border-gray-100 p-6 sm:p-7 relative overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="mb-5 pr-8">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {isEdit ? 'Edit expense' : 'Record an expense'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Add the details below. Required fields are marked with an asterisk.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Row 1: Description * */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-xs font-semibold text-gray-800">
              Description *
            </label>
            <input
              id="description"
              name="description"
              type="text"
              placeholder="e.g. Monthly internet service"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-3.5 py-2.5 bg-gray-50/90 border rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white transition ${
                formik.touched.description && formik.errors.description
                  ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                  : 'border-gray-200/90 focus:border-gray-400'
              }`}
            />
            {formik.touched.description && formik.errors.description && (
              <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle size={12} />
                <span>{formik.errors.description}</span>
              </p>
            )}
          </div>

          {/* Row 2: Amount * & Date * */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount * */}
            <div className="space-y-1.5">
              <label htmlFor="amount" className="block text-xs font-semibold text-gray-800">
                Amount *
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={formik.values.amount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full px-3.5 py-2.5 bg-gray-50/90 border rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white transition ${
                  formik.touched.amount && formik.errors.amount
                    ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                    : 'border-gray-200/90 focus:border-gray-400'
                }`}
              />
              {formik.touched.amount && formik.errors.amount && (
                <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  <span>{formik.errors.amount}</span>
                </p>
              )}
            </div>

            {/* Date * */}
            <div className="space-y-1.5">
              <label htmlFor="date" className="block text-xs font-semibold text-gray-800">
                Date *
              </label>
              <div className="relative">
                <input
                  ref={dateInputRef}
                  id="date"
                  name="date"
                  type="date"
                  value={formik.values.date}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full pl-3.5 pr-10 py-2.5 bg-gray-50/90 border rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white transition cursor-pointer ${
                    formik.touched.date && formik.errors.date
                      ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                      : 'border-gray-200/90 focus:border-gray-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    try {
                      dateInputRef.current?.showPicker();
                    } catch {
                      dateInputRef.current?.focus();
                    }
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                  tabIndex={-1}
                  aria-label="Pick date"
                >
                  <Calendar size={15} />
                </button>
              </div>
              {formik.touched.date && formik.errors.date && (
                <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  <span>{formik.errors.date}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Category * & Payment method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category * */}
            <div className="space-y-1.5">
              <label htmlFor="category" className="block text-xs font-semibold text-gray-800">
                Category *
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  value={formik.values.category}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full appearance-none pl-3.5 pr-10 py-2.5 bg-gray-50/90 border rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white transition cursor-pointer ${
                    formik.touched.category && formik.errors.category
                      ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                      : 'border-gray-200/90 focus:border-gray-400'
                  } ${!formik.values.category ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="text-gray-900">
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              {formik.touched.category && formik.errors.category && (
                <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} />
                  <span>{formik.errors.category}</span>
                </p>
              )}
            </div>

            {/* Payment method */}
            <div className="space-y-1.5">
              <label htmlFor="payment_method" className="block text-xs font-semibold text-gray-800">
                Payment method
              </label>
              <div className="relative">
                <select
                  id="payment_method"
                  name="payment_method"
                  value={formik.values.payment_method}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full appearance-none pl-3.5 pr-10 py-2.5 bg-gray-50/90 border border-gray-200/90 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition cursor-pointer"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Vendor or supplier & Receipt or reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vendor or supplier */}
            <div className="space-y-1.5">
              <label htmlFor="vendor" className="block text-xs font-semibold text-gray-800">
                Vendor or supplier
              </label>
              <input
                id="vendor"
                name="vendor"
                type="text"
                placeholder="Who was paid?"
                value={formik.values.vendor}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3.5 py-2.5 bg-gray-50/90 border border-gray-200/90 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition"
              />
            </div>

            {/* Receipt or reference */}
            <div className="space-y-1.5">
              <label htmlFor="receipt_no" className="block text-xs font-semibold text-gray-800">
                Receipt or reference
              </label>
              <input
                id="receipt_no"
                name="receipt_no"
                type="text"
                placeholder="e.g. INV-2048"
                value={formik.values.receipt_no}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3.5 py-2.5 bg-gray-50/90 border border-gray-200/90 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Row 5: Notes */}
          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-xs font-semibold text-gray-800">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Add any useful context for this expense..."
              value={formik.values.notes}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-3.5 py-2.5 bg-gray-50/90 border border-gray-200/90 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="px-5 py-2.5 bg-[#5e636e] hover:bg-[#4f535c] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isEdit ? 'Save Changes' : 'Record expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
