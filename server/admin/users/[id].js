/**
 * GET   /api/admin/users/:id - Detailed user profile with verification docs and reports
 * PATCH /api/admin/users/:id - Moderation actions (verify, ban, unban, change role)
 * CRITICAL: All administrative mutations MUST be logged to audit_logs
 */
import { query } from '../../_lib/db.js';
import { applyCors, ok, fail } from '../../_lib/response.js';
import { requireAdmin } from '../../_lib/auth.js';
import { logAdminAction } from '../../_lib/audit.js';
import { adminUserPatchSchema } from '../../_lib/validation.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const targetId = req.query?.id || req.url.split('?')[0].split('/').pop();

  if (!targetId || targetId === '[id].js') {
    return fail(res, 400, 'User ID is required');
  }

  try {
    const admin = await requireAdmin(req);

    // ==========================================
    // GET /api/admin/users/:id
    // ==========================================
    if (req.method === 'GET') {
      const users = await query(
        `SELECT id, email, role, status, mode, pseudonym, display_name, bio,
                avatar_url, hide_photo, gender, interested_in, intents, interests,
                relationship_style, city, location_lat, location_lng, dob,
                date_part('year', age(dob))::int AS age, last_active, created_at, updated_at
         FROM users
         WHERE id = $1`,
        [targetId]
      );

      if (!users || users.length === 0) {
        return fail(res, 404, 'User not found');
      }

      // Fetch verification documents
      const docs = await query(
        `SELECT id, id_doc_url, selfie_url, status, review_note, reviewer_id, created_at, reviewed_at
         FROM verifications
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [targetId]
      );

      // Fetch moderation reports filed against this user
      const reportsAgainst = await query(
        `SELECT r.id, r.reporter_id, r.reason, r.details, r.status, r.created_at,
                u.email AS reporter_email
         FROM reports r
         JOIN users u ON u.id = r.reporter_id
         WHERE r.reported_id = $1
         ORDER BY r.created_at DESC`,
        [targetId]
      );

      // Fetch recent audit logs for this target
      const auditTrail = await query(
        `SELECT a.id, a.action, a.metadata, a.created_at, u.email AS admin_email
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.admin_id
         WHERE a.target_id = $1
         ORDER BY a.created_at DESC LIMIT 20`,
        [targetId]
      );

      return ok(res, {
        user: users[0],
        verifications: docs,
        reports: reportsAgainst,
        audit_trail: auditTrail
      });
    }

    // ==========================================
    // PATCH /api/admin/users/:id
    // ==========================================
    if (req.method === 'PATCH') {
      const parsed = adminUserPatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return fail(res, 422, parsed.error.issues[0]?.message || 'Invalid moderation update');
      }

      const { status, role } = parsed.data;
      const reason = req.body?.reason || 'Administrative action';

      // Fetch previous state
      const prev = await query(`SELECT id, email, status, role FROM users WHERE id = $1`, [targetId]);
      if (!prev || prev.length === 0) {
        return fail(res, 404, 'User not found');
      }

      const previousUser = prev[0];
      const fields = [];
      const values = [];
      let idx = 1;

      if (status) {
        fields.push(`status = $${idx}`);
        values.push(status);
        idx++;
      }

      if (role) {
        fields.push(`role = $${idx}`);
        values.push(role);
        idx++;
      }

      if (fields.length === 0) {
        return fail(res, 400, 'No updates specified');
      }

      fields.push(`updated_at = now()`);
      values.push(targetId);

      const updateQuery = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${idx}
        RETURNING id, email, role, status, updated_at
      `;

      const result = await query(updateQuery, values);
      const updatedUser = result[0];

      // Audit Log Action
      const actionName = status === 'banned'
        ? 'ban_user'
        : (status === 'verified' ? 'verify_user' : 'update_user_status');

      await logAdminAction(admin.id, actionName, 'user', targetId, {
        reason,
        previous_status: previousUser.status,
        new_status: updatedUser.status,
        previous_role: previousUser.role,
        new_role: updatedUser.role
      });

      return ok(res, {
        message: `User status successfully updated to ${updatedUser.status}`,
        user: updatedUser
      });
    }

    return fail(res, 405, 'Method Not Allowed. Use GET or PATCH.');
  } catch (err) {
    console.error('[ADMIN USER DETAIL ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Operation failed');
  }
}
