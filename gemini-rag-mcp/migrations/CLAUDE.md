# Database Migrations Guide

> Database schema for gemini-rag-mcp.

**Schema File**: `schema.sql`

---

## Tables (7)

| Table | Purpose |
|-------|---------|
| `users` | User accounts, OAuth |
| `gemini_connections` | Encrypted Gemini API keys |
| `api_keys` | SaaS API keys (n2f_xxx) |
| `usage_logs` | Per-request logs |
| `usage_monthly` | Monthly aggregation |
| `plans` | Subscription plans |
| `admin_logs` | Admin audit trail |

---

## Key Tables

### gemini_connections

```sql
CREATE TABLE gemini_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  gemini_api_key_encrypted TEXT NOT NULL,
  default_corpus_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);
```

### api_keys

```sql
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  connection_id TEXT NOT NULL REFERENCES gemini_connections(id),
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## Commands

```bash
# Apply schema locally
wrangler d1 execute gemini-rag-mcp-db --local --file=./schema.sql

# Apply to production
wrangler d1 execute gemini-rag-mcp-db --remote --file=./schema.sql
```
