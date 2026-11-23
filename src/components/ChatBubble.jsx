import React, { useState, useEffect } from 'react';
import { formatMessageTime } from '../utils/helpers';
import {
  Check,
  CheckCheck,
  Play,
  Pause,
  Lock,
  Eye,
  EyeOff,
  Flame,
  Clock,
  ShieldCheck,
  Volume2,
} from 'lucide-react';

export const ChatBubble = ({
  message,
  isMine = false,
  showAvatar = true,
  partnerAvatar,
  onOpenEphemeralMedia,
  onOpenMedia,
  onDisappear,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(null);

  // Live Disappearing Countdown
  useEffect(() => {
    if (!message.disappearing || message.disappearing === 'off') {
      setSecondsRemaining(null);
      return;
    }

    const getLifetimeSeconds = () => {
      switch (message.disappearing) {
        case '10s': return 10;
        case 'after_seen': return 15;
        case '1m': return 60;
        case 'custom':
        case '1h': return 3600;
        case '24h': return 86400;
        case '7d': return 604800;
        default: return null;
      }
    };

    const lifetime = getLifetimeSeconds();
    if (!lifetime) return;

    // Base time: for '10s' or 'after_seen', if seenAt exists, count down from seenAt, else from timestamp
    const baseTime = (message.disappearing === 'after_seen' || message.disappearing === '10s') && message.seenAt
      ? new Date(message.seenAt).getTime()
      : new Date(message.timestamp).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - baseTime) / 1000);
      const remaining = Math.max(0, lifetime - elapsed);
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        if (onDisappear) {
          onDisappear(message.id);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [message.id, message.disappearing, message.seenAt, message.timestamp, onDisappear]);

  const formatRemainingTime = (secs) => {
    if (secs == null) return '';
    if (secs <= 0) return '0s';
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) {
      const mins = Math.floor(secs / 60);
      const s = secs % 60;
      return `${mins}m ${s > 0 ? `${s}s` : ''}`;
    }
    const hrs = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${hrs}h ${m > 0 ? `${m}m` : ''}`;
  };

  // Audio playback simulator
  useEffect(() => {
    let timer;
    if (isPlayingAudio) {
      timer = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 10;
        });
      }, 300);
    } else {
      setPlaybackProgress(0);
    }
    return () => clearInterval(timer);
  }, [isPlayingAudio]);

  const isViewLimited = message.type === 'view_once';
  const isVoiceClip = message.type === 'voice';
  const isRegularMedia = message.type === 'image';
  const isExpired = isViewLimited && (message.viewsRemaining === 0);

  // Helper for detailed seen / delivered status text
  const getStatusDisplay = () => {
    if (!isMine) return null;

    if (message.status === 'read') {
      return (
        <span className="flex items-center gap-1 text-sky-300 font-semibold" title={message.seenAt || 'Seen recently'}>
          <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{message.seenStatusText || 'Seen'}</span>
        </span>
      );
    }

    if (message.status === 'delivered') {
      return (
        <span className="flex items-center gap-1 text-gray-400" title="Delivered to device">
          <CheckCheck className="w-3.5 h-3.5 stroke-2" />
          <span>Delivered</span>
        </span>
      );
    }

    if (message.status === 'sent') {
      return (
        <span className="flex items-center gap-1 text-gray-400" title="Sent to server">
          <Check className="w-3.5 h-3.5 stroke-2" />
          <span>Sent</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-gray-400">
        <Clock className="w-3 h-3 animate-spin" />
        <span>Sending...</span>
      </span>
    );
  };

  return (
    <div
      className={`flex items-end gap-2.5 my-2.5 ${
        isMine ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isMine && showAvatar && (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 shrink-0 mb-0.5 border border-white/10">
          <img
            src={partnerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            alt="Sender avatar"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div
        className={`
          max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 text-sm shadow-md break-words
          ${
            isMine
              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white rounded-br-xs shadow-pink-500/15'
              : 'bg-gray-800 dark:bg-gray-800 text-gray-100 rounded-bl-xs border border-gray-700/60'
          }
        `}
      >
        {/* Disappearing timer badge if active with live countdown */}
        {message.disappearing && message.disappearing !== 'off' && (
          <div className="flex items-center gap-1.5 text-[10px] font-medium opacity-90 mb-1.5 pb-1 border-b border-white/10 select-none">
            <Flame className="w-3 h-3 text-amber-300 animate-pulse shrink-0" />
            <span className="text-amber-200">
              {secondsRemaining !== null
                ? `Vanish in ${formatRemainingTime(secondsRemaining)}`
                : `Disappearing (${message.disappearing})`}
            </span>
          </div>
        )}

        {/* 1. VIEW-LIMITED MEDIA (1x, 2x, 3x Views with anti-screenshot lock) */}
        {isViewLimited && (
          <div className="space-y-2">
            {isExpired ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10 opacity-70">
                <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-300">
                    Photo Expired ({message.viewLimit || 1}x View)
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Opened & self-destructed
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenEphemeralMedia && onOpenEphemeralMedia(message)}
                className={`
                  w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all min-h-touch cursor-pointer
                  ${
                    isMine
                      ? 'bg-black/30 border-white/20 hover:bg-black/40 text-white'
                      : 'bg-purple-950/40 border-purple-500/40 hover:bg-purple-900/40 text-purple-200'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-pink-500 text-white flex items-center justify-center font-black text-xs shadow-md">
                    {message.viewLimit || 1}x
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>View-Limited Photo</span>
                      <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-mono">
                        {message.viewsRemaining || message.viewLimit || 1} left
                      </span>
                    </div>
                    <div className="text-[10px] opacity-80 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Tap to open • Screenshot blocked</span>
                    </div>
                  </div>
                </div>

                <Eye className="w-4 h-4 shrink-0 opacity-80" />
              </button>
            )}

            {message.text && (
              <p className="leading-relaxed whitespace-pre-wrap text-xs mt-1">{message.text}</p>
            )}
          </div>
        )}

        {/* 2. REGULAR MEDIA ATTACHMENT */}
        {isRegularMedia && (
          <div className="space-y-1.5">
            <div
              onClick={() => onOpenMedia && message.mediaUrl && onOpenMedia(message.mediaUrl)}
              className="rounded-xl overflow-hidden border border-white/10 max-h-80 bg-black/60 cursor-pointer group relative"
            >
              <img
                src={message.mediaUrl}
                alt="Attachment"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[11px] font-bold text-white bg-black/60 px-2 py-1 rounded-lg backdrop-blur-sm">
                  Click to Expand
                </span>
              </div>
            </div>
            {message.text && message.text !== 'Sent a photo' && (
              <p className="leading-relaxed whitespace-pre-wrap text-xs px-0.5">{message.text}</p>
            )}
          </div>
        )}

        {/* 3. VOICE CLIP AUDIO BUBBLE */}
        {isVoiceClip && (
          <div className="space-y-1.5 min-w-[220px]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md shrink-0
                  ${isMine ? 'bg-white text-pink-600' : 'bg-pink-500 text-white'}
                `}
                aria-label={isPlayingAudio ? 'Pause voice message' : 'Play voice message'}
              >
                {isPlayingAudio ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              {/* Animated Audio Waveform */}
              <div className="flex-1 flex items-center gap-1 h-6 px-1">
                {[40, 75, 50, 90, 60, 30, 80, 45, 95, 70, 35, 65, 85, 40].map((height, idx) => (
                  <span
                    key={idx}
                    className={`
                      w-1 rounded-full transition-all duration-200
                      ${
                        isMine
                          ? idx / 14 <= playbackProgress / 100
                            ? 'bg-white'
                            : 'bg-white/40'
                          : idx / 14 <= playbackProgress / 100
                          ? 'bg-pink-400'
                          : 'bg-gray-600'
                      }
                    `}
                    style={{
                      height: isPlayingAudio ? `${Math.max(25, (height * (idx % 2 === 0 ? 1 : 0.8)))}%` : `${height * 0.6}%`,
                    }}
                  />
                ))}
              </div>

              <span className="text-[11px] font-mono opacity-90 shrink-0">
                {message.audioDuration || '0:14'}
              </span>
            </div>
          </div>
        )}

        {/* 4. STANDARD TEXT */}
        {!isViewLimited && !isVoiceClip && !isRegularMedia && (
          <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
        )}

        {/* Footer: Timestamp & Delivery/Seen Status */}
        <div
          className={`
            flex items-center gap-2 justify-end text-[10px] mt-1.5 select-none
            ${isMine ? 'text-pink-100/85' : 'text-gray-400'}
          `}
        >
          <span>{formatMessageTime(message.timestamp)}</span>
          {isMine && getStatusDisplay()}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
