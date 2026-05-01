const https = require('https');
const querystring = require('querystring');

const STRIPE_SK = process.env.STRIPE_SK;
const SUPABASE_URL = 'https://tsweacifoxqpphvnwire.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

function stripePost(path, data) {
  return new Promise((resolve, reject) => {
    const body = querystring.stringify(data);
    const opts = {
      hostname: 'api.stripe.com',
      path: `/v1/${path}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SK}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function supabaseGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'tsweacifoxqpphvnwire.supabase.co',
      path: `/rest/v1/${path}`,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!STRIPE_SK) return res.status(500).json({ error: 'STRIPE_SK nicht gesetzt' });

  let body = req.body;
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(typeof body === 'string' ? body : '{}'); } catch(e) { body = {}; }
  }

  const { userId } = body;
  if (!userId) return res.status(400).json({ error: 'userId fehlt' });

  try {
    // Stripe Customer ID aus Supabase holen
    const subs = await supabaseGet(`subscriptions?user_id=eq.${userId}&select=stripe_customer_id&limit=1`);
    const customerId = subs?.[0]?.stripe_customer_id;
    if (!customerId) return res.status(404).json({ error: 'Kein Stripe-Kunde gefunden' });

    // Portal Session erstellen
    const session = await stripePost('billing_portal/sessions', {
      customer: customerId,
      return_url: 'https://lumedent.de/app.html'
    });

    if (session.error) return res.status(400).json({ error: session.error.message });
    return res.status(200).json({ url: session.url });

  } catch(err) {
    console.error('Portal Fehler:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
