# Source Code Guide

> Worker source code for gemini-rag-mcp.

**Pattern**: Same as n8n-management-mcp

---

## File Structure

```
src/
├── index.ts              # Worker entry point
├── auth.ts               # JWT + API key authentication
├── crypto-utils.ts       # Encryption, hashing
├── db.ts                 # D1 database queries
├── gemini-client.ts      # Gemini Semantic Retrieval API
├── tools.ts              # 16 MCP tool definitions
├── types.ts              # TypeScript interfaces
└── saas-types.ts         # SaaS-specific types
```

---

## Gemini Semantic Retrieval API

### Core Concepts

```
Corpus (Store) → Documents → Chunks
        ↓
  Semantic Search → Relevant Chunks
        ↓
    AI Agent → Grounded Response with Citations
```

### Client Pattern

```typescript
class GeminiClient {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  async createCorpus(name: string): Promise<Corpus>;
  async createDocument(corpusName: string, displayName: string): Promise<Document>;
  async createChunks(documentName: string, chunks: Chunk[]): Promise<Chunk[]>;
  async searchCorpus(corpusName: string, query: string): Promise<SearchResult[]>;
  async generateAnswer(corpusName: string, question: string): Promise<Answer>;
}
```

---

## Auth Systems

| Type | Header | Used By |
|------|--------|---------|
| **JWT** | `Authorization: Bearer eyJhbG...` | Dashboard |
| **API Key** | `Authorization: Bearer n2f_xxx` | MCP clients |
| **OAuth** | Redirect flow | GitHub/Google login |

---

## API Routes

### MCP (`/mcp`)
- `POST /mcp` — JSON-RPC 2.0 endpoint (16 tools)

### Auth (`/api/auth/*`)
- `POST /register`, `POST /login`, `GET /me`

### Connections (`/api/connections/*`)
- CRUD for Gemini connections

### Admin (`/api/admin/*`)
- User management, plan changes
