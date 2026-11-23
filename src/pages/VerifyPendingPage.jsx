import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Clock, ArrowRight, Upload, Sparkles, CheckCircle2 } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';

export const VerifyPendingPage = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-lg mx-auto space-y-6 text-center">
        <Card glass className="p-6 sm:p-10 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Animated Scanning Radar Pulse */}
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            {/* Concentric pulsing rings */}
            <span className="absolute inset-0 rounded-full border-2 border-pink-500/30 animate-ping" />
            <span className="absolute -inset-3 rounded-full border border-purple-500/20 animate-pulse" />
            
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500/20 via-rose-500/20 to-purple-500/30 border border-pink-500/50 flex items-center justify-center text-pink-400 shadow-xl backdrop-blur-md">
              <Clock className="w-10 h-10 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Under Review by Trust & Safety
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Verification in Progress
            </h2>
            
            <p className="text-sm text-gray-300 max-w-sm mx-auto leading-relaxed">
              To keep SparkConnect 100% authentic and bot-free, our administrative moderators manually inspect member credentials within 15–30 minutes.
            </p>
          </div>

          {/* Stepper info list */}
          <div className="bg-gray-950/60 rounded-2xl p-4 border border-gray-800 text-left space-y-3 text-xs">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Step 1: Account created & 18+ declaration completed</span>
            </div>
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin shrink-0" />
              <span>Step 2: Security & ID audit queue review</span>
            </div>
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
              <span>Step 3: ID Verified badge unlocked for all feeds</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <Link to="/verify-id" className="block">
              <Button variant="primary" fullWidth size="lg" icon={Upload}>
                Upload Government ID & Selfie
              </Button>
            </Link>

            <Link to="/app" className="block">
              <Button variant="outline" fullWidth size="md" icon={ArrowRight}>
                Enter App in Preview Mode
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyPendingPage;
