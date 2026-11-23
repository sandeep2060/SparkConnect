import React from 'react';

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div
      className={`rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 animate-pulse flex flex-col ${className}`}
    >
      <div className="w-full aspect-[3/4] sm:aspect-[4/5] bg-gray-800 relative">
        <div className="absolute top-3 left-3 w-20 h-5 bg-gray-700 rounded-full" />
        <div className="absolute top-3 right-3 w-14 h-5 bg-gray-700 rounded-full" />
        <div className="absolute bottom-4 inset-x-4 space-y-2">
          <div className="w-2/3 h-6 bg-gray-700 rounded-md" />
          <div className="w-full h-3 bg-gray-700/80 rounded" />
          <div className="w-4/5 h-3 bg-gray-700/80 rounded" />
          <div className="flex gap-2 pt-1">
            <div className="w-14 h-4 bg-gray-700 rounded-md" />
            <div className="w-16 h-4 bg-gray-700 rounded-md" />
          </div>
        </div>
      </div>
      <div className="p-3 bg-gray-900 border-t border-gray-800 flex justify-around">
        <div className="w-12 h-12 rounded-2xl bg-gray-800" />
        <div className="w-10 h-10 rounded-2xl bg-gray-800" />
        <div className="w-12 h-12 rounded-2xl bg-gray-800" />
      </div>
    </div>
  );
};

export default SkeletonCard;
