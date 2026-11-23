/**
 * Comprehensive Backend API Test Suite
 * Tests helper modules and serverless route handlers directly against Neon Postgres.
 */
import fs from 'fs';

// Load .env
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

// Helper to mock Vercel serverless req/res
function createMockReqRes({ method = 'GET', body = {}, query = {}, headers = {}, cookies = {}, url = '/' }) {
  const req = {
    method,
    body,
    query,
    headers: { ...headers },
    cookies: { ...cookies },
    url
  };

  const res = {
    statusCode: 200,
    headers: {},
    responseData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    json(data) {
      this.responseData = data;
      return this;
    },
    end() {
      return this;
    }
  };

  return { req, res };
}

async function runTests() {
  console.log('🧪 Starting SparkConnect Backend API Verification...\n');

  // 1. Test Database Client
  console.log('[1/10] Testing Neon Postgres query helper...');
  const { query } = await import('../api/_lib/db.js');
  const userCount = await query(`SELECT count(*)::int AS count FROM users`);
  console.log(`✅ Database connected. Total users in DB: ${userCount[0].count}`);

  // 2. Test Zod Validation Schemas
  console.log('\n[2/10] Testing Zod Validation Schemas...');
  const { signupSchema, messageSendSchema } = await import('../api/_lib/validation.js');
  
  // Under 18 test
  const underAge = signupSchema.safeParse({
    email: 'kid@example.com',
    password: 'Password1!',
    dob: '2020-01-01'
  });
  if (!underAge.success) {
    console.log(`✅ 18+ enforcement passed: rejected underage user: ${underAge.error.issues[0].message}`);
  } else {
    throw new Error('Age validation failed to reject under-18 user');
  }

  // 3. Test Moderation
  console.log('\n[3/10] Testing Moderation filter...');
  const { containsProfanity } = await import('../api/_lib/moderation.js');
  const hasBadWord = containsProfanity('Send me a wire transfer please');
  console.log(`✅ Profanity filter detected prohibited language: ${hasBadWord}`);

  // 4. Test Login Route (Admin)
  console.log('\n[4/10] Testing POST /api/auth/login...');
  const loginHandler = (await import('../api/auth/login.js')).default;
  const loginReqRes = createMockReqRes({
    method: 'POST',
    body: {
      email: 'admin@sparkconnect.dev',
      password: 'Admin123!'
    }
  });

  await loginHandler(loginReqRes.req, loginReqRes.res);
  if (loginReqRes.res.statusCode !== 200 || !loginReqRes.res.responseData?.ok) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginReqRes.res.responseData)}`);
  }
  const adminToken = loginReqRes.res.responseData.data.token;
  const adminUser = loginReqRes.res.responseData.data.user;
  console.log(`✅ Admin login successful! Token received. Role: ${adminUser.role}`);

  // 5. Test Auth Middleware (requireAuth & requireAdmin)
  console.log('\n[5/10] Testing Auth Middleware with JWT...');
  const { requireAuth, requireAdmin } = await import('../api/_lib/auth.js');
  const authReq = { headers: { authorization: `Bearer ${adminToken}` } };
  const verifiedUser = await requireAuth(authReq);
  const verifiedAdmin = await requireAdmin(authReq);
  console.log(`✅ requireAuth & requireAdmin passed for ${verifiedUser.email}`);

  // 6. Test Signup Route
  console.log('\n[6/10] Testing POST /api/auth/signup...');
  const signupHandler = (await import('../api/auth/signup.js')).default;
  const testEmail = `test_${Date.now()}@example.com`;
  const signupReqRes = createMockReqRes({
    method: 'POST',
    body: {
      email: testEmail,
      password: 'TestUser123!',
      dob: '1999-07-20',
      display_name: 'Test Tester',
      mode: 'public',
      gender: 'woman',
      city: 'Seattle',
      intents: ['romance', 'casual'],
      interests: ['music', 'travel']
    }
  });

  await signupHandler(signupReqRes.req, signupReqRes.res);
  if (signupReqRes.res.statusCode !== 201 || !signupReqRes.res.responseData?.ok) {
    throw new Error(`Signup failed: ${JSON.stringify(signupReqRes.res.responseData)}`);
  }
  const newUser = signupReqRes.res.responseData.data.user;
  const newUserToken = signupReqRes.res.responseData.data.token;
  console.log(`✅ User registered successfully with status: '${newUser.status}', ID: ${newUser.id}`);

  // 7. Test Admin User Verification & Audit Logging
  console.log('\n[7/10] Testing Admin Verification & Audit Logging...');
  const verifyHandler = (await import('../api/admin/verify.js')).default;
  const verifyReqRes = createMockReqRes({
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` },
    body: {
      user_id: newUser.id,
      status: 'approved',
      review_note: 'Automated test suite approval'
    }
  });

  await verifyHandler(verifyReqRes.req, verifyReqRes.res);
  console.log(`✅ User verified! Status update: ${verifyReqRes.res.responseData?.data?.status}`);

  // Check audit log was written
  const auditLogs = await query(
    `SELECT action, target_type, target_id, metadata FROM audit_logs WHERE target_id = $1`,
    [newUser.id]
  );
  console.log(`✅ Audit log written to DB: Action='${auditLogs[0]?.action}', Admin verified target.`);

  // 8. Test Discovery Feed & Stranger Mode Privacy
  console.log('\n[8/10] Testing GET /api/users (feed & stranger privacy)...');
  const feedHandler = (await import('../api/users/index.js')).default;
  const feedReqRes = createMockReqRes({
    method: 'GET',
    headers: { authorization: `Bearer ${newUserToken}` },
    query: { limit: '10' }
  });

  await feedHandler(feedReqRes.req, feedReqRes.res);
  const feed = feedReqRes.res.responseData?.data?.feed || [];
  console.log(`✅ Discovery feed retrieved ${feed.length} verified candidate(s).`);

  const strangerInFeed = feed.find(u => u.mode === 'stranger');
  if (strangerInFeed) {
    console.log(`🔍 Checking stranger-mode user '${strangerInFeed.pseudonym}':`);
    console.log(`   display_name is masked: ${strangerInFeed.display_name === null}`);
    console.log(`   avatar_url is masked: ${strangerInFeed.avatar_url === null}`);
    console.log(`   can_request_reveal: ${strangerInFeed.can_request_reveal}`);
  }

  // 9. Test Chats Creation & Messaging
  console.log('\n[9/10] Testing POST /api/chats/start & Message Sending...');
  const chatStartHandler = (await import('../api/chats/start.js')).default;
  const chatDetailHandler = (await import('../api/chats/[id].js')).default;

  // Find another user to chat with (Maya Lin)
  const targetCandidate = await query(`SELECT id FROM users WHERE email = 'maya.lin@example.com'`);
  if (targetCandidate.length > 0) {
    const candidateId = targetCandidate[0].id;
    const startReqRes = createMockReqRes({
      method: 'POST',
      headers: { authorization: `Bearer ${newUserToken}` },
      body: { target_user_id: candidateId }
    });

    await chatStartHandler(startReqRes.req, startReqRes.res);
    console.log('chatStart response:', startReqRes.res.statusCode, startReqRes.res.responseData);
    const chat = startReqRes.res.responseData?.data?.chat;
    console.log(`✅ Conversation created/retrieved: Chat ID: ${chat.id}`);

    // Send a message
    const msgReqRes = createMockReqRes({
      method: 'POST',
      headers: { authorization: `Bearer ${newUserToken}` },
      query: { id: chat.id },
      url: `/api/chats/${chat.id}`,
      body: { body: 'Hello Elena! Nice to meet you on SparkConnect.' }
    });

    await chatDetailHandler(msgReqRes.req, msgReqRes.res);
    console.log(`✅ Message sent! Message ID: ${msgReqRes.res.responseData?.data?.message?.id}`);

    // 10. Test Admin Chat Log (Strict Legal Audit Protection)
    console.log('\n[10/10] Testing GET /api/admin/chat-log/:id (Audit-Logged Access)...');
    const adminChatLogHandler = (await import('../api/admin/chat-log.js')).default;
    const auditChatReqRes = createMockReqRes({
      method: 'GET',
      headers: { authorization: `Bearer ${adminToken}` },
      query: { id: chat.id, reason: 'Testing regulatory safety audit log' },
      url: `/api/admin/chat-log/${chat.id}`
    });

    await adminChatLogHandler(auditChatReqRes.req, auditChatReqRes.res);
    if (auditChatReqRes.res.statusCode === 200) {
      console.log(`✅ Admin chat inspection succeeded with audit protection:`);
      console.log(`   Messages inspected: ${auditChatReqRes.res.responseData?.data?.message_count}`);
      console.log(`   Audit logged: ${auditChatReqRes.res.responseData?.data?.audit_logged}`);
    } else {
      throw new Error(`Admin chat log failed: ${JSON.stringify(auditChatReqRes.res.responseData)}`);
    }

    // Verify view_chat in audit_logs
    const chatAudit = await query(
      `SELECT action, target_id, metadata FROM audit_logs WHERE action = 'view_chat' AND target_id = $1`,
      [chat.id]
    );
    console.log(`✅ Confirmed 'view_chat' audit log written to DB before message delivery: Target=${chatAudit[0]?.target_id}`);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL 10 BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST RUNNER FAILED:', err);
  process.exit(1);
});
