import React from 'react';

export const Card = ({
  children,
  className = '',
  glass = false,
  hoverable = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl transition-all duration-200 overflow-hidden
        ${glass 
          ? 'bg-gray-900/60 backdrop-blur-xl border border-white/10 shadow-xl' 
          : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm'}
        ${hoverable ? 'hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-500/5 cursor-pointer transform hover:-translate-y-0.5' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
