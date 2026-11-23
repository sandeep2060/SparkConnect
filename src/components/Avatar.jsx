import React from 'react';

export const Avatar = ({
  src,
  alt = 'Avatar',
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  status, // 'online' | 'offline' | 'busy'
  blurred = false,
  className = '',
  fallbackInitials,
}) => {
  const sizeMap = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-28 h-28 text-2xl',
  };

  const statusColor = {
    online: 'bg-emerald-500 ring-2 ring-white dark:ring-gray-950',
    offline: 'bg-gray-400 ring-2 ring-white dark:ring-gray-950',
    busy: 'bg-amber-500 ring-2 ring-white dark:ring-gray-950',
  };

  return (
    <div className={`relative inline-block shrink-0 rounded-full select-none ${sizeMap[size]} ${className}`}>
      <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold border border-white/10">
        {src ? (
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-all duration-300 ${blurred ? 'blur-md scale-110' : ''}`}
            loading="lazy"
          />
        ) : (
          <span>{fallbackInitials || alt?.charAt(0) || 'U'}</span>
        )}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusColor[status]}`}
          title={status}
        />
      )}
    </div>
  );
};

export default Avatar;
