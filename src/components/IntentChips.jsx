import React from 'react';
import { Heart, Users, Flame, Compass, Check } from 'lucide-react';
import { INTENTS } from '../utils/mockData';

const iconMap = {
  Heart,
  Smile: Users,
  Flame,
  Compass,
};

export const IntentChips = ({
  selectedIntents = [],
  onToggle,
  multiple = true,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-2 gap-2.5 sm:gap-3 ${className}`}>
      {INTENTS.map((intent) => {
        const isSelected = selectedIntents.includes(intent.id) || selectedIntents.includes(intent.label.toLowerCase());
        const IconComponent = iconMap[intent.icon] || Heart;

        return (
          <button
            key={intent.id}
            type="button"
            onClick={() => onToggle(intent.id)}
            className={`
              flex flex-col p-3 rounded-2xl border text-left transition-all duration-200 select-none min-h-touch cursor-pointer
              ${
                isSelected
                  ? 'bg-pink-500/15 border-pink-500 text-white shadow-md shadow-pink-500/10 ring-1 ring-pink-500/50'
                  : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:border-gray-700 hover:bg-gray-800/60'
              }
            `}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <div
                className={`p-2 rounded-xl ${
                  isSelected ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            <span className="font-bold text-sm mt-1">{intent.label}</span>
            <span className="text-[11px] text-gray-400 leading-tight mt-0.5">{intent.desc}</span>
          </button>
        );
      })}
    </div>
  );
};

export default IntentChips;
