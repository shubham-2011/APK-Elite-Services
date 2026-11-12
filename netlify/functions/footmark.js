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
    try {
      await client.connect();
      cachedDb = client.db(DB_NAME);
      return cachedDb;
    } catch (err) {
      await client.close().catch(() => {});
      throw err;
    }
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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const db = await getDb();
  if (!db) {
    return {
      statusCode: 503,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        source: 'mongodb',
        dbConnected: false,
        error: 'Traffic storage is unavailable; this visit was not saved.',
      }),
    };
  }

  try {
    if (event.httpMethod === 'POST') {
      let body = {};
      try {
        let rawBody = event.body || '{}';
        if (event.isBase64Encoded) {
          rawBody = Buffer.from(rawBody, 'base64').toString('utf-8');
        }
        body = JSON.parse(rawBody);
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

      // Detect device from body or fall back to incoming User-Agent header
      let detectedDevice = (body.device || '').toLowerCase();
      const ua = event.headers['user-agent'] || '';
      if (!detectedDevice || (detectedDevice !== 'mobile' && detectedDevice !== 'desktop' && detectedDevice !== 'tablet')) {
        if (/tablet|ipad|playbook|silk/i.test(ua)) detectedDevice = 'tablet';
        else if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) detectedDevice = 'mobile';
        else detectedDevice = 'desktop';
      }

      const footmarkData = {
        visitorId: body.visitorId || 'vis_' + Math.random().toString(36).substring(2, 8),
        sessionId: body.sessionId || 'sess_' + Math.random().toString(36).substring(2, 8),
        path: rawPath,
        pageTitle: body.pageTitle || 'APK Elite Services',
        referrer: body.referrer || 'Direct',
        device: detectedDevice,
        browser: body.browser || 'Browser',
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
        userAgent: ua,
        createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      };

      const col = db.collection(COLLECTION_NAME);
      const result = await col.insertOne(footmarkData);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, source: 'mongodb', dbConnected: true, footmarkId: result.insertedId }),
      };
    }

    if (event.httpMethod === 'GET') {
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
          dbConnected: true,
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
