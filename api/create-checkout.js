const https = require('https');
const querystring = require('querystring');

const STRIPE_SK = process.env.STRIPE_SK;

function stripePost(path, data) {
  return new Promise((resolve, reject) => {
    const body = querystring.stringify(data);
    const options = {
      hostname: 'api.stripe.com',
      path: `/v1/${path}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SK}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Parse error: ' + data)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Parse raw body manually
function getRawBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let parsed;
  try {
    // Try req.body first (if already parsed), else parse raw
    if (req.body && typeof req.body === 'object') {
      parsed = req.body;
    } else {
      const raw = typeof req.body === 'string' ? req.body : await getRawBody(req);
      parsed = JSON.parse(raw);
    }
  } catch(e) {
    return res.status(400).json({ error: 'Invalid body: ' + e.message });
  }

  const { priceId, userId, email, plan } = parsed;

  if (!priceId || !userId || !email) {
    return res.status(400).json({ error: 'Missing required fields: priceId, userId, email' });
  }

  try {
    // Stripe Customer erstellen
    const customer = await stripePost('customers', {
      email,
      'metadata[user_id]': userId,
      'metadata[plan]': plan || 'solo'
    });

    if (customer.error) {
      return res.status(400).json({ error: 'Stripe customer error: ' + customer.error.message });
    }

    // Checkout Session mit 14 Tage Trial
    const session = await stripePost('checkout/sessions', {
      customer: customer.id,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      'subscription_data[trial_period_days]': '14',
      success_url: 'https://lumedent.de/app.html?checkout=success',
      cancel_url: 'https://lumedent.de/auth.html',
      'metadata[user_id]': userId,
      'metadata[plan]': plan || 'solo',
      payment_method_collection: 'always',
    });

    if (session.error) {
      return res.status(400).json({ error: 'Stripe session error: ' + session.error.message });
    }

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
