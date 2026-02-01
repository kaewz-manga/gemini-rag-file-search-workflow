/**
 * Tests for gemini-client.ts
 * Uses mocked fetch to test all File Search API operations without real API calls
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiClient } from '../src/gemini-client';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse(body: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  };
}

describe('GeminiClient', () => {
  let client: GeminiClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new GeminiClient({ apiKey: 'test-api-key' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========== Constructor ==========
  describe('Constructor', () => {
    it('should use default base URL', () => {
      const c = new GeminiClient({ apiKey: 'key' });
      expect(c).toBeDefined();
    });

    it('should accept custom base URL', () => {
      const c = new GeminiClient({ apiKey: 'key', baseUrl: 'https://custom.api.com' });
      expect(c).toBeDefined();
    });
  });

  // ========== Store Operations ==========
  describe('Store Operations', () => {
    it('createStore should POST to /fileSearchStores', async () => {
      const mockStore = { name: 'fileSearchStores/test-123', displayName: 'Test Store' };
      mockFetch.mockResolvedValueOnce(mockResponse(mockStore));

      const result = await client.createStore('Test Store');

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/fileSearchStores');
      expect(url).toContain('key=test-api-key');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ displayName: 'Test Store' });
      expect(result).toEqual(mockStore);
    });

    it('getStore should GET store by ID', async () => {
      const mockStore = { name: 'fileSearchStores/test-123', displayName: 'Test Store' };
      mockFetch.mockResolvedValueOnce(mockResponse(mockStore));

      const result = await client.getStore('test-123');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/fileSearchStores/test-123');
      expect(options.method).toBe('GET');
      expect(result).toEqual(mockStore);
    });

    it('getStore should handle full store name', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await client.getStore('fileSearchStores/my-store');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/fileSearchStores/my-store');
      expect(url).not.toContain('fileSearchStores/fileSearchStores/');
    });

    it('listStores should GET with pagination params', async () => {
      const mockList = { fileSearchStores: [{ name: 'fileSearchStores/a' }], nextPageToken: 'abc' };
      mockFetch.mockResolvedValueOnce(mockResponse(mockList));

      const result = await client.listStores(10, 'token123');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('pageSize=10');
      expect(url).toContain('pageToken=token123');
      expect(result).toEqual(mockList);
    });

    it('deleteStore should DELETE with force param', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await client.deleteStore('test-123', true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/fileSearchStores/test-123');
      expect(url).toContain('force=true');
      expect(options.method).toBe('DELETE');
    });
  });

  // ========== Upload Operations ==========
  describe('Upload Operations', () => {
    it('uploadTextToStore should upload to Files API then import to store', async () => {
      // Step 1: Files API upload
      mockFetch.mockResolvedValueOnce(mockResponse({
        file: { name: 'files/abc', displayName: 'Test Doc' },
      }));
      // Step 2: Import to store
      mockFetch.mockResolvedValueOnce(mockResponse({ name: 'ops/1', done: false }));
      // Step 3: Poll - done
      mockFetch.mockResolvedValueOnce(mockResponse({ name: 'ops/1', done: true }));

      const result = await client.uploadTextToStore('test-store', 'Hello world', {
        displayName: 'Test Doc',
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      // First call: Files API upload
      const [url1] = mockFetch.mock.calls[0];
      expect(url1).toContain('/upload/v1beta/files');
      // Second call: importFile
      const [url2] = mockFetch.mock.calls[1];
      expect(url2).toContain('/v1beta/fileSearchStores/test-store:importFile');
      expect(result.file.name).toBe('files/abc');
      expect(result.operation.done).toBe(true);
    });

    it('uploadFileToFilesApi should POST multipart to files endpoint', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        file: { name: 'files/abc', displayName: 'test.txt' },
      }));

      const result = await client.uploadFileToFilesApi('content here', 'test.txt');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/upload/v1beta/files');
      expect(options.method).toBe('POST');
      expect(options.body).toContain('content here');
      expect(result.name).toBe('files/abc');
    });

    it('importFileToStore should POST to importFile endpoint', async () => {
      const mockOp = { name: 'operations/op-456' };
      mockFetch.mockResolvedValueOnce(mockResponse(mockOp));

      const result = await client.importFileToStore('store-1', 'files/abc', [
        { key: 'category', stringValue: 'manual' },
      ]);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/fileSearchStores/store-1:importFile');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.fileName).toBe('files/abc');
      expect(body.customMetadata).toHaveLength(1);
      expect(result).toEqual(mockOp);
    });
  });

  // ========== Poll Operation ==========
  describe('Poll Operation', () => {
    it('should poll until done', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ name: 'ops/1', done: false }));
      mockFetch.mockResolvedValueOnce(mockResponse({ name: 'ops/1', done: true, response: { name: 'doc/1' } }));

      const result = await client.pollOperation('ops/1', 10000);

      expect(result.done).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw on operation error', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        name: 'ops/1',
        done: true,
        error: { code: 3, message: 'Invalid file' },
      }));

      await expect(client.pollOperation('ops/1')).rejects.toThrow('Operation failed: Invalid file');
    });
  });

  // ========== Document Operations ==========
  describe('Document Operations', () => {
    it('listDocuments should GET with pagination', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ documents: [] }));

      await client.listDocuments('s1', 10);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/fileSearchStores/s1/documents');
      expect(url).toContain('pageSize=10');
    });

    it('getDocument should GET by store and document ID', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ name: 'fileSearchStores/s1/documents/d1' }));

      await client.getDocument('s1', 'd1');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/fileSearchStores/s1/documents/d1');
      expect(options.method).toBe('GET');
    });

    it('getDocument should handle full document name', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await client.getDocument('s1', 'fileSearchStores/s1/documents/d1');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/fileSearchStores/s1/documents/d1');
      expect(url).not.toContain('documents/fileSearchStores');
    });

    it('deleteDocument should DELETE with force', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await client.deleteDocument('fileSearchStores/s1/documents/d1', true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/fileSearchStores/s1/documents/d1');
      expect(url).toContain('force=true');
      expect(options.method).toBe('DELETE');
    });
  });

  // ========== Search Operations ==========
  describe('Search Operations', () => {
    it('searchStore should POST generateContent with file_search tool', async () => {
      const mockResult = {
        candidates: [{
          content: { role: 'model', parts: [{ text: 'The answer is...' }] },
        }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 50, totalTokenCount: 60 },
      };
      mockFetch.mockResolvedValueOnce(mockResponse(mockResult));

      const result = await client.searchStore('s1', 'What is RAG?', {
        model: 'gemini-2.0-flash',
        temperature: 0.5,
        maxOutputTokens: 1024,
      });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/models/gemini-2.0-flash:generateContent');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.contents[0].parts[0].text).toBe('What is RAG?');
      expect(body.tools[0].file_search.file_search_store_names).toContain('fileSearchStores/s1');
      expect(body.generationConfig.temperature).toBe(0.5);
      expect(body.generationConfig.maxOutputTokens).toBe(1024);
      expect(result.candidates).toHaveLength(1);
    });

    it('searchStore should use default model when not specified', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ candidates: [] }));

      await client.searchStore('s1', 'test');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/models/gemini-2.0-flash:generateContent');
    });

    it('searchStore should include topK and metadataFilter', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ candidates: [] }));

      await client.searchStore('s1', 'test', {
        topK: 5,
        metadataFilter: 'genre = "fiction"',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.tools[0].file_search.top_k).toBe(5);
      expect(body.tools[0].file_search.metadata_filter).toBe('genre = "fiction"');
    });

    it('searchStore should not include generationConfig when no options', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ candidates: [] }));

      await client.searchStore('s1', 'test');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.generationConfig).toBeUndefined();
    });
  });

  // ========== Convenience Methods ==========
  describe('Convenience Methods', () => {
    it('uploadTextAndWait should upload to Files API then import', async () => {
      // Files API upload
      mockFetch.mockResolvedValueOnce(mockResponse({
        file: { name: 'files/abc', displayName: 'My Doc' },
      }));
      // Import
      mockFetch.mockResolvedValueOnce(mockResponse({ name: 'ops/1', done: false }));
      // Poll - done
      mockFetch.mockResolvedValueOnce(mockResponse({ name: 'ops/1', done: true }));

      const result = await client.uploadTextAndWait('s1', 'text content', {
        displayName: 'My Doc',
      });

      expect(result.operation.done).toBe(true);
      expect(result.file.name).toBe('files/abc');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('importFromUrl should fetch URL then upload then import', async () => {
      // Fetch URL
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'Content from URL.',
      });
      // Upload to Files API
      mockFetch.mockResolvedValueOnce(mockResponse({
        file: { name: 'files/abc', displayName: 'url-doc' },
      }));
      // Import to store
      mockFetch.mockResolvedValueOnce(mockResponse({ name: 'ops/1', done: false }));
      // Poll - done
      mockFetch.mockResolvedValueOnce(mockResponse({ name: 'ops/1', done: true }));

      const result = await client.importFromUrl('s1', 'https://example.com/doc.txt', 'URL Doc');

      expect(result.file.name).toBe('files/abc');
      expect(result.operation.done).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('importFromUrl should throw on failed URL fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        client.importFromUrl('s1', 'https://example.com/404', 'Not Found')
      ).rejects.toThrow('Failed to fetch URL (404)');
    });

    it('importFromUrl should throw on empty URL content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '   ',
      });

      await expect(
        client.importFromUrl('s1', 'https://example.com/empty', 'Empty')
      ).rejects.toThrow('URL returned empty content');
    });
  });

  // ========== Error Handling ==========
  describe('Error Handling', () => {
    it('should throw on API error with error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: { message: 'Invalid store name' } }),
      });

      await expect(client.getStore('invalid')).rejects.toThrow('Gemini API Error (400): Invalid store name');
    });

    it('should throw on API error with raw text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(client.listStores()).rejects.toThrow('Gemini API Error (500): Internal Server Error');
    });

    it('should handle 403 Forbidden', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ error: { message: 'API key not valid' } }),
      });

      await expect(client.listStores()).rejects.toThrow('API key not valid');
    });
  });
});
