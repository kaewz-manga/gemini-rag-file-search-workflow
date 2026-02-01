# Gemini RAG File Search MCP - n8n Workflow

Workflow สำหรับจัดการ Gemini File Search RAG ผ่าน MCP (Model Context Protocol) บน n8n

## 🎯 ความสามารถหลัก

### Operations ที่รองรับ:
1. **Create Store** - สร้าง file search store ใหม่
2. **Upload Store** - อัพโหลดไฟล์และเพิ่มเข้า store
3. **Import Store** - นำเข้าไฟล์ที่มีอยู่แล้วใน Google Drive พร้อม custom metadata
4. **Get Store** - ดึงข้อมูล store
5. **Get Document** - ดึงข้อมูล document
6. **List Store** - แสดงรายการ stores ทั้งหมด
7. **List Document** - แสดงรายการ documents ใน store
8. **Delete Store** - ลบ store
9. **Delete Document** - ลบ document
10. **Search Store** - ค้นหาใน store
11. **AI Agent** - ใช้ AI agent ในการค้นหาและตอบคำถาม

### Custom Metadata Support:
- **category** - หมวดหมู่ของไฟล์
- **project** - โปรเจคที่เกี่ยวข้อง
- **tags** - แท็กต่างๆ (รองรับ JSON array, comma-separated, newline-separated)
- **priority** - ระดับความสำคัญ (numeric)

## 🏗️ โครงสร้าง Workflow

```
Webhook → Build Metadata → Upload File → Merge → Get Rows → Get Document → Switch
                                                                              ↓
                                                          ┌──────────────────────────────┐
                                                          │ 11 Operation Branches         │
                                                          └──────────────────────────────┘
                                                                              ↓
                                                                    Respond to Webhook
```

### Main Components:
- **Webhook Trigger** - รับ POST requests
- **Build CustomMetadata** - แปลง tags และสร้าง metadata structure
- **Upload file** - อัพโหลดไฟล์ไปยัง Google Drive
- **Data Tables** - เก็บข้อมูล stores และ documents
- **MCP Client** - เชื่อมต่อกับ Gemini RAG MCP server
- **AI Agent** - Google Gemini model พร้อม MCP tools

## 📋 ข้อกำหนดเบื้องต้น

### n8n Setup:
- n8n instance (self-hosted หรือ cloud)
- n8n version ที่รองรับ:
  - MCP Client nodes (`@n8n/n8n-nodes-langchain.mcpClient`)
  - AI Agent nodes (`@n8n/n8n-nodes-langchain.agent`)
  - Data Table nodes

### External Services:
- Google Drive API access
- Gemini RAG MCP Server
- Google Gemini API key

### Required Credentials:
- Google Drive OAuth2
- Gemini API credentials (สำหรับ MCP server)

## ⚙️ การติดตั้ง

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd gemini-rag-file-search-workflow
```

### 2. ตั้งค่า Environment Variables
```bash
cp .env.example .env
# แก้ไขค่าใน .env file
```

### 3. Import Workflow ใน n8n

#### วิธีที่ 1: ผ่าน UI
1. เข้าไปที่ n8n instance ของคุณ
2. คลิก **Import from File**
3. เลือกไฟล์ `workflow.json`
4. แก้ไขค่า placeholders ตามที่กำหนดใน `.env`

#### วิธีที่ 2: ผ่าน API
```bash
curl -X POST "https://YOUR_N8N_URL/api/v1/workflows" \
  -H "X-N8N-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

### 4. สร้าง Data Tables

สร้าง 2 Data Tables ใน n8n:

#### Table 1: Gemini File RAG
Columns:
- `displayName` (string) - ชื่อ store
- `file_search_store_name` (string) - Gemini store name
- `activeDocumentsCount` (number) - จำนวน documents
- `sizeBytes` (number) - ขนาดรวม

#### Table 2: Gemini File RAG: Page Document
Columns:
- `file_name` (string) - ชื่อไฟล์
- `displayName` (string) - ชื่อแสดง
- `displayName_doc` (string) - ชื่อ document ใน RAG
- `upload_operation_name` (string) - Upload operation reference
- `operation_name` (string) - Import operation reference
- `file_search_store_name` (string) - Store ที่เกี่ยวข้อง
- `documentName` (string) - Document name ใน Gemini
- `mimeType` (string) - ประเภทไฟล์
- `sizeBytes` (string) - ขนาดไฟล์
- `state` (string) - สถานะ document
- `nextPageToken` (string) - Pagination token

### 5. ตั้งค่า Credentials

ใน n8n, ตั้งค่า credentials ต่อไปนี้:
- **Google Drive OAuth2** - สำหรับ Upload file node
- **Gemini API** - สำหรับ AI Agent และ MCP server

### 6. Update Configuration

แก้ไข nodes ต่อไปนี้ให้ตรงกับ environment ของคุณ:

#### Upload file node:
```javascript
{
  "folderId": "YOUR_GOOGLE_DRIVE_FOLDER_ID"
}
```

#### Get row(s) node:
```javascript
{
  "dataTableId": "YOUR_DATA_TABLE_ID_1"
}
```

