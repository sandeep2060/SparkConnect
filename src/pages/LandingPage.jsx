import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  Eye,
  EyeOff,
  ShieldCheck,
  Compass,
  Lock,
  Flame,
  CheckCircle,
  ArrowRight,
  Shield,
  MessageCircle,
} from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';

export const LandingPage = () => {
  const [demoMode, setDemoMode] = useState('stranger');

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32 px-4 sm:px-8 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[600px] sm:h-[600px] bg-gradient-to-tr from-pink-600/20 via-rose-500/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-purple-500/10 border border-pink-500/30 text-xs font-bold text-pink-400 mb-6 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Dual-Mode Discovery: Open or Fully Incognito</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] mb-6">
            Where Chemistry Meets{' '}
            <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
              Mystery & Autonomy
            </span>
          </h1>

          <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
            SparkConnect redefines dating, friendship, and adult-partner discovery. 
            Connect openly with verified profiles, or go incognito in Stranger Mode until mutual trust is built.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" fullWidth icon={ArrowRight}>
                Join Free (18+)
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" fullWidth>
                Sign In
              </Button>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 sm:mt-16 pt-8 border-t border-gray-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 text-center max-w-3xl mx-auto">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">100%</div>
              <div className="text-xs text-gray-400 mt-1">ID Verified Base</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-pink-400">Dual</div>
              <div className="text-xs text-gray-400 mt-1">Profile Modes</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">256-bit</div>
              <div className="text-xs text-gray-400 mt-1">Discreet Privacy</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">24/7</div>
              <div className="text-xs text-gray-400 mt-1">Safety Check-in</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Dual-Mode Showcase Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="stranger" className="mb-3">
              The Dual-Mode Difference
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              You Decide How You Appear
            </h2>
            <p className="text-sm text-gray-400 mt-3">
              Switch freely between standard Public visibility and incognito Stranger Mode.
              Test the interactive toggle below to see how other members perceive you:
            </p>

            {/* Toggle demo button */}
            <div className="inline-flex p-1.5 rounded-2xl bg-gray-900 border border-gray-800 mt-6 gap-2">
              <button
                type="button"
                onClick={() => setDemoMode('public')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-touch ${
                  demoMode === 'public'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                Public Mode
              </button>
              <button
                type="button"
                onClick={() => setDemoMode('stranger')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-touch ${
                  demoMode === 'stranger'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <EyeOff className="w-4 h-4" />
                Stranger Mode
              </button>
            </div>
          </div>

          {/* Interactive Card Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
            {/* Card Preview */}
            <div className="relative mx-auto w-full max-w-xs sm:max-w-sm">
              <div className="rounded-3xl overflow-hidden border border-gray-800 bg-gray-900 shadow-2xl relative">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
                    alt="Demo Profile"
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      demoMode === 'stranger' ? 'blur-lg scale-110 brightness-75' : 'blur-none'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-4 inset-x-4 flex justify-between items-center">
                    {demoMode === 'stranger' ? (
                      <Badge variant="stranger" icon={Lock}>
                        Mystery Incognito
                      </Badge>
                    ) : (
                      <Badge variant="success" icon={CheckCircle}>
                        Verified Member
                      </Badge>
                    )}
                    <Badge variant="default">Romance</Badge>
                  </div>

                  {/* Stranger lock center prompt */}
                  {demoMode === 'stranger' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-purple-500/40 backdrop-blur-md flex items-center justify-center text-purple-300 mb-2 animate-pulse-subtle">
                        <Lock className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-white drop-shadow">Photo Blurred</span>
                      <span className="text-[11px] text-purple-200 mt-1 max-w-[180px] drop-shadow">
                        Mutual reveal agreement needed to unlock
                      </span>
                    </div>
                  )}

                  {/* Profile info footer */}
                  <div className="absolute bottom-4 inset-x-4">
                    <h3 className="text-2xl font-black text-white">
                      {demoMode === 'stranger' ? 'ShadowVelvet' : 'Elena Rostova, 26'}
                    </h3>
                    <p className="text-xs text-gray-300 mt-1">
                      Architect by day, vinyl record collector by night. Seeking soulful connections.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-900/80 border border-white/10 text-gray-300">
                        Art & Galleries
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-900/80 border border-white/10 text-gray-300">
                        Live Music
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanatory details */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gray-900/80 border border-gray-800">
                <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                  {demoMode === 'stranger' ? (
                    <>
                      <Lock className="w-5 h-5 text-purple-400" />
                      <span>Stranger Mode Benefits</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5 text-pink-400" />
                      <span>Public Mode Benefits</span>
                    </>
                  )}
                </h4>
                <ul className="space-y-3 text-sm text-gray-300">
                  {demoMode === 'stranger' ? (
                    <>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Total visual privacy:</strong> Your face remains obscured by an algorithmic blur filter.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Pseudonym protection:</strong> Connect using a mystery alias instead of your real name.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span><strong>Mutual Reveal gate:</strong> Unveil photos only after both you and your match agree.</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                        <span><strong>Instant visual chemistry:</strong> Showcase your verified portraits and real lifestyle.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                        <span><strong>Higher match volume:</strong> Open profiles receive up to 3.4x more spontaneous interactions.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                        <span><strong>ID Shield Badge:</strong> Stand out with confirmed identity verification.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="flex gap-4">
                <Link to="/signup" className="flex-1">
                  <Button variant="primary" fullWidth size="lg">
                    Choose Your Mode
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Features Grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-gray-900/40 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Built on Trust, Discretion & Safety
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              Every detail engineered to empower consensual discovery and peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card glass className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Government ID Verification</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                No bots, catfishes, or underage profiles. Every member submits government-issued ID + selfie verification before uninhibited interaction.
              </p>
            </Card>

            <Card glass className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Safety Check-In Protocol</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Heading out for an in-person date? Tap the Safety Check-in button in chat to discreetly notify your trusted contact with coordinates and timers.
              </p>
            </Card>

            <Card glass className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Granular Intent Filtering</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Match by clear upfront expectations: Romance, Platonic Friendship, Casual Encounters, or Exploring without judgment.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to action banner */}
      <section className="py-16 px-4 sm:px-8 bg-gradient-to-r from-pink-600/10 via-purple-600/10 to-rose-600/10 border-t border-gray-800 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Discover Genuine Sparks?
          </h2>
          <p className="text-sm text-gray-300 max-w-lg mx-auto">
            Join thousands of adults enjoying transparent or incognito connections on SparkConnect.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" variant="primary">
                Create Free Profile
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary">
                Sign In Existing Member
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
