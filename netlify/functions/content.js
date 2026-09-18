const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB || 'apk_elite_services';
const COLLECTION_NAME = 'site_content';

let cachedDb = null;

const DEFAULT_CONTENT = {
  companyName: 'APK Elite Services',
  phone: '+91 88301 67863',
  whatsapp: '918830167863',
  email: 'info@apkeliteservices.in',
  address: 'Shop No 4, Datta Mandir Rd, Wakad, Pune, Maharashtra 411057',
  businessHours: 'Mon - Sun: 8:00 AM - 9:00 PM',
  promoBanner: {
    enabled: true,
    text: 'Festival Offer: Get Flat 15% OFF on Home Deep Cleaning in Pune!',
    discountPercent: 15,
  },
  formConfig: {
    modalTitle: 'Request a Free Service Quote',
    modalSubtitle: 'Fill out your details below to send a quote request directly to our team.',
    localities: [
      'Baner',
      'Wakad',
      'Hinjewadi',
      'Kharadi',
      'Viman Nagar',
      'Kothrud',
      'Aundh',
      'Hadapsar',
      'Bavdhan',
      'Pimple Saudagar',
      'Pimpri-Chinchwad',
      'Magarpatta',
      'Other Area',
    ],
    services: [
      'Deep Cleaning',
      'Sofa Cleaning',
      'Office Cleaning',
      'Post Construction Cleaning',
      'Water Tank Cleaning',
      'Pest Control',
      'Floor Polishing',
      'Facade Cleaning',
      'Carpet Cleaning',
      'Sanitization',
    ],
    propertyTypes: ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK / Villa', 'Office / Commercial', 'Other'],
  },
  pricing: [
    { service: 'Deep Cleaning (1 BHK)', startingPrice: 2499, unit: 'per flat', active: true },
    { service: 'Deep Cleaning (2 BHK)', startingPrice: 3499, unit: 'per flat', active: true },
    { service: 'Deep Cleaning (3 BHK)', startingPrice: 4499, unit: 'per flat', active: true },
    { service: 'Sofa Shampooing', startingPrice: 799, unit: 'per 3-seater', active: true },
    { service: 'Carpet Shampooing', startingPrice: 999, unit: 'per room', active: true },
    { service: 'Office Cleaning', startingPrice: 1999, unit: 'starting from', active: true },
    { service: 'Pest Control', startingPrice: 1199, unit: 'starting from', active: true },
  ],
  showcase: {
    heading: 'Recent Cleaning Projects in Pune',
    subheading: 'Explore recent residential and commercial cleaning work completed by our trained in-house team across Pune & PCMC.',
    projects: [
      {
        title: '3BHK Vacant Apartment Deep Clean',
        location: 'Baner, Pune',
        category: 'Deep Cleaning',
        imageUrl: '/assets/images/deep-clean.webp',
        description: 'Complete floor scrubbing, kitchen degreasing, bathroom descaling & balcony pressure washing.'
      },
      {
        title: '7-Seater Fabric Sofa Shampooing',
        location: 'Wakad, Pune',
        category: 'Sofa Cleaning',
        imageUrl: '/assets/images/Sofacleaning.webp',
        description: 'Deep foam injection & extraction to remove tough stains, dust & odor from living room sofa.'
      },
      {
        title: 'Corporate Office Carpet & Janitorial',
        location: 'Kharadi (EON IT Park), Pune',
        category: 'Office Cleaning',
        imageUrl: '/assets/images/office-clean.webp',
        description: 'Overnight office sanitization, carpet steam extraction & workstation sanitization.'
      }
    ]
  }
};

let inMemoryContent = { ...DEFAULT_CONTENT };

async function getDb() {
  if (!MONGODB_URI) return null;
  if (cachedDb) return cachedDb;
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
    await client.connect();
    cachedDb = client.db(DB_NAME);
    return cachedDb;
  } catch (err) {
    console.warn('MongoDB connection failed for content:', err.message);
    return null;
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const db = await getDb();

  try {
    if (event.httpMethod === 'GET') {
      if (db) {
        const collection = db.collection(COLLECTION_NAME);
        const doc = await collection.findOne({ key: 'global_site_config' });
        if (doc && doc.content) {
          return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: true, source: 'mongodb', content: doc.content }),
          };
        }
      }
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, source: 'in-memory-fallback', content: inMemoryContent }),
      };
    }

    if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const updatedContent = body.content || body;

      if (db) {
        const collection = db.collection(COLLECTION_NAME);
        await collection.updateOne(
          { key: 'global_site_config' },
          { $set: { content: updatedContent, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      }
      inMemoryContent = updatedContent;

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, message: 'Content updated successfully', content: updatedContent }),
      };
    }

    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (err) {
    console.error('Content handler error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
