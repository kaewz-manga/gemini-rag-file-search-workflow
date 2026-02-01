#!/usr/bin/env node

/**
 * Integration Tests for Gemini File Search API
 * Tests real API calls against fileSearchStores endpoints
 *
 * Usage:
 *   GEMINI_API_KEY=xxx node test-integration.js
 *   GEMINI_API_KEY=xxx TEST_SCOPE=store-only node test-integration.js
 *
 * Test Scopes:
 *   all          - Run all tests (default)
 *   store-only   - Only store CRUD operations
 *   upload-only  - Store + upload + documents
 *   search-only  - Store + upload + search
 */

const API_KEY = process.env.GEMINI_API_KEY;
const TEST_SCOPE = process.env.TEST_SCOPE || 'all';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// ============================================
// Test State
// ============================================
const state = {
  storeName: null,      // fileSearchStores/{id}
  documentName: null,   // fileSearchStores/{id}/documents/{doc_id}
  fileName: null,       // files/{file_id}
};

const results = { passed: 0, failed: 0, skipped: 0 };

// ============================================
// Helpers
// ============================================
async function test(name, fn) {
  try {
    await fn();
    results.passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    results.failed++;
    console.log(`  [FAIL] ${name}`);
    console.log(`         ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function api(endpoint, options = {}) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${BASE_URL}/${endpoint}${separator}key=${API_KEY}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    console.log(`     [API ${response.status}] ${options.method || 'GET'} ${endpoint}`);
    if (text) console.log(`     [Response] ${text.substring(0, 500)}`);
  }

  return { ok: response.ok, status: response.status, data };
}

async function uploadApi(endpoint, body, contentType) {
  const url = `https://generativelanguage.googleapis.com/upload/v1beta/${endpoint}?key=${API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    console.log(`     [UPLOAD ${response.status}] ${endpoint}`);
    if (text) console.log(`     [Response] ${text.substring(0, 500)}`);
  }

  return { ok: response.ok, status: response.status, data };
}

// ============================================
// Test Suite 1: Store (FileSearchStore) CRUD
// ============================================
async function testStoreOperations() {
  console.log('\n== FileSearchStore Operations ==');
  console.log('-'.repeat(50));

  await test('Create FileSearchStore', async () => {
    const { ok, data } = await api('fileSearchStores', {
      method: 'POST',
      body: JSON.stringify({
        displayName: `Integration Test Store ${Date.now()}`,
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    assert(data.name, 'No store name returned');
    assert(data.name.startsWith('fileSearchStores/'), 'Invalid store name format');
    state.storeName = data.name;
    console.log(`     Created: ${state.storeName}`);
  });

  await test('Get FileSearchStore', async () => {
    const { ok, data } = await api(state.storeName);
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    assert(data.name === state.storeName, 'Store name mismatch');
    console.log(`     Name: ${data.name}, Display: ${data.displayName}`);
  });

  await test('List FileSearchStores', async () => {
    const { ok, data } = await api('fileSearchStores?pageSize=20');
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    const stores = data.fileSearchStores || [];
    assert(stores.length > 0, 'No stores found');
    const found = stores.find(s => s.name === state.storeName);
    assert(found, 'Created store not found in list');
    console.log(`     Found ${stores.length} store(s)`);
  });
}

// ============================================
// Test Suite 2: Upload Text Content
// ============================================
async function testUploadOperations() {
  console.log('\n== Upload Operations ==');
  console.log('-'.repeat(50));

  const sampleText = `
# SmartHome Hub Pro - คู่มือการใช้งาน

## การติดตั้ง
1. เสียบปลั๊กไฟ Hub Pro เข้ากับเต้าเสียบ
2. เปิดแอป SmartHome บนมือถือ
3. กด "เพิ่มอุปกรณ์ใหม่" แล้วเลือก "Hub Pro"
4. รอจน LED เป็นสีเขียว แสดงว่าเชื่อมต่อสำเร็จ

## โปรโตคอลที่รองรับ
- WiFi 6 (802.11ax)
- Zigbee 3.0
- Bluetooth 5.0
- Matter/Thread

## การแก้ปัญหา WiFi
หาก Hub เชื่อมต่อ WiFi ไม่ได้:
1. ตรวจสอบว่า router ทำงานปกติ
2. ย้าย Hub ให้อยู่ใกล้ router มากขึ้น
3. รีสตาร์ท Hub โดยถอดปลั๊กรอ 10 วินาที
4. ลอง reset WiFi ในแอป SmartHome

## นโยบายการคืนสินค้า
- คืนได้ภายใน 30 วันหลังซื้อ
- สินค้าต้องอยู่ในสภาพสมบูรณ์
- ต้องมีใบเสร็จรับเงิน
- สินค้าที่เปิดใช้แล้ว คืนได้เฉพาะกรณีชำรุดเท่านั้น
`.trim();

  await test('Upload text to FileSearchStore (multipart)', async () => {
    const boundary = '---BOUNDARY---';
    const metadata = JSON.stringify({
      displayName: 'SmartHome Hub Pro Manual',
      customMetadata: [
        { key: 'category', stringValue: 'manual' },
        { key: 'language', stringValue: 'thai' },
      ],
    });

    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      'Content-Type: text/plain',
      '',
      sampleText,
      `--${boundary}--`,
    ].join('\r\n');

    const { ok, data } = await uploadApi(
      `${state.storeName}:upload`,
      body,
      `multipart/related; boundary=${boundary}`
    );
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    console.log(`     Upload response: ${JSON.stringify(data).substring(0, 200)}`);

    // If it returns an operation, poll it
    if (data.name && !data.done) {
      console.log(`     Polling operation: ${data.name}`);
      let op = data;
      for (let i = 0; i < 30; i++) {
        await sleep(2000);
        const pollResult = await api(op.name);
        if (pollResult.ok && pollResult.data.done) {
          console.log(`     Operation completed after ${(i + 1) * 2}s`);
          break;
        }
        if (i === 29) {
          console.log(`     Warning: operation not done after 60s`);
        }
      }
    }
  });

  // Wait for indexing
  console.log('  [INFO] Waiting 10s for document indexing...');
  await sleep(10000);

  await test('List documents in store', async () => {
    const { ok, data } = await api(`${state.storeName}/documents?pageSize=20`);
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    const docs = data.documents || [];
    console.log(`     Found ${docs.length} document(s)`);
    if (docs.length > 0) {
      state.documentName = docs[0].name;
      console.log(`     First doc: ${docs[0].name} (${docs[0].displayName || 'unnamed'})`);
    }
  });

  if (state.documentName) {
    await test('Get document details', async () => {
      const { ok, data } = await api(state.documentName);
      assert(ok, `Failed: ${JSON.stringify(data)}`);
      assert(data.name === state.documentName, 'Document name mismatch');
      console.log(`     Document: ${data.name}`);
      if (data.customMetadata) {
        console.log(`     Metadata: ${JSON.stringify(data.customMetadata)}`);
      }
    });
  }
}

// ============================================
// Test Suite 3: Search (generateContent + file_search)
// ============================================
async function testSearchOperations() {
  console.log('\n== Search Operations (generateContent + file_search) ==');
  console.log('-'.repeat(50));

  await test('Search: Installation question (Thai)', async () => {
    const { ok, data } = await api('models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'อธิบายขั้นตอนการติดตั้ง SmartHome Hub Pro ตั้งแต่ต้นจนจบ' }],
        }],
        tools: [{
          fileSearch: {
            fileSearchStoreNames: [state.storeName],
          },
        }],
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    assert(answer, 'No answer generated');
    assert(answer.length > 20, 'Answer too short');
    console.log(`     Answer (${answer.length} chars): ${answer.substring(0, 200)}...`);

    const grounding = data.candidates?.[0]?.groundingMetadata;
    if (grounding?.groundingChunks) {
      console.log(`     Grounding chunks: ${grounding.groundingChunks.length}`);
    }
  });

  await test('Search: Return policy question', async () => {
    const { ok, data } = await api('models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'ซื้อสินค้าไปแล้ว 20 วัน อยากคืน ทำได้ไหม มีเงื่อนไขอะไรบ้าง' }],
        }],
        tools: [{
          fileSearch: {
            fileSearchStoreNames: [state.storeName],
          },
        }],
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    assert(answer, 'No answer generated');
    console.log(`     Answer: ${answer.substring(0, 200)}...`);
  });

  await test('Search: English query on Thai docs', async () => {
    const { ok, data } = await api('models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'What smart home protocols does the Hub Pro support?' }],
        }],
        tools: [{
          fileSearch: {
            fileSearchStoreNames: [state.storeName],
          },
        }],
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    assert(answer, 'No answer generated');
    console.log(`     Answer: ${answer.substring(0, 200)}...`);
  });

  await test('Search: WiFi troubleshooting', async () => {
    const { ok, data } = await api('models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'Hub เชื่อมต่อ WiFi ไม่ได้ ต้องทำอย่างไร' }],
        }],
        tools: [{
          fileSearch: {
            fileSearchStoreNames: [state.storeName],
          },
        }],
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    assert(answer, 'No answer generated');
    console.log(`     Answer: ${answer.substring(0, 200)}...`);
  });

  await test('Search: With topK parameter', async () => {
    const { ok, data } = await api('models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'สรุปคู่มือทั้งหมด' }],
        }],
        tools: [{
          fileSearch: {
            fileSearchStoreNames: [state.storeName],
            topK: 3,
          },
        }],
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    assert(answer, 'No answer generated');
    console.log(`     Answer: ${answer.substring(0, 200)}...`);
  });
}

