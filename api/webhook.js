const https = require('https');
const querystring = require('querystring');
const crypto = require('crypto');

const STRIPE_SK = process.env.STRIPE_SK || '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';
const SUPABASE_URL = 'https://tsweacifoxqpphvnwire.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

function supabaseUpsert(table, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: 'tsweacifoxqpphvnwire.supabase.co',
      path: `/rest/v1/${table}`,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY || process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY || process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  
  let event;
  try {
    event = req.body;
  } catch (err) {
    return res.status(400).send('Webhook error');
  }

  const obj = event.data?.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      const userId = obj.metadata?.user_id;
      const plan = obj.metadata?.plan;
      const customerId = obj.customer;
      const subId = obj.subscription;
      
      if (userId) {
        await supabaseUpsert('subscriptions', {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subId,
          plan: plan,
          status: 'trialing',
          trial_end: new Date(Date.now() + 14*24*60*60*1000).toISOString()
        });
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subId = obj.id;
      const status = obj.status;
      const periodEnd = obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null;
      
      await supabaseUpsert('subscriptions', {
        stripe_subscription_id: subId,
        status: status,
        current_period_end: periodEnd
      });
      break;
    }
  }

  res.status(200).json({ received: true });
};
