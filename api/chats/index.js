/**
 * GET /api/chats
 * Lists conversations for the authenticated user with partner details,
 * last message preview, unread counts, and privacy filters.
 */
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return fail(res, 405, 'Method Not Allowed. Use GET.');
  }

  try {
    const currentUser = await requireAuth(req);

    // Fetch all chats where user is participant
    const chats = await query(
      `SELECT 
        c.id,
        c.user_a,
        c.user_b,
        c.last_message_at,
        c.created_at,
        CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END AS partner_id,
        u.display_name,
        u.pseudonym,
        u.avatar_url,
        u.mode,
        u.hide_photo,
        u.status AS partner_status,
        -- Last message
        (
          SELECT json_build_object(
            'id', m.id,
            'body', m.body,
            'sender_id', m.sender_id,
            'read_at', m.read_at,
            'created_at', m.created_at
          )
          FROM messages m
          WHERE m.chat_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message,
        -- Unread count
        (
          SELECT count(*)::int
          FROM messages m
          WHERE m.chat_id = c.id 
            AND m.sender_id != $1 
            AND m.read_at IS NULL
        ) AS unread_count,
        -- Check if either user blocked the other
        EXISTS (
          SELECT 1 FROM blocks b
          WHERE (b.blocker_id = $1 AND b.blocked_id = (CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END))
             OR (b.blocker_id = (CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END) AND b.blocked_id = $1)
        ) AS is_blocked,
        -- Check reveal status
        (
          SELECT r.status FROM reveal_requests r
          WHERE (r.from_user = $1 AND r.to_user = (CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END))
             OR (r.from_user = (CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END) AND r.to_user = $1)
          ORDER BY r.created_at DESC LIMIT 1
        ) AS reveal_status
       FROM chats c
       JOIN users u ON u.id = (CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END)
       WHERE c.user_a = $1 OR c.user_b = $1
       ORDER BY c.last_message_at DESC`,
      [currentUser.id]
    );

    // Apply stranger-mode masking on partner if unrevealed
    const formattedChats = chats.map(c => {
      const isStranger = c.mode === 'stranger' || c.hide_photo;
      const isRevealed = c.reveal_status === 'approved';

      const partner = {
        id: c.partner_id,
        mode: c.mode,
        pseudonym: c.pseudonym,
        display_name: (isStranger && !isRevealed) ? null : c.display_name,
        avatar_url: (isStranger && !isRevealed) ? null : c.avatar_url,
        is_revealed: isRevealed || !isStranger
      };

      return {
        id: c.id,
        partner,
        last_message: c.last_message,
        unread_count: c.unread_count,
        is_blocked: c.is_blocked,
        last_message_at: c.last_message_at,
        created_at: c.created_at
      };
    });

    return ok(res, { chats: formattedChats, count: formattedChats.length });
  } catch (err) {
    console.error('[CHATS INDEX ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Failed to retrieve conversations');
  }
}
