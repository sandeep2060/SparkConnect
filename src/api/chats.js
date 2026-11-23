import { sleep, formatTimeAgo } from '../utils/helpers';
import { getNeonSql } from './neon';
import { mapUserRow } from './users';
import { useAuthStore } from '../store/authStore';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isValidUuid = (val) => typeof val === 'string' && UUID_REGEX.test(val);

export const generateUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getCurrentUserId = () => {
  try {
    const user = useAuthStore.getState()?.user;
    if (user && user.id) return user.id;
  } catch {}
  return null;
};

let chatsMemoryFallback = [];

/**
 * Maps a database message row into a consistent frontend message object with real status & seen time
 */
export const mapMessageRow = (m) => {
  const isRead = m.status === 'read' || !!m.seen_at || !!m.read_at;
  const status = isRead ? 'read' : (m.status || 'delivered');
  const seenAt = m.seen_at || m.read_at;

  return {
    id: m.id,
    senderId: m.sender_id,
    text: m.text || m.body || '',
    type: m.type || 'text',
    viewLimit: m.view_limit,
    viewsRemaining: m.views_remaining,
    mediaUrl: m.media_url,
    audioDuration: m.audio_duration,
    disappearing: m.disappearing,
    timestamp: m.created_at,
    seenAt,
    readAt: m.read_at,
    status,
    seenStatusText:
      status === 'read'
        ? seenAt
          ? `Seen ${formatTimeAgo(seenAt)}`
          : 'Seen just now'
        : undefined,
  };
};

/**
 * Snapchat-style Streak Calculator
 * Rules:
 * - A streak is maintained/incremented only when BOTH friends send at least one message every 24 hours.
 * - If more than 24-36h pass without mutual messages, the streak expires back to 0.
 * - When within 6 hours of expiring, streakExpiringSoon becomes true (triggers ⏳ warning icon).
 */
export const calculateSnapstreak = ({
  streakCount = 0,
  streakUpdatedAt = null,
  streakExpiresAt = null,
  senderLastSent = null,
  partnerLastSent = null,
  isSending = false,
  isPartnerSending = false,
}) => {
  const now = new Date();
  const nowMs = now.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const gracePeriodMs = 36 * 60 * 60 * 1000; // 36-hour grace window

  let currentStreak = Number(streakCount) || 0;
  let expires = streakExpiresAt ? new Date(streakExpiresAt) : null;
  let updated = streakUpdatedAt ? new Date(streakUpdatedAt) : null;

  // 1. Expiration check: if deadline passed without mutual message, streak resets to 0
  if (expires && nowMs > expires.getTime()) {
    currentStreak = 0;
    expires = null;
  }

  // 2. Check timestamps of messages
  const senderMs = senderLastSent ? new Date(senderLastSent).getTime() : 0;
  const partnerMs = partnerLastSent ? new Date(partnerLastSent).getTime() : 0;

  const otherPersonSentRecently = isPartnerSending
    ? senderMs > 0 && nowMs - senderMs <= gracePeriodMs
    : partnerMs > 0 && nowMs - partnerMs <= gracePeriodMs;

  const bothSentRecently =
    senderMs > 0 &&
    nowMs - senderMs <= gracePeriodMs &&
    partnerMs > 0 &&
    nowMs - partnerMs <= gracePeriodMs;

  const alreadyExtendedToday = updated && now.toDateString() === updated.toDateString();

  let streakExtended = false;
  let bothSentToday = bothSentRecently;

  if (isSending) {
    if (otherPersonSentRecently) {
      bothSentToday = true;
      if (!alreadyExtendedToday) {
        currentStreak += 1;
        updated = now;
        expires = new Date(nowMs + oneDayMs);
        streakExtended = true;
      } else if (expires) {
        expires = new Date(Math.max(expires.getTime(), nowMs + oneDayMs));
      }
    } else {
      bothSentToday = false;
      if (!expires) {
        expires = new Date(nowMs + oneDayMs);
      }
    }
  }

  const msRemaining = expires ? Math.max(0, expires.getTime() - nowMs) : null;
  const streakExpiringSoon =
    currentStreak > 0 && msRemaining !== null && msRemaining <= 6 * 60 * 60 * 1000;

  return {
    streakCount: currentStreak,
    streakUpdatedAt: updated ? updated.toISOString() : null,
    streakExpiresAt: expires ? expires.toISOString() : null,
    streakExtended,
    bothSentToday,
    streakExpiringSoon,
    hoursRemaining: msRemaining ? Math.max(1, Math.ceil(msRemaining / (60 * 60 * 1000))) : 24,
  };
};

