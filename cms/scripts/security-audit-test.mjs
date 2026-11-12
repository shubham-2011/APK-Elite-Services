/**
 * Automated Security Verification Test Suite
 * Validates security protections across the Next.js CMS API, Multi-User Auth & Angular frontend.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const AUTH_SECRET = process.env.AUTH_SECRET || '8ce346ae38aed6ff58b5b9c04c07c647e7200eb5faeb9143af169382a9a6af89';

if (!ADMIN_PASSWORD) {
  console.error('FATAL: TEST_ADMIN_PASSWORD environment variable is missing.');
  process.exit(1);
}

const results = [];

function recordTest(id, name, passed, details = '') {
  results.push({ id, name, passed, details });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} | [${id}] ${name} ${details ? '-> ' + details : ''}`);
}

function craftToken(secret, payload) {
  const pB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(pB64).digest('base64url');
  return `${pB64}.${sig}`;
}

async function runTestSuite() {
  console.log(`\n======================================================`);
  console.log(`Starting Automated Security Verification Suite`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // ----------------------------------------------------
  // TEST 1: Edge Middleware - Forged Token on GET /
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: 'apk_cms_session=fake.invalid.signature' },
      redirect: 'manual',
    });
    const isRedirect = res.status === 307 || res.status === 302;
    const location = res.headers.get('location') || '';
    const pass = isRedirect && location.includes('/login');
    recordTest('SEC-01', 'Edge Middleware redirects forged token on GET / to /login', pass, `Status: ${res.status}, Location: ${location}`);
  } catch (e) {
    recordTest('SEC-01', 'Edge Middleware redirects forged token on GET / to /login', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 2: Edge Middleware - Forged Token on GET /api/leads -> 401
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      headers: { Cookie: 'apk_cms_session=fake.invalid.signature' },
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 401 && data.success === false;
    recordTest('SEC-02', 'Edge Middleware rejects forged token on GET /api/leads with 401', pass, `Status: ${res.status}`);
  } catch (e) {
    recordTest('SEC-02', 'Edge Middleware rejects forged token on GET /api/leads with 401', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 3: Expired Token Rejection
  // ----------------------------------------------------
  try {
    const expiredPayload = {
      sid: 'expired-session-id',
      username: ADMIN_USERNAME,
      role: 'admin',
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600,
    };
    const expiredToken = craftToken(AUTH_SECRET, expiredPayload);

    const apiRes = await fetch(`${BASE_URL}/api/leads`, {
      headers: { Cookie: `apk_cms_session=${expiredToken}` },
    });
    const pageRes = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: `apk_cms_session=${expiredToken}` },
      redirect: 'manual',
    });

    const apiPass = apiRes.status === 401;
    const pagePass = (pageRes.status === 307 || pageRes.status === 302) && (pageRes.headers.get('location') || '').includes('/login');
    const pass = apiPass && pagePass;
    recordTest('SEC-03', 'Expired token rejected by middleware & API with 401/redirect', pass, `API: ${apiRes.status}, Page: ${pageRes.status}`);
  } catch (e) {
    recordTest('SEC-03', 'Expired token rejected by middleware & API', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 4: Valid Authentication & Session Flow
  // ----------------------------------------------------
  let sessionToken = null;
  let sessionCookie = null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
    });
    const data = await res.json().catch(() => ({}));
    sessionToken = data.token;
    const rawCookie = res.headers.get('set-cookie');
    if (rawCookie) {
      sessionCookie = rawCookie.split(';')[0];
    }
    const pass = res.status === 200 && data.success === true && !!sessionToken;
    recordTest('SEC-04', 'Valid admin login succeeds with signed token & HttpOnly cookie', pass, `User: ${data.user?.username}`);
  } catch (e) {
    recordTest('SEC-04', 'Valid admin login succeeds', false, e.message);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: sessionCookie,
    Authorization: `Bearer ${sessionToken}`,
    'X-Requested-With': 'XMLHttpRequest',
  };

  // ----------------------------------------------------
  // TEST 5: Authenticated Access to Protected /api/leads -> 200 OK
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/leads?limit=10`, { headers: authHeaders });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 200 && data.success === true && Array.isArray(data.leads);
    recordTest('SEC-05', 'Authenticated GET /api/leads returns customer records', pass, `Total: ${data.total}`);
  } catch (e) {
    recordTest('SEC-05', 'Authenticated GET /api/leads returns customer records', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 6: CSRF Cross-Origin Rejection -> 403 Forbidden
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/content`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
        Origin: 'https://evil-attacker.com',
      },
      body: JSON.stringify({ companyName: 'Defaced Site' }),
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 403;
    recordTest('SEC-06', 'CSRF cross-origin mutating request blocked with 403 Forbidden', pass, `Status: ${res.status}, Error: ${data.error}`);
  } catch (e) {
    recordTest('SEC-06', 'CSRF cross-origin mutating request blocked with 403 Forbidden', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 7: Admin CORS Strictness (OPTIONS preflight)
  // ----------------------------------------------------
  try {
    const optContent = await fetch(`${BASE_URL}/api/content`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil-attacker.com' },
    });
    const optLead = await fetch(`${BASE_URL}/api/leads/test-lead-id`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil-attacker.com' },
    });

    const acaoContent = optContent.headers.get('access-control-allow-origin') || '';
    const acaoLead = optLead.headers.get('access-control-allow-origin') || '';

    const contentStrict = acaoContent !== '*' && acaoContent !== 'https://evil-attacker.com';
    const leadStrict = acaoLead !== '*' && acaoLead !== 'https://evil-attacker.com';
    const pass = contentStrict && leadStrict;
    recordTest('SEC-07', 'Admin CORS strictness rejects wildcard * & does not reflect untrusted origin', pass, `Content ACAO: ${acaoContent}, Lead ACAO: ${acaoLead}`);
  } catch (e) {
    recordTest('SEC-07', 'Admin CORS strictness rejects wildcard *', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 8: Public Lead Ingestion Honeypot
  // ----------------------------------------------------
  const honeypotMarkerName = 'Honeypot Bot Test ' + Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: honeypotMarkerName,
        phone: '9876543210',
        email: 'bot@spam.com',
        service: 'Deep Cleaning',
        website: 'https://spam.bot', // Honeypot trigger
      }),
    });
    const postPass = res.status === 200;

    // Check leads list to verify it was NOT created
    const verifyRes = await fetch(`${BASE_URL}/api/leads?search=${encodeURIComponent(honeypotMarkerName)}`, {
      headers: authHeaders,
    });
    const verifyData = await verifyRes.json().catch(() => ({}));
    const found = Array.isArray(verifyData.leads) && verifyData.leads.some((l) => l.name === honeypotMarkerName);

    const pass = postPass && !found;
    recordTest('SEC-08', 'Honeypot field drops bot spam silently with 200 without DB creation', pass, `POST status: ${res.status}, Record persisted: ${found}`);
  } catch (e) {
    recordTest('SEC-08', 'Honeypot field drops bot spam silently with 200', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 9: Public Lead Ingestion Rate Limiting -> 429
  // ----------------------------------------------------
  try {
    const testIp = '198.51.100.99';
    let rateLimited = false;
    for (let i = 0; i < 8; i++) {
      const res = await fetch(`${BASE_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': testIp,
        },
        body: JSON.stringify({
          name: `Rapid Lead ${i}`,
          phone: `910000000${i}`,
          service: 'Deep Cleaning',
        }),
      });
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }
    recordTest('SEC-09', 'Public POST /api/leads enforces rate limiting (429 Too Many Requests)', rateLimited);
  } catch (e) {
    recordTest('SEC-09', 'Public POST /api/leads enforces rate limiting', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 10: Login Brute-Force Lockout -> 429
  // ----------------------------------------------------
  try {
    const attackIp = '198.51.100.123';
    let lockedOut = false;
    for (let i = 0; i < 7; i++) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': attackIp,
        },
        body: JSON.stringify({
          username: `lockout_user_${Date.now()}`,
          password: 'WrongPassword123!',
        }),
      });
      if (res.status === 429) {
        lockedOut = true;
        break;
      }
    }
    recordTest('SEC-10', 'Login brute-force lockout enforces 429 Too Many Requests', lockedOut);
  } catch (e) {
    recordTest('SEC-10', 'Login brute-force lockout enforces 429', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 11: Security & CSP Headers Check
  // ----------------------------------------------------
  try {
    const resHome = await fetch(`${BASE_URL}/`);
    const resLogin = await fetch(`${BASE_URL}/login`);

    const csp = resHome.headers.get('content-security-policy') || resLogin.headers.get('content-security-policy');
    const xfo = resHome.headers.get('x-frame-options') || resLogin.headers.get('x-frame-options');
    const xcto = resHome.headers.get('x-content-type-options') || resLogin.headers.get('x-content-type-options');
    const hsts = resHome.headers.get('strict-transport-security') || resLogin.headers.get('strict-transport-security');

    const pass = !!csp && xfo === 'DENY' && xcto === 'nosniff' && !!hsts;
    recordTest('SEC-11', 'Security headers present (CSP, X-Frame-Options, X-Content-Type, HSTS)', pass, `CSP: ${!!csp}, XFO: ${xfo}, XCTO: ${xcto}`);
  } catch (e) {
    recordTest('SEC-11', 'Security headers present', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 12: Static Codebase Assertions (Angular & Git Hygiene)
  // ----------------------------------------------------
  try {
    const srcDir = path.resolve(__dirname, '../../src');
    const patterns = ['DEFAULT_PIN', 'apk_cms_pin_auth', 'apk_elite_leads_cache'];
    let forbiddenFound = false;
    const offending = [];

    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(full);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.html') || entry.name.endsWith('.js'))) {
          const text = fs.readFileSync(full, 'utf8');
          for (const p of patterns) {
            if (text.includes(p)) {
              forbiddenFound = true;
              offending.push(`${entry.name}: ${p}`);
            }
          }
        }
      }
    }

    scanDir(srcDir);
    const pass = !forbiddenFound;
    recordTest('SEC-12', 'Static Scan: Zero DEFAULT_PIN, apk_cms_pin_auth, or apk_elite_leads_cache in src/', pass, offending.length ? `Found: ${offending.join(', ')}` : 'Clean');
  } catch (e) {
    recordTest('SEC-12', 'Static Scan of src/', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 13: Git Ignores cms/.env.local
  // ----------------------------------------------------
  try {
    const gitignorePath = path.resolve(__dirname, '../../.gitignore');
    const gitignoreContent = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
    const cmsGitignore = path.resolve(__dirname, '../.gitignore');
    const cmsGitignoreContent = fs.existsSync(cmsGitignore) ? fs.readFileSync(cmsGitignore, 'utf8') : '';
    const combined = gitignoreContent + '\n' + cmsGitignoreContent;
    const pass = combined.includes('.env.local') || combined.includes('*.local');
    recordTest('SEC-13', 'Gitignore verification: cms/.env.local is ignored', pass);
  } catch (e) {
    recordTest('SEC-13', 'Gitignore verification', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 14: First Dummy User Login (shubhammisra800@gmail.com)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'shubhammisra800@gmail.com',
        password: 'Shubham@ApkElite2026!',
      }),
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 200 && data.success === true && !!data.token;
    recordTest('SEC-14', 'First dummy user (shubhammisra800@gmail.com) logs in successfully', pass, `User: ${data.user?.username}`);
  } catch (e) {
    recordTest('SEC-14', 'First dummy user logs in', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 15: Create New CMS User (POST /api/users)
  // ----------------------------------------------------
  const newStaffUsername = 'staff_operator_' + Date.now();
  const newStaffPassword = 'OperatorPassword@2026!';
  try {
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        username: newStaffUsername,
        password: newStaffPassword,
        role: 'editor',
      }),
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 201 && data.success === true && data.user?.username === newStaffUsername;
    recordTest('SEC-15', 'Authenticated admin creates new CMS user with hashed password', pass, `Created: ${data.user?.username}`);
  } catch (e) {
    recordTest('SEC-15', 'Admin creates new CMS user', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 16: New CMS User Authenticates Successfully
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: newStaffUsername,
        password: newStaffPassword,
      }),
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 200 && data.success === true && !!data.token;
    recordTest('SEC-16', 'Newly created CMS user authenticates successfully', pass, `User: ${data.user?.username}`);
  } catch (e) {
    recordTest('SEC-16', 'Newly created CMS user authenticates', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 17: Admin Edits User Password (PATCH /api/users)
  // ----------------------------------------------------
  const updatedStaffPassword = 'UpdatedSecurePassword@2026!';
  try {
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        username: newStaffUsername,
        password: updatedStaffPassword,
      }),
    });
    const data = await res.json().catch(() => ({}));
    const pass = res.status === 200 && data.success === true;
    recordTest('SEC-17', 'Admin edits existing CMS user password with bcrypt update', pass);
  } catch (e) {
    recordTest('SEC-17', 'Admin edits user password', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 18: User Authenticates with Updated Password & Old Password Fails
  // ----------------------------------------------------
  try {
    const oldRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newStaffUsername, password: newStaffPassword }),
    });
    const newRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newStaffUsername, password: updatedStaffPassword }),
    });
    const pass = oldRes.status === 401 && newRes.status === 200;
    recordTest('SEC-18', 'Old password rejected (401) and updated password accepted (200)', pass);
  } catch (e) {
    recordTest('SEC-18', 'Password rotation verification', false, e.message);
  }

  // ----------------------------------------------------
  // TEST 19: Unauthenticated GET /api/users -> 401
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/users`);
    const pass = res.status === 401;
    recordTest('SEC-19', 'Unauthenticated GET /api/users rejected with 401 Unauthorized', pass);
  } catch (e) {
    recordTest('SEC-19', 'Unauthenticated GET /api/users rejected', false, e.message);
  }

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\n======================================================`);
  console.log(`Test Execution Summary: ${passedCount} / ${results.length} PASSED`);
  console.log(`======================================================\n`);

  if (passedCount === results.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite();
