const https = require('https');
const querystring = require('querystring');

const STRIPE_SK = process.env.STRIPE_SK || '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';

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
      res.on('end', () => resolve(JSON.parse(data)));
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

  const { priceId, userId, email, plan } = req.body;

  try {
    // Stripe Customer anlegen
    const customer = await stripePost('customers', {
      email,
      'metadata[user_id]': userId,
      'metadata[plan]': plan
    });

    // Checkout Session mit 14 Tage Trial
    const session = await stripePost('checkout/sessions', {
      customer: customer.id,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      'subscription_data[trial_period_days]': '14',
      success_url: `https://lumedent.de/app.html?checkout=success`,
      cancel_url: `https://lumedent.de/auth.html`,
      'metadata[user_id]': userId,
      'metadata[plan]': plan,
      payment_method_collection: 'always',
    });

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
