import { useState, useMemo, useEffect } from 'react';
import { Plus, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '../../components/data-table/DataTable';
import SearchBar from '../../components/search-bar/SearchBar';
import DeleteModal from '../../components/delete-modal/DeleteModal';
import AddCategoryModal from '../../components/add-category-modal/AddCategoryModal';
import { CategoryEntity } from '../../components/entities/category.entity';
import { categoryService } from '../../services/category.service';

const Category = () => {
  const [categories, setCategories] = useState<CategoryEntity[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryEntity | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryEntity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch categories from backend on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getCategories();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (err) {
        console.warn('Backend categories fetch failed:', err);
      }
    };
    fetchCategories();
  }, []);

  // Filter Logic
  const filteredCategories = categories.filter((cat) =>
    (cat.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const openAddModal = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };

  const openEditModal = (category: CategoryEntity) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (formData: CategoryEntity) => {
    if (selectedCategory) {
      // Edit Mode
      const catId = selectedCategory._id || selectedCategory.id;
      try {
        if (catId) {
          const res = await categoryService.updateCategory(catId, formData);
          setCategories((prev) =>
            prev.map((c) =>
              (c._id && c._id === catId) || (c.id && c.id === catId) ? (res || { ...c, ...formData }) : c
            )
          );
        }
      } catch (err) {
        console.warn('Backend updateCategory failed:', err);
      }
    } else {
      // Add Mode
      try {
        const created = await categoryService.createCategory(formData);
        if (created) {
          setCategories((prev) => [created, ...prev]);
        }
      } catch (err) {
        console.warn('Backend createCategory failed:', err);
      }
    }
  };

  const handleDeleteCategory = (category: CategoryEntity) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      const catId = categoryToDelete._id || categoryToDelete.id;
      try {
        if (catId) {
          await categoryService.deleteCategory(catId);
        }
        setCategories((prev) =>
          prev.filter(
            (cat) => (cat._id && cat._id !== catId) || (cat.id && cat.id !== catId)
          )
        );
      } catch (err) {
        console.warn('Backend deleteCategory failed:', err);
      }
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  // --- React Table Column Definition ---
  const columns = useMemo<ColumnDef<CategoryEntity>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Category Name',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="text-gray-500">{row.original.description || '—'}</span>
        ),
      },
      {
        accessorKey: 'products_count',
        header: 'Products',
        cell: ({ row }) => {
          const count = row.original.products_count ?? (row.original as any).products ?? 0;
          return (
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
              {count} {count === 1 ? 'product' : 'products'}
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
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Edit category"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => handleDeleteCategory(row.original)}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              aria-label="Delete category"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Organize your products into categories
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition text-sm font-medium w-full sm:w-auto shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="w-full sm:max-w-md">
        <SearchBar
          placeholder="Search categories..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="w-full"
        />
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-gray-900" />
            <h2 className="text-base font-semibold text-gray-900">Categories</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {filteredCategories.length} of {categories.length} categories
          </p>
        </div>

        {/* DataTable - Using TanStack React Table */}
        <DataTable columns={columns} data={filteredCategories} />
      </div>

      {/* Category Modal (Add & Edit) */}
      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategory(null);
        }}
        onSubmit={handleCategorySubmit}
        category={selectedCategory}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        itemName={categoryToDelete?.name}
      />
    </div>
  );
};

export default Category;
