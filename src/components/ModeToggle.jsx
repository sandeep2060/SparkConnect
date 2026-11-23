import React from 'react';
import { Eye, EyeOff, Sparkles, ShieldAlert } from 'lucide-react';

export const ModeToggle = ({
  mode = 'public',
  onChange,
  showDescription = true,
  className = '',
}) => {
  const isStranger = mode === 'stranger';

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-inner">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isStranger
                ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                : 'bg-pink-500/10 text-pink-400 border border-pink-500/30'
            }`}
          >
            {isStranger ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-100">
                {isStranger ? 'Stranger Mode' : 'Public Profile'}
              </span>
              <span
                className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                  isStranger
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isStranger ? 'Incognito' : 'Visible'}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {isStranger ? 'Photo blurred & pseudonym shown' : 'Standard profile with photo & name'}
            </p>
          </div>
        </div>

        {/* Animated toggle pill */}
        <button
          type="button"
          onClick={() => onChange(isStranger ? 'public' : 'stranger')}
          className={`
            relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-300 ease-in-out focus:outline-none min-h-touch min-w-[56px] items-center
            ${isStranger ? 'bg-purple-600' : 'bg-gradient-to-r from-pink-500 to-rose-500'}
          `}
          role="switch"
          aria-checked={isStranger}
          aria-label="Toggle profile mode"
        >
          <span
            className={`
              pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 
              transition duration-300 ease-in-out flex items-center justify-center text-gray-900
              ${isStranger ? 'translate-x-8' : 'translate-x-1'}
            `}
          >
            {isStranger ? (
              <EyeOff className="w-3.5 h-3.5 text-purple-700" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-rose-600" />
            )}
          </span>
        </button>
      </div>

      {showDescription && (
        <div className="px-1 text-xs text-gray-400 flex items-start gap-2">
          {isStranger ? (
            <>
              <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                In <strong>Stranger Mode</strong>, your photos are blurred to other members until you accept their "Request Reveal" or choose to reveal mutually.
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <span>
                In <strong>Public Mode</strong>, your full photos and verified identity are visible to other members across matches and discover feeds.
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ModeToggle;
