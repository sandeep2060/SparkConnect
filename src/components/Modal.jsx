import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  showClose = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`
          relative w-full ${maxWidth} mx-auto
          bg-gray-900/95 dark:bg-gray-900/95 backdrop-blur-2xl
          border border-white/10 rounded-2xl p-6 shadow-2xl
          text-gray-100 z-10 animate-slide-up
        `}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-800">
          <h3 className="text-lg font-bold tracking-tight bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
            {title}
          </h3>
          {showClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors min-h-touch min-w-touch flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
