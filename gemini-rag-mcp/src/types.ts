/**
 * Gemini RAG File Search MCP Server - Type Definitions
 * Types for Gemini File Search API (fileSearchStores)
 */

// ============================================
// Gemini API Configuration
// ============================================

export interface GeminiConfig {
  apiKey: string;
  baseUrl?: string; // Default: https://generativelanguage.googleapis.com
}

// ============================================
// FileSearchStore Types
// ============================================

export interface FileSearchStore {
  name: string; // Format: fileSearchStores/{id}
  displayName?: string;
  createTime?: string;
  updateTime?: string;
}

export interface CreateFileSearchStoreRequest {
  displayName?: string;
}

export interface ListFileSearchStoresResponse {
  fileSearchStores?: FileSearchStore[];
  nextPageToken?: string;
}

// ============================================
// Document Types (FileSearchStore Documents)
// ============================================

export interface FileSearchDocument {
  name: string; // Format: fileSearchStores/{store_id}/documents/{doc_id}
  displayName?: string;
  createTime?: string;
  updateTime?: string;
  customMetadata?: CustomMetadata[];
}

export interface ListDocumentsResponse {
  documents?: FileSearchDocument[];
  nextPageToken?: string;
}

export interface CustomMetadata {
  key: string;
  stringValue?: string;
  stringListValue?: { values: string[] };
  numericValue?: number;
}

// ============================================
// Upload / Import Types
// ============================================

export interface UploadConfig {
  displayName?: string;
  customMetadata?: CustomMetadata[];
}

export interface ImportFileRequest {
  fileName: string; // Format: files/{file_id}
  customMetadata?: CustomMetadata[];
}

export interface Operation {
  name: string;
  done?: boolean;
  error?: { code: number; message: string };
  metadata?: any;
  response?: any;
}

// ============================================
// Files API Types
// ============================================

export interface FileMetadata {
  name: string; // Format: files/{file_id}
  displayName?: string;
  mimeType?: string;
  sizeBytes?: string;
  createTime?: string;
  updateTime?: string;
  expirationTime?: string;
  sha256Hash?: string;
  uri?: string;
  state?: 'STATE_UNSPECIFIED' | 'PROCESSING' | 'ACTIVE' | 'FAILED';
}

export interface UploadFileResponse {
  file: FileMetadata;
}

export interface ListFilesResponse {
  files?: FileMetadata[];
  nextPageToken?: string;
}

// ============================================
// Generate Content with File Search
// ============================================

export interface FileSearchToolConfig {
  fileSearchStoreNames: string[];
  topK?: number;
  metadataFilter?: string; // AIP-160 filter syntax e.g. 'genre = "fiction"'
}

export interface GenerateContentRequest {
  contents: Content[];
  tools?: Tool[];
  generationConfig?: GenerationConfig;
}

export interface Tool {
  fileSearch?: FileSearchToolConfig;
}

export interface Content {
  role?: 'user' | 'model';
  parts: Part[];
}

export interface Part {
  text?: string;
}

export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

export interface GenerateContentResponse {
  candidates?: Candidate[];
  usageMetadata?: UsageMetadata;
}

export interface Candidate {
  content?: Content;
  finishReason?: string;
  groundingMetadata?: GroundingMetadata;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingSupport[];
  retrievalMetadata?: RetrievalMetadata;
}

export interface GroundingChunk {
  retrievedContext?: {
    uri: string;
    title: string;
  };
}

export interface GroundingSupport {
  segment: {
    startIndex: number;
    endIndex: number;
    text: string;
  };
  groundingChunkIndices: number[];
  confidenceScores: number[];
}

export interface RetrievalMetadata {
  googleSearchDynamicRetrievalScore?: number;
}

export interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

// ============================================
// MCP Response Type
// ============================================

export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}
