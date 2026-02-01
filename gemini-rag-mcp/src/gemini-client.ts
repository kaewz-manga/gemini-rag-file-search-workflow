/**
 * Gemini RAG File Search API Client
 * Wrapper for Google Generative Language API - File Search (fileSearchStores)
 *
 * Supported Operations:
 * 1.  createStore          - Create a new FileSearchStore
 * 2.  getStore             - Get store details
 * 3.  listStores           - List all stores
 * 4.  deleteStore          - Delete a store
 * 5.  uploadTextToStore    - Upload text content to a store (inline data)
 * 6.  importFileToStore    - Import a file from Files API into a store
 * 7.  uploadFileToFilesApi - Upload a file to Files API (for later import)
 * 8.  listDocuments        - List documents in a store
 * 9.  getDocument          - Get document details
 * 10. deleteDocument       - Delete a document from a store
 * 11. searchStore          - Search with generateContent + file_search tool
 */

import {
  GeminiConfig,
  FileSearchStore,
  ListFileSearchStoresResponse,
  FileSearchDocument,
  ListDocumentsResponse,
  CustomMetadata,
  Operation,
  FileMetadata,
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
  // 1. FileSearchStore Operations
  // ============================================

  /**
   * Create a new FileSearchStore
   */
  async createStore(displayName: string): Promise<FileSearchStore> {
    return this.request<FileSearchStore>('fileSearchStores', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    });
  }

  /**
   * Get FileSearchStore details
   */
  async getStore(storeId: string): Promise<FileSearchStore> {
    const storeName = storeId.startsWith('fileSearchStores/')
      ? storeId
      : `fileSearchStores/${storeId}`;
    return this.request<FileSearchStore>(storeName, { method: 'GET' });
  }

  /**
   * List all FileSearchStores
   */
  async listStores(pageSize: number = 20, pageToken?: string): Promise<ListFileSearchStoresResponse> {
    let endpoint = `fileSearchStores?pageSize=${pageSize}`;
    if (pageToken) {
      endpoint += `&pageToken=${pageToken}`;
    }
    return this.request<ListFileSearchStoresResponse>(endpoint, { method: 'GET' });
  }

  /**
   * Delete a FileSearchStore
   */
  async deleteStore(storeId: string, force: boolean = false): Promise<void> {
    const storeName = storeId.startsWith('fileSearchStores/')
      ? storeId
      : `fileSearchStores/${storeId}`;
    await this.request<void>(`${storeName}?force=${force}`, { method: 'DELETE' });
  }

  // ============================================
  // 2. Upload / Import Operations
  // ============================================

  /**
   * Upload text content directly to a FileSearchStore.
   * Uses the media upload endpoint with inline data.
   */
  async uploadTextToStore(
    storeId: string,
    textContent: string,
    options: {
      displayName?: string;
      mimeType?: string;
      customMetadata?: CustomMetadata[];
    } = {}
  ): Promise<Operation> {
    const storeName = storeId.startsWith('fileSearchStores/')
      ? storeId
      : `fileSearchStores/${storeId}`;

    const mimeType = options.mimeType || 'text/plain';
    const metadata: any = {};
    if (options.displayName) {
      metadata.displayName = options.displayName;
    }
    if (options.customMetadata) {
      metadata.customMetadata = options.customMetadata;
    }

    // Use multipart upload: metadata JSON + file content
    const boundary = '---BOUNDARY---';
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      '',
      textContent,
      `--${boundary}--`,
    ].join('\r\n');

    const separator = '?';
    const url = `${this.baseUrl}/upload/${API_VERSION}/${storeName}:upload${separator}key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
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
    if (!text) return {} as Operation;
    return JSON.parse(text);
  }

  /**
   * Upload a file to the Files API (for later import into a store)
   */
  async uploadFileToFilesApi(
    fileContent: string,
    displayName: string,
    mimeType: string = 'text/plain'
  ): Promise<FileMetadata> {
    const boundary = '---BOUNDARY---';
    const metadata = { file: { displayName } };

    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      '',
      fileContent,
      `--${boundary}--`,
    ].join('\r\n');

    const url = `${this.baseUrl}/upload/${API_VERSION}/files?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
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

    const result = await response.json() as any;
    return result.file;
  }

  /**
   * Import a file from Files API into a FileSearchStore
   */
  async importFileToStore(
    storeId: string,
    fileName: string,
    customMetadata?: CustomMetadata[]
  ): Promise<Operation> {
    const storeName = storeId.startsWith('fileSearchStores/')
      ? storeId
      : `fileSearchStores/${storeId}`;

    const body: any = { fileName };
    if (customMetadata) {
      body.customMetadata = customMetadata;
    }

    return this.request<Operation>(`${storeName}:importFile`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Poll an operation until it completes
   */
  async pollOperation(operationName: string, maxWaitMs: number = 60000): Promise<Operation> {
    const startTime = Date.now();
    const pollInterval = 2000;

    while (Date.now() - startTime < maxWaitMs) {
      const op = await this.request<Operation>(operationName, { method: 'GET' });
      if (op.done) {
        if (op.error) {
          throw new Error(`Operation failed: ${op.error.message}`);
        }
        return op;
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Operation timed out after ${maxWaitMs}ms`);
  }

  // ============================================
  // 3. Document Operations
  // ============================================

  /**
   * List documents in a FileSearchStore
   */
  async listDocuments(
    storeId: string,
    pageSize: number = 20,
    pageToken?: string
  ): Promise<ListDocumentsResponse> {
    const storeName = storeId.startsWith('fileSearchStores/')
      ? storeId
      : `fileSearchStores/${storeId}`;

    let endpoint = `${storeName}/documents?pageSize=${pageSize}`;
    if (pageToken) {
      endpoint += `&pageToken=${pageToken}`;
    }
    return this.request<ListDocumentsResponse>(endpoint, { method: 'GET' });
  }

  /**
   * Get a document from a FileSearchStore
   */
  async getDocument(storeId: string, documentId: string): Promise<FileSearchDocument> {
    const storeName = storeId.startsWith('fileSearchStores/')
      ? storeId
      : `fileSearchStores/${storeId}`;
    const docName = documentId.includes('/')
      ? documentId
      : `${storeName}/documents/${documentId}`;
    return this.request<FileSearchDocument>(docName, { method: 'GET' });
  }

  /**
   * Delete a document from a FileSearchStore
   */
  async deleteDocument(documentName: string, force: boolean = false): Promise<void> {
    await this.request<void>(`${documentName}?force=${force}`, { method: 'DELETE' });
  }

  // ============================================
  // 4. Search (generateContent + file_search)
  // ============================================

  /**
   * Search a FileSearchStore using generateContent with file_search tool.
   * Returns grounded answer with source references.
   */
  async searchStore(
    storeId: string,
    query: string,
    options: {
      model?: string;
      temperature?: number;
      maxOutputTokens?: number;
      topK?: number;
      metadataFilter?: string;
    } = {}
  ): Promise<GenerateContentResponse> {
    const storeName = storeId.startsWith('fileSearchStores/')
      ? storeId
      : `fileSearchStores/${storeId}`;
    const model = options.model || 'gemini-2.0-flash';

    const fileSearch: any = {
      fileSearchStoreNames: [storeName],
    };
    if (options.topK) {
      fileSearch.topK = options.topK;
    }
    if (options.metadataFilter) {
      fileSearch.metadataFilter = options.metadataFilter;
    }

    const body: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: query }],
        },
      ],
      tools: [{ fileSearch }],
    };

    if (options.temperature !== undefined || options.maxOutputTokens !== undefined) {
      body.generationConfig = {};
      if (options.temperature !== undefined) {
        body.generationConfig.temperature = options.temperature;
      }
      if (options.maxOutputTokens !== undefined) {
        body.generationConfig.maxOutputTokens = options.maxOutputTokens;
      }
    }

    return this.request<GenerateContentResponse>(
      `models/${model}:generateContent`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  }

  // ============================================
  // 5. Convenience: Upload text + wait for ready
  // ============================================

  /**
   * Upload text content to a store and wait for processing to complete.
   */
  async uploadTextAndWait(
    storeId: string,
    textContent: string,
    options: {
      displayName?: string;
      mimeType?: string;
      customMetadata?: CustomMetadata[];
      maxWaitMs?: number;
    } = {}
  ): Promise<{ operation: Operation; document?: FileSearchDocument }> {
    const op = await this.uploadTextToStore(storeId, textContent, {
      displayName: options.displayName,
      mimeType: options.mimeType,
      customMetadata: options.customMetadata,
    });

    if (op.name) {
      const completedOp = await this.pollOperation(op.name, options.maxWaitMs || 60000);
      return { operation: completedOp, document: completedOp.response };
    }

    return { operation: op };
  }

  /**
   * Import content from a URL: fetch URL -> upload to Files API -> import to store
   */
  async importFromUrl(
    storeId: string,
    url: string,
    displayName: string,
    options: {
      customMetadata?: CustomMetadata[];
      maxWaitMs?: number;
    } = {}
  ): Promise<{ file: FileMetadata; operation: Operation }> {
    // Fetch content from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL (${response.status}): ${url}`);
    }

    const textContent = await response.text();
    if (!textContent.trim()) {
      throw new Error('URL returned empty content');
    }

    // Upload to Files API
    const file = await this.uploadFileToFilesApi(textContent, displayName);

    // Import into FileSearchStore
    const op = await this.importFileToStore(storeId, file.name, options.customMetadata);

    if (op.name) {
      const completedOp = await this.pollOperation(op.name, options.maxWaitMs || 60000);
      return { file, operation: completedOp };
    }

    return { file, operation: op };
  }
}
