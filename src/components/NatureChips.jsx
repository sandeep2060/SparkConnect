import React from 'react';
import { NATURE_TRAITS } from '../utils/mockData';
import { Check, Sparkles } from 'lucide-react';

export const NatureChips = ({
  selectedTraits = [],
  onToggle,
  max = 6,
  min = 2,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Pick {min} to {max} traits defining your energy & vibe</span>
        </span>
        <span
          className={`font-semibold ${
            selectedTraits.length >= min ? 'text-pink-400' : 'text-amber-400'
          }`}
        >
          {selectedTraits.length} / {max} selected
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
        {NATURE_TRAITS.map((trait) => {
          const isSelected = selectedTraits.includes(trait.label) || selectedTraits.includes(trait.id);
          const isDisabled = !isSelected && selectedTraits.length >= max;

          return (
            <button
              key={trait.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onToggle(trait.label)}
              className={`
                flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left
                transition-all duration-200 select-none min-h-touch cursor-pointer
                ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-rose-500/20 border-pink-500 text-white shadow-md shadow-pink-500/10 ring-1 ring-pink-500/50'
                    : isDisabled
                    ? 'bg-gray-950/40 text-gray-600 border-gray-800/40 opacity-40 cursor-not-allowed'
                    : 'bg-gray-900/80 border-gray-800 text-gray-300 hover:border-pink-500/40 hover:bg-gray-850'
                }
              `}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base select-none shrink-0" role="img" aria-label={trait.label}>
                  {trait.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{trait.label}</div>
                  <div className="text-[10px] text-gray-400">{trait.category}</div>
                </div>
              </div>

              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NatureChips;
