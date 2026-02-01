# Quick Start Guide

เริ่มต้นใช้งาน Gemini RAG File Search Workflow ใน 5 นาที

## ⚡ Prerequisites

- [ ] n8n instance (self-hosted หรือ cloud)
- [ ] Google Drive account
- [ ] Gemini API key
- [ ] MCP Server endpoint

## 🚀 5-Minute Setup

### 1. Clone & Import (2 นาที)

```bash
# Clone repository
git clone <your-repo-url>
cd gemini-rag-file-search-workflow

# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

### 2. Import to n8n (1 นาที)

1. เปิด n8n
2. Click **Import from File**
3. เลือก `workflow.json`
4. Activate workflow

### 3. Configure (2 นาที)

#### Google Drive:
- Node: **Upload file**
- Set: Folder ID จาก `.env`

#### Data Tables:
- สร้าง 2 tables (see SETUP.md)
- Update IDs ใน workflow

#### MCP Client:
- All MCP nodes → Set endpoint URL
- Update: `{{MCP_ENDPOINT_URL}}`

## 🧪 Test Your Setup

### Test 1: Create Store
```bash
curl -X POST 'http://localhost:5678/webhook/gemini-rag-file-search' \
  -H 'Content-Type: application/json' \
  -d '{
    "operation": "Create Store",
    "displayName": "Test Store"
  }'
```

**Expected:** Status 200 + store name

### Test 2: List Stores
```bash
curl -X POST 'http://localhost:5678/webhook/gemini-rag-file-search' \
  -H 'Content-Type: application/json' \
  -d '{
    "operation": "List Store"
  }'
```

**Expected:** Array of stores

### Test 3: Upload File
```bash
curl -X POST 'http://localhost:5678/webhook/gemini-rag-file-search' \
  -F 'operation=Upload Store' \
  -F 'displayName=Test Store' \
  -F 'category=test' \
  -F 'tags=test,demo' \
  -F 'image=@test-file.pdf'
```

**Expected:** Document uploaded successfully

## 🎯 Common Use Cases

### Use Case 1: Upload Document with Metadata
```javascript
{
  "operation": "Upload Store",
  "displayName": "Company Docs",
  "category": "internal",
  "project": "Q1 2025",
  "tags": "[\"policy\", \"hr\", \"guidelines\"]",
  "priority": 1
}
```

### Use Case 2: Search Documents
```javascript
{
  "operation": "Search Store",
  "file_search_store_name": "corpora/abc123",
  "text_input": "What is the vacation policy?"
}
```

### Use Case 3: AI-Powered Q&A
```javascript
{
  "operation": "AI Agent",
  "text_input": "Summarize all documents about project management"
}
```

## ❓ Troubleshooting

### Problem: Webhook not responding
**Solution:**
1. Check workflow is active
2. Verify webhook URL
3. Check n8n logs: `docker logs n8n`

### Problem: Google Drive upload fails
**Solution:**
1. Check OAuth2 credentials
2. Verify folder permissions
3. Test folder ID in Google Drive UI

### Problem: MCP connection error
**Solution:**
1. Ping MCP endpoint
2. Check API credentials
3. Verify MCP server is running

## 📚 Next Steps

- [ ] Read full [README.md](README.md)
- [ ] Check [examples/webhook-examples.json](examples/webhook-examples.json)
- [ ] Review [SETUP.md](SETUP.md) for details
- [ ] Join n8n Community for support

## 🔗 Quick Links

- [Full Documentation](README.md)
- [API Examples](examples/webhook-examples.json)
- [Setup Guide](SETUP.md)
- [n8n Docs](https://docs.n8n.io/)

## 💡 Tips

1. **Start Simple:** Test with "List Store" first
2. **Use Postman:** Import examples for testing
3. **Check Logs:** n8n execution logs are helpful
4. **Test Incrementally:** One operation at a time

---

**Ready to go?** Start with creating your first store! 🚀
