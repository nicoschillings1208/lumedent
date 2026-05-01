const https = require('https');

const RESEND_API_KEY = process.env.RESEND_API_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!RESEND_API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY nicht gesetzt' });

  let body = req.body;
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(typeof body === 'string' ? body : '{}'); } catch(e) { body = {}; }
  }

  const { email, message } = body;
  if (!email) return res.status(400).json({ error: 'E-Mail fehlt' });

  const payload = JSON.stringify({
    from: 'LumeDent Website <info@lumedent.de>',
    to: ['info@lumedent.de'],
    reply_to: email,
    subject: 'Neue Kontaktanfrage – LumeDent',
    html: `<p><strong>Von:</strong> ${email}</p><p><strong>Nachricht:</strong><br>${message || '(keine Nachricht)'}</p>`
  });

  return new Promise((resolve) => {
    const req2 = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        if (r.statusCode === 200 || r.statusCode === 201) {
          res.status(200).json({ ok: true });
        } else {
          res.status(500).json({ error: 'Resend Fehler: ' + d });
        }
        resolve();
      });
    });
    req2.on('error', (e) => { res.status(500).json({ error: e.message }); resolve(); });
    req2.write(payload);
    req2.end();
  });
};
