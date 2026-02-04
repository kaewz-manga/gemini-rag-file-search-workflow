# HANDOFF - gemini-rag-mcp

> สำหรับ Claude ตัวถัดไปที่จะเข้ามาทำงานต่อ

**Date**: 2026-02-05
**Repo**: https://github.com/kaewz-manga/gemini-rag-file-search-workflow/tree/main/gemini-rag-mcp
**Template**: n8n-management-mcp (same pattern)

---

## Project Overview

**gemini-rag-mcp** เป็น MCP SaaS Platform สำหรับ Google Gemini Semantic Retrieval API (RAG)

- **Tools**: 16 MCP tools (corpus, document, chunk, search, AI agent)
- **Pattern**: เหมือน n8n-management-mcp ทุกประการ

---

## Current Status: Core + Foundation Complete ✅

### สิ่งที่ทำเสร็จแล้ว

1. **Core MCP Server** ✅
   - 16 Gemini RAG tools
   - Cloudflare Workers ready
   - schema.sql for D1

2. **Foundation Structure** ✅
   - 9 CLAUDE.md files
   - 6 agents
   - 6 skills
   - 8 commands
   - .mcp.json

### สิ่งที่ยังไม่ได้ทำ

1. **Dashboard** (ต้องสร้างใหม่)
   - [ ] React SPA with purple theme (rag-*)
   - [ ] File store management UI
   - [ ] Search interface
   - [ ] Ask (RAG) interface
   - [ ] Citation display

2. **Complete SaaS Layer**
   - [ ] User registration/login
   - [ ] Gemini API key encryption
   - [ ] Usage tracking
   - [ ] Stripe billing

---

## Key Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Worker                                          │
│                                                             │
│  /mcp              → MCP Protocol (16 tools)                │
│  /api/auth/*       → Register, Login, OAuth                 │
│  /api/connections  → Gemini connection CRUD                 │
│  /api/filestores   → File store management                  │
│                                                             │
│  D1 Database ──── KV (Rate Limit)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Google Gemini Semantic Retrieval API                       │
│  - Corpus (Store) management                                │
│  - Document + Chunk operations                              │
│  - Semantic search                                          │
│  - Grounded generation with citations                       │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
gemini-rag-mcp/
├── CLAUDE.md              # Main guide (Quick Links)
├── HANDOFF.md             # This file
├── README.md              # User docs
├── src/
│   ├── CLAUDE.md
│   ├── index.ts           # Worker entry
│   ├── tools.ts           # 16 MCP tools
│   ├── gemini-client.ts   # Gemini API client
│   └── ...
├── dashboard/             # TO BE BUILT
│   ├── CLAUDE.md
│   └── src/...
├── migrations/
│   └── CLAUDE.md
├── tests/
│   └── CLAUDE.md
├── schema.sql             # D1 schema
└── .claude/
    ├── agents/
    ├── skills/
    └── commands/
```

---

## Important Notes

1. **Gemini API Key** — ต้อง encrypt ก่อนเก็บใน D1
2. **Pattern ต้องเหมือน n8n-management-mcp**
3. **Theme Color**: Purple (#8b5cf6) — ใช้ class `rag-*`
4. **API Key Prefix**: `n2f_` (same as all MCP projects)

---

## MCP Tools (16)

### Store (Corpus) - 4 tools
- gemini_create_store, gemini_get_store, gemini_list_stores, gemini_delete_store

### Document - 4 tools
- gemini_create_document, gemini_get_document, gemini_list_documents, gemini_delete_document

### Content Upload - 3 tools
- gemini_upload_text, gemini_import_url, gemini_create_chunks

### Chunk Management - 3 tools
- gemini_list_chunks, gemini_get_chunk, gemini_delete_chunk

### Search & AI - 2 tools
- gemini_search_store, gemini_ai_agent

---

## Gemini Concepts

```
Corpus (Store)
    └── Document (with metadata)
            └── Chunk (searchable text)

Flow:
1. Create corpus → 2. Create document → 3. Upload text/chunks
4. Search corpus → 5. Get relevant chunks → 6. Generate answer with citations
```

---

## Dashboard Components (to build)

- **FileStoreSelector** — เลือก corpus ที่จะทำงานด้วย
- **UploadDropzone** — Upload files
- **FileCard** — แสดง file พร้อม status (PROCESSING/ACTIVE/FAILED)
- **SearchInput** — ช่องค้นหา
- **CitationCard** — แสดง citation จาก RAG
- **AnswerCard** — แสดงคำตอบจาก AI agent

---

## Next Steps

1. อ่าน `CLAUDE.md` ทั้งหมด
2. ดู schema.sql สำหรับ database structure
3. สร้าง Dashboard (React + purple theme)
4. Implement Gemini API key encryption
5. Add file upload flow
6. Build search and ask pages

---

## Quick Commands

```bash
# Development
npm run dev
npx wrangler dev

# Database
wrangler d1 execute gemini-rag-mcp-db --local --file=./schema.sql

# Deploy
npx wrangler deploy

# Test
npm test
```

---

**Last Updated**: 2026-02-05
**By**: Claude Opus 4.5
