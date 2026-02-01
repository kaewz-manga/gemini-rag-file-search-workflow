/**
 * Gemini RAG File Search MCP Server for Cloudflare Workers
 * Model Context Protocol server for Gemini File Search API
 */

import { GeminiClient } from './gemini-client';
import { MCPToolResponse } from './types';
import { Env, ApiResponse, AuthContext, RateLimitInfo } from './saas-types';
import { TOOLS } from './tools';
import {
  handleRegister,
  handleLogin,
  handleCreateConnection,
  authenticateMcpRequest,
  verifyAuthToken,
  verifyAdminToken,
} from './auth';
import {
  getUserById,
  getConnectionsByUserId,
  getConnectionById,
  getApiKeysByUserId,
  deleteConnection,
  revokeApiKey,
  getOrCreateMonthlyUsage,
  incrementMonthlyUsage,
  logUsage,
  getPlan,
  getAllPlans,
  getCurrentYearMonth,
  getNextMonthReset,
  countUserConnections,
  updateUserPassword,
  deleteUser,
  getAllUsers,
  updateUserStatus,
  adminUpdateUserPlan,
  logAdminAction,
  getAdminStats,
} from './db';
import { hashPassword, verifyPassword, decrypt, generateApiKey, hashApiKey } from './crypto-utils';
import { createApiKey as createApiKeyDb } from './db';

// ============================================
// CORS Headers
// ============================================
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Connection-Id',
};

// ============================================
// Response Helpers
// ============================================

function jsonResponse(data: any, status: number = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

function apiResponse<T>(data: ApiResponse<T>, status: number = 200, rateLimitInfo?: RateLimitInfo): Response {
  const headers: Record<string, string> = {};
  if (rateLimitInfo) {
    headers['X-RateLimit-Limit'] = String(rateLimitInfo.limit);
    headers['X-RateLimit-Remaining'] = String(rateLimitInfo.remaining);
    headers['X-RateLimit-Reset'] = rateLimitInfo.reset;
  }
  return jsonResponse(
    { ...data, meta: { request_id: crypto.randomUUID(), timestamp: new Date().toISOString() } },
    status,
    headers
  );
}

function jsonRpcResponse(id: string | number | null, result: any, rateLimitInfo?: RateLimitInfo): Response {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...CORS_HEADERS };
  if (rateLimitInfo) {
    headers['X-RateLimit-Limit'] = String(rateLimitInfo.limit);
    headers['X-RateLimit-Remaining'] = String(rateLimitInfo.remaining);
    headers['X-RateLimit-Reset'] = rateLimitInfo.reset;
  }
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), { headers });
}

function jsonRpcError(id: string | number | null, code: number, message: string): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }),
    {
      status: code === -32600 ? 400 : 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    }
  );
}

// ============================================
// MCP Tool Handler
// ============================================

