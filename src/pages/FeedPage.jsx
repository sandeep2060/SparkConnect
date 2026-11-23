import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeedUsersApi, likeUserApi, passUserApi, requestRevealApi } from '../api/users';
import ProfileCard from '../components/ProfileCard';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import { useProfileStore } from '../store/profileStore';
import { Sparkles, RotateCcw, Heart, Flame, MapPin, ArrowRight } from 'lucide-react';
import Button from '../components/Button';

export const FeedPage = () => {
  const navigate = useNavigate();
  const { revealUser, isUserRevealed } = useProfileStore();

  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [matchNotification, setMatchNotification] = useState(null);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const data = await getFeedUsersApi();
      setUsers(data);
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

  const handleSuperLike = async (userId) => {
    const currentUserObj = users[currentIndex];
    setMatchNotification(currentUserObj);
    nextCard();
  };

  const handleReveal = async (userId) => {
    try {
      await requestRevealApi(userId);
      revealUser(userId);
      // Update local state to show revealed immediately
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, revealed: true } : u));
    } catch (e) {
      console.error(e);
    }
  };

  const nextCard = () => {
    setCurrentIndex(prev => prev + 1);
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

      {/* Live Map Nearby Teaser Banner */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Live Spark Map</p>
            <p className="text-[10px] text-gray-400">See 12+ members & hotspots near your spot</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/app/map')}
          className="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all shadow-md shadow-pink-500/20 flex items-center gap-1 shrink-0 min-h-touch cursor-pointer"
        >
          <span>Open Map</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Card View */}
      {isLoading ? (
        <SkeletonCard />
      ) : hasMore && currentMatch ? (
        <div className="animate-fade-in relative">
          <ProfileCard
            user={{
              ...currentMatch,
              revealed: currentMatch.revealed || isUserRevealed(currentMatch.id),
            }}
            onLike={handleLike}
            onPass={handlePass}
            onSuperLike={handleSuperLike}
            onReveal={handleReveal}
          />
          <div className="text-center text-[11px] text-gray-500 mt-2">
            Card {currentIndex + 1} of {users.length} • Tap card for full bio
          </div>
        </div>
      ) : (
        <EmptyState
          icon={RotateCcw}
          title="That's all for now!"
          description="You've explored all current potential matches in your immediate radius. Tap below to reset and explore again."
          actionLabel="Reset Match Feed"
          onAction={loadFeed}
        />
      )}
    </div>
  );
};

export default FeedPage;
