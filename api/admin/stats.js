/**
 * GET /api/admin/stats
 * Platform overview metrics for administrators
 */
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return fail(res, 405, 'Method Not Allowed. Use GET.');
  }

  try {
    await requireAdmin(req);

    // Aggregate core metrics
    const userStats = await query(`
      SELECT 
        count(*)::int AS total_users,
        count(*) FILTER (WHERE status = 'pending')::int AS pending_users,
        count(*) FILTER (WHERE status = 'verified')::int AS verified_users,
        count(*) FILTER (WHERE status = 'banned')::int AS banned_users,
        count(*) FILTER (WHERE mode = 'stranger')::int AS stranger_mode_users,
        count(*) FILTER (WHERE mode = 'public')::int AS public_mode_users
      FROM users
    `);

    const chatStats = await query(`
      SELECT 
        (SELECT count(*)::int FROM chats) AS total_chats,
        (SELECT count(*)::int FROM messages) AS total_messages,
        (SELECT count(*)::int FROM reports WHERE status = 'open') AS open_reports,
        (SELECT count(*)::int FROM verifications WHERE status = 'pending') AS pending_verifications,
        (SELECT count(*)::int FROM reveal_requests WHERE status = 'approved') AS approved_reveals
    `);

    const stats = {
      ...userStats[0],
      ...chatStats[0]
    };

    return ok(res, { stats });
  } catch (err) {
    console.error('[ADMIN STATS ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Failed to fetch admin stats');
  }
}
