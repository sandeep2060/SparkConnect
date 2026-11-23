import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Settings,
  Edit3,
  Share2,
  Grid,
  Lock,
  Heart,
  Bookmark,
  Eye,
  EyeOff,
  ShieldCheck,
  Camera,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  UserX,
  AlertTriangle,
  LogOut,
  Check,
  Copy,
  ChevronRight,
  Ban,
  UserPlus,
  Flame,
  ShieldAlert,
  Plus,
  Sliders,
  Shield,
  Bell,
  X,
  Volume2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import {
  getBlockedUsersApi,
  unblockUserApi,
  getPendingFriendRequestsApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
} from '../api/social';
import { updateUserProfileApi } from '../api/users';
import VerificationBadge from '../components/VerificationBadge';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export const MyProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuthStore();
  const { mode, setMode, ghostMode, setGhostMode } = useProfileStore();

  // TikTok Content Tabs: 'photos' | 'vault' | 'liked' | 'saved'
  const [activeTab, setActiveTab] = useState('photos');

  // Copied toast state
  const [copyToast, setCopyToast] = useState(false);

  // Settings & Management Drawers / Modals
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);

  // Social data from Neon Postgres
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoadingSocial, setIsLoadingSocial] = useState(true);

  // Quick settings inline toggles
  const [readReceipts, setReadReceipts] = useState(true);
  const [showActiveStatus, setShowActiveStatus] = useState(true);

  // Selected photo for modal viewer
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Confirm dialog for unblock & decline actions
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    variant: 'unblock',
    title: '',
    message: '',
    confirmLabel: '',
    action: null,
  });

  const openConfirm = (cfg) => setConfirmDialog({ isOpen: true, ...cfg });
  const closeConfirm = () => setConfirmDialog((prev) => ({ ...prev, isOpen: false, action: null }));

  // Load social stats
  useEffect(() => {
    const loadSocial = async () => {
      setIsLoadingSocial(true);
      try {
        const [blockedList, requestsList] = await Promise.all([
          getBlockedUsersApi(),
          getPendingFriendRequestsApi(),
        ]);
        setBlockedUsers(blockedList);
        setPendingRequests(requestsList);
      } catch (err) {
        console.error('Error loading social stats:', err);
      } finally {
        setIsLoadingSocial(false);
      }
    };
    loadSocial();
  }, []);

  const handleCopyUsername = () => {
    const username = user?.username || 'spark_member';
    navigator.clipboard.writeText(`https://sparkconnect.dev/@${username}`);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  const handleModeToggle = async () => {
    const nextMode = mode === 'public' ? 'stranger' : 'public';
    setMode(nextMode);
    updateProfile({ mode: nextMode });
    try {
      await updateUserProfileApi({ id: user?.id, mode: nextMode });
    } catch (e) {
      console.error(e);
    }
  };

  const handleGhostToggle = () => {
    setGhostMode(!ghostMode);
  };

  const handleUnblock = (id, name) => {
    openConfirm({
      variant: 'unblock',
      title: `Unblock ${name || 'this member'}?`,
      message: `${name || 'This member'} will be able to see your profile and send you messages again.`,
      confirmLabel: 'Yes, Unblock',
      action: async () => {
        try {
          await unblockUserApi(id);
          setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
        } catch (e) {
          console.error(e);
        }
      },
    });
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await acceptFriendRequestApi(userId);
      setPendingRequests((prev) => prev.filter((r) => r.sender.id !== userId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeclineRequest = (userId, name) => {
    openConfirm({
      variant: 'decline',
      title: 'Decline Request?',
      message: `Decline ${name || 'this'}'s friend request? They won't be notified.`,
      confirmLabel: 'Decline',
      action: async () => {
        try {
          await rejectFriendRequestApi(userId);
          setPendingRequests((prev) => prev.filter((r) => r.sender.id !== userId));
        } catch (e) {
          console.error(e);
        }
      },
    });
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
    logout();
    navigate('/login');
  };

  const displayName = user?.name || user?.displayName || 'Spark Member';
  const username = user?.username || (user?.email ? user.email.split('@')[0] : 'member');
  const avatar =
    user?.avatar ||
    user?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';

  // Sample TikTok photos grid
  const userPhotos = [
    {
      id: 1,
      url: avatar,
      likes: '1.4k',
      caption: 'Golden hour vibes ✨',
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      likes: '892',
      caption: 'Rooftop night out in the city 🌃',
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
      likes: '645',
      caption: 'Coffee and acoustic sessions ☕🎸',
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      likes: '430',
      caption: 'Weekend hiking getaway 🌲',
    },
  ];

  // Sample Private media vault items (TikTok-style locked view)
  const privateVaultItems = [
    {
      id: 'v1',
      title: 'Secret Photo 1x View',
      viewsLeft: 1,
      locked: true,
      url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'v2',
      title: 'Protected Date Snapshot',
      viewsLeft: 2,
      locked: true,
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-16 animate-fade-in">
      {/* 1. TOP TIKTOK HEADER BAR */}
      <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-gray-800/80 sticky top-0 bg-gray-950/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
            <span>@{username}</span>
            {user?.verified && <VerificationBadge size="sm" />}
          </span>
          {mode === 'stranger' && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>Incognito</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Share Profile button */}
          <button
            onClick={handleCopyUsername}
            className="p-2 rounded-full bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors cursor-pointer"
            title="Share Profile Link"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Settings Shortcut button */}
          <button
            onClick={() => navigate('/app/settings')}
            className="p-2 rounded-full bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-pink-400 border border-gray-800 transition-colors cursor-pointer"
            title="Settings & Privacy"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Copy Toast Alert */}
      {copyToast && (
        <div className="fixed top-16 inset-x-0 mx-auto w-max z-50 px-4 py-2 rounded-full bg-pink-600 text-white text-xs font-bold shadow-2xl flex items-center gap-1.5 animate-slide-down">
          <Check className="w-4 h-4" />
          <span>Profile link copied to clipboard!</span>
        </div>
      )}

      {/* 2. TIKTOK AVATAR HERO & BASIC INFO */}
      <div className="text-center space-y-3">
        {/* Avatar with Camera badge */}
        <div className="relative inline-block mx-auto">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 shadow-xl shadow-pink-500/20">
            <img
              src={avatar}
              alt={displayName}
              className="w-full h-full object-cover rounded-full bg-gray-900"
            />
          </div>
          <button
            onClick={() => navigate('/app/profile/edit')}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg border-2 border-gray-950 transition-all hover:scale-110 cursor-pointer"
            title="Change Avatar / Edit Profile"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Display Name & Verification */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>{displayName}</span>
            {user?.verified && <VerificationBadge size="md" />}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1 text-xs text-gray-400">
            <span className="font-mono text-pink-400 font-semibold cursor-pointer" onClick={handleCopyUsername}>
              @{username}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-gray-300">
              <MapPin className="w-3 h-3 text-pink-400" />
              <span>{user?.location || 'San Francisco, CA'}</span>
            </span>
          </div>
        </div>

        {/* 3. TIKTOK STATS COUNTER ROW */}
        <div className="flex items-center justify-center gap-8 py-2">
          <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
            <div className="text-base sm:text-lg font-black text-white tracking-tight">24</div>
            <div className="text-[11px] font-semibold text-gray-400">Following</div>
          </div>
          <div
            onClick={() => setIsRequestsModalOpen(true)}
            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="text-base sm:text-lg font-black text-white tracking-tight">
              {186 + (pendingRequests?.length || 0)}
            </div>
            <div className="text-[11px] font-semibold text-gray-400">Friends</div>
          </div>
          <div className="text-center cursor-pointer hover:opacity-80 transition-opacity">
            <div className="text-base sm:text-lg font-black text-white tracking-tight">1.4K</div>
            <div className="text-[11px] font-semibold text-gray-400">Sparks</div>
          </div>
        </div>

        {/* 4. PRIMARY ACTION BUTTONS */}
        <div className="flex items-center justify-center gap-2.5 max-w-sm mx-auto px-4">
          <Button
            variant="primary"
            size="md"
            icon={Edit3}
            onClick={() => navigate('/app/profile/edit')}
            className="flex-1 font-bold shadow-lg shadow-pink-500/20"
          >
            Edit Profile
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={Share2}
            onClick={handleCopyUsername}
            className="flex-1 font-semibold"
          >
            Share
          </Button>

          <button
            onClick={() => navigate('/app/settings')}
            className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors cursor-pointer"
            title="All Settings & Privacy"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* 5. BIO & TRAITS */}
        <div className="max-w-md mx-auto px-4 space-y-2.5 pt-2">
          {user?.bio ? (
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line text-center">
              {user.bio}
            </p>
          ) : (
            <p className="text-xs text-gray-500 italic">
              Tap Edit Profile to write your bio and spark chemistry ✨
            </p>
          )}

          {/* Nature Vibes Tags */}
          {user?.nature && user.nature.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {user.nature.map((trait) => (
                <span
                  key={trait}
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-pink-950/40 border border-pink-500/30 text-pink-300 shadow-sm"
                >
                  {trait}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. TIKTOK TABS NAVIGATION */}
      <div className="border-t border-b border-gray-800 bg-gray-950/60 flex items-center justify-around text-xs font-bold">
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'photos'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Photos</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'vault'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Private Vault</span>
        </button>

        <button
          onClick={() => setActiveTab('liked')}
          className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'liked'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Liked</span>
        </button>

        <button
          onClick={() => setActiveTab('settings_sub')}
          className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'settings_sub'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Controls</span>
        </button>
      </div>

      {/* 7. TAB CONTENT AREA */}
      <div>
        {/* TAB 1: TIKTOK 3-COLUMN PHOTO GRID */}
        {activeTab === 'photos' && (
          <div className="grid grid-cols-3 gap-1 sm:gap-2 px-1">
            {userPhotos.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedPhoto(item)}
                className="relative aspect-[3/4] bg-gray-900 rounded-xl overflow-hidden group cursor-pointer"
              >
                <img
                  src={item.url}
                  alt={item.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-white drop-shadow">
                    <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                    <span>{item.likes}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Photo Tile */}
            <div
              onClick={() => navigate('/app/profile/edit')}
              className="aspect-[3/4] bg-gray-900/60 border border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center p-3 text-center text-gray-400 hover:text-pink-400 hover:border-pink-500/40 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mb-1">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold">Add Photo</span>
            </div>
          </div>
        )}

        {/* TAB 2: PRIVATE MEDIA VAULT (ANTI-SCREENSHOT) */}
        {activeTab === 'vault' && (
          <div className="space-y-3 px-2">
            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white">Private Ephemeral Vault</h4>
                <p className="text-[11px] text-purple-300/80">
                  Protected media with screenshot blocking. You choose how many views recipients get.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {privateVaultItems.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-2xl bg-gray-900 border border-gray-800 space-y-2 relative"
                >
                  <div className="aspect-square rounded-xl bg-gray-950 overflow-hidden relative">
                    <img
                      src={v.url}
                      alt={v.title}
                      className="w-full h-full object-cover blur-md brightness-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-purple-300">
                      <Lock className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-white truncate">{v.title}</div>
                  <div className="text-[10px] text-gray-400">
                    Remaining Views: <span className="text-pink-400 font-bold">{v.viewsLeft}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LIKED SPARKS */}
        {activeTab === 'liked' && (
          <div className="p-8 text-center space-y-3 bg-gray-900/40 rounded-2xl border border-gray-800/80 mx-2">
            <div className="w-12 h-12 rounded-2xl bg-pink-950/60 border border-pink-500/30 flex items-center justify-center text-pink-400 mx-auto">
              <Heart className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Liked Profiles & Sparks</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Profiles and snaps you sparked with on the Match Feed appear here privately.
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/app')}>
              Browse Feed
            </Button>
          </div>
        )}

        {/* TAB 4: CONTROLS & SETTINGS (Implemented directly under the profile page!) */}
        {activeTab === 'settings_sub' && (
          <div className="space-y-4 px-2 animate-fade-in">
            {/* PRIVACY & GHOST MODE */}
            <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Privacy Protocols
                  </span>
                </div>
                <Link
                  to="/app/settings"
                  className="text-[11px] font-bold text-pink-400 hover:underline flex items-center gap-0.5"
                >
                  <span>All Settings</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Stranger Mode Toggle */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-gray-200">Stranger (Incognito) Mode</div>
                  <div className="text-[10px] text-gray-400">
                    Hides photo with blur and protects identity using your pseudonym
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleModeToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    mode === 'stranger' ? 'bg-purple-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      mode === 'stranger' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Ghost Map Location Toggle */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-gray-200">Ghost Mode (Map Hidden)</div>
                  <div className="text-[10px] text-gray-400">
                    Disables your live pin on the Snapchat-style Spark Map
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGhostToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    ghostMode ? 'bg-pink-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      ghostMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Read Receipts Toggle */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-gray-200">Read Receipts (Seen Status)</div>
                  <div className="text-[10px] text-gray-400">
                    Shows friends when you have opened their chat messages
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReadReceipts(!readReceipts)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    readReceipts ? 'bg-pink-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      readReceipts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* ACCOUNT & VERIFICATION DETAILS */}
            <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-800 text-xs font-bold text-white uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Account & Safety</span>
              </div>

              {/* Phone & Email Row */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950 border border-gray-800/80">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-pink-400" />
                    <div>
                      <div className="text-[10px] text-gray-400">Registered Phone</div>
                      <div className="font-bold text-gray-200">
                        {user?.phone || user?.phoneNumber || '+1 (555) 019-2834'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/app/profile/edit')}
                    className="text-[10px] font-bold text-pink-400 hover:underline"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950 border border-gray-800/80">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <div>
                      <div className="text-[10px] text-gray-400">Registered Email</div>
                      <div className="font-bold text-gray-200">{user?.email || 'member@sparkconnect.dev'}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">Verified ✓</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950 border border-gray-800/80">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <div>
                      <div className="text-[10px] text-gray-400">18+ Identity Verification</div>
                      <div className="font-bold text-gray-200 capitalize">
                        {user?.verified ? 'ID Verified ✓' : user?.verificationStatus || 'Pending Review'}
                      </div>
                    </div>
                  </div>
                  {!user?.verified && (
                    <Link
                      to="/verify-id"
                      className="text-[10px] font-bold text-sky-400 hover:underline"
                    >
                      Verify Now
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* SOCIAL MANAGEMENT: BLOCKED USERS & FRIEND REQUESTS */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsRequestsModalOpen(true)}
                className="p-3.5 rounded-2xl bg-gray-900 hover:bg-gray-850 border border-gray-800 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <UserPlus className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-500/40 text-[10px] font-bold text-purple-300 flex items-center justify-center">
                    {pendingRequests?.length || 0}
                  </span>
                </div>
                <div className="font-bold text-white">Friend Requests</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Manage incoming requests</div>
              </button>

              <button
                type="button"
                onClick={() => setIsBlockedModalOpen(true)}
                className="p-3.5 rounded-2xl bg-gray-900 hover:bg-gray-850 border border-gray-800 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <Ban className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span className="w-5 h-5 rounded-full bg-rose-950 border border-rose-500/40 text-[10px] font-bold text-rose-300 flex items-center justify-center">
                    {blockedUsers?.length || 0}
                  </span>
                </div>
                <div className="font-bold text-white">Blocked List</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Manage blocked members</div>
              </button>
            </div>

            {/* SIGN OUT BUTTON */}
            <div className="pt-2">
              <Button
                variant="danger"
                size="md"
                icon={LogOut}
                onClick={() => setIsSignOutModalOpen(true)}
                className="w-full font-bold shadow-lg shadow-rose-950/40"
              >
                Sign Out of SparkConnect
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 8. PHOTO PREVIEW LIGHTBOX MODAL */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-md w-full bg-gray-950 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl space-y-3">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="aspect-[3/4] overflow-hidden bg-black">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{displayName}</span>
                <span className="text-xs font-bold text-pink-400 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-pink-500" />
                  <span>{selectedPhoto.likes}</span>
                </span>
              </div>
              <p className="text-xs text-gray-300">{selectedPhoto.caption}</p>
            </div>
          </div>
        </div>
      )}

      {/* 9. BLOCKED USERS MANAGEMENT MODAL */}
      <Modal
        isOpen={isBlockedModalOpen}
        onClose={() => setIsBlockedModalOpen(false)}
        title="Blocked Members"
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            Blocked accounts cannot view your profile, see your map pin, or send you messages.
          </p>

          {blockedUsers.length > 0 ? (
            <div className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
              {blockedUsers.map((b) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={b.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={b.user?.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{b.user?.name || 'Blocked User'}</div>
                      <div className="text-[10px] text-gray-400">{b.reason || 'Safety block'}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(b.id, b.user?.name)}
                    className="px-2.5 py-1 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 cursor-pointer"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-500">
              No accounts blocked currently.
            </div>
          )}
        </div>
      </Modal>

      {/* 10. FRIEND REQUESTS REVIEW MODAL */}
      <Modal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        title="Friend Requests"
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            Accepting requests creates a mutual friendship and enables Snapstreaks 🔥
          </p>

          {pendingRequests.length > 0 ? (
            <div className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
              {pendingRequests.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={r.sender?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}
                      alt={r.sender?.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{r.sender?.name || 'New Member'}</div>
                      <div className="text-[10px] text-gray-400">Wants to be friends</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAcceptRequest(r.sender.id)}
                      className="px-3 py-1 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(r.sender.id, r.sender.name)}
                      className="px-2 py-1 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-500">
              No pending requests right now.
            </div>
          )}
        </div>
      </Modal>

      {/* 11. SIGN OUT CONFIRMATION MODAL */}
      <Modal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        title="Sign Out of SparkConnect?"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-300">
            Are you sure you want to sign out? You will need your email or phone number to sign back in.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSignOutModalOpen(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={LogOut}
              onClick={handleSignOut}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Signing out...' : 'Yes, Sign Out'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Universal Confirm Dialog for unblock & decline actions */}
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
      />
    </div>
  );
};

export default MyProfilePage;
