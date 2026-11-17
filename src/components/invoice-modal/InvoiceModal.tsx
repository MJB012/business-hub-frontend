import { useState, useMemo, useEffect } from 'react';
import { X, Printer, CheckCircle2, Building2, Receipt, FileText } from 'lucide-react';
import { SaleEntity } from '../entities/sale.entity';
import { getCurrencySymbol, getStoredCurrency } from '../../services/currency.service';
import { businessService } from '../../services/business.service';

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

interface BusinessInfoState {
  name: string;
  logo: string | null;
  email: string;
  phone: string;
  address: string;
  currency: string;
}

const resolveBusinessInfo = (propBusinessInfo?: InvoiceModalProps['businessInfo']): BusinessInfoState => {
  let storedShop: any = {};
  let storedUser: any = {};
  try {
    const s = localStorage.getItem('shop_settings');
    if (s) storedShop = JSON.parse(s);
  } catch {
    // ignore
  }
  try {
    const u = localStorage.getItem('user');
    if (u) storedUser = JSON.parse(u);
  } catch {
    // ignore
  }

  const name =
    propBusinessInfo?.name ||
    storedShop.shop_name ||
    storedShop.shopName ||
    storedUser.business?.name ||
    storedUser.business_name ||
    storedUser.businessName ||
    'Business Hub Supermarket';

  const logo =
    propBusinessInfo?.logo !== undefined
      ? propBusinessInfo.logo
      : storedShop.shop_logo !== undefined
      ? storedShop.shop_logo
      : storedShop.shopLogo !== undefined
      ? storedShop.shopLogo
      : storedShop.logo !== undefined
      ? storedShop.logo
      : storedUser.business?.logo !== undefined
      ? storedUser.business.logo
      : storedUser.shop_logo !== undefined
      ? storedUser.shop_logo
      : storedUser.logo || null;

  const email =
    propBusinessInfo?.email ||
    storedShop.contact_email ||
    storedShop.contactEmail ||
    storedUser.business?.contact_email ||
    storedUser.email ||
    '';

  const phone =
    propBusinessInfo?.phone ||
    storedShop.contact_phone ||
    storedShop.contactPhone ||
    storedUser.business?.contact_phone ||
    storedUser.phone ||
    '';

  const address =
    propBusinessInfo?.address ||
    storedShop.address ||
    storedUser.business?.address ||
    storedUser.address ||
    '';

  const currency =
    propBusinessInfo?.currency ||
    storedShop.currency ||
    storedUser.business?.currency ||
    storedUser.currency ||
    getStoredCurrency();

  return { name, logo, email, phone, address, currency };
};

/**
 * Clean SVG Barcode Component for supermarket receipts
 */
const BarcodeSVG = ({ code }: { code: string }) => {
  const bars = useMemo(() => {
    const clean = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'POSRECEIPT';
    const pattern: number[] = [2, 1, 2, 2, 1, 1, 2, 1];
    for (let i = 0; i < clean.length; i++) {
      const c = clean.charCodeAt(i);
      pattern.push((c % 3) + 1, ((c >> 1) % 2) + 1, ((c >> 2) % 3) + 1, 1);
    }
    pattern.push(2, 1, 1, 2, 2, 1, 2);
    return pattern;
  }, [code]);

  let currentX = 6;
  return (
    <div className="flex flex-col items-center justify-center my-2 select-none">
      <svg viewBox="0 0 220 38" className="w-52 h-9" xmlns="http://www.w3.org/2000/svg">
        {bars.map((width, idx) => {
          const x = currentX;
          currentX += width + (idx % 2 === 0 ? 1 : 2);
          if (idx % 2 === 0) {
            return <rect key={idx} x={x} y="0" width={width} height="36" fill="#111827" />;
          }
          return null;
        })}
      </svg>
      <span className="text-[10px] tracking-[0.28em] font-mono font-bold text-gray-700 mt-0.5">
        *{code}*
      </span>
    </div>
  );
};

