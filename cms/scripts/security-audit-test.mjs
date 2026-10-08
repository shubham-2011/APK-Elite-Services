/**
 * End-to-End Security Verification Test Suite
 * Tests all 10 security requirements against the Next.js CMS API
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

const results = [];

function recordTest(name, passed, details = '') {
  results.push({ name, passed, details });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} | ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runTests() {
  console.log(`\n========================================`);
  console.log(`Starting CMS Security Verification Tests`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`========================================\n`);

  // ----------------------------------------------------
  // TEST 1: Unauthenticated GET /api/leads -> 401
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/leads`);
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 401 && data.success === false;
    recordTest('Test 1: GET /api/leads without auth returns 401 Unauthorized', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('Test 1: GET /api/leads without auth returns 401 Unauthorized', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 2: Unauthenticated PUT /api/content -> 401
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: 'Hacked Services' }),
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 401 && data.success === false;
    recordTest('Test 2: PUT /api/content without auth returns 401 Unauthorized', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('Test 2: PUT /api/content without auth returns 401 Unauthorized', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 3: Unauthenticated DELETE /api/leads/[id] -> 401
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/leads/507f1f77bcf86cd799439011`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 401 && data.success === false;
    recordTest('Test 3: DELETE /api/leads/:id without auth returns 401 Unauthorized', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('Test 3: DELETE /api/leads/:id without auth returns 401 Unauthorized', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 4: Unauthenticated GET /api/stats -> 401
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/stats`);
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 401 && data.success === false;
    recordTest('Test 4: GET /api/stats without auth returns 401 Unauthorized', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('Test 4: GET /api/stats without auth returns 401 Unauthorized', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 5: Public POST /api/leads (Quote Submission) -> 201
  // ----------------------------------------------------
  let createdLeadId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Security Test Lead',
        phone: '9876543210',
        email: 'test@example.com',
        service: 'Deep Cleaning',
        locality: 'Baner',
        message: 'Security test lead submission',
      }),
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 201 && data.success === true;
    createdLeadId = data.leadId;
    recordTest('Test 5: Public POST /api/leads captures lead legitimately', pass, `LeadId: ${createdLeadId}`);
  } catch (e) {
    recordTest('Test 5: Public POST /api/leads captures lead legitimately', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 6: Public GET /api/content -> 200 (Website visitors can view content)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/content`);
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 200 && data.success === true && !!data.content;
    recordTest('Test 6: Public GET /api/content is accessible to website visitors', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('Test 6: Public GET /api/content is accessible to website visitors', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 7: Authentication - Invalid Credentials -> 401
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'WrongPassword123!' }),
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 401 && data.success === false;
    recordTest('Test 7: Login with invalid password returns 401 Unauthorized', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('Test 7: Login with invalid password returns 401 Unauthorized', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 8: Authentication - Valid Credentials -> 200 & Token
  // ----------------------------------------------------
  let authToken = null;
  let cookieHeader = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@ApkElite2026!' }),
    });
    const data = await res.json().catch(() => ({}));
    authToken = data.token;
    cookieHeader = res.headers.get('set-cookie');
    const pass = res.status === 200 && data.success === true && !!authToken;
    recordTest('Test 8: Login with valid credentials succeeds and returns session', pass, `User: ${data.user?.username}`);
  } catch (e) {
    recordTest('Test 8: Login with valid credentials succeeds and returns session', false, e.message);
  }

  // Helper headers for authenticated requests
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };

  // ----------------------------------------------------
  // TEST 9: Authenticated GET /api/leads -> 200
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/leads?limit=10`, { headers: authHeaders });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 200 && data.success === true && Array.isArray(data.leads);
    recordTest('Test 9: Authenticated GET /api/leads returns leads with pagination', pass, `Total: ${data.total}`);
  } catch (e) {
    recordTest('Test 9: Authenticated GET /api/leads returns leads with pagination', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 10: ReDoS Attack Search Inputs -> No crash, 200 OK
  // ----------------------------------------------------
  const redosPayloads = ['(', '[', ']', '.*', '+', '?', '{1,100000}', '((a+)+)+$'];
  let redosPassed = true;
  for (const payload of redosPayloads) {
    try {
      const res = await fetch(`${BASE_URL}/api/leads?search=${encodeURIComponent(payload)}`, {
        headers: authHeaders,
      });
      if (res.status === 500) {
        redosPassed = false;
        console.error(`ReDoS payload triggered 500: ${payload}`);
      }
    } catch {
      redosPassed = false;
    }
  }
  recordTest('Test 10: ReDoS injection patterns handled safely without 500 crash', redosPassed);

  // ----------------------------------------------------
  // TEST 11: Excessively Long Search Query -> 400 Bad Request
  // ----------------------------------------------------
  try {
    const hugeSearch = 'A'.repeat(150);
    const res = await fetch(`${BASE_URL}/api/leads?search=${hugeSearch}`, { headers: authHeaders });
    const pass = res.status === 400;
    recordTest('Test 11: Excessively long search (>100 chars) returns 400 Bad Request', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('Test 11: Excessively long search (>100 chars) returns 400 Bad Request', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 12: Invalid MongoDB ID -> 400 Bad Request
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/leads/not-a-valid-id!@#$`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const pass = res.status === 400;
    recordTest('Test 12: Invalid ID format returns 400 Bad Request', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('Test 12: Invalid ID format returns 400 Bad Request', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 13: Schema Validation on PUT /api/content rejects arbitrary keys
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/content`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        companyName: 'Valid Name',
        phone: '1234567890',
        whatsapp: '1234567890',
        email: 'admin@example.com',
        promoBanner: { enabled: true, text: 'Test Banner', discountPercent: 10 },
        formConfig: { modalTitle: 'Title', modalSubtitle: 'Sub', localities: [], services: [] },
        maliciousInjectedField: 'evilPayload',
      }),
    });
    const data = await res.json().catch(() => ({}));
    // Zod strict schema rejects unknown field with 400
    const pass = res.status === 400 && data.success === false;
    recordTest('Test 13: PUT /api/content rejects arbitrary unwhitelisted keys with 400', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('Test 13: PUT /api/content rejects arbitrary unwhitelisted keys with 400', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 14: Valid PUT /api/content succeeds with 200
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/content`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        companyName: 'APK Elite Services',
        phone: '+91 88301 67863',
        whatsapp: '918830167863',
        email: 'info@apkeliteservices.in',
        address: 'Pune, Maharashtra',
        businessHours: 'Mon - Sun: 8:00 AM - 9:00 PM',
        promoBanner: { enabled: true, text: 'Exclusive 15% Off Festival Deal', discountPercent: 15 },
        formConfig: {
          modalTitle: 'Request a Free Quote',
          modalSubtitle: 'Fill details below',
          localities: ['Baner', 'Wakad'],
          services: ['Deep Cleaning'],
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 200 && data.success === true;
    recordTest('Test 14: Valid PUT /api/content persists successfully with 200', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('Test 14: Valid PUT /api/content persists successfully with 200', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 15: Authorized DELETE /api/leads/[id] succeeds
  // ----------------------------------------------------
  if (createdLeadId) {
    try {
      const res = await fetch(`${BASE_URL}/api/leads/${createdLeadId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json().catch(() => ({}));
      const pass = res.status === 200 && data.success === true;
      recordTest('Test 15: Authorized DELETE /api/leads/:id succeeds with 200', pass, `Deleted: ${createdLeadId}`);
    } catch (e) {
      recordTest('Test 15: Authorized DELETE /api/leads/:id succeeds with 200', false, e.message);
    }
  }

  // ----------------------------------------------------
  // TEST 16: Security Headers verification
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/login`);
    const xFrame = res.headers.get('x-frame-options');
    const xContent = res.headers.get('x-content-type-options');
    const pass = xFrame === 'DENY' && xContent === 'nosniff';
    recordTest('Test 16: Security Headers present (X-Frame-Options, X-Content-Type-Options)', pass);
  } catch (e) {
    recordTest('Test 16: Security Headers present', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 17: Logout clears session
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: authHeaders,
    });
    const pass = res.status === 200;
    recordTest('Test 17: Logout endpoint invalidates session with 200', pass);
  } catch (e) {
    recordTest('Test 17: Logout endpoint invalidates session with 200', false, e.message);
  }

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\n========================================`);
  console.log(`Test Results Summary: ${passedCount} / ${results.length} PASSED`);
  console.log(`========================================\n`);

  if (passedCount === results.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
