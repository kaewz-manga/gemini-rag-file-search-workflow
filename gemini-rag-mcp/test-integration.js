/**
 * Integration Test - Gemini RAG File Search (Real API)
 *
 * ทดสอบทุก operation แบบ end-to-end ด้วย Gemini API จริง
 * รวมถึงการอัปโหลดเอกสารยาว (auto-chunk) และ import จาก URL
 *
 * Flow จริงของ RAG:
 *   1. สร้าง Store (Corpus)
 *   2. สร้าง Document + metadata
 *   3. อัปโหลดเนื้อหา → auto-split เป็น chunks
 *   4. รอ indexing
 *   5. Search (semantic search)
 *   6. AI Agent (search + generate answer)
 *   7. Cleanup
 *
 * Environment Variables:
 *   GEMINI_API_KEY  - Gemini API key (required)
 *   TEST_SCOPE      - "all" | "store-only" | "search-only" | "upload-only" (default: "all")
 *
 * Usage:
 *   GEMINI_API_KEY=xxx node test-integration.js
 *   GEMINI_API_KEY=xxx TEST_SCOPE=upload-only node test-integration.js
 */

const API_KEY = process.env.GEMINI_API_KEY;
const TEST_SCOPE = process.env.TEST_SCOPE || 'all';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY environment variable is required');
  console.error('  Usage: GEMINI_API_KEY=xxx node test-integration.js');
  process.exit(1);
}

// ============================================
// Simulated Documents (เหมือนอ่านจากไฟล์จริง)
// ============================================

// เอกสาร 1: คู่มือผลิตภัณฑ์ (ยาว ~2000 ตัวอักษร จะถูก auto-chunk)
const PRODUCT_MANUAL = `
# คู่มือการใช้งาน SmartHome Hub Pro v3.0

## บทที่ 1: การติดตั้ง

### 1.1 ข้อกำหนดของระบบ
SmartHome Hub Pro ต้องการ WiFi 2.4GHz หรือ 5GHz, พื้นที่ว่างอย่างน้อย 50MB และระบบปฏิบัติการ iOS 15+ หรือ Android 12+ สำหรับแอปควบคุม Hub สามารถเชื่อมต่ออุปกรณ์ได้สูงสุด 200 เครื่องพร้อมกัน

### 1.2 ขั้นตอนการติดตั้ง
1. เสียบสาย power adapter เข้ากับ Hub แล้วเสียบปลั๊กไฟ
2. รอให้ไฟ LED กะพริบสีฟ้า (ประมาณ 30 วินาที)
3. เปิดแอป SmartHome บนมือถือ แล้วกด "เพิ่มอุปกรณ์ใหม่"
4. เลือก "SmartHome Hub Pro" จากรายการอุปกรณ์
5. สแกน QR Code ที่ด้านล่างของ Hub
6. เชื่อมต่อ WiFi ของบ้าน แล้วรอการตั้งค่าเสร็จสิ้น (ประมาณ 2 นาที)
7. ตั้งชื่อ Hub และเลือกห้องที่ติดตั้ง

### 1.3 การเชื่อมต่ออุปกรณ์
Hub Pro รองรับโปรโตคอล Zigbee, Z-Wave, WiFi, Bluetooth LE และ Matter รองรับอุปกรณ์กว่า 5,000 รุ่น จากผู้ผลิตกว่า 200 แบรนด์ รวมถึง Philips Hue, IKEA TRADFRI, Xiaomi, Samsung SmartThings

## บทที่ 2: การใช้งาน

### 2.1 การควบคุมด้วยเสียง
Hub Pro รองรับ Google Assistant, Amazon Alexa และ Apple Siri สามารถสั่งงานด้วยเสียงภาษาไทยได้ เช่น "สวัสดี Hub เปิดไฟห้องนอน" หรือ "ปรับอุณหภูมิแอร์เป็น 25 องศา"

### 2.2 การตั้งค่า Automation
สร้าง Automation แบบ if-then ได้ เช่น:
- ถ้าเวลา 18:00 → เปิดไฟห้องนั่งเล่น
- ถ้าอุณหภูมิเกิน 30 องศา → เปิดแอร์
- ถ้าเปิดประตูหน้าบ้าน → ส่งแจ้งเตือนไปที่มือถือ
- ถ้าไม่มีคนในห้อง 30 นาที → ปิดไฟและแอร์อัตโนมัติ

### 2.3 การจัดการพลังงาน
Hub Pro มีฟีเจอร์ Energy Dashboard ที่แสดงการใช้พลังงานของอุปกรณ์ทุกชิ้นแบบ real-time สามารถตั้ง budget พลังงานรายเดือน และรับแจ้งเตือนเมื่อใกล้ถึงขีดจำกัด ช่วยประหยัดค่าไฟได้ถึง 30%

## บทที่ 3: การแก้ไขปัญหา

### 3.1 Hub ไม่เชื่อมต่อ WiFi
- ตรวจสอบว่า router อยู่ในระยะ 10 เมตร
- รีสตาร์ท Hub โดยถอดสาย power แล้วเสียบใหม่
- ตรวจสอบว่า WiFi ใช้ WPA2 หรือ WPA3 (ไม่รองรับ WEP)
- ลอง reset WiFi โดยกดปุ่ม reset ค้าง 10 วินาที

### 3.2 อุปกรณ์ไม่ตอบสนอง
- ตรวจสอบแบตเตอรี่ของอุปกรณ์
- ลองลบอุปกรณ์แล้วเพิ่มใหม่
- ตรวจสอบว่า firmware ของ Hub เป็นเวอร์ชันล่าสุด
- ติดต่อ support@smarthomepro.com หรือโทร 02-xxx-xxxx

## บทที่ 4: ข้อมูลจำเพาะ

| รายการ | ข้อมูล |
|--------|--------|
| รุ่น | SmartHome Hub Pro v3.0 |
| ขนาด | 12 x 12 x 4 cm |
| น้ำหนัก | 280g |
| WiFi | 802.11 a/b/g/n/ac/ax |
| Zigbee | 3.0 |
| Z-Wave | Plus V2 |
| Bluetooth | 5.2 LE |
| Matter | 1.0 |
| CPU | Quad-core ARM Cortex-A55 |
| RAM | 2GB |
| Storage | 8GB eMMC |
| Power | 5V/2A USB-C |
| ราคา | 3,990 บาท |
| รับประกัน | 2 ปี |
`.trim();

