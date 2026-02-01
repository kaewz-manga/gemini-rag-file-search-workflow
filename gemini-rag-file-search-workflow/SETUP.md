# Setup Guide - Gemini RAG File Search Workflow

คู่มือการติดตั้งและเตรียม workflow สำหรับ GitHub

## 📥 Export Workflow จาก n8n

### Step 1: Export Workflow
1. เปิด workflow ใน n8n
2. คลิกที่เมนู workflow (มุมขวาบน)
3. เลือก **Download**
4. บันทึกเป็น `workflow-original.json`

### Step 2: Sanitize Workflow
ใช้ Python script เพื่อลบข้อมูลส่วนตัว:

```bash
# ติดตั้ง Python (ถ้ายังไม่มี)
python3 --version

# Run sanitize script
python3 sanitize_workflow.py workflow-original.json workflow.json
```

Script จะแทนที่ข้อมูลต่อไปนี้:

| ข้อมูลจริง | Placeholder |
|-----------|-------------|
| `n8n-no1.missmanga.org` | `{{N8N_BASE_URL}}` |
| Google Drive Folder ID | `{{GOOGLE_DRIVE_FOLDER_ID}}` |
| Data Table Main ID | `{{DATA_TABLE_MAIN_ID}}` |
| Data Table Document ID | `{{DATA_TABLE_DOCUMENT_ID}}` |
| MCP Endpoint URL | `{{MCP_ENDPOINT_URL}}` |
| Webhook ID | `{{WEBHOOK_ID}}` |

### Step 3: ตรวจสอบไฟล์ที่ Sanitize แล้ว
```bash
# ตรวจสอบว่าไม่มีข้อมูลส่วนตัวหลงเหลือ
grep -r "missmanga" workflow.json
grep -r "@" workflow.json  # ตรวจสอบ email

# ถ้าพบข้อมูลส่วนตัว ให้แก้ไขใน sanitize_workflow.py แล้ว run ใหม่
```

## 🗂️ โครงสร้างไฟล์

Repository ควรมีไฟล์ต่อไปนี้:

```
gemini-rag-file-search-workflow/
├── README.md                    # Documentation หลัก
├── SETUP.md                     # คู่มือนี้
├── workflow.json                # Sanitized workflow
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── sanitize_workflow.py         # Script สำหรับ sanitize
├── docs/
│   ├── API.md                   # API documentation
│   ├── ARCHITECTURE.md          # Architecture overview
│   └── TROUBLESHOOTING.md       # Troubleshooting guide
└── examples/
    ├── webhook-examples.json    # ตัวอย่าง webhook requests
    └── mcp-responses.json       # ตัวอย่าง MCP responses
```

## 📝 สร้างเอกสารเพิ่มเติม

### API Documentation (docs/API.md)
```bash
cat > docs/API.md << 'EOF'
# API Documentation

## Webhook Endpoints

### POST /webhook/gemini-rag-file-search

... (รายละเอียด API)
EOF
```

### Architecture Overview (docs/ARCHITECTURE.md)
```bash
cat > docs/ARCHITECTURE.md << 'EOF'
# Architecture Overview

## System Components

1. **n8n Workflow Engine**
2. **MCP Server**
3. **Google Drive Storage**
4. **Gemini RAG System**
5. **Data Tables**

... (รายละเอียด architecture)
EOF
```

## 🔐 ข้อมูลที่ **ไม่ควร** Commit

ตรวจสอบว่าไฟล์เหล่านี้อยู่ใน `.gitignore`:

- `.env` - Environment variables จริง
- `workflow-original.json` - Workflow ที่มีข้อมูลส่วนตัว
- `*credentials*.json` - Credential files
- `*secret*.json` - Secret files
- `*api-key*.json` - API key files

## 📤 Push to GitHub

### Step 1: Initialize Git
```bash
cd gemini-rag-file-search-workflow

# Initialize git repository
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: Gemini RAG File Search workflow"
```

### Step 2: Create GitHub Repository
1. ไปที่ https://github.com/new
2. สร้าง repository ใหม่
   - **Repository name:** `gemini-rag-file-search-workflow`
   - **Description:** "n8n workflow for Gemini RAG File Search with MCP integration"
   - **Visibility:** Public หรือ Private ตามต้องการ
3. **ไม่ต้อง** initialize with README (เพราะเรามีแล้ว)

### Step 3: Push to GitHub
```bash
# เพิ่ม remote repository
git remote add origin https://github.com/YOUR_USERNAME/gemini-rag-file-search-workflow.git

# Push to main branch
git branch -M main
git push -u origin main
```

## ✅ Checklist ก่อน Push

- [ ] ลบข้อมูลส่วนตัวทั้งหมดออกจาก `workflow.json`
- [ ] ตรวจสอบไม่มี credentials หรือ API keys ในไฟล์
- [ ] ตรวจสอบไม่มี URLs ส่วนตัวหรือ IPs
- [ ] ตรวจสอบไม่มี email addresses
- [ ] ตรวจสอบ `.gitignore` ครบถ้วน
- [ ] README.md มีข้อมูลที่ชัดเจนและครบถ้วน
- [ ] .env.example มี placeholders ที่ถูกต้อง
- [ ] ทดสอบ import workflow ใน n8n instance ใหม่

## 🔄 Update Workflow

เมื่อมีการแก้ไข workflow:

```bash
# 1. Export workflow ใหม่จาก n8n
# 2. Sanitize ใหม่
python3 sanitize_workflow.py workflow-original.json workflow.json

# 3. Check changes
git diff workflow.json

# 4. Commit and push
git add workflow.json
git commit -m "Update: <describe changes>"
git push
```

## 🏷️ Versioning

ใช้ Git tags สำหรับ versioning:

```bash
# สร้าง version tag
git tag -a v1.0.0 -m "Version 1.0.0: Initial release"
git push origin v1.0.0

# สำหรับ updates
git tag -a v1.1.0 -m "Version 1.1.0: Added custom metadata support"
git push origin v1.1.0
```

## 📋 Release Checklist

สำหรับการ release version ใหม่:

- [ ] Update version ใน README.md
- [ ] Update CHANGELOG.md (ถ้ามี)
- [ ] Test workflow ใน clean n8n instance
- [ ] Update documentation
- [ ] Create release notes
- [ ] Tag version
- [ ] Create GitHub Release

## 🤝 Contributing Guidelines

ถ้าต้องการรับ contributions:

### สร้าง CONTRIBUTING.md
```bash
cat > CONTRIBUTING.md << 'EOF'
# Contributing Guidelines

## How to Contribute

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test in n8n
5. Sanitize workflow
6. Submit pull request

## Code Standards

- Use meaningful node names
- Add comments in Code nodes
- Test all operations
- Update documentation

## Pull Request Process

1. Update README if needed
2. Add examples if applicable
3. Ensure workflow imports successfully
4. Request review
EOF
```

## 📧 Support

หากมีปัญหาในการ setup:

1. ตรวจสอบ [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
2. เปิด GitHub Issue
3. ติดต่อผ่าน n8n Community

## 🔗 Resources

- [n8n Documentation](https://docs.n8n.io/)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Semantic Versioning](https://semver.org/)

---

**Note:** อย่าลืมตรวจสอบข้อมูลส่วนตัวทุกครั้งก่อน commit และ push!
