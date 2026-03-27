#!/usr/bin/env node
/**
 * Integration tests for the OCR pipeline (ocr-vision edge function)
 *
 * Sends each test image directly to the live edge function and asserts
 * that the extracted item count, tax, and total match expected values.
 *
 * Usage:
 *   node tests/scripts/ocr-pipeline.integration.test.js
 *
 * Optional env overrides:
 *   SUPABASE_URL   — override the project URL
 *   TEST_JWT       — supply a real Bearer token (skips fake-JWT generation)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert/strict';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? 'https://ejfmhukphszhowutctly.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ocr-vision`;

/**
 * Build a minimal JWT whose payload contains a `sub` claim.
 * The edge function only decodes the payload (no signature verification)
 * and verify_jwt = false is set in config.toml, so this is sufficient for
 * integration-test purposes.
 */
function makeFakeJwt(userId = 'integration-test-user') {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      role: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url');
  return `${header}.${payload}.integration-test-sig`;
}

function imageToBase64DataUrl(imagePath) {
  const ext = path.extname(imagePath).slice(1).toLowerCase();
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const data = fs.readFileSync(imagePath);
  return `data:${mime};base64,${data.toString('base64')}`;
}

// ── Test cases ────────────────────────────────────────────────────────────────
const TESTS = [
  {
    name: 'test-receipt-1',
    image: path.resolve(__dirname, '../images/test-reciept-1.png'),
    expected: { itemCount: 9, tax: 7.78, total: 87.53 },
  },
  {
    name: 'test-receipt-2',
    image: path.resolve(__dirname, '../images/test-reciept-2.png'),
    expected: { itemCount: 7, tax: 3.98, total: 43.73 },
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────
async function runTest({ name, image, expected }) {
  console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 40 - name.length))}`);

  const base64 = imageToBase64DataUrl(image);
  const token = process.env.TEST_JWT ?? makeFakeJwt();

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ image: base64 }),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} — ${JSON.stringify(body)}`);
  }

  const { items = [], tax, tip, total, confidence } = body;

  console.log(`  items      : ${items.length}`);
  console.log(`  tax        : ${tax}`);
  console.log(`  tip        : ${tip}`);
  console.log(`  total      : ${total}`);
  console.log(`  confidence : ${confidence}`);

  assert.equal(
    items.length,
    expected.itemCount,
    `item count mismatch — expected ${expected.itemCount}, got ${items.length}`,
  );
  assert.equal(
    tax,
    expected.tax,
    `tax mismatch — expected ${expected.tax}, got ${tax}`,
  );
  assert.equal(
    total,
    expected.total,
    `total mismatch — expected ${expected.total}, got ${total}`,
  );

  console.log(`  ✓ PASSED`);
}

(async () => {
  console.log(`OCR Pipeline Integration Tests`);
  console.log(`Endpoint: ${FUNCTION_URL}`);

  let passed = 0;
  let failed = 0;

  for (const test of TESTS) {
    try {
      await runTest(test);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${'─'.repeat(44)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) process.exit(1);
})();
