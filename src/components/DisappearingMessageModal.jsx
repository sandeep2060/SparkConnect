import React, { useState, useEffect } from 'react';
import { Timer, Check, Sparkles, Clock, Flame } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export const DISAPPEARING_OPTIONS = [
  { id: 'off', label: 'Off', desc: 'Messages remain in conversation permanently' },
  { id: '10s', label: '10 Seconds', desc: 'Messages vanish 10 seconds after opening (Live Vanish Mode 🔥)' },
  { id: 'after_seen', label: 'After Seen', desc: 'Messages vanish immediately after the recipient opens them' },
  { id: '24h', label: '24 Hours', desc: 'Messages vanish 24 hours after being sent' },
  { id: '7d', label: '7 Days', desc: 'Messages vanish 7 days after being sent' },
  { id: 'custom', label: 'Custom (1 Hour)', desc: 'Ultra-ephemeral 1-hour expiration window' },
];

export const DisappearingMessageModal = ({
  isOpen,
  onClose,
  currentSetting = 'off',
  onSave,
}) => {
  const [selected, setSelected] = useState(currentSetting);

  useEffect(() => {
    setSelected(currentSetting || 'off');
  }, [currentSetting, isOpen]);

  const handleApply = () => {
    onSave(selected);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Disappearing Messages">
      <div className="space-y-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-pink-950/40 border border-purple-500/30 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Ephemeral Privacy Protocol</h4>
            <p className="text-[11px] text-gray-300 mt-0.5">
              When activated, new messages sent in this direct thread will automatically self-destruct according to your chosen timer.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {DISAPPEARING_OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`
                  p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between min-h-touch select-none
                  ${
                    isSelected
                      ? 'bg-pink-500/15 border-pink-500 text-white ring-1 ring-pink-500/40'
                      : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                  }
                `}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>{opt.label}</span>
                    {opt.id !== 'off' && (
                      <span className="text-[10px] text-pink-400 font-mono">
                        {opt.id === 'after_seen' ? '⚡ Instant' : opt.id === '24h' ? '⏱️ 24h' : '⏳ Ephemeral'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'bg-pink-500 border-pink-500 text-white'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleApply}>
            Save Setting
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DisappearingMessageModal;
