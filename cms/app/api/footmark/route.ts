import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Footmark from '@/models/Footmark';
import { saveFallbackFootmark, getFallbackFootmarkStats } from '@/lib/fallback-store';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth';
import { sanitizeString } from '@/lib/security';
import { getAdminCorsHeaders, publicCorsHeaders } from '@/lib/cors';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: publicCorsHeaders });
}

// -------------------------------------------------------------
// POST /api/footmark - Public Visitor Analytics Beacon
// -------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      const raw = await req.text();
      body = JSON.parse(raw || '{}');
    }

    const footmarkData = {
      visitorId: sanitizeString(body.visitorId || 'vis_' + Math.random().toString(36).substring(2, 8), 64),
      sessionId: sanitizeString(body.sessionId || 'sess_' + Math.random().toString(36).substring(2, 8), 64),
      path: sanitizeString(body.path || '/', 255),
      pageTitle: sanitizeString(body.pageTitle || 'APK Elite Services', 150),
      referrer: sanitizeString(body.referrer || 'Direct', 150),
      device: sanitizeString(body.device || 'mobile', 30),
      browser: sanitizeString(body.browser || 'Chrome', 50),
      os: sanitizeString(body.os || 'Android', 50),
      city: sanitizeString(body.city || 'Pune', 80),
      ip: 'anonymous', // Do not store raw IP to respect privacy
      userAgent: sanitizeString(body.userAgent || '', 300),
    };

    try {
      await connectToDatabase();
      const newFootmark = await Footmark.create(footmarkData);
      return NextResponse.json(
        { success: true, source: 'mongodb', footmarkId: newFootmark._id },
        { headers: publicCorsHeaders }
      );
    } catch {
      const fallback = saveFallbackFootmark(footmarkData as any);
      return NextResponse.json(
        { success: true, source: 'local_store', footmarkId: fallback._id },
        { headers: publicCorsHeaders }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to record visitor beacon' },
      { status: 500, headers: publicCorsHeaders }
    );
  }
}

// -------------------------------------------------------------
// GET /api/footmark - Protected Admin Visitor Analytics
// -------------------------------------------------------------
export async function GET(req: NextRequest) {
  const corsHeaders = getAdminCorsHeaders(req.headers.get('origin'));
  // Enforce server-side authentication
  const auth = await verifyAdminSession(req);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error || 'Authentication required to view visitor logs');
  }

  try {
    await connectToDatabase();

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
      Footmark.countDocuments(),
      Footmark.countDocuments({ createdAt: { $gte: startOfToday } }),
      Footmark.distinct('visitorId'),
      Footmark.distinct('visitorId', { createdAt: { $gte: startOfToday } }),
      Footmark.aggregate([
        { $group: { _id: '$path', title: { $first: '$pageTitle' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Footmark.aggregate([
        { $group: { _id: '$device', count: { $sum: 1 } } },
      ]),
      Footmark.aggregate([
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Footmark.find().sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
    deviceAgg.forEach((d) => {
      const dev = (d._id || 'mobile').toLowerCase() as 'mobile' | 'desktop' | 'tablet';
      if (deviceCounts[dev] !== undefined) {
        deviceCounts[dev] = d.count;
      } else {
        deviceCounts.mobile += d.count;
      }
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

    return NextResponse.json(
      {
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
      },
      { headers: corsHeaders }
    );
  } catch (mongoErr) {
    const fallbackStats = getFallbackFootmarkStats();
    return NextResponse.json(
      {
        success: true,
        source: 'local_store',
        stats: fallbackStats,
      },
      { headers: corsHeaders }
    );
  }
}
