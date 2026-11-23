import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, MapPin, Save, ShieldCheck, AtSign, Sparkles, LogOut, AlertCircle, Phone, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { updateUserProfileApi } from '../api/users';
import { RELATIONSHIP_STYLES, GENDERS } from '../utils/mockData';
import ModeToggle from '../components/ModeToggle';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import IntentChips from '../components/IntentChips';
import InterestGrid from '../components/InterestGrid';
import NatureChips from '../components/NatureChips';

export const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuthStore();
  const { mode, setMode } = useProfileStore();

  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
    logout();
    navigate('/login');
  };

  const [formData, setFormData] = useState({
    name: user?.name || user?.displayName || 'Alex Rivera',
    username: user?.username || 'alex_rivera',
    phone: user?.phone || user?.phoneNumber || '',
    gender: user?.gender || 'Non-binary',
    pseudonym: user?.pseudonym || 'MysticMirage',
    bio: user?.bio || '',
    location: user?.location || 'Manhattan, NY',
    relationshipStyle: user?.relationshipStyle || 'Open Relationship',
    hidePhoto: user?.hidePhoto || false,
    nature: user?.nature || ['Friendly', 'Playful', 'Sensual', 'Ambivert', 'Romantic'],
    intents: user?.intent ? [user.intent.toLowerCase()] : ['romance', 'exploring'],
    interests: user?.interests || ['Coffee & Cafes', 'Art & Galleries', 'Live Music'],
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleModeChange = (newMode) => {
    setMode(newMode);
    updateProfile({ mode: newMode });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    try {
      const updated = await updateUserProfileApi({
        ...formData,
        id: user?.id,
        mode,
      });
      updateProfile(updated);
      setSuccessMsg('Profile and nature traits updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNature = (traitLabel) => {
    const list = formData.nature || [];
    if (list.includes(traitLabel)) {
      setFormData({ ...formData, nature: list.filter((x) => x !== traitLabel) });
    } else {
      if (list.length < 6) {
        setFormData({ ...formData, nature: [...list, traitLabel] });
      }
    }
  };

  const toggleIntent = (id) => {
    const list = formData.intents;
    if (list.includes(id)) {
      setFormData({ ...formData, intents: list.filter((x) => x !== id) });
    } else {
      setFormData({ ...formData, intents: [...list, id] });
    }
  };

  const toggleInterest = (tag) => {
    const list = formData.interests;
    if (list.includes(tag)) {
      setFormData({ ...formData, interests: list.filter((x) => x !== tag) });
    } else {
      if (list.length < 5) {
        setFormData({ ...formData, interests: [...list, tag] });
      }
    }
  };

  const isStranger = mode === 'stranger';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/profile/me')}
            className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition-colors cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Edit Your Profile</h1>
            <p className="text-xs text-gray-400">Control your identity, nature, and anonymity preferences</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.verified && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-950/80 border border-sky-400/40 text-xs font-bold text-sky-300">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>ID Verified</span>
            </div>
          )}

          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={LogOut}
            onClick={() => setIsSignOutModalOpen(true)}
            className="font-bold shadow-md shadow-rose-950/40"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* PROMINENT DUAL MODE SWITCH */}
      <Card glass className="p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
          Discovery Mode Protocol
        </h3>
        <ModeToggle mode={mode} onChange={handleModeChange} showDescription={true} />
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar Photo Section */}
        <Card glass className="p-6 text-center space-y-4">
          <div className="relative inline-block mx-auto">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-pink-500/50 shadow-xl bg-gray-900 mx-auto">
              <img
                src={formData.avatar}
                alt="Profile Avatar"
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isStranger && formData.hidePhoto ? 'blur-lg scale-110' : ''
                }`}
              />
            </div>

            <label className="absolute bottom-0 right-0 p-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white cursor-pointer hover:scale-105 shadow-md">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, avatar: URL.createObjectURL(file) });
                  }
                }}
              />
            </label>
          </div>

          <div className="text-xs text-gray-400">
            {isStranger ? (
              <span className="text-purple-300 font-medium">
                Photo preview: {formData.hidePhoto ? 'Blurred to strangers' : 'Visible upon mutual reveal'}
              </span>
            ) : (
              <span>Your primary profile photo is visible to all members</span>
            )}
          </div>

          {/* Stranger Mode Specific Controls */}
          {isStranger && (
            <div className="pt-3 border-t border-gray-800 text-left space-y-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hidePhoto}
                  onChange={(e) => setFormData({ ...formData, hidePhoto: e.target.checked })}
                  className="rounded bg-gray-900 border-purple-500 text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold">Hide my photo completely (Apply maximum algorithmic blur)</span>
              </label>

              <Input
                label="Stranger Pseudonym Alias"
                value={formData.pseudonym}
                onChange={(e) => setFormData({ ...formData, pseudonym: e.target.value })}
                helperText="This alias replaces your legal name in Stranger Mode matches."
                required
              />
            </div>
          )}
        </Card>

        {/* Basic Info & Identity */}
        <Card glass className="p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Identity & Username
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Display Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Unique Username"
              icon={AtSign}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              helperText="Your permanent platform handle"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              icon={Phone}
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              helperText="Used for login and safety alerts"
            />

            <Input
              label="Location / City"
              icon={MapPin}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. San Francisco, CA"
            />
          </div>

          {/* Gender Identity */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Gender Identity
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[36px] ${
                    formData.gender === g
                      ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/30'
                      : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Location / Neighborhood"
            icon={MapPin}
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Relationship Style
            </label>
            <select
              value={formData.relationshipStyle}
              onChange={(e) => setFormData({ ...formData, relationshipStyle: e.target.value })}
              className="w-full min-h-touch px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-100 focus:border-pink-500 focus:outline-none"
            >
              {RELATIONSHIP_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Bio / Manifesto
            </label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full p-3 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-100 placeholder:text-gray-500 focus:border-pink-500 focus:outline-none"
              placeholder="Tell other sparks what moves you..."
            />
          </div>
        </Card>

        {/* Nature & Chemistry Traits Section */}
        <Card glass className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Your Nature & Chemistry Vibes</span>
            </h3>
          </div>
          <NatureChips
            selectedTraits={formData.nature || []}
            onToggle={toggleNature}
            min={2}
            max={6}
          />
        </Card>

        {/* Connection Intent Chips */}
        <Card glass className="p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Your Connection Intents
          </h3>
          <IntentChips
            selectedIntents={formData.intents}
            onToggle={toggleIntent}
          />
        </Card>

        {/* Interests & Passions */}
        <Card glass className="p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Passions & Lifestyle Tags
          </h3>
          <InterestGrid
            selectedInterests={formData.interests}
            onToggle={toggleInterest}
            min={3}
            max={5}
          />
        </Card>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSaving}
          icon={Save}
        >
          Save Profile Changes
        </Button>

        {/* Account Session & Sign Out Card */}
        <Card glass className="p-6 border-rose-500/20 bg-rose-500/5 space-y-4 mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Account Session</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Currently signed in as <span className="font-semibold text-gray-200">{user?.email || user?.name || user?.username || 'Member'}</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Sign out of your session on this device.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              size="md"
              icon={LogOut}
              onClick={() => setIsSignOutModalOpen(true)}
              className="w-full sm:w-auto font-bold shadow-md shadow-rose-950/40"
            >
              Sign Out
            </Button>
          </div>
        </Card>
      </form>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        title="Sign Out of SparkConnect"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Are you sure you want to sign out? You will need to log back in to access your profile, chats, and discover new matches.
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
              Confirm Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EditProfilePage;
