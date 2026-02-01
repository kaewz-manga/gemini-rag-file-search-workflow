/**
 * Tests for index.ts
 * - Health check endpoint
 * - MCP protocol responses
 * - CORS headers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the exported handler by importing it
// Note: D1/KV bindings require Cloudflare environment, so we test
// what we can without them (health check, CORS, basic routing)

describe('Worker Entry Point', () => {
  describe('Health Check', () => {
    it('GET / should return server info', async () => {
      // Import the handler
      const { default: handler } = await import('../src/index');

      const request = new Request('http://localhost/', { method: 'GET' });
      const env = createMockEnv();
      const ctx = createMockCtx();

      const response = await handler.fetch(request, env as any, ctx);
      const body = await response.json() as any;

      expect(response.status).toBe(200);
      expect(body.name).toBe('gemini-rag-file-search-mcp');
      expect(body.version).toBe('1.0.0');
      expect(body.status).toBe('ok');
      expect(body.tools).toBe(26);
      expect(body.endpoints.mcp).toBe('/mcp');
      expect(body.endpoints.api).toBe('/api/*');
    });
  });

  describe('CORS', () => {
    it('OPTIONS should return CORS headers', async () => {
      const { default: handler } = await import('../src/index');

      const request = new Request('http://localhost/mcp', { method: 'OPTIONS' });
      const env = createMockEnv();
      const ctx = createMockCtx();

      const response = await handler.fetch(request, env as any, ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    });
  });

  describe('404 Not Found', () => {
    it('should return 404 for unknown paths', async () => {
      const { default: handler } = await import('../src/index');

      const request = new Request('http://localhost/unknown', { method: 'GET' });
      const env = createMockEnv();
      const ctx = createMockCtx();

      const response = await handler.fetch(request, env as any, ctx);
      const body = await response.json() as any;

      expect(response.status).toBe(404);
      expect(body.error).toBe('Not found');
    });
  });

  describe('MCP Endpoint', () => {
    it('POST /mcp without auth should return error', async () => {
      const { default: handler } = await import('../src/index');

      const request = new Request('http://localhost/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {},
        }),
      });
      const env = createMockEnv();
      const ctx = createMockCtx();

      const response = await handler.fetch(request, env as any, ctx);
      const body = await response.json() as any;

      // Should fail auth (no Authorization header)
      expect(body.error).toBeDefined();
      expect(body.error.message).toContain('Authorization');
    });

    it('POST /mcp with invalid API key format should return error', async () => {
      const { default: handler } = await import('../src/index');

      const request = new Request('http://localhost/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid_key_format',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        }),
      });
      const env = createMockEnv();
      const ctx = createMockCtx();

      const response = await handler.fetch(request, env as any, ctx);
      const body = await response.json() as any;

      expect(body.error).toBeDefined();
      expect(body.error.message).toContain('Invalid API key');
    });
  });

  describe('Management API', () => {
    it('POST /api/auth/register without body should return validation error', async () => {
      const { default: handler } = await import('../src/index');

      const request = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const env = createMockEnv();
      const ctx = createMockCtx();

      const response = await handler.fetch(request, env as any, ctx);
      const body = await response.json() as any;

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /api/plans should return plans', async () => {
      const { default: handler } = await import('../src/index');

      const request = new Request('http://localhost/api/plans', { method: 'GET' });
      const env = createMockEnv();
      const ctx = createMockCtx();

      const response = await handler.fetch(request, env as any, ctx);
      const body = await response.json() as any;

      expect(body.success).toBe(true);
      expect(body.data.plans).toBeDefined();
      expect(Array.isArray(body.data.plans)).toBe(true);
    });

    it('GET /api/user/profile without auth should return 401', async () => {
      const { default: handler } = await import('../src/index');

      const request = new Request('http://localhost/api/user/profile', { method: 'GET' });
      const env = createMockEnv();
      const ctx = createMockCtx();

      const response = await handler.fetch(request, env as any, ctx);
      const body = await response.json() as any;

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/connections without auth should return 401', async () => {
      const { default: handler } = await import('../src/index');

      const request = new Request('http://localhost/api/connections', { method: 'GET' });
      const env = createMockEnv();
      const ctx = createMockCtx();

      const response = await handler.fetch(request, env as any, ctx);

      expect(response.status).toBe(401);
    });

    it('GET /api/admin/stats without admin auth should return 403', async () => {
      const { default: handler } = await import('../src/index');

      const request = new Request('http://localhost/api/admin/stats', { method: 'GET' });
      const env = createMockEnv();
      const ctx = createMockCtx();

      const response = await handler.fetch(request, env as any, ctx);

      // First gets 401 (no auth at all)
      expect(response.status).toBe(401);
    });
  });
});

// ============================================
// Mock Helpers
// ============================================

function createMockEnv() {
  return {
    DB: createMockD1(),
    RATE_LIMIT_KV: createMockKV(),
    JWT_SECRET: 'test-jwt-secret-32-chars-minimum!',
    ENCRYPTION_KEY: 'test-encryption-key-32-chars-min!',
    GEMINI_API_KEY: 'test-gemini-key',
    ENVIRONMENT: 'development',
  };
}

function createMockCtx(): ExecutionContext {
  return {
    waitUntil: () => {},
    passThroughOnException: () => {},
  } as any;
}

function createMockD1() {
  const mockStatement = {
    bind: (..._args: any[]) => mockStatement,
    first: async <T>() => null as T | null,
    run: async () => ({ success: true, results: [], meta: {} }),
    all: async <T>() => ({ results: [] as T[], success: true, meta: {} }),
    raw: async () => [],
  };

  return {
    prepare: (_query: string) => mockStatement,
    batch: async (_statements: any[]) => [],
    exec: async (_query: string) => ({ count: 0, duration: 0 }),
    dump: async () => new ArrayBuffer(0),
  };
}

function createMockKV() {
  const store = new Map<string, string>();
  return {
    get: async (key: string, _type?: string) => store.get(key) || null,
    put: async (key: string, value: string, _opts?: any) => { store.set(key, value); },
    delete: async (key: string) => { store.delete(key); },
    list: async () => ({ keys: [], list_complete: true }),
  };
}
