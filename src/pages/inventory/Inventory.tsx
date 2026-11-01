import { useState, useMemo, useEffect } from 'react';
import { Plus, Box, Pencil, Trash2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../../components/data-table/DataTable';
import SearchBar from '../../components/search-bar/SearchBar';
import AddProductModal from '../../components/add-product-modal/AddProductModal';
import DeleteModal from '../../components/delete-modal/DeleteModal';
import { ProductEntity } from '../../components/entities/product.entity';
import { productService } from '../../services/product.service';
import { categoryService } from '../../services/category.service';
import { supplierService } from '../../services/supplier.service';
import { useCurrency } from '../../services/currency.service';

export default function Inventory() {
  const currencySymbol = useCurrency();
  const [products, setProducts] = useState<ProductEntity[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductEntity | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductEntity | null>(null);

  // Fetch products, categories, and suppliers from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodData = await productService.getProducts();
        if (Array.isArray(prodData)) {
          setProducts(prodData);
        }
      } catch (err) {
        console.warn('Backend products fetch failed:', err);
      }

      try {
        const catData = await categoryService.getCategories();
        if (Array.isArray(catData)) {
          setCategories(catData.map((c) => c.name));
        }
      } catch (err) {
        console.warn('Backend categories fetch failed:', err);
      }

      try {
        const suppData = await supplierService.getSuppliers();
        if (Array.isArray(suppData)) {
          setSuppliers(suppData.map((s) => s.name));
        }
      } catch (err) {
        console.warn('Backend suppliers fetch failed:', err);
      }
    };

    fetchData();
  }, []);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;
    return products.filter((p) =>
      [p.name, p.sku, p.category, p.product_type].some((field) =>
        field?.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, products]);

  const openAddModal = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const openEditModal = (product: ProductEntity) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (data: ProductEntity) => {
    const numPrice = Number(data.price || 0);
    const numQuantity = Number(data.quantity || 0);
    const numThreshold =
      data.low_stock_threshold !== undefined && data.low_stock_threshold !== ''
        ? Number(data.low_stock_threshold)
        : 10;

    const payload: Partial<ProductEntity> = {
      ...data,
      price: numPrice,
      quantity: numQuantity,
      low_stock_threshold: numThreshold,
    };

    const targetId = selectedProduct?._id || selectedProduct?.id;

    if (selectedProduct && targetId) {
      // Edit Mode
      try {
        const res = await productService.updateProduct(targetId, payload);
        setProducts((prev) =>
          prev.map((item) =>
            (item._id && item._id === targetId) || (item.id && item.id === targetId)
              ? (res || { ...item, ...payload })
              : item
          )
        );
      } catch (err) {
        console.warn('Backend updateProduct failed:', err);
      }
    } else {
      // Add Mode
      try {
        const res = await productService.createProduct(payload);
        if (res) {
          setProducts((prev) => [res, ...prev]);
        }
      } catch (err) {
        console.warn('Backend createProduct failed:', err);
      }
    }

    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  const handleDeleteClick = (product: ProductEntity) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      const prodId = productToDelete._id || productToDelete.id;
      try {
        if (prodId) {
          await productService.deleteProduct(prodId);
        }
        setProducts((prev) =>
          prev.filter(
            (p) => (p._id && p._id !== prodId) || (p.id && p.id !== prodId)
          )
        );
      } catch (err) {
        console.warn('Backend deleteProduct failed:', err);
      }
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  // React Table Columns matching screenshot: Product | Type | Category | Price | Stock | Status | Actions
  const columns = useMemo<ColumnDef<ProductEntity>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-gray-900 block leading-snug">
              {row.original.name}
            </span>
            {row.original.sku && (
              <span className="text-xs text-gray-400 font-normal">
                SKU: {row.original.sku}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'product_type',
        header: 'Type',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {row.original.product_type === 'variable'
              ? 'Variable Product'
              : 'Single Product'}
          </span>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {row.original.category || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => {
          const p = Number(row.original.price || 0);
          return (
            <span className="text-sm font-medium text-gray-900">
              {currencySymbol}{p.toFixed(2)}
            </span>
          );
        },
      },
      {
        accessorKey: 'quantity',
        header: 'Stock',
        cell: ({ row }) => {
          const q = Number(row.original.quantity || 0);
          const t = Number(row.original.low_stock_threshold || 10);
          const isLow = q <= t;
          return (
            <span
              className={`text-sm font-semibold ${
                isLow ? 'text-amber-600' : 'text-gray-900'
              }`}
            >
              {q}
            </span>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const q = Number(row.original.quantity || 0);
          const t = Number(row.original.low_stock_threshold || 10);
          if (q <= 0) {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                Out of Stock
              </span>
            );
          }
          if (q <= t) {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Low Stock
              </span>
            );
          }
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              In Stock
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEditModal(row.original)}
              className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Edit product"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => handleDeleteClick(row.original)}
              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              aria-label="Delete product"
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Inventory Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your products, stock levels, and pricing
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="w-full sm:max-w-md">
        <SearchBar
          placeholder="Search products..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="w-full"
        />
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Top Banner */}
        <div className="p-5 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Box size={20} className="text-gray-900" />
            <h2 className="text-base font-semibold text-gray-900">Products</h2>
          </div>
          <span className="text-xs text-gray-500 font-normal">
            {filteredProducts.length} of {products.length} products
          </span>
        </div>

        {/* Data Table Component */}
        <DataTable columns={columns} data={filteredProducts} />
      </div>

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleProductSubmit}
        product={selectedProduct}
        categories={categories}
        suppliers={suppliers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        itemName={productToDelete?.name}
      />
    </div>
  );
}
