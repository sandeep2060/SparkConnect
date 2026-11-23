/**
 * GET /api/users/:id - View profile with stranger mode privacy checks
 * PATCH /api/users/:id - Update profile details (self or admin)
 */
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAuth } from '../_lib/auth.js';
import { profileUpdateSchema } from '../_lib/validation.js';
import { containsProfanity } from '../_lib/moderation.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  const targetId = req.query?.id || req.url.split('?')[0].split('/').pop();

  if (!targetId || targetId === '[id].js' || targetId === 'index.js') {
    return fail(res, 400, 'User ID is required');
  }

  try {
    const currentUser = await requireAuth(req);

    // ==========================================
    // GET /api/users/:id
    // ==========================================
    if (req.method === 'GET') {
      // 1. Check if user exists
      const users = await query(
        `SELECT id, dob, date_part('year', age(dob))::int AS age,
                role, status, mode, pseudonym, display_name, bio, avatar_url,
                hide_photo, gender, interested_in, intents, interests,
                relationship_style, city, location_lat, location_lng,
                last_active, created_at
         FROM users
         WHERE id = $1`,
        [targetId]
      );

      if (!users || users.length === 0) {
        return fail(res, 404, 'User not found');
      }

      const target = users[0];

      if (target.status === 'banned' && currentUser.role !== 'admin') {
        return fail(res, 404, 'User not found');
      }

      // 2. Check blocks
      const blockCheck = await query(
        `SELECT blocker_id, blocked_id FROM blocks
         WHERE (blocker_id = $1 AND blocked_id = $2)
            OR (blocker_id = $2 AND blocked_id = $1)`,
        [currentUser.id, targetId]
      );

      const isBlocked = blockCheck.length > 0;
      const didIBlock = blockCheck.some(b => b.blocker_id === currentUser.id);

      // 3. Check Reveal Status if stranger mode
      let revealStatus = 'none';
      if (currentUser.id !== targetId) {
        const revealCheck = await query(
          `SELECT status, from_user, to_user FROM reveal_requests
           WHERE (from_user = $1 AND to_user = $2)
              OR (from_user = $2 AND to_user = $1)
           ORDER BY created_at DESC LIMIT 1`,
          [currentUser.id, targetId]
        );
        if (revealCheck.length > 0) {
          revealStatus = revealCheck[0].status;
        }
      }

      // Stranger mode masking
      const isStranger = (target.mode === 'stranger' || target.hide_photo) && currentUser.id !== targetId;
      const isRevealed = revealStatus === 'approved' || currentUser.role === 'admin';

      if (isStranger && !isRevealed) {
        return ok(res, {
          user: {
            id: target.id,
            age: target.age,
            mode: 'stranger',
            pseudonym: target.pseudonym || 'Stranger',
            display_name: null,
            avatar_url: null,
            hide_photo: true,
            bio: target.bio,
            gender: target.gender,
            interested_in: target.interested_in,
            intents: target.intents,
            interests: target.interests,
            relationship_style: target.relationship_style,
            city: target.city,
            last_active: target.last_active,
            can_request_reveal: revealStatus !== 'pending',
            reveal_status: revealStatus,
            is_revealed: false,
            is_blocked: isBlocked,
            did_i_block: didIBlock
          }
        });
      }

      return ok(res, {
        user: {
          ...target,
          is_revealed: true,
          can_request_reveal: false,
          reveal_status: revealStatus,
          is_blocked: isBlocked,
          did_i_block: didIBlock
        }
      });
    }

    // ==========================================
    // PATCH /api/users/:id
    // ==========================================
    if (req.method === 'PATCH') {
      // Must be updating own profile or be admin
      if (currentUser.id !== targetId && currentUser.role !== 'admin') {
        return fail(res, 403, 'Forbidden: You can only update your own profile');
      }

      const parsed = profileUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return fail(res, 422, parsed.error.issues[0]?.message || 'Validation failed');
      }

      const data = parsed.data;

      // Profanity check
      if (data.display_name && containsProfanity(data.display_name)) {
        return fail(res, 422, 'Display name contains prohibited content');
      }
      if (data.pseudonym && containsProfanity(data.pseudonym)) {
        return fail(res, 422, 'Pseudonym contains prohibited content');
      }
      if (data.bio && containsProfanity(data.bio)) {
        return fail(res, 422, 'Bio contains prohibited content');
      }

      // Build dynamic update set
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
        return fail(res, 400, 'No valid fields provided for update');
      }

      fields.push(`updated_at = now()`);
      values.push(targetId);

      const updateQuery = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${idx}
        RETURNING id, email, role, status, mode, pseudonym, display_name, bio,
                  avatar_url, hide_photo, gender, interested_in, intents, interests,
                  relationship_style, city, location_lat, location_lng, dob, last_active, updated_at
      `;

      const result = await query(updateQuery, values);
      if (!result || result.length === 0) {
        return fail(res, 404, 'User not found');
      }

      return ok(res, { user: result[0] });
    }

    return fail(res, 405, 'Method Not Allowed. Use GET or PATCH.');
  } catch (err) {
    console.error('[USER ID ROUTE ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Operation failed');
  }
}
