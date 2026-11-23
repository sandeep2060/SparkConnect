/**
 * POST /api/users/reveal - Request identity reveal from a stranger-mode user
 * GET  /api/users/reveal - List incoming and outgoing reveal requests
 * PATCH /api/users/reveal - Approve or decline an incoming reveal request
 */
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAuth } from '../_lib/auth.js';
import { revealRequestSchema, revealResponseSchema } from '../_lib/validation.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  try {
    const currentUser = await requireAuth(req);

    // ==========================================
    // POST /api/users/reveal (Send reveal request)
    // ==========================================
    if (req.method === 'POST') {
      const parsed = revealRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return fail(res, 422, parsed.error.issues[0]?.message || 'Invalid target user UUID');
      }

      const { to_user } = parsed.data;

      if (currentUser.id === to_user) {
        return fail(res, 400, 'You cannot send a reveal request to yourself');
      }

      // Check target exists
      const targetUser = await query(`SELECT id, mode, pseudonym FROM users WHERE id = $1`, [to_user]);
      if (!targetUser || targetUser.length === 0) {
        return fail(res, 404, 'Target user does not exist');
      }

      // Check existing reveal request in either direction
      const existing = await query(
        `SELECT id, status, from_user, to_user FROM reveal_requests
         WHERE (from_user = $1 AND to_user = $2)
            OR (from_user = $2 AND to_user = $1)`,
        [currentUser.id, to_user]
      );

      if (existing.length > 0) {
        const reqRow = existing[0];
        if (reqRow.status === 'approved') {
          return fail(res, 400, 'Profiles are already revealed');
        }
        if (reqRow.status === 'pending') {
          return fail(res, 409, 'A reveal request is already pending between you and this member');
        }
        // If declined before, allow re-requesting by updating status back to pending
        const updated = await query(
          `UPDATE reveal_requests
           SET status = 'pending', from_user = $1, to_user = $2, created_at = now()
           WHERE id = $3
           RETURNING id, from_user, to_user, status, created_at`,
          [currentUser.id, to_user, reqRow.id]
        );
        return ok(res, { request: updated[0] }, 201);
      }

      // Insert new reveal request
      const inserted = await query(
        `INSERT INTO reveal_requests (from_user, to_user, status)
         VALUES ($1, $2, 'pending')
         RETURNING id, from_user, to_user, status, created_at`,
        [currentUser.id, to_user]
      );

      return ok(res, { request: inserted[0] }, 201);
    }

    // ==========================================
    // GET /api/users/reveal (List pending/active requests)
    // ==========================================
    if (req.method === 'GET') {
      // Incoming requests (I am to_user)
      const incoming = await query(
        `SELECT r.id, r.from_user, r.status, r.created_at,
                u.display_name, u.pseudonym, u.avatar_url, u.mode, u.gender
         FROM reveal_requests r
         JOIN users u ON u.id = r.from_user
         WHERE r.to_user = $1
         ORDER BY r.created_at DESC`,
        [currentUser.id]
      );

      // Outgoing requests (I am from_user)
      const outgoing = await query(
        `SELECT r.id, r.to_user, r.status, r.created_at,
                u.pseudonym, u.mode
         FROM reveal_requests r
         JOIN users u ON u.id = r.to_user
         WHERE r.from_user = $1
         ORDER BY r.created_at DESC`,
        [currentUser.id]
      );

      return ok(res, { incoming, outgoing });
    }

    // ==========================================
    // PATCH /api/users/reveal (Approve or Decline request)
    // ==========================================
    if (req.method === 'PATCH') {
      const parsed = revealResponseSchema.safeParse(req.body);
      if (!parsed.success) {
        return fail(res, 422, parsed.error.issues[0]?.message || 'Invalid input');
      }

      const { request_id, status } = parsed.data;

      // Ensure the request was addressed to current user
      const existing = await query(
        `SELECT id, from_user, to_user, status FROM reveal_requests WHERE id = $1`,
        [request_id]
      );

      if (!existing || existing.length === 0) {
        return fail(res, 404, 'Reveal request not found');
      }

      if (existing[0].to_user !== currentUser.id) {
        return fail(res, 403, 'You are not authorized to respond to this reveal request');
      }

      const updated = await query(
        `UPDATE reveal_requests
         SET status = $1
         WHERE id = $2
         RETURNING id, from_user, to_user, status`,
        [status, request_id]
      );

      return ok(res, {
        message: `Reveal request has been ${status}`,
        request: updated[0]
      });
    }

    return fail(res, 405, 'Method Not Allowed. Use POST, GET, or PATCH.');
  } catch (err) {
    console.error('[REVEAL ROUTE ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Operation failed');
  }
}
