/**
 * POST /api/chats/start
 * Initiates or retrieves an existing conversation between two users
 */
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAuth } from '../_lib/auth.js';
import { chatStartSchema } from '../_lib/validation.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return fail(res, 405, 'Method Not Allowed. Use POST.');
  }

  try {
    const currentUser = await requireAuth(req);

    const parsed = chatStartSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 422, parsed.error.issues[0]?.message || 'Invalid target user UUID');
    }

    const { target_user_id } = parsed.data;

    if (currentUser.id === target_user_id) {
      return fail(res, 400, 'Cannot start a conversation with yourself');
    }

    // Check if target user exists and is not banned
    const targetCheck = await query(
      `SELECT id, status, mode, pseudonym, display_name FROM users WHERE id = $1`,
      [target_user_id]
    );

    if (!targetCheck || targetCheck.length === 0 || targetCheck[0].status === 'banned') {
      return fail(res, 404, 'Target user does not exist or has been removed');
    }

    // Check blocks in either direction
    const blockCheck = await query(
      `SELECT 1 FROM blocks
       WHERE (blocker_id = $1 AND blocked_id = $2)
          OR (blocker_id = $2 AND blocked_id = $1)`,
      [currentUser.id, target_user_id]
    );

    if (blockCheck.length > 0) {
      return fail(res, 403, 'Cannot start conversation with a blocked member');
    }

    // Order user_a and user_b strictly: user_a < user_b
    const [user_a, user_b] = currentUser.id < target_user_id
      ? [currentUser.id, target_user_id]
      : [target_user_id, currentUser.id];

    // Check existing chat
    const existing = await query(
      `SELECT id, user_a, user_b, created_at, last_message_at
       FROM chats
       WHERE user_a = $1 AND user_b = $2`,
      [user_a, user_b]
    );

    if (existing.length > 0) {
      return ok(res, { chat: existing[0], created: false });
    }

    // Create new chat
    const created = await query(
      `INSERT INTO chats (user_a, user_b, created_at, last_message_at)
       VALUES ($1, $2, now(), now())
       RETURNING id, user_a, user_b, created_at, last_message_at`,
      [user_a, user_b]
    );

    return ok(res, { chat: created[0], created: true }, 201);
  } catch (err) {
    console.error('[CHATS START ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Failed to start conversation');
  }
}
