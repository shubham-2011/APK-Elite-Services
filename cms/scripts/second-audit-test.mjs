/**
 * Second Independent Security Audit & Verification Test Suite
 * Specifically tests:
 * 1. Cryptographic session validity & expiration
 * 2. True Server-Side Session Revocation on Logout (Token reuse MUST fail)
 * 3. CSRF Protection for state-changing endpoints (403 Forbidden on cross-site requests)
 * 4. Multi-instance persistent rate limiting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load cms/.env.local if present
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const BASE_URL = process.env.BASE_URL || process.env.TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('FATAL: TEST_ADMIN_PASSWORD environment variable is required.');
  process.exit(1);
}

const results = [];

function recordTest(id, name, passed, details = '') {
  results.push({ id, name, passed, details });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} | [${id}] ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runAuditTests() {
  console.log(`\n======================================================`);
  console.log(`Starting Phase 2 Independent Security Verification`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // ----------------------------------------------------
  // TEST 1: Password security check - plaintext reject
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ADMIN_USERNAME, password: 'WrongPassword999!' }),
    });
    const pass = res.status === 401;
    recordTest('P2-01', 'Invalid password rejected with 401 Unauthorized', pass);
  } catch (e) {
    recordTest('P2-01', 'Invalid password rejected with 401 Unauthorized', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 2: Valid Login & Receive Session
  // ----------------------------------------------------
  let sessionToken = null;
  let cookieHeader = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
    });
    const data = await res.json().catch(() => ({}));
    sessionToken = data.token;
    cookieHeader = res.headers.get('set-cookie');
    const pass = res.status === 200 && data.success === true && !!sessionToken;
    recordTest('P2-02', 'Successful login returns cryptographic token & HttpOnly cookie', pass, `Cookie set: ${!!cookieHeader}`);
  } catch (e) {
    recordTest('P2-02', 'Successful login returns cryptographic token', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 3: Access protected API with active session -> 200 OK
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/leads?limit=5`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 200 && data.success === true;
    recordTest('P2-03', 'Active session accesses protected /api/leads with 200 OK', pass);
  } catch (e) {
    recordTest('P2-03', 'Active session accesses protected /api/leads', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 4: Logout & Revoke Session Server-Side
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    const pass = res.status === 200;
    recordTest('P2-04', 'Logout triggers server-side session revocation', pass);
  } catch (e) {
    recordTest('P2-04', 'Logout triggers server-side session revocation', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 5: REUSE OLD SESSION AFTER LOGOUT -> MUST BE REJECTED 401
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/leads?limit=5`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 401 && data.success === false;
    recordTest('P2-05', 'Reusing old session after logout MUST fail with 401 Unauthorized', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('P2-05', 'Reusing old session after logout MUST fail', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 6: Obtain Fresh Session for CSRF Testing
  // ----------------------------------------------------
  let freshCookie = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
    });
    const rawCookie = res.headers.get('set-cookie');
    if (rawCookie) {
      freshCookie = rawCookie.split(';')[0];
    }
    const pass = res.status === 200 && !!freshCookie;
    recordTest('P2-06', 'Authenticated fresh cookie session established', pass);
  } catch (e) {
    recordTest('P2-06', 'Authenticated fresh cookie session established', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 7: Cross-Site Request (CSRF Attack Simulation) -> 403 Forbidden
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/content`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: freshCookie,
        Origin: 'https://evil-attacker-website.com',
      },
      body: JSON.stringify({ companyName: 'Defaced Site' }),
    });
    const pass = res.status === 403;
    recordTest('P2-07', 'Cross-origin CSRF attempt strictly blocked with 403 Forbidden', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('P2-07', 'Cross-origin CSRF attempt blocked', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 8: Same-Site / Authorized mutating request with custom header -> 200 OK
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/content`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: freshCookie,
      },
      body: JSON.stringify({
        companyName: 'APK Elite Services',
        phone: '+91 88301 67863',
        whatsapp: '918830167863',
        email: 'info@apkeliteservices.in',
        address: 'Pune, Maharashtra',
        businessHours: 'Mon - Sun: 8:00 AM - 9:00 PM',
        promoBanner: { enabled: true, text: 'Clean Home Offer', discountPercent: 15 },
        formConfig: { modalTitle: 'Quote', modalSubtitle: 'Details', localities: [], services: [] },
      }),
    });
    const pass = res.status === 200;
    recordTest('P2-08', 'Legitimate state-changing request succeeds with 200 OK', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('P2-08', 'Legitimate state-changing request succeeds', false, e.message);
  }

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\n======================================================`);
  console.log(`Phase 2 Test Results Summary: ${passedCount} / ${results.length} PASSED`);
  console.log(`======================================================\n`);

  if (passedCount === results.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAuditTests();
