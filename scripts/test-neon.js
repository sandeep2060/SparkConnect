import { neon } from '@neondatabase/serverless';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Read .env file directly
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
});

console.log('--- Testing Neon Services Integration ---');

async function testAll() {
  const results = {
    postgres: false,
    functions: false,
    auth: false,
    aiGateway: false,
    realtime: false,
  };

  // 1. Test Postgres
  try {
    console.log('\n[1/5] Testing Neon Postgres Database...');
    const sql = neon(env.DATABASE_URL);
    const dbRes = await sql`SELECT NOW() AS now, version()`;
    console.log('✅ Postgres Success! Server time:', dbRes[0]?.now);
    
    // Create schema if needed
    await sql`
      CREATE TABLE IF NOT EXISTS sparkconnect_members (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(64) UNIQUE,
        name VARCHAR(128),
        mode VARCHAR(32) DEFAULT 'public',
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    const count = await sql`SELECT count(*) FROM sparkconnect_members`;
    console.log('✅ sparkconnect_members table verified. Row count:', count[0]?.count);
    results.postgres = true;
  } catch (err) {
    console.error('❌ Postgres Error:', err.message);
  }

  // 2. Test Neon Functions
  try {
    console.log('\n[2/5] Testing Neon Functions...');
    const funcUrl = 'https://br-broad-recipe-bi3wpj0l-hello.compute.c-5.ap-southeast-1.aws.neon.tech/';
    const funcRes = await axios.get(funcUrl, { timeout: 10000 });
    console.log(`✅ Functions Success! Status: ${funcRes.status}, Response: "${funcRes.data}"`);
    results.functions = true;
  } catch (err) {
    console.error('❌ Functions Error:', err.message);
  }

  // 3. Test Neon Auth (Managed Better Auth)
  try {
    console.log('\n[3/5] Testing Neon Auth JWKS...');
    const authUrl = env.NEON_AUTH_JWKS_URL;
    const authRes = await axios.get(authUrl, { timeout: 10000 });
    console.log(`✅ Auth JWKS Success! Status: ${authRes.status}, Keys available: ${authRes.data?.keys?.length ?? 'endpoint active'}`);
    results.auth = true;
  } catch (err) {
    console.error('❌ Auth Error:', err.message);
  }

  // 4. Test Neon AI Gateway
  try {
    console.log('\n[4/5] Testing Neon AI Gateway...');
    const aiBase = env.NEON_AI_GATEWAY_BASE_URL;
    const aiToken = env.NEON_AI_GATEWAY_TOKEN;
    const aiRes = await axios.get(`${aiBase}/v1/models`, {
      headers: { Authorization: `Bearer ${aiToken}` },
      timeout: 10000,
      validateStatus: () => true, // Don't throw on 402 if credits warning
    });
    console.log(`✅ AI Gateway Reachable! Status: ${aiRes.status}`);
    if (aiRes.status === 200) {
      console.log('Models available:', aiRes.data?.data?.length || 'catalog active');
    } else if (aiRes.status === 402 || aiRes.data?.error) {
      console.log('Gateway responded with active billing notice:', aiRes.data?.error?.message || aiRes.status);
    }
    results.aiGateway = true;
  } catch (err) {
    console.error('❌ AI Gateway Error:', err.message);
  }

  // 5. Test Neon Realtime
  try {
    console.log('\n[5/5] Testing Neon Realtime Endpoint...');
    const rtUrl = env.NEON_REALTIME_URL;
    const httpRtUrl = rtUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    const rtRes = await axios.get(httpRtUrl, {
      timeout: 10000,
      validateStatus: () => true,
    });
    console.log(`✅ Realtime Endpoint Reachable! Status: ${rtRes.status}`);
    results.realtime = true;
  } catch (err) {
    console.error('❌ Realtime Error:', err.message);
  }

  console.log('\n======================================');
  console.log('Neon Services Verification Summary:');
  console.log(JSON.stringify(results, null, 2));
  console.log('======================================');
}

testAll();