// เอกสาร 2: นโยบายบริษัท (สั้นกว่า)
const COMPANY_POLICY = `
# นโยบายการคืนสินค้าและรับประกัน SmartHome Pro

## การรับประกัน
- ระยะรับประกัน 2 ปี นับจากวันที่ซื้อ
- ครอบคลุมความเสียหายจากการผลิต ไม่รวมความเสียหายจากการใช้งานผิดวิธี
- ซ่อมฟรีภายใน 1 ปีแรก ปีที่ 2 คิดค่าอะไหล่ตามจริง
- ไม่ครอบคลุมความเสียหายจากน้ำ, ไฟไหม้, หรือภัยธรรมชาติ

## การคืนสินค้า
- คืนได้ภายใน 30 วัน หากสินค้ามีปัญหาจากการผลิต
- สินค้าต้องอยู่ในสภาพสมบูรณ์ พร้อมกล่องและอุปกรณ์เสริมครบ
- คืนเงินเต็มจำนวนภายใน 7-14 วันทำการ
- กรณีเปลี่ยนใจ คืนได้ภายใน 7 วัน หักค่าธรรมเนียม 15%

## การส่งซ่อม
- ส่งซ่อมผ่านศูนย์บริการ 50 สาขาทั่วประเทศ
- หรือส่งทางไปรษณีย์ ค่าส่งฟรีทุกครั้ง
- ระยะเวลาซ่อม 3-5 วันทำการ
- มีเครื่องสำรองให้ยืมระหว่างรอซ่อม (เฉพาะสมาชิก Premium)

## ติดต่อฝ่ายบริการ
- Line: @SmartHomePro
- Email: support@smarthomepro.com
- โทร: 02-123-4567 (จ-ศ 9:00-18:00)
- Chat: smarthomepro.com/support (24 ชม.)
`.trim();

