import { sleep } from '../utils/helpers.js';
import { MOCK_USERS } from '../utils/mockData.js';
import { getNeonSql } from './neon.js';
import { useAuthStore } from '../store/authStore.js';
import { searchAndRankUsers } from '../utils/searchFuzzy.js';

// Helper to calculate age accurately from date of birth
export const calculateAgeFromDob = (dob) => {
  if (!dob) return 24;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 24;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? age : 24;
};

// Helper to map Postgres row to user object
export const mapUserRow = (r) => ({
  id: r.id,
  name: r.name || r.display_name || 'Member',
  displayName: r.display_name || r.name || 'Member',
  username: r.username || (r.email ? r.email.split('@')[0] : 'spark_user'),
  email: r.email,
  phone: r.phone || r.phone_number || '',
  phoneNumber: r.phone || r.phone_number || '',
  pseudonym: r.pseudonym,
  age: r.age ? Number(r.age) : (r.dob ? calculateAgeFromDob(r.dob) : 24),
  dob: r.dob,
  gender: r.gender,
  nature: Array.isArray(r.nature)
    ? r.nature
    : typeof r.nature === 'string'
    ? JSON.parse(r.nature || '[]')
    : [],
  bio: r.bio,
  avatar: r.avatar || r.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  avatarUrl: r.avatar_url || r.avatar,
  photos: Array.isArray(r.photos)
    ? r.photos
    : typeof r.photos === 'string'
    ? JSON.parse(r.photos || '[]')
    : [r.avatar || r.avatar_url],
  mode: r.mode,
  hidePhoto: r.hide_photo,
  revealed: r.mode === 'public',
  verified: r.verified || r.status === 'verified',
  verificationStatus: r.verification_status || r.status || 'pending',
  idDocumentUrl: r.id_document_url,
  selfieUrl: r.selfie_url,
  role: r.role || 'user',
  distance: Number(r.distance) || 5,
  location: r.location || r.city || 'San Francisco, CA',
  lat: Number(r.lat) || Number(r.location_lat) || 40.7128,
  lng: Number(r.lng) || Number(r.location_lng) || -74.006,
  x: Number(r.x) || 50,
  y: Number(r.y) || 50,
  neighborhood: r.neighborhood || r.city || r.location || 'Downtown',
  intent: r.intent || (r.intents?.[0] ? r.intents[0] : 'Romance'),
  relationshipStyle: r.relationship_style || 'Exploring Connections',
  interests: Array.isArray(r.interests)
    ? r.interests
    : typeof r.interests === 'string'
    ? JSON.parse(r.interests || '[]')
    : [],
  activeNow: r.active_now,
  lastSeen: r.last_seen,
  isBanned: r.is_banned || r.status === 'banned',
  flagged: r.flagged,
  createdAt: r.created_at,
});

// 1. Get Match Feed Users from Neon Lakebase Postgres
export const getFeedUsersApi = async () => {
  try {
    const currentUserId = useAuthStore.getState().user?.id;
    const sql = getNeonSql();
    const rows = await sql`
      SELECT * FROM users
      WHERE role != 'admin' AND is_banned = FALSE
      ORDER BY active_now DESC, created_at DESC
      LIMIT 50;
    `;
    if (rows && rows.length > 0) {
      let results = rows.map(mapUserRow);
      if (currentUserId) {
        results = results.filter((u) => u.id !== currentUserId);
      }
      return results;
    }
    return [];
  } catch (err) {
    console.warn('Neon Postgres feed notice:', err.message);
  }

  return [];
};

