/**
 * GET /api/auth/me
 * Returns currently authenticated user profile
 */
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return fail(res, 405, 'Method Not Allowed. Use GET.');
  }

  try {
    const user = await requireAuth(req);
    return ok(res, { user });
  } catch (err) {
    const code = err.statusCode || 401;
    return fail(res, code, err.message || 'Unauthorized');
  }
}
