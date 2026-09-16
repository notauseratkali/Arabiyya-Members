import React from 'react';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  itemDetails?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Member Record Deletion',
  description = 'Are you sure you want to permanently delete this member record? This action will remove all associated member data and cannot be undone.',
  itemName,
  itemDetails,
  confirmText = 'Yes, Delete Record',
  cancelText = 'Cancel',
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-red-100 overflow-hidden relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Top Danger Header */}
        <div className="p-6 bg-red-50/80 border-b border-red-100 flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 pr-6">
            <h3 id="modal-headline" className="text-base font-bold text-gray-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-red-700/90 mt-1 font-medium">
              Permanent Database Operation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            {description}
          </p>

          {itemName && (
            <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Target Member:</div>
              <div className="text-sm font-bold text-darkblue mt-0.5">{itemName}</div>
            </div>
          )}

          {itemDetails && (
            <div className="text-xs">
              {itemDetails}
            </div>
          )}

          <div className="flex items-start space-x-2 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Warning:</strong> Deleting will remove this member from active rosters, event attendances, and progression logs.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-300 transition-colors shadow-2xs disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting Record...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
