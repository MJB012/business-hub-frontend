"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  X,
  AlertCircle,
  Search,
  Tag,
  ChevronDown,
  Check,
  User,
  FileText,
  RotateCcw,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Phone,
  StickyNote,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { SaleEntity, type SaleItemEntity } from '../entities/sale.entity';
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

export interface SaleItemRow {
  tempId: string;
  product_id?: string;
  product_name: string;
  quantity: number | '';
  unit_price: number | '';
  original_price?: number | '';
  discount?: number | '';
  isCustomMode?: boolean;
  stockRemaining?: number;
}

const DEFAULT_PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Mobile Payment', label: 'Mobile Payment' },
  { value: 'Other', label: 'Other' },
];

const createEmptyItem = (): SaleItemRow => ({
  tempId: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  product_id: '',
  product_name: '',
  quantity: 1,
  unit_price: '',
  original_price: '',
  discount: 0,
  isCustomMode: false,
});

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
    sale && (sale.id !== undefined || Boolean(sale.product_name) || (sale.items && sale.items.length > 0))
  );

  const currencySymbol = useCurrency();

  // Products catalog state
  const [productsList, setProductsList] = useState<ProductEntity[]>(initialProducts || []);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);

  // Multi-item rows state
  const [items, setItems] = useState<SaleItemRow[]>([createEmptyItem()]);

  // Form metadata states
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showCustomerFields, setShowCustomerFields] = useState<boolean>(true);
  const [generateInvoiceAfterSubmit, setGenerateInvoiceAfterSubmit] = useState<boolean>(false);

  // Active dropdown index (null = no dropdown open)
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch business products from backend
  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const data = await productService.getProducts();
      if (Array.isArray(data)) {
        setProductsList(data);
      }
    } catch (err) {
      console.warn('Failed to load products for sales modal:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Sync initialProducts from props or fetch on open
  useEffect(() => {
    if (isOpen) {
      if (initialProducts && initialProducts.length > 0) {
        setProductsList(initialProducts);
      } else {
        loadProducts();
      }
    }
  }, [isOpen, initialProducts, loadProducts]);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProductsList(initialProducts);
    }
  }, [initialProducts]);

  // Initialize or reset form values
  useEffect(() => {
    if (isOpen) {
      setValidationErrors([]);
      setActiveDropdownIndex(null);
      setGenerateInvoiceAfterSubmit(false);

      if (sale) {
        setPaymentMethod(sale.payment_method || 'Cash');
        setCustomerName(sale.customer_name || 'Walk-in Customer');
        setCustomerPhone(sale.customer_phone || '');
        setNotes(sale.notes || '');
        setSaleDate(sale.date ? sale.date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setShowCustomerFields(true);

        // Load items: multi-item sale or fallback to single product
        if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
          setItems(
            sale.items.map((it) => {
              const matchedProd = productsList.find(
                (p) =>
                  (p._id && String(p._id) === String(it.product_id)) ||
                  (p.id && String(p.id) === String(it.product_id))
              );
              return {
                tempId: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                product_id: it.product_id || '',
                product_name: it.product_name || '',
                quantity: it.quantity !== undefined ? it.quantity : 1,
                unit_price: it.unit_price !== undefined ? it.unit_price : '',
                original_price:
                  it.original_price !== undefined && it.original_price !== ''
                    ? it.original_price
                    : matchedProd?.price || it.unit_price || '',
                discount: it.discount || 0,
                isCustomMode: !it.product_id,
                stockRemaining: matchedProd ? Number(matchedProd.quantity || 0) : undefined,
              };
            })
          );
        } else if (sale.product_name) {
          const matchedProd = productsList.find(
            (p) =>
              (p._id && String(p._id) === String(sale.product_id)) ||
              (p.id && String(p.id) === String(sale.product_id))
          );
          setItems([
            {
              tempId: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              product_id: sale.product_id || '',
              product_name: sale.product_name || '',
              quantity: sale.quantity !== undefined ? sale.quantity : 1,
              unit_price: sale.unit_price !== undefined ? sale.unit_price : '',
              original_price:
                sale.original_price !== undefined && sale.original_price !== ''
                  ? sale.original_price
                  : matchedProd?.price || sale.unit_price || '',
              discount: sale.discount || 0,
              isCustomMode: !sale.product_id,
              stockRemaining: matchedProd ? Number(matchedProd.quantity || 0) : undefined,
            },
          ]);
        } else {
          setItems([createEmptyItem()]);
        }
      } else {
        // New sale defaults
        setItems([createEmptyItem()]);
        setPaymentMethod('Cash');
        setCustomerName('Walk-in Customer');
        setCustomerPhone('');
        setNotes('');
        setSaleDate(new Date().toISOString().split('T')[0]);
        setShowCustomerFields(true);
      }
    }
  }, [isOpen, sale, productsList]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && !target.closest('[data-combobox-container="true"]')) {
        setActiveDropdownIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle ESC key press
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeDropdownIndex !== null) {
          setActiveDropdownIndex(null);
          event.stopPropagation();
        } else {
          onClose();
        }
      }
    },
    [activeDropdownIndex, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  // Add a new product row
  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  // Remove a product row
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (activeDropdownIndex === index) {
      setActiveDropdownIndex(null);
    }
  };

  // Update a specific field of an item
  const handleItemChange = (index: number, field: keyof SaleItemRow, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };

      // Live discount calculation when unit_price changes
      if (field === 'unit_price' || field === 'quantity' || field === 'original_price') {
        const q = current.quantity === '' ? 1 : Number(current.quantity);
        const p = current.unit_price === '' ? 0 : Number(current.unit_price);
        const orig =
          current.original_price !== undefined && current.original_price !== ''
            ? Number(current.original_price)
            : p;
        if (orig > p) {
          current.discount = (orig - p) * q;
        } else {
          current.discount = 0;
        }
      }

      updated[index] = current;
      return updated;
    });
  };

  // Handle typing product name (searches live and enables custom fallback)
  const handleProductNameChange = (index: number, val: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        product_name: val,
        product_id: '',
        isCustomMode: true,
        stockRemaining: undefined,
      };
      return updated;
    });
    setActiveDropdownIndex(index);
  };

  // Handle selecting a catalog product for an item row
  const handleSelectProduct = (index: number, product: ProductEntity) => {
    const priceNum = Number(product.price || 0);
    const stockQty = Number(product.quantity || 0);
    const prodId = product._id ? String(product._id) : product.id ? String(product.id) : '';

    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        product_id: prodId,
        product_name: product.name,
        original_price: priceNum,
        unit_price: priceNum,
        stockRemaining: stockQty,
        discount: 0,
        isCustomMode: false,
      };
      return updated;
    });

    setActiveDropdownIndex(null);
  };

  // Clear product selection in a row
  const handleClearItemProduct = (index: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        product_name: '',
        product_id: '',
        unit_price: '',
        original_price: '',
        discount: 0,
        stockRemaining: undefined,
        isCustomMode: false,
      };
      return updated;
    });
    setActiveDropdownIndex(index);
  };

  // Real-time Order Summary Calculations
  const orderSummary = useMemo(() => {
    let totalUnits = 0;
    let grossSubtotal = 0;
    let totalDiscount = 0;
    let grandTotal = 0;

    items.forEach((it) => {
      const q = it.quantity === '' ? 0 : Number(it.quantity);
      const p = it.unit_price === '' ? 0 : Number(it.unit_price);
      const orig =
        it.original_price !== undefined && it.original_price !== ''
          ? Number(it.original_price)
          : p;

      totalUnits += q;
      grossSubtotal += orig * q;
      grandTotal += p * q;
      if (orig > p) {
        totalDiscount += (orig - p) * q;
      }
    });

    return {
      totalItems: items.length,
      totalUnits,
      grossSubtotal,
      totalDiscount,
      grandTotal,
    };
  }, [items]);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (items.length === 0) {
      errors.push('Please add at least one product to the sale.');
    }

    items.forEach((it, idx) => {
      if (!it.product_name || !it.product_name.trim()) {
        errors.push(`Item #${idx + 1}: Product name is required.`);
      }
      if (it.quantity === '' || Number(it.quantity) < 1) {
        errors.push(`Item #${idx + 1}: Quantity must be at least 1.`);
      }
      if (it.unit_price === '' || Number(it.unit_price) < 0) {
        errors.push(`Item #${idx + 1}: Unit price cannot be negative.`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Build normalized SaleItemEntity list
    const formattedItems: SaleItemEntity[] = items.map((it) => {
      const q = Number(it.quantity || 1);
      const p = Number(it.unit_price || 0);
      const orig =
        it.original_price !== undefined && it.original_price !== ''
          ? Number(it.original_price)
          : p;
      const discount = orig > p ? (orig - p) * q : Number(it.discount || 0);

      return {
        product_id: it.product_id || undefined,
        product_name: it.product_name.trim(),
        quantity: q,
        unit_price: p,
        original_price: orig,
        discount,
        total_amount: q * p,
      };
    });

    // Primary summary name
    let summaryProductName = formattedItems[0].product_name;
    if (formattedItems.length > 1) {
      summaryProductName = `${formattedItems[0].product_name} (+${formattedItems.length - 1} more)`;
    }

    const payload: SaleEntity = {
      _id: sale?._id,
      id: sale?.id,
      items: formattedItems,
      product_id: formattedItems.length === 1 ? formattedItems[0].product_id : undefined,
      product_name: summaryProductName,
      quantity: orderSummary.totalUnits,
      unit_price:
        orderSummary.totalUnits > 0
          ? orderSummary.grandTotal / orderSummary.totalUnits
          : formattedItems[0].unit_price,
      original_price:
        orderSummary.totalUnits > 0
          ? orderSummary.grossSubtotal / orderSummary.totalUnits
          : formattedItems[0].original_price,
      discount: orderSummary.totalDiscount,
      total_amount: orderSummary.grandTotal,
      payment_method: paymentMethod,
      customer_name: customerName.trim() || 'Walk-in Customer',
      customer_phone: customerPhone.trim(),
      notes: notes.trim(),
      date: saleDate || new Date().toISOString().split('T')[0],
      receipt_no: sale?.receipt_no,
    };

    if (onSubmit) {
      onSubmit(payload, generateInvoiceAfterSubmit);
    }
    if (isEdit && onSave) {
      onSave(payload, generateInvoiceAfterSubmit);
    }
    if (!isEdit && onAdd) {
      onAdd(payload, generateInvoiceAfterSubmit);
    }

    onClose();
  };

  if (!isOpen) return null;

  const paymentOptions = paymentMethods
    ? paymentMethods.map((m) => ({ value: m, label: m }))
    : DEFAULT_PAYMENT_METHODS;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl mx-2 sm:mx-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-20">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {isEdit ? 'Edit Sale Transaction' : 'Record New Sale'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Search &amp; add products from catalog or enter custom items with real-time discounts.
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 flex-1">
          {/* Validation Error Banner */}
          {validationErrors.length > 0 && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-red-800">
                  Please resolve the following:
                </span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-red-600">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* SECTION 1: Product Items Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-gray-900">
                  Order Line Items <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500">
                  Search inventory catalog or type custom items/services.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3.5">
              {items.map((item, idx) => {
                const itemQty = item.quantity === '' ? 1 : Number(item.quantity);
                const itemPrice = item.unit_price === '' ? 0 : Number(item.unit_price);
                const itemOrigPrice =
                  item.original_price !== undefined && item.original_price !== ''
                    ? Number(item.original_price)
                    : itemPrice;
                const hasItemDiscount = itemOrigPrice > itemPrice;
                const lineTotal = itemQty * itemPrice;
                const isDropdownOpen = activeDropdownIndex === idx;

                // Live filtering for this row
                const queryTerm = item.product_id
                  ? ''
                  : (item.product_name || '').toLowerCase().trim();

                const filteredCatalog = queryTerm
                  ? productsList.filter((p) => {
                      return (
                        (p.name || '').toLowerCase().includes(queryTerm) ||
                        (p.sku || '').toLowerCase().includes(queryTerm) ||
                        (p.category || '').toLowerCase().includes(queryTerm)
                      );
                    })
                  : productsList;

                const isExceedingStock =
                  item.stockRemaining !== undefined &&
                  item.stockRemaining > 0 &&
                  itemQty > item.stockRemaining;

                const isOutOfStock =
                  item.stockRemaining !== undefined && item.stockRemaining <= 0;

                return (
                  <div
                    key={item.tempId}
                    className="p-4 bg-gray-50/70 border border-gray-200 rounded-2xl space-y-3 transition hover:border-gray-300 relative"
                  >
                    {/* Item Row Header: Label & Status Badges & Delete */}
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-200/60">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-2xs">
                          #{idx + 1}
                        </span>

                        {item.product_id ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check size={11} className="text-emerald-600" />
                            Catalog Product
                          </span>
                        ) : item.product_name.trim() ? (
                          <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                            Custom Item
                          </span>
                        ) : null}

                        {item.stockRemaining !== undefined && (
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              item.stockRemaining > 5
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.stockRemaining > 0
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-600 border border-red-200'
                            }`}
                          >
                            {item.stockRemaining > 0
                              ? `${item.stockRemaining} in stock`
                              : 'Out of stock'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Remove item button */}
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Remove this item"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Integrated Searchable Product Combobox */}
                    <div className="relative" data-combobox-container="true">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          Search or Select Product <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2 text-[11px]">
                          {isLoadingProducts ? (
                            <span className="text-gray-400 flex items-center gap-1">
                              <RefreshCw size={11} className="animate-spin" />
                              Loading catalog...
                            </span>
                          ) : productsList.length > 0 ? (
                            <span className="text-gray-400">
                              {productsList.length} products available
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={loadProducts}
                              className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw size={11} />
                              Reload catalog
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                          <Search size={15} />
                        </div>
                        <input
                          type="text"
                          placeholder={
                            productsList.length > 0
                              ? "Search product by name, SKU, or enter custom item..."
                              : "Enter product or service name..."
                          }
                          value={item.product_name}
                          onChange={(e) => handleProductNameChange(idx, e.target.value)}
                          onFocus={() => setActiveDropdownIndex(idx)}
                          className="w-full pl-9 pr-16 py-2.5 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400 shadow-2xs font-medium"
                          required
                        />

                        <div className="absolute right-2 flex items-center gap-0.5">
                          {item.product_name && (
                            <button
                              type="button"
                              onClick={() => handleClearItemProduct(idx)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                              title="Clear product name"
                            >
                              <X size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setActiveDropdownIndex(isDropdownOpen ? null : idx)
                            }
                            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                            title="Browse inventory catalog"
                          >
                            <ChevronDown
                              size={15}
                              className={`transition-transform duration-200 ${
                                isDropdownOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden max-h-60 flex flex-col">
                          {/* Products List Body */}
                          <div className="overflow-y-auto divide-y divide-gray-50 p-1">
                            {isLoadingProducts ? (
                              <div className="py-4 px-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                                <RefreshCw size={14} className="animate-spin text-gray-400" />
                                <span>Loading products from inventory...</span>
                              </div>
                            ) : productsList.length === 0 ? (
                              <div className="py-4 px-3 text-center text-xs text-gray-500 space-y-2">
                                <p className="font-semibold text-gray-700">No catalog products found.</p>
                                <p className="text-[11px] text-gray-400">
                                  You can sell custom items/services by typing their name above.
                                </p>
                                <button
                                  type="button"
                                  onClick={loadProducts}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer font-medium"
                                >
                                  <RotateCcw size={12} />
                                  <span>Retry Loading</span>
                                </button>
                              </div>
                            ) : filteredCatalog.length === 0 ? (
                              <div className="py-4 px-3 text-center text-xs text-gray-500">
                                <p className="text-gray-700">
                                  No catalog products match &ldquo;{item.product_name}&rdquo;
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleItemChange(idx, 'isCustomMode', true);
                                    setActiveDropdownIndex(null);
                                  }}
                                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition cursor-pointer text-xs"
                                >
                                  <Check size={13} />
                                  <span>Use &ldquo;{item.product_name}&rdquo; as custom item</span>
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="px-2.5 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60 flex items-center justify-between">
                                  <span>Matching Products ({filteredCatalog.length})</span>
                                  <span>Price &amp; Stock</span>
                                </div>
                                {filteredCatalog.map((p) => {
                                  const pId = p._id ? String(p._id) : p.id ? String(p.id) : '';
                                  const isSelected = item.product_id === pId;
                                  const pPrice = Number(p.price || 0);
                                  const stockCount = Number(p.quantity || 0);

                                  return (
                                    <button
                                      key={pId || p.name}
                                      type="button"
                                      onClick={() => handleSelectProduct(idx, p)}
                                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                                        isSelected
                                          ? 'bg-gray-100 text-gray-900 font-semibold'
                                          : 'hover:bg-gray-50 text-gray-800'
                                      }`}
                                    >
                                      <div className="truncate mr-3">
                                        <div className="font-medium text-gray-900 truncate">
                                          {p.name}
                                        </div>
                                        <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                                          {p.sku && <span>SKU: {p.sku}</span>}
                                          {p.category && (
                                            <span className="text-gray-400">• {p.category}</span>
                                          )}
                                          <span
                                            className={`px-1.5 py-0.2 rounded font-medium ${
                                              stockCount > 5
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : stockCount > 0
                                                ? 'bg-amber-50 text-amber-700'
                                                : 'bg-red-50 text-red-600'
                                            }`}
                                          >
                                            {stockCount > 0
                                              ? `${stockCount} in stock`
                                              : 'Out of stock'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                                          {currencySymbol}
                                          {pPrice.toFixed(2)}
                                        </span>
                                        {isSelected && (
                                          <Check size={14} className="text-gray-900" />
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}

                                {item.product_name.trim() && !item.product_id && (
                                  <div className="p-1.5 pt-2 border-t border-gray-100 bg-gray-50/40">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleItemChange(idx, 'isCustomMode', true);
                                        setActiveDropdownIndex(null);
                                      }}
                                      className="w-full text-center py-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
                                    >
                                      Use &ldquo;{item.product_name}&rdquo; as custom item
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stock Warning Messages */}
                    {isOutOfStock && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                        <span>This catalog product is currently out of stock.</span>
                      </div>
                    )}
                    {isExceedingStock && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                        <span>
                          Warning: Selected quantity ({itemQty}) exceeds inventory stock ({item.stockRemaining}).
                        </span>
                      </div>
                    )}

                    {/* Quantity & Unit Price & Line Total */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Quantity with Steppers (4 cols) */}
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Quantity
                        </label>
                        <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = item.quantity === '' ? 1 : Number(item.quantity);
                              if (cur > 1) handleItemChange(idx, 'quantity', cur - 1);
                            }}
                            className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold text-sm transition cursor-pointer"
                          >
                            –
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                'quantity',
                                e.target.value === '' ? '' : Math.max(1, Number(e.target.value))
                              )
                            }
                            className="w-full text-center py-2 text-xs font-semibold text-gray-900 focus:outline-none"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cur = item.quantity === '' ? 0 : Number(item.quantity);
                              handleItemChange(idx, 'quantity', cur + 1);
                            }}
                            className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold text-sm transition cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Unit Price (4 cols) */}
                      <div className="sm:col-span-4">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-700">
                            Unit Price ({currencySymbol})
                          </label>
                          {itemOrigPrice > 0 && itemOrigPrice !== itemPrice && (
                            <button
                              type="button"
                              onClick={() =>
                                handleItemChange(idx, 'unit_price', itemOrigPrice)
                              }
                              className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-0.5 cursor-pointer"
                              title="Reset to catalog price"
                            >
                              <RotateCcw size={10} />
                              Reset
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              'unit_price',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black font-semibold shadow-2xs"
                          required
                        />
                      </div>

                      {/* Line Subtotal (4 cols) */}
                      <div className="sm:col-span-4 text-right bg-white p-2 sm:p-2.5 rounded-xl border border-gray-200/80 shadow-2xs">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                          Line Subtotal
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {currencySymbol}
                          {lineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Discount Badge if selling below catalog price */}
                    {hasItemDiscount && (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        <Tag size={12} className="text-emerald-600 shrink-0" />
                        <span>
                          Discount: -{currencySymbol}
                          {(itemOrigPrice - itemPrice).toFixed(2)}/unit (-{currencySymbol}
                          {((itemOrigPrice - itemPrice) * itemQty).toFixed(2)} total)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Another Product Button */}
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2.5 px-4 border-2 border-dashed border-gray-300 hover:border-black rounded-2xl text-xs font-semibold text-gray-700 hover:text-black flex items-center justify-center gap-2 transition cursor-pointer bg-white hover:bg-gray-50/50"
            >
              <Plus size={15} />
              <span>+ Add Another Product to this Sale</span>
            </button>
          </div>

          {/* SECTION 2: Order Financial Summary Card */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/90 space-y-2 text-xs">
            <div className="flex justify-between items-center text-gray-600">
              <span>
                Total Products: <strong className="text-gray-900">{orderSummary.totalItems}</strong> ({orderSummary.totalUnits} units)
              </span>
              <span>
                Gross Subtotal: <strong className="text-gray-900">{currencySymbol}{orderSummary.grossSubtotal.toFixed(2)}</strong>
              </span>
            </div>

            {orderSummary.totalDiscount > 0 && (
              <div className="flex justify-between items-center text-emerald-700 font-medium">
                <span className="flex items-center gap-1">
                  <Tag size={13} />
                  Total Discounts:
                </span>
                <span>-{currencySymbol}{orderSummary.totalDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm">
              <span className="font-bold text-gray-900">Grand Total Payable</span>
              <span className="text-lg font-bold text-gray-900">
                {currencySymbol}
                {orderSummary.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* SECTION 3: Payment & Transaction Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <CreditCard size={13} className="text-gray-400" />
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer font-medium shadow-2xs"
              >
                {paymentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sale Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-400" />
                Sale Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black shadow-2xs"
                required
              />
            </div>
          </div>

          {/* Customer Information Toggle */}
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setShowCustomerFields((prev) => !prev)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-700 hover:text-black py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-gray-400" />
                Customer &amp; Invoice Details (Optional)
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform ${
                  showCustomerFields ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showCustomerFields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 bg-gray-50/60 p-4 rounded-xl border border-gray-100 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <User size={13} className="text-gray-400" />
                    Customer Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Walk-in Customer or Jane Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black font-medium shadow-2xs placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Phone size={13} className="text-gray-400" />
                    Customer Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 555-0199"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black font-medium shadow-2xs placeholder:text-gray-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <StickyNote size={13} className="text-gray-400" />
                    Order Notes / Memo
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Table reservation #4 or Delivery notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black font-medium shadow-2xs placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
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
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors cursor-pointer shadow-xs text-xs sm:text-sm order-3 sm:order-2"
            >
              {isEdit ? 'Save Changes' : `Record Sale • ${currencySymbol}${orderSummary.grandTotal.toFixed(2)}`}
            </button>

            {!isEdit && (
              <button
                type="submit"
                onClick={() => setGenerateInvoiceAfterSubmit(true)}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-black hover:bg-gray-900 text-white font-semibold rounded-xl transition-colors cursor-pointer shadow-xs text-xs sm:text-sm order-1 sm:order-3"
              >
                <FileText size={15} />
                <span>Record &amp; Create Invoice</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
