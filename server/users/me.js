/**
 * GET/PATCH /api/users/me
 * Retrieve or update current user's own profile and mode
 */
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAuth } from '../_lib/auth.js';
import { profileUpdateSchema } from '../_lib/validation.js';
import { containsProfanity } from '../_lib/moderation.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  try {
    const currentUser = await requireAuth(req);

    if (req.method === 'GET') {
      // Fetch fresh full user profile plus count of pending incoming reveal requests
      const reveals = await query(
        `SELECT count(*)::int AS pending_reveals
         FROM reveal_requests
         WHERE to_user = $1 AND status = 'pending'`,
        [currentUser.id]
      );

      const pendingReveals = reveals[0]?.pending_reveals || 0;

      return ok(res, {
        user: {
          ...currentUser,
          pending_reveals: pendingReveals
        }
      });
    }

    if (req.method === 'PATCH') {
      const parsed = profileUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return fail(res, 422, parsed.error.issues[0]?.message || 'Validation failed');
      }

      const data = parsed.data;

      // Profanity checks
      if (data.display_name && containsProfanity(data.display_name)) {
        return fail(res, 422, 'Display name contains prohibited content');
      }
      if (data.pseudonym && containsProfanity(data.pseudonym)) {
        return fail(res, 422, 'Pseudonym contains prohibited content');
      }
      if (data.bio && containsProfanity(data.bio)) {
        return fail(res, 422, 'Bio contains prohibited content');
      }

      const fields = [];
      const values = [];
      let idx = 1;

      for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) {
          fields.push(`${key} = $${idx}`);
          values.push(val);
          idx++;
        }
      }

      if (fields.length === 0) {
        return fail(res, 400, 'No valid profile fields provided to update');
      }

      fields.push(`updated_at = now()`);
      values.push(currentUser.id);

      const updateQuery = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${idx}
        RETURNING id, email, role, status, mode, pseudonym, display_name, bio,
                  avatar_url, hide_photo, gender, interested_in, intents, interests,
                  relationship_style, city, location_lat, location_lng, dob, last_active, updated_at
      `;

      const result = await query(updateQuery, values);
      return ok(res, { user: result[0] });
    }

    return fail(res, 405, 'Method Not Allowed. Use GET or PATCH.');
  } catch (err) {
    console.error('[USERS ME ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Operation failed');
  }
}
