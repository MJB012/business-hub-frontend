import { useState, useMemo, useEffect } from 'react';
import { Plus, DollarSign, Calendar, Pencil, Trash2, FileText } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../../components/data-table/DataTable';
import SearchBar from '../../components/search-bar/SearchBar';
import { StatCard } from '../../components/stat-card/StatCard';
import AddSalesModal from '../../components/add-sales-modal/AddSalesModal';
import DeleteModal from '../../components/delete-modal/DeleteModal';
import InvoiceModal from '../../components/invoice-modal/InvoiceModal';
import { SaleEntity } from '../../components/entities/sale.entity';
import { ProductEntity } from '../../components/entities/product.entity';
import { saleService } from '../../services/sale.service';
import { productService } from '../../services/product.service';
import { useCurrency } from '../../services/currency.service';

export default function Sales() {
  const [sales, setSales] = useState<SaleEntity[]>([]);
  const [products, setProducts] = useState<ProductEntity[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleEntity | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<SaleEntity | null>(null);

  // Invoice modal state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState<SaleEntity | null>(null);

  // Dynamic global currency
  const currencySymbol = useCurrency();

  // Fetch sales and products from backend on mount
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const data = await saleService.getSales();
        if (Array.isArray(data)) {
          setSales(data);
        }
      } catch (err) {
        console.warn('Backend sales fetch failed:', err);
      }
    };

    const fetchProducts = async () => {
      try {
        const prodData = await productService.getProducts();
        if (Array.isArray(prodData)) {
          setProducts(prodData);
        }
      } catch (err) {
        console.warn('Backend products fetch failed:', err);
      }
    };

    fetchSales();
    fetchProducts();
  }, []);

  // Calculate statistics for the top cards
  const todayStr = new Date().toISOString().split('T')[0];

  const todaySalesList = useMemo(() => {
    return sales.filter((s) => {
      if (!s.date) return false;
      return s.date.startsWith(todayStr);
    });
  }, [sales, todayStr]);

  const todayTotal = useMemo(() => {
    return todaySalesList.reduce(
      (sum, s) => sum + Number(s.quantity || 1) * Number(s.unit_price || 0),
      0
    );
  }, [todaySalesList]);

  const grandTotal = useMemo(() => {
    return sales.reduce(
      (sum, s) => sum + Number(s.quantity || 1) * Number(s.unit_price || 0),
      0
    );
  }, [sales]);

  const avgSale = useMemo(() => {
    return sales.length > 0 ? grandTotal / sales.length : 0;
  }, [sales, grandTotal]);

  // Filter sales based on search term & date filter
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (s.product_name || '').toLowerCase().includes(term) ||
        (s.customer_name || '').toLowerCase().includes(term) ||
        (s.receipt_no || '').toLowerCase().includes(term) ||
        (s.payment_method || '').toLowerCase().includes(term);

      const matchesDate =
        !dateFilter || (s.date && s.date.startsWith(dateFilter));

      return matchesSearch && matchesDate;
    });
  }, [sales, searchTerm, dateFilter]);

  const openAddModal = () => {
    setSelectedSale(null);
    setIsSaleModalOpen(true);
  };

  const openEditModal = (sale: SaleEntity) => {
    setSelectedSale(sale);
    setIsSaleModalOpen(true);
  };

  const openInvoiceModal = (sale: SaleEntity) => {
    setSelectedInvoiceSale(sale);
    setIsInvoiceModalOpen(true);
  };

  const handleSaleSubmit = async (data: SaleEntity, shouldGenerateInvoice?: boolean) => {
    const numPrice = Number(data.unit_price || 0);
    const numQuantity = Number(data.quantity || 1);
    const total = numQuantity * numPrice;

    const payload: Partial<SaleEntity> = {
      ...data,
      quantity: numQuantity,
      unit_price: numPrice,
      total_amount: total,
    };

    const targetId = selectedSale?._id || selectedSale?.id;
    let resultingSale: SaleEntity | null = null;

    if (selectedSale && targetId) {
      // Edit Mode
      try {
        const res = await saleService.updateSale(targetId, payload);
        const updated = (res || { ...selectedSale, ...payload }) as SaleEntity;
        resultingSale = updated;
        setSales((prev) =>
          prev.map((item) =>
            (item._id && item._id === targetId) || (item.id && item.id === targetId)
              ? updated
              : item
          )
        );
      } catch (err) {
        console.warn('Backend updateSale failed:', err);
      }
    } else {
      // Add Mode
      try {
        const res = await saleService.createSale(payload);
        if (res) {
          resultingSale = res as SaleEntity;
          setSales((prev) => [res, ...prev]);
        }
      } catch (err) {
        console.warn('Backend createSale failed:', err);
      }
    }

    setIsSaleModalOpen(false);
    setSelectedSale(null);

    // If requested, display the invoice immediately
    if (shouldGenerateInvoice && resultingSale) {
      setSelectedInvoiceSale(resultingSale);
      setIsInvoiceModalOpen(true);
    }
  };

  const handleDeleteClick = (sale: SaleEntity) => {
    setSaleToDelete(sale);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (saleToDelete) {
      const saleId = saleToDelete._id || saleToDelete.id;
      try {
        if (saleId) {
          await saleService.deleteSale(saleId);
        }
        setSales((prev) =>
          prev.filter(
            (s) => (s._id && s._id !== saleId) || (s.id && s.id !== saleId)
          )
        );
      } catch (err) {
        console.warn('Backend deleteSale failed:', err);
      }
      setIsDeleteModalOpen(false);
      setSaleToDelete(null);
    }
  };

  // React Table Columns: Product Name | Quantity | Unit Price | Total | Payment Method | Date | Actions
  const columns = useMemo<ColumnDef<SaleEntity>[]>(
    () => [
      {
        accessorKey: 'product_name',
        header: 'Product Name',
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-gray-900 block leading-snug">
              {row.original.product_name}
            </span>
            {row.original.receipt_no && (
              <span className="text-[11px] text-gray-400 font-mono">
                {row.original.receipt_no}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {row.original.quantity}
          </span>
        ),
      },
      {
        accessorKey: 'unit_price',
        header: 'Unit Price',
        cell: ({ row }) => {
          const p = Number(row.original.unit_price || 0);
          const orig = Number(row.original.original_price || 0);
          const discount = Number(row.original.discount || 0);
          const hasDiscount = (orig > 0 && orig > p) || discount > 0;
          const unitSavings = orig > p ? orig - p : discount / Number(row.original.quantity || 1);

          return (
            <div>
              <span className="text-sm font-medium text-gray-900">
                {currencySymbol}{p.toFixed(2)}
              </span>
              {hasDiscount && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[11px] text-gray-400 line-through">
                    {currencySymbol}{orig > 0 ? orig.toFixed(2) : (p + unitSavings).toFixed(2)}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                    -{currencySymbol}{unitSavings.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'total_amount',
        header: 'Total',
        cell: ({ row }) => {
          const qty = Number(row.original.quantity || 1);
          const price = Number(row.original.unit_price || 0);
          const total = row.original.total_amount ? Number(row.original.total_amount) : qty * price;
          return (
            <span className="text-sm font-semibold text-gray-900">
              {currencySymbol}{total.toFixed(2)}
            </span>
          );
        },
      },
      {
        accessorKey: 'payment_method',
        header: 'Payment Method',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {row.original.payment_method || 'Cash'}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => {
          const d = row.original.date ? new Date(row.original.date) : new Date();
          const formatted = isNaN(d.getTime())
            ? row.original.date || '—'
            : d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
          return <span className="text-sm text-gray-500">{formatted}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openInvoiceModal(row.original)}
              className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="View / Print Invoice"
              aria-label="View invoice"
            >
              <FileText size={16} />
            </button>
            <button
              onClick={() => openEditModal(row.original)}
              className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Edit sale"
              aria-label="Edit sale"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => handleDeleteClick(row.original)}
              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Delete sale"
              aria-label="Delete sale"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [currencySymbol]
  );

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Sales Records
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage your customer transactions and invoices
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Record Sale</span>
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Today's Sales"
          value={`${currencySymbol}${todayTotal.toFixed(2)}`}
          subtitle={`${todaySalesList.length} transactions today`}
          icon={<DollarSign />}
        />
        <StatCard
          title="Total Revenue"
          value={`${currencySymbol}${grandTotal.toFixed(2)}`}
          subtitle="All recorded sales"
          icon={<DollarSign />}
        />
        <StatCard
          title="Total Orders"
          value={sales.length}
          subtitle="Customer receipts"
          icon={<DollarSign />}
        />
        <StatCard
          title="Average Sale"
          value={`${currencySymbol}${avgSale.toFixed(2)}`}
          subtitle="Per transaction"
          icon={<DollarSign />}
        />
      </div>

      {/* Filter and Search Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <SearchBar
            placeholder="Search sales by product, customer, invoice no..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1 underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Sales Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar size={20} className="text-gray-900" />
            <h2 className="text-base font-semibold text-gray-900">
              Transactions & Receipts
            </h2>
          </div>
          <span className="text-xs text-gray-500 font-normal">
            {filteredSales.length} of {sales.length} records
          </span>
        </div>

        {/* Data Table */}
        <DataTable columns={columns} data={filteredSales} />
      </div>

      {/* Add / Edit Sale Modal */}
      <AddSalesModal
        isOpen={isSaleModalOpen}
        onClose={() => {
          setIsSaleModalOpen(false);
          setSelectedSale(null);
        }}
        onSubmit={handleSaleSubmit}
        sale={selectedSale}
        products={products}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoiceSale(null);
        }}
        sale={selectedInvoiceSale}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSaleToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Sale Record"
        itemName={saleToDelete?.product_name}
      />
    </div>
  );
}
