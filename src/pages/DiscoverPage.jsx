import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Filter, MapPin, Sparkles, Flame } from 'lucide-react';
import { getDiscoverUsersApi, requestRevealApi, likeUserApi } from '../api/users';
import ProfileCard from '../components/ProfileCard';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import CompatibilityModal from '../components/CompatibilityModal';
import SuperSparkModal from '../components/SuperSparkModal';
import { INTENTS, RELATIONSHIP_STYLES, ALL_INTERESTS } from '../utils/mockData';
import { useProfileStore } from '../store/profileStore';
import { useAuthStore } from '../store/authStore';
import { rankUsersByCompatibility } from '../utils/compatibilityAlgorithm';

export const DiscoverPage = () => {
  const navigate = useNavigate();
  const { revealUser, isUserRevealed } = useProfileStore();
  const currentUser = useAuthStore((s) => s.user);

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [sortByAffinity, setSortByAffinity] = useState(true);

  // Modals
  const [inspectingCompatibility, setInspectingCompatibility] = useState(null);
  const [superSparkTarget, setSuperSparkTarget] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(45);
  const [maxDistance, setMaxDistance] = useState(30);
  const [selectedIntent, setSelectedIntent] = useState('all');
  const [selectedRelationshipStyle, setSelectedRelationshipStyle] = useState('all');
  const [selectedMode, setSelectedMode] = useState('all');
  const [selectedInterest, setSelectedInterest] = useState('all');

  // Search & Spelling Suggestions Metadata
  const [searchMeta, setSearchMeta] = useState({
    isFuzzyFallback: false,
    suggestions: [],
    query: '',
    totalMatches: 0,
  });

  const fetchDiscover = async (customQuery = search) => {
    setIsLoading(true);
    try {
      const results = await getDiscoverUsersApi({
        search: customQuery,
        minAge,
        maxAge,
        maxDistance,
        intent: selectedIntent,
        relationshipStyle: selectedRelationshipStyle,
        mode: selectedMode,
        interest: selectedInterest,
      });

      let processed = results;
      if (sortByAffinity && (!customQuery || !customQuery.trim())) {
        processed = rankUsersByCompatibility(currentUser, results);
      }
      setUsers(processed);
      setSearchMeta({
        isFuzzyFallback: Boolean(results.isFuzzyFallback),
        suggestions: results.suggestions || [],
        query: customQuery,
        totalMatches: results.length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced real-time discovery search as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscover(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedIntent, selectedRelationshipStyle, selectedMode, selectedInterest, maxDistance, minAge, maxAge]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDiscover(search);
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
    setSearchMeta({
      isFuzzyFallback: false,
      suggestions: [],
      query: '',
      totalMatches: 0,
    });
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
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, @username, or related spellings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-touch pl-10 pr-10 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchDiscover('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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

        {/* Suggestion Chips when exact search has related candidates */}
        {search.trim() && !searchMeta.isFuzzyFallback && searchMeta.suggestions?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-1 text-xs animate-fade-in">
            <span className="text-gray-400 flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Related name spellings:</span>
            </span>
            {searchMeta.suggestions.map((suggestion) => {
              const cleanName = suggestion.replace(/^@/, '');
              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setSearch(cleanName);
                    fetchDiscover(cleanName);
                  }}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900 border border-gray-800 text-gray-300 hover:bg-pink-500/20 hover:text-pink-300 hover:border-pink-500/40 transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              );
            })}
          </div>
        )}
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

      {/* Flexible Fuzzy Fallback Banner when exact keyword has no direct matches */}
      {search.trim() && searchMeta.isFuzzyFallback && users.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-purple-900/40 to-pink-950/50 border border-purple-500/40 shadow-lg shadow-purple-950/30 animate-fade-in space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/25 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
                <Sparkles className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  No exact matches for <span className="text-pink-400 underline decoration-pink-500/40">"{searchMeta.query}"</span>
                </p>
                <p className="text-xs text-purple-200/90 mt-0.5">
                  Showing {users.length} member{users.length === 1 ? '' : 's'} with closely related name or handle spellings:
                </p>
              </div>
            </div>

            {searchMeta.suggestions?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300/80">
                  Did you mean:
                </span>
                {searchMeta.suggestions.map((suggestion) => {
                  const cleanName = suggestion.replace(/^@/, '');
                  return (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setSearch(cleanName);
                        fetchDiscover(cleanName);
                      }}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-600/30 text-purple-200 hover:bg-pink-500 hover:text-white border border-purple-400/40 hover:border-pink-500 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      {suggestion}
                    </button>
                  );
                })}
              </div>
            )}
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
              onInspectCompatibility={(u, comp) =>
                setInspectingCompatibility({ user: u, compatibility: comp })
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={search.trim() ? `No profiles found for "${search}"` : "No profiles match your filters"}
          description={
            search.trim()
              ? "We couldn't find any direct members or similar name spellings. Try checking for typos or searching by another name/username."
              : "Try broadening your age slider, expanding your radius, or resetting specific relationship tags."
          }
          actionLabel={search.trim() ? "Clear Search" : "Reset All Filters"}
          onAction={search.trim() ? () => { setSearch(''); fetchDiscover(''); } : handleResetFilters}
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
          onSend={async ({ targetUserId, note }) => {
            await likeUserApi(targetUserId, { isSuperSpark: true, note });
            navigate(`/app/chats/${targetUserId}`);
          }}
        />
      )}
    </div>
  );
};

export default DiscoverPage;