async function handleToolCall(
  toolName: string,
  args: any,
  client: GeminiClient
): Promise<MCPToolResponse> {
  let result: any;

  try {
    switch (toolName) {
      // ========== Store Operations ==========
      case 'gemini_create_store':
        result = await client.createStore(args.display_name);
        break;

      case 'gemini_get_store':
        result = await client.getStore(args.store_id);
        break;

      case 'gemini_list_stores':
        result = await client.listStores(args.page_size || 20, args.page_token);
        break;

      case 'gemini_delete_store':
        await client.deleteStore(args.store_id, args.force || false);
        result = { success: true, message: `Store ${args.store_id} deleted successfully` };
        break;

      // ========== Upload / Import Operations ==========
      case 'gemini_upload_text':
        result = await client.uploadTextToStore(args.store_id, args.text_content, {
          displayName: args.display_name,
          customMetadata: args.metadata,
        });
        break;

      case 'gemini_import_url':
        result = await client.importFromUrl(args.store_id, args.url, args.display_name, {
          customMetadata: args.metadata,
        });
        break;

      case 'gemini_import_file':
        result = await client.importFileToStore(args.store_id, args.file_name, args.metadata);
        break;

      // ========== Document Operations ==========
      case 'gemini_list_documents':
        result = await client.listDocuments(args.store_id, args.page_size || 20, args.page_token);
        break;

      case 'gemini_get_document':
        result = await client.getDocument(args.store_id, args.document_id);
        break;

      case 'gemini_delete_document':
        await client.deleteDocument(args.document_name, args.force || false);
        result = { success: true, message: `Document ${args.document_name} deleted successfully` };
        break;

      // ========== Search Operations ==========
      case 'gemini_search_store': {
        const searchResult = await client.searchStore(args.store_id, args.query, {
          model: args.model,
          temperature: args.temperature,
          maxOutputTokens: args.max_output_tokens,
          topK: args.top_k,
          metadataFilter: args.metadata_filter,
        });

        const answer = searchResult.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer generated';
        const grounding = searchResult.candidates?.[0]?.groundingMetadata;

        result = {
          answer,
          model: args.model || 'gemini-2.0-flash',
          usage: searchResult.usageMetadata,
          grounding: grounding
            ? {
                chunks: grounding.groundingChunks,
                supports: grounding.groundingSupports,
              }
            : null,
        };
        break;
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
    };
  }
}

// ============================================
// Management API Routes
// ============================================

async function handleManagementApi(
  request: Request,
  env: Env,
  path: string
): Promise<Response> {
  const method = request.method;

  // Auth endpoints (no auth required)
  if (path === '/api/auth/register' && method === 'POST') {
    const body = await request.json() as { email: string; password: string };
    const result = await handleRegister(env.DB, body.email, body.password);
    return apiResponse(result, result.success ? 201 : 400);
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const body = await request.json() as { email: string; password: string };
    const result = await handleLogin(env.DB, env.JWT_SECRET, body.email, body.password);
    return apiResponse(result, result.success ? 200 : 401);
  }

  // Plans endpoint (public)
  if (path === '/api/plans' && method === 'GET') {
    const plans = await getAllPlans(env.DB);
    return apiResponse({
      success: true,
      data: {
        plans: plans.map(p => ({
          id: p.id,
          name: p.name,
          monthly_request_limit: p.monthly_request_limit,
          max_connections: p.max_connections,
          price_monthly: p.price_monthly,
          features: JSON.parse(p.features || '{}'),
        })),
      },
    });
  }

  // All other endpoints require JWT auth
  const authUser = await verifyAuthToken(request, env.JWT_SECRET);
  if (!authUser) {
    return apiResponse(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } },
      401
    );
  }

  // ========== Admin API ==========
  if (path.startsWith('/api/admin/')) {
    const admin = await verifyAdminToken(request, env.JWT_SECRET, env.DB);
    if (!admin) {
      return apiResponse(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        403
      );
    }

    if (path === '/api/admin/stats' && method === 'GET') {
      const stats = await getAdminStats(env.DB);
      return apiResponse({ success: true, data: stats });
    }

    if (path === '/api/admin/users' && method === 'GET') {
      const params = new URL(request.url).searchParams;
      const result = await getAllUsers(env.DB, {
        limit: parseInt(params.get('limit') || '20'),
        offset: parseInt(params.get('offset') || '0'),
        plan: params.get('plan') || undefined,
        status: params.get('status') || undefined,
        search: params.get('search') || undefined,
      });
      return apiResponse({ success: true, data: result });
    }

    const planMatch = path.match(/^\/api\/admin\/users\/([^/]+)\/plan$/);
    if (planMatch && method === 'PUT') {
      const body = await request.json() as { plan: string };
      const validPlans = ['free', 'starter', 'pro', 'enterprise'];
      if (!validPlans.includes(body.plan)) {
        return apiResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid plan' } }, 400);
      }
      await adminUpdateUserPlan(env.DB, planMatch[1], body.plan);
      await logAdminAction(env.DB, admin.userId, 'change_plan', planMatch[1], { plan: body.plan });
      return apiResponse({ success: true, data: { message: 'Plan updated' } });
    }

    const statusMatch = path.match(/^\/api\/admin\/users\/([^/]+)\/status$/);
    if (statusMatch && method === 'PUT') {
      const body = await request.json() as { status: string };
      if (!['active', 'suspended'].includes(body.status)) {
        return apiResponse({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid status' } }, 400);
      }
      await updateUserStatus(env.DB, statusMatch[1], body.status);
      await logAdminAction(env.DB, admin.userId, 'change_status', statusMatch[1], { status: body.status });
      return apiResponse({ success: true, data: { message: 'Status updated' } });
    }

    return apiResponse({ success: false, error: { code: 'NOT_FOUND', message: 'Admin endpoint not found' } }, 404);
  }

  // ========== User Profile ==========
  if (path === '/api/user/profile' && method === 'GET') {
    const user = await getUserById(env.DB, authUser.userId);
    if (!user) {
      return apiResponse({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
    }
    return apiResponse({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        status: user.status,
        is_admin: user.is_admin || 0,
        created_at: user.created_at,
      },
    });
  }

  if (path === '/api/user/password' && method === 'PUT') {
    const body = await request.json() as { current_password: string; new_password: string };
    if (!body.current_password || !body.new_password) {
      return apiResponse({ success: false, error: { code: 'INVALID_REQUEST', message: 'Current and new password required' } }, 400);
    }
    if (body.new_password.length < 8) {
      return apiResponse({ success: false, error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } }, 400);
    }
    const user = await getUserById(env.DB, authUser.userId);
    if (!user) {
      return apiResponse({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
    }
    const validPassword = await verifyPassword(body.current_password, user.password_hash);
    if (!validPassword) {
      return apiResponse({ success: false, error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } }, 401);
    }
    const newHash = await hashPassword(body.new_password);
    await updateUserPassword(env.DB, authUser.userId, newHash);
    return apiResponse({ success: true, data: { message: 'Password updated successfully' } });
  }

  // ========== Connections ==========
  if (path === '/api/connections' && method === 'GET') {
    const connections = await getConnectionsByUserId(env.DB, authUser.userId);
    const apiKeys = await getApiKeysByUserId(env.DB, authUser.userId);
    return apiResponse({
      success: true,
      data: {
        connections: connections.map(c => ({
          id: c.id,
          name: c.name,
          default_corpus_id: c.default_corpus_id,
          status: c.status,
          created_at: c.created_at,
          api_keys: apiKeys
            .filter(k => k.connection_id === c.id)
            .map(k => ({
              id: k.id,
              prefix: k.key_prefix,
              name: k.name,
              status: k.status,
              last_used_at: k.last_used_at,
              created_at: k.created_at,
            })),
        })),
      },
    });
  }

  if (path === '/api/connections' && method === 'POST') {
    const body = await request.json() as { name: string; gemini_api_key: string; default_corpus_id?: string };
    const result = await handleCreateConnection(
      env.DB,
      env.ENCRYPTION_KEY,
      authUser.userId,
      authUser.plan,
      body.name,
      body.gemini_api_key,
      body.default_corpus_id
    );
    return apiResponse(result, result.success ? 201 : 400);
  }

  const deleteConnectionMatch = path.match(/^\/api\/connections\/([^\/]+)$/);
  if (deleteConnectionMatch && method === 'DELETE') {
    const connectionId = deleteConnectionMatch[1];
    const connections = await getConnectionsByUserId(env.DB, authUser.userId);
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) {
      return apiResponse({ success: false, error: { code: 'NOT_FOUND', message: 'Connection not found' } }, 404);
    }
    await deleteConnection(env.DB, connectionId);
    return apiResponse({ success: true, data: { message: 'Connection deleted' } });
  }

  // ========== API Keys ==========
  const newApiKeyMatch = path.match(/^\/api\/connections\/([^\/]+)\/api-keys$/);
  if (newApiKeyMatch && method === 'POST') {
    const connectionId = newApiKeyMatch[1];
    const connections = await getConnectionsByUserId(env.DB, authUser.userId);
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) {
      return apiResponse({ success: false, error: { code: 'NOT_FOUND', message: 'Connection not found' } }, 404);
    }
    const body = await request.json().catch(() => ({})) as { name?: string };
    const { key, hash, prefix } = await generateApiKey();
    await createApiKeyDb(env.DB, authUser.userId, connectionId, hash, prefix, body.name || 'API Key');
    return apiResponse({
      success: true,
      data: {
        api_key: key,
        prefix,
        message: 'Save your API key now. It will not be shown again.',
      },
    }, 201);
  }

  const revokeKeyMatch = path.match(/^\/api\/api-keys\/([^\/]+)$/);
  if (revokeKeyMatch && method === 'DELETE') {
    const keyId = revokeKeyMatch[1];
    const apiKeys = await getApiKeysByUserId(env.DB, authUser.userId);
    const apiKey = apiKeys.find(k => k.id === keyId);
    if (!apiKey) {
      return apiResponse({ success: false, error: { code: 'NOT_FOUND', message: 'API key not found' } }, 404);
    }
    await revokeApiKey(env.DB, keyId);
    return apiResponse({ success: true, data: { message: 'API key revoked' } });
  }

  // ========== Usage ==========
  if (path === '/api/usage' && method === 'GET') {
    const yearMonth = getCurrentYearMonth();
    const usage = await getOrCreateMonthlyUsage(env.DB, authUser.userId, yearMonth);
    const freshUser = await getUserById(env.DB, authUser.userId);
    const currentPlanId = freshUser?.plan || authUser.plan;
    const plan = await getPlan(env.DB, currentPlanId);
    const connectionCount = await countUserConnections(env.DB, authUser.userId);

    return apiResponse({
      success: true,
      data: {
        plan: currentPlanId,
        period: yearMonth,
        requests: {
          used: usage.request_count,
          limit: plan?.monthly_request_limit || 100,
          remaining: Math.max(0, (plan?.monthly_request_limit || 100) - usage.request_count),
        },
        connections: {
          used: connectionCount,
          limit: plan?.max_connections || 1,
        },
        success_rate: usage.request_count > 0
          ? Math.round((usage.success_count / usage.request_count) * 100)
          : 100,
        reset_at: getNextMonthReset(),
      },
    });
  }

  return apiResponse({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }, 404);
}

