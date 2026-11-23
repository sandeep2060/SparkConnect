/**
 * GET  /api/admin/verify - Verification queue of pending ID/selfie docs
 * POST /api/admin/verify - Review submission (approve -> verified, reject -> pending)
 * CRITICAL: Verification decisions are logged to audit_logs
 */
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAdmin } from '../_lib/auth.js';
import { logAdminAction } from '../_lib/audit.js';
import { adminVerifySchema } from '../_lib/validation.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  try {
    const admin = await requireAdmin(req);

    // ==========================================
    // GET /api/admin/verify (List pending queue)
    // ==========================================
    if (req.method === 'GET') {
      const queue = await query(
        `SELECT 
          v.id,
          v.user_id,
          v.id_doc_url,
          v.selfie_url,
          v.status,
          v.review_note,
          v.created_at,
          u.email,
          u.display_name,
          u.pseudonym,
          u.dob,
          u.status AS user_status
         FROM verifications v
         JOIN users u ON u.id = v.user_id
         WHERE v.status = 'pending'
         ORDER BY v.created_at ASC`
      );

      return ok(res, { queue, count: queue.length });
    }

    // ==========================================
    // POST /api/admin/verify (Approve or Reject verification)
    // ==========================================
    if (req.method === 'POST') {
      const parsed = adminVerifySchema.safeParse(req.body);
      if (!parsed.success) {
        return fail(res, 422, parsed.error.issues[0]?.message || 'Validation failed');
      }

      const { user_id, status, review_note } = parsed.data;

      // Check user exists
      const userCheck = await query(`SELECT id, email, status FROM users WHERE id = $1`, [user_id]);
      if (!userCheck || userCheck.length === 0) {
        return fail(res, 404, 'User not found');
      }

      // Update verification document status
      await query(
        `UPDATE verifications
         SET status = $1,
             reviewer_id = $2,
             review_note = $3,
             reviewed_at = now()
         WHERE user_id = $4`,
        [status, admin.id, review_note || null, user_id]
      );

      // Business Rule 3: Admin approval -> status='verified' -> appears in feeds
      const targetUserStatus = status === 'approved' ? 'verified' : 'pending';
      await query(`UPDATE users SET status = $1, updated_at = now() WHERE id = $2`, [targetUserStatus, user_id]);

      // Log action to audit_logs
      await logAdminAction(admin.id, 'verify_user', 'user', user_id, {
        decision: status,
        assigned_status: targetUserStatus,
        review_note: review_note || null
      });

      return ok(res, {
        message: `User verification successfully ${status}. User status set to ${targetUserStatus}.`,
        user_id,
        status: targetUserStatus
      });
    }

    return fail(res, 405, 'Method Not Allowed. Use GET or POST.');
  } catch (err) {
    console.error('[ADMIN VERIFY ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Operation failed');
  }
}
