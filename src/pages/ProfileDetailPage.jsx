import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Heart,
  MessageCircle,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
  Calendar,
  Sparkles,
  CheckCircle,
  UserPlus,
  UserCheck,
  UserX,
  UserMinus,
  Clock,
  ShieldAlert,
  Ban,
  Check,
  LogOut,
  Flame,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getUserByIdApi, requestRevealApi, likeUserApi } from '../api/users';
import {
  getRelationshipStatusApi,
  sendFriendRequestApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
  unfriendApi,
  blockUserApi,
  unblockUserApi,
} from '../api/social';
import { useProfileStore } from '../store/profileStore';
import VerificationBadge from '../components/VerificationBadge';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ReportModal from '../components/ReportModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { playFriendRequestSound, playFriendAcceptSound } from '../utils/sound';

export const ProfileDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuthStore();
  const { revealUser, isUserRevealed } = useProfileStore();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isSelf = id === 'me' || user?.id === currentUser?.id || (currentUser?.username && user?.username === currentUser?.username);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
    logout();
    navigate('/login');
  };

  // Social Relationship State (Friendships & Blocks)
  const [relationship, setRelationship] = useState({
    isBlocked: false,
    blockedByMe: false,
    friendshipStatus: 'none', // 'none' | 'pending_sent' | 'pending_received' | 'friends'
  });
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('Inappropriate behavior');

  // Confirm dialogs state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    variant: 'block', // 'block' | 'unblock' | 'unfriend' | 'decline'
    action: null,     // fn to call on confirm
    title: '',
    message: '',
    confirmLabel: '',
  });

  const openConfirm = ({ variant, title, message, confirmLabel, action }) => {
    setConfirmDialog({ isOpen: true, variant, title, message, confirmLabel, action });
  };
  const closeConfirm = () => setConfirmDialog((prev) => ({ ...prev, isOpen: false, action: null }));

  useEffect(() => {
    const loadUserAndSocial = async () => {
      setIsLoading(true);
      try {
        const [userData, relData] = await Promise.all([
          getUserByIdApi(id),
          getRelationshipStatusApi(id),
        ]);
        setUser(userData);
        setRelationship(relData);
      } catch (err) {
        console.error('Error loading user profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserAndSocial();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 animate-pulse space-y-6">
        <div className="h-96 bg-gray-900 rounded-3xl" />
        <div className="h-8 w-1/2 bg-gray-800 rounded-lg" />
        <div className="h-4 w-3/4 bg-gray-800 rounded" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16 space-y-4">
        <h3 className="text-lg font-bold text-white">Member not found</h3>
        <Button variant="ghost" onClick={() => navigate(-1)} icon={ArrowLeft}>
          Go Back
        </Button>
      </div>
    );
  }

  const isStranger = user.mode === 'stranger' && !user.revealed && !isUserRevealed(user.id);
  const displayName = isStranger ? user.pseudonym : user.name;
  const photos = user.photos || [user.avatar];

  const handleReveal = async () => {
    try {
      await requestRevealApi(user.id);
      revealUser(user.id);
      setUser((prev) => ({ ...prev, revealed: true }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async () => {
    try {
      const res = await likeUserApi(user.id);
      setIsLiked(true);
      if (res?.isMatch) {
        playFriendAcceptSound();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartChat = () => {
    navigate(`/app/chats/${user.id}`);
  };

  // Friend Request Handlers
  const handleSendFriendRequest = async () => {
    setIsSocialLoading(true);
    try {
      await sendFriendRequestApi(user.id);
      playFriendRequestSound();
      setRelationship((prev) => ({ ...prev, friendshipStatus: 'pending_sent' }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    setIsSocialLoading(true);
    try {
      const res = await acceptFriendRequestApi(user.id);
      playFriendAcceptSound();
      setRelationship((prev) => ({ ...prev, friendshipStatus: 'friends' }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleDeclineOrCancelRequest = async () => {
    openConfirm({
      variant: 'decline',
      title: relationship.friendshipStatus === 'pending_sent'
        ? 'Cancel Friend Request?'
        : 'Decline Friend Request?',
      message: relationship.friendshipStatus === 'pending_sent'
        ? `Cancel the friend request you sent to ${displayName}?`
        : `Decline ${displayName}'s friend request? They won't be notified.`,
      confirmLabel: relationship.friendshipStatus === 'pending_sent' ? 'Cancel Request' : 'Decline',
      action: async () => {
        setIsSocialLoading(true);
        try {
          await rejectFriendRequestApi(user.id);
          setRelationship((prev) => ({ ...prev, friendshipStatus: 'none' }));
        } catch (e) {
          console.error(e);
        } finally {
          setIsSocialLoading(false);
        }
      },
    });
  };

  const handleUnfriend = async () => {
    openConfirm({
      variant: 'unfriend',
      title: `Remove ${displayName}?`,
      message: `You and ${displayName} will no longer be friends. You can still send them a new friend request later.`,
      confirmLabel: 'Remove Friend',
      action: async () => {
        setIsSocialLoading(true);
        try {
          await unfriendApi(user.id);
          setRelationship((prev) => ({ ...prev, friendshipStatus: 'none' }));
        } catch (e) {
          console.error(e);
        } finally {
          setIsSocialLoading(false);
        }
      },
    });
  };

  // Block / Unblock Handlers
  const handleBlockUser = async () => {
    openConfirm({
      variant: 'block',
      title: `Block ${displayName}?`,
      message: `${displayName} won't be able to message you, see your profile, or appear in your discovery feed. They won't know they've been blocked.`,
      confirmLabel: 'Block Member',
      action: async () => {
        setIsBlockModalOpen(false);
        setIsSocialLoading(true);
        try {
          await blockUserApi(user.id, blockReason);
          setRelationship({
            isBlocked: true,
            blockedByMe: true,
            friendshipStatus: 'none',
            requestId: null,
          });
        } catch (e) {
          console.error(e);
        } finally {
          setIsSocialLoading(false);
        }
      },
    });
  };

  const handleUnblockUser = async () => {
    openConfirm({
      variant: 'unblock',
      title: `Unblock ${displayName}?`,
      message: `Unblocking ${displayName} will allow them to see your profile and message you again.`,
      confirmLabel: 'Yes, Unblock',
      action: async () => {
        setIsSocialLoading(true);
        try {
          await unblockUserApi(user.id);
          setRelationship((prev) => ({
            ...prev,
            isBlocked: false,
            blockedByMe: false,
          }));
        } catch (e) {
          console.error(e);
        } finally {
          setIsSocialLoading(false);
        }
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top Bar Nav */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 min-h-touch"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {isSelf ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/app/profile/edit')}
              className="flex items-center gap-1.5 text-xs font-bold text-pink-400 hover:text-white px-3 py-2 rounded-xl bg-pink-950/40 border border-pink-500/40 min-h-touch cursor-pointer transition-all"
            >
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => setIsSignOutModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-white px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-500/40 min-h-touch cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Block / Unblock Action Button */}
            {relationship.isBlocked ? (
              <button
                onClick={handleUnblockUser}
                disabled={isSocialLoading}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-500/40 min-h-touch cursor-pointer transition-all"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Unblock</span>
              </button>
            ) : (
              <button
                onClick={() => setIsBlockModalOpen(true)}
                disabled={isSocialLoading}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-rose-400 px-3 py-2 rounded-xl bg-gray-900 hover:bg-rose-950/30 border border-gray-800 hover:border-rose-500/30 min-h-touch cursor-pointer transition-all"
              >
                <Ban className="w-3.5 h-3.5 text-rose-500" />
                <span>Block</span>
              </button>
            )}

            {/* Report Button */}
            <button
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl bg-rose-950/20 border border-rose-500/20 min-h-touch"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report</span>
            </button>
          </div>
        )}
      </div>

      {/* Blocked Notice Banner */}
      {relationship.isBlocked && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center justify-between gap-3 animate-slide-down">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold">You have blocked {displayName}.</p>
              <p className="text-[11px] text-rose-300/80">
                They cannot see you on the Map or Feed, and neither of you can send messages.
              </p>
            </div>
          </div>
          <button
            onClick={handleUnblockUser}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs whitespace-nowrap shadow-md"
          >
            Unblock Now
          </button>
        </div>
      )}

      {/* Hero Media Card */}
      <div className="relative rounded-3xl overflow-hidden border border-gray-800 bg-gray-950 shadow-2xl">
        <div className="relative aspect-[3/4] sm:aspect-[4/3] overflow-hidden">
          <img
            src={photos[activePhotoIndex]}
            alt={displayName}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isStranger ? 'blur-xl scale-110 brightness-75' : 'blur-none'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />

          {/* Top badging */}
          <div className="absolute top-4 inset-x-4 flex justify-between items-center z-10">
            {isStranger ? (
              <Badge variant="stranger" icon={Lock}>
                Mystery Incognito
              </Badge>
            ) : (
              user.verified && (
                <div className="flex items-center gap-1.5 bg-gray-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-sky-400/40 text-xs font-bold text-sky-300">
                  <VerificationBadge size="sm" />
                  <span>ID Verified</span>
                </div>
              )
            )}

            <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-xs text-gray-200">
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              <span>{user.location || `${user.distance} mi away`}</span>
            </div>
          </div>

          {/* Locked Stranger Overlay Gate */}
          {isStranger && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-16 h-16 rounded-3xl bg-purple-950/80 border border-purple-500/40 backdrop-blur-md flex items-center justify-center text-purple-300 mb-3 shadow-2xl animate-pulse-subtle">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white drop-shadow">Stranger Mode Active</h3>
              <p className="text-xs text-purple-200 mt-1 mb-4 max-w-xs drop-shadow">
                This member's photos and real identity are protected. Request a mutual reveal to unveil their portrait.
              </p>
              <Button
                variant="primary"
                size="md"
                icon={Unlock}
                onClick={handleReveal}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                Request Profile Reveal
              </Button>
            </div>
          )}

          {/* Thumbnail pagination if multiple photos and unlocked */}
          {!isStranger && photos.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    activePhotoIndex === idx ? 'bg-pink-500 w-6' : 'bg-white/50 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Profile Details Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{displayName}</span>
                {!isStranger && <span className="text-xl font-normal text-gray-400">{user.age}</span>}
              </h1>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                {!isStranger && user.username && (
                  <span className="font-mono text-pink-400 font-semibold">@{user.username}</span>
                )}
                {!isStranger && user.username && <span>•</span>}
                <span>{user.gender || 'Adult Member'}</span>
                <span>•</span>
                <span>{user.location}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Friend Status Badge */}
              {relationship.friendshipStatus === 'friends' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Friends</span>
                </span>
              )}
              {relationship.streakCount > 0 && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center gap-1.5 shadow-sm"
                  title={`${relationship.streakCount} day Snapstreak with ${displayName}`}
                >
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
                  <span>{relationship.streakCount} Day Streak</span>
                </span>
              )}
              {relationship.friendshipStatus === 'pending_sent' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Request Sent</span>
                </span>
              )}

              {user.intent && (
                <Badge variant="primary" size="md">
                  {user.intent}
                </Badge>
              )}
            </div>
          </div>

          {/* Nature & Chemistry Vibes */}
          {user.nature && user.nature.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nature & Chemistry Traits</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {user.nature.map((trait) => (
                  <span
                    key={trait}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/15 to-purple-500/15 border border-pink-500/30 text-xs font-bold text-pink-300"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">About Me</h4>
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line bg-gray-900/60 p-4 rounded-2xl border border-gray-800">
              {user.bio}
            </p>
          </div>

          {/* Relationship Style & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-1">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Relationship Style</span>
              <p className="text-sm font-bold text-white">{user.relationshipStyle || 'Exploring Connections'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-1">
              <span className="text-[11px] font-semibold text-gray-400 uppercase">Profile Mode</span>
              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                {user.mode === 'stranger' ? 'Stranger (Pseudonym Protected)' : 'Public (Open & Verified)'}
              </p>
            </div>
          </div>

          {/* Interests Tags */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Interests & Vibes</h4>
            <div className="flex flex-wrap gap-2">
              {user.interests?.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Floating Action Bar with Friend / Unfriend / Chat / Like */}
          <div className="pt-4 border-t border-gray-800 flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Friend Request Action State */}
            {relationship.friendshipStatus === 'none' && !relationship.isBlocked && (
              <Button
                variant="secondary"
                size="lg"
                icon={UserPlus}
                onClick={handleSendFriendRequest}
                disabled={isSocialLoading}
                className="flex-1 border-purple-500/30 text-purple-300 hover:text-white"
              >
                Add Friend
              </Button>
            )}

            {relationship.friendshipStatus === 'pending_sent' && !relationship.isBlocked && (
              <Button
                variant="ghost"
                size="lg"
                icon={Clock}
                onClick={handleDeclineOrCancelRequest}
                disabled={isSocialLoading}
                className="flex-1 text-amber-300 border border-amber-500/30 hover:border-rose-500/40 hover:text-rose-400"
                title="Tap to cancel friend request"
              >
                Cancel Request
              </Button>
            )}

            {relationship.friendshipStatus === 'pending_received' && !relationship.isBlocked && (
              <div className="flex gap-2 flex-1">
                <Button
                  variant="primary"
                  size="lg"
                  icon={Check}
                  onClick={handleAcceptFriendRequest}
                  disabled={isSocialLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                >
                  Accept
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleDeclineOrCancelRequest}
                  disabled={isSocialLoading}
                  className="px-3"
                >
                  Decline
                </Button>
              </div>
            )}

            {relationship.friendshipStatus === 'friends' && !relationship.isBlocked && (
              <Button
                variant="secondary"
                size="lg"
                icon={UserMinus}
                onClick={handleUnfriend}
                disabled={isSocialLoading}
                className="flex-1 text-gray-300 hover:text-rose-400 hover:border-rose-500/40"
              >
                Unfriend
              </Button>
            )}

            {/* Like / Spark Action */}
            {!relationship.isBlocked && (
              <Button
                variant={isLiked ? 'secondary' : 'primary'}
                size="lg"
                className="flex-1"
                icon={Heart}
                onClick={handleLike}
              >
                {isLiked ? 'Spark Sent!' : 'Send Spark'}
              </Button>
            )}

            {/* Direct Chat Action */}
            {!relationship.isBlocked && (
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                icon={MessageCircle}
                onClick={handleStartChat}
              >
                Direct Chat
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Safety Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportedUser={user}
      />

      {/* Block Confirmation Modal */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title={`Block ${displayName}?`}
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
            Blocking this member will remove any existing friendships, hide your location from their map, and prevent them from contacting you.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Reason for blocking:</label>
            <select
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 focus:outline-none focus:border-rose-500"
            >
              <option value="Inappropriate behavior">Inappropriate or offensive behavior</option>
              <option value="Unwanted advances">Unwanted flirtation or spam</option>
              <option value="Fake profile">Suspected fake profile or bot</option>
              <option value="Privacy concern">Personal privacy preference</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsBlockModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleBlockUser} icon={Ban}>
              Confirm Block
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        title="Sign Out of SparkConnect"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Are you sure you want to sign out? You will need to log back in to access your profile and conversations.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsSignOutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              icon={LogOut}
              isLoading={isLoggingOut}
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>

      {/* Universal Confirm Dialog for block/unblock/unfriend/decline */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirm}
        onConfirm={async () => {
          closeConfirm();
          if (confirmDialog.action) await confirmDialog.action();
        }}
        variant={confirmDialog.variant}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isLoading={isSocialLoading}
      />
    </div>
  );
};

export default ProfileDetailPage;
