import { sleep } from '../utils/helpers';
import { MOCK_CHATS, MOCK_USERS } from '../utils/mockData';
import { getNeonSql } from './neon';
import { mapUserRow } from './users';

let chatsMemoryFallback = [];

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
  const gracePeriodMs = 36 * 60 * 60 * 1000; // 36-hour grace window like Snapchat

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

  // Did the OTHER party send a message within the active window?
  const otherPersonSentRecently = isPartnerSending
    ? senderMs > 0 && (nowMs - senderMs <= gracePeriodMs)
    : partnerMs > 0 && (nowMs - partnerMs <= gracePeriodMs);

  const bothSentRecently = senderMs > 0 && (nowMs - senderMs <= gracePeriodMs) &&
                           partnerMs > 0 && (nowMs - partnerMs <= gracePeriodMs);

  const alreadyExtendedToday = updated && (now.toDateString() === updated.toDateString());

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
  const streakExpiringSoon = currentStreak > 0 && msRemaining !== null && msRemaining <= (6 * 60 * 60 * 1000);

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

// 1. Get All Conversations from Neon Lakebase Postgres
export const getConversationsApi = async () => {
  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT 
        c.id, c.user_one_id, c.user_two_id, c.disappearing_setting, c.unread_count, c.created_at,
        c.streak_count, c.streak_updated_at, c.streak_expires_at,
        c.user_one_last_sent, c.user_two_last_sent, c.last_sender_id,
        u.id AS partner_id, u.name AS partner_name, u.username AS partner_username,
        u.pseudonym AS partner_pseudonym, u.avatar AS partner_avatar, u.mode AS partner_mode,
        u.active_now AS partner_active_now, u.last_seen AS partner_last_seen,
        u.verified AS partner_verified, u.bio AS partner_bio, u.nature AS partner_nature,
        (
          SELECT json_build_object(
            'id', m.id,
            'text', m.text,
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
      JOIN users u ON u.id = CASE WHEN c.user_one_id = 'current_user' THEN c.user_two_id ELSE c.user_one_id END
      ORDER BY c.updated_at DESC;
    `;

    if (rows && rows.length > 0) {
      return rows.map((r) => {
        const streakCalc = calculateSnapstreak({
          streakCount: r.streak_count,
          streakUpdatedAt: r.streak_updated_at,
          streakExpiresAt: r.streak_expires_at,
          senderLastSent: r.user_one_last_sent,
          partnerLastSent: r.user_two_last_sent,
        });

        return {
          id: r.id,
          partner: {
            id: r.partner_id,
            name: r.partner_name,
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

// 2. Get Single Conversation with Messages from Neon Lakebase Postgres
export const getConversationByIdApi = async (chatId) => {
  try {
    const sql = getNeonSql();
    const convRows = await sql`
      SELECT 
        c.id, c.user_one_id, c.user_two_id, c.disappearing_setting, c.unread_count,
        c.streak_count, c.streak_updated_at, c.streak_expires_at,
        c.user_one_last_sent, c.user_two_last_sent, c.last_sender_id,
        u.id AS partner_id, u.name AS partner_name, u.username AS partner_username,
        u.pseudonym AS partner_pseudonym, u.avatar AS partner_avatar, u.mode AS partner_mode,
        u.active_now AS partner_active_now, u.last_seen AS partner_last_seen,
        u.verified AS partner_verified, u.bio AS partner_bio
      FROM conversations c
      JOIN users u ON u.id = CASE WHEN c.user_one_id = 'current_user' THEN c.user_two_id ELSE c.user_one_id END
      WHERE c.id = ${chatId}
      LIMIT 1;
    `;

    if (convRows && convRows.length > 0) {
      const conv = convRows[0];
      const msgRows = await sql`
        SELECT * FROM messages
        WHERE conversation_id = ${chatId}
        ORDER BY created_at ASC;
      `;

      const streakCalc = calculateSnapstreak({
        streakCount: conv.streak_count,
        streakUpdatedAt: conv.streak_updated_at,
        streakExpiresAt: conv.streak_expires_at,
        senderLastSent: conv.user_one_last_sent,
        partnerLastSent: conv.user_two_last_sent,
      });

      return {
        id: conv.id,
        partner: {
          id: conv.partner_id,
          name: conv.partner_name,
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
        messages: msgRows.map((m) => ({
          id: m.id,
          senderId: m.sender_id,
          text: m.text,
          type: m.type,
          viewLimit: m.view_limit,
          viewsRemaining: m.views_remaining,
          mediaUrl: m.media_url,
          audioDuration: m.audio_duration,
          disappearing: m.disappearing,
          timestamp: m.created_at,
          status: m.status || 'delivered',
        })),
      };
    }
  } catch (err) {
    console.warn('Neon Postgres conversation messages notice:', err.message);
  }

  // Memory fallback if row not created yet
  let chat = chatsMemoryFallback.find((c) => c.id === chatId);
  if (!chat) {
    chat = {
      id: chatId,
      partner: {
        id: chatId,
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

// 3. Send Message to Neon Lakebase Postgres (Updates Snapstreak)
export const sendMessageApi = async (chatId, payload) => {
  const messageData = typeof payload === 'string' ? { text: payload } : payload;
  const msgId = 'msg_' + Date.now();

  const newMessage = {
    id: msgId,
    senderId: 'current_user',
    text: messageData.text || '',
    type: messageData.type || 'text',
    viewLimit: messageData.viewLimit || 1,
    viewsRemaining: messageData.viewsRemaining !== undefined ? messageData.viewsRemaining : messageData.viewLimit || 1,
    mediaUrl: messageData.mediaUrl || null,
    audioDuration: messageData.audioDuration || null,
    disappearing: messageData.disappearing || null,
    timestamp: new Date().toISOString(),
    status: 'delivered',
    seenStatusText: 'Delivered',
  };

  let streakInfo = {
    streakCount: 0,
    streakExtended: false,
    bothSentToday: false,
    streakExpiringSoon: false,
  };

  try {
    const sql = getNeonSql();

    // Query existing conversation streak values
    const convRows = await sql`
      SELECT streak_count, streak_updated_at, streak_expires_at, user_one_last_sent, user_two_last_sent
      FROM conversations WHERE id = ${chatId} LIMIT 1;
    `;

    const conv = convRows[0] || {};
    streakInfo = calculateSnapstreak({
      streakCount: conv.streak_count,
      streakUpdatedAt: conv.streak_updated_at,
      streakExpiresAt: conv.streak_expires_at,
      senderLastSent: conv.user_one_last_sent,
      partnerLastSent: conv.user_two_last_sent,
      isSending: true,
      isPartnerSending: false,
    });

    // Ensure conversation exists & update streak
    await sql`
      INSERT INTO conversations (
        id, user_one_id, user_two_id, disappearing_setting,
        streak_count, streak_updated_at, streak_expires_at,
        user_one_last_sent, last_sender_id, updated_at
      ) VALUES (
        ${chatId}, 'current_user', ${chatId}, ${messageData.disappearing || 'off'},
        ${streakInfo.streakCount}, ${streakInfo.streakUpdatedAt}, ${streakInfo.streakExpiresAt},
        NOW(), 'current_user', NOW()
      )
      ON CONFLICT (id) DO UPDATE SET 
        updated_at = NOW(),
        streak_count = ${streakInfo.streakCount},
        streak_updated_at = ${streakInfo.streakUpdatedAt},
        streak_expires_at = ${streakInfo.streakExpiresAt},
        user_one_last_sent = NOW(),
        last_sender_id = 'current_user';
    `;

    // Insert Message
    await sql`
      INSERT INTO messages (
        id, conversation_id, sender_id, type, text, media_url,
        view_limit, views_remaining, audio_duration, disappearing, status, created_at
      ) VALUES (
        ${msgId}, ${chatId}, 'current_user', ${newMessage.type},
        ${newMessage.text}, ${newMessage.mediaUrl}, ${newMessage.viewLimit},
        ${newMessage.viewsRemaining}, ${newMessage.audioDuration},
        ${newMessage.disappearing}, 'delivered', NOW()
      );
    `;
  } catch (err) {
    console.warn('Neon Postgres sendMessage notice:', err.message);
  }

  // Memory fallback update
  const targetIndex = chatsMemoryFallback.findIndex((c) => c.id === chatId);
  if (targetIndex !== -1) {
    chatsMemoryFallback[targetIndex].messages.push(newMessage);
    chatsMemoryFallback[targetIndex].streakCount = streakInfo.streakCount;
    chatsMemoryFallback[targetIndex].bothSentToday = streakInfo.bothSentToday;
    chatsMemoryFallback[targetIndex].streakExpiringSoon = streakInfo.streakExpiringSoon;
  }

  await sleep(200);
  return {
    ...newMessage,
    streak: streakInfo,
  };
};

// 4. Simulate Partner Snapping Back (Mutual Message triggers Snapstreak increase!)
export const simulatePartnerReplyApi = async (chatId, customText) => {
  const msgId = 'msg_partner_' + Date.now();
  const replyText = customText || 'Snap back! Keeping our streak on fire 🔥⚡';

  const partnerMsg = {
    id: msgId,
    senderId: chatId,
    text: replyText,
    type: 'text',
    timestamp: new Date().toISOString(),
    status: 'delivered',
  };

  let streakInfo = {
    streakCount: 1,
    streakExtended: true,
    bothSentToday: true,
    streakExpiringSoon: false,
  };

  try {
    const sql = getNeonSql();
    const convRows = await sql`
      SELECT streak_count, streak_updated_at, streak_expires_at, user_one_last_sent, user_two_last_sent
      FROM conversations WHERE id = ${chatId} LIMIT 1;
    `;

    const conv = convRows[0] || {};
    streakInfo = calculateSnapstreak({
      streakCount: conv.streak_count,
      streakUpdatedAt: conv.streak_updated_at,
      streakExpiresAt: conv.streak_expires_at,
      senderLastSent: conv.user_one_last_sent,
      partnerLastSent: conv.user_two_last_sent,
      isSending: true,
      isPartnerSending: true, // Partner is replying!
    });

    await sql`
      UPDATE conversations
      SET 
        updated_at = NOW(),
        streak_count = ${streakInfo.streakCount},
        streak_updated_at = ${streakInfo.streakUpdatedAt},
        streak_expires_at = ${streakInfo.streakExpiresAt},
        user_two_last_sent = NOW(),
        last_sender_id = ${chatId}
      WHERE id = ${chatId};
    `;

    await sql`
      INSERT INTO messages (
        id, conversation_id, sender_id, type, text, status, created_at
      ) VALUES (
        ${msgId}, ${chatId}, ${chatId}, 'text', ${replyText}, 'delivered', NOW()
      );
    `;
  } catch (err) {
    console.warn('Neon Postgres simulatePartnerReply notice:', err.message);
  }

  const targetIndex = chatsMemoryFallback.findIndex((c) => c.id === chatId);
  if (targetIndex !== -1) {
    chatsMemoryFallback[targetIndex].messages.push(partnerMsg);
    chatsMemoryFallback[targetIndex].streakCount = streakInfo.streakCount;
    chatsMemoryFallback[targetIndex].bothSentToday = true;
  }

  await sleep(300);
  return {
    ...partnerMsg,
    streak: streakInfo,
  };
};

// 5. Safety Check-in Logged to Neon Lakebase Postgres
export const safetyCheckinApi = async ({ contactName, contactPhone, notes }) => {
  try {
    const sql = getNeonSql();
    await sql`
      INSERT INTO safety_checkins (user_id, contact_name, contact_phone, notes, created_at)
      VALUES ('current_user', ${contactName}, ${contactPhone}, ${notes || null}, NOW());
    `;
  } catch (err) {
    console.warn('Neon safetyCheckin notice:', err.message);
  }
  return { success: true };
};

// 6. Report User Logged to Neon Lakebase Postgres
export const reportUserApi = async ({ reportedUserId, reason, details }) => {
  const reportId = 'rep_' + Date.now();
  try {
    const sql = getNeonSql();
    await sql`
      INSERT INTO reports (
        id, reporter_id, reported_user_id, reason, details, status, severity, created_at
      ) VALUES (
        ${reportId}, 'current_user', ${reportedUserId}, ${reason}, ${details || ''}, 'open', 'medium', NOW()
      );
    `;
  } catch (err) {
    console.warn('Neon reportUserApi notice:', err.message);
  }
  return { success: true, id: reportId };
};
