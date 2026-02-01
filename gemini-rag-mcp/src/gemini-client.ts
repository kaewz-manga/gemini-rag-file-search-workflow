/**
 * Gemini RAG File Search API Client
 * Wrapper for Google Generative Language API - Semantic Retrieval (Corpora)
 *
 * Supported Operations:
 * 1.  createCorpus       - Create a new store (corpus)
 * 2.  getCorpus          - Get store details
 * 3.  listCorpora        - List all stores
 * 4.  deleteCorpus       - Delete a store
 * 5.  createDocument     - Create a document in a store
 * 6.  getDocument        - Get document details
 * 7.  listDocuments      - List documents in a store
 * 8.  deleteDocument     - Delete a document
 * 9.  createChunk        - Upload text content as chunks
 * 10. batchCreateChunks  - Batch upload multiple chunks
 * 11. listChunks         - List chunks in a document
 * 12. deleteChunk        - Delete a chunk
 * 13. queryCorpus        - Search a store (semantic search)
 * 14. generateAnswer     - AI Agent (search + generate answer with grounding)
 */

import {
  GeminiConfig,
  Corpus,
  CreateCorpusRequest,
  ListCorporaResponse,
  Document,
  CreateDocumentRequest,
  ListDocumentsResponse,
  CustomMetadata,
  Chunk,
  ChunkData,
  CreateChunkRequest,
  BatchCreateChunksRequest,
  BatchCreateChunksResponse,
  ListChunksResponse,
  QueryCorpusRequest,
  QueryCorpusResponse,
  MetadataFilter,
  GenerateContentResponse,
} from './types';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com';
const API_VERSION = 'v1beta';

