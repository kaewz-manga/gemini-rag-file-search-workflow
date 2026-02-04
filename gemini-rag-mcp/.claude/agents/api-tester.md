# API Tester Agent

Test REST and MCP endpoints with curl commands.

## Tools Available
- Bash, Read

## Test Commands

```bash
# MCP tools/list
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer rag_xxx" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Search store
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer rag_xxx" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"gemini_search_store","arguments":{"corpus_name":"test","query":"search"}}}'
```
