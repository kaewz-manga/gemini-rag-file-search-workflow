/**
 * Integration Test - Gemini RAG File Search (Real API)
 *
 * ใช้ Gemini API จริง ทดสอบทุก operation แบบ end-to-end
 *
 * Environment Variables:
 *   GEMINI_API_KEY  - Gemini API key (required)
 *   TEST_SCOPE      - "all" | "store-only" | "search-only" (default: "all")
 *
 * Usage:
 *   GEMINI_API_KEY=xxx node test-integration.js
 *   GEMINI_API_KEY=xxx TEST_SCOPE=store-only node test-integration.js
 */

const API_KEY = process.env.GEMINI_API_KEY;
const TEST_SCOPE = process.env.TEST_SCOPE || 'all';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  console.error('   Usage: GEMINI_API_KEY=xxx node test-integration.js');
  process.exit(1);
}

// ============================================
// Test State
// ============================================
const state = {
  corpusName: null,
  documentName: null,
  chunkNames: [],
};

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
  startTime: Date.now(),
};

// ============================================
// HTTP Helper
// ============================================
async function api(endpoint, options = {}) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${BASE_URL}/${endpoint}${separator}key=${API_KEY}`;

  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return { ok: response.ok, status: response.status, data };
}

// ============================================
// Test Runner
// ============================================
async function test(name, fn) {
  results.total++;
  const start = Date.now();

  try {
    await fn();
    const duration = Date.now() - start;
    results.passed++;
    results.tests.push({ name, status: 'passed', duration });
    console.log(`  ✅ ${name} (${duration}ms)`);
  } catch (err) {
    const duration = Date.now() - start;
    results.failed++;
    results.tests.push({ name, status: 'failed', duration, error: err.message });
    console.error(`  ❌ ${name} (${duration}ms)`);
    console.error(`     Error: ${err.message}`);
  }
}

function skip(name) {
  results.total++;
  results.skipped++;
  results.tests.push({ name, status: 'skipped' });
  console.log(`  ⏭️  ${name} (skipped)`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Test Suites
// ============================================

async function testStoreOperations() {
  console.log('\n📦 Store (Corpus) Operations');
  console.log('─'.repeat(50));

  // Create Store
  await test('Create Store', async () => {
    const { ok, data } = await api('corpora', {
      method: 'POST',
      body: JSON.stringify({ displayName: `Integration Test ${Date.now()}` }),
    });
    assert(ok, `Failed to create corpus: ${JSON.stringify(data)}`);
    assert(data.name, 'Corpus name is missing');
    assert(data.name.startsWith('corpora/'), `Invalid corpus name: ${data.name}`);
    state.corpusName = data.name;
  });

  // List Stores
  await test('List Stores', async () => {
    const { ok, data } = await api('corpora?pageSize=10', { method: 'GET' });
    assert(ok, `Failed to list corpora: ${JSON.stringify(data)}`);
    assert(Array.isArray(data.corpora), 'corpora should be an array');
    const found = data.corpora.find(c => c.name === state.corpusName);
    assert(found, `Created corpus not found in list`);
  });

  // Get Store
  await test('Get Store', async () => {
    const { ok, data } = await api(state.corpusName, { method: 'GET' });
    assert(ok, `Failed to get corpus: ${JSON.stringify(data)}`);
    assert(data.name === state.corpusName, 'Corpus name mismatch');
    assert(data.displayName, 'Display name is missing');
  });
}

async function testDocumentOperations() {
  console.log('\n📄 Document Operations');
  console.log('─'.repeat(50));

  // Create Document with metadata
  await test('Create Document with metadata', async () => {
    const { ok, data } = await api(`${state.corpusName}/documents`, {
      method: 'POST',
      body: JSON.stringify({
        displayName: 'Test Document',
        customMetadata: [
          { key: 'category', stringValue: 'test' },
          { key: 'project', stringValue: 'integration-test' },
          { key: 'priority', numericValue: 1 },
        ],
      }),
    });
    assert(ok, `Failed to create document: ${JSON.stringify(data)}`);
    assert(data.name, 'Document name is missing');
    state.documentName = data.name;
  });

  // List Documents
  await test('List Documents', async () => {
    const { ok, data } = await api(`${state.corpusName}/documents?pageSize=10`, { method: 'GET' });
    assert(ok, `Failed to list documents: ${JSON.stringify(data)}`);
    assert(Array.isArray(data.documents), 'documents should be an array');
    assert(data.documents.length > 0, 'Should have at least 1 document');
  });

  // Get Document
  await test('Get Document', async () => {
    const { ok, data } = await api(state.documentName, { method: 'GET' });
    assert(ok, `Failed to get document: ${JSON.stringify(data)}`);
    assert(data.name === state.documentName, 'Document name mismatch');
  });
}

async function testChunkOperations() {
  console.log('\n🧩 Chunk Operations');
  console.log('─'.repeat(50));

  // Create single chunk
  await test('Create single Chunk', async () => {
    const { ok, data } = await api(`${state.documentName}/chunks`, {
      method: 'POST',
      body: JSON.stringify({
        data: { stringValue: 'Cloudflare Workers เป็น serverless platform ที่รันโค้ดบน edge network ทำให้เว็บแอปพลิเคชันตอบสนองเร็วมาก รองรับ JavaScript, TypeScript, Python, Rust' },
      }),
    });
    assert(ok, `Failed to create chunk: ${JSON.stringify(data)}`);
    assert(data.name, 'Chunk name is missing');
    state.chunkNames.push(data.name);
  });

  // Batch create chunks
  await test('Batch Create Chunks', async () => {
    const { ok, data } = await api(`${state.documentName}/chunks:batchCreate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            chunk: {
              data: { stringValue: 'MCP (Model Context Protocol) คือโปรโตคอลที่ช่วยให้ AI models เชื่อมต่อกับ tools และ data sources ภายนอกได้ ถูกพัฒนาโดย Anthropic เพื่อให้ Claude สามารถใช้เครื่องมือต่างๆ ได้' },
            },
          },
          {
            chunk: {
              data: { stringValue: 'Gemini Semantic Retrieval API ใช้สำหรับ RAG (Retrieval-Augmented Generation) โดยเก็บข้อมูลในรูปแบบ Corpus > Document > Chunk แล้วค้นหาด้วย embedding-based semantic search' },
            },
          },
          {
            chunk: {
              data: { stringValue: 'การทำ RAG ช่วยให้ AI ตอบคำถามได้ถูกต้องมากขึ้น เพราะอ้างอิงจากเอกสารจริง ไม่ใช่จากความจำของ model เพียงอย่างเดียว ลด hallucination ได้อย่างมาก' },
            },
          },
        ],
      }),
    });
    assert(ok, `Failed to batch create chunks: ${JSON.stringify(data)}`);
    assert(Array.isArray(data.chunks), 'chunks should be an array');
    assert(data.chunks.length === 3, `Expected 3 chunks, got ${data.chunks.length}`);
    data.chunks.forEach(c => state.chunkNames.push(c.name));
  });

  // List Chunks
  await test('List Chunks', async () => {
    const { ok, data } = await api(`${state.documentName}/chunks?pageSize=10`, { method: 'GET' });
    assert(ok, `Failed to list chunks: ${JSON.stringify(data)}`);
    assert(Array.isArray(data.chunks), 'chunks should be an array');
    assert(data.chunks.length === 4, `Expected 4 chunks, got ${data.chunks.length}`);
  });

  // Get Chunk
  await test('Get Chunk', async () => {
    const chunkName = state.chunkNames[0];
    const { ok, data } = await api(chunkName, { method: 'GET' });
    assert(ok, `Failed to get chunk: ${JSON.stringify(data)}`);
    assert(data.name === chunkName, 'Chunk name mismatch');
    assert(data.data?.stringValue, 'Chunk data is missing');
  });

  // Wait for chunks to be indexed
  console.log('  ⏳ Waiting 10s for chunks to be indexed...');
  await sleep(10000);
}

