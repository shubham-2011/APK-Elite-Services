import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { getFallbackLeads } from '@/lib/fallback-store';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    await connectToDatabase();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalLeads, todayLeads, statusCounts, localityCounts, serviceCounts] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ createdAt: { $gte: startOfToday } }),
      Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Lead.aggregate([
        { $group: { _id: '$locality', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]),
      Lead.aggregate([
        { $group: { _id: '$service', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]),
    ]);

    const statusMap: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      QUOTE_SENT: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      LOST: 0,
    };

    statusCounts.forEach((item) => {
      if (item._id) statusMap[item._id] = item.count;
    });

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalLeads,
          todayLeads,
          statusMap,
          topLocalities: localityCounts.map((l) => ({ locality: l._id || 'Unknown', count: l.count })),
          topServices: serviceCounts.map((s) => ({ service: s._id || 'General', count: s.count })),
        },
      },
      { headers: corsHeaders }
    );
  } catch (mongoErr) {
    // Fallback calculation
    const leads = getFallbackLeads();
    const statusMap: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      QUOTE_SENT: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      LOST: 0,
    };

    leads.forEach((l) => {
      if (statusMap[l.status] !== undefined) {
        statusMap[l.status]++;
      }
    });

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalLeads: leads.length,
          todayLeads: leads.filter((l) => new Date(l.createdAt).toDateString() === new Date().toDateString()).length,
          statusMap,
          topLocalities: [{ locality: 'Baner', count: 1 }, { locality: 'Wakad', count: 1 }, { locality: 'Hinjewadi', count: 1 }],
          topServices: [{ service: 'Deep Cleaning', count: 1 }, { service: 'Sofa Cleaning', count: 1 }, { service: 'Office Cleaning', count: 1 }],
        },
        source: 'local_store',
      },
      { headers: corsHeaders }
    );
  }
}
