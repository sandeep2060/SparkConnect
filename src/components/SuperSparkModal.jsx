import React, { useState } from 'react';
import { Sparkles, Send, Heart, Flame, X, MessageSquare, Check } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Avatar from './Avatar';

export const SuperSparkModal = ({
  isOpen,
  onClose,
  targetUser,
  compatibility,
  onSend,
}) => {
  const [note, setNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!targetUser) return null;

  const quickPrompts = [
    `Loved your passion for ${compatibility?.sharedInterests?.[0] || targetUser.interests?.[0] || 'life'}! ✨`,
    'Your profile has amazing energy — had to say hi! 👋',
    compatibility?.recommendedOpener
      ? compatibility.recommendedOpener.replace(/^Ask them:\s*/i, '').replace(/['"]/g, '')
      : 'Would love to get to know you better! ☕',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSending) return;

    setIsSending(true);
    try {
      if (onSend) {
        await onSend({
          targetUserId: targetUser.id,
          note: note.trim() || 'Sent a SuperSpark ✨',
        });
      }
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        setNote('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send a SuperSpark ✨">
      {sentSuccess ? (
        <div className="py-8 text-center space-y-4 animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-rose-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-pink-500/30 animate-bounce">
            <Sparkles className="w-8 h-8 fill-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">SuperSpark Delivered!</h3>
            <p className="text-xs text-purple-200 mt-1">
              Your profile and note will be placed directly at the top of {targetUser.name || targetUser.pseudonym}'s priority deck!
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header User Preview */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-pink-950/60 to-gray-950 border border-purple-500/30 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={targetUser.avatar}
                alt={targetUser.name || 'User'}
                size="md"
                status={targetUser.activeNow ? 'online' : 'offline'}
                blurred={targetUser.mode === 'stranger' && !targetUser.revealed}
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                  <span className="truncate">{targetUser.name || targetUser.pseudonym}</span>
                  {targetUser.age && <span className="text-gray-400 font-normal">{targetUser.age}</span>}
                </div>
                <p className="text-xs text-purple-300 truncate">
                  {targetUser.location || `${targetUser.distance || 5} mi away`}
                </p>
              </div>
            </div>

            {compatibility && (
              <div className="px-2.5 py-1 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-black flex items-center gap-1 shrink-0 shadow-sm">
                <Flame className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                <span>{compatibility.score}% Match</span>
              </div>
            )}
          </div>

          {/* Value Proposition Callout */}
          <div className="text-xs text-gray-300 flex items-center gap-2 p-2.5 rounded-xl bg-gray-950 border border-gray-800">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong>Priority Spotlight:</strong> SuperSparks are 3x more likely to trigger an instant mutual match.
            </span>
          </div>

          {/* Quick Compliment Suggestions */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Quick Suggestions
            </label>
            <div className="space-y-1.5">
              {quickPrompts.slice(0, 2).map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNote(prompt)}
                  className="w-full text-left p-2.5 rounded-xl text-xs bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-pink-500/40 text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Add a Personal Note</span>
              <span className="text-gray-500 font-normal">{note.length}/180</span>
            </label>
            <textarea
              rows={3}
              maxLength={180}
              placeholder={`Write a thoughtful note to ${targetUser.name || 'them'}...`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-pink-500 resize-none transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              loading={isSending}
              type="submit"
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 shadow-md shadow-pink-500/25"
            >
              Send SuperSpark
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default SuperSparkModal;
