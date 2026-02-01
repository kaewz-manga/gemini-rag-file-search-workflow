/**
 * MCP Tool Definitions for Gemini RAG File Search
 *
 * Operations:
 * ========== Store Operations (4) ==========
 *  1. gemini_create_store       - Create a new FileSearchStore
 *  2. gemini_get_store          - Get store details
 *  3. gemini_list_stores        - List all stores
 *  4. gemini_delete_store       - Delete a store
 *
 * ========== Upload / Import Operations (3) ==========
 *  5. gemini_upload_text        - Upload text content to a store
 *  6. gemini_import_url         - Import content from URL into a store
 *  7. gemini_import_file        - Import file from Files API into a store
 *
 * ========== Document Operations (3) ==========
 *  8. gemini_list_documents     - List documents in a store
 *  9. gemini_get_document       - Get document details
 * 10. gemini_delete_document    - Delete a document
 *
 * ========== Search Operations (1) ==========
 * 11. gemini_search_store       - Search store with AI (generateContent + file_search)
 *
 * Total: 11 tools
 */

export const TOOLS = [
  // ========== Store Operations (4) ==========
  {
    name: 'gemini_create_store',
    description:
      'สร้าง FileSearchStore ใหม่สำหรับเก็บเอกสารและค้นหาด้วย RAG คืนค่า store name สำหรับใช้ในการอัปโหลดเอกสารและค้นหา | Create a new FileSearchStore for storing documents and searching with RAG. Returns store name for uploading documents and searching.',
    inputSchema: {
      type: 'object',
      properties: {
        display_name: {
          type: 'string',
          description: 'ชื่อ Store เช่น "คู่มือผลิตภัณฑ์", "เอกสารโปรเจค" | Display name for the store (max 512 chars)',
        },
      },
      required: ['display_name'],
    },
  },
  {
    name: 'gemini_get_store',
    description:
      'ดูรายละเอียดของ FileSearchStore รวมถึงชื่อ, เวลาสร้าง, เวลาอัปเดตล่าสุด | Get FileSearchStore details including name, creation time, and last update time.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: {
          type: 'string',
          description: 'Store ID เช่น "my-store-abc123" หรือ "fileSearchStores/my-store-abc123" | Store ID from create_store or list_stores',
        },
      },
      required: ['store_id'],
    },
  },
  {
    name: 'gemini_list_stores',
    description:
      'แสดงรายการ FileSearchStore ทั้งหมด คืนค่า store name, ชื่อ, เวลาสร้าง | List all FileSearchStores. Returns store name, display name, and timestamps.',
    inputSchema: {
      type: 'object',
      properties: {
        page_size: {
          type: 'number',
          description: 'จำนวนรายการต่อหน้า (ค่าเริ่มต้น: 20, สูงสุด: 20) | Number of items per page (default: 20, max: 20)',
        },
        page_token: {
          type: 'string',
          description: 'Token สำหรับหน้าถัดไป (จาก response ก่อนหน้า) | Token for next page from previous response',
        },
      },
    },
  },
  {
    name: 'gemini_delete_store',
    description:
      'ลบ FileSearchStore และเอกสารทั้งหมด การลบจะถาวรไม่สามารถกู้คืนได้ ใช้ force=true เพื่อลบ Store ที่มีเอกสารอยู่ | Delete a FileSearchStore permanently. Use force=true to delete a store with documents.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: {
          type: 'string',
          description: 'Store ID ที่ต้องการลบ | Store ID to delete',
        },
        force: {
          type: 'boolean',
          description: 'ลบแม้มีเอกสารอยู่ (ค่าเริ่มต้น: false) | Force delete even if documents exist (default: false)',
        },
      },
      required: ['store_id'],
    },
  },

  // ========== Upload / Import Operations (3) ==========
  {
    name: 'gemini_upload_text',
    description:
      'อัปโหลดข้อความเข้า FileSearchStore โดยตรง ระบบจะประมวลผลและแบ่ง chunks อัตโนมัติ รองรับ custom metadata | Upload text content directly to a FileSearchStore. Auto-processes and chunks the content. Supports custom metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: {
          type: 'string',
          description: 'Store ID ที่จะอัปโหลด | Store ID to upload to',
        },
        text_content: {
          type: 'string',
          description: 'เนื้อหาข้อความที่ต้องการอัปโหลด | Text content to upload',
        },
        display_name: {
          type: 'string',
          description: 'ชื่อเอกสาร (optional) | Document display name (optional)',
        },
        metadata: {
          type: 'array',
          description: 'Custom metadata เช่น [{"key": "genre", "stringValue": "fiction"}] | Custom metadata key-value pairs',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              stringValue: { type: 'string' },
              numericValue: { type: 'number' },
              stringListValue: {
                type: 'object',
                properties: { values: { type: 'array', items: { type: 'string' } } },
              },
            },
            required: ['key'],
          },
        },
      },
      required: ['store_id', 'text_content'],
    },
  },
  {
    name: 'gemini_import_url',
    description:
      'นำเข้าเนื้อหาจาก URL เข้า FileSearchStore โดยจะดึงเนื้อหาจาก URL แล้วอัปโหลดเข้า Files API แล้ว import เข้า store | Import content from a URL into a FileSearchStore. Fetches URL, uploads to Files API, then imports to store.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: {
          type: 'string',
          description: 'Store ID ที่จะนำเข้า | Store ID to import into',
        },
        url: {
          type: 'string',
          description: 'URL ของเนื้อหาที่ต้องการนำเข้า | URL of content to import',
        },
        display_name: {
          type: 'string',
          description: 'ชื่อเอกสาร | Document display name',
        },
        metadata: {
          type: 'array',
          description: 'Custom metadata | Custom metadata key-value pairs',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              stringValue: { type: 'string' },
              numericValue: { type: 'number' },
            },
            required: ['key'],
          },
        },
      },
      required: ['store_id', 'url', 'display_name'],
    },
  },
  {
    name: 'gemini_import_file',
    description:
      'นำเข้าไฟล์จาก Files API เข้า FileSearchStore ใช้เมื่อมีไฟล์ใน Files API อยู่แล้ว | Import a file from Files API into a FileSearchStore. Use when you already have a file in the Files API.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: {
          type: 'string',
          description: 'Store ID ที่จะนำเข้า | Store ID to import into',
        },
        file_name: {
          type: 'string',
          description: 'ชื่อไฟล์จาก Files API เช่น "files/abc123" | File name from Files API e.g. "files/abc123"',
        },
        metadata: {
          type: 'array',
          description: 'Custom metadata | Custom metadata key-value pairs',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              stringValue: { type: 'string' },
              numericValue: { type: 'number' },
            },
            required: ['key'],
          },
        },
      },
      required: ['store_id', 'file_name'],
    },
  },

  // ========== Document Operations (3) ==========
  {
    name: 'gemini_list_documents',
    description:
      'แสดงรายการเอกสารทั้งหมดใน FileSearchStore คืนค่า document name, ชื่อ, metadata | List all documents in a FileSearchStore. Returns document name, display name, and metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: {
          type: 'string',
          description: 'Store ID | Store ID',
        },
        page_size: {
          type: 'number',
          description: 'จำนวนรายการต่อหน้า (ค่าเริ่มต้น: 20) | Items per page (default: 20)',
        },
        page_token: {
          type: 'string',
          description: 'Token สำหรับหน้าถัดไป | Token for next page',
        },
      },
      required: ['store_id'],
    },
  },
  {
    name: 'gemini_get_document',
    description:
      'ดูรายละเอียดเอกสารใน FileSearchStore รวมถึง metadata, เวลาสร้าง | Get document details from a FileSearchStore including metadata and timestamps.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: {
          type: 'string',
          description: 'Store ID | Store ID',
        },
        document_id: {
          type: 'string',
          description: 'Document ID หรือ full name เช่น "fileSearchStores/xxx/documents/yyy" | Document ID or full name',
        },
      },
      required: ['store_id', 'document_id'],
    },
  },
  {
    name: 'gemini_delete_document',
    description:
      'ลบเอกสารจาก FileSearchStore การลบจะถาวร ใช้ force=true เพื่อลบเอกสารที่มีข้อมูลอยู่ | Delete a document from a FileSearchStore permanently. Use force=true if document has data.',
    inputSchema: {
      type: 'object',
      properties: {
        document_name: {
          type: 'string',
          description: 'Document full name เช่น "fileSearchStores/xxx/documents/yyy" | Document full resource name',
        },
        force: {
          type: 'boolean',
          description: 'ลบแม้มีข้อมูลอยู่ (ค่าเริ่มต้น: false) | Force delete (default: false)',
        },
      },
      required: ['document_name'],
    },
  },

  // ========== Search Operations (1) ==========
  {
    name: 'gemini_search_store',
    description:
      'ค้นหาเนื้อหาใน FileSearchStore ด้วย AI (Gemini + file_search tool) คืนค่าคำตอบพร้อมแหล่งอ้างอิงจากเอกสาร สามารถกรองด้วย metadata ได้ | Search a FileSearchStore using AI (Gemini + file_search tool). Returns grounded answer with source references. Supports metadata filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: {
          type: 'string',
          description: 'Store ID ที่ต้องการค้นหา | Store ID to search in',
        },
        query: {
          type: 'string',
          description: 'คำค้นหา (รองรับภาษาธรรมชาติ) | Search query (supports natural language)',
        },
        model: {
          type: 'string',
          description: 'Gemini model (ค่าเริ่มต้น: gemini-2.0-flash) | Gemini model to use (default: gemini-2.0-flash)',
        },
        temperature: {
          type: 'number',
          description: 'ความสร้างสรรค์ 0.0-2.0 (ค่าเริ่มต้น: auto) | Creativity 0.0-2.0',
        },
        max_output_tokens: {
          type: 'number',
          description: 'จำนวน token สูงสุดในคำตอบ | Max output tokens',
        },
        top_k: {
          type: 'number',
          description: 'จำนวน chunks ที่ดึงมาอ้างอิง | Number of document chunks to retrieve',
        },
        metadata_filter: {
          type: 'string',
          description: 'ตัวกรอง metadata แบบ AIP-160 เช่น \'genre = "fiction"\' | Metadata filter in AIP-160 syntax',
        },
      },
      required: ['store_id', 'query'],
    },
  },
];