#### MCP Client nodes:
```javascript
{
  "endpointUrl": "YOUR_MCP_ENDPOINT_URL"
}
```

## 🔌 Webhook API

### Endpoint
```
POST /webhook/gemini-rag-file-search
```

### Request Body Examples

#### 1. Create Store
```json
{
  "operation": "Create Store",
  "displayName": "My Knowledge Base"
}
```

#### 2. Upload Store (with file)
```json
{
  "operation": "Upload Store",
  "displayName": "My Store",
  "file_name": "document.pdf",
  "category": "research",
  "project": "AI Project",
  "tags": "[\"AI\", \"RAG\", \"Gemini\"]",
  "priority": 1
}
```

#### 3. Import Store (with Custom Metadata)
```json
{
  "operation": "Import Store",
  "displayName": "My Store",
  "file_name": "existing-file.pdf",
  "category": "documentation",
  "project": "Project X",
  "tags": "AI, Machine Learning, NLP",
  "priority": 2
}
```

#### 4. Search Store
```json
{
  "operation": "Search Store",
  "file_search_store_name": "corpora/abc123",
  "text_input": "What is RAG?"
}
```

#### 5. AI Agent
```json
{
  "operation": "AI Agent",
  "text_input": "Explain the concept of retrieval augmented generation"
}
```

#### 6. List Store
```json
{
  "operation": "List Store"
}
```

#### 7. Delete Document
```json
{
  "operation": "Delete Document",
  "file_name": "document-to-delete.pdf"
}
```

### Tags Format Support

Workflow รองรับ 3 รูปแบบของ tags:

1. **JSON Array:**
```json
{
  "tags": "[\"AI\", \"RAG\", \"Gemini\"]"
}
```

2. **Comma-separated:**
```json
{
  "tags": "AI, RAG, Gemini"
}
```

3. **Newline-separated:**
```json
{
  "tags": "AI\nRAG\nGemini"
}
```

## 🔧 การใช้งาน MCP Server

Workflow นี้ต้องการ Gemini RAG MCP Server ที่รองรับ operations ต่อไปนี้:

### Required MCP Tools:
- `Create_Store` - สร้าง store
- `Upload_Store` - อัพโหลดและเพิ่มไฟล์
- `Import_Store` - นำเข้าไฟล์ (basic)
- `Import_Store_K` - นำเข้าไฟล์พร้อม customMetadata
- `Get_Store` - ดึงข้อมูล store
- `Delete_Store` - ลบ store
- `Get_Document` - ดึงข้อมูล document
- `Delete_Document` - ลบ document
- `Document_Page` - List documents ใน store
- `Store_Page` - List stores
- `Search_Store` - ค้นหาใน store

## 📊 Data Flow

### Upload & Import Flow:
```
Webhook → Build Metadata → Upload to GDrive → Merge Data → 
Get Store Info → Switch Operation → MCP Upload/Import → 
Get Document Info → Update Data Tables → Respond
```

### Search Flow:
```
Webhook → Get Store Info → MCP Search → Respond
```

### AI Agent Flow:
```
Webhook → AI Agent (with MCP Tool) → Search Store → Respond
```

## 🎨 Customization

### เพิ่ม Metadata Fields ใหม่

แก้ไข **Build CustomMetadata** node:
```javascript
// เพิ่มฟิลด์ใหม่
if (webhookData.department) {
  customMetadata.push({ 
    key: 'department', 
    stringValue: webhookData.department 
  });
}
```

### เปลี่ยน Error Handling

Nodes ส่วนใหญ่ใช้ `onError: "continueRegularOutput"` 
หากต้องการ stop on error:
```json
{
  "onError": "stopWorkflow"
}
```

## 🐛 Troubleshooting

### ปัญหาที่พบบ่อย:

#### 1. MCP Connection Failed
- ตรวจสอบ MCP endpoint URL
- ตรวจสอบ API credentials
- ตรวจสอบ network connectivity

#### 2. Data Table Not Found
- ตรวจสอบ Data Table IDs
- สร้าง Data Tables ตามที่กำหนด

#### 3. Google Drive Upload Failed
- ตรวจสอบ OAuth2 credentials
- ตรวจสอบ folder permissions
- ตรวจสอบ folder ID

#### 4. Metadata Parsing Error
- ตรวจสอบรูปแบบของ tags
- ดูที่ Build CustomMetadata node execution log

## 📝 License

MIT License - แก้ไขและใช้ได้ตามต้องการ

## 🤝 Contributing

Pull requests are welcome! 

### Development Setup:
1. Fork repository
2. สร้าง feature branch
3. Test workflow ใน n8n development instance
4. Export workflow เป็น JSON (ลบข้อมูลส่วนตัว)
5. Submit pull request

## 📧 Support

หากมีปัญหาหรือคำถาม กรุณา:
- เปิด GitHub Issue
- ตรวจสอบ [n8n Community](https://community.n8n.io/)
- อ่าน [MCP Documentation](https://modelcontextprotocol.io/)

## 🔗 Links

- [n8n Documentation](https://docs.n8n.io/)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

**Note:** Workflow นี้ออกแบบสำหรับ n8n self-hosted instance พร้อม MCP support และ Google Drive integration
