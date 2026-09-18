const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB || 'apk_elite_services';
const COLLECTION_NAME = 'footmarks';

let cachedDb = null;

async function getDb() {
  if (!MONGODB_URI) return null;
  if (cachedDb) return cachedDb;
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
    await client.connect();
    cachedDb = client.db(DB_NAME);
    return cachedDb;
  } catch (err) {
    console.warn('MongoDB connection failed for footmarks:', err.message);
    return null;
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

// In-memory fallback if MongoDB is not connected
let inMemoryFootmarks = [
  {
    _id: 'foot_net_1',
    visitorId: 'vis_wakad_891',
    sessionId: 'sess_1',
    path: '/',
    pageTitle: 'APK Elite Services | Professional Cleaning in Pune',
    referrer: 'Google Search',
    device: 'mobile',
    browser: 'Chrome Mobile',
    os: 'Android',
    city: 'Wakad, Pune',
    createdAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    _id: 'foot_net_2',
    visitorId: 'vis_wakad_891',
    sessionId: 'sess_1',
    path: '/services/deep-cleaning',
    pageTitle: 'Home Deep Cleaning Services in Pune',
    referrer: 'Direct',
    device: 'mobile',
    browser: 'Chrome Mobile',
    os: 'Android',
    city: 'Wakad, Pune',
    createdAt: new Date(Date.now() - 180000).toISOString(),
  },
  {
    _id: 'foot_net_3',
    visitorId: 'vis_baner_442',
    sessionId: 'sess_2',
    path: '/services/sofa-cleaning',
    pageTitle: 'Professional Sofa & Carpet Shampooing Pune',
    referrer: 'WhatsApp',
    device: 'mobile',
    browser: 'Safari',
    os: 'iOS',
    city: 'Baner, Pune',
    createdAt: new Date(Date.now() - 900000).toISOString(),
  }
];

function getInMemoryStats() {
  const totalFootmarks = inMemoryFootmarks.length;
  const uniqueVisitorSet = new Set(inMemoryFootmarks.map((f) => f.visitorId));
  const uniqueVisitors = uniqueVisitorSet.size;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFootmarksList = inMemoryFootmarks.filter((f) => f.createdAt.startsWith(todayStr));
  const todayFootmarks = todayFootmarksList.length;
  const todayUniqueVisitors = new Set(todayFootmarksList.map((f) => f.visitorId)).size;

  const pageMap = {};
  inMemoryFootmarks.forEach((f) => {
    if (!pageMap[f.path]) {
      pageMap[f.path] = { count: 0, title: f.pageTitle || f.path };
    }
    pageMap[f.path].count++;
  });
  const topPages = Object.entries(pageMap)
    .map(([path, data]) => ({
      path,
      title: data.title,
      count: data.count,
      percentage: totalFootmarks > 0 ? Math.round((data.count / totalFootmarks) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  inMemoryFootmarks.forEach((f) => {
    const dev = (f.device || 'mobile').toLowerCase();
    if (deviceCounts[dev] !== undefined) deviceCounts[dev]++;
    else deviceCounts.mobile++;
  });

  const refMap = {};
  inMemoryFootmarks.forEach((f) => {
    const ref = f.referrer || 'Direct';
    refMap[ref] = (refMap[ref] || 0) + 1;
  });
  const topReferrers = Object.entries(refMap)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    totalFootmarks,
    uniqueVisitors,
    todayFootmarks,
    todayUniqueVisitors,
    topPages,
    deviceCounts,
    topReferrers,
    recentFootmarks: inMemoryFootmarks.slice(0, 50),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const db = await getDb();

  try {
    if (event.httpMethod === 'POST') {
      let body = {};
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        body = {};
      }

      const rawPath = (body.path || '/').split('?')[0].replace(/\/$/, '') || '/';
      if (rawPath === '/cms' || rawPath.startsWith('/cms/')) {
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: true, ignored: 'cms_internal' }),
        };
      }

      const footmarkData = {
        visitorId: body.visitorId || 'vis_' + Math.random().toString(36).substring(2, 8),
        sessionId: body.sessionId || 'sess_' + Math.random().toString(36).substring(2, 8),
        path: rawPath,
        pageTitle: body.pageTitle || 'APK Elite Services',
        referrer: body.referrer || 'Direct',
        device: body.device || 'mobile',
        browser: body.browser || 'Chrome',
        os: body.os || 'Android',
        city: body.city || 'Pune',
        visitCount: body.visitCount || 1,
        isReturning: Boolean(body.isReturning),
        landingPage: body.landingPage || rawPath,
        initialReferrer: body.initialReferrer || body.referrer || 'Direct',
        utmSource: body.utmSource || null,
        utmCampaign: body.utmCampaign || null,
        gclid: body.gclid || null,
        screenResolution: body.screenResolution || null,
        ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'anonymous',
        userAgent: event.headers['user-agent'] || '',
        createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      };

      if (db) {
        const col = db.collection(COLLECTION_NAME);
        const result = await col.insertOne(footmarkData);
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: true, source: 'mongodb', footmarkId: result.insertedId }),
        };
      }

      const memoryRecord = { 
        ...footmarkData, 
        _id: 'foot_mem_' + Date.now(), 
        createdAt: footmarkData.createdAt.toISOString() 
      };
      inMemoryFootmarks.unshift(memoryRecord);
      if (inMemoryFootmarks.length > 500) inMemoryFootmarks = inMemoryFootmarks.slice(0, 500);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, source: 'in-memory', footmarkId: memoryRecord._id }),
      };
    }

    if (event.httpMethod === 'GET') {
      if (db) {
        const col = db.collection(COLLECTION_NAME);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [
          totalFootmarks,
          todayFootmarks,
          allVisitors,
          todayVisitors,
          pageAgg,
          deviceAgg,
          referrerAgg,
          recentFootmarks,
        ] = await Promise.all([
          col.countDocuments(),
          col.countDocuments({ createdAt: { $gte: startOfToday } }),
          col.distinct('visitorId'),
          col.distinct('visitorId', { createdAt: { $gte: startOfToday } }),
          col.aggregate([
            { $group: { _id: '$path', title: { $first: '$pageTitle' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ]).toArray(),
          col.aggregate([
            { $group: { _id: '$device', count: { $sum: 1 } } },
          ]).toArray(),
          col.aggregate([
            { $group: { _id: '$referrer', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 6 },
          ]).toArray(),
          col.find().sort({ createdAt: -1 }).limit(50).toArray(),
        ]);

        const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
        deviceAgg.forEach((d) => {
          const dev = (d._id || 'mobile').toLowerCase();
          if (deviceCounts[dev] !== undefined) deviceCounts[dev] = d.count;
          else deviceCounts.mobile += d.count;
        });

        const topPages = pageAgg.map((p) => ({
          path: p._id || '/',
          title: p.title || p._id || 'APK Elite Services',
          count: p.count,
          percentage: totalFootmarks > 0 ? Math.round((p.count / totalFootmarks) * 100) : 0,
        }));

        const topReferrers = referrerAgg.map((r) => ({
          referrer: r._id || 'Direct',
          count: r.count,
        }));

        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            source: 'mongodb',
            stats: {
              totalFootmarks,
              uniqueVisitors: allVisitors.length,
              todayFootmarks,
              todayUniqueVisitors: todayVisitors.length,
              topPages,
              deviceCounts,
              topReferrers,
              recentFootmarks,
            },
          }),
        };
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          source: 'in-memory-fallback',
          stats: getInMemoryStats(),
        }),
      };
    }

    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  } catch (err) {
    console.error('Footmark handler error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
