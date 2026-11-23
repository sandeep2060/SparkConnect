import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Send,
  ShieldCheck,
  ArrowLeft,
  Search,
  MoreVertical,
  AlertTriangle,
  User,
  Sparkles,
  Lock,
  Mic,
  Paperclip,
  Image,
  Flame,
  Timer,
  Trash2,
  Check,
  X,
  Volume2,
  UserPlus,
  UserCheck,
  Ban,
  Zap,
  Info,
  Clock,
  Upload,
} from 'lucide-react';
import {
  getConversationsApi,
  getConversationByIdApi,
  sendMessageApi,
  simulatePartnerReplyApi,
} from '../api/chats';
import {
  getRelationshipStatusApi,
  sendFriendRequestApi,
  blockUserApi,
  unblockUserApi,
} from '../api/social';
import { formatTimeAgo } from '../utils/helpers';
import ChatBubble from '../components/ChatBubble';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import SafetyCheckin from '../components/SafetyCheckin';
import ReportModal from '../components/ReportModal';
import MediaViewerModal from '../components/MediaViewerModal';
import DisappearingMessageModal from '../components/DisappearingMessageModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { generateAiIcebreaker } from '../api/neon';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { useNotificationStore } from '../store/notificationStore';
import {
  playMessageSound,
  playFriendRequestSound,
  triggerBrowserNotification,
} from '../utils/sound';

