import React from 'react';

export const Badge = ({
  children,
  variant = 'default', // 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'stranger'
  size = 'md', // 'sm' | 'md'
  icon: Icon,
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-gray-800 text-gray-300 border border-gray-700/60',
    primary: 'bg-pink-500/10 text-pink-400 border border-pink-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
    stranger: 'bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-900/40',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-semibold gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full tracking-wide select-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </span>
  );
};

export default Badge;
