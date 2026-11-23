import React from 'react';
import { ALL_INTERESTS } from '../utils/mockData';
import { Plus, Check } from 'lucide-react';

export const InterestGrid = ({
  selectedInterests = [],
  onToggle,
  max = 5,
  min = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Select {min} to {max} interests</span>
        <span className={`font-semibold ${selectedInterests.length >= min ? 'text-pink-400' : 'text-amber-400'}`}>
          {selectedInterests.length} / {max} selected
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_INTERESTS.map((interest) => {
          const isSelected = selectedInterests.includes(interest);
          const isDisabled = !isSelected && selectedInterests.length >= max;

          return (
            <button
              key={interest}
              type="button"
              disabled={isDisabled}
              onClick={() => onToggle(interest)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                transition-all duration-150 select-none min-h-[38px] cursor-pointer
                ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                    : isDisabled
                    ? 'bg-gray-900/40 text-gray-600 border border-gray-800/50 cursor-not-allowed opacity-50'
                    : 'bg-gray-900 border border-gray-800 text-gray-300 hover:border-pink-500/40 hover:text-white'
                }
              `}
            >
              {isSelected ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-gray-400" />
              )}
              {interest}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InterestGrid;