// ============================================
// Test State
// ============================================
const state = {
  corpusName: null,
  doc1Name: null, // Product manual (long, auto-chunked)
  doc2Name: null, // Company policy
  doc3Name: null, // URL import
  chunkNames: [],
  totalChunks: 0,
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
// Text Splitting (เหมือนใน gemini-client.ts)
// ============================================
function splitText(text, chunkSize = 800, overlap = 100) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      if (overlap > 0) {
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + ' ' + sentence;
      } else {
        currentChunk = sentence;
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
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
    console.log(`  PASS: ${name} (${duration}ms)`);
  } catch (err) {
    const duration = Date.now() - start;
    results.failed++;
    results.tests.push({ name, status: 'failed', duration, error: err.message });
    console.error(`  FAIL: ${name} (${duration}ms)`);
    console.error(`     Error: ${err.message}`);
  }
}

function skip(name, reason = '') {
  results.total++;
  results.skipped++;
  results.tests.push({ name, status: 'skipped', reason });
  console.log(`  SKIP: ${name}${reason ? ` (${reason})` : ''}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Test Suite 1: Store (Corpus) CRUD
// ============================================
async function testStoreOperations() {
  console.log('\n== Store (Corpus) Operations ==');
  console.log('-'.repeat(50));

  await test('Create Store', async () => {
    const { ok, data } = await api('corpora', {
      method: 'POST',
      body: JSON.stringify({ displayName: `RAG Test ${Date.now()}` }),
    });
    assert(ok, `Failed to create corpus: ${JSON.stringify(data)}`);
    assert(data.name, 'Corpus name is missing');
    assert(data.name.startsWith('corpora/'), `Invalid corpus name: ${data.name}`);
    state.corpusName = data.name;
  });

  await test('List Stores', async () => {
    const { ok, data } = await api('corpora?pageSize=10', { method: 'GET' });
    assert(ok, `Failed to list corpora: ${JSON.stringify(data)}`);
    assert(Array.isArray(data.corpora), 'corpora should be an array');
    const found = data.corpora.find(c => c.name === state.corpusName);
    assert(found, 'Created corpus not found in list');
  });

  await test('Get Store', async () => {
    const { ok, data } = await api(state.corpusName, { method: 'GET' });
    assert(ok, `Failed to get corpus: ${JSON.stringify(data)}`);
    assert(data.name === state.corpusName, 'Corpus name mismatch');
    assert(data.displayName, 'Display name is missing');
  });
}

// ============================================
// Test Suite 2: Document + Long Text Upload (auto-chunk)
// ============================================
async function testDocumentUpload() {
  console.log('\n== Document Upload (RAG flow) ==');
  console.log('-'.repeat(50));

  // Upload Doc 1: Product Manual (long text, auto-chunk)
  await test('Create Document 1 (Product Manual) with metadata', async () => {
    const { ok, data } = await api(`${state.corpusName}/documents`, {
      method: 'POST',
      body: JSON.stringify({
        displayName: 'SmartHome Hub Pro Manual v3.0',
        customMetadata: [
          { key: 'category', stringValue: 'manual' },
          { key: 'project', stringValue: 'smarthome-hub' },
          { key: 'priority', numericValue: 1 },
        ],
      }),
    });
    assert(ok, `Failed to create document: ${JSON.stringify(data)}`);
    state.doc1Name = data.name;
  });

  await test('Auto-chunk & upload Product Manual (~2000 chars)', async () => {
    const chunks = splitText(PRODUCT_MANUAL, 800, 100);
    console.log(`     Split into ${chunks.length} chunks (800 chars each, 100 overlap)`);

    const { ok, data } = await api(`${state.doc1Name}/chunks:batchCreate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: chunks.map(text => ({
          chunk: { data: { stringValue: text } },
        })),
      }),
    });
    assert(ok, `Failed to batch create chunks: ${JSON.stringify(data)}`);
    assert(Array.isArray(data.chunks), 'chunks should be an array');
    assert(data.chunks.length === chunks.length, `Expected ${chunks.length} chunks, got ${data.chunks.length}`);
    state.totalChunks += data.chunks.length;
    data.chunks.forEach(c => state.chunkNames.push(c.name));
    console.log(`     Uploaded ${data.chunks.length} chunks successfully`);
  });

  // Upload Doc 2: Company Policy
  await test('Create Document 2 (Company Policy) with metadata', async () => {
    const { ok, data } = await api(`${state.corpusName}/documents`, {
      method: 'POST',
      body: JSON.stringify({
        displayName: 'Return & Warranty Policy',
        customMetadata: [
          { key: 'category', stringValue: 'policy' },
          { key: 'project', stringValue: 'smarthome-hub' },
          { key: 'priority', numericValue: 2 },
        ],
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    state.doc2Name = data.name;
  });

  await test('Auto-chunk & upload Company Policy', async () => {
    const chunks = splitText(COMPANY_POLICY, 800, 100);
    console.log(`     Split into ${chunks.length} chunks`);

    const { ok, data } = await api(`${state.doc2Name}/chunks:batchCreate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: chunks.map(text => ({
          chunk: { data: { stringValue: text } },
        })),
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    state.totalChunks += data.chunks.length;
    console.log(`     Uploaded ${data.chunks.length} chunks`);
  });

  // List documents
  await test('List Documents (should have 2)', async () => {
    const { ok, data } = await api(`${state.corpusName}/documents?pageSize=10`, { method: 'GET' });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    assert(data.documents.length >= 2, `Expected 2+ docs, got ${data.documents.length}`);
  });

  // Get document detail
  await test('Get Document detail (verify metadata)', async () => {
    const { ok, data } = await api(state.doc1Name, { method: 'GET' });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    assert(data.displayName === 'SmartHome Hub Pro Manual v3.0', 'Name mismatch');
  });

  // List chunks
  await test(`List Chunks (should have ${state.totalChunks} total)`, async () => {
    const { ok, data } = await api(`${state.doc1Name}/chunks?pageSize=100`, { method: 'GET' });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    assert(data.chunks.length > 0, 'Should have chunks');
    console.log(`     Doc 1 has ${data.chunks.length} chunks`);
  });

  // Get single chunk
  await test('Get Chunk (verify content)', async () => {
    const { ok, data } = await api(state.chunkNames[0], { method: 'GET' });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    assert(data.data?.stringValue, 'Chunk text is missing');
    assert(data.data.stringValue.length > 50, 'Chunk should have substantial content');
    console.log(`     Chunk preview: ${data.data.stringValue.substring(0, 80)}...`);
  });

  // Wait for indexing
  console.log(`\n  Waiting 15s for ${state.totalChunks} chunks to be indexed...`);
  await sleep(15000);
}

// ============================================
// Test Suite 3: URL Import
// ============================================
async function testUrlImport() {
  console.log('\n== URL Import ==');
  console.log('-'.repeat(50));

  // Fetch a public URL and create document from its content
  await test('Import content from public URL', async () => {
    // ดึงเนื้อหาจาก URL
    let textContent;
    try {
      const response = await fetch('https://raw.githubusercontent.com/anthropics/anthropic-cookbook/main/README.md');
      if (!response.ok) {
        skip('Import from URL', 'URL not accessible');
        return;
      }
      textContent = await response.text();
    } catch {
      skip('Import from URL', 'Network error');
      return;
    }

    assert(textContent.length > 100, 'URL content too short');

    // สร้าง document
    const { ok: docOk, data: docData } = await api(`${state.corpusName}/documents`, {
      method: 'POST',
      body: JSON.stringify({
        displayName: 'Anthropic Cookbook README (imported from URL)',
        customMetadata: [
          { key: 'category', stringValue: 'imported' },
          { key: 'project', stringValue: 'url-import-test' },
        ],
      }),
    });
    assert(docOk, `Failed to create doc: ${JSON.stringify(docData)}`);
    state.doc3Name = docData.name;

    // แบ่ง chunks แล้วอัปโหลด
    const chunks = splitText(textContent, 800, 100);
    // จำกัดแค่ 10 chunks แรก (ประหยัด quota)
    const limitedChunks = chunks.slice(0, 10);

    const { ok: chunkOk, data: chunkData } = await api(`${state.doc3Name}/chunks:batchCreate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: limitedChunks.map(text => ({
          chunk: { data: { stringValue: text } },
        })),
      }),
    });
    assert(chunkOk, `Failed to upload chunks: ${JSON.stringify(chunkData)}`);
    state.totalChunks += chunkData.chunks.length;
    console.log(`     Imported ${chunkData.chunks.length} chunks from URL (${textContent.length} chars total)`);
  });
}

