// Test MongoDB Atlas connection script
// Usage: MONGODB_URI="your_uri" node scripts/test-mongodb.js
// Or create a .env file and run: node scripts/test-mongodb.js

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Simple .env parser if dotenv is not installed
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'apk_elite_services';

if (!uri) {
  console.error('\x1b[31m[ERROR]\x1b[0m MONGODB_URI environment variable is not defined.');
  console.log('Please set MONGODB_URI in your .env file or export it in terminal.');
  console.log('Example: export MONGODB_URI="mongodb+srv://admin:pass@cluster.mongodb.net/apk_elite_services"');
  process.exit(1);
}

async function testConnection() {
  console.log('\x1b[36m[INFO]\x1b[0m Attempting to connect to MongoDB Atlas...');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const db = client.db(dbName);
    console.log('\x1b[32m[SUCCESS]\x1b[0m Connected to MongoDB successfully!');
    console.log(`\x1b[36m[INFO]\x1b[0m Database name: ${dbName}`);

    // Check collections
    const collections = await db.listCollections().toArray();
    console.log(`\x1b[36m[INFO]\x1b[0m Collections found (${collections.length}):`, collections.map(c => c.name).join(', ') || 'None (ready for first insert)');

    // Check leads count
    const leadsCount = await db.collection('leads').countDocuments();
    console.log(`\x1b[32m[STATUS]\x1b[0m Total leads in DB: ${leadsCount}`);

    // Check footmarks count
    const footmarksCount = await db.collection('footmarks').countDocuments();
    console.log(`\x1b[32m[STATUS]\x1b[0m Total visitor footmarks in DB: ${footmarksCount}`);

    console.log('\x1b[32m[READY]\x1b[0m Your MongoDB Atlas is fully configured and ready for live production traffic!');
  } catch (err) {
    console.error('\x1b[31m[FAILED]\x1b[0m MongoDB connection failed:');
    console.error(err.message);
    console.log('\n\x1b[33m[TROUBLESHOOTING]\x1b[0m:');
    console.log('1. Ensure your IP is allowed in Atlas: Network Access -> Add IP -> 0.0.0.0/0');
    console.log('2. Verify username and password are correct.');
    console.log('3. Ensure URL encoding for passwords containing special characters (e.g., @, #, %).');
  } finally {
    await client.close();
  }
}

testConnection();