export const ChatsPage = () => {
  const { id: routeChatId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { isUserRevealed } = useProfileStore();

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Attachment & View-Limited Media State
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [mediaLimitOption, setMediaLimitOption] = useState('1'); // 'regular' | '1' | '2' | '3'
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState(null); // { url, name, viewLimit }
  const fileInputRef = useRef(null);

  // Modals state
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDisappearingModalOpen, setIsDisappearingModalOpen] = useState(false);

  // Ephemeral media viewer modal state
  const [viewingMediaMessage, setViewingMediaMessage] = useState(null);

  // Social Relationship with Active Chat Partner
  const [partnerRelationship, setPartnerRelationship] = useState({
    isBlocked: false,
    friendshipStatus: 'none',
  });

  // Snapchat Streak & celebration state
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [streakCelebration, setStreakCelebration] = useState(null);
  const [isSimulatingPartner, setIsSimulatingPartner] = useState(false);

  // Confirm dialog state for block/unblock actions in chat
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    action: null, // 'block' | 'unblock'
  });

  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Voice recording timer
  useEffect(() => {
    let timer;
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  // Load conversation list
  useEffect(() => {
    const loadList = async () => {
      setIsLoadingList(true);
      try {
        const data = await getConversationsApi();
        setConversations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingList(false);
      }
    };
    loadList();
  }, []);

  // Load active chat when route param changes
  useEffect(() => {
    if (routeChatId) {
      const loadChat = async () => {
        setIsLoadingChat(true);
        try {
          const chatData = await getConversationByIdApi(routeChatId);
          setActiveChat(chatData);
          // Mark as read locally
          setConversations((prev) =>
            prev.map((c) => (c.id === routeChatId ? { ...c, unreadCount: 0 } : c))
          );
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoadingChat(false);
        }
      };
      loadChat();
    } else {
      setActiveChat(null);
    }
  }, [routeChatId]);

  // Load relationship status with active partner
  useEffect(() => {
    if (!activeChat?.partner?.id) return;
    const fetchSocialStatus = async () => {
      try {
        const res = await getRelationshipStatusApi(activeChat.partner.id);
        setPartnerRelationship(res);
      } catch (e) {
        console.error(e);
      }
    };
    fetchSocialStatus();
  }, [activeChat?.partner?.id]);

  const handleToggleBlockPartner = async () => {
    if (!activeChat?.partner?.id) return;
    if (partnerRelationship.isBlocked) {
      // Show unblock confirmation
      setConfirmDialog({ isOpen: true, action: 'unblock' });
    } else {
      // Show block confirmation
      setConfirmDialog({ isOpen: true, action: 'block' });
    }
  };

  const handleConfirmBlockAction = async () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    if (!activeChat?.partner?.id) return;
    if (confirmDialog.action === 'unblock') {
      await unblockUserApi(activeChat.partner.id);
      setPartnerRelationship((prev) => ({ ...prev, isBlocked: false }));
    } else {
      await blockUserApi(activeChat.partner.id);
      setPartnerRelationship((prev) => ({
        ...prev,
        isBlocked: true,
        friendshipStatus: 'none',
      }));
    }
  };

  const handleSendFriendRequestFromChat = async () => {
    if (!activeChat?.partner?.id) return;
    try {
      await sendFriendRequestApi(activeChat.partner.id);
      playFriendRequestSound();
      triggerBrowserNotification(
        'Friend Request Sent',
        `Friend request sent to ${partnerDisplayName}`,
        'friend_request'
      );
      setPartnerRelationship((prev) => ({
        ...prev,
        friendshipStatus: 'pending_sent',
      }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  // Text message sending
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const textToSend = inputText.trim();
    setInputText('');

    const disappearing = activeChat.disappearingSetting !== 'off' ? activeChat.disappearingSetting : undefined;

    // Optimistic message update
    const optimisticMsg = {
      id: 'temp_' + Date.now(),
      senderId: 'current_user',
      text: textToSend,
      type: 'text',
      disappearing,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    setActiveChat((prev) => ({
      ...prev,
      messages: [...prev.messages, optimisticMsg],
    }));

    setIsSending(true);
    try {
      const sentMsg = await sendMessageApi(activeChat.id, {
        text: textToSend,
        type: 'text',
        disappearing,
      });

      setActiveChat((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => (m.id === optimisticMsg.id ? sentMsg : m)),
        streakCount: sentMsg.streak ? sentMsg.streak.streakCount : prev.streakCount,
        streakExpiresAt: sentMsg.streak ? sentMsg.streak.streakExpiresAt : prev.streakExpiresAt,
        streakExpiringSoon: sentMsg.streak ? sentMsg.streak.streakExpiringSoon : prev.streakExpiringSoon,
        bothSentToday: sentMsg.streak ? sentMsg.streak.bothSentToday : prev.bothSentToday,
        hoursRemaining: sentMsg.streak ? sentMsg.streak.hoursRemaining : prev.hoursRemaining,
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? {
                ...c,
                lastMessage: sentMsg,
                streakCount: sentMsg.streak ? sentMsg.streak.streakCount : c.streakCount,
                streakExpiringSoon: sentMsg.streak ? sentMsg.streak.streakExpiringSoon : c.streakExpiringSoon,
                bothSentToday: sentMsg.streak ? sentMsg.streak.bothSentToday : c.bothSentToday,
              }
            : c
        )
      );

      if (sentMsg.streak?.streakExtended) {
        setStreakCelebration(
          `🔥 Snapstreak Ignited! Both exchanged messages — Day ${sentMsg.streak.streakCount} maintained!`
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Send Voice Clip
  const handleSendVoiceClip = async () => {
    if (!activeChat) return;
    const durationStr = `0:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds || 8}`;
    setIsRecordingVoice(false);

    const disappearing = activeChat.disappearingSetting !== 'off' ? activeChat.disappearingSetting : undefined;

    const voiceMsg = {
      id: 'temp_voice_' + Date.now(),
      senderId: 'current_user',
      type: 'voice',
      audioDuration: durationStr,
      disappearing,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    setActiveChat((prev) => ({
      ...prev,
      messages: [...prev.messages, voiceMsg],
    }));

    try {
      const sentMsg = await sendMessageApi(activeChat.id, {
        type: 'voice',
        audioDuration: durationStr,
        disappearing,
      });

      setActiveChat((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => (m.id === voiceMsg.id ? sentMsg : m)),
        streakCount: sentMsg.streak ? sentMsg.streak.streakCount : prev.streakCount,
        streakExpiresAt: sentMsg.streak ? sentMsg.streak.streakExpiresAt : prev.streakExpiresAt,
        streakExpiringSoon: sentMsg.streak ? sentMsg.streak.streakExpiringSoon : prev.streakExpiringSoon,
        bothSentToday: sentMsg.streak ? sentMsg.streak.bothSentToday : prev.bothSentToday,
        hoursRemaining: sentMsg.streak ? sentMsg.streak.hoursRemaining : prev.hoursRemaining,
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? {
                ...c,
                lastMessage: sentMsg,
                streakCount: sentMsg.streak ? sentMsg.streak.streakCount : c.streakCount,
                streakExpiringSoon: sentMsg.streak ? sentMsg.streak.streakExpiringSoon : c.streakExpiringSoon,
                bothSentToday: sentMsg.streak ? sentMsg.streak.bothSentToday : c.bothSentToday,
              }
            : c
        )
      );

      if (sentMsg.streak?.streakExtended) {
        setStreakCelebration(
          `🔥 Snapstreak Extended! Voice snap sent — Day ${sentMsg.streak.streakCount} maintained!`
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle file selection from local device / gallery
  const handleGalleryFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedGalleryPhoto({
        url: reader.result,
        name: file.name,
        viewLimit: '1', // default 1x view once
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Send Media / View-Once Media (supports local gallery customUrl or fallback sample)
  const handleSendMediaFile = async (limitMode, customUrl = null) => {
    setShowAttachmentMenu(false);
    setSelectedGalleryPhoto(null);
    if (!activeChat) return;

    // Preset high-res dating photo sample or custom user photo from gallery
    const sampleMediaUrls = [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    ];
    const pickedUrl = customUrl || sampleMediaUrls[Math.floor(Math.random() * sampleMediaUrls.length)];

    const isViewOnce = limitMode === '1' || limitMode === '2' || limitMode === '3';
    const limitNum = isViewOnce ? parseInt(limitMode, 10) : undefined;
    const disappearing = activeChat.disappearingSetting !== 'off' ? activeChat.disappearingSetting : undefined;

    const optimisticMedia = {
      id: 'temp_media_' + Date.now(),
      senderId: 'current_user',
      type: isViewOnce ? 'view_once' : 'image',
      viewLimit: limitNum,
      viewsRemaining: limitNum,
      mediaUrl: pickedUrl,
      text: isViewOnce ? `🔒 Protected Photo (${limitNum}x View)` : 'Sent a photo',
      disappearing,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    setActiveChat((prev) => ({
      ...prev,
      messages: [...prev.messages, optimisticMedia],
    }));

    try {
      const sentMsg = await sendMessageApi(activeChat.id, {
        type: isViewOnce ? 'view_once' : 'image',
        viewLimit: limitNum,
        viewsRemaining: limitNum,
        mediaUrl: pickedUrl,
        text: isViewOnce ? `🔒 Protected Photo (${limitNum}x View)` : 'Sent a photo',
        disappearing,
      });

      setActiveChat((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => (m.id === optimisticMedia.id ? sentMsg : m)),
        streakCount: sentMsg.streak ? sentMsg.streak.streakCount : prev.streakCount,
        streakExpiresAt: sentMsg.streak ? sentMsg.streak.streakExpiresAt : prev.streakExpiresAt,
        streakExpiringSoon: sentMsg.streak ? sentMsg.streak.streakExpiringSoon : prev.streakExpiringSoon,
        bothSentToday: sentMsg.streak ? sentMsg.streak.bothSentToday : prev.bothSentToday,
        hoursRemaining: sentMsg.streak ? sentMsg.streak.hoursRemaining : prev.hoursRemaining,
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? {
                ...c,
                lastMessage: sentMsg,
                streakCount: sentMsg.streak ? sentMsg.streak.streakCount : c.streakCount,
                streakExpiringSoon: sentMsg.streak ? sentMsg.streak.streakExpiringSoon : c.streakExpiringSoon,
                bothSentToday: sentMsg.streak ? sentMsg.streak.bothSentToday : c.bothSentToday,
              }
            : c
        )
      );

      if (sentMsg.streak?.streakExtended) {
        setStreakCelebration(
          `🔥 Snapstreak Extended! Photo snap sent — Day ${sentMsg.streak.streakCount} maintained!`
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Simulate Partner Snapping Back (Mutual Messaging increments Snapstreak!)
  const handleSimulatePartnerReply = async () => {
    if (!activeChat || isSimulatingPartner) return;
    setIsSimulatingPartner(true);
    try {
      const replyMsg = await simulatePartnerReplyApi(
        activeChat.id,
        `Hey! Replying to keep our streak blazing 🔥⚡`
      );

      // Play audio notification chime & show browser notice
      playMessageSound();
      triggerBrowserNotification(
        `New Message from ${partnerDisplayName}`,
        replyMsg.text || 'Sent a snap message',
        'message'
      );
      useNotificationStore.getState().addNotification({
        type: 'message',
        senderName: partnerDisplayName,
        avatar: activeChat.partner?.avatar,
        message: replyMsg.text || 'sent a snap message',
        actionUrl: `/app/messages/${activeChat.id}`,
      });

      setActiveChat((prev) => ({
        ...prev,
        messages: [...prev.messages, replyMsg],
        streakCount: replyMsg.streak ? replyMsg.streak.streakCount : prev.streakCount,
        streakExpiresAt: replyMsg.streak ? replyMsg.streak.streakExpiresAt : prev.streakExpiresAt,
        streakExpiringSoon: replyMsg.streak ? replyMsg.streak.streakExpiringSoon : prev.streakExpiringSoon,
        bothSentToday: true,
        hoursRemaining: replyMsg.streak ? replyMsg.streak.hoursRemaining : prev.hoursRemaining,
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? {
                ...c,
                lastMessage: replyMsg,
                streakCount: replyMsg.streak ? replyMsg.streak.streakCount : c.streakCount,
                streakExpiringSoon: replyMsg.streak ? replyMsg.streak.streakExpiringSoon : c.streakExpiringSoon,
                bothSentToday: true,
              }
            : c
        )
      );

      if (replyMsg.streak?.streakExtended) {
        setStreakCelebration(
          `🔥 Snapstreak Extended! ${partnerDisplayName} snapped back! Day ${replyMsg.streak.streakCount} maintained!`
        );
      }
    } catch (err) {
      console.error('Error simulating partner reply:', err);
    } finally {
      setIsSimulatingPartner(false);
    }
  };

  // Consume ephemeral view
  const handleViewConsumed = () => {
    if (!viewingMediaMessage) return;
    const msgId = viewingMediaMessage.id;

    setActiveChat((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => {
        if (m.id === msgId) {
          const nextRemaining = Math.max(0, (m.viewsRemaining || 1) - 1);
          return {
            ...m,
            viewsRemaining: nextRemaining,
          };
        }
        return m;
      }),
    }));
  };

  // Handle Disappearing Timer Save
  const handleSaveDisappearingSetting = (newSetting) => {
    if (!activeChat) return;

    setActiveChat((prev) => ({
      ...prev,
      disappearingSetting: newSetting,
      messages: [
        ...prev.messages,
        {
          id: 'sys_' + Date.now(),
          senderId: 'system',
          text:
            newSetting === 'off'
              ? '⏱️ Disappearing messages turned off.'
              : `⏱️ Messages now disappear ${
                  newSetting === 'after_seen'
                    ? 'immediately after being seen.'
                    : `after ${newSetting}.`
                }`,
          timestamp: new Date().toISOString(),
          status: 'system',
        },
      ],
    }));
  };

  const filteredConversations = conversations.filter((c) => {
    const partnerName = c.partner?.name || c.partner?.pseudonym || '';
    return partnerName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isStrangerPartner =
    activeChat?.partner?.mode === 'stranger' &&
    !activeChat?.partner?.revealed &&
    !isUserRevealed(activeChat?.partner?.id);
  const partnerDisplayName = isStrangerPartner
    ? activeChat?.partner?.pseudonym
    : activeChat?.partner?.name;

  const [isGeneratingIcebreaker, setIsGeneratingIcebreaker] = useState(false);

  // Suggested Conversation Starter / Icebreaker Generator (natural human social phrasing)
  const handleGenerateIcebreaker = async () => {
    if (!activeChat?.partner || isGeneratingIcebreaker) return;
    setIsGeneratingIcebreaker(true);
    try {
      const icebreaker = await generateAiIcebreaker({
        partnerName: partnerDisplayName || 'there',
        partnerBio: activeChat.partner?.bio || 'Enjoys deep conversations and spontaneous adventures',
        partnerInterests: activeChat.partner?.interests || ['Travel', 'Music', 'Food'],
      });
      setInputText(icebreaker);
    } catch (err) {
      console.error('Conversation starter error:', err);
    } finally {
      setIsGeneratingIcebreaker(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] flex rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 shadow-2xl">
      {/* LEFT SIDEBAR: Conversation List */}
      <div
        className={`
          w-full md:w-80 lg:w-96 flex flex-col bg-gray-950 border-r border-gray-800 shrink-0
          ${routeChatId ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* List Header */}
        <div className="p-4 border-b border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white tracking-tight">Messages</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400">
              {conversations.length} Active
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Conversation Items Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-900">
          {isLoadingList ? (
            <div className="p-4 space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-1/2 h-4 bg-gray-800 rounded" />
                    <div className="w-3/4 h-3 bg-gray-800/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isStranger =
                conv.partner?.mode === 'stranger' &&
                !conv.partner?.revealed &&
                !isUserRevealed(conv.partner?.id);
              const name = isStranger ? conv.partner?.pseudonym : conv.partner?.name;
              const isSelected = routeChatId === conv.id;
              const activeStatusText = conv.partner?.activeNow
                ? 'Active now'
                : conv.partner?.lastSeenText || 'Active 5m ago';

              return (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/app/chats/${conv.id}`)}
                  className={`
                    p-3.5 flex items-center gap-3 cursor-pointer transition-colors select-none min-h-touch
                    ${
                      isSelected
                        ? 'bg-pink-500/10 border-l-4 border-pink-500'
                        : 'hover:bg-gray-900'
                    }
                  `}
                >
                  <Avatar
                    src={conv.partner?.avatar}
                    alt={name}
                    size="md"
                    status={conv.partner?.activeNow ? 'online' : 'offline'}
                    blurred={isStranger}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-100 truncate">
                          {name}
                        </span>
                        {isStranger && (
                          <span title="Stranger Mode Active">
                            <Lock className="w-3 h-3 text-purple-400" />
                          </span>
                        )}
                        {/* SNAPCHAT STREAK BADGE */}
                        {conv.streakCount > 0 && (
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black border shadow-sm ${
                              conv.streakExpiringSoon
                                ? 'bg-rose-950/70 border-rose-500/50 text-rose-300 animate-pulse'
                                : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-orange-500/40 text-orange-400'
                            }`}
                            title={`${conv.streakCount} day Snapstreak ${
                              conv.streakExpiringSoon
                                ? `(Expiring in ${conv.hoursRemaining || 6}h! ⏳)`
                                : ''
                            }`}
                          >
                            <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                            <span>{conv.streakCount}</span>
                            {conv.streakExpiringSoon && <span>⏳</span>}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatTimeAgo(conv.lastMessage?.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400 truncate pr-2 flex items-center gap-1">
                        {conv.lastMessage?.type === 'voice' && (
                          <Volume2 className="w-3 h-3 text-pink-400 inline shrink-0" />
                        )}
                        {conv.lastMessage?.type === 'view_once' && (
                          <Lock className="w-3 h-3 text-purple-400 inline shrink-0" />
                        )}
                        <span>{conv.lastMessage?.text || 'Voice message'}</span>
                      </p>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Active Status Sub-bar */}
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          conv.partner?.activeNow ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                        }`}
                      />
                      <span>{activeStatusText}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-gray-400">
              No conversations found.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Active Chat Thread */}
      <div
        className={`
          flex-1 flex flex-col bg-gray-900 min-w-0
          ${!routeChatId ? 'hidden md:flex items-center justify-center' : 'flex'}
        `}
      >
        {activeChat ? (
          <>
            {/* Thread Header */}
            <div className="px-3 sm:px-4 py-2.5 bg-gray-950/90 backdrop-blur-md border-b border-gray-800 flex items-center justify-between shrink-0 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => navigate('/app/chats')}
                  className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <Link
                  to={`/app/profile/${activeChat.partner?.id}`}
                  className="flex items-center gap-2.5 hover:opacity-90 transition-opacity min-w-0"
                >
                  <Avatar
                    src={activeChat.partner?.avatar}
                    alt={partnerDisplayName}
                    size="sm"
                    status={activeChat.partner?.activeNow ? 'online' : 'offline'}
                    blurred={isStrangerPartner}
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                      <span className="truncate">{partnerDisplayName}</span>
                      {isStrangerPartner ? (
                        <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/40 px-1.5 rounded shrink-0">
                          Incognito
                        </span>
                      ) : (
                        activeChat.partner?.username && (
                          <span className="text-[10px] text-pink-400 font-mono font-medium truncate">
                            @{activeChat.partner.username}
                          </span>
                        )
                      )}
                    </h3>

                    {/* Active Status Display with Last Seen */}
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          activeChat.partner?.activeNow
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-gray-500'
                        }`}
                      />
                      <span>
                        {activeChat.partner?.activeNow
                          ? 'Active now'
                          : activeChat.partner?.lastSeenText || 'Active 5 mins ago'}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* SNAPSTREAK BADGE / PILL */}
                <button
                  type="button"
                  onClick={() => setIsStreakModalOpen(true)}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all min-h-touch cursor-pointer shadow-sm
                    ${
                      activeChat.streakCount > 0
                        ? activeChat.streakExpiringSoon
                          ? 'bg-rose-950/70 border border-rose-500/50 text-rose-300 animate-pulse'
                          : 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-pink-500/20 border border-orange-500/40 text-orange-300 hover:border-orange-400'
                        : 'bg-gray-800/80 hover:bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200'
                    }
                  `}
                  title="Snapchat Streak Status & Rules"
                >
                  <Flame
                    className={`w-3.5 h-3.5 ${
                      activeChat.streakCount > 0
                        ? 'text-orange-500 fill-orange-500'
                        : 'text-gray-500'
                    }`}
                  />
                  <span>
                    {activeChat.streakCount > 0
                      ? `${activeChat.streakCount}d`
                      : 'Streak 0'}
                  </span>
                  {activeChat.streakExpiringSoon && (
                    <span className="text-xs" title="Expiring soon!">
                      ⏳
                    </span>
                  )}
                </button>

                {/* SNAP BACK (SIMULATE PARTNER MUTUAL MSG) */}
                <button
                  type="button"
                  onClick={handleSimulatePartnerReply}
                  disabled={isSimulatingPartner || partnerRelationship.isBlocked}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shadow-sm min-h-touch cursor-pointer"
                  title="Simulate partner snapping back (mutual messaging maintains & increments streak!)"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-400 ${isSimulatingPartner ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Snap Back</span>
                </button>

                {/* DISAPPEARING MESSAGES BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsDisappearingModalOpen(true)}
                  className={`
                    flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-touch cursor-pointer
                    ${
                      activeChat.disappearingSetting && activeChat.disappearingSetting !== 'off'
                        ? 'bg-pink-500/20 border border-pink-500/40 text-pink-300 shadow-sm'
                        : 'bg-gray-800/80 hover:bg-gray-800 border border-gray-700 text-gray-300'
                    }
                  `}
                  title="Configure disappearing messages timer"
                >
                  <Timer className="w-3.5 h-3.5 text-pink-400" />
                  <span className="hidden sm:inline">
                    {activeChat.disappearingSetting === 'after_seen'
                      ? 'After seen'
                      : activeChat.disappearingSetting === '24h'
                      ? '24h'
                      : activeChat.disappearingSetting === '7d'
                      ? '7d'
                      : activeChat.disappearingSetting === 'custom'
                      ? '1h'
                      : 'Disappearing'}
                  </span>
                </button>

                {/* SAFETY CHECK-IN BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsSafetyModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all shadow-sm min-h-touch cursor-pointer"
                  title="Share location and safety ping with trusted contact"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span className="hidden lg:inline">Safety Check-in</span>
                </button>

                {/* Friend Status / Request Action */}
                {partnerRelationship.friendshipStatus === 'friends' && (
                  <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1.5 rounded-xl border border-emerald-500/30">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Friends</span>
                  </span>
                )}
                {partnerRelationship.friendshipStatus === 'none' && !partnerRelationship.isBlocked && (
                  <button
                    type="button"
                    onClick={handleSendFriendRequestFromChat}
                    className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-purple-300 bg-purple-950/60 hover:bg-purple-900 px-2.5 py-1.5 rounded-xl border border-purple-500/30 transition-all cursor-pointer"
                    title="Send friend request"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                    <span>Add Friend</span>
                  </button>
                )}
                {partnerRelationship.friendshipStatus === 'pending_sent' && (
                  <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1.5 rounded-xl border border-amber-500/30">
                    <span>Req Sent</span>
                  </span>
                )}

                {/* Block / Unblock User Button */}
                <button
                  type="button"
                  onClick={handleToggleBlockPartner}
                  title={partnerRelationship.isBlocked ? 'Unblock member' : 'Block member'}
                  className={`p-2 rounded-xl transition-all min-h-touch min-w-touch flex items-center justify-center cursor-pointer ${
                    partnerRelationship.isBlocked
                      ? 'text-amber-400 bg-amber-950/50 border border-amber-500/40 hover:bg-amber-900/50'
                      : 'text-gray-400 hover:text-rose-400 hover:bg-gray-800'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                </button>

                {/* Report User Button */}
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  title="Report user"
                  className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-gray-800 transition-colors min-h-touch min-w-touch flex items-center justify-center"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Snapstreak Celebration Banner */}
            {streakCelebration && (
              <div className="px-4 py-2.5 bg-gradient-to-r from-amber-950 via-orange-950 to-pink-950 border-b border-orange-500/40 flex items-center justify-between gap-2 text-xs font-bold text-orange-200 animate-slide-down shrink-0">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce shrink-0" />
                  <span>{streakCelebration}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStreakCelebration(null)}
                  className="p-1 rounded-md text-orange-400 hover:text-white hover:bg-orange-900/40 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Ephemeral / Disappearing Banner */}
              {activeChat.disappearingSetting && activeChat.disappearingSetting !== 'off' && (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-gray-950 border border-pink-500/30 text-center max-w-sm mx-auto text-xs text-pink-200 flex items-center justify-center gap-2">
                  <Flame className="w-4 h-4 text-pink-400 animate-pulse" />
                  <span>
                    Disappearing messages are ON (Expires{' '}
                    {activeChat.disappearingSetting === 'after_seen'
                      ? 'after seen'
                      : activeChat.disappearingSetting}
                    )
                  </span>
                </div>
              )}

              {activeChat.messages?.map((msg) => {
                if (msg.status === 'system') {
                  return (
                    <div
                      key={msg.id}
                      className="text-center my-3 text-[11px] font-semibold text-gray-400 bg-gray-950/60 py-1 px-3 rounded-full w-max mx-auto border border-gray-800"
                    >
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    isMine={msg.senderId === 'current_user'}
                    partnerAvatar={activeChat.partner?.avatar}
                    onOpenEphemeralMedia={(mediaMsg) => setViewingMediaMessage(mediaMsg)}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Real File Input for Gallery upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGalleryFileSelect}
            />

            {/* GALLERY PHOTO STAGED FOR INSTANT SEND */}
            {selectedGalleryPhoto && (
              <div className="p-3 bg-gray-950 border-t border-pink-500/40 animate-slide-up">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-pink-400">Selected from Gallery</span>
                    <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                      {selectedGalleryPhoto.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedGalleryPhoto(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Photo Preview Thumbnail */}
                  <img
                    src={selectedGalleryPhoto.url}
                    alt="Selected gallery preview"
                    className="w-16 h-16 rounded-xl object-cover ring-2 ring-pink-500/50 shadow-md shrink-0"
                  />

                  {/* View Limit Selector */}
                  <div className="flex-1 w-full space-y-1.5">
                    <p className="text-[11px] text-gray-300 font-medium">Protection View Limit:</p>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      {[
                        { id: '1', label: '1x View' },
                        { id: '2', label: '2x View' },
                        { id: '3', label: '3x View' },
                        { id: 'regular', label: 'Regular' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setSelectedGalleryPhoto((prev) => ({ ...prev, viewLimit: opt.id }))
                          }
                          className={`py-1 px-1.5 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            selectedGalleryPhoto.viewLimit === opt.id
                              ? 'bg-pink-600 text-white shadow-sm ring-1 ring-pink-400'
                              : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Instant Send Gallery Button */}
                  <button
                    type="button"
                    onClick={() =>
                      handleSendMediaFile(selectedGalleryPhoto.viewLimit, selectedGalleryPhoto.url)
                    }
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-black shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Instant Send Photo</span>
                  </button>
                </div>
              </div>
            )}

            {/* ATTACHMENT MENU DROPDOWN */}
            {showAttachmentMenu && (
              <div className="p-3 bg-gray-950 border-t border-gray-800 animate-slide-up">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
                  <span className="text-xs font-bold text-gray-300">
                    Send Media (Anti-Screenshot Protection)
                  </span>
                  <button
                    onClick={() => setShowAttachmentMenu(false)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Gallery direct trigger button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachmentMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/50 flex items-center justify-between transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-md shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Choose from Device Gallery</div>
                        <div className="text-[10px] text-pink-300">Pick any image from your phone or PC</div>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-pink-500/20 text-pink-300 text-[10px] font-bold">
                      Browse
                    </span>
                  </button>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendMediaFile('1')}
                      className="p-2.5 rounded-xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/40 text-left transition-all"
                    >
                      <div className="text-xs font-black text-pink-400">1x View Once</div>
                      <div className="text-[10px] text-gray-300 mt-0.5">
                        Screenshots blocked • Destructs after 1 view
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendMediaFile('2')}
                      className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/40 text-left transition-all"
                    >
                      <div className="text-xs font-black text-purple-300">2x View Twice</div>
                      <div className="text-[10px] text-gray-300 mt-0.5">
                        Allow recipient to view 2 times total
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendMediaFile('3')}
                      className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/40 text-left transition-all"
                    >
                      <div className="text-xs font-black text-purple-300">3x View 3 Times</div>
                      <div className="text-[10px] text-gray-300 mt-0.5">
                        Allow recipient to view 3 times total
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendMediaFile('regular')}
                      className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-left transition-all"
                    >
                      <div className="text-xs font-bold text-gray-200">Regular Photo</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Permanent chat attachment
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MESSAGE INPUT / VOICE RECORDING BAR OR BLOCKED BANNER */}
            {partnerRelationship.isBlocked ? (
              <div className="p-4 bg-gray-950/90 border-t border-gray-800 text-center animate-fade-in">
                <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center justify-center gap-2 max-w-md mx-auto">
                  <Ban className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>You have blocked {partnerDisplayName}.</span>
                  <button
                    type="button"
                    onClick={handleToggleBlockPartner}
                    className="font-bold underline text-white hover:text-rose-200 ml-1.5 cursor-pointer"
                  >
                    Unblock to Chat
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-950/90 border-t border-gray-800">
                {isRecordingVoice ? (
                /* LIVE VOICE RECORDING MODE */
                <div className="flex items-center justify-between gap-3 bg-gray-900 p-2.5 rounded-2xl border border-pink-500/40 animate-fade-in">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    <span>
                      Recording Voice 0:{recordingSeconds < 10 ? '0' : ''}
                      {recordingSeconds}
                    </span>
                  </div>

                  {/* Audio wave simulation bars */}
                  <div className="flex items-center gap-1 h-6">
                    {[60, 90, 40, 100, 75, 45, 80, 50, 95, 30].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-pink-500 rounded-full animate-pulse"
                        style={{
                          height: `${h}%`,
                          animationDuration: `${0.4 + (i % 3) * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRecordingVoice(false)}
                      className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white min-h-touch min-w-touch flex items-center justify-center"
                      title="Cancel recording"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon={Send}
                      onClick={handleSendVoiceClip}
                    >
                      Send Voice Clip
                    </Button>
                  </div>
                </div>
              ) : (
                /* STANDARD INPUT BAR */
                <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2">
                  {/* HIDE IMAGE, VOICE, AND ICEBREAKER BUTTONS WHILE TYPING MESSAGE */}
                  {!inputText.trim() && (
                    <>
                      {/* Media / Gallery Attachment Trigger */}
                      <button
                        type="button"
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-pink-400 border border-gray-800 transition-colors min-h-touch min-w-touch flex items-center justify-center shrink-0 cursor-pointer"
                        title="Send media from gallery or 1x View Once"
                      >
                        <Image className="w-4 h-4" />
                      </button>

                      {/* Voice Clip Trigger */}
                      <button
                        type="button"
                        onClick={() => setIsRecordingVoice(true)}
                        className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-purple-400 border border-gray-800 transition-colors min-h-touch min-w-touch flex items-center justify-center shrink-0 cursor-pointer"
                        title="Record voice note"
                      >
                        <Mic className="w-4 h-4" />
                      </button>

                      {/* Conversation Starter Generator (natural human social phrasing) */}
                      <button
                        type="button"
                        onClick={handleGenerateIcebreaker}
                        disabled={isGeneratingIcebreaker}
                        className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-pink-500/10 hover:from-amber-500/20 hover:to-pink-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 transition-all min-h-touch min-w-touch flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        title="Conversation Starter - Suggest a fun opener"
                      >
                        <Sparkles
                          className={`w-4 h-4 ${
                            isGeneratingIcebreaker ? 'animate-spin text-pink-400' : 'text-amber-400'
                          }`}
                        />
                        <span className="hidden xl:inline text-[11px] font-bold">Spark</span>
                      </button>
                    </>
                  )}

                  {/* Text Input - Expands to full width when buttons are hidden */}
                  <input
                    type="text"
                    placeholder={`Message ${partnerDisplayName}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-pink-500 transition-all"
                  />

                  {/* INSTANT SEND BUTTON - Prominent & Visible on Mobile & Desktop */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className={`min-h-[44px] min-w-[44px] px-3.5 sm:px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-md cursor-pointer ${
                      inputText.trim()
                        ? 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-pink-500/30 active:scale-95'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50'
                    }`}
                    title="Instant send message"
                  >
                    <Send className="w-4 h-4 shrink-0" />
                    <span className="text-xs sm:text-sm">Send</span>
                  </button>
                </form>
              )}
            </div>
          )}
          </>
        ) : (
          <div className="p-8 text-center max-w-sm space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-gray-800/60 border border-gray-700/60 flex items-center justify-center text-pink-500 mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Your Conversations</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Select a conversation to send text, voice clips, or 1x/2x/3x view-once media with screenshot blocking.
            </p>
          </div>
        )}
      </div>

      {/* Ephemeral Media Viewer Modal with Anti-Screenshot Protection */}
      {viewingMediaMessage && (
        <MediaViewerModal
          isOpen={!!viewingMediaMessage}
          onClose={() => setViewingMediaMessage(null)}
          mediaUrl={viewingMediaMessage.mediaUrl}
          viewLimit={viewingMediaMessage.viewLimit || 1}
          viewsRemaining={viewingMediaMessage.viewsRemaining || 1}
          onViewConsumed={handleViewConsumed}
          senderName={partnerDisplayName}
        />
      )}

      {/* Disappearing Messages Setting Modal */}
      <DisappearingMessageModal
        isOpen={isDisappearingModalOpen}
        onClose={() => setIsDisappearingModalOpen(false)}
        currentSetting={activeChat?.disappearingSetting || 'off'}
        onSave={handleSaveDisappearingSetting}
      />

      {/* Safety Checkin Modal */}
      <SafetyCheckin
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        partnerName={partnerDisplayName}
      />

      {/* Report User Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportedUser={activeChat?.partner}
      />

      {/* SNAPSTREAK DETAILS & RULES MODAL */}
      {isStreakModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-950 border border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5 animate-scale-up">
            <button
              onClick={() => setIsStreakModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-900 text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Flame Header Hero */}
            <div className="text-center space-y-2 pt-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-orange-500/40 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/10">
                <Flame className="w-9 h-9 text-orange-500 fill-orange-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                {activeChat?.streakCount > 0
                  ? `${activeChat.streakCount} Day Snapstreak 🔥`
                  : 'Start a Snapstreak 🔥'}
              </h3>
              <p className="text-xs text-gray-400">
                with <span className="text-white font-bold">{partnerDisplayName}</span>
              </p>
            </div>

            {/* Daily Status Cards */}
            <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2.5">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>Today's Exchange Status</span>
                {activeChat?.streakExpiringSoon ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <span>⏳ Expiring soon ({activeChat?.hoursRemaining || 6}h left)</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span>✓ 24h Window Active</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800/80 space-y-1">
                  <div className="text-[10px] text-gray-400">You</div>
                  <div className="font-bold flex items-center gap-1.5 text-white">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active in chat ✓</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800/80 space-y-1">
                  <div className="text-[10px] text-gray-400">{partnerDisplayName}</div>
                  <div className="font-bold flex items-center gap-1.5 text-white">
                    {activeChat?.bothSentToday ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-300">Sent snap ✓</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-amber-300">Waiting for snap</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Snapchat Rules Breakdown */}
            <div className="space-y-2 text-xs text-gray-300">
              <div className="font-bold text-gray-200 uppercase text-[10px] tracking-wider">
                How Snapstreaks Work (Snapchat Rules)
              </div>
              <ul className="space-y-1.5 text-[11px] text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">•</span>
                  <span>Both friends must send at least one message or snap within 24 hours.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">•</span>
                  <span>Streak increments (+1) once BOTH people have messaged that day.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">•</span>
                  <span>An hourglass ⏳ appears when less than 6 hours remain before reset.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">•</span>
                  <span>If 24–36 hours pass without mutual snaps, the streak resets to 0.</span>
                </li>
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulatePartnerReply}
                disabled={isSimulatingPartner || partnerRelationship.isBlocked}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer transition-all"
              >
                <Zap className={`w-4 h-4 ${isSimulatingPartner ? 'animate-spin' : ''}`} />
                <span>Simulate Snap Back ⚡</span>
              </button>
              <button
                type="button"
                onClick={() => setIsStreakModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 font-semibold text-xs border border-gray-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block / Unblock Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null })}
        onConfirm={handleConfirmBlockAction}
        variant={confirmDialog.action === 'unblock' ? 'unblock' : 'block'}
        title={confirmDialog.action === 'unblock' ? `Unblock ${partnerDisplayName}?` : `Block ${partnerDisplayName}?`}
        message={
          confirmDialog.action === 'unblock'
            ? `Unblocking will allow ${partnerDisplayName} to message you again and appear in your discovery feed.`
            : `Blocking ${partnerDisplayName} will prevent them from messaging you or appearing in your feed. They won't be notified.`
        }
        confirmLabel={confirmDialog.action === 'unblock' ? 'Yes, Unblock' : 'Block Member'}
      />
    </div>
  );
};

export default ChatsPage;