// 1. Get All Conversations for Authenticated User
export const getConversationsApi = async () => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return [];

  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT 
        c.id, c.user_one_id, c.user_two_id, c.disappearing_setting, c.unread_count, c.created_at,
        c.streak_count, c.streak_updated_at, c.streak_expires_at,
        c.user_one_last_sent, c.user_two_last_sent, c.last_sender_id,
        u.id AS partner_id, u.name AS partner_name, u.display_name AS partner_display_name,
        u.username AS partner_username, u.pseudonym AS partner_pseudonym, u.avatar AS partner_avatar,
        u.mode AS partner_mode, u.active_now AS partner_active_now, u.last_seen AS partner_last_seen,
        u.verified AS partner_verified, u.bio AS partner_bio,
        (
          SELECT json_build_object(
            'id', m.id,
            'text', COALESCE(m.text, m.body),
            'type', m.type,
            'senderId', m.sender_id,
            'timestamp', m.created_at,
            'status', m.status
          )
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message
      FROM conversations c
      JOIN users u ON u.id::text = CASE WHEN c.user_one_id = ${currentUserId} THEN c.user_two_id ELSE c.user_one_id END
      WHERE c.user_one_id = ${currentUserId} OR c.user_two_id = ${currentUserId}
      ORDER BY c.updated_at DESC;
    `;

    if (rows && rows.length > 0) {
      return rows.map((r) => {
        const isUserOne = r.user_one_id === currentUserId;
        const streakCalc = calculateSnapstreak({
          streakCount: r.streak_count,
          streakUpdatedAt: r.streak_updated_at,
          streakExpiresAt: r.streak_expires_at,
          senderLastSent: isUserOne ? r.user_one_last_sent : r.user_two_last_sent,
          partnerLastSent: isUserOne ? r.user_two_last_sent : r.user_one_last_sent,
        });

        return {
          id: r.id,
          partner: {
            id: r.partner_id,
            name: r.partner_name || r.partner_display_name || r.partner_username,
            username: r.partner_username,
            pseudonym: r.partner_pseudonym,
            avatar: r.partner_avatar,
            mode: r.partner_mode,
            activeNow: r.partner_active_now,
            lastSeenText: 'Active recently',
            verified: r.partner_verified,
            bio: r.partner_bio,
          },
          unreadCount: r.unread_count || 0,
          disappearingSetting: r.disappearing_setting || 'off',
          streakCount: streakCalc.streakCount,
          streakExpiresAt: streakCalc.streakExpiresAt,
          streakExpiringSoon: streakCalc.streakExpiringSoon,
          bothSentToday: streakCalc.bothSentToday,
          hoursRemaining: streakCalc.hoursRemaining,
          lastMessage: r.last_message || {
            text: 'Connected on SparkConnect',
            timestamp: r.created_at,
            senderId: r.partner_id,
          },
        };
      });
    }
    return [];
  } catch (err) {
    console.warn('Neon Postgres conversations notice:', err.message);
  }

  return [];
};

// 2. Get Single Conversation with Messages (loads, marks read, and purges expired messages)
export const getConversationByIdApi = async (chatIdOrPartnerId) => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId || !chatIdOrPartnerId) {
    return null;
  }

  try {
    const sql = getNeonSql();

    // 1. Try finding conversation where id matches OR user pair matches
    const convRows = await sql`
      SELECT 
        c.id, c.user_one_id, c.user_two_id, c.disappearing_setting, c.unread_count,
        c.streak_count, c.streak_updated_at, c.streak_expires_at,
        c.user_one_last_sent, c.user_two_last_sent, c.last_sender_id,
        u.id AS partner_id, u.name AS partner_name, u.display_name AS partner_display_name,
        u.username AS partner_username, u.pseudonym AS partner_pseudonym,
        u.avatar AS partner_avatar, u.mode AS partner_mode,
        u.active_now AS partner_active_now, u.last_seen AS partner_last_seen,
        u.verified AS partner_verified, u.bio AS partner_bio
      FROM conversations c
      JOIN users u ON u.id::text = CASE WHEN c.user_one_id = ${currentUserId} THEN c.user_two_id ELSE c.user_one_id END
      WHERE c.id = ${chatIdOrPartnerId}
         OR (c.user_one_id = ${currentUserId} AND c.user_two_id = ${chatIdOrPartnerId})
         OR (c.user_one_id = ${chatIdOrPartnerId} AND c.user_two_id = ${currentUserId})
      LIMIT 1;
    `;

    if (convRows && convRows.length > 0) {
      const conv = convRows[0];

      // Mark partner's unread messages as read
      await sql`
        UPDATE messages
        SET status = 'read', seen_at = COALESCE(seen_at, NOW()), read_at = COALESCE(read_at, NOW())
        WHERE conversation_id = ${conv.id}
          AND (sender_id::text != ${currentUserId} OR sender_id IS NULL)
          AND (status != 'read' OR status IS NULL);
      `;

      // Purge expired disappearing messages
      await sql`
        DELETE FROM messages
        WHERE conversation_id = ${conv.id}
          AND disappearing IS NOT NULL
          AND disappearing != 'off'
          AND (
            (disappearing = '10s' AND (seen_at < NOW() - INTERVAL '10 seconds' OR created_at < NOW() - INTERVAL '20 seconds'))
            OR (disappearing = 'after_seen' AND (seen_at IS NOT NULL AND seen_at < NOW() - INTERVAL '15 seconds'))
            OR (disappearing = '1m' AND created_at < NOW() - INTERVAL '1 minute')
            OR (disappearing = '1h' AND created_at < NOW() - INTERVAL '1 hour')
            OR (disappearing = 'custom' AND created_at < NOW() - INTERVAL '1 hour')
            OR (disappearing = '24h' AND created_at < NOW() - INTERVAL '24 hours')
            OR (disappearing = '7d' AND created_at < NOW() - INTERVAL '7 days')
          );
      `;

      const msgRows = await sql`
        SELECT * FROM messages
        WHERE conversation_id = ${conv.id}
        ORDER BY created_at ASC;
      `;

      const isUserOne = conv.user_one_id === currentUserId;
      const streakCalc = calculateSnapstreak({
        streakCount: conv.streak_count,
        streakUpdatedAt: conv.streak_updated_at,
        streakExpiresAt: conv.streak_expires_at,
        senderLastSent: isUserOne ? conv.user_one_last_sent : conv.user_two_last_sent,
        partnerLastSent: isUserOne ? conv.user_two_last_sent : conv.user_one_last_sent,
      });

      return {
        id: conv.id,
        partner: {
          id: conv.partner_id,
          name: conv.partner_name || conv.partner_display_name || conv.partner_username,
          username: conv.partner_username,
          pseudonym: conv.partner_pseudonym,
          avatar: conv.partner_avatar,
          mode: conv.partner_mode,
          activeNow: conv.partner_active_now,
          lastSeenText: 'Active recently',
          verified: conv.partner_verified,
          bio: conv.partner_bio,
        },
        disappearingSetting: conv.disappearing_setting || 'off',
        streakCount: streakCalc.streakCount,
        streakExpiresAt: streakCalc.streakExpiresAt,
        streakExpiringSoon: streakCalc.streakExpiringSoon,
        bothSentToday: streakCalc.bothSentToday,
        hoursRemaining: streakCalc.hoursRemaining,
        messages: msgRows.map(mapMessageRow),
      };
    }

    // 2. If no conversation row exists yet, check if chatIdOrPartnerId is a target user
    let userRows = [];
    if (isValidUuid(chatIdOrPartnerId)) {
      userRows = await sql`SELECT * FROM users WHERE id = ${chatIdOrPartnerId}::uuid LIMIT 1;`;
    } else {
      userRows = await sql`SELECT * FROM users WHERE username = ${chatIdOrPartnerId} OR id::text = ${chatIdOrPartnerId} LIMIT 1;`;
    }

    if (userRows && userRows.length > 0) {
      const partnerUser = mapUserRow(userRows[0]);
      const newConvId = generateUuid();
      // Auto-create direct conversation row in Neon Postgres!
      await sql`
        INSERT INTO conversations (
          id, user_one_id, user_two_id, disappearing_setting, streak_count, created_at, updated_at
        ) VALUES (
          ${newConvId}, ${currentUserId}, ${partnerUser.id}, 'off', 0, NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING;
      `;

      return {
        id: newConvId,
        partner: {
          id: partnerUser.id,
          name: partnerUser.name || partnerUser.displayName || partnerUser.username,
          username: partnerUser.username,
          pseudonym: partnerUser.pseudonym,
          avatar: partnerUser.avatar,
          mode: partnerUser.mode,
          activeNow: partnerUser.activeNow,
          lastSeenText: 'Active recently',
          verified: partnerUser.verified,
          bio: partnerUser.bio,
        },
        disappearingSetting: 'off',
        streakCount: 0,
        streakExpiresAt: null,
        streakExpiringSoon: false,
        bothSentToday: false,
        hoursRemaining: 24,
        messages: [],
      };
    }
  } catch (err) {
    console.warn('Neon Postgres getConversationById notice:', err.message);
  }

  // Fallback if not found
  let chat = chatsMemoryFallback.find((c) => c.id === chatIdOrPartnerId);
  if (!chat) {
    chat = {
      id: chatIdOrPartnerId,
      partner: {
        id: chatIdOrPartnerId,
        name: 'Friend',
        username: 'friend',
        mode: 'public',
        activeNow: true,
      },
      unreadCount: 0,
      streakCount: 0,
      bothSentToday: false,
      streakExpiringSoon: false,
      messages: [],
    };
    chatsMemoryFallback.push(chat);
  }
  return chat;
};

// 3. Real-Time Sync Messages: Marks partner messages as read & purges expired disappearing messages
export const syncChatMessagesApi = async (chatId) => {
  const currentUserId = getCurrentUserId();
  if (!chatId) return null;

  try {
    const sql = getNeonSql();

    // 1. Mark incoming unread messages as read
    if (currentUserId) {
      await sql`
        UPDATE messages
        SET status = 'read', seen_at = COALESCE(seen_at, NOW()), read_at = COALESCE(read_at, NOW())
        WHERE conversation_id = ${chatId}
          AND (sender_id::text != ${currentUserId} OR sender_id IS NULL)
          AND (status != 'read' OR status IS NULL);
      `;
    }

    // 2. Purge expired disappearing messages
    await sql`
      DELETE FROM messages
      WHERE conversation_id = ${chatId}
        AND disappearing IS NOT NULL
        AND disappearing != 'off'
        AND (
          (disappearing = '10s' AND (seen_at < NOW() - INTERVAL '10 seconds' OR created_at < NOW() - INTERVAL '20 seconds'))
          OR (disappearing = 'after_seen' AND (seen_at IS NOT NULL AND seen_at < NOW() - INTERVAL '15 seconds'))
          OR (disappearing = '1m' AND created_at < NOW() - INTERVAL '1 minute')
          OR (disappearing = '1h' AND created_at < NOW() - INTERVAL '1 hour')
          OR (disappearing = 'custom' AND created_at < NOW() - INTERVAL '1 hour')
          OR (disappearing = '24h' AND created_at < NOW() - INTERVAL '24 hours')
          OR (disappearing = '7d' AND created_at < NOW() - INTERVAL '7 days')
        );
    `;

    // 3. Query current messages
    const msgRows = await sql`
      SELECT * FROM messages
      WHERE conversation_id = ${chatId}
      ORDER BY created_at ASC;
    `;

    // 4. Query conversation metadata
    const convRows = await sql`
      SELECT disappearing_setting, streak_count, streak_updated_at, streak_expires_at, user_one_last_sent, user_two_last_sent
      FROM conversations WHERE id = ${chatId} LIMIT 1;
    `;

    return {
      messages: msgRows.map(mapMessageRow),
      conversation: convRows[0] || {},
    };
  } catch (err) {
    console.warn('Neon Postgres syncChatMessages notice:', err.message);
    return null;
  }
};

// 4. Update Disappearing Messages Setting in Postgres & announce via system message
export const updateDisappearingSettingApi = async (chatId, setting) => {
  const currentUserId = getCurrentUserId();
  if (!chatId) return { success: false };

  try {
    const sql = getNeonSql();
    await sql`
      UPDATE conversations
      SET disappearing_setting = ${setting}, updated_at = NOW()
      WHERE id = ${chatId};
    `;

    const noticeText =
      setting === 'off'
        ? '⏱️ Disappearing messages turned off.'
        : `⏱️ Messages in this chat now vanish ${
            setting === '10s'
              ? '10 seconds after opening (Live Vanish Mode 🔥).'
              : setting === 'after_seen'
              ? '15 seconds after opening.'
              : `after ${setting}.`
          }`;

    const msgId = generateUuid();
    if (isValidUuid(currentUserId)) {
      await sql`
        INSERT INTO messages (
          id, conversation_id, sender_id, body, text, type, status, created_at
        ) VALUES (
          ${msgId}::uuid, ${chatId}, ${currentUserId}::uuid, ${noticeText}, ${noticeText}, 'text', 'system', NOW()
        );
      `;
    } else {
      await sql`
        INSERT INTO messages (
          id, conversation_id, body, text, type, status, created_at
        ) VALUES (
          ${msgId}::uuid, ${chatId}, ${noticeText}, ${noticeText}, 'text', 'system', NOW()
        );
      `;
    }

    return { success: true, setting, noticeText, msgId };
  } catch (err) {
    console.warn('Neon Postgres updateDisappearingSetting notice:', err.message);
    return { success: false, setting };
  }
};

// 5. Send Message to Neon Lakebase Postgres (Updates Snapstreak & Disappearing)
export const sendMessageApi = async (chatId, payload) => {
  const currentUserId = getCurrentUserId();
  const messageData = typeof payload === 'string' ? { text: payload } : payload;
  const msgId = generateUuid();
  const text = messageData.text || '';
  const body = text || (messageData.mediaUrl ? '[Photo / Media]' : '[Message]');

  let streakInfo = {
    streakCount: 0,
    streakExtended: false,
    bothSentToday: false,
    streakExpiringSoon: false,
  };

  let effectiveDisappearing = messageData.disappearing || null;

  try {
    const sql = getNeonSql();

    // Query existing conversation streak values & disappearing setting
    const convRows = await sql`
      SELECT id, user_one_id, user_two_id, disappearing_setting, streak_count, streak_updated_at, streak_expires_at, user_one_last_sent, user_two_last_sent
      FROM conversations WHERE id = ${chatId} LIMIT 1;
    `;

    if (convRows.length > 0) {
      const conv = convRows[0];
      const isUserOne = conv.user_one_id === currentUserId;

      if (!effectiveDisappearing && conv.disappearing_setting && conv.disappearing_setting !== 'off') {
        effectiveDisappearing = conv.disappearing_setting;
      }

      streakInfo = calculateSnapstreak({
        streakCount: conv.streak_count,
        streakUpdatedAt: conv.streak_updated_at,
        streakExpiresAt: conv.streak_expires_at,
        senderLastSent: isUserOne ? conv.user_one_last_sent : conv.user_two_last_sent,
        partnerLastSent: isUserOne ? conv.user_two_last_sent : conv.user_one_last_sent,
        isSending: true,
        isPartnerSending: false,
      });

      // Update conversation last message & streak
      if (isUserOne) {
        await sql`
          UPDATE conversations
          SET 
            last_message_text = ${body},
            last_message_at = NOW(),
            updated_at = NOW(),
            last_sender_id = ${currentUserId},
            user_one_last_sent = NOW(),
            streak_count = ${streakInfo.streakCount},
            streak_updated_at = ${streakInfo.streakUpdatedAt},
            streak_expires_at = ${streakInfo.streakExpiresAt}
          WHERE id = ${chatId};
        `;
      } else {
        await sql`
          UPDATE conversations
          SET 
            last_message_text = ${body},
            last_message_at = NOW(),
            updated_at = NOW(),
            last_sender_id = ${currentUserId},
            user_two_last_sent = NOW(),
            streak_count = ${streakInfo.streakCount},
            streak_updated_at = ${streakInfo.streakUpdatedAt},
            streak_expires_at = ${streakInfo.streakExpiresAt}
          WHERE id = ${chatId};
        `;
      }
    }

    const newMessage = {
      id: msgId,
      senderId: currentUserId,
      text: text,
      body: body,
      type: messageData.type || 'text',
      viewLimit: messageData.viewLimit || 1,
      viewsRemaining:
        messageData.viewsRemaining !== undefined
          ? messageData.viewsRemaining
          : messageData.viewLimit || 1,
      mediaUrl: messageData.mediaUrl || null,
      audioDuration: messageData.audioDuration || null,
      disappearing: effectiveDisappearing !== 'off' ? effectiveDisappearing : null,
      timestamp: new Date().toISOString(),
      status: 'delivered', // Real delivered status saved to server
      seenStatusText: 'Delivered',
    };

    // Insert Message (status = delivered)
    if (isValidUuid(currentUserId)) {
      await sql`
        INSERT INTO messages (
          id, conversation_id, sender_id, body, text, type, media_url,
          view_limit, views_remaining, audio_duration, disappearing, status, created_at
        ) VALUES (
          ${msgId}::uuid, ${chatId}, ${currentUserId}::uuid, ${body}, ${text},
          ${newMessage.type}, ${newMessage.mediaUrl}, ${newMessage.viewLimit},
          ${newMessage.viewsRemaining}, ${newMessage.audioDuration},
          ${newMessage.disappearing}, 'delivered', NOW()
        );
      `;
    } else {
      await sql`
        INSERT INTO messages (
          id, conversation_id, body, text, type, media_url,
          view_limit, views_remaining, audio_duration, disappearing, status, created_at
        ) VALUES (
          ${msgId}::uuid, ${chatId}, ${body}, ${text},
          ${newMessage.type}, ${newMessage.mediaUrl}, ${newMessage.viewLimit},
          ${newMessage.viewsRemaining}, ${newMessage.audioDuration},
          ${newMessage.disappearing}, 'delivered', NOW()
        );
      `;
    }

    return {
      ...newMessage,
      streak: streakInfo,
    };
  } catch (err) {
    console.warn('Neon Postgres sendMessage notice:', err.message);
  }

  return {
    id: msgId,
    senderId: currentUserId,
    text,
    type: messageData.type || 'text',
    timestamp: new Date().toISOString(),
    status: 'delivered',
    streak: streakInfo,
  };
};

// 6. Simulate Partner Snapping Back (Mutual Message triggers Snapstreak increase & marks user messages as read!)
export const simulatePartnerReplyApi = async (chatId, customText) => {
  const currentUserId = getCurrentUserId();
  const msgId = generateUuid();
  const replyText = customText || 'Snap back! Keeping our streak on fire 🔥⚡';

  let partnerId = null;
  let effectiveDisappearing = null;
  let streakInfo = {
    streakCount: 1,
    streakExtended: true,
    bothSentToday: true,
    streakExpiringSoon: false,
  };

  try {
    const sql = getNeonSql();
    const convRows = await sql`
      SELECT id, user_one_id, user_two_id, disappearing_setting, streak_count, streak_updated_at, streak_expires_at, user_one_last_sent, user_two_last_sent
      FROM conversations WHERE id = ${chatId} LIMIT 1;
    `;

    if (convRows.length > 0) {
      const conv = convRows[0];
      const isUserOne = conv.user_one_id === currentUserId;
      partnerId = isUserOne ? conv.user_two_id : conv.user_one_id;

      if (conv.disappearing_setting && conv.disappearing_setting !== 'off') {
        effectiveDisappearing = conv.disappearing_setting;
      }

      streakInfo = calculateSnapstreak({
        streakCount: conv.streak_count,
        streakUpdatedAt: conv.streak_updated_at,
        streakExpiresAt: conv.streak_expires_at,
        senderLastSent: isUserOne ? conv.user_one_last_sent : conv.user_two_last_sent,
        partnerLastSent: isUserOne ? conv.user_two_last_sent : conv.user_one_last_sent,
        isSending: true,
        isPartnerSending: true,
      });

      if (isUserOne) {
        await sql`
          UPDATE conversations
          SET 
            last_message_text = ${replyText},
            last_message_at = NOW(),
            updated_at = NOW(),
            streak_count = ${streakInfo.streakCount},
            streak_updated_at = ${streakInfo.streakUpdatedAt},
            streak_expires_at = ${streakInfo.streakExpiresAt},
            user_two_last_sent = NOW(),
            last_sender_id = ${partnerId}
          WHERE id = ${chatId};
        `;
      } else {
        await sql`
          UPDATE conversations
          SET 
            last_message_text = ${replyText},
            last_message_at = NOW(),
            updated_at = NOW(),
            streak_count = ${streakInfo.streakCount},
            streak_updated_at = ${streakInfo.streakUpdatedAt},
            streak_expires_at = ${streakInfo.streakExpiresAt},
            user_one_last_sent = NOW(),
            last_sender_id = ${partnerId}
          WHERE id = ${chatId};
        `;
      }
    }

    // Mark previous user messages as 'read' by partner!
    if (partnerId) {
      await sql`
        UPDATE messages
        SET status = 'read', seen_at = COALESCE(seen_at, NOW()), read_at = COALESCE(read_at, NOW())
        WHERE conversation_id = ${chatId}
          AND (sender_id::text != ${partnerId} OR sender_id IS NULL)
          AND (status != 'read' OR status IS NULL);
      `;
    }

    if (partnerId && isValidUuid(partnerId)) {
      await sql`
        INSERT INTO messages (
          id, conversation_id, sender_id, body, text, type, disappearing, status, created_at
        ) VALUES (
          ${msgId}::uuid, ${chatId}, ${partnerId}::uuid, ${replyText}, ${replyText}, 'text',
          ${effectiveDisappearing}, 'delivered', NOW()
        );
      `;
    } else {
      await sql`
        INSERT INTO messages (
          id, conversation_id, body, text, type, disappearing, status, created_at
        ) VALUES (
          ${msgId}::uuid, ${chatId}, ${replyText}, ${replyText}, 'text',
          ${effectiveDisappearing}, 'delivered', NOW()
        );
      `;
    }
  } catch (err) {
    console.warn('Neon Postgres simulatePartnerReply notice:', err.message);
  }

  const partnerMsg = {
    id: msgId,
    senderId: partnerId || 'partner',
    text: replyText,
    type: 'text',
    disappearing: effectiveDisappearing,
    timestamp: new Date().toISOString(),
    status: 'delivered',
  };

  await sleep(200);
  return {
    ...partnerMsg,
    streak: streakInfo,
  };
};

// 7. Safety Check-in Logged to Neon Lakebase Postgres
export const safetyCheckinApi = async ({ contactName, contactPhone, notes }) => {
  const currentUserId = getCurrentUserId();
  try {
    const sql = getNeonSql();
    await sql`
      INSERT INTO safety_checkins (user_id, contact_name, contact_phone, notes, created_at)
      VALUES (${currentUserId || 'user'}, ${contactName}, ${contactPhone}, ${notes || null}, NOW());
    `;
  } catch (err) {
    console.warn('Neon safetyCheckin notice:', err.message);
  }
  return { success: true };
};

// 8. Report User Logged to Neon Lakebase Postgres
export const reportUserApi = async ({ reportedUserId, reason, details }) => {
  const currentUserId = getCurrentUserId();
  const reportId = generateUuid();
  try {
    const sql = getNeonSql();
    if (isValidUuid(currentUserId) && isValidUuid(reportedUserId)) {
      await sql`
        INSERT INTO reports (
          id, reporter_id, reported_id, reported_user_id, reason, details, status, severity, created_at
        ) VALUES (
          ${reportId}::uuid, ${currentUserId}::uuid, ${reportedUserId}::uuid, ${reportedUserId},
          ${reason}, ${details || ''}, 'open', 'medium', NOW()
        );
      `;
    } else {
      await sql`
        INSERT INTO reports (
          id, reported_user_id, reason, details, status, severity, created_at
        ) VALUES (
          ${reportId}::uuid, ${reportedUserId}, ${reason}, ${details || ''}, 'open', 'medium', NOW()
        );
      `;
    }
  } catch (err) {
    console.warn('Neon reportUserApi notice:', err.message);
  }
  return { success: true, id: reportId };
};

export default {
  mapMessageRow,
  calculateSnapstreak,
  getConversationsApi,
  getConversationByIdApi,
  syncChatMessagesApi,
  updateDisappearingSettingApi,
  sendMessageApi,
  simulatePartnerReplyApi,
  safetyCheckinApi,
  reportUserApi,
};
