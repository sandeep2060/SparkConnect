/**
 * GET /api/users
 * Discovery feed with filtering, stranger-mode privacy masking,
 * verification gate, and block/chat exclusions.
 */
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAuth } from '../_lib/auth.js';
import { feedFilterSchema } from '../_lib/validation.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return fail(res, 405, 'Method Not Allowed. Use GET.');
  }

  try {
    const currentUser = await requireAuth(req);

    // Validate query parameters
    const parsed = feedFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, 422, parsed.error.issues[0]?.message || 'Invalid query parameters');
    }

    const {
      minAge,
      maxAge,
      intent,
      relationship,
      interests,
      mode,
      limit,
      offset
    } = parsed.data;

    // Build parameterized SQL query
    // Business Rule 3: Only status = 'verified' appear in feeds
    // Business Rule 4: Exclude self, blocked users, already-chatted users, banned users
    const conditions = [
      `u.status = 'verified'`,
      `u.id != $1`,
      // Exclude blocked both ways
      `u.id NOT IN (
        SELECT blocked_id FROM blocks WHERE blocker_id = $1
        UNION
        SELECT blocker_id FROM blocks WHERE blocked_id = $1
      )`,
      // Exclude already-chatted
      `u.id NOT IN (
        SELECT CASE WHEN user_a = $1 THEN user_b ELSE user_a END
        FROM chats
        WHERE user_a = $1 OR user_b = $1
      )`
    ];

    const values = [currentUser.id];
    let paramIndex = 2;

    if (mode && mode !== 'all') {
      conditions.push(`u.mode = $${paramIndex}`);
      values.push(mode);
      paramIndex++;
    }

    if (minAge) {
      conditions.push(`date_part('year', age(u.dob)) >= $${paramIndex}`);
      values.push(minAge);
      paramIndex++;
    }

    if (maxAge) {
      conditions.push(`date_part('year', age(u.dob)) <= $${paramIndex}`);
      values.push(maxAge);
      paramIndex++;
    }

    if (intent) {
      conditions.push(`$${paramIndex} = ANY(u.intents)`);
      values.push(intent);
      paramIndex++;
    }

    if (relationship) {
      conditions.push(`u.relationship_style = $${paramIndex}`);
      values.push(relationship);
      paramIndex++;
    }

    if (interests) {
      const interestList = interests.split(',').map(s => s.trim().toLowerCase());
      conditions.push(`u.interests && $${paramIndex}`);
      values.push(interestList);
      paramIndex++;
    }

    // Business Rule 4 Ordering:
    // Order by last_active DESC so members see active, responsive connections first
    const sqlQuery = `
      SELECT 
        u.id,
        u.dob,
        date_part('year', age(u.dob))::int AS age,
        u.mode,
        u.pseudonym,
        u.display_name,
        u.bio,
        u.avatar_url,
        u.hide_photo,
        u.gender,
        u.interested_in,
        u.intents,
        u.interests,
        u.relationship_style,
        u.city,
        u.last_active,
        r.status AS reveal_status,
        r.from_user AS reveal_from_user
      FROM users u
      LEFT JOIN reveal_requests r ON (
        (r.from_user = $1 AND r.to_user = u.id) OR 
        (r.from_user = u.id AND r.to_user = $1)
      )
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.last_active DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    const rows = await query(sqlQuery, values);

    // Business Rule 1: STRANGER MODE PRIVACY
    // If user is in stranger mode and no approved reveal exists, mask display_name and avatar_url
    const feed = rows.map(user => {
      const isStranger = user.mode === 'stranger' || user.hide_photo;
      const isRevealed = user.reveal_status === 'approved';

      if (isStranger && !isRevealed) {
        return {
          id: user.id,
          age: user.age,
          mode: 'stranger',
          pseudonym: user.pseudonym || 'Stranger',
          display_name: null,
          avatar_url: null,
          hide_photo: true,
          bio: user.bio,
          gender: user.gender,
          interested_in: user.interested_in,
          intents: user.intents,
          interests: user.interests,
          relationship_style: user.relationship_style,
          city: user.city,
          last_active: user.last_active,
          can_request_reveal: user.reveal_status !== 'pending',
          reveal_pending: user.reveal_status === 'pending',
          is_revealed: false
        };
      }

      return {
        ...user,
        is_revealed: isRevealed || user.mode === 'public',
        can_request_reveal: false
      };
    });

    return ok(res, { feed, count: feed.length });
  } catch (err) {
    console.error('[USERS FEED ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Failed to load user feed');
  }
}
