/**
 * POST /api/auth/signup
 * Registers a new account with 18+ verification, password hashing, and pending status
 */
import bcrypt from 'bcryptjs';
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { signToken, setAuthCookie } from '../_lib/auth.js';
import { signupSchema } from '../_lib/validation.js';
import { containsProfanity } from '../_lib/moderation.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return fail(res, 405, 'Method Not Allowed. Use POST.');
  }

  try {
    // 1. Zod input validation
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 422, parsed.error.issues[0]?.message || 'Validation failed');
    }

    const {
      email,
      phone,
      password,
      dob,
      display_name,
      name,
      username,
      pseudonym,
      mode,
      gender,
      city,
      interested_in,
      intents,
      interests,
      relationship_style
    } = parsed.data;

    // 2. Moderation check on names
    if (display_name && containsProfanity(display_name)) {
      return fail(res, 422, 'Display name contains prohibited words');
    }
    if (pseudonym && containsProfanity(pseudonym)) {
      return fail(res, 422, 'Pseudonym contains prohibited words');
    }

    // 3. Check for existing email or phone
    const existing = await query(`SELECT id FROM users WHERE email = $1 OR (phone IS NOT NULL AND phone = $2)`, [email, phone || '']);
    if (existing && existing.length > 0) {
      return fail(res, 409, 'An account with this email address or phone number already exists');
    }

    // 4. Hash password with bcryptjs (10 rounds)
    const password_hash = await bcrypt.hash(password, 10);

    // 5. Insert new user with status='pending' and role='user'
    const cleanUsername = (username || display_name || name || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 20);
    const finalDisplayName = display_name || name || cleanUsername;
    const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';

    const insertResult = await query(
      `INSERT INTO users (
        email,
        phone,
        phone_number,
        password_hash,
        dob,
        role,
        status,
        mode,
        pseudonym,
        display_name,
        name,
        username,
        avatar,
        avatar_url,
        gender,
        city,
        interested_in,
        intents,
        interests,
        nature,
        relationship_style,
        active_now
      ) VALUES ($1, $2, $2, $3, $4, 'user', 'pending', $5, $6, $7, $7, $8, $9, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, TRUE)
      RETURNING id, email, phone, role, status, mode, pseudonym, display_name, name, username, avatar, gender, city, 
                interested_in, intents, interests, relationship_style, dob, created_at`,
      [
        email,
        phone || null,
        password_hash,
        dob,
        mode || 'public',
        pseudonym || null,
        finalDisplayName,
        cleanUsername,
        defaultAvatar,
        gender || null,
        city || null,
        interested_in || [],
        intents || [],
        interests || [],
        JSON.stringify(['Friendly', 'Playful']),
        relationship_style || null
      ]
    );

    const newUser = insertResult[0];

    // 6. Sign JWT & Set httpOnly cookie
    const token = signToken(newUser);
    setAuthCookie(res, token);

    return ok(res, { user: newUser, token }, 201);
  } catch (err) {
    console.error('[SIGNUP ERROR]', err);
    return fail(res, 500, 'Failed to complete registration');
  }
}
