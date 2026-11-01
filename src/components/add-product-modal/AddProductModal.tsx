"use client";

import { useMemo, useEffect, useCallback } from 'react';
import { useFormik } from 'formik';
import { X, AlertCircle } from 'lucide-react';
import BaseInput from '../base-input/BaseInput';
import { ProductEntity } from '../entities/product.entity';
import { useCurrency } from '../../services/currency.service';

export interface CategoryOption {
  id?: string | number;
  name: string;
}

export interface SupplierOption {
  id?: string | number;
  name: string;
}

export interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (product: ProductEntity) => void;
  onSave?: (product: ProductEntity) => void;
  onAdd?: (product: ProductEntity) => void;
  product?: Partial<ProductEntity> | null;
  categories?: (CategoryOption | string)[];
  suppliers?: (SupplierOption | string)[];
}

const DEFAULT_PRODUCT_TYPES = [
  { value: 'single', label: 'Single Product' },
  { value: 'variable', label: 'Variable Product' },
];

export default function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  onSave,
  onAdd,
  product = null,
  categories = [],
  suppliers = [],
}: AddProductModalProps) {
  const isEdit = Boolean(product && (product.id !== undefined || Boolean(product.name)));
  const currencySymbol = useCurrency();

  // Memoize initialValues so Formik doesn't re-initialize and wipe inputs on every render
  const initialValues = useMemo<ProductEntity>(() => {
    if (product) {
      return {
        id: product.id,
        product_type: product.product_type || 'single',
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        price:
          product.price !== undefined && product.price !== null
            ? product.price
            : '',
        quantity:
          product.quantity !== undefined && product.quantity !== null
            ? product.quantity
            : '',
        supplier: product.supplier || '',
        description: product.description || '',
        low_stock_threshold:
          product.low_stock_threshold !== undefined &&
          product.low_stock_threshold !== null
            ? product.low_stock_threshold
            : '',
      };
    }
    return new ProductEntity();
  }, [product]);

  const formik = useFormik<ProductEntity>({
    initialValues,
    validationSchema: ProductEntity.yupSchema(),
    enableReinitialize: true,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: (values) => {
      const formattedValues: ProductEntity = {
        ...values,
        _id: values._id ?? product?._id,
        id: values.id ?? product?.id,
        price: values.price === '' ? 0 : Number(values.price),
        quantity: values.quantity === '' ? 0 : Number(values.quantity),
        low_stock_threshold:
          values.low_stock_threshold === '' ||
          values.low_stock_threshold === undefined
            ? undefined
            : Number(values.low_stock_threshold),
      };

      if (onSubmit) {
        onSubmit(formattedValues);
      }
      if (isEdit && onSave) {
        onSave(formattedValues);
      }
      if (!isEdit && onAdd) {
        onAdd(formattedValues);
      }

      onClose();
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
      // Reset formik to fresh values when modal opens
      formik.resetForm({ values: initialValues });
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialValues, handleKeyDown]);

  if (!isOpen) return null;

  // Build category select options
  const categoryOptions = [
    { value: '', label: 'Select category' },
    ...categories.map((cat) => {
      if (typeof cat === 'string') {
        return { value: cat, label: cat };
      }
      return { value: cat.name, label: cat.name };
    }),
  ];

  // Build supplier select options
  const supplierOptions = [
    { value: '', label: 'Select supplier' },
    ...suppliers.map((sup) => {
      if (typeof sup === 'string') {
        return { value: sup, label: sup };
      }
      return { value: sup.name, label: sup.name };
    }),
  ];

  const hasErrors = formik.submitCount > 0 && Object.keys(formik.errors).length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {isEdit
                ? 'Update product details in your inventory'
                : 'Add a new product to your inventory'}
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
        <form onSubmit={formik.handleSubmit} className="p-5 sm:p-6 space-y-1">
          {/* Validation Error Summary if submit was blocked */}
          {hasErrors && (
            <div className="p-3.5 mb-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
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

          {/* Product Type */}
          <BaseInput
            name="product_type"
            label="Product Type"
            type="select"
            value={formik.values.product_type}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              (formik.touched.product_type || formik.submitCount > 0)
                ? formik.errors.product_type
                : undefined
            }
            touched={formik.touched.product_type || formik.submitCount > 0}
            options={DEFAULT_PRODUCT_TYPES}
            helperText="A simple product with one price and stock level"
          />

          {/* Product Name */}
          <BaseInput
            name="name"
            label="Product Name"
            placeholder="Enter product name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              (formik.touched.name || formik.submitCount > 0)
                ? formik.errors.name
                : undefined
            }
            touched={formik.touched.name || formik.submitCount > 0}
            autoFocus
          />

          {/* SKU */}
          <BaseInput
            name="sku"
            label="SKU"
            placeholder="Enter SKU"
            value={formik.values.sku}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              (formik.touched.sku || formik.submitCount > 0)
                ? formik.errors.sku
                : undefined
            }
            touched={formik.touched.sku || formik.submitCount > 0}
          />

          {/* Category */}
          <BaseInput
            name="category"
            label="Category"
            type="select"
            value={formik.values.category}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              (formik.touched.category || formik.submitCount > 0)
                ? formik.errors.category
                : undefined
            }
            touched={formik.touched.category || formik.submitCount > 0}
            options={categoryOptions}
          />

          {/* Price & Quantity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <BaseInput
              name="price"
              label={`Price (${currencySymbol.trim()})`}
              type="number"
              placeholder="0.00"
              value={formik.values.price}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                (formik.touched.price || formik.submitCount > 0)
                  ? formik.errors.price
                  : undefined
              }
              touched={formik.touched.price || formik.submitCount > 0}
            />

            <BaseInput
              name="quantity"
              label="Quantity"
              type="number"
              placeholder="0"
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

          {/* Supplier */}
          <BaseInput
            name="supplier"
            label="Supplier"
            type="select"
            value={formik.values.supplier}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              (formik.touched.supplier || formik.submitCount > 0)
                ? formik.errors.supplier
                : undefined
            }
            touched={formik.touched.supplier || formik.submitCount > 0}
            options={supplierOptions}
            helperText={
              suppliers.length === 0
                ? 'No suppliers available. Add suppliers first.'
                : undefined
            }
          />

          {/* Description */}
          <BaseInput
            name="description"
            label="Description"
            type="textarea"
            rows={3}
            placeholder="Enter product description"
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              (formik.touched.description || formik.submitCount > 0)
                ? formik.errors.description
                : undefined
            }
            touched={formik.touched.description || formik.submitCount > 0}
          />

          {/* Low Stock Threshold (Optional) */}
          <BaseInput
            name="low_stock_threshold"
            label="Low Stock Threshold (Optional)"
            type="number"
            placeholder="Default: 10 units"
            value={formik.values.low_stock_threshold}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              (formik.touched.low_stock_threshold || formik.submitCount > 0)
                ? formik.errors.low_stock_threshold
                : undefined
            }
            touched={
              formik.touched.low_stock_threshold || formik.submitCount > 0
            }
            helperText="Leave empty to use global setting (10 units). Set a custom threshold for this product."
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white font-medium rounded-xl transition-colors cursor-pointer shadow-xs text-sm disabled:opacity-50"
            >
              {isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
