import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Filter, MapPin } from 'lucide-react';
import { getDiscoverUsersApi, requestRevealApi } from '../api/users';
import ProfileCard from '../components/ProfileCard';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { INTENTS, RELATIONSHIP_STYLES, ALL_INTERESTS } from '../utils/mockData';
import { useProfileStore } from '../store/profileStore';

export const DiscoverPage = () => {
  const navigate = useNavigate();
  const { revealUser, isUserRevealed } = useProfileStore();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(45);
  const [maxDistance, setMaxDistance] = useState(30);
  const [selectedIntent, setSelectedIntent] = useState('all');
  const [selectedRelationshipStyle, setSelectedRelationshipStyle] = useState('all');
  const [selectedMode, setSelectedMode] = useState('all');
  const [selectedInterest, setSelectedInterest] = useState('all');

  const fetchDiscover = async () => {
    setIsLoading(true);
    try {
      const results = await getDiscoverUsersApi({
        search,
        minAge,
        maxAge,
        maxDistance,
        intent: selectedIntent,
        relationshipStyle: selectedRelationshipStyle,
        mode: selectedMode,
        interest: selectedInterest,
      });
      setUsers(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscover();
  }, [selectedIntent, selectedRelationshipStyle, selectedMode, selectedInterest, maxDistance, minAge, maxAge]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDiscover();
  };

  const handleResetFilters = () => {
    setSearch('');
    setMinAge(18);
    setMaxAge(50);
    setMaxDistance(50);
    setSelectedIntent('all');
    setSelectedRelationshipStyle('all');
    setSelectedMode('all');
    setSelectedInterest('all');
  };

  const handleReveal = async (userId) => {
    try {
      await requestRevealApi(userId);
      revealUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, revealed: true } : u));
    } catch (e) {
      console.error(e);
    }
  };

  const hasActiveFilters = selectedIntent !== 'all' || selectedRelationshipStyle !== 'all' || selectedMode !== 'all' || selectedInterest !== 'all' || maxDistance < 50;

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, pseudonym, interests, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-touch pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20"
          />
        </form>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/app/map')}
            icon={MapPin}
            className="border-pink-500/30 hover:border-pink-500/60 text-pink-300"
          >
            <span className="hidden sm:inline">Map View</span>
            <span className="sm:hidden">Map</span>
          </Button>

          <Button
            variant={showFilterDrawer ? 'primary' : 'secondary'}
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            icon={SlidersHorizontal}
          >
            Filters {hasActiveFilters && '• Active'}
          </Button>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-gray-400 hover:text-white px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter Drawer / Panel */}
      {showFilterDrawer && (
        <div className="p-4 sm:p-6 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-5 animate-slide-up">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-pink-500" />
              <span>Fine-Tune Discovery Preferences</span>
            </h4>
            <button
              onClick={() => setShowFilterDrawer(false)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Age Range Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-300">
                <span>Age Range</span>
                <span className="text-pink-400">{minAge} - {maxAge} yrs</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="18"
                  max="60"
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
              </div>
            </div>

            {/* Distance Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-300">
                <span>Max Distance</span>
                <span className="text-pink-400">{maxDistance} miles</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>

            {/* Intent Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400">Connection Intent</label>
              <select
                value={selectedIntent}
                onChange={(e) => setSelectedIntent(e.target.value)}
                className="w-full min-h-touch px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 focus:outline-none focus:border-pink-500"
              >
                <option value="all">Any Intent</option>
                {INTENTS.map((i) => (
                  <option key={i.id} value={i.label}>{i.label}</option>
                ))}
              </select>
            </div>

            {/* Relationship Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400">Relationship Style</label>
              <select
                value={selectedRelationshipStyle}
                onChange={(e) => setSelectedRelationshipStyle(e.target.value)}
                className="w-full min-h-touch px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 focus:outline-none focus:border-pink-500"
              >
                <option value="all">Any Relationship Style</option>
                {RELATIONSHIP_STYLES.map((style) => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode Pill Toggle & Interests Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-800/60">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400">Display Mode</label>
              <div className="flex gap-2">
                {['all', 'public', 'stranger'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMode(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors min-h-[36px] ${
                      selectedMode === m
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {m === 'all' ? 'All Modes' : m + ' Only'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-gray-400">Filter by Specific Passion</label>
              <select
                value={selectedInterest}
                onChange={(e) => setSelectedInterest(e.target.value)}
                className="w-full min-h-touch px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-200 focus:outline-none focus:border-pink-500"
              >
                <option value="all">Any Passion / Hobby</option>
                {ALL_INTERESTS.map((interest) => (
                  <option key={interest} value={interest}>{interest}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Profile Cards */}
      {/* Responsiveness Rule: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : users.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((user) => (
            <ProfileCard
              key={user.id}
              user={{
                ...user,
                revealed: user.revealed || isUserRevealed(user.id),
              }}
              onReveal={handleReveal}
              showActions={false}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No profiles match your filters"
          description="Try broadening your age slider, expanding your radius, or resetting specific relationship tags."
          actionLabel="Reset All Filters"
          onAction={handleResetFilters}
        />
      )}
    </div>
  );
};

export default DiscoverPage;
