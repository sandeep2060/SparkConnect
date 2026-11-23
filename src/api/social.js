import { sleep } from '../utils/helpers';
import { getNeonSql } from './neon';
import { mapUserRow } from './users';

// In-memory fallback state in case of offline/network interrupt
let memoryFriendships = [
  { senderId: 'current_user', receiverId: 'user_1', status: 'accepted' },
  { senderId: 'user_3', receiverId: 'current_user', status: 'pending' },
  { senderId: 'current_user', receiverId: 'user_5', status: 'pending' },
];

let memoryBlocks = [
  { blockerId: 'current_user', blockedId: 'user_4', reason: 'Inappropriate content' },
];

// 1. Get Relationship Status with a specific user
export const getRelationshipStatusApi = async (targetUserId) => {
  try {
    const sql = getNeonSql();
    // Check if blocked
    const blockRows = await sql`
      SELECT * FROM blocks
      WHERE (blocker_id = 'current_user' AND blocked_id = ${targetUserId})
         OR (blocker_id = ${targetUserId} AND blocked_id = 'current_user')
      LIMIT 1;
    `;

    const isBlocked = blockRows.length > 0;
    const blockedByMe = blockRows.some((b) => b.blocker_id === 'current_user');

    // Check friendship
    const friendRows = await sql`
      SELECT * FROM friendships
      WHERE (sender_id = 'current_user' AND receiver_id = ${targetUserId})
         OR (sender_id = ${targetUserId} AND receiver_id = 'current_user')
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
        friendshipStatus = f.sender_id === 'current_user' ? 'pending_sent' : 'pending_received';
      }
      if (f.streak_count) {
        streakCount = Number(f.streak_count) || 0;
      }
    }

    // Query active conversation streak if any
    try {
      const convRows = await sql`
        SELECT streak_count, streak_expires_at FROM conversations
        WHERE (user_one_id = 'current_user' AND user_two_id = ${targetUserId})
           OR (user_one_id = ${targetUserId} AND user_two_id = 'current_user')
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

  await sleep(150);
  const isBlocked = memoryBlocks.some(
    (b) => b.blockerId === 'current_user' && b.blockedId === targetUserId
  );
  const f = memoryFriendships.find(
    (item) =>
      (item.senderId === 'current_user' && item.receiverId === targetUserId) ||
      (item.senderId === targetUserId && item.receiverId === 'current_user')
  );

  let friendshipStatus = 'none';
  if (f) {
    if (f.status === 'accepted') friendshipStatus = 'friends';
    else if (f.status === 'pending') {
      friendshipStatus = f.senderId === 'current_user' ? 'pending_sent' : 'pending_received';
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
  try {
    const sql = getNeonSql();
    await sql`
      INSERT INTO friendships (sender_id, receiver_id, status, updated_at)
      VALUES ('current_user', ${targetUserId}, 'pending', NOW())
      ON CONFLICT (sender_id, receiver_id) DO UPDATE SET status = 'pending', updated_at = NOW();
    `;
  } catch (err) {
    console.warn('Neon send friend request notice:', err.message);
  }

  memoryFriendships = memoryFriendships.filter(
    (f) => !(f.senderId === 'current_user' && f.receiverId === targetUserId)
  );
  memoryFriendships.push({
    senderId: 'current_user',
    receiverId: targetUserId,
    status: 'pending',
  });

  await sleep(200);
  return { success: true, status: 'pending_sent' };
};

// 3. Accept Friend Request
export const acceptFriendRequestApi = async (targetUserId) => {
  try {
    const sql = getNeonSql();
    await sql`
      UPDATE friendships
      SET status = 'accepted', updated_at = NOW()
      WHERE (sender_id = ${targetUserId} AND receiver_id = 'current_user')
         OR (sender_id = 'current_user' AND receiver_id = ${targetUserId});
    `;
  } catch (err) {
    console.warn('Neon accept friend request notice:', err.message);
  }

  memoryFriendships = memoryFriendships.map((f) =>
    (f.senderId === targetUserId && f.receiverId === 'current_user') ||
    (f.senderId === 'current_user' && f.receiverId === targetUserId)
      ? { ...f, status: 'accepted' }
      : f
  );

  await sleep(200);
  return { success: true, status: 'friends' };
};

// 4. Reject or Cancel Friend Request
export const rejectFriendRequestApi = async (targetUserId) => {
  try {
    const sql = getNeonSql();
    await sql`
      DELETE FROM friendships
      WHERE (sender_id = ${targetUserId} AND receiver_id = 'current_user')
         OR (sender_id = 'current_user' AND receiver_id = ${targetUserId});
    `;
  } catch (err) {
    console.warn('Neon reject friend request notice:', err.message);
  }

  memoryFriendships = memoryFriendships.filter(
    (f) =>
      !(
        (f.senderId === targetUserId && f.receiverId === 'current_user') ||
        (f.senderId === 'current_user' && f.receiverId === targetUserId)
      )
  );

  await sleep(200);
  return { success: true, status: 'none' };
};

// 5. Unfriend user
export const unfriendApi = async (targetUserId) => {
  return rejectFriendRequestApi(targetUserId);
};

// 6. Block User
export const blockUserApi = async (targetUserId, reason = 'Blocked by user') => {
  try {
    const sql = getNeonSql();
    // Insert into blocks
    await sql`
      INSERT INTO blocks (blocker_id, blocked_id, reason, created_at)
      VALUES ('current_user', ${targetUserId}, ${reason}, NOW())
      ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
    `;
    // Also remove friendship if exists
    await sql`
      DELETE FROM friendships
      WHERE (sender_id = 'current_user' AND receiver_id = ${targetUserId})
         OR (sender_id = ${targetUserId} AND receiver_id = 'current_user');
    `;
  } catch (err) {
    console.warn('Neon block user notice:', err.message);
  }

  memoryBlocks = memoryBlocks.filter(
    (b) => !(b.blockerId === 'current_user' && b.blockedId === targetUserId)
  );
  memoryBlocks.push({ blockerId: 'current_user', blockedId: targetUserId, reason });

  memoryFriendships = memoryFriendships.filter(
    (f) =>
      !(
        (f.senderId === targetUserId && f.receiverId === 'current_user') ||
        (f.senderId === 'current_user' && f.receiverId === targetUserId)
      )
  );

  await sleep(200);
  return { success: true, isBlocked: true };
};

// 7. Unblock User
export const unblockUserApi = async (targetUserId) => {
  try {
    const sql = getNeonSql();
    await sql`
      DELETE FROM blocks
      WHERE blocker_id = 'current_user' AND blocked_id = ${targetUserId};
    `;
  } catch (err) {
    console.warn('Neon unblock user notice:', err.message);
  }

  memoryBlocks = memoryBlocks.filter(
    (b) => !(b.blockerId === 'current_user' && b.blockedId === targetUserId)
  );

  await sleep(200);
  return { success: true, isBlocked: false };
};

// 8. Get All Blocked Users (for SettingsPage)
export const getBlockedUsersApi = async () => {
  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT 
        b.id AS block_id, b.blocked_id, b.reason, b.created_at,
        u.name, u.username, u.pseudonym, u.avatar
      FROM blocks b
      JOIN users u ON u.id = b.blocked_id
      WHERE b.blocker_id = 'current_user'
      ORDER BY b.created_at DESC;
    `;

    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.blocked_id,
        name: r.name,
        username: r.username,
        pseudonym: r.pseudonym,
        avatar: r.avatar,
        reason: r.reason,
        blockedDate: new Date(r.created_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      }));
    }
  } catch (err) {
    console.warn('Neon get blocked users notice (using fallback):', err.message);
  }

  await sleep(200);
  return [
    { id: 'user_4', name: 'Damian Cruz', blockedDate: 'March 21, 2024' },
    { id: 'b2', name: 'Tyler Reed', blockedDate: 'February 28, 2024' },
  ];
};

// 9. Get Pending Friend Requests
export const getPendingFriendRequestsApi = async () => {
  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT 
        f.id AS request_id, f.sender_id, f.receiver_id, f.created_at,
        u.id AS user_id, u.name, u.username, u.pseudonym, u.avatar, u.mode, u.verified, u.location
      FROM friendships f
      JOIN users u ON u.id = f.sender_id
      WHERE f.receiver_id = 'current_user' AND f.status = 'pending'
      ORDER BY f.created_at DESC;
    `;

    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        requestId: r.request_id,
        sender: {
          id: r.user_id,
          name: r.name,
          username: r.username,
          pseudonym: r.pseudonym,
          avatar: r.avatar,
          mode: r.mode,
          verified: r.verified,
          location: r.location,
        },
        createdAt: r.created_at,
      }));
    }
  } catch (err) {
    console.warn('Neon get pending friend requests notice (using fallback):', err.message);
  }

  await sleep(200);
  return [
    {
      requestId: 'req_1',
      sender: {
        id: 'user_3',
        name: 'Sophia Thorne',
        username: 'sophia_thorne',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
        location: 'East Village, NY',
      },
      createdAt: new Date().toISOString(),
    },
  ];
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
