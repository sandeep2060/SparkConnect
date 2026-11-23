/**
 * Admin Audit Logger
 * Enforces legal protection by logging every sensitive admin action
 */
import { query } from './db.js';

/**
 * Log an administrative action to the audit_logs table
 * @param {string} adminId UUID of the admin performing the action
 * @param {string} action Action name (e.g. 'view_chat', 'ban_user', 'verify_user')
 * @param {string} targetType Entity type ('user', 'chat', 'report')
 * @param {string} targetId Target UUID
 * @param {object} metadata Extra contextual data / justification
 */
export async function logAdminAction(adminId, action, targetType, targetId, metadata = {}) {
  try {
    const metaJson = JSON.stringify(metadata);
    await query(
      `INSERT INTO audit_logs (admin_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, action, targetType, targetId, metaJson]
    );
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err);
    // Rethrow to ensure admin operations do not silently bypass auditing
    throw new Error(`Audit logging failed: ${err.message}`);
  }
}
