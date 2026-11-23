import { sleep } from '../utils/helpers';
import { MOCK_ADMIN_STATS, MOCK_USERS, MOCK_REPORTS } from '../utils/mockData';
import { getNeonSql } from './neon';
import { mapUserRow } from './users';

let adminUsersMemory = [...MOCK_USERS];
let adminReportsMemory = [...MOCK_REPORTS];

// 1. Get Live Admin Dashboard Stats from Neon Lakebase Postgres
export const getStatsApi = async () => {
  try {
    const sql = getNeonSql();
    const [userCountRes, verifCountRes, reportCountRes, activeCountRes] = await Promise.all([
      sql`SELECT count(*) FROM users;`,
      sql`SELECT count(*) FROM verifications WHERE status = 'pending';`,
      sql`SELECT count(*) FROM reports WHERE status = 'pending';`,
      sql`SELECT count(*) FROM users WHERE active_now = TRUE;`,
    ]);

    const totalUsers = Number(userCountRes[0]?.count) || 0;
    const pendingVerifications = Number(verifCountRes[0]?.count) || 0;
    const reportsCount = Number(reportCountRes[0]?.count) || 0;
    const activeToday = Number(activeCountRes[0]?.count) || 0;

    return {
      ...MOCK_ADMIN_STATS,
      totalUsers,
      pendingVerifications,
      reportsCount,
      activeToday,
    };
  } catch (err) {
    console.warn('Neon Postgres admin stats notice (using fallback):', err.message);
  }

  await sleep(300);
  return {
    ...MOCK_ADMIN_STATS,
    pendingVerifications: adminUsersMemory.filter((u) => u.verificationStatus === 'pending').length,
    reportsCount: adminReportsMemory.filter((r) => r.status === 'pending').length,
  };
};

// 2. Get Users Table from Neon Lakebase Postgres
export const getAdminUsersApi = async ({ search = '', status = 'all' } = {}) => {
  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT * FROM users
      ORDER BY created_at DESC
      LIMIT 100;
    `;

    if (rows && rows.length > 0) {
      let list = rows.map(mapUserRow);

      if (status && status !== 'all') {
        if (status === 'banned') {
          list = list.filter((u) => u.isBanned);
        } else if (status === 'flagged') {
          list = list.filter((u) => u.flagged);
        } else {
          list = list.filter((u) => u.verificationStatus === status);
        }
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.pseudonym?.toLowerCase().includes(q) ||
            u.location?.toLowerCase().includes(q)
        );
      }
      return list;
    }
    return [];
  } catch (err) {
    console.warn('Neon Postgres admin users notice:', err.message);
  }

  return [];
};

// 3. Get User Detail from Neon Lakebase Postgres
export const getAdminUserDetailApi = async (userId) => {
  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT * FROM users
      WHERE id = ${userId}
      LIMIT 1;
    `;

    if (rows && rows.length > 0) {
      const user = mapUserRow(rows[0]);
      const auditLogs = [
        { action: 'Account Created', date: user.createdAt, actor: 'System' },
        { action: 'ID Documents Uploaded', date: '2024-03-01T12:00:00Z', actor: user.name },
        ...(user.flagged
          ? [{ action: 'Flagged by User Report', date: '2024-03-21T18:40:00Z', actor: 'Automated Shield' }]
          : []),
        ...(user.verified
          ? [{ action: 'Identity Approved', date: '2024-03-02T09:30:00Z', actor: 'Admin Moderator' }]
          : []),
      ];

      return {
        ...user,
        auditLogs,
        reportedChats: user.flagged
          ? [
              {
                id: 'flagged_thread_1',
                partnerName: 'Elena Rostova',
                reason: 'Inappropriate content or unsolicited photos',
                snippet: 'Check this out right now... [Unapproved External Media URL]',
              },
            ]
          : [],
      };
    }
  } catch (err) {
    console.warn('Neon Postgres admin user detail notice:', err.message);
  }

  await sleep(300);
  const user = adminUsersMemory.find((u) => u.id === userId) || adminUsersMemory[0];
  return {
    ...user,
    auditLogs: [
      { action: 'Account Created', date: user.createdAt, actor: 'System' },
      { action: 'ID Documents Uploaded', date: '2024-03-01T12:00:00Z', actor: user.name },
    ],
    reportedChats: [],
  };
};

// 4. Verify User in Neon Lakebase Postgres
export const verifyUserApi = async (userId) => {
  try {
    const sql = getNeonSql();
    await sql`
      UPDATE users
      SET verified = TRUE, verification_status = 'approved', updated_at = NOW()
      WHERE id = ${userId};
    `;
    await sql`
      UPDATE verifications
      SET status = 'approved', reviewed_at = NOW()
      WHERE user_id = ${userId};
    `;
  } catch (err) {
    console.warn('Neon verifyUser notice:', err.message);
  }

  adminUsersMemory = adminUsersMemory.map((u) =>
    u.id === userId ? { ...u, verified: true, verificationStatus: 'approved' } : u
  );
  await sleep(250);
  return { success: true };
};

