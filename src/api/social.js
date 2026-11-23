import { sleep } from '../utils/helpers';
import { getNeonSql } from './neon';
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

// In-memory fallback state in case of offline/network interrupt
let memoryFriendships = [];
let memoryBlocks = [];

// 1. Get Relationship Status with a specific user
export const getRelationshipStatusApi = async (targetUserId) => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return {
      isBlocked: false,
      blockedByMe: false,
      friendshipStatus: 'none',
      requestId: null,
      streakCount: 0,
    };
  }

  try {
    const sql = getNeonSql();
    let isBlocked = false;
    let blockedByMe = false;

    // Check if blocked (requires UUIDs)
    if (isValidUuid(currentUserId) && isValidUuid(targetUserId)) {
      const blockRows = await sql`
        SELECT blocker_id, blocked_id FROM blocks
        WHERE (blocker_id = ${currentUserId}::uuid AND blocked_id = ${targetUserId}::uuid)
           OR (blocker_id = ${targetUserId}::uuid AND blocked_id = ${currentUserId}::uuid)
        LIMIT 1;
      `;
      if (blockRows.length > 0) {
        isBlocked = true;
        blockedByMe = blockRows.some((b) => b.blocker_id === currentUserId);
      }
    }

    // Check friendship (sender_id and receiver_id)
    const friendRows = await sql`
      SELECT id, sender_id, receiver_id, status, streak_count
      FROM friendships
      WHERE (sender_id = ${currentUserId} AND receiver_id = ${targetUserId})
         OR (sender_id = ${targetUserId} AND receiver_id = ${currentUserId})
      LIMIT 1;
    `;

    let friendshipStatus = 'none';
    let requestId = null;
    let streakCount = 0;

    if (friendRows.length > 0) {
      const f = friendRows[0];
      requestId = f.id;
      if (f.status === 'accepted') {
        friendshipStatus = 'friends';
      } else if (f.status === 'pending') {
        friendshipStatus = f.sender_id === currentUserId ? 'pending_sent' : 'pending_received';
      }
      if (f.streak_count) {
        streakCount = Number(f.streak_count) || 0;
      }
    }

    // Query active conversation streak if any
    try {
      const convRows = await sql`
        SELECT streak_count, streak_expires_at FROM conversations
        WHERE (user_one_id = ${currentUserId} AND user_two_id = ${targetUserId})
           OR (user_one_id = ${targetUserId} AND user_two_id = ${currentUserId})
        LIMIT 1;
      `;
      if (convRows.length > 0 && convRows[0].streak_count) {
        const expires = convRows[0].streak_expires_at ? new Date(convRows[0].streak_expires_at) : null;
        if (!expires || new Date().getTime() <= expires.getTime()) {
          streakCount = Math.max(streakCount, Number(convRows[0].streak_count) || 0);
        }
      }
    } catch {}

    return {
      isBlocked,
      blockedByMe,
      friendshipStatus, // 'none' | 'pending_sent' | 'pending_received' | 'friends'
      requestId,
      streakCount,
    };
  } catch (err) {
    console.warn('Neon relationship status notice (using fallback):', err.message);
  }

  await sleep(100);
  const isBlocked = memoryBlocks.some(
    (b) => b.blockerId === currentUserId && b.blockedId === targetUserId
  );
  const f = memoryFriendships.find(
    (item) =>
      (item.senderId === currentUserId && item.receiverId === targetUserId) ||
      (item.senderId === targetUserId && item.receiverId === currentUserId)
  );

  let friendshipStatus = 'none';
  if (f) {
    if (f.status === 'accepted') friendshipStatus = 'friends';
    else if (f.status === 'pending') {
      friendshipStatus = f.senderId === currentUserId ? 'pending_sent' : 'pending_received';
    }
  }

  return {
    isBlocked,
    blockedByMe: isBlocked,
    friendshipStatus,
    requestId: 'mem_' + Date.now(),
    streakCount: 0,
  };
};

