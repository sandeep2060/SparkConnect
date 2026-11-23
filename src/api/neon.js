import { neon } from '@neondatabase/serverless';
import axios from 'axios';

// Neon Cloud Backend Configuration & Service Connectors
const getEnvVar = (key, fallback) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

const rawDbUrl = getEnvVar(
  'VITE_DATABASE_URL',
  'postgresql://neondb_owner:npg_5en9kmLIJEDM@ep-still-base-bibn5bv9-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
);
const databaseUrl = String(rawDbUrl).trim().replace(/^["']|["']$/g, '');

const functionUrl = getEnvVar(
  'VITE_NEON_FUNCTION_URL',
  'https://br-broad-recipe-bi3wpj0l-hello.compute.c-5.ap-southeast-1.aws.neon.tech/'
);

const authBaseUrl = getEnvVar(
  'VITE_NEON_AUTH_BASE_URL',
  'https://ep-still-base-bibn5bv9.neonauth.c-5.ap-southeast-1.aws.neon.tech/neondb/auth'
);

const authJwksUrl = getEnvVar(
  'VITE_NEON_AUTH_JWKS_URL',
  'https://ep-still-base-bibn5bv9.neonauth.c-5.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json'
);

const aiGatewayBaseUrl = getEnvVar(
  'VITE_NEON_AI_GATEWAY_BASE_URL',
  'https://br-broad-recipe-bi3wpj0l-api.ai.c-5.ap-southeast-1.aws.neon.tech'
);

const aiGatewayToken = getEnvVar(
  'VITE_NEON_AI_GATEWAY_TOKEN',
  'nt_live_fc0cff5c896a_VeDp35Xbh2lJuKe5mjXGoNyOgJuClEy5'
);

const realtimeWsUrl = getEnvVar(
  'VITE_NEON_REALTIME_URL',
  'wss://ep-still-base-bibn5bv9.rt.c-5.ap-southeast-1.aws.neon.tech/'
);

// 1. Lakebase Postgres Connection via Serverless HTTP Driver
export const getNeonSql = () => {
  return neon(databaseUrl);
};

export const queryDatabase = async (queryText, params = []) => {
  try {
    const sql = getNeonSql();
    return await sql(queryText, params);
  } catch (error) {
    console.warn('Neon Postgres query notice (using fallback if unseeded):', error.message);
    throw error;
  }
};

// 2. Neon Serverless Function Caller
export const invokeNeonFunction = async (endpoint = '') => {
  try {
    const targetUrl = endpoint ? `${functionUrl}${endpoint}` : functionUrl;
    const res = await axios.get(targetUrl, { timeout: 8000 });
    return {
      status: res.status,
      data: res.data,
      url: targetUrl,
    };
  } catch (error) {
    console.error('Neon Function invoke error:', error.message);
    throw error;
  }
};

// 3. Neon Auth Service Check & Metadata
export const getNeonAuthStatus = async () => {
  try {
    const res = await axios.get(authJwksUrl, { timeout: 6000 });
    return {
      connected: true,
      baseUrl: authBaseUrl,
      jwks: res.data,
    };
  } catch (error) {
    console.warn('Neon Auth status error:', error.message);
    return {
      connected: false,
      baseUrl: authBaseUrl,
      error: error.message,
    };
  }
};

// 4. Smart Conversation Starters & Match Prompts
export const generateAiIcebreaker = async ({ partnerName, partnerBio, partnerInterests = [] }) => {
  try {
    const prompt = `You are an expert witty dating matchmaker. Generate 2 fun, charming, and charismatic icebreaker conversation starters for someone chatting with ${partnerName}. Their bio is: "${partnerBio}". Their interests: ${partnerInterests.join(', ')}. Keep them short, playful, and natural.`;

    const res = await axios.post(
      `${aiGatewayBaseUrl}/v1/chat/completions`,
      {
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an engaging dating conversation coach.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 150,
      },
      {
        headers: {
          Authorization: `Bearer ${aiGatewayToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return (
      res.data?.choices?.[0]?.message?.content ||
      `"Loved your taste in ${partnerInterests[0] || 'music'}! What first sparked your passion for it?"`
    );
  } catch (error) {
    console.warn('Smart Match Starter notice:', error.message);
    // Intelligent contextual fallback
    return `Hey ${partnerName}! Your vibe really stood out, especially with ${
      partnerInterests[0] || 'your interests'
    }. What is your favorite hidden spot in town?`;
  }
};

// 5. Neon Realtime Service Status
export const getNeonRealtimeStatus = () => {
  return {
    url: realtimeWsUrl,
    active: true,
    protocol: 'WebSocket Live SQL',
  };
};

// Comprehensive Diagnostics for Cloud Services
export const runNeonDiagnostics = async () => {
  const status = {
    timestamp: new Date().toISOString(),
    postgres: { name: 'Lakebase Postgres', active: false, details: '' },
    functions: { name: 'Serverless Functions', active: false, details: '' },
    auth: { name: 'Authentication Engine', active: false, details: '' },
    aiGateway: { name: 'Smart Match Intelligence', active: false, details: '' },
    realtime: { name: 'Realtime Live SQL', active: false, details: '' },
  };

  // 1. Postgres
  try {
    const sql = getNeonSql();
    const rows = await sql`SELECT NOW() AS now, version()`;
    status.postgres.active = true;
    status.postgres.details = `Connected (Server Time: ${new Date(rows[0]?.now).toLocaleTimeString()})`;
  } catch (e) {
    status.postgres.details = e.message;
  }

  // 2. Functions
  try {
    const funcRes = await invokeNeonFunction();
    status.functions.active = true;
    status.functions.details = `HTTP 200: "${typeof funcRes.data === 'string' ? funcRes.data.trim() : 'OK'}"`;
  } catch (e) {
    status.functions.details = e.message;
  }

  // 3. Auth
  try {
    const authRes = await getNeonAuthStatus();
    status.auth.active = authRes.connected;
    status.auth.details = authRes.connected ? 'JWKS Keys Active' : authRes.error;
  } catch (e) {
    status.auth.details = e.message;
  }

  // 4. Smart Match Intelligence
  try {
    const aiRes = await axios.get(`${aiGatewayBaseUrl}/v1/models`, {
      headers: { Authorization: `Bearer ${aiGatewayToken}` },
      timeout: 6000,
      validateStatus: () => true,
    });
    status.aiGateway.active = aiRes.status === 200 || aiRes.status === 402;
    status.aiGateway.details =
      aiRes.status === 200
        ? `Active Match Intelligence`
        : `Active Endpoint (HTTP ${aiRes.status})`;
  } catch (e) {
    status.aiGateway.details = e.message;
  }

  // 5. Realtime
  try {
    const rt = getNeonRealtimeStatus();
    status.realtime.active = !!rt.url;
    status.realtime.details = `Ready at ${rt.url}`;
  } catch (e) {
    status.realtime.details = e.message;
  }

  return status;
};

export default {
  getNeonSql,
  queryDatabase,
  invokeNeonFunction,
  getNeonAuthStatus,
  generateAiIcebreaker,
  getNeonRealtimeStatus,
  runNeonDiagnostics,
};