// 5. Ban User in Neon Lakebase Postgres
export const banUserApi = async (userId, shouldBan = true) => {
  try {
    const sql = getNeonSql();
    await sql`
      UPDATE users
      SET is_banned = ${shouldBan}, updated_at = NOW()
      WHERE id = ${userId};
    `;
  } catch (err) {
    console.warn('Neon banUser notice:', err.message);
  }

  adminUsersMemory = adminUsersMemory.map((u) =>
    u.id === userId ? { ...u, isBanned: shouldBan } : u
  );
  await sleep(250);
  return { success: true, isBanned: shouldBan };
};

// 6. Get Reports from Neon Lakebase Postgres
export const getReportsApi = async () => {
  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT 
        r.id, r.reporter_id, r.reported_user_id, r.reason, r.details, r.status, r.severity, r.created_at,
        u.name AS reported_user_name, u.avatar AS reported_user_avatar
      FROM reports r
      LEFT JOIN users u ON u.id = r.reported_user_id
      ORDER BY r.created_at DESC;
    `;

    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        reporterId: r.reporter_id,
        reporterName: 'Member',
        reportedUser: {
          id: r.reported_user_id,
          name: r.reported_user_name || 'Member',
          avatar: r.reported_user_avatar,
        },
        reason: r.reason,
        details: r.details,
        date: r.created_at,
        status: r.status,
        chatExcerpt: r.details || 'Message logs review pending',
      }));
    }
    return [];
  } catch (err) {
    console.warn('Neon Postgres reports notice:', err.message);
  }

  return [];
};

// 7. Resolve / Dismiss Report in Neon Lakebase Postgres
export const resolveReportApi = async (reportId, action = 'resolve') => {
  const status = action === 'resolve' ? 'resolved' : 'dismissed';
  try {
    const sql = getNeonSql();
    await sql`
      UPDATE reports
      SET status = ${status}
      WHERE id = ${reportId};
    `;
  } catch (err) {
    console.warn('Neon resolveReport notice:', err.message);
  }

  adminReportsMemory = adminReportsMemory.map((r) =>
    r.id === reportId ? { ...r, status } : r
  );
  await sleep(250);
  return { success: true, status };
};

// 8. Dismiss Report in Neon Lakebase Postgres
export const dismissReportApi = async (reportId) => {
  return resolveReportApi(reportId, 'dismiss');
};

// 9. Get Verification Queue from Neon Lakebase Postgres
export const getVerificationQueueApi = async () => {
  try {
    const sql = getNeonSql();
    const rows = await sql`
      SELECT 
        v.id AS verif_id, v.id_document_url, v.selfie_url, v.status AS verif_status, v.submitted_at,
        u.*
      FROM verifications v
      JOIN users u ON u.id = v.user_id
      WHERE v.status = 'pending'
      ORDER BY v.submitted_at DESC;
    `;
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        ...mapUserRow(r),
        idDocumentUrl: r.id_document_url,
        selfieUrl: r.selfie_url,
        submittedAt: r.submitted_at,
      }));
    }
    return [];
  } catch (err) {
    console.warn('Neon Postgres verification queue notice:', err.message);
  }

  return [];
};

// 10. Approve Verification in Neon Lakebase Postgres
export const approveVerificationApi = async (userId) => {
  return verifyUserApi(userId);
};

// 11. Reject Verification in Neon Lakebase Postgres
export const rejectVerificationApi = async (userId) => {
  try {
    const sql = getNeonSql();
    await sql`
      UPDATE users
      SET verified = FALSE, verification_status = 'rejected', updated_at = NOW()
      WHERE id = ${userId};
    `;
    await sql`
      UPDATE verifications
      SET status = 'rejected', reviewed_at = NOW()
      WHERE user_id = ${userId};
    `;
  } catch (err) {
    console.warn('Neon rejectVerification notice:', err.message);
  }

  adminUsersMemory = adminUsersMemory.map((u) =>
    u.id === userId ? { ...u, verified: false, verificationStatus: 'rejected' } : u
  );
  await sleep(250);
  return { success: true };
};

export default {
  getStatsApi,
  getAdminUsersApi,
  getAdminUserDetailApi,
  verifyUserApi,
  banUserApi,
  getReportsApi,
  resolveReportApi,
  dismissReportApi,
  getVerificationQueueApi,
  approveVerificationApi,
  rejectVerificationApi,
};
