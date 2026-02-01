/**
 * Gemini RAG File Search MCP Server - Type Definitions
 * Types for Gemini Semantic Retrieval API (Corpora / RAG)
 */

// ============================================
// Gemini API Configuration
// ============================================

export interface GeminiConfig {
  apiKey: string;
  baseUrl?: string; // Default: https://generativelanguage.googleapis.com
}

// ============================================
// Corpus (Store) Types
// ============================================

export interface Corpus {
  name: string; // Format: corpora/{corpus_id}
  displayName: string;
  createTime: string;
  updateTime: string;
}

export interface CreateCorpusRequest {
  displayName: string;
}

export interface ListCorporaResponse {
  corpora: Corpus[];
  nextPageToken?: string;
}

// ============================================
// Document Types
// ============================================

export interface Document {
  name: string; // Format: corpora/{corpus_id}/documents/{document_id}
  displayName: string;
  createTime: string;
  updateTime: string;
  customMetadata?: CustomMetadata[];
}

export interface CreateDocumentRequest {
  displayName: string;
  customMetadata?: CustomMetadata[];
}

export interface ListDocumentsResponse {
  documents: Document[];
  nextPageToken?: string;
}

export interface CustomMetadata {
  key: string;
  stringValue?: string;
  stringListValue?: { values: string[] };
  numericValue?: number;
}

// ============================================
// Chunk Types
// ============================================

export interface Chunk {
  name: string; // Format: corpora/{corpus_id}/documents/{document_id}/chunks/{chunk_id}
  data: ChunkData;
  customMetadata?: CustomMetadata[];
  createTime: string;
  updateTime: string;
  state: 'STATE_UNSPECIFIED' | 'STATE_PENDING_PROCESSING' | 'STATE_ACTIVE' | 'STATE_FAILED';
}

export interface ChunkData {
  stringValue: string;
}

export interface CreateChunkRequest {
  data: ChunkData;
  customMetadata?: CustomMetadata[];
}

export interface BatchCreateChunksRequest {
  requests: { chunk: CreateChunkRequest }[];
}

export interface BatchCreateChunksResponse {
  chunks: Chunk[];
}

export interface ListChunksResponse {
  chunks: Chunk[];
  nextPageToken?: string;
}

// ============================================
// Query (Search) Types
// ============================================

export interface QueryCorpusRequest {
  query: string;
  metadataFilters?: MetadataFilter[];
  resultsCount?: number; // Default: 10, Max: 100
}

export interface MetadataFilter {
  key: string;
  conditions: MetadataCondition[];
}

export interface MetadataCondition {
  stringValue?: string;
  numericValue?: number;
  operation: 'EQUAL' | 'NOT_EQUAL' | 'LESS' | 'LESS_EQUAL' | 'GREATER' | 'GREATER_EQUAL' | 'INCLUDES' | 'EXCLUDES';
}

export interface QueryCorpusResponse {
  relevantChunks: RelevantChunk[];
}

export interface RelevantChunk {
  chunkRelevanceScore: number;
  chunk: Chunk;
}

// ============================================
// Generate Content with RAG (AI Agent)
// ============================================

export interface GenerateContentRequest {
  contents: Content[];
  generationConfig?: GenerationConfig;
  semanticRetriever?: SemanticRetrieverConfig;
}

export interface Content {
  role: 'user' | 'model';
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

export interface SemanticRetrieverConfig {
  source: string; // corpora/{corpus_id}
  query: Content;
  metadataFilters?: MetadataFilter[];
  maxChunksCount?: number;
  minimumRelevanceScore?: number;
}

export interface GenerateContentResponse {
  candidates: Candidate[];
  usageMetadata?: UsageMetadata;
}

export interface Candidate {
  content: Content;
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
// File Upload Types (via Google AI File API)
// ============================================

export interface UploadFileResponse {
  file: FileMetadata;
}

export interface FileMetadata {
  name: string; // Format: files/{file_id}
  displayName: string;
  mimeType: string;
  sizeBytes: string;
  createTime: string;
  updateTime: string;
  expirationTime: string;
  sha256Hash: string;
  uri: string;
  state: 'STATE_UNSPECIFIED' | 'PROCESSING' | 'ACTIVE' | 'FAILED';
}

export interface ListFilesResponse {
  files: FileMetadata[];
  nextPageToken?: string;
}

// ============================================
// File Search Store Types
// ============================================

export interface FileSearchStore {
  name: string; // Format: fileSearchStores/{store_id}
  displayName: string;
  createTime: string;
  updateTime: string;
  state?: string;
}

export interface CreateFileSearchStoreRequest {
  displayName: string;
}

export interface ListFileSearchStoresResponse {
  fileSearchStores: FileSearchStore[];
  nextPageToken?: string;
}

export interface ImportFileToStoreRequest {
  name: string; // Format: files/{file_id}
}

export interface ImportFileToStoreResponse {
  name: string; // Long-running operation name
  metadata?: any;
  done?: boolean;
  response?: any;
  error?: any;
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