async function testSearchOperations() {
  console.log('\n🔍 Search Operations');
  console.log('─'.repeat(50));

  // Semantic Search
  await test('Search Store (semantic search)', async () => {
    const { ok, data } = await api(`${state.corpusName}:query`, {
      method: 'POST',
      body: JSON.stringify({
        query: 'MCP คืออะไร ใครพัฒนา',
        resultsCount: 5,
      }),
    });
    assert(ok, `Failed to search: ${JSON.stringify(data)}`);
    assert(Array.isArray(data.relevantChunks), 'relevantChunks should be an array');
    assert(data.relevantChunks.length > 0, 'Should have at least 1 result');

    const topResult = data.relevantChunks[0];
    assert(topResult.chunkRelevanceScore > 0, 'Relevance score should be > 0');
    assert(topResult.chunk?.data?.stringValue, 'Chunk text is missing');
    console.log(`     Top result score: ${topResult.chunkRelevanceScore.toFixed(4)}`);
    console.log(`     Text preview: ${topResult.chunk.data.stringValue.substring(0, 80)}...`);
  });

  // Search with different query
  await test('Search Store (Thai natural language)', async () => {
    const { ok, data } = await api(`${state.corpusName}:query`, {
      method: 'POST',
      body: JSON.stringify({
        query: 'RAG ช่วยลด hallucination ได้อย่างไร',
        resultsCount: 3,
      }),
    });
    assert(ok, `Failed to search: ${JSON.stringify(data)}`);
    assert(data.relevantChunks?.length > 0, 'Should have results');
    console.log(`     Results: ${data.relevantChunks.length} chunks found`);
  });
}

