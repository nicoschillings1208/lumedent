const https = require('https');
const crypto = require('crypto');

const STRIPE_SK = process.env.STRIPE_SK;
const SUPABASE_URL = 'https://tsweacifoxqpphvnwire.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY; // In Vercel Environment Variables setzen

const PLAN_NAMES = { solo: 'Solo', praxis: 'Praxis', team: 'Team' };
const PLAN_PRICES = { solo: '49', praxis: '79', team: '149' };

const WELCOME_TEMPLATE = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Willkommen bei LumeDent</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#F0F2F5; font-family:'Helvetica Neue',Arial,sans-serif; padding:40px 16px; }
  .wrap { max-width:560px; margin:0 auto; }
  .card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
  .header { background:#08111F; padding:36px 40px; display:flex; align-items:center; }
  .logo-lume { font-family:Georgia,serif; font-size:26px; font-weight:900; color:#C9A84C; letter-spacing:-0.5px; }
  .logo-dent { font-family:Georgia,serif; font-size:26px; font-weight:300; color:#fff; letter-spacing:2px; }
  .hero { background:linear-gradient(135deg,#0F1E35,#112033); padding:32px 40px; text-align:center; border-bottom:1px solid rgba(201,168,76,0.2); }
  .hero-icon { font-size:52px; margin-bottom:12px; }
  .hero-title { font-size:26px; font-weight:700; color:#fff; margin-bottom:6px; }
  .hero-sub { font-size:14px; color:#6E849E; }
  .body { padding:36px 40px; }
  .text { font-size:15px; color:#4A5568; line-height:1.7; margin-bottom:20px; }
  .booking-box { background:#08111F; border-radius:12px; padding:24px 28px; margin:24px 0; }
  .booking-title { font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#6E849E; margin-bottom:16px; }
  .booking-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.06); }
  .booking-row:last-child { border-bottom:none; padding-bottom:0; }
  .booking-label { font-size:13px; color:#6E849E; }
  .booking-value { font-size:14px; color:#fff; font-weight:600; }
  .booking-value.gold { color:#C9A84C; font-size:18px; }
  .badge { display:inline-block; background:rgba(61,184,122,0.15); color:#3DB87A; font-size:11px; font-weight:700; padding:3px 10px; border-radius:99px; }
  .btn-wrap { text-align:center; margin:28px 0; }
  .btn { display:inline-block; background:#C9A84C; color:#08111F !important; text-decoration:none; font-size:15px; font-weight:700; padding:16px 44px; border-radius:10px; }
  .steps { margin:24px 0; }
  .step { display:flex; gap:14px; margin-bottom:14px; align-items:flex-start; }
  .step-num { width:26px; height:26px; min-width:26px; background:#C9A84C; border-radius:50%; color:#08111F; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; margin-top:2px; }
  .step-text { font-size:14px; color:#4A5568; line-height:1.5; }
  .step-text strong { color:#0F1E35; }
  .divider { border:none; border-top:1px solid #E8ECF0; margin:24px 0; }
  .small { font-size:13px; color:#8A9BB0; line-height:1.6; }
  .small a { color:#C9A84C; text-decoration:none; }
  .legal-note { background:#F7F9FB; border:1px solid #E8ECF0; border-radius:8px; padding:14px 18px; margin-top:20px; }
  .legal-note p { font-size:12px; color:#A0AEC0; line-height:1.7; }
  .legal-note a { color:#C9A84C; text-decoration:none; }
  .footer { background:#F7F9FB; padding:24px 40px; text-align:center; border-top:1px solid #E8ECF0; }
  .footer p { font-size:12px; color:#A0AEC0; line-height:1.8; }
  .footer a { color:#C9A84C; text-decoration:none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">

    <!-- Header -->
    <div class="header">
      <span class="logo-lume">Lume</span><span class="logo-dent">DENT</span>
    </div>

    <!-- Hero -->
    <div class="hero">
      <div class="hero-icon">🎉</div>
      <div class="hero-title">Willkommen bei LumeDent!</div>
      <div class="hero-sub">Deine 14-tägige Testphase hat begonnen</div>
    </div>

    <div class="body">
      <p class="text">
        Schön, dass du dabei bist! Du hast jetzt vollen Zugriff auf LumeDent — den Abrechnungs-Generator für Z1-Komplexe, der dir täglich Zeit spart.
      </p>

      <!-- Buchungsbestätigung -->
      <div class="booking-box">
        <div class="booking-title">📋 Buchungsbestätigung</div>
        <div class="booking-row">
          <span class="booking-label">Paket</span>
          <span class="booking-value gold">{{PLAN_NAME}}</span>
        </div>
        <div class="booking-row">
          <span class="booking-label">Testphase bis</span>
          <span class="booking-value">{{TRIAL_END_DATE}}</span>
        </div>
        <div class="booking-row">
          <span class="booking-label">Preis danach</span>
          <span class="booking-value">{{PLAN_PRICE}} € / Monat zzgl. 19 % MwSt.</span>
        </div>
        <div class="booking-row">
          <span class="booking-label">Abrechnung</span>
          <span class="booking-value">Monatlich, jederzeit kündbar</span>
        </div>
        <div class="booking-row">
          <span class="booking-label">Status</span>
          <span class="badge">✓ Testphase aktiv</span>
        </div>
      </div>

      <!-- CTA Button -->
      <div class="btn-wrap">
        <a href="https://lumedent.de/app.html" class="btn">Jetzt LumeDent öffnen →</a>
      </div>

      <!-- Quick Start -->
      <p class="text" style="margin-bottom:14px;"><strong>So legst du am schnellsten los:</strong></p>
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text"><strong>Zahnschema ausfüllen</strong> — Befunde der Zähne anklicken (F, KR, KE, KU, I, B, WF)</div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text"><strong>Versicherungsart wählen</strong> — GKV / Kasse oder PKV / Privat und Behandlungsfall hinzufügen</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text"><strong>Generieren</strong> — LumeDent erstellt automatisch den vollständigen Abrechnungskomplex</div>
        </div>
      </div>

      <hr class="divider">

      <p class="small">
        <strong>Abo verwalten oder kündigen?</strong> Jederzeit im Profil unter „Abo verwalten" — oder direkt per Mail an <a href="mailto:info@lumedent.de">info@lumedent.de</a>.
      </p>

      <!-- Rechtlicher Hinweis -->
      <div class="legal-note">
        <p>
          Mit dem Abschluss deines Abonnements hast du unseren
          <a href="https://lumedent.de/legal.html#agb">AGB</a> und der
          <a href="https://lumedent.de/legal.html#datenschutz">Datenschutzerklärung</a> zugestimmt.
          Das Widerrufsrecht erlischt bei digitalen Inhalten mit Beginn der Nutzung.
          Rechnungen werden automatisch von Stripe ausgestellt und per E-Mail zugesandt.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        LumeDent · Abrechnungs-Generator für Zahnärzte<br>
        <a href="https://lumedent.de">lumedent.de</a> &nbsp;·&nbsp;
        <a href="mailto:info@lumedent.de">info@lumedent.de</a>
      </p>
      <p style="margin-top:6px;">
        <a href="https://lumedent.de/legal.html#impressum">Impressum</a> &nbsp;·&nbsp;
        <a href="https://lumedent.de/legal.html#datenschutz">Datenschutz</a> &nbsp;·&nbsp;
        <a href="https://lumedent.de/legal.html#agb">AGB</a> &nbsp;·&nbsp;
        <a href="https://lumedent.de/legal.html#haftung">Haftungsausschluss</a>
      </p>
      <p style="margin-top:6px;">© 2026 Nico Mario Schillings · LumeDent. Alle Rechte vorbehalten.</p>
    </div>

  </div>
</div>
</body>
</html>
`;



// ── HTTP Helper ───────────────────────────────────────────
function httpPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const req = https.request({
      hostname, path, method: 'POST',
      headers: { 'Content-Length': Buffer.byteLength(bodyStr), ...headers }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// ── Supabase Upsert ───────────────────────────────────────
function supabaseUpsert(table, data) {
  return httpPost(
    'tsweacifoxqpphvnwire.supabase.co',
    `/rest/v1/${table}`,
    {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    data
  );
}

// ── Resend E-Mail senden ──────────────────────────────────
async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY nicht gesetzt — Mail wird nicht gesendet');
    return;
  }
  try {
    const result = await httpPost(
      'api.resend.com',
      '/emails',
      {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      { from: 'LumeDent <info@lumedent.de>', to, subject, html }
    );
    console.log('Mail gesendet:', result.status, to);
  } catch(e) {
    console.error('Mail-Fehler:', e.message);
  }
}

// ── E-Mail Templates ──────────────────────────────────────
function buildWelcomeMail(email, plan, trialEnd) {
  const planName = PLAN_NAMES[plan] || 'Solo';
  const planPrice = PLAN_PRICES[plan] || '49';
  const trialDate = new Date(trialEnd).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  // Load template and replace placeholders
  let html = WELCOME_TEMPLATE
    .replace(/{{PLAN_NAME}}/g, planName)
    .replace(/{{TRIAL_END_DATE}}/g, trialDate)
    .replace(/{{PLAN_PRICE}}/g, planPrice);

  return html;
}

// ── Webhook Handler ───────────────────────────────────────
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  let event;
  try {
    event = req.body;
  } catch(err) {
    return res.status(400).send('Webhook error');
  }

  const obj = event.data?.object;

  switch (event.type) {

    case 'checkout.session.completed': {
      const userId = obj.metadata?.user_id;
      const plan = obj.metadata?.plan || 'solo';
      const customerId = obj.customer;
      const subId = obj.subscription;
      const email = obj.customer_details?.email || obj.customer_email;
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Subscription in Supabase speichern
      if (userId) {
        await supabaseUpsert('subscriptions', {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subId,
          plan,
          status: 'trialing',
          trial_end: trialEnd
        });
      }

      // 2. Willkommensmail senden
      if (email) {
        await sendEmail(
          email,
          `Willkommen bei LumeDent — deine Testphase hat begonnen 🎉`,
          buildWelcomeMail(email, plan, trialEnd)
        );
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subId = obj.id;
      const status = obj.status;
      const periodEnd = obj.current_period_end
        ? new Date(obj.current_period_end * 1000).toISOString()
        : null;

      await supabaseUpsert('subscriptions', {
        stripe_subscription_id: subId,
        status,
        current_period_end: periodEnd
      });
      break;
    }
  }

  res.status(200).json({ received: true });
};
