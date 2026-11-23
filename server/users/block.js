/**
 * POST /api/users/block - Block a user (disappears from feed, disables chatting)
 * DELETE /api/users/block - Unblock a user
 * GET /api/users/block - List blocked users
 */
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAuth } from '../_lib/auth.js';
import { blockUserSchema } from '../_lib/validation.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  try {
    const currentUser = await requireAuth(req);

    // ==========================================
    // POST /api/users/block (Block user)
    // ==========================================
    if (req.method === 'POST') {
      const parsed = blockUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return fail(res, 422, parsed.error.issues[0]?.message || 'Invalid user UUID');
      }

      const { blocked_id } = parsed.data;

      if (currentUser.id === blocked_id) {
        return fail(res, 400, 'You cannot block yourself');
      }

      await query(
        `INSERT INTO blocks (blocker_id, blocked_id)
         VALUES ($1, $2)
         ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
        [currentUser.id, blocked_id]
      );

      return ok(res, {
        message: 'User blocked successfully. They will no longer appear in your feed or be able to message you.',
        blocked: true,
        blocked_id
      });
    }

    // ==========================================
    // DELETE /api/users/block (Unblock user)
    // ==========================================
    if (req.method === 'DELETE') {
      const parsed = blockUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return fail(res, 422, parsed.error.issues[0]?.message || 'Invalid user UUID');
      }

      const { blocked_id } = parsed.data;

      await query(
        `DELETE FROM blocks
         WHERE blocker_id = $1 AND blocked_id = $2`,
        [currentUser.id, blocked_id]
      );

      return ok(res, {
        message: 'User unblocked successfully',
        blocked: false,
        blocked_id
      });
    }

    // ==========================================
    // GET /api/users/block (List blocked users)
    // ==========================================
    if (req.method === 'GET') {
      const blockedList = await query(
        `SELECT b.blocked_id, b.created_at,
                u.display_name, u.pseudonym, u.avatar_url, u.mode
         FROM blocks b
         JOIN users u ON u.id = b.blocked_id
         WHERE b.blocker_id = $1
         ORDER BY b.created_at DESC`,
        [currentUser.id]
      );

      return ok(res, { blocked_users: blockedList });
    }

    return fail(res, 405, 'Method Not Allowed. Use POST, DELETE, or GET.');
  } catch (err) {
    console.error('[BLOCK ROUTE ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Operation failed');
  }
}
