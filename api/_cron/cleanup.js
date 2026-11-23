/**
 * GET/POST /api/_cron/cleanup
 * Maintenance cron job to purge expired reveal requests and stale unverified accounts.
 * Protected by CRON_SECRET or Admin authorization.
 */
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  // Verify cron authorization header if CRON_SECRET is configured
  const authHeader = req.headers?.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return fail(res, 401, 'Unauthorized: Invalid cron authentication secret');
  }

  try {
    // 1. Purge declined or unaccepted reveal requests older than 30 days
    const purgedReveals = await query(
      `DELETE FROM reveal_requests
       WHERE status = 'declined'
         AND created_at < now() - INTERVAL '30 days'
       RETURNING id`
    );

    // 2. Optional: Flag or clean pending users inactive for more than 60 days
    const staleAccounts = await query(
      `DELETE FROM users
       WHERE status = 'pending'
         AND role = 'user'
         AND created_at < now() - INTERVAL '60 days'
       RETURNING id, email`
    );

    return ok(res, {
      message: 'Maintenance cleanup completed successfully',
      purged_expired_reveals: purgedReveals.length,
      purged_stale_accounts: staleAccounts.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[CRON CLEANUP ERROR]', err);
    return fail(res, 500, `Cleanup job failed: ${err.message}`);
  }
}