// ============================================
// Test Suite 4: Document Management + Cleanup
// ============================================
async function testDocumentManagement() {
  console.log('\n== Document Management + Cleanup ==');
  console.log('-'.repeat(50));

  if (state.documentName) {
    await test('Delete document (force=true)', async () => {
      const { ok, data } = await api(`${state.documentName}?force=true`, {
        method: 'DELETE',
      });
      assert(ok, `Failed: ${JSON.stringify(data)}`);
      console.log(`     Deleted: ${state.documentName}`);
    });
  }

  await test('Delete FileSearchStore (force=true)', async () => {
    const { ok, data } = await api(`${state.storeName}?force=true`, {
      method: 'DELETE',
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    console.log(`     Deleted: ${state.storeName}`);
  });

  await test('Verify store deleted', async () => {
    const { ok, status } = await api(state.storeName);
    assert(!ok, 'Store should be deleted');
    assert(status === 404, `Expected 404, got ${status}`);
    console.log(`     Store correctly returns 404`);
  });
}

// ============================================
// Main Runner
// ============================================
async function main() {
  console.log('='.repeat(60));
  console.log('Gemini File Search API - Integration Tests');
  console.log('='.repeat(60));
  console.log(`Scope: ${TEST_SCOPE}`);
  console.log(`API: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);

  try {
    // Always run store tests
    await testStoreOperations();

    if (TEST_SCOPE === 'store-only') {
      // Cleanup store
      if (state.storeName) {
        console.log('\n  [INFO] Cleaning up store...');
        await api(`${state.storeName}?force=true`, { method: 'DELETE' });
      }
    } else {
      // Upload operations
      await testUploadOperations();

      if (TEST_SCOPE !== 'upload-only') {
        // Search operations
        await testSearchOperations();
      }

      // Document management + cleanup
      await testDocumentManagement();
    }
  } catch (err) {
    console.error(`\n[FATAL] ${err.message}`);
    results.failed++;

    // Try cleanup
    if (state.storeName) {
      console.log('\n  [INFO] Attempting cleanup...');
      try {
        await api(`${state.storeName}?force=true`, { method: 'DELETE' });
        console.log(`  [INFO] Cleanup done: ${state.storeName}`);
      } catch {
        console.log('  [WARN] Cleanup failed');
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${results.passed} passed, ${results.failed} failed`);
  console.log('='.repeat(60));

  if (results.failed > 0) {
    console.log('\nSome tests failed!');
    process.exit(1);
  }

  console.log('\nAll tests passed!');
}

main();
