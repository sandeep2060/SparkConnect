import React from 'react';
import {
  Sparkles,
  Heart,
  X,
  MapPin,
  Flame,
  Zap,
  Target,
  Palette,
  Compass,
  CheckCircle2,
  Send,
  MessageCircle,
} from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export const CompatibilityModal = ({
  isOpen,
  onClose,
  user,
  compatibility,
  onSuperSpark,
  onOpenChat,
}) => {
  if (!user || !compatibility) return null;

  const score = compatibility.score || 88;
  const breakdown = compatibility.breakdown || {
    intentScore: 90,
    passionsScore: 85,
    distanceScore: 92,
    lifestyleScore: 84,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SparkSync™ Compatibility">
      <div className="space-y-5">
        {/* Hero Score Showcase */}
        <div className="relative p-5 rounded-3xl bg-gradient-to-br from-pink-950/60 via-purple-950/60 to-gray-950 border border-pink-500/30 overflow-hidden text-center shadow-xl">
          {/* Background Ambient Glow */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Radial Score Meter */}
          <div className="relative inline-flex items-center justify-center mb-3">
            <div className="w-28 h-28 rounded-full bg-gray-950 border-4 border-pink-500/40 flex flex-col items-center justify-center shadow-inner shadow-pink-500/20 ring-4 ring-pink-500/10">
              <span className="text-3xl font-black bg-gradient-to-r from-amber-300 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                {score}%
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-pink-300">
                Match Index
              </span>
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-pink-500 text-white flex items-center justify-center shadow-md animate-bounce">
              <Flame className="w-4 h-4 fill-white" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-white flex items-center justify-center gap-1.5">
              <span>{compatibility.tier || 'Exceptional Match 🔥'}</span>
            </h3>
            <p className="text-xs text-gray-300">
              You and <span className="font-bold text-white">{user.name || user.pseudonym}</span> exhibit powerful algorithmic synergy across values, passions, and lifestyle.
            </p>
          </div>
        </div>

        {/* 4 Pillar Compatibility Radar / Breakdown */}
        <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-pink-400" />
              <span>Algorithmic Factor Breakdown</span>
            </h4>
            <span className="text-[10px] text-gray-500 font-mono">Weighted Matrix</span>
          </div>

          <div className="space-y-3">
            {/* Factor 1: Intent */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-rose-400" />
                  <span>Connection Intent ({user.intent || 'Romance'})</span>
                </span>
                <span className="font-bold text-rose-300 font-mono">{breakdown.intentScore}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-700"
                  style={{ width: `${breakdown.intentScore}%` }}
                />
              </div>
            </div>

            {/* Factor 2: Passions */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>Passions & Hobbies Overlap</span>
                </span>
                <span className="font-bold text-purple-300 font-mono">{breakdown.passionsScore}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                  style={{ width: `${breakdown.passionsScore}%` }}
                />
              </div>
            </div>

            {/* Factor 3: Proximity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Locality & Distance Synergy</span>
                </span>
                <span className="font-bold text-emerald-300 font-mono">{breakdown.distanceScore}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${breakdown.distanceScore}%` }}
                />
              </div>
            </div>

            {/* Factor 4: Energy & Style */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Energy & Social Dynamics</span>
                </span>
                <span className="font-bold text-amber-300 font-mono">{breakdown.lifestyleScore}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${breakdown.lifestyleScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shared Passions / Tags */}
        {compatibility.sharedInterests?.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Mutual Interests You Both Love</span>
            </h5>
            <div className="flex flex-wrap gap-2">
              {compatibility.sharedInterests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-pink-500/20 border border-pink-500/40 text-pink-200 flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle2 className="w-3 h-3 text-pink-400" />
                  <span>{interest}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Matchmaker AI Conversation Opener */}
        {compatibility.recommendedOpener && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-500/10 border border-amber-500/30 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Algorithmic Conversation Starter</span>
            </div>
            <p className="text-xs text-gray-200 italic leading-relaxed">
              "{compatibility.recommendedOpener}"
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          {onSuperSpark && (
            <Button
              variant="primary"
              fullWidth
              icon={Sparkles}
              onClick={() => {
                onClose();
                onSuperSpark(user);
              }}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 shadow-lg shadow-pink-500/20"
            >
              Send SuperSpark
            </Button>
          )}

          {onOpenChat && (
            <Button
              variant="outline"
              fullWidth
              icon={MessageCircle}
              onClick={() => {
                onClose();
                onOpenChat(user.id);
              }}
            >
              Direct Message
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CompatibilityModal;