export class GeminiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  }

  // ============================================
  // Internal HTTP Helper
  // ============================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}/${API_VERSION}/${endpoint}${separator}key=${this.apiKey}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorText;
      } catch {
        errorMessage = errorText;
      }
      throw new Error(`Gemini API Error (${response.status}): ${errorMessage}`);
    }

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text);
  }

  // ============================================
  // 1. Corpus (Store) Operations
  // ============================================

  /**
   * Create a new corpus (store)
   */
  async createCorpus(displayName: string): Promise<Corpus> {
    return this.request<Corpus>('corpora', {
      method: 'POST',
      body: JSON.stringify({
        displayName,
      }),
    });
  }

  /**
   * Get corpus details
   */
  async getCorpus(corpusId: string): Promise<Corpus> {
    const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;
    return this.request<Corpus>(corpusName, { method: 'GET' });
  }

  /**
   * List all corpora
   */
  async listCorpora(pageSize: number = 100, pageToken?: string): Promise<ListCorporaResponse> {
    let endpoint = `corpora?pageSize=${pageSize}`;
    if (pageToken) {
      endpoint += `&pageToken=${pageToken}`;
    }
    return this.request<ListCorporaResponse>(endpoint, { method: 'GET' });
  }

  /**
   * Delete a corpus
   */
  async deleteCorpus(corpusId: string, force: boolean = false): Promise<void> {
    const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;
    await this.request<void>(`${corpusName}?force=${force}`, { method: 'DELETE' });
  }

  // ============================================
  // 2. Document Operations
  // ============================================

  /**
   * Create a document within a corpus
   */
  async createDocument(
    corpusId: string,
    displayName: string,
    customMetadata?: CustomMetadata[]
  ): Promise<Document> {
    const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;
    const body: CreateDocumentRequest = { displayName };
    if (customMetadata) {
      body.customMetadata = customMetadata;
    }
    return this.request<Document>(`${corpusName}/documents`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Get document details
   */
  async getDocument(corpusId: string, documentId: string): Promise<Document> {
    const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;
    const docName = documentId.includes('/') ? documentId : `${corpusName}/documents/${documentId}`;
    return this.request<Document>(docName, { method: 'GET' });
  }

  /**
   * List documents in a corpus
   */
  async listDocuments(
    corpusId: string,
    pageSize: number = 100,
    pageToken?: string
  ): Promise<ListDocumentsResponse> {
    const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;
    let endpoint = `${corpusName}/documents?pageSize=${pageSize}`;
    if (pageToken) {
      endpoint += `&pageToken=${pageToken}`;
    }
    return this.request<ListDocumentsResponse>(endpoint, { method: 'GET' });
  }

  /**
   * Delete a document from a corpus
   */
  async deleteDocument(corpusId: string, documentId: string, force: boolean = false): Promise<void> {
    const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;
    const docName = documentId.includes('/') ? documentId : `${corpusName}/documents/${documentId}`;
    await this.request<void>(`${docName}?force=${force}`, { method: 'DELETE' });
  }

  // ============================================
  // 3. Chunk Operations
  // ============================================

  /**
   * Create a single chunk in a document
   */
  async createChunk(
    corpusId: string,
    documentId: string,
    text: string,
    customMetadata?: CustomMetadata[]
  ): Promise<Chunk> {
    const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;
    const docName = documentId.includes('/')
      ? documentId
      : `${corpusName}/documents/${documentId}`;

    const body: { chunk: CreateChunkRequest } = {
      chunk: {
        data: { stringValue: text },
      },
    };
    if (customMetadata) {
      body.chunk.customMetadata = customMetadata;
    }

    return this.request<Chunk>(`${docName}/chunks`, {
      method: 'POST',
      body: JSON.stringify(body.chunk),
    });
  }

  /**
   * Batch create multiple chunks in a document
   */
  async batchCreateChunks(
    corpusId: string,
    documentId: string,
    chunks: Array<{ text: string; customMetadata?: CustomMetadata[] }>
  ): Promise<BatchCreateChunksResponse> {
    const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;
    const docName = documentId.includes('/')
      ? documentId
      : `${corpusName}/documents/${documentId}`;

    const body: BatchCreateChunksRequest = {
      requests: chunks.map(c => ({
        chunk: {
          data: { stringValue: c.text },
          ...(c.customMetadata ? { customMetadata: c.customMetadata } : {}),
        },
      })),
    };

    return this.request<BatchCreateChunksResponse>(`${docName}/chunks:batchCreate`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * List chunks in a document
   */
  async listChunks(
    corpusId: string,
    documentId: string,
    pageSize: number = 100,
    pageToken?: string
  ): Promise<ListChunksResponse> {
    const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;
    const docName = documentId.includes('/')
      ? documentId
      : `${corpusName}/documents/${documentId}`;

    let endpoint = `${docName}/chunks?pageSize=${pageSize}`;
    if (pageToken) {
      endpoint += `&pageToken=${pageToken}`;
    }
    return this.request<ListChunksResponse>(endpoint, { method: 'GET' });
  }

  /**
   * Get a single chunk
   */
  async getChunk(
    corpusId: string,
    documentId: string,
    chunkId: string
  ): Promise<Chunk> {
    const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;
    const docName = documentId.includes('/')
      ? documentId
      : `${corpusName}/documents/${documentId}`;
    const chunkName = chunkId.includes('/')
      ? chunkId
      : `${docName}/chunks/${chunkId}`;

    return this.request<Chunk>(chunkName, { method: 'GET' });
  }

  /**
   * Delete a chunk
   */
  async deleteChunk(
    corpusId: string,
    documentId: string,
    chunkId: string
  ): Promise<void> {
    const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;
    const docName = documentId.includes('/')
      ? documentId
      : `${corpusName}/documents/${documentId}`;
    const chunkName = chunkId.includes('/')
      ? chunkId
      : `${docName}/chunks/${chunkId}`;

    await this.request<void>(chunkName, { method: 'DELETE' });
  }

  // ============================================
  // 4. Query (Semantic Search)
  // ============================================

  /**
   * Query a corpus for relevant chunks (semantic search)
   */
  async queryCorpus(
    corpusId: string,
    query: string,
    resultsCount: number = 10,
    metadataFilters?: MetadataFilter[]
  ): Promise<QueryCorpusResponse> {
    const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;

    const body: QueryCorpusRequest = {
      query,
      resultsCount,
    };
    if (metadataFilters) {
      body.metadataFilters = metadataFilters;
    }

    return this.request<QueryCorpusResponse>(`${corpusName}:query`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ============================================
  // 5. AI Agent (Generate Answer with RAG)
  // ============================================

  /**
   * Generate content using RAG with semantic retrieval
   * Uses Gemini model + corpus as grounding source
   */
  async generateAnswer(
    corpusId: string,
    query: string,
    options: {
      model?: string;
      temperature?: number;
      maxOutputTokens?: number;
      maxChunksCount?: number;
      minimumRelevanceScore?: number;
      metadataFilters?: MetadataFilter[];
    } = {}
  ): Promise<GenerateContentResponse> {
    const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;
    const model = options.model || 'gemini-2.0-flash';

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: query }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 2048,
      },
      semanticRetriever: {
        source: corpusName,
        query: {
          parts: [{ text: query }],
        },
        ...(options.maxChunksCount ? { maxChunksCount: options.maxChunksCount } : {}),
        ...(options.minimumRelevanceScore ? { minimumRelevanceScore: options.minimumRelevanceScore } : {}),
        ...(options.metadataFilters ? { metadataFilters: options.metadataFilters } : {}),
      },
    };

    return this.request<GenerateContentResponse>(
      `models/${model}:generateContent`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  }

  // ============================================
  // 6. Upload Text Content (convenience method)
  // ============================================

  /**
   * Upload text content to a corpus.
   * Creates a document, then splits text into chunks and uploads them.
   */
  async uploadTextToCorpus(
    corpusId: string,
    documentName: string,
    textContent: string,
    options: {
      chunkSize?: number;
      chunkOverlap?: number;
      customMetadata?: CustomMetadata[];
    } = {}
  ): Promise<{ document: Document; chunksCreated: number }> {
    const chunkSize = options.chunkSize || 2000;
    const chunkOverlap = options.chunkOverlap || 200;

    // Create document
    const document = await this.createDocument(corpusId, documentName, options.customMetadata);

    // Split text into chunks
    const textChunks = this.splitText(textContent, chunkSize, chunkOverlap);

    if (textChunks.length === 0) {
      return { document, chunksCreated: 0 };
    }

    // Batch create chunks (max 100 per batch)
    const batchSize = 100;
    let totalCreated = 0;

    for (let i = 0; i < textChunks.length; i += batchSize) {
      const batch = textChunks.slice(i, i + batchSize);
      const corpusName = corpusId.startsWith('corpora/') ? corpusId : `corpora/${corpusId}`;
      await this.batchCreateChunks(
        corpusName,
        document.name,
        batch.map(text => ({ text }))
      );
      totalCreated += batch.length;
    }

    return { document, chunksCreated: totalCreated };
  }

  /**
   * Import content from a URL into a corpus.
   * Fetches the URL content, creates a document, and uploads as chunks.
   */
  async importFromUrl(
    corpusId: string,
    url: string,
    documentName: string,
    options: {
      chunkSize?: number;
      chunkOverlap?: number;
      customMetadata?: CustomMetadata[];
    } = {}
  ): Promise<{ document: Document; chunksCreated: number }> {
    // Fetch content from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL (${response.status}): ${url}`);
    }

    const textContent = await response.text();
    if (!textContent.trim()) {
      throw new Error('URL returned empty content');
    }

    return this.uploadTextToCorpus(corpusId, documentName, textContent, options);
  }

  // ============================================
  // Internal: Text Splitting
  // ============================================

  private splitText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?\n])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        // Keep overlap from the end of the current chunk
        if (overlap > 0) {
          const overlapText = currentChunk.slice(-overlap);
          currentChunk = overlapText + ' ' + sentence;
        } else {
          currentChunk = sentence;
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}
