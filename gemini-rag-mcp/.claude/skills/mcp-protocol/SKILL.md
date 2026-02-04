# MCP Protocol Skill

> JSON-RPC 2.0 protocol reference.

## Request Format
```json
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"tool_name","arguments":{}}}
```

## Response Format
```json
{"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"{}"}]}}
```
