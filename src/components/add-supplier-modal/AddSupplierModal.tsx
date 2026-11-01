"use client";

import { X, Mail, Phone, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { SupplierEntity } from "../entities/supplier.entity";
import BaseInput from "../base-input/BaseInput";

export type SupplierFormData = SupplierEntity;

export interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (supplier: SupplierEntity) => void;
  onSave?: (supplier: SupplierEntity) => void;
  onAdd?: (supplier: SupplierEntity) => void;
  supplier?: Partial<SupplierEntity> | null;
  initialData?: Partial<SupplierEntity> | null;
}

const DEFAULT_FORM_DATA = new SupplierEntity();

export default function AddSupplierModal({
  isOpen,
  onClose,
  onSubmit,
  onSave,
  onAdd,
  supplier,
  initialData,
}: AddSupplierModalProps) {
  const currentSupplier = supplier ?? initialData ?? null;
  const isEdit = Boolean(currentSupplier);

  const [formData, setFormData] = useState<SupplierEntity>(new SupplierEntity());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (currentSupplier) {
        const supp = new SupplierEntity();
        supp._id = currentSupplier._id;
        supp.id = currentSupplier.id;
        supp.name = currentSupplier.name || "";
        supp.contact_person =
          currentSupplier.contact_person || (currentSupplier as any).contactPerson || "";
        supp.email = currentSupplier.email || "";
        supp.phone = currentSupplier.phone || "";
        supp.address = currentSupplier.address || "";
        supp.notes = currentSupplier.notes || "";
        supp.products_count =
          currentSupplier.products_count ?? (currentSupplier as any).products ?? 0;
        supp.status = (currentSupplier.status as any) || "active";
        setFormData(supp);
      } else {
        setFormData(DEFAULT_FORM_DATA);
      }
    }
  }, [isOpen, currentSupplier]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await SupplierEntity.yupSchema().validate(formData, { abortEarly: false });
      setError(null);
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0]);
        return;
      }
    }

    const resultData: SupplierEntity = {
      ...(currentSupplier ? { ...currentSupplier } : {}),
      ...formData,
      name: formData.name.trim(),
      contact_person: formData.contact_person.trim(),
    };

    if (onSubmit) {
      onSubmit(resultData);
    }
    if (isEdit && onSave) {
      onSave(resultData);
    }
    if (!isEdit && onAdd) {
      onAdd(resultData);
    }

    onClose();
  };

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
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {isEdit ? "Edit Supplier" : "Add New Supplier"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {isEdit
                ? "Update supplier information"
                : "Create a new supplier and manage their contact information"}
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Supplier Name */}
          <BaseInput
            name="name"
            label="Supplier Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter supplier name"
            autoFocus
          />

          {/* Contact Person */}
          <BaseInput
            name="contact_person"
            label="Contact Person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            placeholder="Enter contact person name"
          />

          {/* Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput
              name="email"
              label="Email"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="supplier@example.com"
            />

            <BaseInput
              name="phone"
              label="Phone"
              type="tel"
              icon={<Phone className="w-4 h-4" />}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </div>

          {/* Address */}
          <BaseInput
            name="address"
            label="Address"
            type="textarea"
            rows={2}
            icon={<MapPin className="w-4 h-4" />}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Enter supplier address"
          />

          {/* Notes */}
          <BaseInput
            name="notes"
            label="Notes"
            type="textarea"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this supplier"
          />

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Status
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === "active"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  className="w-4 h-4 text-black focus:ring-black cursor-pointer"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === "inactive"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  className="w-4 h-4 text-black focus:ring-black cursor-pointer"
                />
                <span className="text-sm text-gray-700">Inactive</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-colors cursor-pointer shadow-xs text-sm"
            >
              {isEdit ? "Save Changes" : "Add Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
