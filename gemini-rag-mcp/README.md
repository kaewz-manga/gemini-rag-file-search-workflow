# Gemini RAG File Search MCP

MCP (Model Context Protocol) Server สำหรับ **Gemini Semantic Retrieval API** รันบน **Cloudflare Workers**

ระบบ RAG (Retrieval-Augmented Generation) สำหรับค้นหาและตอบคำถามจากเอกสาร ด้วย Google Gemini AI

## Features

- **16 MCP Tools** ครอบคลุมทุก operation ของ Gemini RAG File Search
- **Cloudflare Workers** - Edge deployment, low latency
- **D1 Database** - User management, usage tracking
- **Multi-tenant SaaS** - API key authentication, rate limiting, plans
- **Bilingual** - รองรับ tool descriptions ทั้งภาษาไทยและอังกฤษ

## MCP Tools (16 Operations)

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

## Custom Metadata

รองรับ metadata สำหรับจัดหมวดหมู่เอกสาร:
- **category** (string) - หมวดหมู่เอกสาร
- **project** (string) - ชื่อโปรเจค
- **tags** (string[]) - แท็กสำหรับค้นหา
- **priority** (number) - ลำดับความสำคัญ

## Quick Start

### 1. Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Account](https://dash.cloudflare.com/)
- [Gemini API Key](https://aistudio.google.com/apikey)

### 2. Setup

```bash
# Clone repository
git clone https://github.com/kaewz-manga/gemini-rag-file-search-workflow.git
cd gemini-rag-file-search-workflow/gemini-rag-mcp

# Install dependencies
npm install

# Create D1 database
wrangler d1 create gemini-rag-mcp-db

# Create KV namespace
wrangler kv:namespace create "RATE_LIMIT_KV"

# Update wrangler.toml with your database_id and KV id

# Apply database schema
npm run db:migrate:local

# Set secrets
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY
wrangler secret put GEMINI_API_KEY

# Copy dev vars
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your values

# Run locally
npm run dev
```

### 3. Deploy

```bash
# Apply schema to production
npm run db:migrate

# Deploy to Cloudflare Workers
npm run deploy
```

## API Endpoints

### MCP Endpoint
```
POST /mcp
Authorization: Bearer grag_xxxxx
Content-Type: application/json
```

### Management API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | ลงทะเบียนผู้ใช้ใหม่ |
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| GET | `/api/plans` | ดูแพ็กเกจทั้งหมด |
| GET | `/api/user/profile` | ดูข้อมูลผู้ใช้ |
| PUT | `/api/user/password` | เปลี่ยนรหัสผ่าน |
| GET | `/api/connections` | ดู Gemini connections |
| POST | `/api/connections` | สร้าง connection ใหม่ |
| DELETE | `/api/connections/:id` | ลบ connection |
| POST | `/api/connections/:id/api-keys` | สร้าง API key |
| DELETE | `/api/api-keys/:id` | เพิกถอน API key |
| GET | `/api/usage` | ดูสถิติการใช้งาน |

## Usage Example

### 1. Register & Create Connection

```bash
# Register
curl -X POST https://your-worker.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "your-password"}'

# Login
curl -X POST https://your-worker.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "your-password"}'

# Create connection (use JWT token from login)
curl -X POST https://your-worker.workers.dev/api/connections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "My Gemini", "gemini_api_key": "YOUR_GEMINI_API_KEY"}'
```

### 2. Use MCP Tools

```bash
# Create Store
curl -X POST https://your-worker.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer grag_YOUR_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "gemini_create_store",
      "arguments": {"display_name": "My Knowledge Base"}
    }
  }'

# Upload Text
curl -X POST https://your-worker.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer grag_YOUR_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "gemini_upload_text",
      "arguments": {
        "corpus_id": "corpora/xxx",
        "document_name": "Product Manual",
        "text_content": "Your text content here...",
        "metadata": {"category": "manual", "project": "product-x"}
      }
    }
  }'

# Search
curl -X POST https://your-worker.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer grag_YOUR_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "gemini_search_store",
      "arguments": {
        "corpus_id": "corpora/xxx",
        "query": "How to setup the product?"
      }
    }
  }'

# AI Agent
curl -X POST https://your-worker.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer grag_YOUR_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "gemini_ai_agent",
      "arguments": {
        "corpus_id": "corpora/xxx",
        "query": "สรุปขั้นตอนการติดตั้งผลิตภัณฑ์",
        "temperature": 0.3
      }
    }
  }'
```

### 3. Claude Desktop Configuration

```json
{
  "mcpServers": {
    "gemini-rag": {
      "url": "https://your-worker.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer grag_YOUR_API_KEY"
      }
    }
  }
}
```

## Architecture

```
┌─────────────────────────────────────────┐
│           Claude / MCP Client           │
└──────────────────┬──────────────────────┘
                   │ JSON-RPC 2.0
                   ▼
┌─────────────────────────────────────────┐
│        Cloudflare Worker (MCP)          │
│  ┌─────────────────────────────────┐    │
│  │  Auth (API Key / JWT)           │    │
│  │  Rate Limiting (KV)             │    │
│  │  Usage Tracking (D1)            │    │
│  └──────────────┬──────────────────┘    │
│                 │                        │
│  ┌──────────────▼──────────────────┐    │
│  │  MCP Tool Handler (16 tools)    │    │
│  │  - Store CRUD                   │    │
│  │  - Document CRUD                │    │
│  │  - Chunk CRUD                   │    │
│  │  - Upload / Import              │    │
│  │  - Search / AI Agent            │    │
│  └──────────────┬──────────────────┘    │
└─────────────────┼───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     Google Gemini API (v1beta)          │
│  - Semantic Retrieval (Corpora API)     │
│  - Generate Content (with RAG)          │
└─────────────────────────────────────────┘
```

## Plans

| Plan | Requests/mo | Connections | Price |
|------|------------|-------------|-------|
| Free | 100 | 1 | $0 |
| Starter | 1,000 | 3 | $9.99 |
| Pro | 10,000 | 10 | $29.99 |
| Enterprise | 100,000 | Unlimited | $99.99 |

## License

MIT
