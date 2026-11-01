import { useMemo } from 'react';
import { X, Printer, CheckCircle2, Building2 } from 'lucide-react';
import { SaleEntity } from '../entities/sale.entity';
import { getCurrencySymbol, getStoredCurrency } from '../../services/currency.service';

export { getCurrencySymbol };

export interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleEntity | null;
  businessInfo?: {
    name?: string;
    logo?: string | null;
    email?: string;
    phone?: string;
    address?: string;
    currency?: string;
  };
}

export default function InvoiceModal({
  isOpen,
  onClose,
  sale,
  businessInfo: propBusinessInfo,
}: InvoiceModalProps) {
  // Retrieve business details from props or local storage
  const business = useMemo(() => {
    let storedShop: any = {};
    let storedUser: any = {};
    try {
      const s = localStorage.getItem('shop_settings');
      if (s) storedShop = JSON.parse(s);
      const u = localStorage.getItem('user');
      if (u) storedUser = JSON.parse(u);
    } catch {
      // fallback
    }

    return {
      name:
        propBusinessInfo?.name ||
        storedShop.shop_name ||
        storedShop.shopName ||
        storedUser.business_name ||
        storedUser.businessName ||
        'Business Hub',
      logo:
        propBusinessInfo?.logo !== undefined
          ? propBusinessInfo.logo
          : storedShop.shop_logo !== undefined
          ? storedShop.shop_logo
          : storedShop.shopLogo || null,
      email:
        propBusinessInfo?.email ||
        storedShop.contact_email ||
        storedShop.contactEmail ||
        storedUser.email ||
        '',
      phone:
        propBusinessInfo?.phone ||
        storedShop.contact_phone ||
        storedShop.contactPhone ||
        storedUser.phone ||
        '',
      address:
        propBusinessInfo?.address ||
        storedShop.address ||
        storedUser.address ||
        '',
      currency:
        propBusinessInfo?.currency ||
        storedShop.currency ||
        storedUser.business?.currency ||
        storedUser.currency ||
        getStoredCurrency(),
    };
  }, [propBusinessInfo]);

  if (!isOpen || !sale) return null;

  const currencySymbol = getCurrencySymbol(business.currency);
  const qty = Number(sale.quantity || 1);
  const unitPrice = Number(sale.unit_price || 0);
  const origPrice = Number(
    sale.original_price !== undefined && sale.original_price !== '' && Number(sale.original_price) > 0
      ? sale.original_price
      : unitPrice
  );

  const subtotal = origPrice * qty;
  const netTotal = sale.total_amount ? Number(sale.total_amount) : qty * unitPrice;
  const discountAmount =
    sale.discount !== undefined && sale.discount !== '' && Number(sale.discount) > 0
      ? Number(sale.discount)
      : Math.max(0, subtotal - netTotal);

  const formattedDate = (() => {
    if (!sale.date) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const d = new Date(sale.date);
    return isNaN(d.getTime())
      ? sale.date
      : d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
  })();

  const invoiceNumber = sale.receipt_no || `INV-${(sale._id || String(sale.id || '000000')).slice(-6).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar (hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 text-sm">Invoice Preview</span>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 size={12} />
              Paid
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors cursor-pointer"
              aria-label="Close invoice"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-6 sm:p-8 bg-white text-gray-900">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-6 border-b border-gray-200">
            {/* Business Brand */}
            <div className="flex items-start gap-3">
              {business.logo ? (
                <img
                  src={business.logo}
                  alt={business.name}
                  className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                  <Building2 size={24} />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {business.name}
                </h1>
                {business.address && (
                  <p className="text-xs text-gray-500 mt-0.5 max-w-xs">{business.address}</p>
                )}
                <div className="text-xs text-gray-500 mt-1 space-x-2">
                  {business.email && <span>{business.email}</span>}
                  {business.phone && <span>• {business.phone}</span>}
                </div>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="text-left sm:text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                Tax Invoice / Receipt
              </span>
              <p className="text-lg font-bold text-gray-900 font-mono tracking-tight">
                {invoiceNumber}
              </p>
              <p className="text-xs text-gray-500 mt-1">Date: {formattedDate}</p>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Payment: {sale.payment_method || 'Cash'}
              </div>
            </div>
          </div>

          {/* Billed To / Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-gray-100 text-xs">
            <div>
              <p className="text-gray-400 font-medium uppercase tracking-wider mb-1">Billed To</p>
              <p className="text-sm font-semibold text-gray-900">
                {sale.customer_name || 'Walk-in Customer'}
              </p>
              {sale.customer_phone && (
                <p className="text-gray-500 mt-0.5">{sale.customer_phone}</p>
              )}
            </div>
            <div className="sm:text-right">
              <p className="text-gray-400 font-medium uppercase tracking-wider mb-1">Payment Status</p>
              <p className="text-sm font-semibold text-emerald-600">PAID IN FULL</p>
              <p className="text-gray-500 mt-0.5">Method: {sale.payment_method || 'Cash'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-5">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 font-semibold">Item Description</th>
                  <th className="py-2.5 text-center font-semibold">Qty</th>
                  <th className="py-2.5 text-right font-semibold">Catalog Price</th>
                  <th className="py-2.5 text-right font-semibold">Sale Price</th>
                  <th className="py-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 text-gray-900 font-medium">
                    <div>{sale.product_name}</div>
                    {discountAmount > 0 && (
                      <span className="inline-block text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                        Discount applied: -{currencySymbol}{(origPrice - unitPrice).toFixed(2)}/unit
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-center text-gray-700">{qty}</td>
                  <td className="py-3 text-right text-gray-500">
                    {discountAmount > 0 ? (
                      <span className="line-through text-gray-400">
                        {currencySymbol}{origPrice.toFixed(2)}
                      </span>
                    ) : (
                      `${currencySymbol}${origPrice.toFixed(2)}`
                    )}
                  </td>
                  <td className="py-3 text-right text-gray-900 font-medium">
                    {currencySymbol}{unitPrice.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-gray-900 font-bold">
                    {currencySymbol}{netTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="pt-4 pb-6 border-t border-gray-200 flex justify-end">
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (Regular)</span>
                <span>{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                  <span>Discount Savings</span>
                  <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-gray-900">
                <span>Total Amount Paid</span>
                <span>{currencySymbol}{netTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Footer */}
          <div className="border-t border-gray-100 pt-5 text-center text-[11px] text-gray-400 space-y-1">
            {sale.notes && (
              <p className="text-gray-600 italic mb-2">Note: &ldquo;{sale.notes}&rdquo;</p>
            )}
            <p className="font-medium text-gray-600">Thank you for your business!</p>
            <p>Please keep this invoice receipt for any warranty or exchange requests.</p>
          </div>
        </div>

        {/* Bottom Actions (hidden on print) */}
        <div className="no-print px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">Invoice ready for printing or records</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-white transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