// 2. Discover Users with Filter Queries from Neon Lakebase Postgres
export const getDiscoverUsersApi = async (filters = {}) => {
  try {
    const currentUserId = useAuthStore.getState().user?.id;
    const sql = getNeonSql();
    const rows = await sql`
      SELECT * FROM users
      WHERE is_banned = FALSE
      ORDER BY created_at DESC
      LIMIT 100;
    `;

    let allUsers = [];
    if (rows && rows.length > 0) {
      allUsers = rows.map(mapUserRow);
    } else {
      allUsers = MOCK_USERS.filter((u) => !u.isBanned);
    }

    let results = [...allUsers];

    // When NOT searching explicitly, filter out current user and admin accounts
    if (!filters.search || !filters.search.trim()) {
      if (currentUserId) {
        results = results.filter((u) => u.id !== currentUserId);
      }
      results = results.filter((u) => u.role !== 'admin');
    }

    if (filters.minAge) results = results.filter((u) => u.age >= filters.minAge);
    if (filters.maxAge) results = results.filter((u) => u.age <= filters.maxAge);
    if (filters.maxDistance) results = results.filter((u) => (u.distance || 5) <= filters.maxDistance);
    if (filters.intent && filters.intent !== 'all') {
      results = results.filter((u) => u.intent?.toLowerCase() === filters.intent.toLowerCase());
    }
    if (filters.relationshipStyle && filters.relationshipStyle !== 'all') {
      results = results.filter((u) => u.relationshipStyle === filters.relationshipStyle);
    }
    if (filters.mode && filters.mode !== 'all') {
      results = results.filter((u) => u.mode === filters.mode);
    }
    if (filters.interest && filters.interest !== 'all') {
      results = results.filter((u) => u.interests?.includes(filters.interest));
    }

    if (filters.search && filters.search.trim()) {
      // 1. First search within the filtered subset
      let searchOutcome = searchAndRankUsers(results, filters.search);

      // 2. If filtered subset has no matches, search across all users in the database
      if (searchOutcome.results.length === 0 && results.length < allUsers.length) {
        const broaderOutcome = searchAndRankUsers(allUsers, filters.search);
        if (broaderOutcome.results.length > 0) {
          searchOutcome = broaderOutcome;
        }
      }

      const finalResults = searchOutcome.results;
      finalResults.isFuzzyFallback = searchOutcome.isFuzzyFallback;
      finalResults.suggestions = searchOutcome.suggestions;
      finalResults.totalMatches = searchOutcome.totalMatches;
      return finalResults;
    }

    return results;
  } catch (err) {
    console.warn('Neon Postgres discover notice:', err.message);
    const mockFiltered = MOCK_USERS.filter((u) => !u.isBanned);
    if (filters.search && filters.search.trim()) {
      const outcome = searchAndRankUsers(mockFiltered, filters.search);
      const res = outcome.results;
      res.isFuzzyFallback = outcome.isFuzzyFallback;
      res.suggestions = outcome.suggestions;
      res.totalMatches = outcome.totalMatches;
      return res;
    }
    return mockFiltered;
  }
};

// 3. Get User By ID from Neon Lakebase Postgres
export const getUserByIdApi = async (id) => {
  const currentAuthUser = useAuthStore.getState().user;
  if (id === 'me' || id === 'current_user' || (currentAuthUser && id === currentAuthUser.id)) {
    if (currentAuthUser) return currentAuthUser;
    throw new Error('Not authenticated');
  }

  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT * FROM users
      WHERE id = ${id}
      LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      return mapUserRow(rows[0]);
    }
  } catch (err) {
    console.warn('Neon Postgres getUserById notice:', err.message);
  }

  throw new Error('Member not found');
};

// 4. Request Reveal from Neon Lakebase Postgres
export const requestRevealApi = async (userId) => {
  const currentUserId = useAuthStore.getState().user?.id;
  if (!currentUserId || !userId) return { success: false };

  try {
    const sql = getNeonSql();
    await sql`
      INSERT INTO reveal_requests (requester_id, stranger_id, status)
      VALUES (${currentUserId}, ${userId}, 'approved')
      ON CONFLICT (requester_id, stranger_id) DO UPDATE SET status = 'approved';
    `;
  } catch (err) {
    console.warn('Neon reveal notice:', err.message);
  }

  await sleep(200);
  return {
    success: true,
    userId,
    status: 'revealed',
    message: 'Profile photos and identity revealed!',
  };
};

