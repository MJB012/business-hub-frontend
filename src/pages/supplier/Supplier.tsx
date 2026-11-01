"use client";

import { useState, useMemo, useEffect } from "react";
import SearchBar from "../../components/search-bar/SearchBar";
import { type ColumnDef } from "@tanstack/react-table";
import DataTable from "../../components/data-table/DataTable";
import { StatCard } from "../../components/stat-card/StatCard";
import { Pencil, Trash2, Truck, Mail, Phone } from "lucide-react";
import AddSupplierModal from "../../components/add-supplier-modal/AddSupplierModal";
import DeleteModal from "../../components/delete-modal/DeleteModal";
import { SupplierEntity } from "../../components/entities/supplier.entity";
import { supplierService } from "../../services/supplier.service";

export default function SupplierManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliersList, setSuppliersList] = useState<SupplierEntity[]>([]);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierEntity | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierEntity | null>(null);

  // Fetch suppliers from backend on mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await supplierService.getSuppliers();
        if (Array.isArray(data)) {
          setSuppliersList(data);
        }
      } catch (err) {
        console.warn("Backend suppliers fetch failed:", err);
      }
    };
    fetchSuppliers();
  }, []);

  const openAddModal = () => {
    setSelectedSupplier(null);
    setIsSupplierModalOpen(true);
  };

  const openEditModal = (supplier: SupplierEntity) => {
    setSelectedSupplier(supplier);
    setIsSupplierModalOpen(true);
  };

  const handleSupplierSubmit = async (formData: SupplierEntity) => {
    if (selectedSupplier) {
      // Edit Mode
      const suppId = selectedSupplier._id || selectedSupplier.id;
      try {
        if (suppId) {
          const res = await supplierService.updateSupplier(suppId, formData);
          setSuppliersList((prev) =>
            prev.map((s) =>
              (s._id && s._id === suppId) || (s.id && s.id === suppId)
                ? (res || { ...s, ...formData })
                : s
            )
          );
        }
      } catch (err) {
        console.warn("Backend updateSupplier failed:", err);
      }
    } else {
      // Add Mode
      try {
        const created = await supplierService.createSupplier(formData);
        if (created) {
          setSuppliersList((prev) => [created, ...prev]);
        }
      } catch (err) {
        console.warn("Backend createSupplier failed:", err);
      }
    }
  };

  const handleDeleteSupplier = (supplier: SupplierEntity) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (supplierToDelete) {
      const suppId = supplierToDelete._id || supplierToDelete.id;
      try {
        if (suppId) {
          await supplierService.deleteSupplier(suppId);
        }
        setSuppliersList((prev) =>
          prev.filter(
            (s) => (s._id && s._id !== suppId) || (s.id && s.id !== suppId)
          )
        );
      } catch (err) {
        console.warn("Backend deleteSupplier failed:", err);
      }
      setIsDeleteModalOpen(false);
      setSupplierToDelete(null);
    }
  };

  // Filter suppliers based on searchTerm
  const filteredSuppliers = useMemo(() => {
    return suppliersList.filter((s) =>
      [s.name, s.contact_person, s.email, s.phone].some((field) =>
        (field || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, suppliersList]);

  // Column definitions
  const supplierColumns = useMemo<ColumnDef<SupplierEntity>[]>(
    () => [
      {
        header: "Supplier Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <span className="font-medium text-gray-900">{row.original.name}</span>
        ),
      },
      {
        header: "Contact Person",
        accessorKey: "contact_person",
        cell: ({ row }) => (
          <span className="text-gray-900">
            {row.original.contact_person || (row.original as any).contactPerson || "—"}
          </span>
        ),
      },
      {
        header: "Email",
        accessorKey: "email",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900">{row.original.email || "—"}</span>
          </div>
        ),
      },
      {
        header: "Phone",
        accessorKey: "phone",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900">{row.original.phone || "—"}</span>
          </div>
        ),
      },
      {
        header: "Products",
        accessorKey: "products_count",
        cell: ({ row }) => {
          const count =
            row.original.products_count ?? (row.original as any).products ?? 0;
          return (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              {count} {count === 1 ? "product" : "products"}
            </span>
          );
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
              row.original.status === "active"
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        header: "Actions",
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              onClick={() => openEditModal(row.original)}
              aria-label="Edit supplier"
            >
              <Pencil className="w-4 h-4 text-gray-600" />
            </button>
            <button
              className="p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              onClick={() => handleDeleteSupplier(row.original)}
              aria-label="Delete supplier"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Stats
  const totalSuppliers = suppliersList.length;
  const activeSuppliers = suppliersList.filter((s) => s.status === "active").length;
  const totalProducts = suppliersList.reduce(
    (sum, s) => sum + (s.products_count ?? (s as any).products ?? 0),
    0
  );

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Supplier Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your suppliers and vendors
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition text-sm font-medium w-full sm:w-auto shadow-sm cursor-pointer"
        >
          <Truck className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Suppliers"
          value={totalSuppliers}
          subtitle="All registered suppliers"
          icon={<Truck />}
        />
        <StatCard
          title="Active Suppliers"
          value={activeSuppliers}
          subtitle="Currently active"
          icon={<Truck />}
        />
        <StatCard
          title="Total Products"
          value={totalProducts}
          subtitle="Supplied items"
          icon={<Truck />}
        />
      </div>

      {/* Search Input */}
      <div className="w-full sm:max-w-md">
        <SearchBar
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="w-full"
        />
      </div>

      {/* Suppliers Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-gray-900" />
            <h2 className="text-base font-semibold text-gray-900">Suppliers</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {filteredSuppliers.length} of {totalSuppliers} suppliers
          </p>
        </div>
        <DataTable columns={supplierColumns} data={filteredSuppliers} />
      </div>

      {/* Add / Edit Supplier Modal */}
      <AddSupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setSelectedSupplier(null);
        }}
        onSubmit={handleSupplierSubmit}
        supplier={selectedSupplier}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSupplierToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Supplier"
        itemName={supplierToDelete?.name}
      />
    </div>
  );
}
