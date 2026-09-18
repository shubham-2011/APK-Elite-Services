const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB || 'apk_elite_services';
const COLLECTION_NAME = 'leads';

// Cache MongoDB connection across serverless invocations
let cachedClient = null;
let cachedDb = null;

// In-memory fallback if MongoDB is not configured
let inMemoryLeads = [];

async function getDb() {
  if (!MONGODB_URI) {
    return null;
  }
  if (cachedDb) {
    return cachedDb;
  }
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    await client.connect();
    cachedClient = client;
    cachedDb = client.db(DB_NAME);
    return cachedDb;
  } catch (err) {
    console.warn('MongoDB connection failed, falling back to memory store:', err.message);
    return null;
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

/**
 * Real-Time Lead Notification Dispatcher: Telegram, Webhook, and Fail-Safe Email
 */
async function dispatchLeadAlert(lead) {
  const promises = [];

  // 1. Telegram Bot Notification (Instant phone push alert to business owner)
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChatId) {
    const text = [
      '🔔 *NEW LEAD RECEIVED — APK ELITE SERVICES*',
      '━━━━━━━━━━━━━━━━━━━━━━━━━',
      `👤 *Name:* ${lead.name}`,
      `📞 *Phone:* +91 ${lead.phone}`,
      lead.email ? `📧 *Email:* ${lead.email}` : null,
      `🧹 *Service:* ${lead.service}${lead.propertyType ? ' (' + lead.propertyType + ')' : ''}`,
      lead.locality ? `📍 *Locality:* ${lead.locality}` : null,
      lead.utm_source ? `📢 *Source:* ${lead.utm_source}${lead.utm_medium ? ' / ' + lead.utm_medium : ''}` : null,
      lead.utm_campaign ? `🎯 *Campaign:* ${lead.utm_campaign}` : null,
      lead.gclid ? '⭐ *Google Ads Verified:* Yes' : null,
      lead.visit_count && lead.visit_count > 1 ? `🔁 *Repeat Visitor:* Visit #${lead.visit_count}` : null,
      lead.landing_page ? `🚪 *Entry:* ${lead.landing_page}` : null,
      lead.message ? `💬 *Message:* ${lead.message}` : null,
      '━━━━━━━━━━━━━━━━━━━━━━━━━',
      `⏰ *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
    ].filter(Boolean).join('\n');

    promises.push(
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: text,
          parse_mode: 'Markdown'
        })
      }).catch(err => console.warn('Telegram lead notification failed:', err.message))
    );
  }

  // 2. Generic CRM / Discord / Slack Webhook
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (webhookUrl) {
    promises.push(
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new_lead',
          company: 'APK Elite Services',
          timestamp: new Date().toISOString(),
          lead: lead
        })
      }).catch(err => console.warn('CRM lead webhook failed:', err.message))
    );
  }

  // 3. Web3Forms Direct Fail-Safe Email Alert to info@apkeliteservices.in
  const web3Key = process.env.WEB3FORMS_ACCESS_KEY || '101e2c51-0926-4dd3-b6e5-a04034ecca39';
  if (web3Key) {
    const emailBody = {
      access_key: web3Key,
      subject: `New Lead: ${lead.name} (${lead.service} - ${lead.locality || 'Pune'})`,
      from_name: 'APK Elite Ingestion Engine',
      name: lead.name,
      phone: lead.phone,
      email: lead.email || 'info@apkeliteservices.in',
      service: lead.service,
      locality: lead.locality || 'Pune',
      property: lead.propertyType || 'N/A',
      campaign: lead.utm_campaign || lead.utm_source || 'Organic',
      message: lead.message || 'Direct lead form submission.',
      source: lead.source || 'Website'
    };
    promises.push(
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailBody)
      }).catch(err => console.warn('Web3Forms lead email failed:', err.message))
    );
  }

  await Promise.allSettled(promises);
}

exports.handler = async (event, context) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  const db = await getDb();
  const path = event.path || '';

  try {
    // -------------------------------------------------------------
    // GET: List all leads or single lead
    // -------------------------------------------------------------
    if (event.httpMethod === 'GET') {
      if (db) {
        const collection = db.collection(COLLECTION_NAME);
        const leads = await collection.find({}).sort({ createdAt: -1 }).limit(200).toArray();
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            source: 'mongodb',
            leads: leads.map((l) => ({
              ...l,
              _id: l._id.toString(),
            })),
          }),
        };
      } else {
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            source: 'in-memory-fallback',
            leads: inMemoryLeads,
          }),
        };
      }
    }

    // -------------------------------------------------------------
    // POST: Create a new lead
    // -------------------------------------------------------------
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
      if (!body.name || !body.phone) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: 'Name and Phone are required' }),
        };
      }

      const newLead = {
        name: String(body.name).trim(),
        phone: String(body.phone).trim(),
        email: body.email ? String(body.email).trim() : '',
        service: body.service || 'Deep Cleaning',
        locality: body.locality || 'Pune',
        propertyType: body.propertyType || '',
        message: body.message || '',
        source: body.source || 'Quote Modal',
        status: 'NEW',
        notes: [],
        utm_source: body.utm_source || null,
        utm_medium: body.utm_medium || null,
        utm_campaign: body.utm_campaign || null,
        utm_term: body.utm_term || null,
        utm_content: body.utm_content || null,
        gclid: body.gclid || null,
        landing_page: body.landing_page || null,
        initial_referrer: body.initial_referrer || null,
        visitor_id: body.visitor_id || null,
        visit_count: body.visit_count || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let savedLead;
      if (db) {
        const collection = db.collection(COLLECTION_NAME);
        const result = await collection.insertOne(newLead);
        savedLead = { ...newLead, _id: result.insertedId.toString() };
      } else {
        savedLead = {
          ...newLead,
          _id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        };
        inMemoryLeads.unshift(savedLead);
      }

      // Dispatch real-time alert (Telegram, Webhook, and Fail-Safe Email)
      await dispatchLeadAlert(savedLead);

      return {
        statusCode: 201,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          source: db ? 'mongodb' : 'in-memory-fallback',
          lead: savedLead,
        }),
      };
    }

    // -------------------------------------------------------------
    // PATCH / PUT: Update lead status or add notes
    // -------------------------------------------------------------
    if (event.httpMethod === 'PATCH' || event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const leadId = body.id || (event.queryStringParameters && event.queryStringParameters.id);

      if (!leadId) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: 'Lead ID is required for update' }),
        };
      }

      const updateFields = {
        updatedAt: new Date().toISOString(),
      };
      if (body.status) updateFields.status = body.status;
      if (body.note) {
        // Appending note
        const noteObj = {
          note: body.note,
          author: body.author || 'Admin',
          createdAt: new Date().toISOString(),
        };
        if (db) {
          try {
            const collection = db.collection(COLLECTION_NAME);
            await collection.updateOne(
              { _id: new ObjectId(leadId) },
              { $push: { notes: noteObj }, $set: updateFields }
            );
          } catch (e) {
            console.error('Mongo note update error:', e);
          }
        } else {
          const lead = inMemoryLeads.find((l) => l._id === leadId);
          if (lead) {
            lead.notes = lead.notes || [];
            lead.notes.push(noteObj);
            lead.updatedAt = updateFields.updatedAt;
          }
        }
      }

      if (db && body.status) {
        try {
          const collection = db.collection(COLLECTION_NAME);
          await collection.updateOne(
            { _id: new ObjectId(leadId) },
            { $set: updateFields }
          );
        } catch (e) {
          console.error('Mongo status update error:', e);
        }
      } else if (body.status) {
        const lead = inMemoryLeads.find((l) => l._id === leadId);
        if (lead) {
          lead.status = body.status;
          lead.updatedAt = updateFields.updatedAt;
        }
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, message: 'Lead updated' }),
      };
    }

    // -------------------------------------------------------------
    // DELETE: Delete lead
    // -------------------------------------------------------------
    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      const leadId = body.id || (event.queryStringParameters && event.queryStringParameters.id);

      if (!leadId) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: 'Lead ID is required' }),
        };
      }

      if (db) {
        try {
          const collection = db.collection(COLLECTION_NAME);
          await collection.deleteOne({ _id: new ObjectId(leadId) });
        } catch (e) {
          console.error('Mongo delete error:', e);
        }
      } else {
        inMemoryLeads = inMemoryLeads.filter((l) => l._id !== leadId);
      }

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, message: 'Lead deleted' }),
      };
    }

    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  } catch (err) {
    console.error('Handler error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
