/**
 * POST /api/safety/report
 * Files a moderation ticket against a user, stores in database,
 * and sends an immediate one-line notification to the admin via Resend.
 */
import { Resend } from 'resend';
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAuth } from '../_lib/auth.js';
import { reportSchema } from '../_lib/validation.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return fail(res, 405, 'Method Not Allowed. Use POST.');
  }

  try {
    const currentUser = await requireAuth(req);

    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 422, parsed.error.issues[0]?.message || 'Invalid report data');
    }

    const { reported_id, reason, details } = parsed.data;

    if (currentUser.id === reported_id) {
      return fail(res, 400, 'You cannot file a moderation report against yourself');
    }

    // Verify reported user exists
    const reportedCheck = await query(
      `SELECT id, email, display_name, pseudonym FROM users WHERE id = $1`,
      [reported_id]
    );

    if (!reportedCheck || reportedCheck.length === 0) {
      return fail(res, 404, 'Reported user does not exist');
    }

    const reportedUser = reportedCheck[0];

    // Insert report into reports table
    const result = await query(
      `INSERT INTO reports (reporter_id, reported_id, reason, details, status, created_at)
       VALUES ($1, $2, $3, $4, 'open', now())
       RETURNING id, reporter_id, reported_id, reason, details, status, created_at`,
      [currentUser.id, reported_id, reason, details || null]
    );

    const report = result[0];

    // Business Rule 6: Send email to admin via Resend (one-line notify)
    const resendApiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sparkconnect.app';

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: 'safety@sparkconnect.app',
          to: adminEmail,
          subject: `[Safety Alert] New Report filed against ${reportedUser.display_name || reportedUser.pseudonym || reported_id}`,
          text: `User ${currentUser.email} (${currentUser.id}) reported ${reportedUser.email || reported_id} for "${reason}". Details: ${details || 'None provided'}. Report ID: ${report.id}`
        });
        console.log(`[SAFETY REPORT] Email sent to ${adminEmail} for report ${report.id}`);
      } catch (emailErr) {
        // Log error but do not block client response
        console.error('[SAFETY RESEND ERROR]', emailErr.message);
      }
    } else {
      console.log(`[SAFETY REPORT MOCK RESEND] Notify -> ${adminEmail}: Report ${report.id} on user ${reported_id} for "${reason}"`);
    }

    return ok(res, {
      message: 'Safety report submitted successfully. Our trust & safety team has been notified.',
      report
    }, 201);
  } catch (err) {
    console.error('[SAFETY REPORT ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Failed to submit report');
  }
}
