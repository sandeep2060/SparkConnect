/**
 * GET /api/admin/chat-log/:chatId (or ?chatId=...)
 * Legal audit inspection of private chat logs.
 * CRITICAL LEGAL PROTECTION:
 * - Requires admin privileges.
 * - MUST provide a "reason" parameter.
 * - Strictly writes to audit_logs BEFORE any chat data is retrieved and returned.
 */
import { query } from '../_lib/db.js';
import { applyCors, ok, fail } from '../_lib/response.js';
import { requireAdmin } from '../_lib/auth.js';
import { logAdminAction } from '../_lib/audit.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return fail(res, 405, 'Method Not Allowed. Use GET or POST.');
  }

  try {
    const admin = await requireAdmin(req);

    // Extract chatId
    const urlParts = req.url.split('?')[0].split('/');
    const lastSegment = urlParts[urlParts.length - 1];
    const chatId = req.query?.chatId || req.query?.id || (lastSegment !== 'chat-log' && lastSegment !== 'chat-log.js' ? lastSegment : null);

    if (!chatId) {
      return fail(res, 400, 'Chat ID is required (provide ?chatId=UUID or /api/admin/chat-log/UUID)');
    }

    // Reason requirement for admin audit compliance
    const reason = req.query?.reason || req.body?.reason || req.headers?.['x-audit-reason'];
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return fail(
        res,
        422,
        'Compliance Violation: A valid "reason" parameter (min 3 characters) is strictly required to inspect private chat records'
      );
    }

    // 1. Verify chat exists
    const chatCheck = await query(
      `SELECT c.id, c.user_a, c.user_b, c.created_at, c.last_message_at,
              ua.email AS user_a_email, ua.display_name AS user_a_name,
              ub.email AS user_b_email, ub.display_name AS user_b_name
       FROM chats c
       JOIN users ua ON ua.id = c.user_a
       JOIN users ub ON ub.id = c.user_b
       WHERE c.id = $1`,
      [chatId]
    );

    if (!chatCheck || chatCheck.length === 0) {
      return fail(res, 404, 'Chat conversation not found');
    }

    const chat = chatCheck[0];

    // 2. CRITICAL AUDIT LOG: Write to audit_logs BEFORE retrieving/returning message content!
    await logAdminAction(admin.id, 'view_chat', 'chat', chatId, {
      reason: reason.trim(),
      inspected_chat_id: chatId,
      user_a: chat.user_a,
      user_b: chat.user_b,
      admin_email: admin.email,
      timestamp: new Date().toISOString()
    });

    // 3. Retrieve messages
    const messages = await query(
      `SELECT m.id, m.chat_id, m.sender_id, m.body, m.read_at, m.created_at,
              u.email AS sender_email, u.display_name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.chat_id = $1
       ORDER BY m.created_at ASC`,
      [chatId]
    );

    return ok(res, {
      chat_id: chatId,
      participants: {
        user_a: { id: chat.user_a, email: chat.user_a_email, name: chat.user_a_name },
        user_b: { id: chat.user_b, email: chat.user_b_email, name: chat.user_b_name }
      },
      audit_logged: true,
      reason: reason.trim(),
      message_count: messages.length,
      messages
    });
  } catch (err) {
    console.error('[ADMIN CHAT LOG ERROR]', err);
    const code = err.statusCode || 500;
    return fail(res, code, err.message || 'Operation failed');
  }
}
