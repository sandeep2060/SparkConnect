/**
 * GET /api/admin/users
 * Paginated and searchable user management list for administrators
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

    const {
      q,
      status,
      role,
      mode,
      limit = '20',
      offset = '0'
    } = req.query || {};

    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

    const conditions = ['1=1'];
    const values = [];
    let idx = 1;

    if (q) {
      conditions.push(`(u.email ILIKE $${idx} OR u.display_name ILIKE $${idx} OR u.pseudonym ILIKE $${idx})`);
      values.push(`%${q}%`);
      idx++;
    }

    if (status) {
      conditions.push(`u.status = $${idx}`);
      values.push(status);
      idx++;
    }

    if (role) {
      conditions.push(`u.role = $${idx}`);
      values.push(role);
      idx++;
    }

    if (mode) {
      conditions.push(`u.mode = $${idx}`);
      values.push(mode);
      idx++;
    }

    // Total matching count
    const countSql = `SELECT count(*)::int AS total FROM users u WHERE ${conditions.join(' AND ')}`;
    const countResult = await query(countSql, values);
    const total = countResult[0]?.total || 0;

    // Fetch paginated rows
    values.push(limitNum, offsetNum);
    const listSql = `
      SELECT 
        u.id,
        u.email,
        u.dob,
        date_part('year', age(u.dob))::int AS age,
        u.role,
        u.status,
        u.mode,
        u.pseudonym,
        u.display_name,
        u.avatar_url,
        u.gender,
        u.city,
        u.last_active,
        u.created_at,
        (SELECT count(*)::int FROM reports r WHERE r.reported_id = u.id) AS reports_count
      FROM users u
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const users = await query(listSql, values);

    return ok(res, {
      users,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (err) {
    console.error('[ADMIN USERS LIST ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Failed to list users');
  }
}