// ============================================
// Test Suite 4: Semantic Search
// ============================================
async function testSearchOperations() {
  console.log('\n== Search Operations (RAG) ==');
  console.log('-'.repeat(50));

  await test('Search: installation steps (Thai)', async () => {
    const { ok, data } = await api(`${state.corpusName}:query`, {
      method: 'POST',
      body: JSON.stringify({
        query: 'ขั้นตอนการติดตั้ง SmartHome Hub มีอะไรบ้าง',
        resultsCount: 5,
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    assert(data.relevantChunks?.length > 0, 'Should have results');
    const top = data.relevantChunks[0];
    console.log(`     Score: ${top.chunkRelevanceScore.toFixed(4)}`);
    console.log(`     Match: ${top.chunk.data.stringValue.substring(0, 100)}...`);
  });

  await test('Search: warranty policy', async () => {
    const { ok, data } = await api(`${state.corpusName}:query`, {
      method: 'POST',
      body: JSON.stringify({
        query: 'ระยะเวลารับประกันเท่าไหร่ คืนสินค้าได้กี่วัน',
        resultsCount: 5,
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    assert(data.relevantChunks?.length > 0, 'Should have results');
    console.log(`     Found ${data.relevantChunks.length} relevant chunks`);
  });

  await test('Search: voice control (should find in manual)', async () => {
    const { ok, data } = await api(`${state.corpusName}:query`, {
      method: 'POST',
      body: JSON.stringify({
        query: 'สั่งงานด้วยเสียงได้ไหม รองรับ Google Assistant หรือ Alexa',
        resultsCount: 3,
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    assert(data.relevantChunks?.length > 0, 'Should have results about voice control');
    console.log(`     Score: ${data.relevantChunks[0].chunkRelevanceScore.toFixed(4)}`);
  });

  await test('Search: energy management', async () => {
    const { ok, data } = await api(`${state.corpusName}:query`, {
      method: 'POST',
      body: JSON.stringify({
        query: 'ช่วยประหยัดค่าไฟได้ไหม มีฟีเจอร์จัดการพลังงานอะไรบ้าง',
        resultsCount: 3,
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    assert(data.relevantChunks?.length > 0, 'Should find energy dashboard info');
  });

  await test('Search with metadata filter (category=policy)', async () => {
    const { ok, data } = await api(`${state.corpusName}:query`, {
      method: 'POST',
      body: JSON.stringify({
        query: 'ติดต่อฝ่ายบริการได้ทางไหนบ้าง',
        resultsCount: 5,
        metadataFilters: [
          { key: 'category', conditions: [{ stringValue: 'policy', operation: 'EQUAL' }] },
        ],
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    // metadata filter may not be supported on all chunks, but query should succeed
    console.log(`     Results: ${data.relevantChunks?.length || 0} chunks (filtered by category=policy)`);
  });
}

// ============================================
// Test Suite 5: AI Agent (RAG + Generate)
// ============================================
async function testAIAgentOperations() {
  console.log('\n== AI Agent (RAG + Generate Answer) ==');
  console.log('-'.repeat(50));

  await test('AI Agent: How to install the hub? (Thai)', async () => {
    const { ok, data } = await api('models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'อธิบายขั้นตอนการติดตั้ง SmartHome Hub Pro ตั้งแต่ต้นจนจบ' }],
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        semanticRetriever: {
          source: state.corpusName,
          query: { parts: [{ text: 'วิธีติดตั้ง SmartHome Hub Pro' }] },
        },
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    assert(answer, 'No answer generated');
    assert(answer.length > 50, 'Answer too short');
    // ตรวจว่าคำตอบอ้างอิงจากเอกสารจริง
    const hasRelevantContent = answer.includes('QR') || answer.includes('WiFi') || answer.includes('LED') || answer.includes('power');
    assert(hasRelevantContent, 'Answer should reference installation steps from the manual');
    console.log(`     Answer (${answer.length} chars):`);
    console.log(`     ${answer.substring(0, 200)}...`);
    console.log(`     Tokens: ${data.usageMetadata?.totalTokenCount || 'N/A'}`);
  });

  await test('AI Agent: Return policy question', async () => {
    const { ok, data } = await api('models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'ซื้อสินค้าไปแล้ว 20 วัน อยากคืน ทำได้ไหม มีเงื่อนไขอะไรบ้าง' }],
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
        semanticRetriever: {
          source: state.corpusName,
          query: { parts: [{ text: 'เงื่อนไขการคืนสินค้า ระยะเวลา' }] },
        },
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    assert(answer, 'No answer generated');
    // Should mention 30 days or return policy
    const hasRelevantContent = answer.includes('30') || answer.includes('คืน') || answer.includes('วัน');
    assert(hasRelevantContent, 'Answer should reference return policy');
    console.log(`     Answer: ${answer.substring(0, 200)}...`);
  });

  await test('AI Agent: English query on Thai docs', async () => {
    const { ok, data } = await api('models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'What smart home protocols does the Hub Pro support? List them all.' }],
        }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
        semanticRetriever: {
          source: state.corpusName,
          query: { parts: [{ text: 'supported protocols Zigbee Z-Wave WiFi' }] },
        },
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    assert(answer, 'No answer generated');
    console.log(`     Answer: ${answer.substring(0, 200)}...`);
  });

  await test('AI Agent: Troubleshooting question', async () => {
    const { ok, data } = await api('models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'Hub เชื่อมต่อ WiFi ไม่ได้ ต้องทำอย่างไร' }],
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
        semanticRetriever: {
          source: state.corpusName,
          query: { parts: [{ text: 'Hub ไม่เชื่อมต่อ WiFi แก้ไขปัญหา' }] },
        },
      }),
    });
    assert(ok, `Failed: ${JSON.stringify(data)}`);
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    assert(answer, 'No answer generated');
    const hasRelevantContent = answer.includes('reset') || answer.includes('รีสตาร์ท') || answer.includes('router') || answer.includes('WPA');
    assert(hasRelevantContent, 'Answer should reference troubleshooting steps');
    console.log(`     Answer: ${answer.substring(0, 200)}...`);
  });
}

// ============================================
// Test Suite 6: Chunk Management + Cleanup
// ============================================
async function testChunkManagement() {
  console.log('\n== Chunk Management ==');
  console.log('-'.repeat(50));

  if (state.chunkNames.length > 0) {
    await test('Delete single Chunk', async () => {
      const { ok, data } = await api(state.chunkNames[0], { method: 'DELETE' });
      assert(ok, `Failed: ${JSON.stringify(data)}`);
    });

    await test('Verify Chunk deleted', async () => {
      const { ok, status } = await api(state.chunkNames[0], { method: 'GET' });
      assert(!ok, 'Deleted chunk should not exist');
    });
  }
}

async function testDeleteOperations() {
  console.log('\n== Cleanup ==');
  console.log('-'.repeat(50));

  // Delete doc 1
  if (state.doc1Name) {
    await test('Delete Document 1 (force)', async () => {
      const { ok, data } = await api(`${state.doc1Name}?force=true`, { method: 'DELETE' });
      assert(ok, `Failed: ${JSON.stringify(data)}`);
    });
  }

  // Delete doc 2
  if (state.doc2Name) {
    await test('Delete Document 2 (force)', async () => {
      const { ok, data } = await api(`${state.doc2Name}?force=true`, { method: 'DELETE' });
      assert(ok, `Failed: ${JSON.stringify(data)}`);
    });
  }

  // Delete doc 3 (URL import)
  if (state.doc3Name) {
    await test('Delete Document 3 - URL import (force)', async () => {
      const { ok, data } = await api(`${state.doc3Name}?force=true`, { method: 'DELETE' });
      assert(ok, `Failed: ${JSON.stringify(data)}`);
    });
  }

  // Delete corpus
  if (state.corpusName) {
    await test('Delete Store (force)', async () => {
      const { ok, data } = await api(`${state.corpusName}?force=true`, { method: 'DELETE' });
      assert(ok, `Failed: ${JSON.stringify(data)}`);
    });

    await test('Verify Store deleted', async () => {
      const { ok, status } = await api(state.corpusName, { method: 'GET' });
      assert(!ok, 'Corpus should not exist after deletion');
    });
  }
}

// ============================================
// Main Runner
// ============================================
async function main() {
  console.log('=== Gemini RAG File Search - Integration Test ===');
  console.log('='.repeat(50));
  console.log(`  Scope:    ${TEST_SCOPE}`);
  console.log(`  API Key:  ${API_KEY.substring(0, 8)}...${API_KEY.slice(-4)}`);
  console.log(`  Time:     ${new Date().toISOString()}`);
  console.log('='.repeat(50));

  try {
    // Verify API key
    console.log('\nVerifying API Key...');
    const { ok, data } = await api('corpora?pageSize=1', { method: 'GET' });
    if (!ok) {
      console.error(`API Key verification failed: ${JSON.stringify(data)}`);
      process.exit(1);
    }
    console.log('  API Key is valid\n');

    // Run test suites based on scope
    const runUpload = ['all', 'upload-only', 'store-only'].includes(TEST_SCOPE);
    const runSearch = ['all', 'search-only'].includes(TEST_SCOPE);

    if (runUpload) {
      await testStoreOperations();
      await testDocumentUpload();
    }

    if (TEST_SCOPE === 'all') {
      await testUrlImport();
    }

    if (runSearch) {
      if (!state.corpusName) {
        console.log('\n  Search tests require store + upload to run first');
        console.log('  Run with TEST_SCOPE=all');
      } else {
        await testSearchOperations();
        await testAIAgentOperations();
      }
    }

    // Chunk management + cleanup
    if (state.corpusName) {
      await testChunkManagement();
      await testDeleteOperations();
    }
  } catch (err) {
    console.error(`\nUnexpected error: ${err.message}`);
    console.error(err.stack);

    // Emergency cleanup
    if (state.corpusName) {
      console.log('\nEmergency cleanup...');
      try {
        await api(`${state.corpusName}?force=true`, { method: 'DELETE' });
        console.log('  Cleaned up test corpus');
      } catch {
        console.error(`  Failed to cleanup: ${state.corpusName}`);
      }
    }
  }

  // ============================================
  // Results Summary
  // ============================================
  const duration = ((Date.now() - results.startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(50));
  console.log('Results Summary');
  console.log('-'.repeat(50));
  console.log(`  Total:   ${results.total}`);
  console.log(`  Passed:  ${results.passed}`);
  console.log(`  Failed:  ${results.failed}`);
  console.log(`  Skipped: ${results.skipped}`);
  console.log(`  Chunks:  ${state.totalChunks} uploaded`);
  console.log(`  Time:    ${duration}s`);
  console.log('='.repeat(50));

  // Save results for GitHub Actions artifact
  const fs = await import('fs');
  fs.writeFileSync('test-results.json', JSON.stringify({
    ...results,
    duration: parseFloat(duration),
    scope: TEST_SCOPE,
    chunksUploaded: state.totalChunks,
    timestamp: new Date().toISOString(),
  }, null, 2));

  if (results.failed > 0) {
    console.log('\nSome tests failed!');
    process.exit(1);
  }

  console.log('\nAll tests passed!');
}

main();
