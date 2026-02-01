# Contributing to Gemini RAG File Search Workflow

ขอบคุณที่สนใจ contribute! 🎉

## 🤝 How to Contribute

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/gemini-rag-file-search-workflow.git
cd gemini-rag-file-search-workflow
```

### 2. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
# หรือ
git checkout -b fix/bug-description
```

### 3. Make Changes

#### For Workflow Changes:
1. แก้ไข workflow ใน n8n
2. Test ทุก operation
3. Export workflow
4. Sanitize:
```bash
python3 sanitize_workflow.py workflow-original.json workflow.json
```

#### For Documentation:
- แก้ไข README.md, SETUP.md, etc.
- ตรวจสอบ spelling และ grammar
- ให้ตัวอย่างที่ชัดเจน

### 4. Test Your Changes

#### Workflow Testing Checklist:
- [ ] Import workflow ใน clean n8n instance
- [ ] Test ทุก operation (11 operations)
- [ ] Verify error handling
- [ ] Check data table updates
- [ ] Test with different input formats

#### Documentation Testing:
- [ ] ตรวจสอบ links ทั้งหมด
- [ ] Verify code examples work
- [ ] Check markdown formatting

### 5. Commit Changes

```bash
# Stage changes
git add .

# Commit with meaningful message
git commit -m "feat: add support for batch operations"
# หรือ
git commit -m "fix: resolve Google Drive upload timeout"
# หรือ
git commit -m "docs: update API examples"
```

#### Commit Message Format:
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: Feature ใหม่
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add pagination support for list operations

- Implement nextPageToken handling
- Add page size configuration
- Update documentation

Closes #123
```

### 6. Push & Create PR
```bash
git push origin feature/your-feature-name
```

Then create Pull Request on GitHub:
1. ไปที่ repository บน GitHub
2. Click "New Pull Request"
3. เลือก your branch
4. กรอก PR template

## 📋 Pull Request Guidelines

### PR Title Format:
```
[TYPE] Short description
```

**Examples:**
- `[FEAT] Add custom metadata validation`
- `[FIX] Resolve webhook timeout issue`
- `[DOCS] Update setup instructions`

### PR Description Template:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other (describe)

## Testing
- [ ] Tested in clean n8n instance
- [ ] All operations working
- [ ] Error handling verified
- [ ] Documentation updated

## Screenshots (if applicable)
[Add screenshots]

## Related Issues
Closes #XX
```

## 🎨 Code Standards

### Workflow Nodes:
1. **Meaningful Names:**
   ```
   ✅ "Build CustomMetadata"
   ❌ "Code1"
   ```

2. **Comments in Code Nodes:**
   ```javascript
   // Parse tags from textarea (supports multiple formats)
   function parseTags(input) {
     // Implementation
   }
   ```

3. **Error Handling:**
   ```json
   {
     "alwaysOutputData": true,
     "onError": "continueErrorOutput"
   }
   ```

4. **Sticky Notes:**
   - ใช้ Sticky Notes เพื่ออธิบาย sections
   - Color-code by function:
     - Blue: CRUD operations
     - Yellow: Processing/Logic
     - Red: Error handling

### Documentation:
1. **Clear Examples:**
   ```javascript
   // ✅ Good
   {
     "operation": "Create Store",
     "displayName": "My Knowledge Base"
   }
   
   // ❌ Bad (no context)
   {
     "op": "create",
     "name": "test"
   }
   ```

2. **Thai + English:**
   - เขียนคำอธิบายเป็นไทยได้
   - ใช้ English สำหรับ technical terms
   - Provide English translation for key docs

3. **Code Blocks:**
   - ใช้ syntax highlighting
   - ใส่ comments
   - Show expected output

## 🐛 Reporting Bugs

### Before Reporting:
- [ ] Search existing issues
- [ ] Test in clean n8n instance
- [ ] Collect error logs

### Bug Report Template:
```markdown
**Describe the Bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Screenshots**
[If applicable]

**Environment:**
- n8n version:
- Node.js version:
- OS:
- Browser (if relevant):

**Additional Context**
Any other information
```

## 💡 Feature Requests

### Feature Request Template:
```markdown
**Is your feature request related to a problem?**
Description of the problem

**Describe the solution you'd like**
Clear description of what you want

**Describe alternatives you've considered**
Other approaches you've thought about

**Additional context**
Screenshots, examples, etc.
```

## 🧪 Testing Guidelines

### Test Checklist:
- [ ] All 11 operations work correctly
- [ ] Error handling functions properly
- [ ] Data tables update correctly
- [ ] Webhook responds appropriately
- [ ] MCP tools execute successfully
- [ ] AI Agent functions as expected

### Test Data:
- Use realistic but sanitized data
- Test edge cases:
  - Empty inputs
  - Very long inputs
  - Special characters
  - Invalid formats

### Test Script Example:
```bash
#!/bin/bash

# Test all operations
operations=("Create Store" "List Store" "Upload Store" "Search Store")

for op in "${operations[@]}"; do
  echo "Testing: $op"
  curl -X POST 'http://localhost:5678/webhook-test/gemini-rag-file-search' \
    -H 'Content-Type: application/json' \
    -d "{\"operation\": \"$op\"}"
  echo ""
done
```

## 📝 Documentation Guidelines

### README Updates:
- Keep examples current
- Update version numbers
- Test all code examples
- Check all links

### New Sections:
1. Add to table of contents
2. Use consistent formatting
3. Include examples
4. Cross-reference related sections

### API Documentation:
- Document all parameters
- Show request/response examples
- Note required vs optional fields
- Include error responses

## 🏷️ Release Process

### Version Numbering:
Follow [Semantic Versioning](https://semver.org/):
- MAJOR.MINOR.PATCH
- Example: 1.2.3

**When to bump:**
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Release Checklist:
- [ ] Update version in README
- [ ] Update CHANGELOG
- [ ] Test all operations
- [ ] Create git tag
- [ ] Create GitHub release
- [ ] Update documentation

### Release Notes Format:
```markdown
## [1.2.0] - 2025-01-15

### Added
- New batch operation support
- Custom validation rules

### Changed
- Improved error messages
- Updated dependencies

### Fixed
- Webhook timeout issue
- Data table sync bug
```

## 🎓 Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community](https://community.n8n.io/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## ❓ Questions?

- Open a GitHub Discussion
- Join n8n Community
- Check existing Issues/PRs

## 📧 Code of Conduct

### Our Pledge:
- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior:
- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other unprofessional conduct

## 🙏 Thank You!

Every contribution makes this project better. Whether it's:
- Reporting a bug
- Suggesting a feature
- Improving documentation
- Submitting code

**We appreciate your help!** ❤️

---

**Questions about contributing?** Open an issue with the `question` label.
