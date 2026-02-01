/**
 * Tests for gemini-client.ts
 * Uses mocked fetch to test all API operations without real API calls
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
      // We verify via the fetch calls below
      expect(c).toBeDefined();
    });

    it('should accept custom base URL', () => {
      const c = new GeminiClient({ apiKey: 'key', baseUrl: 'https://custom.api.com' });
      expect(c).toBeDefined();
    });
  });

  // ========== Store (Corpus) Operations ==========
  describe('Corpus Operations', () => {
    it('createCorpus should POST to /corpora', async () => {
      const mockCorpus = { name: 'corpora/test-123', displayName: 'Test Store' };
      mockFetch.mockResolvedValueOnce(mockResponse(mockCorpus));

      const result = await client.createCorpus('Test Store');

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora');
      expect(url).toContain('key=test-api-key');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ displayName: 'Test Store' });
      expect(result).toEqual(mockCorpus);
    });

    it('getCorpus should GET corpus by ID', async () => {
      const mockCorpus = { name: 'corpora/test-123', displayName: 'Test Store' };
      mockFetch.mockResolvedValueOnce(mockResponse(mockCorpus));

      const result = await client.getCorpus('test-123');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora/test-123');
      expect(options.method).toBe('GET');
      expect(result).toEqual(mockCorpus);
    });

    it('getCorpus should handle full corpus name', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await client.getCorpus('corpora/my-corpus');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora/my-corpus');
      // Should not double-prefix
      expect(url).not.toContain('corpora/corpora/');
    });

    it('listCorpora should GET with pagination params', async () => {
      const mockList = { corpora: [{ name: 'corpora/a' }], nextPageToken: 'abc' };
      mockFetch.mockResolvedValueOnce(mockResponse(mockList));

      const result = await client.listCorpora(50, 'token123');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('pageSize=50');
      expect(url).toContain('pageToken=token123');
      expect(result).toEqual(mockList);
    });

    it('deleteCorpus should DELETE with force param', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await client.deleteCorpus('test-123', true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora/test-123');
      expect(url).toContain('force=true');
      expect(options.method).toBe('DELETE');
    });
  });

  // ========== Document Operations ==========
  describe('Document Operations', () => {
    it('createDocument should POST with metadata', async () => {
      const mockDoc = { name: 'corpora/c1/documents/d1', displayName: 'Doc' };
      mockFetch.mockResolvedValueOnce(mockResponse(mockDoc));

      const result = await client.createDocument('c1', 'Doc', [
        { key: 'category', stringValue: 'manual' },
      ]);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora/c1/documents');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.displayName).toBe('Doc');
      expect(body.customMetadata).toHaveLength(1);
      expect(result).toEqual(mockDoc);
    });

    it('getDocument should GET by corpus and document ID', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await client.getDocument('c1', 'd1');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora/c1/documents/d1');
      expect(options.method).toBe('GET');
    });

    it('listDocuments should GET with pagination', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ documents: [] }));

      await client.listDocuments('c1', 20);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora/c1/documents');
      expect(url).toContain('pageSize=20');
    });

    it('deleteDocument should DELETE with force', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await client.deleteDocument('c1', 'd1', true);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora/c1/documents/d1');
      expect(url).toContain('force=true');
      expect(options.method).toBe('DELETE');
    });
  });

  // ========== Chunk Operations ==========
  describe('Chunk Operations', () => {
    it('createChunk should POST text to document chunks', async () => {
      const mockChunk = { name: 'corpora/c1/documents/d1/chunks/ch1' };
      mockFetch.mockResolvedValueOnce(mockResponse(mockChunk));

      await client.createChunk('c1', 'd1', 'Hello world');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora/c1/documents/d1/chunks');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.data.stringValue).toBe('Hello world');
    });

    it('batchCreateChunks should POST multiple chunks', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ chunks: [{}, {}] }));

      await client.batchCreateChunks('c1', 'd1', [
        { text: 'chunk 1' },
        { text: 'chunk 2' },
      ]);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora/c1/documents/d1/chunks:batchCreate');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.requests).toHaveLength(2);
    });

    it('listChunks should GET with pagination', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ chunks: [] }));

      await client.listChunks('c1', 'd1', 50);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora/c1/documents/d1/chunks');
      expect(url).toContain('pageSize=50');
    });

    it('getChunk should GET by full path', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await client.getChunk('c1', 'd1', 'ch1');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora/c1/documents/d1/chunks/ch1');
    });

    it('deleteChunk should DELETE', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}));

      await client.deleteChunk('c1', 'd1', 'ch1');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora/c1/documents/d1/chunks/ch1');
      expect(options.method).toBe('DELETE');
    });
  });

  // ========== Query (Search) ==========
  describe('Query Operations', () => {
    it('queryCorpus should POST search query', async () => {
      const mockResult = { relevantChunks: [{ chunkRelevanceScore: 0.9 }] };
      mockFetch.mockResolvedValueOnce(mockResponse(mockResult));

      const result = await client.queryCorpus('c1', 'how to install?', 5);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/corpora/c1:query');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body.query).toBe('how to install?');
      expect(body.resultsCount).toBe(5);
      expect(result).toEqual(mockResult);
    });

    it('queryCorpus should include metadata filters', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ relevantChunks: [] }));

      await client.queryCorpus('c1', 'test query', 10, [
        { key: 'category', conditions: [{ stringValue: 'manual', operation: 'EQUAL' }] },
      ]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.metadataFilters).toHaveLength(1);
      expect(body.metadataFilters[0].key).toBe('category');
    });
  });

  // ========== AI Agent (Generate Answer) ==========
  describe('AI Agent Operations', () => {
    it('generateAnswer should POST with semantic retriever config', async () => {
      const mockResponse_ = {
        candidates: [{
          content: { role: 'model', parts: [{ text: 'The answer is...' }] },
        }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 50, totalTokenCount: 60 },
      };
      mockFetch.mockResolvedValueOnce(mockResponse(mockResponse_));

      const result = await client.generateAnswer('c1', 'What is RAG?', {
        model: 'gemini-2.0-flash',
        temperature: 0.5,
        maxOutputTokens: 1024,
      });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/models/gemini-2.0-flash:generateContent');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.contents[0].parts[0].text).toBe('What is RAG?');
      expect(body.semanticRetriever.source).toBe('corpora/c1');
      expect(body.generationConfig.temperature).toBe(0.5);
      expect(body.generationConfig.maxOutputTokens).toBe(1024);
      expect(result.candidates).toHaveLength(1);
    });

    it('generateAnswer should use default model when not specified', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ candidates: [] }));

      await client.generateAnswer('c1', 'test');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1beta/models/gemini-2.0-flash:generateContent');
    });

    it('generateAnswer should include metadata filters and chunk config', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ candidates: [] }));

      await client.generateAnswer('c1', 'test', {
        maxChunksCount: 5,
        minimumRelevanceScore: 0.8,
        metadataFilters: [
          { key: 'project', conditions: [{ stringValue: 'app', operation: 'EQUAL' }] },
        ],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.semanticRetriever.maxChunksCount).toBe(5);
      expect(body.semanticRetriever.minimumRelevanceScore).toBe(0.8);
      expect(body.semanticRetriever.metadataFilters).toHaveLength(1);
    });
  });

  // ========== Upload Text ==========
  describe('Upload Text to Corpus', () => {
    it('should create document and batch create chunks', async () => {
      // First call: createDocument
      mockFetch.mockResolvedValueOnce(mockResponse({
        name: 'corpora/c1/documents/new-doc',
        displayName: 'Test Doc',
      }));
      // Second call: batchCreateChunks
      mockFetch.mockResolvedValueOnce(mockResponse({ chunks: [{}] }));

      const result = await client.uploadTextToCorpus('c1', 'Test Doc', 'Some short text.', {
        chunkSize: 2000,
      });

      expect(result.document.name).toBe('corpora/c1/documents/new-doc');
      expect(result.chunksCreated).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle empty text', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        name: 'corpora/c1/documents/empty-doc',
        displayName: 'Empty Doc',
      }));

      const result = await client.uploadTextToCorpus('c1', 'Empty Doc', '');

      expect(result.chunksCreated).toBe(0);
      // Only createDocument should be called
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should split long text into multiple chunks', async () => {
      // createDocument
      mockFetch.mockResolvedValueOnce(mockResponse({
        name: 'corpora/c1/documents/long-doc',
        displayName: 'Long Doc',
      }));
      // batchCreateChunks
      mockFetch.mockResolvedValueOnce(mockResponse({ chunks: [{}, {}, {}] }));

      // Create text with ~150 chars per sentence, chunk size of 100
      const longText = Array(10).fill('This is a long sentence for testing text splitting. ').join('');

      const result = await client.uploadTextToCorpus('c1', 'Long Doc', longText, {
        chunkSize: 100,
        chunkOverlap: 20,
      });

      expect(result.chunksCreated).toBeGreaterThan(1);
    });
  });

  // ========== Import from URL ==========
  describe('Import from URL', () => {
    it('should fetch URL and upload content', async () => {
      // First: fetch URL
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'Content from URL. This is fetched text.',
      });
      // Second: createDocument
      mockFetch.mockResolvedValueOnce(mockResponse({
        name: 'corpora/c1/documents/url-doc',
        displayName: 'URL Doc',
      }));
      // Third: batchCreateChunks
      mockFetch.mockResolvedValueOnce(mockResponse({ chunks: [{}] }));

      const result = await client.importFromUrl('c1', 'https://example.com/doc.txt', 'URL Doc');

      expect(result.document.name).toBe('corpora/c1/documents/url-doc');
      expect(result.chunksCreated).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should throw on failed URL fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        client.importFromUrl('c1', 'https://example.com/404', 'Not Found')
      ).rejects.toThrow('Failed to fetch URL (404)');
    });

    it('should throw on empty URL content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '   ',
      });

      await expect(
        client.importFromUrl('c1', 'https://example.com/empty', 'Empty')
      ).rejects.toThrow('URL returned empty content');
    });
  });

  // ========== Error Handling ==========
  describe('Error Handling', () => {
    it('should throw on API error with error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: { message: 'Invalid corpus name' } }),
      });

      await expect(client.getCorpus('invalid')).rejects.toThrow('Gemini API Error (400): Invalid corpus name');
    });

    it('should throw on API error with raw text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(client.listCorpora()).rejects.toThrow('Gemini API Error (500): Internal Server Error');
    });

    it('should handle 403 Forbidden', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ error: { message: 'API key not valid' } }),
      });

      await expect(client.listCorpora()).rejects.toThrow('API key not valid');
    });
  });
});
