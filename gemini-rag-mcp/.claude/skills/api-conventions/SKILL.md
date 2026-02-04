# API Conventions Skill

> REST API patterns for gemini-rag-mcp.

## Auth Headers
```
Authorization: Bearer rag_xxxxxxxxxxxxx
```

## Response Format
```json
{"success": true, "data": {...}}
{"success": false, "error": {"code": "...", "message": "..."}}
```
