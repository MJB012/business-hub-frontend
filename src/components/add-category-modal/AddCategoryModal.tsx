"use client";

import { X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { CategoryEntity } from "../entities/category.entity";
import BaseInput from "../base-input/BaseInput";

export type CategoryFormData = CategoryEntity;

export interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (category: CategoryEntity) => void;
  onSave?: (category: CategoryEntity) => void;
  onAdd?: (category: CategoryEntity) => void;
  category?: Partial<CategoryEntity> | null;
  initialData?: Partial<CategoryEntity> | null;
}

const DEFAULT_FORM_DATA = new CategoryEntity();

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSubmit,
  onSave,
  onAdd,
  category,
  initialData,
}: AddCategoryModalProps) {
  const currentCategory = category ?? initialData ?? null;
  const isEdit = Boolean(currentCategory);

  const [formData, setFormData] = useState<CategoryEntity>(new CategoryEntity());
  const [error, setError] = useState<string | null>(null);

  // Handle ESC key press
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setError(null);

      if (currentCategory) {
        const cat = new CategoryEntity();
        cat._id = currentCategory._id;
        cat.id = currentCategory.id;
        cat.name = currentCategory.name || "";
        cat.description = currentCategory.description || "";
        cat.products_count = currentCategory.products_count ?? (currentCategory as any).products ?? 0;
        setFormData(cat);
      } else {
        setFormData(DEFAULT_FORM_DATA);
      }
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, currentCategory, handleKeyDown]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await CategoryEntity.yupSchema().validate(formData, { abortEarly: false });
      setError(null);
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0]);
        return;
      }
    }

    const resultData: CategoryEntity = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
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
              {isEdit ? "Edit Category" : "Add New Category"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {isEdit
                ? "Update category information"
                : "Create a new category to organize your products"}
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

          <BaseInput
            name="name"
            label="Category Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter category name"
            autoFocus
          />

          <BaseInput
            name="description"
            label="Description"
            type="textarea"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter category description"
          />

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
              {isEdit ? "Save Changes" : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
