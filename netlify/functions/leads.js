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
      const body = JSON.parse(event.body || '{}');
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (db) {
        const collection = db.collection(COLLECTION_NAME);
        const result = await collection.insertOne(newLead);
        return {
          statusCode: 201,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            source: 'mongodb',
            lead: { ...newLead, _id: result.insertedId.toString() },
          }),
        };
      } else {
        const fallbackLead = {
          ...newLead,
          _id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        };
        inMemoryLeads.unshift(fallbackLead);
        return {
          statusCode: 201,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            source: 'in-memory-fallback',
            lead: fallbackLead,
          }),
        };
      }
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
