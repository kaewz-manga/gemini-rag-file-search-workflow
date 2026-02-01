/**
 * Authentication Middleware and Handlers
 * For Gemini RAG File Search MCP
 */

import { Env, AuthContext, ApiResponse } from './saas-types';
import {
  hashPassword,
  verifyPassword,
  generateJWT,
  verifyJWT,
  generateApiKey,
  hashApiKey,
  encrypt,
  decrypt,
} from './crypto-utils';
import {
  createUser,
  getUserByEmail,
  getUserById,
  createConnection,
  getConnectionById,
  createApiKey as createApiKeyDb,
  getApiKeyByHash,
  updateApiKeyLastUsed,
  getOrCreateMonthlyUsage,
  getPlan,
  getCurrentYearMonth,
  countUserConnections,
} from './db';

// ============================================
// Auth Handlers (for Management API)
// ============================================

export async function handleRegister(
  db: D1Database,
  email: string,
  password: string
): Promise<ApiResponse> {
  if (!email || !password) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' },
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid email format' },
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' },
    };
  }

  const existingUser = await getUserByEmail(db, email);
  if (existingUser) {
    return {
      success: false,
      error: { code: 'USER_EXISTS', message: 'User with this email already exists' },
    };
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(db, email, passwordHash);

  return {
    success: true,
    data: {
      user: { id: user.id, email: user.email, plan: user.plan },
    },
  };
}

export async function handleLogin(
  db: D1Database,
  jwtSecret: string,
  email: string,
  password: string
): Promise<ApiResponse> {
  if (!email || !password) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' },
    };
  }

  const user = await getUserByEmail(db, email);
  if (!user) {
    return {
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    };
  }

  if (user.status !== 'active') {
    return {
      success: false,
      error: { code: 'ACCOUNT_SUSPENDED', message: 'Account is suspended or deleted' },
    };
  }

  const validPassword = await verifyPassword(password, user.password_hash);
  if (!validPassword) {
    return {
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    };
  }

  const token = await generateJWT(
    {
      sub: user.id,
      email: user.email,
      plan: user.plan,
      is_admin: user.is_admin || 0,
    },
    jwtSecret
  );

  return {
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        is_admin: user.is_admin || 0,
      },
    },
  };
}

// ============================================
// MCP API Key Authentication
// ============================================

export async function authenticateMcpRequest(
  request: Request,
  env: Env
): Promise<{ context: AuthContext | null; error: ApiResponse | null }> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return {
      context: null,
      error: {
        success: false,
        error: { code: 'MISSING_AUTH', message: 'Authorization header is required' },
      },
    };
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return {
      context: null,
      error: {
        success: false,
        error: { code: 'INVALID_AUTH_FORMAT', message: 'Authorization header must be "Bearer <api_key>"' },
      },
    };
  }

  const apiKey = match[1];

  if (!apiKey.startsWith('grag_')) {
    return {
      context: null,
      error: {
        success: false,
        error: { code: 'INVALID_API_KEY', message: 'Invalid API key format' },
      },
    };
  }

  const keyHash = await hashApiKey(apiKey);
  const cacheKey = `apikey:${keyHash}`;

  let cachedData = await env.RATE_LIMIT_KV?.get(cacheKey, 'json') as {
    user_id: string;
    email: string;
    plan: string;
    connection_id: string;
    gemini_api_key_encrypted: string;
    default_corpus_id: string | null;
    api_key_id: string;
  } | null;

  if (!cachedData) {
    const apiKeyRecord = await getApiKeyByHash(env.DB, keyHash);
    if (!apiKeyRecord) {
      return {
        context: null,
        error: {
          success: false,
          error: { code: 'INVALID_API_KEY', message: 'Invalid or revoked API key' },
        },
      };
    }

    const user = await getUserById(env.DB, apiKeyRecord.user_id);
    if (!user || user.status !== 'active') {
      return {
        context: null,
        error: {
          success: false,
          error: { code: 'ACCOUNT_SUSPENDED', message: 'Account is suspended or deleted' },
        },
      };
    }

    const connection = await getConnectionById(env.DB, apiKeyRecord.connection_id);
    if (!connection || connection.status !== 'active') {
      return {
        context: null,
        error: {
          success: false,
          error: { code: 'CONNECTION_INACTIVE', message: 'Gemini connection is inactive or deleted' },
        },
      };
    }

    cachedData = {
      user_id: user.id,
      email: user.email,
      plan: user.plan,
      connection_id: connection.id,
      gemini_api_key_encrypted: connection.gemini_api_key_encrypted,
      default_corpus_id: connection.default_corpus_id,
      api_key_id: apiKeyRecord.id,
    };

    await env.RATE_LIMIT_KV?.put(cacheKey, JSON.stringify(cachedData), {
      expirationTtl: 3600,
    });
  }

  const plan = await getPlan(env.DB, cachedData.plan);
  const monthlyLimit = plan?.monthly_request_limit || 100;
  const yearMonth = getCurrentYearMonth();
  const usage = await getOrCreateMonthlyUsage(env.DB, cachedData.user_id, yearMonth);

  if (usage.request_count >= monthlyLimit) {
    return {
      context: null,
      error: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Monthly request limit exceeded',
          details: { limit: monthlyLimit, used: usage.request_count, plan: cachedData.plan },
        },
      },
    };
  }

  let geminiApiKey: string;
  try {
    geminiApiKey = await decrypt(cachedData.gemini_api_key_encrypted, env.ENCRYPTION_KEY);
  } catch {
    return {
      context: null,
      error: {
        success: false,
        error: { code: 'DECRYPTION_ERROR', message: 'Failed to decrypt Gemini API key' },
      },
    };
  }

  updateApiKeyLastUsed(env.DB, cachedData.api_key_id).catch(() => {});

  return {
    context: {
      user: {
        id: cachedData.user_id,
        email: cachedData.email,
        plan: cachedData.plan as 'free' | 'starter' | 'pro' | 'enterprise',
      },
      connection: {
        id: cachedData.connection_id,
        gemini_api_key: geminiApiKey,
        default_corpus_id: cachedData.default_corpus_id,
      },
      apiKey: {
        id: cachedData.api_key_id,
      },
      usage: {
        current: usage.request_count,
        limit: monthlyLimit,
        remaining: monthlyLimit - usage.request_count,
      },
    },
    error: null,
  };
}

