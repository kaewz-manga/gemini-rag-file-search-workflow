# Testing Guide

> Test patterns for gemini-rag-mcp.

---

## Test Framework

- **Vitest** — Test runner

---

## Run Tests

```bash
npm test                    # All tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage
```

---

## Testing MCP Tools

```typescript
describe('MCP Tools', () => {
  it('should search store', async () => {
    const response = await callMcpTool('gemini_search_store', {
      corpus_name: 'test-corpus',
      query: 'search terms'
    });

    expect(response.results).toBeDefined();
  });

  it('should generate answer with citations', async () => {
    const response = await callMcpTool('gemini_ai_agent', {
      corpus_name: 'test-corpus',
      question: 'What is the main topic?'
    });

    expect(response.answer).toBeDefined();
    expect(response.citations).toBeDefined();
  });
});
```