async function testAIAgentOperations() {
  console.log('\n🤖 AI Agent Operations');
  console.log('─'.repeat(50));

  // Generate Answer with RAG
  await test('AI Agent (generate answer with RAG)', async () => {
    const { ok, data } = await api('models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'อธิบายว่า RAG คืออะไร และมีประโยชน์อย่างไร จากข้อมูลที่มี' }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        semanticRetriever: {
          source: state.corpusName,
          query: { parts: [{ text: 'RAG คืออะไร ประโยชน์' }] },
        },
      }),
    });
    assert(ok, `Failed to generate answer: ${JSON.stringify(data)}`);
    assert(data.candidates?.length > 0, 'Should have at least 1 candidate');

    const answer = data.candidates[0].content?.parts?.[0]?.text;
    assert(answer, 'Answer text is missing');
    assert(answer.length > 20, 'Answer should be substantive');
    console.log(`     Answer preview: ${answer.substring(0, 120)}...`);
    console.log(`     Tokens: ${data.usageMetadata?.totalTokenCount || 'N/A'}`);
  });

  // AI Agent with English query
  await test('AI Agent (English query)', async () => {
    const { ok, data } = await api('models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'What is Cloudflare Workers and what languages does it support?' }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
        semanticRetriever: {
          source: state.corpusName,
          query: { parts: [{ text: 'Cloudflare Workers languages' }] },
        },
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    assert(data.candidates?.[0]?.content?.parts?.[0]?.text, 'No answer');
    console.log(`     Answer preview: ${data.candidates[0].content.parts[0].text.substring(0, 120)}...`);
  });
}