// ============================================
// Connection & API Key Creation
// ============================================

export async function handleCreateConnection(
  db: D1Database,
  encryptionKey: string,
  userId: string,
  userPlan: string,
  name: string,
  geminiApiKey: string,
  defaultCorpusId?: string
): Promise<ApiResponse> {
  if (!name || !geminiApiKey) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Name and Gemini API key are required' },
    };
  }

  const planInfo = await getPlan(db, userPlan);
  const maxConnections = planInfo?.max_connections || 1;
  const currentConnections = await countUserConnections(db, userId);

  if (maxConnections !== -1 && currentConnections >= maxConnections) {
    return {
      success: false,
      error: {
        code: 'CONNECTION_LIMIT',
        message: `Connection limit reached (${maxConnections} for ${userPlan} plan)`,
      },
    };
  }

  // Test connection to Gemini API
  try {
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/corpora?pageSize=1&key=${geminiApiKey}`
    );
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      return {
        success: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: `Failed to connect to Gemini API: ${testResponse.status} - ${errorText}`,
        },
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'CONNECTION_FAILED',
        message: `Failed to connect to Gemini API: ${err.message}`,
      },
    };
  }

  const encryptedApiKey = await encrypt(geminiApiKey, encryptionKey);
  const connection = await createConnection(db, userId, name, encryptedApiKey, defaultCorpusId || null);

  const { key, hash, prefix } = await generateApiKey();
  await createApiKeyDb(db, userId, connection.id, hash, prefix, 'Default');

  return {
    success: true,
    data: {
      connection: {
        id: connection.id,
        name: connection.name,
        default_corpus_id: connection.default_corpus_id,
        status: connection.status,
        created_at: connection.created_at,
      },
      api_key: key,
      api_key_prefix: prefix,
      message: 'Save your API key now. It will not be shown again.',
    },
  };
}

// ============================================
// JWT Verification (for Management API)
// ============================================

export async function verifyAuthToken(
  request: Request,
  jwtSecret: string
): Promise<{ userId: string; email: string; plan: string; is_admin: number } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1];
  if (token.startsWith('grag_')) return null;

  const payload = await verifyJWT(token, jwtSecret);
  if (!payload) return null;

  return {
    userId: payload.sub,
    email: payload.email,
    plan: payload.plan,
    is_admin: payload.is_admin || 0,
  };
}

export async function verifyAdminToken(
  request: Request,
  jwtSecret: string,
  db: D1Database
): Promise<{ userId: string; email: string } | null> {
  const authUser = await verifyAuthToken(request, jwtSecret);
  if (!authUser) return null;

  const user = await getUserById(db, authUser.userId);
  if (!user || user.is_admin !== 1) return null;

  return { userId: user.id, email: user.email };
}