// 5. Update User Profile in Neon Lakebase Postgres
export const updateUserProfileApi = async (updates) => {
  const natureJson = updates.nature ? JSON.stringify(updates.nature) : null;
  const interestsArray = Array.isArray(updates.interests) ? updates.interests : null;
  const intentsArray = Array.isArray(updates.intents) ? updates.intents : null;

  try {
    const sql = getNeonSql();
    const userId = updates.id || useAuthStore.getState().user?.id;

    if (userId && userId !== 'current_user') {
      const rows = await sql`
        UPDATE users
        SET 
          name = COALESCE(${updates.name || null}, name),
          display_name = COALESCE(${updates.name || updates.displayName || null}, display_name),
          username = COALESCE(${updates.username || null}, username),
          phone = COALESCE(${updates.phone || null}, phone),
          phone_number = COALESCE(${updates.phone || null}, phone_number),
          bio = COALESCE(${updates.bio || null}, bio),
          mode = COALESCE(${updates.mode || null}, mode),
          pseudonym = COALESCE(${updates.pseudonym || null}, pseudonym),
          avatar = COALESCE(${updates.avatar || null}, avatar),
          avatar_url = COALESCE(${updates.avatar || null}, avatar_url),
          location = COALESCE(${updates.location || null}, location),
          gender = COALESCE(${updates.gender || null}, gender),
          relationship_style = COALESCE(${updates.relationshipStyle || null}, relationship_style),
          nature = COALESCE(${natureJson}::jsonb, nature),
          interests = COALESCE(${interestsArray}, interests),
          intents = COALESCE(${intentsArray}, intents),
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        return mapUserRow(rows[0]);
      }
    }
  } catch (err) {
    console.warn('Neon update profile notice:', err.message);
  }

  await sleep(200);
  const currentAuthUser = useAuthStore.getState().user;
  return {
    ...(currentAuthUser || {}),
    ...updates,
  };
};

// 6. Like / SuperSpark User in Neon Lakebase Postgres (Real mutual matching, SuperSpark priority & note)
export const likeUserApi = async (userId, options = {}) => {
  const currentUserId = useAuthStore.getState().user?.id;
  if (!currentUserId || !userId || currentUserId === userId) {
    return { success: false, isMatch: false };
  }

  let isMatch = false;
  const isSuperSpark = Boolean(options.isSuperSpark);
  const noteText = options.note || '';

  try {
    const sql = getNeonSql();

    // Check if partner already liked the current user (Mutual Match!)
    const checkRows = await sql`
      SELECT id FROM swipes
      WHERE user_id = ${userId} AND target_user_id = ${currentUserId} AND action IN ('like', 'superspark')
      LIMIT 1;
    `;
    isMatch = checkRows.length > 0;

    const action = isSuperSpark ? 'superspark' : 'like';

    // Record or update this like / superspark
    await sql`
      INSERT INTO swipes (user_id, target_user_id, action, is_match, created_at)
      VALUES (${currentUserId}, ${userId}, ${action}, ${isMatch}, NOW())
      ON CONFLICT (user_id, target_user_id) 
      DO UPDATE SET action = ${action}, is_match = ${isMatch}, created_at = NOW();
    `;

    // If mutual match or SuperSpark has an opener note, ensure conversation row exists
    if (isMatch || (isSuperSpark && noteText)) {
      if (isMatch) {
        await sql`
          UPDATE swipes SET is_match = TRUE
          WHERE user_id = ${userId} AND target_user_id = ${currentUserId};
        `;
      }

      // Check if conversation row exists
      const convCheck = await sql`
        SELECT id FROM conversations
        WHERE (user_one_id = ${currentUserId} AND user_two_id = ${userId})
           OR (user_one_id = ${userId} AND user_two_id = ${currentUserId})
        LIMIT 1;
      `;

      let convId = convCheck.length > 0 ? convCheck[0].id : null;
      if (!convId) {
        convId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `conv_${Date.now()}`;
        await sql`
          INSERT INTO conversations (
            id, user_one_id, user_two_id, disappearing_setting, streak_count, created_at, updated_at
          ) VALUES (
            ${convId}, ${currentUserId}, ${userId}, 'off', 0, NOW(), NOW()
          )
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // If SuperSpark had an introductory note, deliver it as the opening message
      if (isSuperSpark && noteText && convId) {
        const msgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}`;
        const formattedNote = `✨ SuperSpark note: "${noteText}"`;
        await sql`
          INSERT INTO messages (
            id, conversation_id, sender_id, body, text, type, status, created_at
          ) VALUES (
            ${msgId}::uuid, ${convId}, ${currentUserId}::uuid, ${formattedNote}, ${formattedNote}, 'text', 'delivered', NOW()
          );
        `.catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Neon swipe like notice:', err.message);
  }

  await sleep(150);
  return { success: true, isMatch };
};

// 7. Pass User in Neon Lakebase Postgres
export const passUserApi = async (userId) => {
  const currentUserId = useAuthStore.getState().user?.id;
  if (!currentUserId || !userId) return { success: true };

  try {
    const sql = getNeonSql();
    await sql`
      INSERT INTO swipes (user_id, target_user_id, action, is_match, created_at)
      VALUES (${currentUserId}, ${userId}, 'pass', FALSE, NOW())
      ON CONFLICT (user_id, target_user_id) 
      DO UPDATE SET action = 'pass', is_match = FALSE, created_at = NOW();
    `;
  } catch (err) {
    console.warn('Neon swipe pass notice:', err.message);
  }

  await sleep(150);
  return { success: true };
};

export default {
  getFeedUsersApi,
  getDiscoverUsersApi,
  getUserByIdApi,
  requestRevealApi,
  updateUserProfileApi,
  likeUserApi,
  passUserApi,
};
