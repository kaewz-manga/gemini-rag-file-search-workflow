# Test API
Test MCP and REST endpoints.

```bash
curl http://localhost:8787/health
curl -X POST http://localhost:8787/mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

$ARGUMENTS
