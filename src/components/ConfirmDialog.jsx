import React from 'react';
import { AlertTriangle, Ban, UserX, Trash2, UserMinus, X } from 'lucide-react';

const VARIANTS = {
  block: {
    icon: Ban,
    iconBg: 'bg-rose-950/60 border border-rose-500/40',
    iconColor: 'text-rose-400',
    confirmBtn: 'bg-rose-600 hover:bg-rose-500 text-white',
    title: 'Block Member',
  },
  unblock: {
    icon: UserMinus,
    iconBg: 'bg-amber-950/60 border border-amber-500/40',
    iconColor: 'text-amber-400',
    confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-white',
    title: 'Unblock Member',
  },
  unfriend: {
    icon: UserX,
    iconBg: 'bg-orange-950/60 border border-orange-500/40',
    iconColor: 'text-orange-400',
    confirmBtn: 'bg-orange-600 hover:bg-orange-500 text-white',
    title: 'Remove Friend',
  },
  delete: {
    icon: Trash2,
    iconBg: 'bg-rose-950/60 border border-rose-500/40',
    iconColor: 'text-rose-400',
    confirmBtn: 'bg-rose-600 hover:bg-rose-500 text-white',
    title: 'Delete',
  },
  decline: {
    icon: X,
    iconBg: 'bg-gray-800 border border-gray-700',
    iconColor: 'text-gray-300',
    confirmBtn: 'bg-gray-700 hover:bg-gray-600 text-white',
    title: 'Decline Request',
  },
};

/**
 * ConfirmDialog — A polished, animated confirmation modal.
 *
 * Props:
 *   isOpen        boolean — controls visibility
 *   onClose       () => void — called on cancel / backdrop click
 *   onConfirm     () => void — called when user clicks the confirm button
 *   variant       'block' | 'unblock' | 'unfriend' | 'delete' | 'decline'
 *   title         string (optional) — overrides default title
 *   message       string | ReactNode — main description text
 *   confirmLabel  string (optional) — override button label
 *   isLoading     boolean — disables buttons while async op is running
 */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  variant = 'block',
  title,
  message,
  confirmLabel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const v = VARIANTS[variant] || VARIANTS.block;
  const Icon = v.icon;
  const resolvedTitle = title || v.title;
  const resolvedConfirmLabel = confirmLabel || resolvedTitle;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Blurred dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog Card */}
      <div
        className="relative w-full max-w-sm bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line by variant */}
        <div
          className={`h-1 w-full ${
            variant === 'block' || variant === 'delete'
              ? 'bg-gradient-to-r from-rose-500 to-pink-600'
              : variant === 'unblock'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
              : variant === 'unfriend'
              ? 'bg-gradient-to-r from-orange-500 to-amber-400'
              : 'bg-gradient-to-r from-gray-700 to-gray-600'
          }`}
        />

        <div className="p-6 space-y-5">
          {/* Icon + Title */}
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${v.iconBg}`}
            >
              <Icon className={`w-6 h-6 ${v.iconColor}`} />
            </div>
            <h3 className="text-base font-black text-white leading-tight">{resolvedTitle}</h3>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-300 leading-relaxed">{message}</p>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-800 hover:bg-gray-700 text-sm font-bold text-gray-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 rounded-2xl text-sm font-black transition-all shadow-md disabled:opacity-50 cursor-pointer active:scale-95 ${v.confirmBtn}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>Processing…</span>
                </span>
              ) : (
                resolvedConfirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
