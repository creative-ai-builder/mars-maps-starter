#!/usr/bin/env node
// Minimal test runner — no external deps.
// Usage: node workbook/tests/run_tests.js

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// ── Mock browser globals ───────────────────────────────────────────────────
const store = {};
global.localStorage = {
  getItem: k => store[k] ?? null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

// ── Fetch mock (override per test) ─────────────────────────────────────────
global._fetchMock = null;
global.fetch = (...args) => {
  if (global._fetchMock) return global._fetchMock(...args);
  return Promise.reject(new Error('fetch not mocked'));
};

// ── Test runner ────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function assertDeepEqual(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

async function test(name, fn) {
  localStorage.clear();
  global._fetchMock = null;
  try {
    await fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌  ${name}`);
    console.log(`       ${e.message}`);
    failed++;
    failures.push({ name, error: e.message });
  }
}

// ── Import coach.js ────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { default: coach } = await import(path.join(__dirname, '../coach.js'));
const {
  markDone, isDone, getProgress,
  isUnlocked, isChapterUnlocked,
  earnBadge, hasBadge, getAllBadges,
  getCachedQuestions, setCachedQuestions, clearCache,
  callCoach, generateQuestions,
} = coach;

// ── Config import ──────────────────────────────────────────────────────────
const { WORKBOOK_CONFIG } = await import(path.join(__dirname, '../config.js'));

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Workbook Unit Tests');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ── Progress tracking ──────────────────────────────────────────────────────
console.log('Progress tracking:');
await test('markDone + isDone returns true', () => {
  markDone(1, 1);
  assert(isDone(1, 1), 'isDone should be true after markDone');
});
await test('isDone returns false for unmarked section', () => {
  assert(!isDone(1, 2), 'section 2 not yet done');
});
await test('getProgress reflects one completed section', () => {
  markDone(1, 1);
  const p = getProgress(1);
  assertEqual(p.completed, 1);
  assertEqual(p.total, 4);
});
await test('getProgress with all 4 sections done', () => {
  markDone(1, 1); markDone(1, 2); markDone(1, 3); markDone(1, 4);
  const p = getProgress(1);
  assertEqual(p.completed, 4);
  assertEqual(p.total, 4);
});
await test('markDone is idempotent', () => {
  markDone(1, 1); markDone(1, 1);
  assert(isDone(1, 1));
  assertEqual(getProgress(1).completed, 1);
});

// ── Section locking ────────────────────────────────────────────────────────
console.log('\nSection locking:');
await test('section 1 is always unlocked', () => {
  assert(isUnlocked(1, 1));
});
await test('section 2 locked before section 1 done', () => {
  assert(!isUnlocked(1, 2));
});
await test('section 2 unlocked after section 1 done', () => {
  markDone(1, 1);
  assert(isUnlocked(1, 2));
});
await test('section 4 unlocked only after sections 1-3 done', () => {
  markDone(1, 1); markDone(1, 2); markDone(1, 3);
  assert(isUnlocked(1, 4));
});
await test('section 4 locked with only sections 1-2 done', () => {
  markDone(1, 1); markDone(1, 2);
  assert(!isUnlocked(1, 4));
});

// ── Chapter locking ────────────────────────────────────────────────────────
console.log('\nChapter locking:');
await test('chapter 1 always unlocked', () => {
  assert(isChapterUnlocked(1));
});
await test('chapter 2 locked without talker badge', () => {
  assert(!isChapterUnlocked(2));
});
await test('chapter 2 unlocked after talker badge', () => {
  earnBadge('talker');
  assert(isChapterUnlocked(2));
});
await test('chapter 5 requires all 4 prior badges', () => {
  assert(!isChapterUnlocked(5));
  earnBadge('talker'); earnBadge('decomposer'); earnBadge('specifier');
  assert(!isChapterUnlocked(5));
  earnBadge('lie-spotter');
  assert(isChapterUnlocked(5));
});

// ── Badge system ───────────────────────────────────────────────────────────
console.log('\nBadge system:');
await test('earnBadge + hasBadge returns true', () => {
  earnBadge('talker');
  assert(hasBadge('talker'));
});
await test('hasBadge returns false for unearned badge', () => {
  assert(!hasBadge('decomposer'));
});
await test('getAllBadges returns earned badges', () => {
  earnBadge('talker'); earnBadge('specifier');
  const b = getAllBadges();
  assertEqual(b.length, 2);
  assert(b.includes('talker'));
  assert(b.includes('specifier'));
});
await test('getAllBadges returns empty array with no badges', () => {
  assertEqual(getAllBadges().length, 0);
});
await test('earnBadge idempotent — no duplicates', () => {
  earnBadge('talker'); earnBadge('talker');
  assertEqual(getAllBadges().length, 1);
});

// ── Question caching ───────────────────────────────────────────────────────
console.log('\nQuestion caching:');
await test('getCachedQuestions returns null before cache set', () => {
  assertEqual(getCachedQuestions(1, 2), null);
});
await test('setCachedQuestions + getCachedQuestions roundtrip', () => {
  const q = [{ question: 'test', answer: 'yes' }];
  setCachedQuestions(1, 2, q);
  const result = getCachedQuestions(1, 2);
  assertEqual(result[0].question, 'test');
});
await test('cache for different chapter/section does not bleed', () => {
  setCachedQuestions(1, 2, [{ q: 'ch1s2' }]);
  assertEqual(getCachedQuestions(2, 2), null);
});
await test('clearCache removes only that entry', () => {
  setCachedQuestions(1, 2, [{ q: 'a' }]);
  setCachedQuestions(1, 3, [{ q: 'b' }]);
  clearCache(1, 2);
  assertEqual(getCachedQuestions(1, 2), null);
  assert(getCachedQuestions(1, 3) !== null);
});

// ── API call shape ─────────────────────────────────────────────────────────
console.log('\nAPI call shape (mocked fetch):');
await test('callCoach sends POST to proxy URL', async () => {
  let capturedUrl;
  global._fetchMock = (url, opts) => {
    capturedUrl = url;
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [{ text: 'hi' }] }) });
  };
  await callCoach('sys', 'user input');
  assert(capturedUrl.includes('mars-proxy.creative-ai-builder.workers.dev'));
});
await test('callCoach sends x-api-key header', async () => {
  let capturedHeaders;
  global._fetchMock = (url, opts) => {
    capturedHeaders = opts.headers;
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [{ text: 'hi' }] }) });
  };
  await callCoach('sys', 'input');
  assertEqual(capturedHeaders['x-api-key'], 'class2025');
});
await test('callCoach includes system prompt + user content', async () => {
  let capturedBody;
  global._fetchMock = (url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [{ text: 'hi' }] }) });
  };
  await callCoach('my system', 'my answer');
  assertEqual(capturedBody.system, 'my system');
  assertEqual(capturedBody.messages[0].content, 'my answer');
});
await test('callCoach returns text from content[0].text', async () => {
  global._fetchMock = () =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [{ text: 'coach says hi' }] }) });
  const result = await callCoach('s', 'u');
  assertEqual(result, 'coach says hi');
});
await test('callCoach rejects on fetch error', async () => {
  global._fetchMock = () => Promise.reject(new Error('network down'));
  let threw = false;
  try { await callCoach('s', 'u'); } catch { threw = true; }
  assert(threw);
});

// ── Question generation ────────────────────────────────────────────────────
console.log('\nQuestion generation (mocked fetch):');
await test('generateQuestions returns parsed array from API', async () => {
  const mockQ = [{ vague: 'fix it', specific: 'fix the button color', why: 'units' }];
  global._fetchMock = () =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [{ text: JSON.stringify(mockQ) }] }) });
  const result = await generateQuestions(1, 2);
  assertEqual(result[0].vague, 'fix it');
});
await test('generateQuestions caches result — second call skips fetch', async () => {
  const mockQ = [{ vague: 'a', specific: 'b', why: 'c' }];
  let fetchCount = 0;
  global._fetchMock = () => {
    fetchCount++;
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [{ text: JSON.stringify(mockQ) }] }) });
  };
  await generateQuestions(1, 2);
  await generateQuestions(1, 2);
  assertEqual(fetchCount, 1);
});
await test('generateQuestions uses cache if already set', async () => {
  const cached = [{ q: 'cached' }];
  setCachedQuestions(1, 3, cached);
  let fetched = false;
  global._fetchMock = () => { fetched = true; return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [{ text: '[]' }] }) }); };
  const result = await generateQuestions(1, 3);
  assert(!fetched);
  assertEqual(result[0].q, 'cached');
});
await test('malformed JSON response returns fallback questions', async () => {
  global._fetchMock = () =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ content: [{ text: 'not json at all' }] }) });
  const result = await generateQuestions(1, 2);
  assert(Array.isArray(result));
  assert(result.length > 0);
});

// ── Config ─────────────────────────────────────────────────────────────────
console.log('\nConfig:');
await test('config has all 5 chapters', () => {
  for (let i = 1; i <= 5; i++) assert(WORKBOOK_CONFIG.chapters[i], `chapter ${i} missing`);
});
await test('each chapter has section2Count and section3Count', () => {
  for (let i = 1; i <= 5; i++) {
    assert('section2Count' in WORKBOOK_CONFIG.chapters[i]);
    assert('section3Count' in WORKBOOK_CONFIG.chapters[i]);
  }
});
await test('all counts are positive integers', () => {
  for (let i = 1; i <= 5; i++) {
    const c = WORKBOOK_CONFIG.chapters[i];
    assert(Number.isInteger(c.section2Count) && c.section2Count > 0);
    assert(Number.isInteger(c.section3Count) && c.section3Count > 0);
  }
});

// ── Summary ────────────────────────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (failed === 0) {
  console.log(`  ✅  All ${passed} tests passed`);
} else {
  console.log(`  ❌  ${failed} failed, ${passed} passed`);
  failures.forEach(f => console.log(`     • ${f.name}: ${f.error}`));
  process.exit(1);
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