// ============================================
// MCP Protocol Handler
// ============================================

async function handleMcpRequest(
  request: Request,
  env: Env,
  authContext: AuthContext
): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonRpcError(null, -32700, 'Parse error: Invalid JSON');
  }

  const { jsonrpc, id, method, params } = body;

  if (jsonrpc !== '2.0') {
    return jsonRpcError(id, -32600, 'Invalid Request: jsonrpc must be "2.0"');
  }

  const rateLimitInfo: RateLimitInfo = {
    limit: authContext.usage.limit,
    remaining: authContext.usage.remaining,
    reset: getNextMonthReset(),
  };

  try {
    switch (method) {
      case 'initialize': {
        return jsonRpcResponse(
          id,
          {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: {
              name: 'gemini-rag-file-search-mcp',
              version: '1.0.0',
            },
          },
          rateLimitInfo
        );
      }

      case 'notifications/initialized': {
        return jsonRpcResponse(id, {}, rateLimitInfo);
      }

      case 'tools/list': {
        return jsonRpcResponse(id, { tools: TOOLS }, rateLimitInfo);
      }

      case 'tools/call': {
        const startTime = Date.now();
        const { name: toolName, arguments: args } = params;

        const client = new GeminiClient({
          apiKey: authContext.connection.gemini_api_key,
        });

        const result = await handleToolCall(toolName, args || {}, client);
        const responseTime = Date.now() - startTime;

        const isError = result.content[0]?.text?.startsWith('Error:');

        const yearMonth = getCurrentYearMonth();
        await Promise.all([
          incrementMonthlyUsage(env.DB, authContext.user.id, yearMonth, !isError),
          logUsage(
            env.DB,
            authContext.user.id,
            authContext.apiKey.id,
            authContext.connection.id,
            toolName,
            isError ? 'error' : 'success',
            responseTime,
            isError ? result.content[0]?.text : null
          ),
        ]);

        rateLimitInfo.remaining = Math.max(0, rateLimitInfo.remaining - 1);

        return jsonRpcResponse(id, result, rateLimitInfo);
      }

      case 'ping': {
        return jsonRpcResponse(id, {}, rateLimitInfo);
      }

      default: {
        return jsonRpcError(id, -32601, `Method not found: ${method}`);
      }
    }
  } catch (error: any) {
    return jsonRpcError(id, -32603, `Internal error: ${error.message}`);
  }
}

// ============================================
// Main Handler
// ============================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Health check
    if (path === '/' && request.method === 'GET') {
      return jsonResponse({
        name: 'gemini-rag-file-search-mcp',
        version: '1.0.0',
        description: 'Gemini RAG File Search MCP Server',
        status: 'ok',
        endpoints: {
          mcp: '/mcp',
          api: '/api/*',
        },
        tools: TOOLS.length,
      });
    }

    // Management API
    if (path.startsWith('/api/')) {
      return handleManagementApi(request, env, path);
    }

    // MCP endpoint
    if (path === '/mcp' && request.method === 'POST') {
      try {
        const { context, error } = await authenticateMcpRequest(request, env);

        if (error) {
          return jsonRpcError(null, -32000, error.error?.message || 'Authentication failed');
        }

        if (!context) {
          return jsonRpcError(null, -32000, 'Authentication failed');
        }

        return handleMcpRequest(request, env, context);
      } catch (err: any) {
        return jsonRpcError(null, -32603, `Internal error: ${err.message}`);
      }
    }

    // Not found
    return jsonResponse({ error: 'Not found' }, 404);
  },
};
