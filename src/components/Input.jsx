import React from 'react';

export const Input = ({
  label,
  error,
  helperText,
  icon: Icon,
  endIcon: EndIcon,
  onEndIconClick,
  className = '',
  containerClassName = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center">
            <Icon className="w-5 h-5" />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          className={`
            w-full min-h-touch px-4 py-2.5 rounded-xl
            bg-gray-50 dark:bg-gray-900/80
            text-gray-900 dark:text-gray-100
            border ${error ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gray-200 dark:border-gray-800'}
            focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 focus:outline-none
            transition-all duration-200 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500
            ${Icon ? 'pl-11' : ''}
            ${EndIcon ? 'pr-11' : ''}
            ${className}
          `}
          {...props}
        />

        {EndIcon && (
          <button
            type="button"
            onClick={onEndIconClick}
            className="absolute right-3.5 text-gray-400 hover:text-gray-200 transition-colors p-1 flex items-center justify-center min-w-[32px] min-h-[32px]"
          >
            <EndIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {error ? (
        <span className="text-xs font-medium text-rose-500">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-gray-500 dark:text-gray-400">{helperText}</span>
      ) : null}
    </div>
  );
};

export default Input;
