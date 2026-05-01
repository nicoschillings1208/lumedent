const https = require('https');
const querystring = require('querystring');

const STRIPE_SK = process.env.STRIPE_SK;

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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Body robust parsen
  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      body = JSON.parse(typeof body === 'string' ? body : '{}');
    } catch(e) {
      body = {};
    }
  }

  const { priceId, userId, email, plan } = body;

  // Debug log
  console.log('Body received:', JSON.stringify({ priceId, userId, email, plan }));
  console.log('STRIPE_SK present:', !!STRIPE_SK);

  if (!STRIPE_SK) {
    return res.status(500).json({ error: 'STRIPE_SK nicht gesetzt in Vercel Environment Variables' });
  }
  if (!priceId || !email) {
    return res.status(400).json({ error: `Fehlende Felder: priceId=${priceId}, email=${email}` });
  }

  try {
    const customer = await stripePost('customers', {
      email,
      'metadata[user_id]': userId || 'unknown',
      'metadata[plan]': plan || 'solo'
    });

    if (customer.error) {
      return res.status(400).json({ error: 'Stripe Customer Fehler: ' + customer.error.message });
    }

    const session = await stripePost('checkout/sessions', {
      customer: customer.id,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      'subscription_data[trial_period_days]': '14',
      success_url: 'https://lumedent.de/app.html?checkout=success',
      cancel_url: 'https://lumedent.de/auth.html',
      'metadata[user_id]': userId || 'unknown',
      payment_method_collection: 'always',
      'automatic_tax[enabled]': 'true',
      'tax_id_collection[enabled]': 'true',
    });

    if (session.error) {
      return res.status(400).json({ error: 'Stripe Session Fehler: ' + session.error.message });
    }

    console.log('Checkout URL:', session.url);
    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch(err) {
    console.error('Fehler:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
