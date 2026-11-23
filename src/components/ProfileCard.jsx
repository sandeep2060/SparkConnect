import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, Sparkles, MapPin, Lock, Unlock } from 'lucide-react';
import VerificationBadge from './VerificationBadge';
import Badge from './Badge';
import Button from './Button';

export const ProfileCard = ({
  user,
  mode, // 'public' | 'stranger' override or from user
  onReveal,
  onLike,
  onPass,
  onSuperLike,
  showActions = true,
  className = '',
}) => {
  const navigate = useNavigate();

  if (!user) return null;

  // Determine if stranger mode is active for this card
  const isStranger = (mode === 'stranger' || user.mode === 'stranger') && !user.revealed;
  const displayName = isStranger ? (user.pseudonym || 'Mystery Member') : user.name;
  const displayAge = user.age;
  const displayPhoto = user.avatar || user.photos?.[0];

  const handleCardClick = (e) => {
    // If clicking an action button, don't navigate
    if (e.target.closest('button')) return;
    navigate(`/app/profile/${user.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`
        group relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 
        shadow-lg transition-all duration-300 hover:border-pink-500/40 hover:shadow-2xl 
        hover:shadow-pink-500/10 cursor-pointer flex flex-col
        ${className}
      `}
    >
      {/* Top Media Container */}
      <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-gray-950">
        <img
          src={displayPhoto}
          alt={displayName}
          className={`
            w-full h-full object-cover transition-transform duration-500 group-hover:scale-105
            ${isStranger ? 'blur-md brightness-75 scale-110' : ''}
          `}
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />

        {/* Badges Top Bar */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isStranger ? (
              <Badge variant="stranger" icon={Lock}>
                Mystery Profile
              </Badge>
            ) : (
              user.verified && (
                <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-sky-400/40 text-[11px] font-bold text-sky-300">
                  <VerificationBadge size="sm" />
                  <span>Verified</span>
                </div>
              )
            )}

            {user.intent && (
              <Badge variant="default" className="bg-gray-900/80 backdrop-blur-md text-[11px]">
                {user.intent}
              </Badge>
            )}
          </div>

          {user.distance !== undefined && (
            <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 text-[11px] text-gray-300">
              <MapPin className="w-3 h-3 text-pink-400" />
              <span>{user.distance} mi</span>
            </div>
          )}
        </div>

        {/* Stranger Overlay Center Callout */}
        {isStranger && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
            <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-purple-500/50 backdrop-blur-md flex items-center justify-center text-purple-300 shadow-xl mb-3 animate-pulse-subtle">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="text-white font-bold text-base drop-shadow-md">
              Stranger Mode Active
            </h4>
            <p className="text-xs text-purple-200/90 max-w-[200px] mt-1 mb-4 drop-shadow">
              Identity concealed until mutual reveal agreement
            </p>
            {onReveal && (
              <Button
                size="sm"
                variant="primary"
                icon={Unlock}
                onClick={(e) => {
                  e.stopPropagation();
                  onReveal(user.id);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-900/50"
              >
                Request Reveal
              </Button>
            )}
          </div>
        )}

        {/* Content at bottom of image */}
        <div className="absolute bottom-3 inset-x-3 z-10">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow">
              {displayName}
            </h3>
            {!isStranger && displayAge && (
              <span className="text-lg font-semibold text-gray-200 drop-shadow">
                {displayAge}
              </span>
            )}
            {!isStranger && user.username && (
              <span className="text-xs font-mono text-pink-300/90 font-medium drop-shadow bg-black/40 px-1.5 py-0.5 rounded">
                @{user.username}
              </span>
            )}
          </div>

          {user._searchMatch?.matchedReason && (
            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/40 border border-purple-400/50 backdrop-blur-md text-[10px] font-bold text-purple-200 drop-shadow">
              <Sparkles className="w-2.5 h-2.5 text-pink-300 shrink-0" />
              <span>{user._searchMatch.matchedReason}</span>
            </div>
          )}

          <p className="text-xs text-gray-300 line-clamp-2 mt-1 drop-shadow">
            {user.bio}
          </p>

          {/* Nature Traits & Interests Pill Row */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {user.nature && user.nature.slice(0, 2).map((trait) => (
              <span
                key={trait}
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-pink-500/25 backdrop-blur-sm border border-pink-500/40 text-pink-200"
              >
                {trait}
              </span>
            ))}
            {user.interests && user.interests.slice(0, 2).map((item) => (
              <span
                key={item}
                className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-gray-900/80 backdrop-blur-sm border border-white/10 text-gray-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      {showActions && (
        <div className="p-3 bg-gray-900/90 border-t border-gray-800/80 flex items-center justify-around gap-2">
          {onPass && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPass(user.id);
              }}
              className="w-12 h-12 rounded-2xl bg-gray-800 hover:bg-gray-700/80 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm min-h-touch min-w-touch"
              aria-label="Pass"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}

          {onSuperLike && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSuperLike(user.id);
              }}
              className="w-11 h-11 rounded-2xl bg-purple-950/80 hover:bg-purple-900 text-purple-400 hover:text-purple-300 border border-purple-500/30 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm min-h-touch min-w-touch"
              aria-label="Super Like"
            >
              <Sparkles className="w-5 h-5 fill-purple-400/20" />
            </button>
          )}

          {onLike && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLike(user.id);
              }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/30 min-h-touch min-w-touch"
              aria-label="Like"
            >
              <Heart className="w-6 h-6 fill-white stroke-[2]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
