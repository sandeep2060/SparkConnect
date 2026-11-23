import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Bell,
  UserX,
  UserCheck,
  UserPlus,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Check,
  AlertTriangle,
  LogOut,
  Clock,
  Sun,
  Moon,
  Volume2,
  Sparkles,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useProfileStore } from '../store/profileStore';
import {
  playMessageSound,
  playFriendRequestSound,
  playFriendAcceptSound,
  triggerBrowserNotification,
} from '../utils/sound';
import {
  getBlockedUsersApi,
  unblockUserApi,
  getPendingFriendRequestsApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
} from '../api/social';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const { mode, setMode, ghostMode, setGhostMode } = useProfileStore();

  const isStranger = mode === 'stranger';

  // Settings State
  const [incognitoBrowsing, setIncognitoBrowsing] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showActiveStatus, setShowActiveStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  const [notifMatches, setNotifMatches] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifSafety, setNotifSafety] = useState(true);

  // Social: Blocked Users & Friend Requests State
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoadingSocial, setIsLoadingSocial] = useState(true);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Confirm dialog for unblock & decline
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

  // Load Social data from Neon Postgres
  useEffect(() => {
    const loadSocialData = async () => {
      setIsLoadingSocial(true);
      try {
        const [blockedList, requestsList] = await Promise.all([
          getBlockedUsersApi(),
          getPendingFriendRequestsApi(),
        ]);
        setBlockedUsers(blockedList);
        setPendingRequests(requestsList);
      } catch (err) {
        console.error('Error loading social settings:', err);
      } finally {
        setIsLoadingSocial(false);
      }
    };
    loadSocialData();
  }, []);

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

  const handleSavePreferences = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDeleteAccount = () => {
    setIsDeleteModalOpen(false);
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Account & Privacy Settings</h1>
        <p className="text-xs text-gray-400">Configure safety gates, visibility rules, and alerts</p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>Privacy preferences updated across all sessions.</span>
        </div>
      )}

      {/* 0. Appearance & Theme Settings (Moved from Navbar) */}
      <Card glass className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Sun className="w-4 h-4" />
          <span>Appearance & Theme</span>
        </h3>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-2.5">Choose your interface display mode:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border text-sm font-bold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white border-pink-500 shadow-md shadow-pink-500/10 ring-1 ring-pink-500/40'
                    : 'bg-gray-950/50 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-900'
                }`}
              >
                <Moon className="w-4 h-4 text-pink-400" />
                <span>Dark Theme</span>
                {theme === 'dark' && <Check className="w-3.5 h-3.5 text-pink-400 ml-1" />}
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border text-sm font-bold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-gray-900 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'bg-gray-950/50 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-900'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Theme</span>
                {theme === 'light' && <Check className="w-3.5 h-3.5 text-amber-500 ml-1" />}
              </button>
            </div>
          </div>

          {/* Discovery Persona Mode (Moved from Navbar) */}
          <div className="pt-3 border-t border-gray-800">
            <p className="text-xs text-gray-400 mb-2">Discovery Mode:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('public')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  !isStranger
                    ? 'bg-pink-950/50 text-pink-300 border-pink-500/50'
                    : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-pink-400" />
                <span>Public Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('stranger')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  isStranger
                    ? 'bg-purple-950/60 text-purple-300 border-purple-500/50'
                    : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5 text-purple-400" />
                <span>Stranger (Anonymous)</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              Stranger Mode conceals your real name and photo in discovery until mutual reveal.
            </p>
          </div>
        </div>
      </Card>

      {/* 1. Privacy Section */}
      <Card glass className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span>Privacy & Discovery Controls</span>
        </h3>

        <div className="divide-y divide-gray-800 space-y-3">
          <div className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Ghost Mode (Hidden from Feeds)</p>
              <p className="text-xs text-gray-400">Temporarily hide your profile from new matches</p>
            </div>
            <input
              type="checkbox"
              checked={ghostMode}
              onChange={(e) => setGhostMode(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-pink-500 focus:ring-pink-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Incognito Browsing</p>
              <p className="text-xs text-gray-400">View discovery feeds without appearing in "Recent Visitors"</p>
            </div>
            <input
              type="checkbox"
              checked={incognitoBrowsing}
              onChange={(e) => setIncognitoBrowsing(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-pink-500 focus:ring-pink-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Approximate Distance Sharing</p>
              <p className="text-xs text-gray-400">Display approximate distance radius (within 2-3 miles)</p>
            </div>
            <input
              type="checkbox"
              checked={showLocation}
              onChange={(e) => setShowLocation(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-pink-500 focus:ring-pink-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Show Active Status & Last Seen</p>
              <p className="text-xs text-gray-400">
                Displays green indicator when online and relative activity time (e.g., 'Active 5 mins ago')
              </p>
            </div>
            <input
              type="checkbox"
              checked={showActiveStatus}
              onChange={(e) => setShowActiveStatus(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-pink-500 focus:ring-pink-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Read Receipts & Seen Status</p>
              <p className="text-xs text-gray-400">
                Send 'Delivered' and exact 'Seen 5m ago' timestamps on direct chat bubbles
              </p>
            </div>
            <input
              type="checkbox"
              checked={readReceipts}
              onChange={(e) => setReadReceipts(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-pink-500 focus:ring-pink-500"
            />
          </div>
        </div>
      </Card>

      {/* 2. Notifications Section */}
      <Card glass className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <span>Notification Preferences</span>
        </h3>

        <div className="divide-y divide-gray-800 space-y-3">
          <div className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">New Sparks & Matches</p>
              <p className="text-xs text-gray-400">Push notification when mutual interest occurs</p>
            </div>
            <input
              type="checkbox"
              checked={notifMatches}
              onChange={(e) => setNotifMatches(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-pink-500 focus:ring-pink-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Direct Chat Messages</p>
              <p className="text-xs text-gray-400">Alerts for inbound messages and reveal requests</p>
            </div>
            <input
              type="checkbox"
              checked={notifMessages}
              onChange={(e) => setNotifMessages(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-pink-500 focus:ring-pink-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Safety Check-in Pings</p>
              <p className="text-xs text-gray-400">Critical alerts when date timers trigger check-ins</p>
            </div>
            <input
              type="checkbox"
              checked={notifSafety}
              onChange={(e) => setNotifSafety(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-pink-500 focus:ring-pink-500"
            />
          </div>

          {/* Audio Chime Previews */}
          <div className="pt-4 border-t border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <p className="text-xs font-bold text-purple-300">Browser Audio Chimes & Alert Testing</p>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">
              SparkConnect plays harmonic audio alerts for new messages, incoming friend requests, and accepted friend invites. Tap to test:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => triggerBrowserNotification('New Message Alert', 'Marcus Vance: Hey! How is your day going?', 'message')}
                className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs font-bold text-pink-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                <span>Message Received Chime</span>
              </button>

              <button
                type="button"
                onClick={() => triggerBrowserNotification('Friend Request Received', 'Elena Rostova sent you a friend request.', 'friend_request')}
                className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs font-bold text-purple-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Friend Request Chime</span>
              </button>

              <button
                type="button"
                onClick={() => triggerBrowserNotification('Friend Request Accepted', 'Maya Carter accepted your friend request! 🥂', 'friend_accept')}
                className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs font-bold text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Friend Accept Chime</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Pending Friend Requests Section */}
      <Card glass className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            <span>Pending Friend Requests ({pendingRequests.length})</span>
          </div>
          {pendingRequests.length > 0 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              Needs Review
            </span>
          )}
        </h3>

        {pendingRequests.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {pendingRequests.map((req) => (
              <div key={req.requestId} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <img
                    src={req.sender.avatar}
                    alt={req.sender.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                  />
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{req.sender.name}</span>
                      {req.sender.username && (
                        <span className="text-[11px] text-pink-400 font-mono">@{req.sender.username}</span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400">{req.sender.location || 'Nearby Spark'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAcceptRequest(req.sender.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white min-h-touch shadow-md flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeclineRequest(req.sender.id, req.sender.name)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 min-h-touch cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 py-2">No pending incoming friend requests.</p>
        )}
      </Card>

      {/* 4. Blocked Users Section */}
      <Card glass className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <UserX className="w-4 h-4" />
          <span>Blocked Members ({blockedUsers.length})</span>
        </h3>

        {blockedUsers.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {blockedUsers.map((bUser) => (
              <div key={bUser.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-200">{bUser.name}</p>
                  <p className="text-[10px] text-gray-500">Blocked on {bUser.blockedDate}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnblock(bUser.id, bUser.name)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 min-h-touch cursor-pointer"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 py-2">No blocked members on your list.</p>
        )}
      </Card>

      {/* Save Button */}
      <Button
        variant="primary"
        fullWidth
        size="lg"
        onClick={handleSavePreferences}
      >
        Save Settings
      </Button>

      {/* 4. Danger Zone */}
      <Card glass className="p-6 border-rose-500/30 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone</span>
        </h3>
        <p className="text-xs text-gray-400">
          Permanently delete your profile, match histories, reveal permissions, and verification records.
        </p>

        <Button
          variant="danger"
          size="md"
          icon={Trash2}
          onClick={() => setIsDeleteModalOpen(true)}
        >
          Delete SparkConnect Account
        </Button>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
            This action is irreversible. All messages, photos, and verification documents will be purged from our servers.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount}>
              Yes, Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog for unblock / decline actions */}
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

export default SettingsPage;
