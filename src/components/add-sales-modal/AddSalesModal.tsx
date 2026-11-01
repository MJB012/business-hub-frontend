"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useFormik } from 'formik';
import {
  X,
  AlertCircle,
  Search,
  Tag,
  ChevronDown,
  Check,
  User,
  FileText,
  Boxes,
  RotateCcw,
} from 'lucide-react';
import BaseInput from '../base-input/BaseInput';
import { SaleEntity } from '../entities/sale.entity';
import { ProductEntity } from '../entities/product.entity';
import { productService } from '../../services/product.service';
import { useCurrency } from '../../services/currency.service';

export interface AddSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (sale: SaleEntity, shouldGenerateInvoice?: boolean) => void;
  onSave?: (sale: SaleEntity, shouldGenerateInvoice?: boolean) => void;
  onAdd?: (sale: SaleEntity, shouldGenerateInvoice?: boolean) => void;
  sale?: Partial<SaleEntity> | null;
  paymentMethods?: string[];
  products?: ProductEntity[];
}

const DEFAULT_PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Mobile Payment', label: 'Mobile Payment' },
];

export default function AddSalesModal({
  isOpen,
  onClose,
  onSubmit,
  onSave,
  onAdd,
  sale = null,
  paymentMethods,
  products: initialProducts,
}: AddSalesModalProps) {
  const isEdit = Boolean(
    sale && (sale.id !== undefined || Boolean(sale.product_name))
  );

  // Products state for dropdown selection
  const [productsList, setProductsList] = useState<ProductEntity[]>(initialProducts || []);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [isCustomProductMode, setIsCustomProductMode] = useState(false);
  const [showCustomerFields, setShowCustomerFields] = useState(
    Boolean(sale?.customer_phone || (sale?.customer_name && sale.customer_name !== 'Walk-in Customer') || sale?.notes)
  );

  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch business products if not supplied or empty
  useEffect(() => {
    if (isOpen) {
      if (initialProducts && initialProducts.length > 0) {
        setProductsList(initialProducts);
      } else {
        productService
          .getProducts()
          .then((data) => {
            if (Array.isArray(data)) {
              setProductsList(data);
            }
          })
          .catch((err) => {
            console.warn('Failed to load products for sales modal:', err);
          });
      }
    }
  }, [isOpen, initialProducts]);

  // Determine active currency symbol
  const currencySymbol = useCurrency();

  // Memoize initialValues
  const initialValues = useMemo<SaleEntity>(() => {
    if (sale) {
      return {
        id: sale.id,
        _id: sale._id,
        product_id: sale.product_id || '',
        product_name: sale.product_name || '',
        quantity:
          sale.quantity !== undefined && sale.quantity !== null
            ? sale.quantity
            : 1,
        original_price:
          sale.original_price !== undefined && sale.original_price !== null
            ? sale.original_price
            : sale.unit_price !== undefined
            ? sale.unit_price
            : '',
        unit_price:
          sale.unit_price !== undefined && sale.unit_price !== null
            ? sale.unit_price
            : '',
        discount: sale.discount !== undefined ? sale.discount : 0,
        payment_method: sale.payment_method || 'Cash',
        customer_name: sale.customer_name || 'Walk-in Customer',
        customer_phone: sale.customer_phone || '',
        notes: sale.notes || '',
        date: sale.date || new Date().toISOString(),
      };
    }
    return new SaleEntity();
  }, [sale]);

  // Handle outside click for product dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Track whether to generate invoice after submit
  const [generateInvoiceAfterSubmit, setGenerateInvoiceAfterSubmit] = useState(false);

  const formik = useFormik<SaleEntity>({
    initialValues,
    validationSchema: SaleEntity.yupSchema(),
    enableReinitialize: true,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: (values) => {
      const numQty = values.quantity === '' ? 1 : Number(values.quantity);
      const numPrice = values.unit_price === '' ? 0 : Number(values.unit_price);
      const origPrice =
        values.original_price !== undefined && values.original_price !== ''
          ? Number(values.original_price)
          : numPrice;

      // Discount calculation: if selling unit price is lower than original/catalog price
      const discount =
        origPrice > numPrice
          ? (origPrice - numPrice) * numQty
          : Number(values.discount || 0);

      const formattedValues: SaleEntity = {
        ...values,
        _id: values._id ?? sale?._id,
        id: values.id ?? sale?.id,
        quantity: numQty,
        original_price: origPrice,
        unit_price: numPrice,
        discount,
        total_amount: numQty * numPrice,
        date: values.date || new Date().toISOString(),
      };

      if (onSubmit) {
        onSubmit(formattedValues, generateInvoiceAfterSubmit);
      }
      if (isEdit && onSave) {
        onSave(formattedValues, generateInvoiceAfterSubmit);
      }
      if (!isEdit && onAdd) {
        onAdd(formattedValues, generateInvoiceAfterSubmit);
      }

      onClose();
    },
  });

  // Filter products for dropdown
  const filteredProducts = useMemo(() => {
    const term = productSearch.toLowerCase().trim();
    if (!term) return productsList;
    return productsList.filter((p) => {
      return (
        (p.name || '').toLowerCase().includes(term) ||
        (p.sku || '').toLowerCase().includes(term) ||
        (p.category || '').toLowerCase().includes(term)
      );
    });
  }, [productsList, productSearch]);

  // Handle selecting a listed product
  const handleSelectProduct = (product: ProductEntity) => {
    formik.setFieldValue('product_name', product.name);
    formik.setFieldValue('product_id', product._id || product.id || '');
    const priceNum = Number(product.price || 0);
    // Auto-fill price from product catalogue
    formik.setFieldValue('original_price', priceNum);
    formik.setFieldValue('unit_price', priceNum);
    formik.setFieldTouched('product_name', false);
    setIsProductDropdownOpen(false);
    setProductSearch('');
  };

  // Calculations for live discount display
  const qtyNum = formik.values.quantity === '' ? 1 : Number(formik.values.quantity || 1);
  const currentUnitPrice = formik.values.unit_price === '' ? 0 : Number(formik.values.unit_price || 0);
  const catalogPrice =
    formik.values.original_price !== undefined &&
    formik.values.original_price !== '' &&
    Number(formik.values.original_price) > 0
      ? Number(formik.values.original_price)
      : currentUnitPrice;

  const hasDiscount = catalogPrice > currentUnitPrice;
  const unitDiscount = hasDiscount ? catalogPrice - currentUnitPrice : 0;
  const totalDiscount = unitDiscount * qtyNum;
  const calculatedTotal = currentUnitPrice * qtyNum;
  const regularTotal = catalogPrice * qtyNum;

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
      setProductSearch('');
      setIsCustomProductMode(false);
      setGenerateInvoiceAfterSubmit(false);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialValues, handleKeyDown]);

  if (!isOpen) return null;

  // Build payment method options
  const paymentOptions = paymentMethods
    ? paymentMethods.map((method) => ({ value: method, label: method }))
    : DEFAULT_PAYMENT_METHODS;

  const hasErrors = formik.submitCount > 0 && Object.keys(formik.errors).length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xl mx-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-20">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {isEdit ? 'Edit Sale' : 'Record New Sale'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {isEdit
                ? 'Update sale transaction details'
                : 'Select listed product or enter details to record transaction'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={formik.handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Validation Error Summary */}
          {hasErrors && (
            <div className="p-3.5 mb-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-red-800">
                  Please resolve the following errors:
                </span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-red-600">
                  {Object.entries(formik.errors).map(([field, err]) => (
                    <li key={field}>{String(err)}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Product Selection Section */}
          <div className="space-y-1.5" ref={productDropdownRef}>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-900">
                Product / Service <span className="text-red-500">*</span>
              </label>
              {productsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCustomProductMode(!isCustomProductMode)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                >
                  {isCustomProductMode ? '← Choose from listed products' : '+ Enter custom item'}
                </button>
              )}
            </div>

            {isCustomProductMode || productsList.length === 0 ? (
              // Custom Product Manual Input
              <div>
                <BaseInput
                  name="product_name"
                  placeholder="Enter product or service name"
                  value={formik.values.product_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    (formik.touched.product_name || formik.submitCount > 0)
                      ? formik.errors.product_name
                      : undefined
                  }
                  touched={formik.touched.product_name || formik.submitCount > 0}
                  autoFocus
                />
                {productsList.length === 0 && (
                  <p className="text-[11px] text-gray-400 -mt-2">
                    No products found in inventory. You can enter an item name manually.
                  </p>
                )}
              </div>
            ) : (
              // Listed Product Selector Dropdown
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProductDropdownOpen((prev) => !prev)}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 sm:py-3
                    bg-gray-50 border rounded-xl text-left text-sm transition-all
                    focus:outline-none focus:ring-2 focus:ring-black focus:bg-white cursor-pointer
                    ${formik.values.product_name ? 'text-gray-900 font-medium' : 'text-gray-400'}
                    ${
                      (formik.touched.product_name || formik.submitCount > 0) && formik.errors.product_name
                        ? 'border-red-400 ring-1 ring-red-400 bg-red-50/20'
                        : 'border-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Boxes size={17} className="text-gray-400 shrink-0" />
                    <span className="truncate">
                      {formik.values.product_name || 'Select a listed product against this business...'}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                      isProductDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isProductDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden max-h-72 flex flex-col">
                    {/* Search inside dropdown */}
                    <div className="p-2 border-b border-gray-100 bg-gray-50/60 sticky top-0">
                      <div className="relative">
                        <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search product name, SKU, category..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto divide-y divide-gray-50 p-1">
                      {filteredProducts.length === 0 ? (
                        <div className="py-4 px-3 text-center text-xs text-gray-400">
                          No matching listed products found.
                          <button
                            type="button"
                            onClick={() => {
                              formik.setFieldValue('product_name', productSearch);
                              setIsProductDropdownOpen(false);
                            }}
                            className="block mx-auto mt-2 text-blue-600 hover:underline font-medium"
                          >
                            Use &ldquo;{productSearch}&rdquo; as custom item
                          </button>
                        </div>
                      ) : (
                        filteredProducts.map((p) => {
                          const isSelected =
                            formik.values.product_name === p.name ||
                            formik.values.product_id === (p._id || p.id);
                          const pPrice = Number(p.price || 0);
                          const stockCount = Number(p.quantity || 0);

                          return (
                            <button
                              key={p._id || p.id || p.name}
                              type="button"
                              onClick={() => handleSelectProduct(p)}
                              className={`
                                w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer
                                ${
                                  isSelected
                                    ? 'bg-gray-100 text-gray-900 font-semibold'
                                    : 'hover:bg-gray-50 text-gray-800'
                                }
                              `}
                            >
                              <div className="truncate mr-3">
                                <div className="font-medium text-gray-900 truncate">
                                  {p.name}
                                </div>
                                <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                                  {p.sku && <span>SKU: {p.sku}</span>}
                                  {p.category && <span>• {p.category}</span>}
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-medium ${
                                      stockCount > 0
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-red-50 text-red-600'
                                    }`}
                                  >
                                    {stockCount > 0 ? `${stockCount} in stock` : 'Out of stock'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                                  {currencySymbol}{pPrice.toFixed(2)}
                                </span>
                                {isSelected && <Check size={14} className="text-gray-900" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {(formik.touched.product_name || formik.submitCount > 0) &&
                  formik.errors.product_name && (
                    <p className="text-xs text-red-500 mt-1">
                      {formik.errors.product_name}
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Quantity & Unit Price Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <BaseInput
                name="quantity"
                label="Quantity"
                type="number"
                placeholder="1"
                value={formik.values.quantity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  (formik.touched.quantity || formik.submitCount > 0)
                    ? formik.errors.quantity
                    : undefined
                }
                touched={formik.touched.quantity || formik.submitCount > 0}
              />
            </div>

            {/* Unit Price (Editable & Auto-filled) */}
            <div>
              <BaseInput
                name="unit_price"
                label={
                  <div className="flex items-center justify-between w-full">
                    <span>Unit Price ({currencySymbol})</span>
                    {catalogPrice > 0 && catalogPrice !== currentUnitPrice && (
                      <button
                        type="button"
                        onClick={() => formik.setFieldValue('unit_price', catalogPrice)}
                        className="text-[11px] text-gray-400 hover:text-gray-700 flex items-center gap-1 font-normal cursor-pointer"
                        title="Reset to catalogue price"
                      >
                        <RotateCcw size={11} />
                        Reset to {currencySymbol}{catalogPrice.toFixed(2)}
                      </button>
                    )}
                  </div>
                }
                type="number"
                placeholder="0.00"
                value={formik.values.unit_price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  (formik.touched.unit_price || formik.submitCount > 0)
                    ? formik.errors.unit_price
                    : undefined
                }
                touched={formik.touched.unit_price || formik.submitCount > 0}
                helperText={
                  catalogPrice > 0 ? (
                    <span className="text-[11px] text-gray-400">
                      Catalog Price: {currencySymbol}{catalogPrice.toFixed(2)}
                    </span>
                  ) : undefined
                }
              />
            </div>
          </div>

          {/* Automatic Discount & Price Difference Feedback Card */}
          {hasDiscount && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <Tag size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <span>Discount Applied</span>
                    <span className="bg-emerald-200/70 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      -{currencySymbol}{unitDiscount.toFixed(2)}/unit
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Price lowered from actual {currencySymbol}{catalogPrice.toFixed(2)} to {currencySymbol}{currentUnitPrice.toFixed(2)}. Remaining difference counted as customer discount.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] text-emerald-600 font-medium block">Total Discount</span>
                <span className="font-bold text-sm text-emerald-800">
                  -{currencySymbol}{totalDiscount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <BaseInput
            name="payment_method"
            label="Payment Method"
            type="select"
            value={formik.values.payment_method}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              (formik.touched.payment_method || formik.submitCount > 0)
                ? formik.errors.payment_method
                : undefined
            }
            touched={formik.touched.payment_method || formik.submitCount > 0}
            options={paymentOptions}
          />

          {/* Customer / Invoice Details Toggle */}
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setShowCustomerFields((prev) => !prev)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-700 hover:text-black py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-gray-400" />
                Customer & Invoice Information (Optional)
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform ${showCustomerFields ? 'rotate-180' : ''}`}
              />
            </button>

            {showCustomerFields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-2 bg-gray-50/60 p-3 rounded-xl border border-gray-100 animate-in fade-in duration-150">
                <BaseInput
                  name="customer_name"
                  label="Customer Name"
                  placeholder="e.g. Walk-in Customer or John Doe"
                  value={formik.values.customer_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="bg-white"
                />
                <BaseInput
                  name="customer_phone"
                  label="Customer Phone"
                  placeholder="e.g. +1 555-0199"
                  value={formik.values.customer_phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="bg-white"
                />
              </div>
            )}
          </div>

          {/* Summary Banner */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-500 block">Total Summary</span>
              <div className="text-gray-900 font-medium">
                {qtyNum} {qtyNum === 1 ? 'unit' : 'units'} × {currencySymbol}{currentUnitPrice.toFixed(2)}
                {hasDiscount && (
                  <span className="text-gray-400 line-through ml-1.5">
                    {currencySymbol}{regularTotal.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 block">Net Payable</span>
              <span className="text-base font-bold text-gray-900">
                {currencySymbol}{calculatedTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-xs sm:text-sm transition-colors cursor-pointer order-2 sm:order-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              onClick={() => setGenerateInvoiceAfterSubmit(false)}
              disabled={formik.isSubmitting}
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors cursor-pointer shadow-xs text-xs sm:text-sm disabled:opacity-50 order-3 sm:order-2"
            >
              {isEdit ? 'Save Changes' : 'Record Sale'}
            </button>

            {!isEdit && (
              <button
                type="submit"
                onClick={() => setGenerateInvoiceAfterSubmit(true)}
                disabled={formik.isSubmitting}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-black hover:bg-gray-900 text-white font-semibold rounded-xl transition-colors cursor-pointer shadow-xs text-xs sm:text-sm disabled:opacity-50 order-1 sm:order-3"
              >
                <FileText size={15} />
                <span>Record & Create Invoice</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