// 2. Send Friend Request to user
export const sendFriendRequestApi = async (targetUserId) => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return { success: false, status: 'none' };
  }

  try {
    const sql = getNeonSql();
    await sql`
      INSERT INTO friendships (sender_id, receiver_id, status, created_at, updated_at)
      VALUES (${currentUserId}, ${targetUserId}, 'pending', NOW(), NOW())
      ON CONFLICT (sender_id, receiver_id)
      DO UPDATE SET status = 'pending', updated_at = NOW();
    `;
    return { success: true, status: 'pending_sent' };
  } catch (err) {
    console.warn('Neon send friend request notice:', err.message);
  }

  memoryFriendships = memoryFriendships.filter(
    (f) => !(f.senderId === currentUserId && f.receiverId === targetUserId)
  );
  memoryFriendships.push({
    senderId: currentUserId,
    receiverId: targetUserId,
    status: 'pending',
  });

  await sleep(150);
  return { success: true, status: 'pending_sent' };
};

// 3. Accept Friend Request
export const acceptFriendRequestApi = async (targetUserId) => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId || !targetUserId) {
    return { success: false, status: 'none' };
  }

  try {
    const sql = getNeonSql();
    // 1. Update friendship to accepted
    await sql`
      UPDATE friendships
      SET status = 'accepted', updated_at = NOW()
      WHERE (sender_id = ${targetUserId} AND receiver_id = ${currentUserId})
         OR (sender_id = ${currentUserId} AND receiver_id = ${targetUserId});
    `;

    // 2. Ensure a direct conversation exists between both users
    const existingConv = await sql`
      SELECT id FROM conversations
      WHERE (user_one_id = ${currentUserId} AND user_two_id = ${targetUserId})
         OR (user_one_id = ${targetUserId} AND user_two_id = ${currentUserId})
      LIMIT 1;
    `;

    let convId = existingConv.length > 0 ? existingConv[0].id : null;
    if (!convId) {
      convId = generateUuid();
      await sql`
        INSERT INTO conversations (
          id, user_one_id, user_two_id, disappearing_setting, streak_count, created_at, updated_at
        ) VALUES (
          ${convId}, ${currentUserId}, ${targetUserId}, 'off', 0, NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    return { success: true, status: 'friends', conversationId: convId };
  } catch (err) {
    console.warn('Neon accept friend request notice:', err.message);
  }

  memoryFriendships = memoryFriendships.map((f) =>
    (f.senderId === targetUserId && f.receiverId === currentUserId) ||
    (f.senderId === currentUserId && f.receiverId === targetUserId)
      ? { ...f, status: 'accepted' }
      : f
  );

  await sleep(150);
  return { success: true, status: 'friends' };
};

// 4. Reject or Cancel Friend Request
export const rejectFriendRequestApi = async (targetUserId) => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId || !targetUserId) return { success: false, status: 'none' };

  try {
    const sql = getNeonSql();
    await sql`
      DELETE FROM friendships
      WHERE (sender_id = ${targetUserId} AND receiver_id = ${currentUserId})
         OR (sender_id = ${currentUserId} AND receiver_id = ${targetUserId});
    `;
    return { success: true, status: 'none' };
  } catch (err) {
    console.warn('Neon reject friend request notice:', err.message);
  }

  memoryFriendships = memoryFriendships.filter(
    (f) =>
      !(
        (f.senderId === targetUserId && f.receiverId === currentUserId) ||
        (f.senderId === currentUserId && f.receiverId === targetUserId)
      )
  );

  await sleep(150);
  return { success: true, status: 'none' };
};

// 5. Unfriend user
export const unfriendApi = async (targetUserId) => {
  return rejectFriendRequestApi(targetUserId);
};

// 6. Block User
export const blockUserApi = async (targetUserId, reason = 'Blocked by user') => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId || !targetUserId) return { success: false, isBlocked: false };

  try {
    const sql = getNeonSql();
    if (isValidUuid(currentUserId) && isValidUuid(targetUserId)) {
      await sql`
        INSERT INTO blocks (blocker_id, blocked_id, created_at)
        VALUES (${currentUserId}::uuid, ${targetUserId}::uuid, NOW())
        ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
      `;
    }
    // Delete friendship
    await sql`
      DELETE FROM friendships
      WHERE (sender_id = ${currentUserId} AND receiver_id = ${targetUserId})
         OR (sender_id = ${targetUserId} AND receiver_id = ${currentUserId});
    `;
    return { success: true, isBlocked: true };
  } catch (err) {
    console.warn('Neon block user notice:', err.message);
  }

  memoryBlocks = memoryBlocks.filter(
    (b) => !(b.blockerId === currentUserId && b.blockedId === targetUserId)
  );
  memoryBlocks.push({ blockerId: currentUserId, blockedId: targetUserId, reason });

  await sleep(150);
  return { success: true, isBlocked: true };
};

// 7. Unblock User
export const unblockUserApi = async (targetUserId) => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId || !targetUserId) return { success: false, isBlocked: false };

  try {
    const sql = getNeonSql();
    if (isValidUuid(currentUserId) && isValidUuid(targetUserId)) {
      await sql`
        DELETE FROM blocks
        WHERE blocker_id = ${currentUserId}::uuid AND blocked_id = ${targetUserId}::uuid;
      `;
    }
    return { success: true, isBlocked: false };
  } catch (err) {
    console.warn('Neon unblock user notice:', err.message);
  }

  memoryBlocks = memoryBlocks.filter(
    (b) => !(b.blockerId === currentUserId && b.blockedId === targetUserId)
  );

  await sleep(150);
  return { success: true, isBlocked: false };
};

// 8. Get All Blocked Users (for SettingsPage)
export const getBlockedUsersApi = async () => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId || !isValidUuid(currentUserId)) return [];

  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT 
        b.blocked_id, b.created_at,
        u.name, u.display_name, u.username, u.pseudonym, u.avatar
      FROM blocks b
      JOIN users u ON u.id = b.blocked_id
      WHERE b.blocker_id = ${currentUserId}::uuid
      ORDER BY b.created_at DESC;
    `;

    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.blocked_id,
        name: r.name || r.display_name || r.username,
        username: r.username,
        pseudonym: r.pseudonym,
        avatar: r.avatar,
        reason: 'Blocked',
        blockedDate: new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      }));
    }
    return [];
  } catch (err) {
    console.warn('Neon get blocked users notice (using fallback):', err.message);
  }

  return [];
};

// 9. Get Pending Friend Requests
export const getPendingFriendRequestsApi = async () => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return [];

  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT 
        f.id AS request_id, f.sender_id, f.receiver_id, f.created_at,
        u.id AS user_id, u.name, u.display_name, u.username, u.pseudonym, u.avatar, u.mode, u.verified, u.city, u.location
      FROM friendships f
      JOIN users u ON u.id::text = f.sender_id
      WHERE f.receiver_id = ${currentUserId} AND f.status = 'pending'
      ORDER BY f.created_at DESC;
    `;

    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        requestId: r.request_id,
        sender: {
          id: r.user_id,
          name: r.name || r.display_name || r.username,
          username: r.username,
          pseudonym: r.pseudonym,
          avatar: r.avatar,
          mode: r.mode,
          verified: r.verified,
          location: r.location || r.city || '',
        },
        createdAt: r.created_at,
      }));
    }
    return [];
  } catch (err) {
    console.warn('Neon get pending friend requests notice (using fallback):', err.message);
  }

  return [];
};

export default {
  getRelationshipStatusApi,
  sendFriendRequestApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
  unfriendApi,
  blockUserApi,
  unblockUserApi,
  getBlockedUsersApi,
  getPendingFriendRequestsApi,
};
