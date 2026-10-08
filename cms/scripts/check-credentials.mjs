import bcrypt from './node_modules/bcryptjs/dist/bcrypt.js';
const hash = process.env.ADMIN_PASSWORD_HASH;

console.log('=== CMS Credential Check ===');
console.log('Username :', process.env.ADMIN_USERNAME || 'admin');
console.log('Hash     :', hash ? hash.substring(0, 29) + '...' : 'NOT SET');
console.log('Hash valid bcrypt format:', hash && (hash.startsWith('$2b$') || hash.startsWith('$2a$')));
console.log('Bcrypt cost factor      :', hash ? parseInt(hash.split('$')[2]) : 'N/A');
console.log('');

const testPasswords = [
  'admin', 'admin123', 'Admin123', 'Admin@123', 'Admin@1234',
  'apk123', 'APK@2024', 'APK@2025', 'APK@2026',
  'password', 'Password@1', 'apkelite', 'ApkElite@1',
  'Apkelite@1', 'ApkElite123', 'ApkElite@123',
  'Admin2024', 'Admin2025', 'Admin2026',
];

console.log('Testing', testPasswords.length, 'common passwords...');

Promise.all(testPasswords.map(async p => {
  const match = await bcrypt.compare(p, hash);
  if (match) console.log('\n✅ MATCH FOUND => Password is:', p);
  return { p, match };
})).then(results => {
  const found = results.find(r => r.match);
  if (!found) {
    console.log('❌ No match in common list — password is custom/strong (good).');
    console.log('\nTo reset password, run:');
    console.log("  node -e \"console.log(require('./node_modules/bcryptjs').hashSync('YourNewPassword!', 10))\"");
    console.log('Then update ADMIN_PASSWORD_HASH in cms/.env.local');
  }
});
