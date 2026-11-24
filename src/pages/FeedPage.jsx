import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeedUsersApi, likeUserApi, passUserApi, requestRevealApi } from '../api/users';
import ProfileCard from '../components/ProfileCard';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import CompatibilityModal from '../components/CompatibilityModal';
import SuperSparkModal from '../components/SuperSparkModal';
import { useProfileStore } from '../store/profileStore';
import { useAuthStore } from '../store/authStore';
import {
  findGaleShapleyStandout,
  rankUsersByCompatibility,
  calculateSparkCompatibility,
} from '../utils/compatibilityAlgorithm';
import {
  Sparkles,
  RotateCcw,
  Heart,
  Flame,
  MapPin,
  ArrowRight,
  Zap,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import Button from '../components/Button';

export const FeedPage = () => {
  const navigate = useNavigate();
  const { revealUser, isUserRevealed } = useProfileStore();
  const currentUser = useAuthStore((s) => s.user);

  const [rawUsers, setRawUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [matchNotification, setMatchNotification] = useState(null);

  // Premium Algorithmic Filter Mode: 'algorithm' | 'nearby' | 'active'
  const [sortMode, setSortMode] = useState('algorithm');
  const [standoutUser, setStandoutUser] = useState(null);

  // Modals state
  const [inspectingCompatibility, setInspectingCompatibility] = useState(null);
  const [superSparkTarget, setSuperSparkTarget] = useState(null);

  // Apply sorting algorithm to current candidates pool
  const applyAlgorithmSort = (candidates, mode = sortMode) => {
    if (!candidates || candidates.length === 0) return [];
    let processed = [...candidates];

    // Compute and annotate compatibility for every candidate
    processed = processed.map((c) => ({
      ...c,
      compatibility: calculateSparkCompatibility(currentUser, c),
    }));

    // Identify #1 Gale-Shapley Standout
    const standout = findGaleShapleyStandout(currentUser, processed);
    setStandoutUser(standout);

    if (mode === 'algorithm') {
      processed.sort((a, b) => (b.compatibility?.score || 0) - (a.compatibility?.score || 0));
    } else if (mode === 'nearby') {
      processed.sort((a, b) => (Number(a.distance) || 5) - (Number(b.distance) || 5));
    } else if (mode === 'active') {
      processed.sort((a, b) => (b.activeNow ? 1 : 0) - (a.activeNow ? 1 : 0));
    }

    if (standout) {
      processed = processed.map((u) => (u.id === standout.id ? { ...u, isStandout: true } : u));
    }

    return processed;
  };

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const data = await getFeedUsersApi();
      setRawUsers(data);
      const sorted = applyAlgorithmSort(data, sortMode);
      setUsers(sorted);
      setCurrentIndex(0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleSortChange = (newMode) => {
    setSortMode(newMode);
    if (rawUsers.length > 0) {
      const sorted = applyAlgorithmSort(rawUsers, newMode);
      setUsers(sorted);
      setCurrentIndex(0);
    }
  };

  const handleLike = async (userId) => {
    try {
      const res = await likeUserApi(userId);
      const currentUserObj = users[currentIndex];
      
      if (res.isMatch) {
        setMatchNotification(currentUserObj);
      }
      nextCard();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePass = async (userId) => {
    try {
      await passUserApi(userId);
      nextCard();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSuperLikeTrigger = (userId) => {
    const candidate = users.find((u) => u.id === userId) || users[currentIndex];
    setSuperSparkTarget(candidate);
  };

  const handleSendSuperSpark = async ({ targetUserId, note }) => {
    try {
      const res = await likeUserApi(targetUserId, { isSuperSpark: true, note });
      const targetObj = users.find((u) => u.id === targetUserId) || users[currentIndex];
      if (res.isMatch) {
        setMatchNotification(targetObj);
      }
      nextCard();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReveal = async (userId) => {
    try {
      await requestRevealApi(userId);
      revealUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, revealed: true } : u)));
    } catch (e) {
      console.error(e);
    }
  };

  const nextCard = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const currentMatch = users[currentIndex];
  const hasMore = currentIndex < users.length;

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Match Notification Modal Popup */}
      {matchNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-sm w-full bg-gray-900 border border-pink-500/50 rounded-3xl p-6 text-center space-y-5 shadow-2xl animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-pink-500/30">
              <Flame className="w-8 h-8 fill-white" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">It's a Spark!</h3>
              <p className="text-xs text-gray-300 mt-1">
                You and <strong>{matchNotification.mode === 'stranger' && !matchNotification.revealed ? matchNotification.pseudonym : matchNotification.name}</strong> liked each other!
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  const targetId = matchNotification.id;
                  setMatchNotification(null);
                  navigate(`/app/chats/${targetId}`);
                }}
              >
                Send Message
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => setMatchNotification(null)}
              >
                Keep Swiping
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Gale-Shapley "Most Compatible" Standout Banner (Hinge-Style Top Pick) */}
      {standoutUser && (
        <div
          onClick={() =>
            setInspectingCompatibility({
              user: standoutUser,
              compatibility: standoutUser.compatibility,
            })
          }
          className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-pink-500/15 border border-amber-500/40 backdrop-blur-xl flex items-center justify-between gap-3 shadow-lg shadow-amber-500/5 cursor-pointer hover:border-amber-400 transition-all select-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <Avatar
                src={standoutUser.avatar}
                alt={standoutUser.name || 'Standout'}
                size="md"
                status={standoutUser.activeNow ? 'online' : 'offline'}
                blurred={standoutUser.mode === 'stranger' && !standoutUser.revealed}
              />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center text-[10px] font-black shadow ring-2 ring-gray-950">
                🔥
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-wider bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  Today's Top Pick
                </span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-mono font-bold px-1.5 py-0.2 rounded border border-amber-400/30">
                  {standoutUser.compatibility?.score}% Match
                </span>
              </div>
              <h4 className="text-sm font-bold text-white truncate">
                {standoutUser.name || standoutUser.pseudonym}
              </h4>
              <p className="text-[11px] text-gray-300 truncate">
                {standoutUser.compatibility?.highlights?.[0] || 'Powerful reciprocal chemistry'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black text-xs font-black shrink-0 transition-transform active:scale-95 shadow-md shadow-amber-500/20"
          >
            Synergy
          </button>
        </div>
      )}

      {/* Algorithmic Deck Sorting Bar */}
      <div className="flex items-center justify-between gap-1 p-1 rounded-2xl bg-gray-950 border border-gray-800 text-xs">
        {[
          { id: 'algorithm', label: 'Top Matches', icon: Flame, badge: '🔥' },
          { id: 'nearby', label: 'Closest Nearby', icon: MapPin, badge: '📍' },
          { id: 'active', label: 'Active Now', icon: Zap, badge: '⚡' },
        ].map((tab) => {
          const isSelected = sortMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSortChange(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[38px] ${
                isSelected
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
              <span className="text-[11px] truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Card View */}
      {isLoading ? (
        <SkeletonCard />
      ) : hasMore && currentMatch ? (
        <div className="animate-fade-in relative space-y-2">
          <ProfileCard
            user={{
              ...currentMatch,
              revealed: currentMatch.revealed || isUserRevealed(currentMatch.id),
            }}
            onLike={handleLike}
            onPass={handlePass}
            onSuperLike={handleSuperLikeTrigger}
            onReveal={handleReveal}
            onInspectCompatibility={(u, comp) =>
              setInspectingCompatibility({ user: u, compatibility: comp })
            }
          />
          <div className="text-center text-[11px] text-gray-500">
            Profile {currentIndex + 1} of {users.length} • Tap card or match badge for details
          </div>
        </div>
      ) : (
        <EmptyState
          icon={RotateCcw}
          title="That's all for now!"
          description="You've explored all current potential matches in your deck. Tap below to re-shuffle with our algorithmic engine."
          actionLabel="Re-shuffle Match Feed"
          onAction={loadFeed}
        />
      )}

      {/* Interactive Compatibility Breakdown Modal */}
      {inspectingCompatibility && (
        <CompatibilityModal
          isOpen={!!inspectingCompatibility}
          onClose={() => setInspectingCompatibility(null)}
          user={inspectingCompatibility.user}
          compatibility={inspectingCompatibility.compatibility}
          onSuperSpark={(u) => {
            setInspectingCompatibility(null);
            setSuperSparkTarget(u);
          }}
          onOpenChat={(uid) => {
            setInspectingCompatibility(null);
            navigate(`/app/chats/${uid}`);
          }}
        />
      )}

      {/* SuperSpark with Personal Note Modal */}
      {superSparkTarget && (
        <SuperSparkModal
          isOpen={!!superSparkTarget}
          onClose={() => setSuperSparkTarget(null)}
          targetUser={superSparkTarget}
          compatibility={superSparkTarget.compatibility}
          onSend={handleSendSuperSpark}
        />
      )}
    </div>
  );
};

export default FeedPage;
