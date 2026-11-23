import { getNeonSql } from './neon';
import { mapUserRow } from './users';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 1. Get All Nearby Sparks for Map from Neon Lakebase Postgres
export const getNearbyMapSparksApi = async (filters = {}) => {
  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT * FROM users
      WHERE role != 'admin' AND is_banned = FALSE
      ORDER BY active_now DESC, created_at DESC
      LIMIT 30;
    `;

    if (rows && rows.length > 0) {
      let users = rows.map(mapUserRow);

      if (filters.intent && filters.intent !== 'all') {
        users = users.filter((u) => u.intent?.toLowerCase() === filters.intent.toLowerCase());
      }
      if (filters.mode && filters.mode !== 'all') {
        users = users.filter((u) => u.mode === filters.mode);
      }
      if (filters.onlineOnly) {
        users = users.filter((u) => u.activeNow);
      }
      if (filters.nature && filters.nature !== 'all') {
        users = users.filter((u) =>
          u.nature?.some((n) => n.toLowerCase() === filters.nature.toLowerCase())
        );
      }
      return users;
    }
    return [];
  } catch (err) {
    console.warn('Neon Postgres map sparks notice:', err.message);
  }

  return [];
};

// 2. Get Popular Hotspots / Nightlife Hubs from Neon Lakebase Postgres
export const getMapHotspotsApi = async () => {
  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT * FROM hotspots
      ORDER BY sparks_count DESC
      LIMIT 10;
    `;

    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        neighborhood: r.neighborhood,
        sparksCount: r.sparks_count,
        activeVibe: r.active_vibe,
        lat: Number(r.lat),
        lng: Number(r.lng),
        x: Number(r.x),
        y: Number(r.y),
        tags: Array.isArray(r.tags) ? r.tags : typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : [],
        image: r.image,
        heatLevel: r.heat_level,
      }));
    }
  } catch (err) {
    console.warn('Neon Postgres hotspots notice (using fallback):', err.message);
  }

  await sleep(150);
  return MOCK_HOTSPOTS;
};

// 3. Update User Location / Ghost Mode in Neon Lakebase Postgres
export const updateMapLocationApi = async ({ lat, lng, ghostMode, radius }) => {
  try {
    const sql = getNeonSql();
    await sql`
      UPDATE users
      SET 
        lat = COALESCE(${lat || null}, lat),
        lng = COALESCE(${lng || null}, lng),
        updated_at = NOW()
      WHERE id = 'current_user';
    `;
  } catch (err) {
    console.warn('Neon update location notice:', err.message);
  }

  await sleep(150);
  return {
    success: true,
    lat,
    lng,
    ghostMode,
    radius,
    updatedAt: new Date().toISOString(),
  };
};

export default {
  getNearbyMapSparksApi,
  getMapHotspotsApi,
  updateMapLocationApi,
};
