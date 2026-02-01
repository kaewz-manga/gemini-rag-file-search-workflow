/**
 * Tests for tools.ts
 * - Tool definitions structure validation
 * - All 11 tools present
 * - inputSchema validation
 */

import { describe, it, expect } from 'vitest';
import { TOOLS } from '../src/tools';

describe('MCP Tool Definitions', () => {
  it('should have exactly 11 tools', () => {
    expect(TOOLS).toHaveLength(11);
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

  // ========== Store Operations ==========
  describe('Store Operations', () => {
    it('should have gemini_create_store with display_name required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_create_store');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.properties.display_name).toBeDefined();
      expect(tool!.inputSchema.required).toContain('display_name');
    });

    it('should have gemini_get_store with store_id required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_get_store');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.properties.store_id).toBeDefined();
      expect(tool!.inputSchema.required).toContain('store_id');
    });

    it('should have gemini_list_stores with optional pagination', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_list_stores');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.properties.page_size).toBeDefined();
      expect(tool!.inputSchema.properties.page_token).toBeDefined();
      expect(tool!.inputSchema.required).toBeUndefined();
    });

    it('should have gemini_delete_store with store_id required and optional force', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_delete_store');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('store_id');
      expect(tool!.inputSchema.properties.force).toBeDefined();
      expect(tool!.inputSchema.properties.force.type).toBe('boolean');
    });
  });

  // ========== Upload / Import Operations ==========
  describe('Upload / Import Operations', () => {
    it('should have gemini_upload_text with store_id and text_content required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_upload_text');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('store_id');
      expect(tool!.inputSchema.required).toContain('text_content');
      expect(tool!.inputSchema.properties.display_name).toBeDefined();
      expect(tool!.inputSchema.properties.metadata).toBeDefined();
    });

    it('should have gemini_import_url with store_id, url, display_name required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_import_url');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('store_id');
      expect(tool!.inputSchema.required).toContain('url');
      expect(tool!.inputSchema.required).toContain('display_name');
    });

    it('should have gemini_import_file with store_id and file_name required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_import_file');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('store_id');
      expect(tool!.inputSchema.required).toContain('file_name');
    });
  });

  // ========== Document Operations ==========
  describe('Document Operations', () => {
    it('should have gemini_list_documents with store_id required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_list_documents');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('store_id');
    });

    it('should have gemini_get_document with store_id and document_id required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_get_document');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('store_id');
      expect(tool!.inputSchema.required).toContain('document_id');
    });

    it('should have gemini_delete_document with document_name required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_delete_document');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('document_name');
      expect(tool!.inputSchema.properties.force).toBeDefined();
    });
  });

  // ========== Search Operations ==========
  describe('Search Operations', () => {
    it('should have gemini_search_store with store_id and query required', () => {
      const tool = TOOLS.find(t => t.name === 'gemini_search_store');
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('store_id');
      expect(tool!.inputSchema.required).toContain('query');
      expect(tool!.inputSchema.properties.model).toBeDefined();
      expect(tool!.inputSchema.properties.temperature).toBeDefined();
      expect(tool!.inputSchema.properties.max_output_tokens).toBeDefined();
      expect(tool!.inputSchema.properties.top_k).toBeDefined();
      expect(tool!.inputSchema.properties.metadata_filter).toBeDefined();
    });
  });

  // ========== Bilingual Descriptions ==========
  describe('Bilingual Descriptions', () => {
    it('all tools should have both Thai and English in description', () => {
      for (const tool of TOOLS) {
        const hasThai = /[\u0E00-\u0E7F]/.test(tool.description);
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
      'gemini_upload_text',
      'gemini_import_url',
      'gemini_import_file',
      'gemini_list_documents',
      'gemini_get_document',
      'gemini_delete_document',
      'gemini_search_store',
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
