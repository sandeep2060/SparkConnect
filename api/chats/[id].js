/**
 * GET  /api/chats/:id - Retrieve messages & partner details (participants only)
 * POST /api/chats/:id - Send message (disallowed if blocked)
 */
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAuth } from '../_lib/auth.js';
import { messageSendSchema } from '../_lib/validation.js';
import { containsProfanity } from '../_lib/moderation.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const chatId = req.query?.id || req.url.split('?')[0].split('/').pop();

  if (!chatId || chatId === '[id].js') {
    return fail(res, 400, 'Chat ID is required');
  }

  try {
    const currentUser = await requireAuth(req);

    // 1. Fetch chat and verify user is participant
    const chatRows = await query(
      `SELECT c.id, c.user_a, c.user_b, c.created_at, c.last_message_at,
              CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END AS partner_id
       FROM chats c
       WHERE c.id = $2`,
      [currentUser.id, chatId]
    );

    if (!chatRows || chatRows.length === 0) {
      return fail(res, 404, 'Chat not found');
    }

    const chat = chatRows[0];

    // Privacy rule 5: Users can only read/write chats they participate in
    if (chat.user_a !== currentUser.id && chat.user_b !== currentUser.id && currentUser.role !== 'admin') {
      return fail(res, 403, 'Forbidden: You are not a participant in this conversation');
    }

    const partnerId = chat.partner_id;

    // 2. Check blocks
    const blockCheck = await query(
      `SELECT blocker_id, blocked_id FROM blocks
       WHERE (blocker_id = $1 AND blocked_id = $2)
          OR (blocker_id = $2 AND blocked_id = $1)`,
      [currentUser.id, partnerId]
    );

    const isBlocked = blockCheck.length > 0;
    const didIBlock = blockCheck.some(b => b.blocker_id === currentUser.id);

    // ==========================================
    // GET /api/chats/:id (Retrieve messages)
    // ==========================================
    if (req.method === 'GET') {
      // Mark unread messages sent by partner as read
      await query(
        `UPDATE messages
         SET read_at = now()
         WHERE chat_id = $1 AND sender_id = $2 AND read_at IS NULL`,
        [chatId, partnerId]
      );

      // Fetch messages ordered chronologically
      const messages = await query(
        `SELECT id, chat_id, sender_id, body, read_at, created_at
         FROM messages
         WHERE chat_id = $1
         ORDER BY created_at ASC`,
        [chatId]
      );

      // Fetch partner profile & stranger status
      const partnerRows = await query(
        `SELECT id, display_name, pseudonym, avatar_url, mode, hide_photo, status
         FROM users WHERE id = $1`,
        [partnerId]
      );
      const partnerUser = partnerRows[0] || {};

      // Check reveal status
      const revealCheck = await query(
        `SELECT status FROM reveal_requests
         WHERE (from_user = $1 AND to_user = $2)
            OR (from_user = $2 AND to_user = $1)
         ORDER BY created_at DESC LIMIT 1`,
        [currentUser.id, partnerId]
      );
      const isRevealed = revealCheck[0]?.status === 'approved';
      const isStranger = (partnerUser.mode === 'stranger' || partnerUser.hide_photo);

      const partner = {
        id: partnerUser.id,
        mode: partnerUser.mode,
        pseudonym: partnerUser.pseudonym,
        display_name: (isStranger && !isRevealed) ? null : partnerUser.display_name,
        avatar_url: (isStranger && !isRevealed) ? null : partnerUser.avatar_url,
        is_revealed: isRevealed || !isStranger
      };

      return ok(res, {
        chat_id: chatId,
        partner,
        is_blocked: isBlocked,
        did_i_block: didIBlock,
        can_send_message: !isBlocked,
        messages
      });
    }

    // ==========================================
    // POST /api/chats/:id (Send message)
    // ==========================================
    if (req.method === 'POST') {
      // Critical Business Rule: Blocking makes chat read-only
      if (isBlocked) {
        return fail(
          res,
          403,
          didIBlock
            ? 'You have blocked this member. Unblock them to resume messaging.'
            : 'You cannot send messages to this member because you have been blocked.'
        );
      }

      const parsed = messageSendSchema.safeParse(req.body);
      if (!parsed.success) {
        return fail(res, 422, parsed.error.issues[0]?.message || 'Invalid message content');
      }

      const { body } = parsed.data;

      // Profanity check on messages
      if (containsProfanity(body)) {
        return fail(res, 422, 'Message rejected: Prohibited predatory or scam language detected');
      }

      // Insert message
      const insertResult = await query(
        `INSERT INTO messages (chat_id, sender_id, body, created_at)
         VALUES ($1, $2, $3, now())
         RETURNING id, chat_id, sender_id, body, read_at, created_at`,
        [chatId, currentUser.id, body]
      );

      // Update last_message_at on chat
      await query(`UPDATE chats SET last_message_at = now() WHERE id = $1`, [chatId]);

      return ok(res, { message: insertResult[0] }, 201);
    }

    return fail(res, 405, 'Method Not Allowed. Use GET or POST.');
  } catch (err) {
    console.error('[CHATS DETAIL ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Operation failed');
  }
}
