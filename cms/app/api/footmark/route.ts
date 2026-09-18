import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Footmark from '@/models/Footmark';
import { saveFallbackFootmark, getFallbackFootmarkStats } from '@/lib/fallback-store';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // In case of beacon with text/plain body
      const raw = await req.text();
      body = JSON.parse(raw || '{}');
    }

    const footmarkData = {
      visitorId: body.visitorId || 'vis_' + Math.random().toString(36).substring(2, 8),
      sessionId: body.sessionId || 'sess_' + Math.random().toString(36).substring(2, 8),
      path: body.path || '/',
      pageTitle: body.pageTitle || 'APK Elite Services',
      referrer: body.referrer || 'Direct',
      device: body.device || 'mobile',
      browser: body.browser || 'Chrome',
      os: body.os || 'Android',
      city: body.city || 'Pune',
      ip: body.ip || 'anonymous',
      userAgent: body.userAgent || '',
    };

    try {
      await connectToDatabase();
      const newFootmark = await Footmark.create(footmarkData);
      return NextResponse.json(
        { success: true, source: 'mongodb', footmarkId: newFootmark._id },
        { headers: corsHeaders }
      );
    } catch {
      const fallback = saveFallbackFootmark(footmarkData);
      return NextResponse.json(
        { success: true, source: 'local_store', footmarkId: fallback._id },
        { headers: corsHeaders }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to record footmark' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
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
