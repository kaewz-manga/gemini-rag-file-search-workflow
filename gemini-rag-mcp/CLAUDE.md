# gemini-rag-mcp

> MCP SaaS Platform for Google Gemini Semantic Retrieval API — 16 tools for RAG operations

**Source Repo**: https://github.com/kaewz-manga/gemini-rag-file-search-workflow/tree/main/gemini-rag-mcp

---

## Quick Links

| Area | Guide | Key Info |
|------|-------|----------|
| **Worker Code** | [`src/CLAUDE.md`](src/CLAUDE.md) | Routes, auth, Gemini client |
| **Dashboard** | [`dashboard/CLAUDE.md`](dashboard/CLAUDE.md) | React, theme, routes |
| **React Patterns** | [`dashboard/src/CLAUDE.md`](dashboard/src/CLAUDE.md) | Components, hooks |
| **Pages** | [`dashboard/src/pages/CLAUDE.md`](dashboard/src/pages/CLAUDE.md) | Page patterns |
| **Components** | [`dashboard/src/components/CLAUDE.md`](dashboard/src/components/CLAUDE.md) | UI components |
| **Contexts** | [`dashboard/src/contexts/CLAUDE.md`](dashboard/src/contexts/CLAUDE.md) | Auth, Sudo, FileStore |
| **Migrations** | [`migrations/CLAUDE.md`](migrations/CLAUDE.md) | D1 schema |
| **Tests** | [`tests/CLAUDE.md`](tests/CLAUDE.md) | Vitest patterns |

---

## MCP Tools (16 total)

### Store (Corpus) Operations
| Tool | Description |
|------|-------------|
| `gemini_create_store` | สร้าง Store (Corpus) ใหม่ |
| `gemini_get_store` | ดูรายละเอียด Store |
| `gemini_list_stores` | แสดงรายการ Store ทั้งหมด |
| `gemini_delete_store` | ลบ Store |

### Document Operations
| Tool | Description |
|------|-------------|
| `gemini_create_document` | สร้างเอกสารใน Store พร้อม metadata |
| `gemini_get_document` | ดูรายละเอียดเอกสาร |
| `gemini_list_documents` | แสดงรายการเอกสารใน Store |
| `gemini_delete_document` | ลบเอกสาร |

### Content Upload Operations
| Tool | Description |
|------|-------------|
| `gemini_upload_text` | อัปโหลดข้อความ (auto-chunk) |
| `gemini_import_url` | นำเข้าเนื้อหาจาก URL |
| `gemini_create_chunks` | สร้าง chunks แบบกำหนดเอง |

### Chunk Management Operations
| Tool | Description |
|------|-------------|
| `gemini_list_chunks` | แสดงรายการ chunks ในเอกสาร |
| `gemini_get_chunk` | ดูรายละเอียด chunk |
| `gemini_delete_chunk` | ลบ chunk |

### Search & AI Operations
| Tool | Description |
|------|-------------|
| `gemini_search_store` | ค้นหา Semantic Search (RAG) |
| `gemini_ai_agent` | AI Agent (ค้นหา + สร้างคำตอบ) |

---

## Database Schema (7 tables)

| Table | Purpose |
|-------|---------|
| `users` | User accounts, OAuth, admin flag |
| `gemini_connections` | Encrypted Gemini API keys per user |
| `api_keys` | SaaS API keys (rag_xxx) |
| `usage_logs` | Per-request usage logs |
| `usage_monthly` | Aggregated monthly usage |
| `plans` | Subscription plans |
| `admin_logs` | Admin action audit trail |

---

## Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build TypeScript
npm test                 # Run tests

# Database
npm run db:migrate:local   # Apply schema locally
npm run db:migrate:remote  # Apply to production

# Deploy
npx wrangler deploy      # Deploy to Cloudflare
```

---

## Configuration

```bash
# Secrets
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY
wrangler secret put GEMINI_API_KEY

# D1 Database
wrangler d1 create gemini-rag-mcp-db

# KV Namespace
wrangler kv:namespace create "RATE_LIMIT_KV"
```

---

**Version**: 1.0 | Updated: 2026-02-05
