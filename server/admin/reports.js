/**
 * GET   /api/admin/reports - List safety reports
 * PATCH /api/admin/reports/:id - Resolve or dismiss reports (audit logged)
 */
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAdmin } from '../_lib/auth.js';
import { logAdminAction } from '../_lib/audit.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  try {
    const admin = await requireAdmin(req);

    // ==========================================
    // GET /api/admin/reports (List reports)
    // ==========================================
    if (req.method === 'GET') {
      const { status } = req.query || {};

      const conditions = ['1=1'];
      const values = [];

      if (status) {
        conditions.push(`r.status = $1`);
        values.push(status);
      }

      const reports = await query(
        `SELECT 
          r.id,
          r.reporter_id,
          r.reported_id,
          r.reason,
          r.details,
          r.status,
          r.created_at,
          u_reporter.email AS reporter_email,
          u_reported.email AS reported_email,
          u_reported.display_name AS reported_name,
          u_reported.status AS reported_status
         FROM reports r
         JOIN users u_reporter ON u_reporter.id = r.reporter_id
         JOIN users u_reported ON u_reported.id = r.reported_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY r.created_at DESC`,
        values
      );

      return ok(res, { reports, count: reports.length });
    }

    // ==========================================
    // PATCH /api/admin/reports/:id (Resolve / Dismiss)
    // ==========================================
    if (req.method === 'PATCH') {
      const reportId = req.query?.id || req.url.split('?')[0].split('/').pop();
      const { status, note } = req.body || {};

      if (!status || !['resolved', 'dismissed'].includes(status)) {
        return fail(res, 422, 'Status must be either "resolved" or "dismissed"');
      }

      const updated = await query(
        `UPDATE reports
         SET status = $1, resolved_by = $2
         WHERE id = $3
         RETURNING id, reporter_id, reported_id, reason, status`,
        [status, admin.id, reportId]
      );

      if (!updated || updated.length === 0) {
        return fail(res, 404, 'Report not found');
      }

      const report = updated[0];

      // Audit Log Action
      await logAdminAction(admin.id, `report_${status}`, 'report', reportId, {
        reported_id: report.reported_id,
        reporter_id: report.reporter_id,
        note: note || null
      });

      return ok(res, {
        message: `Report marked as ${status}`,
        report
      });
    }

    return fail(res, 405, 'Method Not Allowed. Use GET or PATCH.');
  } catch (err) {
    console.error('[ADMIN REPORTS ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Operation failed');
  }
}
