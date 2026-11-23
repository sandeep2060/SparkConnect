import React, { useState, useEffect } from 'react';
import { Eye, ShieldAlert, X, AlertTriangle, Lock } from 'lucide-react';
import Button from './Button';

export const MediaViewerModal = ({
  isOpen,
  onClose,
  mediaUrl,
  viewLimit = 1,
  viewsRemaining = 1,
  onViewConsumed,
  senderName = 'Date Partner',
}) => {
  const [screenshotAttempted, setScreenshotAttempted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setScreenshotAttempted(false);
      setSecondsLeft(15);
      return;
    }

    // Auto countdown timer for view-once ephemeral viewing
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishView();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Anti-screenshot keyboard & print-screen detectors
    const handleKeyDown = (e) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.key === 'p') ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4'))
      ) {
        e.preventDefault();
        setScreenshotAttempted(true);
      }
    };

    // Anti-screenshot window focus / blur detection
    const handleBlur = () => {
      setScreenshotAttempted(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isOpen]);

  const handleFinishView = () => {
    if (onViewConsumed) {
      onViewConsumed();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-2xl select-none"
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Screenshot Warning Flash */}
      {screenshotAttempted && (
        <div className="absolute inset-0 z-50 bg-rose-950/95 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mb-4">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-white">Screenshot Blocked!</h3>
          <p className="text-xs text-rose-200 mt-2 max-w-sm">
            For member privacy, screenshots, screen recording, and window switching are prohibited for ephemeral view-limited media.
          </p>
          <div className="mt-6">
            <Button variant="danger" size="md" onClick={() => setScreenshotAttempted(false)}>
              Understood
            </Button>
          </div>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="absolute top-4 inset-x-4 z-40 flex items-center justify-between text-white max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-400 flex items-center justify-center text-xs font-black">
            {viewLimit}x
          </span>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span>View-Limited Media</span>
              <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-500/40">
                {viewsRemaining > 1 ? `${viewsRemaining} views left` : 'Final view'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400">
              From {senderName} • Self-destructs after viewing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-gray-900/80 px-2.5 py-1 rounded-full border border-white/10 text-amber-300">
            {secondsLeft}s
          </span>
          <button
            onClick={handleFinishView}
            className="p-2 rounded-full bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white border border-white/10 transition-colors min-h-touch min-w-touch flex items-center justify-center"
            title="Close and consume view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Ephemeral Media Frame with Screenshot Blocking Layer */}
      <div className="relative max-w-lg w-full max-h-[80vh] flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-black">
        {/* Anti-Screen Recording Watermark Matrix */}
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-wrap items-center justify-around opacity-15 overflow-hidden text-[11px] font-mono text-white/50 select-none">
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="rotate-[-25deg] m-6">
              SparkConnect Confidential • Protected
            </span>
          ))}
        </div>

        {/* The Media Image */}
        <img
          src={mediaUrl}
          alt="Protected Ephemeral Media"
          className="w-full h-full object-contain pointer-events-none select-none max-h-[75vh]"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Protection Footer Badge */}
        <div className="absolute bottom-3 inset-x-3 z-30 flex items-center justify-center">
          <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-gray-300 flex items-center gap-1.5 shadow-lg">
            <Lock className="w-3 h-3 text-pink-400" />
            <span>Anti-Screenshot Guard Active • Watermarked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaViewerModal;
