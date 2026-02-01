/**
 * MCP Tool Definitions for Gemini RAG File Search
 *
 * Operations:
 * ========== Store (Corpus) Operations (4) ==========
 *  1. gemini_create_store       - Create a new corpus/store
 *  2. gemini_get_store          - Get store details
 *  3. gemini_list_stores        - List all stores
 *  4. gemini_delete_store       - Delete a store
 *
 * ========== Document Operations (4) ==========
 *  5. gemini_create_document    - Create a document in a store
 *  6. gemini_get_document       - Get document details
 *  7. gemini_list_documents     - List documents in a store
 *  8. gemini_delete_document    - Delete a document
 *
 * ========== Content Upload Operations (3) ==========
 *  9. gemini_upload_text        - Upload text content (auto-chunk)
 * 10. gemini_import_url         - Import content from URL
 * 11. gemini_create_chunks      - Create chunks manually
 *
 * ========== Chunk Management Operations (3) ==========
 * 12. gemini_list_chunks        - List chunks in a document
 * 13. gemini_get_chunk          - Get chunk details
 * 14. gemini_delete_chunk       - Delete a chunk
 *
 * ========== Search & AI Operations (2) ==========
 * 15. gemini_search_store       - Semantic search in a store
 * 16. gemini_ai_agent           - AI Agent (RAG search + generate answer)
 *
 * ========== Files API Operations (4) ==========
 * 17. gemini_upload_file        - Upload a file to Gemini Files API
 * 18. gemini_list_files         - List uploaded files
 * 19. gemini_get_file           - Get file details
 * 20. gemini_delete_file        - Delete a file
 *
 * ========== File Search Store Operations (6) ==========
 * 21. gemini_create_file_search_store    - Create a File Search Store
 * 22. gemini_get_file_search_store       - Get File Search Store details
 * 23. gemini_list_file_search_stores     - List File Search Stores
 * 24. gemini_delete_file_search_store    - Delete a File Search Store
 * 25. gemini_upload_to_file_search_store - Upload file to a File Search Store
 * 26. gemini_import_to_file_search_store - Import file into a File Search Store
 *
 * Total: 26 tools
 */