export default function InvoiceModal({
  isOpen,
  onClose,
  sale,
  businessInfo: propBusinessInfo,
}: InvoiceModalProps) {
  // Default to Supermarket POS Thermal receipt format
  const [receiptFormat, setReceiptFormat] = useState<'pos' | 'a4'>('pos');

  // Business info state initialized with local storage and props
  const [business, setBusiness] = useState<BusinessInfoState>(() =>
    resolveBusinessInfo(propBusinessInfo)
  );

  // Sync when propBusinessInfo changes
  useEffect(() => {
    setBusiness(resolveBusinessInfo(propBusinessInfo));
  }, [propBusinessInfo]);

  // Proactively fetch live business details (including logo) from backend whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const fetchLiveBusiness = async () => {
      try {
        const live = await businessService.getCurrentBusiness();
        if (!isMounted || !live) return;

        setBusiness((prev) => {
          const liveLogo = live.logo !== undefined ? live.logo : prev.logo;
          const next: BusinessInfoState = {
            name: propBusinessInfo?.name || live.name || prev.name,
            logo: propBusinessInfo?.logo !== undefined ? propBusinessInfo.logo : liveLogo,
            email: propBusinessInfo?.email || live.contact_email || prev.email,
            phone: propBusinessInfo?.phone || live.contact_phone || prev.phone,
            address: propBusinessInfo?.address || live.address || prev.address,
            currency: propBusinessInfo?.currency || live.currency || prev.currency,
          };

          // Cache live settings into localStorage so subsequent views have the updated logo immediately
          try {
            const currentStored = localStorage.getItem('shop_settings');
            const parsed = currentStored ? JSON.parse(currentStored) : {};
            const updated = {
              ...parsed,
              shop_name: next.name,
              shop_logo: next.logo,
              contact_email: next.email,
              contact_phone: next.phone,
              address: next.address,
              currency: next.currency,
            };
            localStorage.setItem('shop_settings', JSON.stringify(updated));
          } catch {
            // ignore
          }

          return next;
        });
      } catch (err) {
        // Backend fetch failed or offline; local fallback is already active
      }
    };

    fetchLiveBusiness();

    // Listen to localStorage updates (e.g. from Settings tab or page)
    const handleStorageUpdate = () => {
      setBusiness(resolveBusinessInfo(propBusinessInfo));
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [isOpen, propBusinessInfo]);

  // Cashier identification
  const cashierName = useMemo(() => {
    if (!sale) return 'Store Cashier';
    if ((sale as any).cashier_name) return (sale as any).cashier_name;
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        return u.full_name || u.name || 'Store Cashier';
      }
    } catch {
      // fallback
    }
    return 'Store Cashier';
  }, [sale]);

  // Normalize items list (supports multi-item sales and legacy single-product sales)
  const items = useMemo(() => {
    if (!sale) return [];
    if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
      return sale.items.map((it) => {
        const q = Number(it.quantity || 1);
        const p = Number(it.unit_price || 0);
        const orig = Number(
          it.original_price !== undefined && it.original_price !== '' && Number(it.original_price) > 0
            ? it.original_price
            : p
        );
        const lineTotal = it.total_amount ? Number(it.total_amount) : q * p;
        const lineDiscount = it.discount ? Number(it.discount) : Math.max(0, (orig - p) * q);
        return {
          product_name: it.product_name,
          quantity: q,
          unit_price: p,
          original_price: orig,
          total_amount: lineTotal,
          discount: lineDiscount,
        };
      });
    }

    const q = Number(sale.quantity || 1);
    const p = Number(sale.unit_price || 0);
    const orig = Number(
      sale.original_price !== undefined && sale.original_price !== '' && Number(sale.original_price) > 0
        ? sale.original_price
        : p
    );
    const lineTotal = sale.total_amount ? Number(sale.total_amount) : q * p;
    const lineDiscount =
      sale.discount !== undefined && sale.discount !== '' && Number(sale.discount) > 0
        ? Number(sale.discount)
        : Math.max(0, (orig - p) * q);

    return [
      {
        product_name: sale.product_name || 'Custom Item',
        quantity: q,
        unit_price: p,
        original_price: orig,
        total_amount: lineTotal,
        discount: lineDiscount,
      },
    ];
  }, [sale]);

  if (!isOpen || !sale) return null;

  const currencySymbol = getCurrencySymbol(business.currency);
  const hasLogo = Boolean(
    business.logo &&
    typeof business.logo === 'string' &&
    business.logo.trim() !== '' &&
    business.logo !== 'null' &&
    business.logo !== 'undefined'
  );

  const subtotal = items.reduce((sum, it) => sum + it.original_price * it.quantity, 0);
  const netTotal = sale.total_amount ? Number(sale.total_amount) : items.reduce((sum, it) => sum + it.total_amount, 0);
  const discountAmount =
    sale.discount !== undefined && sale.discount !== '' && Number(sale.discount) > 0
      ? Number(sale.discount)
      : Math.max(0, subtotal - netTotal);

  const totalUnits = items.reduce((sum, it) => sum + Number(it.quantity || 1), 0);
  const totalItemsCount = items.length;

  const { formattedDate, formattedTime } = (() => {
    const d = sale.date ? new Date(sale.date) : new Date();
    const valid = !isNaN(d.getTime());
    const dateObj = valid ? d : new Date();
    return {
      formattedDate: dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      formattedTime: dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  })();

  const invoiceNumber =
    sale.receipt_no ||
    `INV-${(sale._id || String(sale.id || '000000')).slice(-6).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-2xl w-full shadow-2xl border border-gray-100 overflow-hidden my-4 transition-all ${
          receiptFormat === 'pos' ? 'max-w-md' : 'max-w-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar (hidden on print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/90">
          {/* Format Selector Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Style:
            </span>
            <div className="inline-flex items-center bg-gray-200/70 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setReceiptFormat('pos')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  receiptFormat === 'pos'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Receipt size={13} />
                <span>POS Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptFormat('a4')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  receiptFormat === 'a4'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText size={13} />
                <span>A4 Invoice</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>Print {receiptFormat === 'pos' ? 'Receipt' : 'Invoice'}</span>
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

        {/* Modal Scrollable Body */}
        <div className="max-h-[82vh] overflow-y-auto bg-gray-100/60 p-3 sm:p-6 flex justify-center">
          {/* ========================================================== */}
          {/* 1. SUPERMARKET THERMAL POS RECEIPT FORMAT (DEFAULT) */}
          {/* ========================================================== */}
          {receiptFormat === 'pos' ? (
            <div
              id="printable-invoice"
              className="pos-receipt-print w-full max-w-[370px] bg-white text-gray-900 rounded-xl shadow-md border border-gray-200/90 p-5 sm:p-6 font-mono text-xs select-text relative"
            >
              {/* Store Header */}
              <div className="text-center space-y-1 pb-2">
                {hasLogo ? (
                  <div className="flex justify-center mb-1.5">
                    <img
                      src={business.logo!}
                      alt={business.name}
                      className="max-h-14 max-w-[140px] object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 mx-auto mb-1.5 bg-black text-white rounded-lg flex items-center justify-center font-bold">
                    <Receipt size={20} />
                  </div>
                )}
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-gray-900 leading-tight">
                  {business.name}
                </h1>
                {business.address && (
                  <p className="text-[11px] text-gray-600 leading-snug">{business.address}</p>
                )}
                <div className="text-[11px] text-gray-600 space-x-2">
                  {business.phone && <span>Tel: {business.phone}</span>}
                  {business.email && <span>• {business.email}</span>}
                </div>
              </div>

              {/* Receipt Dashed Divider */}
              <div className="border-b border-dashed border-gray-400 my-2.5" />

              {/* Transaction Meta Section */}
              <div className="space-y-1 text-[11px] text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">RECEIPT NO:</span>
                  <span className="font-bold text-gray-900">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">DATE &amp; TIME:</span>
                  <span className="text-gray-900">{formattedDate} {formattedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">CASHIER:</span>
                  <span className="font-semibold text-gray-900">{cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">CUSTOMER:</span>
                  <span className="font-semibold text-gray-900 truncate max-w-[210px]">
                    {sale.customer_name || 'Walk-in Customer'}
                  </span>
                </div>
                {sale.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">PHONE:</span>
                    <span className="text-gray-900">{sale.customer_phone}</span>
                  </div>
                )}
              </div>

              {/* Receipt Dashed Divider */}
              <div className="border-b border-dashed border-gray-400 my-2.5" />

              {/* Items Table Header */}
              <div className="grid grid-cols-12 text-[11px] font-bold text-gray-700 uppercase tracking-wider pb-1 border-b border-gray-300">
                <span className="col-span-6">ITEM</span>
                <span className="col-span-2 text-center">QTY</span>
                <span className="col-span-2 text-right">RATE</span>
                <span className="col-span-2 text-right">TOTAL</span>
              </div>

              {/* Items List */}
              <div className="py-2 space-y-2">
                {items.map((item, idx) => {
                  const hasDiscount = item.original_price > item.unit_price;
                  return (
                    <div key={idx} className="text-[11px] leading-tight">
                      <div className="font-bold text-gray-900 uppercase">
                        {idx + 1}. {item.product_name}
                      </div>
                      <div className="grid grid-cols-12 text-gray-600 mt-0.5">
                        <span className="col-span-6 text-[10px] text-gray-500">
                          {item.quantity} x {currencySymbol}{item.unit_price.toFixed(2)}
                        </span>
                        <span className="col-span-2 text-center text-gray-700">{item.quantity}</span>
                        <span className="col-span-2 text-right text-gray-700">
                          {item.unit_price.toFixed(2)}
                        </span>
                        <span className="col-span-2 text-right font-bold text-gray-900">
                          {currencySymbol}{item.total_amount.toFixed(2)}
                        </span>
                      </div>
                      {hasDiscount && (
                        <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                          Discount: -{currencySymbol}{((item.original_price - item.unit_price) * item.quantity).toFixed(2)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Receipt Dashed Divider */}
              <div className="border-b border-dashed border-gray-400 my-2.5" />

              {/* Financial Calculation Summary */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-gray-600">
                  <span>TOTAL ITEMS:</span>
                  <span className="font-bold text-gray-900">
                    {totalItemsCount} item{totalItemsCount > 1 ? 's' : ''} ({totalUnits} pcs)
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>SUBTOTAL:</span>
                  <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>DISCOUNT SAVINGS:</span>
                    <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* Prominent Double-Lined Net Total Box */}
                <div className="border-y-2 border-gray-900 py-1.5 my-2 flex justify-between items-center text-sm font-black text-gray-900">
                  <span className="tracking-wide">TOTAL PAYABLE:</span>
                  <span className="text-base tracking-tight">
                    {currencySymbol}{netTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-800">
                  <span className="font-semibold">PAYMENT METHOD:</span>
                  <span className="font-bold uppercase text-gray-900">{sale.payment_method || 'Cash'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>AMOUNT TENDERED:</span>
                  <span>{currencySymbol}{netTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>CHANGE RETURNED:</span>
                  <span>{currencySymbol}0.00</span>
                </div>
              </div>

              {sale.notes && (
                <>
                  <div className="border-b border-dashed border-gray-300 my-2" />
                  <p className="text-[10px] italic text-gray-600">
                    Memo: &ldquo;{sale.notes}&rdquo;
                  </p>
                </>
              )}

              {/* Receipt Dashed Divider */}
              <div className="border-b border-dashed border-gray-400 my-3" />

              {/* Barcode Section */}
              <BarcodeSVG code={invoiceNumber} />

              {/* Receipt Dashed Divider */}
              <div className="border-b border-dashed border-gray-400 my-3" />

              {/* Receipt Policy & Footer Note */}
              <div className="text-center text-[10px] text-gray-600 space-y-1">
                <p className="font-extrabold uppercase tracking-wide text-gray-900">
                  *** THANK YOU FOR SHOPPING! ***
                </p>
                <p className="text-gray-500">Please check goods &amp; cash change before leaving.</p>
                <p className="text-gray-500">Exchange possible within 7 days with this slip.</p>
                <div className="pt-2 text-[9px] text-gray-400 tracking-wider uppercase font-sans">
                  Powered by Business Hub POS
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================== */
            /* 2. STANDARD FORMAL A4 BUSINESS INVOICE FORMAT             */
            /* ========================================================== */
            <div
              id="printable-invoice"
              className="a4-invoice-print w-full bg-white text-gray-900 rounded-xl shadow-md border border-gray-200 p-6 sm:p-8"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-6 border-b border-gray-200">
                <div className="flex items-start gap-3.5">
                  {hasLogo ? (
                    <div className="p-1 bg-white border border-gray-200 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                      <img
                        src={business.logo!}
                        alt={business.name}
                        className="max-h-16 max-w-[160px] object-contain rounded-lg"
                      />
                    </div>
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
                  <p className="text-gray-400 font-medium uppercase tracking-wider mb-1">
                    Payment Status
                  </p>
                  <p className="text-sm font-semibold text-emerald-600 flex items-center sm:justify-end gap-1">
                    <CheckCircle2 size={14} />
                    PAID IN FULL
                  </p>
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
                    {items.map((item, idx) => {
                      const hasDiscount = item.original_price > item.unit_price;
                      return (
                        <tr key={idx}>
                          <td className="py-3 text-gray-900 font-medium">
                            <div>{item.product_name}</div>
                            {hasDiscount && (
                              <span className="inline-block text-[11px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                                Discount applied: -{currencySymbol}
                                {(item.original_price - item.unit_price).toFixed(2)}/unit
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                          <td className="py-3 text-right text-gray-500">
                            {hasDiscount ? (
                              <span className="line-through text-gray-400">
                                {currencySymbol}
                                {item.original_price.toFixed(2)}
                              </span>
                            ) : (
                              `${currencySymbol}${item.original_price.toFixed(2)}`
                            )}
                          </td>
                          <td className="py-3 text-right text-gray-900 font-medium">
                            {currencySymbol}
                            {item.unit_price.toFixed(2)}
                          </td>
                          <td className="py-3 text-right text-gray-900 font-bold">
                            {currencySymbol}
                            {item.total_amount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Breakdown */}
              <div className="pt-4 pb-6 border-t border-gray-200 flex justify-end">
                <div className="w-full sm:w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
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

              {/* Barcode in A4 mode */}
              <div className="py-3 border-t border-gray-100">
                <BarcodeSVG code={invoiceNumber} />
              </div>

              {/* Notes & Footer */}
              <div className="border-t border-gray-100 pt-4 text-center text-[11px] text-gray-400 space-y-1">
                {sale.notes && (
                  <p className="text-gray-600 italic mb-2">Note: &ldquo;{sale.notes}&rdquo;</p>
                )}
                <p className="font-medium text-gray-600">Thank you for your business!</p>
                <p>Please keep this invoice receipt for any warranty or exchange requests.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar (hidden on print) */}
        <div className="no-print px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-mono">
            {invoiceNumber} · {formattedDate}
          </span>
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
              className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>Print {receiptFormat === 'pos' ? 'Receipt' : 'Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