async function testDeleteOperations() {
  console.log('\n🗑️  Cleanup Operations');
  console.log('─'.repeat(50));

  // Delete a single chunk
  if (state.chunkNames.length > 0) {
    await test('Delete Chunk', async () => {
      const chunkToDelete = state.chunkNames[0];
      const { ok, data } = await api(chunkToDelete, { method: 'DELETE' });
      assert(ok, `Failed to delete chunk: ${JSON.stringify(data)}`);
    });
  }

  // Delete document (force - has remaining chunks)
  if (state.documentName) {
    await test('Delete Document (force)', async () => {
      const { ok, data } = await api(`${state.documentName}?force=true`, { method: 'DELETE' });
      assert(ok, `Failed to delete document: ${JSON.stringify(data)}`);
    });
  }

  // Delete corpus
  if (state.corpusName) {
    await test('Delete Store (corpus)', async () => {
      const { ok, data } = await api(`${state.corpusName}?force=true`, { method: 'DELETE' });
      assert(ok, `Failed to delete corpus: ${JSON.stringify(data)}`);
    });
  }

  // Verify deletion
  if (state.corpusName) {
    await test('Verify Store deleted (should return 404)', async () => {
      const { ok, status } = await api(state.corpusName, { method: 'GET' });
      assert(!ok, 'Corpus should not exist');
      assert(status === 404 || status === 400, `Expected 404, got ${status}`);
    });
  }
}

// ============================================
// Main Runner
// ============================================
async function main() {
  console.log('🚀 Gemini RAG File Search - Integration Test');
  console.log('═'.repeat(50));
  console.log(`   Scope: ${TEST_SCOPE}`);
  console.log(`   API Key: ${API_KEY.substring(0, 8)}...${API_KEY.slice(-4)}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log('═'.repeat(50));

  try {
    // Verify API key works
    console.log('\n🔑 Verifying API Key...');
    const { ok, data } = await api('corpora?pageSize=1', { method: 'GET' });
    if (!ok) {
      console.error(`❌ API Key verification failed: ${JSON.stringify(data)}`);
      process.exit(1);
    }
    console.log('  ✅ API Key is valid\n');

    // Run test suites based on scope
    if (TEST_SCOPE === 'all' || TEST_SCOPE === 'store-only') {
      await testStoreOperations();
      await testDocumentOperations();
      await testChunkOperations();
    }

    if (TEST_SCOPE === 'all' || TEST_SCOPE === 'search-only') {
      if (!state.corpusName) {
        console.log('\n⚠️  Search tests require store-only tests to run first');
        console.log('   Run with TEST_SCOPE=all');
      } else {
        await testSearchOperations();
        await testAIAgentOperations();
      }
    }

    // Always cleanup
    if (state.corpusName) {
      await testDeleteOperations();
    }
  } catch (err) {
    console.error(`\n💥 Unexpected error: ${err.message}`);
    console.error(err.stack);

    // Emergency cleanup
    if (state.corpusName) {
      console.log('\n🧹 Emergency cleanup...');
      try {
        await api(`${state.corpusName}?force=true`, { method: 'DELETE' });
        console.log('  ✅ Cleaned up test corpus');
      } catch {
        console.error(`  ⚠️  Failed to cleanup: ${state.corpusName}`);
      }
    }
  }

  // ============================================
  // Results Summary
  // ============================================
  const duration = ((Date.now() - results.startTime) / 1000).toFixed(1);

  console.log('\n' + '═'.repeat(50));
  console.log('📊 Results Summary');
  console.log('─'.repeat(50));
  console.log(`   Total:   ${results.total}`);
  console.log(`   Passed:  ${results.passed} ✅`);
  console.log(`   Failed:  ${results.failed} ❌`);
  console.log(`   Skipped: ${results.skipped} ⏭️`);
  console.log(`   Time:    ${duration}s`);
  console.log('═'.repeat(50));

  // Save results to file (for GitHub Actions artifact)
  const fs = await import('fs');
  fs.writeFileSync('test-results.json', JSON.stringify({
    ...results,
    duration: parseFloat(duration),
    scope: TEST_SCOPE,
    timestamp: new Date().toISOString(),
  }, null, 2));

  if (results.failed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  }

  console.log('\n✅ All tests passed!');
}

main();