export const TOOLS = [
  // ========== Store (Corpus) Operations (4) ==========
  {
    name: 'gemini_create_store',
    description:
      'สร้าง Store (Corpus) ใหม่สำหรับเก็บเอกสารและค้นหาด้วย RAG เหมาะสำหรับจัดกลุ่มเอกสารตาม project, หมวดหมู่ หรือหัวข้อ คืนค่า corpus ID สำหรับใช้ในการอัปโหลดเอกสารและค้นหา | Create a new Store (Corpus) for storing documents and searching with RAG. Returns corpus ID for uploading documents and searching.',
    inputSchema: {
      type: 'object',
      properties: {
        display_name: {
          type: 'string',
          description: 'ชื่อ Store ที่จะสร้าง เช่น "คู่มือผลิตภัณฑ์", "เอกสารโปรเจค" | Display name for the store',
        },
      },
      required: ['display_name'],
    },
  },
  {
    name: 'gemini_get_store',
    description:
      'ดูรายละเอียดของ Store (Corpus) รวมถึงชื่อ, เวลาสร้าง, เวลาอัปเดตล่าสุด ใช้เพื่อตรวจสอบสถานะ Store ก่อนทำงานต่อ | Get Store (Corpus) details including name, creation time, and last update time.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID เช่น "my-corpus-123" หรือ "corpora/my-corpus-123" | Corpus ID from create_store or list_stores',
        },
      },
      required: ['corpus_id'],
    },
  },
  {
    name: 'gemini_list_stores',
    description:
      'แสดงรายการ Store (Corpus) ทั้งหมดที่มีอยู่ คืนค่า corpus ID, ชื่อ, เวลาสร้าง ใช้เพื่อดู Store ที่มีอยู่ก่อนสร้างใหม่หรือค้นหา | List all available Stores (Corpora). Returns corpus ID, name, and timestamps.',
    inputSchema: {
      type: 'object',
      properties: {
        page_size: {
          type: 'number',
          description: 'จำนวนรายการต่อหน้า (ค่าเริ่มต้น: 100, สูงสุด: 1000) | Number of items per page (default: 100)',
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
      'ลบ Store (Corpus) และเอกสารทั้งหมดในนั้น การลบจะถาวรไม่สามารถกู้คืนได้ ใช้ force=true เพื่อลบ Store ที่มีเอกสารอยู่ | Delete a Store (Corpus) and all its documents permanently. Use force=true to delete a store with documents.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID ที่ต้องการลบ | Corpus ID to delete',
        },
        force: {
          type: 'boolean',
          description: 'ลบแม้มีเอกสารอยู่ (ค่าเริ่มต้น: false) | Force delete even if documents exist (default: false)',
        },
      },
      required: ['corpus_id'],
    },
  },

  // ========== Document Operations (4) ==========
  {
    name: 'gemini_create_document',
    description:
      'สร้าง Document ใหม่ใน Store โดยสามารถกำหนด metadata ได้ เช่น category, project, tags, priority เหมาะสำหรับจัดระเบียบเอกสารก่อนอัปโหลดเนื้อหา | Create a new Document in a Store with optional custom metadata (category, project, tags, priority).',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID ที่จะสร้างเอกสาร | Corpus ID to create document in',
        },
        display_name: {
          type: 'string',
          description: 'ชื่อเอกสาร เช่น "คู่มือการใช้งาน v2.0" | Document display name',
        },
        metadata: {
          type: 'object',
          description: 'Custom metadata (optional): { category: string, project: string, tags: string[], priority: number }',
          properties: {
            category: { type: 'string', description: 'หมวดหมู่เอกสาร | Document category' },
            project: { type: 'string', description: 'ชื่อโปรเจค | Project name' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'แท็กสำหรับค้นหา | Tags for filtering',
            },
            priority: { type: 'number', description: 'ลำดับความสำคัญ | Priority level (1-5)' },
          },
        },
      },
      required: ['corpus_id', 'display_name'],
    },
  },
  {
    name: 'gemini_get_document',
    description:
      'ดูรายละเอียดเอกสาร รวมถึง metadata, เวลาสร้าง, เวลาอัปเดต ใช้ตรวจสอบข้อมูลเอกสารก่อนแก้ไขหรือค้นหา | Get document details including metadata, creation time, and update time.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID | Corpus ID',
        },
        document_id: {
          type: 'string',
          description: 'Document ID จาก create_document หรือ list_documents | Document ID from create_document or list_documents',
        },
      },
      required: ['corpus_id', 'document_id'],
    },
  },
  {
    name: 'gemini_list_documents',
    description:
      'แสดงรายการเอกสารทั้งหมดใน Store คืนค่า document ID, ชื่อ, metadata, เวลาสร้าง ใช้เพื่อดูเอกสารที่มีอยู่ก่อนอัปโหลดเพิ่มหรือค้นหา | List all documents in a Store. Returns document ID, name, metadata, and timestamps.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID | Corpus ID',
        },
        page_size: {
          type: 'number',
          description: 'จำนวนรายการต่อหน้า (ค่าเริ่มต้น: 100) | Items per page (default: 100)',
        },
        page_token: {
          type: 'string',
          description: 'Token สำหรับหน้าถัดไป | Token for next page',
        },
      },
      required: ['corpus_id'],
    },
  },
  {
    name: 'gemini_delete_document',
    description:
      'ลบเอกสารจาก Store รวมถึง chunks ทั้งหมด การลบจะถาวรไม่สามารถกู้คืนได้ ใช้ force=true เพื่อลบเอกสารที่มี chunks อยู่ | Delete a document and all its chunks permanently. Use force=true to delete a document with chunks.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID | Corpus ID',
        },
        document_id: {
          type: 'string',
          description: 'Document ID ที่ต้องการลบ | Document ID to delete',
        },
        force: {
          type: 'boolean',
          description: 'ลบแม้มี chunks อยู่ (ค่าเริ่มต้น: false) | Force delete even if chunks exist (default: false)',
        },
      },
      required: ['corpus_id', 'document_id'],
    },
  },

  // ========== Content Upload Operations (3) ==========
  {
    name: 'gemini_upload_text',
    description:
      'อัปโหลดข้อความเข้า Store โดยจะสร้าง Document และแบ่งข้อความเป็น chunks อัตโนมัติ รองรับ custom metadata สามารถกำหนดขนาด chunk และ overlap ได้ | Upload text content to a Store. Automatically creates a document and splits text into chunks. Supports custom metadata, configurable chunk size and overlap.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID ที่จะอัปโหลด | Corpus ID to upload to',
        },
        document_name: {
          type: 'string',
          description: 'ชื่อเอกสาร | Document display name',
        },
        text_content: {
          type: 'string',
          description: 'เนื้อหาข้อความที่ต้องการอัปโหลด | Text content to upload',
        },
        chunk_size: {
          type: 'number',
          description: 'ขนาด chunk (ตัวอักษร, ค่าเริ่มต้น: 2000) | Chunk size in characters (default: 2000)',
        },
        chunk_overlap: {
          type: 'number',
          description: 'จำนวนตัวอักษรที่ซ้อนทับระหว่าง chunks (ค่าเริ่มต้น: 200) | Overlap between chunks (default: 200)',
        },
        metadata: {
          type: 'object',
          description: 'Custom metadata: { category, project, tags, priority }',
          properties: {
            category: { type: 'string' },
            project: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            priority: { type: 'number' },
          },
        },
      },
      required: ['corpus_id', 'document_name', 'text_content'],
    },
  },
  {
    name: 'gemini_import_url',
    description:
      'นำเข้าเนื้อหาจาก URL เข้า Store โดยจะดึงเนื้อหาจาก URL, สร้าง Document, แบ่ง chunks อัตโนมัติ รองรับ webpage, text file, หรือ raw text content | Import content from a URL into a Store. Fetches URL content, creates a document, and auto-chunks the text.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID ที่จะนำเข้า | Corpus ID to import into',
        },
        url: {
          type: 'string',
          description: 'URL ของเนื้อหาที่ต้องการนำเข้า | URL of content to import',
        },
        document_name: {
          type: 'string',
          description: 'ชื่อเอกสาร | Document display name',
        },
        chunk_size: {
          type: 'number',
          description: 'ขนาด chunk (ค่าเริ่มต้น: 2000) | Chunk size (default: 2000)',
        },
        chunk_overlap: {
          type: 'number',
          description: 'จำนวน overlap (ค่าเริ่มต้น: 200) | Chunk overlap (default: 200)',
        },
        metadata: {
          type: 'object',
          description: 'Custom metadata: { category, project, tags, priority }',
          properties: {
            category: { type: 'string' },
            project: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            priority: { type: 'number' },
          },
        },
      },
      required: ['corpus_id', 'url', 'document_name'],
    },
  },
  {
    name: 'gemini_create_chunks',
    description:
      'สร้าง chunks แบบกำหนดเองในเอกสาร สำหรับกรณีที่ต้องการควบคุมการแบ่ง chunks เอง รองรับ batch upload สูงสุด 100 chunks ต่อครั้ง | Create custom chunks in a document. For manual chunk control. Supports batch upload up to 100 chunks per call.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID | Corpus ID',
        },
        document_id: {
          type: 'string',
          description: 'Document ID | Document ID',
        },
        chunks: {
          type: 'array',
          description: 'Array ของ chunks ที่ต้องการสร้าง | Array of chunks to create',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'เนื้อหาของ chunk | Chunk text content' },
              metadata: {
                type: 'object',
                description: 'Metadata ของ chunk (optional)',
              },
            },
            required: ['text'],
          },
        },
      },
      required: ['corpus_id', 'document_id', 'chunks'],
    },
  },

  // ========== Chunk Management Operations (3) ==========
  {
    name: 'gemini_list_chunks',
    description:
      'แสดงรายการ chunks ทั้งหมดในเอกสาร คืนค่า chunk ID, เนื้อหา, metadata, สถานะ ใช้ตรวจสอบเนื้อหาที่อัปโหลดแล้ว | List all chunks in a document. Returns chunk ID, content, metadata, and state.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID | Corpus ID',
        },
        document_id: {
          type: 'string',
          description: 'Document ID | Document ID',
        },
        page_size: {
          type: 'number',
          description: 'จำนวนรายการต่อหน้า (ค่าเริ่มต้น: 100) | Items per page (default: 100)',
        },
        page_token: {
          type: 'string',
          description: 'Token สำหรับหน้าถัดไป | Token for next page',
        },
      },
      required: ['corpus_id', 'document_id'],
    },
  },
  {
    name: 'gemini_get_chunk',
    description:
      'ดูรายละเอียดของ chunk รวมถึงเนื้อหา, metadata, สถานะการประมวลผล ใช้ตรวจสอบ chunk ก่อนแก้ไขหรือลบ | Get chunk details including content, metadata, and processing state.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID | Corpus ID',
        },
        document_id: {
          type: 'string',
          description: 'Document ID | Document ID',
        },
        chunk_id: {
          type: 'string',
          description: 'Chunk ID | Chunk ID',
        },
      },
      required: ['corpus_id', 'document_id', 'chunk_id'],
    },
  },
  {
    name: 'gemini_delete_chunk',
    description:
      'ลบ chunk จากเอกสาร การลบจะถาวรไม่สามารถกู้คืนได้ ใช้เมื่อต้องการลบเนื้อหาที่ไม่ต้องการ | Delete a chunk from a document permanently.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID | Corpus ID',
        },
        document_id: {
          type: 'string',
          description: 'Document ID | Document ID',
        },
        chunk_id: {
          type: 'string',
          description: 'Chunk ID ที่ต้องการลบ | Chunk ID to delete',
        },
      },
      required: ['corpus_id', 'document_id', 'chunk_id'],
    },
  },

  // ========== Search & AI Operations (2) ==========
  {
    name: 'gemini_search_store',
    description:
      'ค้นหาเนื้อหาใน Store ด้วย Semantic Search (RAG) คืนค่า chunks ที่เกี่ยวข้องพร้อมคะแนนความเกี่ยวข้อง สามารถกรองด้วย metadata ได้ | Search a Store using Semantic Search (RAG). Returns relevant chunks with relevance scores. Supports metadata filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID ที่ต้องการค้นหา | Corpus ID to search in',
        },
        query: {
          type: 'string',
          description: 'คำค้นหา (รองรับภาษาธรรมชาติ) | Search query (supports natural language)',
        },
        results_count: {
          type: 'number',
          description: 'จำนวนผลลัพธ์ (ค่าเริ่มต้น: 10, สูงสุด: 100) | Number of results (default: 10, max: 100)',
        },
        metadata_filters: {
          type: 'array',
          description: 'ตัวกรอง metadata เช่น [{"key": "category", "conditions": [{"stringValue": "manual", "operation": "EQUAL"}]}] | Metadata filters',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Metadata key to filter' },
              conditions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stringValue: { type: 'string' },
                    numericValue: { type: 'number' },
                    operation: {
                      type: 'string',
                      enum: ['EQUAL', 'NOT_EQUAL', 'LESS', 'LESS_EQUAL', 'GREATER', 'GREATER_EQUAL', 'INCLUDES', 'EXCLUDES'],
                    },
                  },
                  required: ['operation'],
                },
              },
            },
            required: ['key', 'conditions'],
          },
        },
      },
      required: ['corpus_id', 'query'],
    },
  },
  {
    name: 'gemini_ai_agent',
    description:
      'AI Agent ที่ค้นหาเนื้อหาจาก Store แล้วสร้างคำตอบโดยอ้างอิงจากเอกสาร (Grounded Generation) ใช้ Gemini model ร่วมกับ Semantic Retrieval สามารถปรับ temperature, model, และจำนวน chunks ที่ใช้อ้างอิงได้ | AI Agent that searches Store content and generates grounded answers using Gemini model + Semantic Retrieval. Configurable temperature, model, and reference chunk count.',
    inputSchema: {
      type: 'object',
      properties: {
        corpus_id: {
          type: 'string',
          description: 'Corpus ID ที่ต้องการค้นหาและตอบ | Corpus ID to search and answer from',
        },
        query: {
          type: 'string',
          description: 'คำถามหรือคำสั่ง (รองรับภาษาธรรมชาติ) | Question or instruction (supports natural language)',
        },
        model: {
          type: 'string',
          description: 'Gemini model (ค่าเริ่มต้น: gemini-2.0-flash) เลือกได้: gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash | Gemini model to use (default: gemini-2.0-flash)',
        },
        temperature: {
          type: 'number',
          description: 'ความสร้างสรรค์ 0.0-2.0 (ค่าเริ่มต้น: 0.7, ค่าต่ำ=ตรงประเด็น, ค่าสูง=สร้างสรรค์) | Creativity 0.0-2.0 (default: 0.7)',
        },
        max_output_tokens: {
          type: 'number',
          description: 'จำนวน token สูงสุดในคำตอบ (ค่าเริ่มต้น: 2048) | Max output tokens (default: 2048)',
        },
        max_chunks_count: {
          type: 'number',
          description: 'จำนวน chunks สูงสุดที่ใช้อ้างอิง | Max chunks for grounding',
        },
        minimum_relevance_score: {
          type: 'number',
          description: 'คะแนนความเกี่ยวข้องขั้นต่ำ 0.0-1.0 | Minimum relevance score 0.0-1.0',
        },
        metadata_filters: {
          type: 'array',
          description: 'ตัวกรอง metadata | Metadata filters (same format as search_store)',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              conditions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stringValue: { type: 'string' },
                    numericValue: { type: 'number' },
                    operation: {
                      type: 'string',
                      enum: ['EQUAL', 'NOT_EQUAL', 'LESS', 'LESS_EQUAL', 'GREATER', 'GREATER_EQUAL', 'INCLUDES', 'EXCLUDES'],
                    },
                  },
                  required: ['operation'],
                },
              },
            },
            required: ['key', 'conditions'],
          },
        },
      },
      required: ['corpus_id', 'query'],
    },
  },

  // ========== Files API Operations (4) ==========
  {
    name: 'gemini_upload_file',
    description:
      'อัปโหลดไฟล์ไปยัง Gemini Files API ไฟล์จะหมดอายุใน 48 ชั่วโมง รองรับ text, JSON, CSV และไฟล์ข้อความอื่นๆ ใช้คู่กับ import_to_file_search_store เพื่อนำไฟล์เข้า File Search Store | Upload a file to Gemini Files API. Files expire after 48 hours. Supports text, JSON, CSV. Use with import_to_file_search_store to add files to a File Search Store.',
    inputSchema: {
      type: 'object',
      properties: {
        file_content: {
          type: 'string',
          description: 'เนื้อหาไฟล์ (text content) | File content as text',
        },
        display_name: {
          type: 'string',
          description: 'ชื่อไฟล์ เช่น "report.txt", "data.json" | File display name',
        },
        mime_type: {
          type: 'string',
          description: 'MIME type เช่น "text/plain", "application/json", "text/csv" (ค่าเริ่มต้น: text/plain) | MIME type (default: text/plain)',
        },
      },
      required: ['file_content', 'display_name'],
    },
  },
  {
    name: 'gemini_list_files',
    description:
      'แสดงรายการไฟล์ทั้งหมดที่อัปโหลดไว้ใน Gemini Files API คืนค่า file ID, ชื่อ, MIME type, ขนาด, สถานะ, เวลาหมดอายุ | List all uploaded files in Gemini Files API. Returns file ID, name, MIME type, size, state, and expiration time.',
    inputSchema: {
      type: 'object',
      properties: {
        page_size: {
          type: 'number',
          description: 'จำนวนรายการต่อหน้า (ค่าเริ่มต้น: 100, สูงสุด: 100) | Items per page (default: 100, max: 100)',
        },
        page_token: {
          type: 'string',
          description: 'Token สำหรับหน้าถัดไป | Token for next page',
        },
      },
    },
  },
  {
    name: 'gemini_get_file',
    description:
      'ดูรายละเอียดของไฟล์ที่อัปโหลด รวมถึงชื่อ, MIME type, ขนาด, สถานะ (PROCESSING/ACTIVE/FAILED), เวลาหมดอายุ | Get uploaded file details including name, MIME type, size, state, and expiration time.',
    inputSchema: {
      type: 'object',
      properties: {
        file_id: {
          type: 'string',
          description: 'File ID เช่น "abc123" หรือ "files/abc123" | File ID from upload_file or list_files',
        },
      },
      required: ['file_id'],
    },
  },
  {
    name: 'gemini_delete_file',
    description:
      'ลบไฟล์ที่อัปโหลดไว้ใน Gemini Files API การลบจะถาวรไม่สามารถกู้คืนได้ | Delete an uploaded file from Gemini Files API permanently.',
    inputSchema: {
      type: 'object',
      properties: {
        file_id: {
          type: 'string',
          description: 'File ID ที่ต้องการลบ | File ID to delete',
        },
      },
      required: ['file_id'],
    },
  },

  // ========== File Search Store Operations (6) ==========
  {
    name: 'gemini_create_file_search_store',
    description:
      'สร้าง File Search Store ใหม่ เป็นระบบ RAG แบบ managed ที่จัดการ chunking, embedding และ search อัตโนมัติ เหมาะสำหรับอัปโหลดไฟล์และค้นหาโดยไม่ต้องจัดการ chunks เอง | Create a new File Search Store. Fully managed RAG system that handles chunking, embedding, and search automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        display_name: {
          type: 'string',
          description: 'ชื่อ File Search Store เช่น "เอกสารโปรเจค", "คู่มือผลิตภัณฑ์" | Display name for the File Search Store',
        },
      },
      required: ['display_name'],
    },
  },
  {
    name: 'gemini_get_file_search_store',
    description:
      'ดูรายละเอียดของ File Search Store รวมถึงชื่อ, สถานะ, เวลาสร้าง | Get File Search Store details including name, state, and creation time.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: {
          type: 'string',
          description: 'File Search Store ID เช่น "abc123" หรือ "fileSearchStores/abc123" | Store ID from create or list',
        },
      },
      required: ['store_id'],
    },
  },
  {
    name: 'gemini_list_file_search_stores',
    description:
      'แสดงรายการ File Search Store ทั้งหมด คืนค่า store ID, ชื่อ, สถานะ, เวลาสร้าง | List all File Search Stores. Returns store ID, name, state, and timestamps.',
    inputSchema: {
      type: 'object',
      properties: {
        page_size: {
          type: 'number',
          description: 'จำนวนรายการต่อหน้า (ค่าเริ่มต้น: 100) | Items per page (default: 100)',
        },
        page_token: {
          type: 'string',
          description: 'Token สำหรับหน้าถัดไป | Token for next page',
        },
      },
    },
  },
  {
    name: 'gemini_delete_file_search_store',
    description:
      'ลบ File Search Store และเอกสารทั้งหมดในนั้น การลบจะถาวรไม่สามารถกู้คืนได้ ใช้ force=true เพื่อลบ Store ที่มีเอกสารอยู่ | Delete a File Search Store permanently. Use force=true to cascade delete all documents.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: {
          type: 'string',
          description: 'File Search Store ID ที่ต้องการลบ | Store ID to delete',
        },
        force: {
          type: 'boolean',
          description: 'ลบแม้มีเอกสารอยู่ (ค่าเริ่มต้น: false) | Force delete with documents (default: false)',
        },
      },
      required: ['store_id'],
    },
  },
  {
    name: 'gemini_upload_to_file_search_store',
    description:
      'อัปโหลดไฟล์โดยตรงเข้า File Search Store ระบบจะจัดการ chunking และ indexing อัตโนมัติ รองรับ text, JSON, CSV | Upload a file directly to a File Search Store. Automatically handles chunking and indexing. Supports text, JSON, CSV.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: {
          type: 'string',
          description: 'File Search Store ID | Store ID to upload to',
        },
        file_content: {
          type: 'string',
          description: 'เนื้อหาไฟล์ (text content) | File content as text',
        },
        mime_type: {
          type: 'string',
          description: 'MIME type เช่น "text/plain", "application/json" (ค่าเริ่มต้น: text/plain) | MIME type (default: text/plain)',
        },
      },
      required: ['store_id', 'file_content'],
    },
  },
  {
    name: 'gemini_import_to_file_search_store',
    description:
      'นำเข้าไฟล์ที่อัปโหลดไว้แล้ว (จาก Files API) เข้า File Search Store ใช้คู่กับ upload_file เพื่ออัปโหลดไฟล์ก่อน แล้วนำเข้า Store คืนค่า operation สำหรับติดตามสถานะ | Import an already-uploaded file (from Files API) into a File Search Store. Use with upload_file first. Returns a long-running operation.',
    inputSchema: {
      type: 'object',
      properties: {
        store_id: {
          type: 'string',
          description: 'File Search Store ID | Store ID to import into',
        },
        file_id: {
          type: 'string',
          description: 'File ID จาก upload_file เช่น "abc123" หรือ "files/abc123" | File ID from upload_file',
        },
      },
      required: ['store_id', 'file_id'],
    },
  },
];
