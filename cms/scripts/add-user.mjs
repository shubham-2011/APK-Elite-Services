/**
 * CLI Tool: Add New User to APK Elite CMS
 * Usage:
 *   node cms/scripts/add-user.mjs <username> <password> [role]
 * Example:
 *   node cms/scripts/add-user.mjs rohit@apkeliteservices.in Rohit@ApkElite2026! admin
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cmsRoot = path.resolve(__dirname, '..');

const bcryptPath = path.join(cmsRoot, 'node_modules/bcryptjs/index.js');
const bcrypt = (await import(pathToFileURL(bcryptPath).href)).default;

const args = process.argv.slice(2);
const usernameInput = args[0];
const passwordInput = args[1];
const roleInput = args[2] || 'admin';

if (!usernameInput || !passwordInput) {
  console.log('\n❌ Usage: node cms/scripts/add-user.mjs <username> <password> [role]');
  console.log('   Example: node cms/scripts/add-user.mjs operator@apkeliteservices.in Operator@2026! editor\n');
  process.exit(1);
}

const username = usernameInput.trim().toLowerCase();
if (username.length < 3) {
  console.error('❌ Username must be at least 3 characters.');
  process.exit(1);
}

if (passwordInput.length < 8) {
  console.error('❌ Password must be at least 8 characters long.');
  process.exit(1);
}

const usersFile = path.join(cmsRoot, 'data/users.json');
let users = [];

if (fs.existsSync(usersFile)) {
  try {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch {
    users = [];
  }
}

const existing = users.find(u => u.username.toLowerCase() === username);
if (existing) {
  console.error(`\n⚠️ User "${username}" already exists!`);
  console.log('To update password, run with different script or use the CMS dashboard.\n');
  process.exit(1);
}

const passwordHash = bcrypt.hashSync(passwordInput, 10);
const now = new Date().toISOString();
const newUser = {
  _id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
  username,
  passwordHash,
  role: roleInput === 'editor' ? 'editor' : 'admin',
  createdAt: now,
  updatedAt: now,
};

users.push(newUser);
fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');

console.log(`\n✅ USER CREATED SUCCESSFULLY!`);
console.log(`===============================================`);
console.log(`   Username:  ${newUser.username}`);
console.log(`   Password:  ${passwordInput}`);
console.log(`   Role:      ${newUser.role}`);
console.log(`   Stored in: cms/data/users.json`);
console.log(`===============================================\n`);

