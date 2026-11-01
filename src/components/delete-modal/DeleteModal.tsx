import React, { useEffect, useCallback } from 'react';
import { Trash2, X, Loader2 } from 'lucide-react';

export interface DeleteModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback fired when user closes or cancels the modal */
  onClose: () => void;
  /** Callback fired when user confirms the deletion */
  onConfirm: () => void | Promise<void>;
  /** Optional custom title; defaults to "Delete Confirmation" */
  title?: string;
  /** Optional custom description message */
  description?: string;
  /** Optional name or label of the item being deleted to display prominently */
  itemName?: string;
  /** Optional confirm button label; defaults to "Delete" */
  confirmText?: string;
  /** Optional cancel button label; defaults to "Cancel" */
  cancelText?: string;
  /** Optional loading state for async delete operations */
  isLoading?: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  description,
  itemName,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
}) => {
  // Handle ESC key press
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    },
    [isLoading, onClose]
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

  if (!isOpen) return null;

  const handleConfirmClick = async () => {
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
      onClick={() => {
        if (!isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-200 p-6 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with icon & close button */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Trash2 size={24} strokeWidth={2} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4">
          <h3
            id="delete-dialog-title"
            className="text-lg font-bold text-gray-900 tracking-tight"
          >
            {title}
          </h3>

          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            {description ? (
              description
            ) : itemName ? (
              <>
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-800 break-words">
                  &ldquo;{itemName}&rdquo;
                </span>
                ? This action cannot be undone.
              </>
            ) : (
              'Are you sure you want to delete this item? This action cannot be undone.'
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            <span>{isLoading ? 'Deleting...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Aliases for backward compatibility
export const DeleteModel = DeleteModal;
export type DeleteModelProps = DeleteModalProps;

export default DeleteModal;
