/**
 * POST /api/auth/logout
 * Clears authentication cookie
 */
import { applyCors, ok, fail } from '../_lib/response.js';
import { clearAuthCookie } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return fail(res, 405, 'Method Not Allowed. Use POST.');
  }

  clearAuthCookie(res);
  return ok(res, { message: 'Logged out successfully' });
}
