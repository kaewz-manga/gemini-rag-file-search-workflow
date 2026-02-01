/**
 * Tests for tools.ts
 * - Tool definitions structure validation
 * - All 26 tools present
 * - inputSchema validation
 */

import { describe, it, expect } from 'vitest';
import { TOOLS } from '../src/tools';

describe('MCP Tool Definitions', () => {
  it('should have exactly 26 tools', () => {
    expect(TOOLS).toHaveLength(26);
  });

  it('should have unique tool names', () => {
    const names = TOOLS.map(t => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(TOOLS.length);
  });

  it('every tool should have name, description, and inputSchema', () => {
    for (const tool of TOOLS) {
      expect(tool.name).toBeTruthy();
      expect(typeof tool.name).toBe('string');

      expect(tool.description).toBeTruthy();
      expect(typeof tool.description).toBe('string');

      expect(tool.inputSchema).toBeTruthy();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeTruthy();
    }
  });

  it('all tool names should start with "gemini_"', () => {
    for (const tool of TOOLS) {
      expect(tool.name.startsWith('gemini_')).toBe(true);
    }
  });

  // ========== Store (Corpus) Operations ==========
  describe('Store (Corpus) Operations', () => {
    it('should have gemini_create_store with display_name required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_create_store');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.properties.display_name).toBeDefined();
      expect(tool!.inputSchema.required).toContain('display_name');
    });

    it('should have gemini_get_store with corpus_id required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_get_store');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.properties.corpus_id).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
    });

    it('should have gemini_list_stores with optional pagination', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_list_stores');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.properties.page_size).toBeDefined();
      expect(tool!.inputSchema.properties.page_token).toBeDefined();
      // No required fields
      expect(tool!.inputSchema.required).toBeUndefined();
    });

    it('should have gemini_delete_store with corpus_id required and optional force', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_delete_store');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
      expect(tool!.inputSchema.properties.force).toBeDefined();
      expect(tool!.inputSchema.properties.force.type).toBe('boolean');
    });
  });

  // ========== Document Operations ==========
  describe('Document Operations', () => {
    it('should have gemini_create_document with corpus_id and display_name required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_create_document');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
      expect(tool!.inputSchema.required).toContain('display_name');
      expect(tool!.inputSchema.properties.metadata).toBeDefined();
    });

    it('should have gemini_get_document with corpus_id and document_id required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_get_document');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
      expect(tool!.inputSchema.required).toContain('document_id');
    });

    it('should have gemini_list_documents with corpus_id required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_list_documents');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
    });

    it('should have gemini_delete_document with corpus_id and document_id required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_delete_document');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
      expect(tool!.inputSchema.required).toContain('document_id');
      expect(tool!.inputSchema.properties.force).toBeDefined();
    });
  });

  // ========== Content Upload Operations ==========
  describe('Content Upload Operations', () => {
    it('should have gemini_upload_text with corpus_id, document_name, text_content required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_upload_text');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
      expect(tool!.inputSchema.required).toContain('document_name');
      expect(tool!.inputSchema.required).toContain('text_content');
      expect(tool!.inputSchema.properties.chunk_size).toBeDefined();
      expect(tool!.inputSchema.properties.chunk_overlap).toBeDefined();
      expect(tool!.inputSchema.properties.metadata).toBeDefined();
    });

    it('should have gemini_import_url with corpus_id, url, document_name required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_import_url');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
      expect(tool!.inputSchema.required).toContain('url');
      expect(tool!.inputSchema.required).toContain('document_name');
    });

    it('should have gemini_create_chunks with corpus_id, document_id, chunks required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_create_chunks');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
      expect(tool!.inputSchema.required).toContain('document_id');
      expect(tool!.inputSchema.required).toContain('chunks');
      expect(tool!.inputSchema.properties.chunks.type).toBe('array');
    });
  });

  // ========== Chunk Management Operations ==========
  describe('Chunk Management Operations', () => {
    it('should have gemini_list_chunks with corpus_id and document_id required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_list_chunks');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
      expect(tool!.inputSchema.required).toContain('document_id');
    });

    it('should have gemini_get_chunk with corpus_id, document_id, chunk_id required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_get_chunk');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
      expect(tool!.inputSchema.required).toContain('document_id');
      expect(tool!.inputSchema.required).toContain('chunk_id');
    });

    it('should have gemini_delete_chunk with corpus_id, document_id, chunk_id required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_delete_chunk');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
      expect(tool!.inputSchema.required).toContain('document_id');
      expect(tool!.inputSchema.required).toContain('chunk_id');
    });
  });

  // ========== Search & AI Operations ==========
  describe('Search & AI Operations', () => {
    it('should have gemini_search_store with corpus_id and query required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_search_store');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
      expect(tool!.inputSchema.required).toContain('query');
      expect(tool!.inputSchema.properties.results_count).toBeDefined();
      expect(tool!.inputSchema.properties.metadata_filters).toBeDefined();
    });

    it('should have gemini_ai_agent with corpus_id and query required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_ai_agent');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('corpus_id');
      expect(tool!.inputSchema.required).toContain('query');
      expect(tool!.inputSchema.properties.model).toBeDefined();
      expect(tool!.inputSchema.properties.temperature).toBeDefined();
      expect(tool!.inputSchema.properties.max_output_tokens).toBeDefined();
      expect(tool!.inputSchema.properties.max_chunks_count).toBeDefined();
      expect(tool!.inputSchema.properties.minimum_relevance_score).toBeDefined();
      expect(tool!.inputSchema.properties.metadata_filters).toBeDefined();
    });
  });

  // ========== Bilingual Descriptions ==========
  describe('Bilingual Descriptions', () => {
    it('all tools should have both Thai and English in description', () => {
      for (const tool of TOOLS) {
        // Check for Thai characters
        const hasThai = /[\u0E00-\u0E7F]/.test(tool.description);
        // Check for English (pipe separator pattern)
        const hasEnglish = /[a-zA-Z]/.test(tool.description);

        expect(hasThai).toBe(true);
        expect(hasEnglish).toBe(true);
      }
    });
  });

  // ========== Complete tool list ==========
  describe('Complete Tool List', () => {
    const expectedTools = [
      'gemini_create_store',
      'gemini_get_store',
      'gemini_list_stores',
      'gemini_delete_store',
      'gemini_create_document',
      'gemini_get_document',
      'gemini_list_documents',
      'gemini_delete_document',
      'gemini_upload_text',
      'gemini_import_url',
      'gemini_create_chunks',
      'gemini_list_chunks',
      'gemini_get_chunk',
      'gemini_delete_chunk',
      'gemini_search_store',
      'gemini_ai_agent',
      'gemini_upload_file',
      'gemini_list_files',
      'gemini_get_file',
      'gemini_delete_file',
      'gemini_create_file_search_store',
      'gemini_get_file_search_store',
      'gemini_list_file_search_stores',
      'gemini_delete_file_search_store',
      'gemini_upload_to_file_search_store',
      'gemini_import_to_file_search_store',
    ];

    it('should have all expected tools', () => {
      const toolNames = TOOLS.map(t => t.name);
      for (const expected of expectedTools) {
        expect(toolNames).toContain(expected);
      }
    });

    it('should not have unexpected tools', () => {
      const toolNames = TOOLS.map(t => t.name);
      for (const name of toolNames) {
        expect(expectedTools).toContain(name);
      }
    });
  });
});
