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
</head>
<body style="margin:0;padding:0;background:#EDEEF0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EDEEF0">
<tr><td style="padding:40px 16px;" align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

  <!-- LOGO -->
  <tr><td style="padding:0 0 20px 4px;">
    <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:900;color:#1A1A2E;letter-spacing:-0.5px;">Lume</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:300;color:#6B7280;letter-spacing:2px;">DENT</span>
  </td></tr>

  <!-- CARD -->
  <tr><td bgcolor="#ffffff" style="border-radius:12px;border:1px solid #E2E4E8;">
    <!-- TITEL -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:36px 40px 0px;">
      <p style="font-size:15px;color:#374151;line-height:1.75;margin:0 0 8px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><strong style="font-size:22px;color:#111827;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Willkommen bei LumeDent</strong></p>
      <p style="font-size:14px;color:#6B7280;line-height:1.75;margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Deine 14-tägige Testphase hat begonnen.</p>
    </td></tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0px 40px 0px;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="1" bgcolor="#F3F4F6" style="font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr></table>

    <!-- INTRO TEXT -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:28px 40px 28px;"><p style="font-size:15px;color:#374151;line-height:1.75;margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Schön, dass du dabei bist! Du hast jetzt vollen Zugriff auf LumeDent &mdash; den Abrechnungs-Generator für Z1-Komplexe, der dir täglich Zeit spart.</p></td></tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0px 40px 0px;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="1" bgcolor="#F3F4F6" style="font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr></table>

    <!-- BUCHUNGSBOX -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:28px 40px 28px;"><table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#08111F" style="border-radius:10px;">
      <tr><td style="padding:18px 24px 6px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6E849E;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Buchungsbestätigung</div>
      </td></tr>
      <tr><td style="padding:0 24px;border-bottom:1px solid rgba(255,255,255,0.07);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="font-size:13px;color:#6E849E;padding:11px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Paket</td>
        <td align="right" style="font-size:18px;font-weight:700;color:#C9A84C;padding:11px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">{{PLAN_NAME}}</td>
      </tr></table>
    </td></tr>
      <tr><td style="padding:0 24px;border-bottom:1px solid rgba(255,255,255,0.07);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="font-size:13px;color:#6E849E;padding:11px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Testphase bis</td>
        <td align="right" style="font-size:14px;font-weight:600;color:#ffffff;padding:11px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">{{TRIAL_END_DATE}}</td>
      </tr></table>
    </td></tr>
      <tr><td style="padding:0 24px;border-bottom:1px solid rgba(255,255,255,0.07);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="font-size:13px;color:#6E849E;padding:11px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Preis danach</td>
        <td align="right" style="font-size:14px;font-weight:600;color:#ffffff;padding:11px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">{{PLAN_PRICE}} € / Monat zzgl. 19% MwSt.</td>
      </tr></table>
    </td></tr>
      <tr><td style="padding:0 24px;border-bottom:1px solid rgba(255,255,255,0.07);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="font-size:13px;color:#6E849E;padding:11px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Abrechnung</td>
        <td align="right" style="font-size:14px;font-weight:600;color:#ffffff;padding:11px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Monatlich, jederzeit kündbar</td>
      </tr></table>
    </td></tr>
      <tr><td style="padding:0 24px 8px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="font-size:13px;color:#6E849E;padding:11px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Status</td>
          <td align="right" style="padding:11px 0;">
            <span style="background:rgba(61,184,122,0.15);color:#3DB87A;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Testphase aktiv</span>
          </td>
        </tr></table>
      </td></tr>
    </table></td></tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0px 40px 0px;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="1" bgcolor="#F3F4F6" style="font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr></table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:28px 40px 28px;"><table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr><td bgcolor="#C9A84C" style="border-radius:8px;">
    <a href="https://lumedent.de/app.html" style="display:inline-block;padding:14px 40px;color:#08111F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;">Jetzt LumeDent öffnen &rarr;</a>
  </td></tr>
</table></td></tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0px 40px 0px;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="1" bgcolor="#F3F4F6" style="font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr></table>

    <!-- QUICK START -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:28px 40px 0px;">
      <p style="font-size:14px;color:#111827;line-height:1.75;margin:0 0 16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><strong>So legst du am schnellsten los:</strong></p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;width:100%"><tr>
      <td width="26" valign="top" style="padding-top:1px;">
        <div style="width:22px;height:22px;background:#C9A84C;border-radius:50%;text-align:center;font-size:11px;font-weight:700;color:#08111F;line-height:22px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">1</div>
      </td>
      <td style="padding-left:10px;font-size:13px;color:#4A5568;line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong style="color:#111827;">Zahnschema ausfüllen</strong> — Befunde der Zähne anklicken (F, KR, KE, KU, I, B, WF)
      </td>
    </tr></table>
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;width:100%"><tr>
      <td width="26" valign="top" style="padding-top:1px;">
        <div style="width:22px;height:22px;background:#C9A84C;border-radius:50%;text-align:center;font-size:11px;font-weight:700;color:#08111F;line-height:22px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">2</div>
      </td>
      <td style="padding-left:10px;font-size:13px;color:#4A5568;line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong style="color:#111827;">Versicherungsart wählen</strong> — GKV / Kasse oder PKV / Privat und Behandlungsfall hinzufügen
      </td>
    </tr></table>
      <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;width:100%"><tr>
      <td width="26" valign="top" style="padding-top:1px;">
        <div style="width:22px;height:22px;background:#C9A84C;border-radius:50%;text-align:center;font-size:11px;font-weight:700;color:#08111F;line-height:22px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">3</div>
      </td>
      <td style="padding-left:10px;font-size:13px;color:#4A5568;line-height:1.6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <strong style="color:#111827;">Generieren</strong> — LumeDent erstellt automatisch den vollständigen Abrechnungskomplex
      </td>
    </tr></table>
    </td></tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:16px 40px 0px;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="1" bgcolor="#F3F4F6" style="font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr></table>

    <!-- LEGAL -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:20px 40px 28px;"><p style="font-size:12px;color:#9CA3AF;line-height:1.7;margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      Mit dem Abschluss deines Abonnements hast du unseren <a href="https://lumedent.de/legal.html#agb" style="color:#C9A84C;text-decoration:none;">AGB</a> und der <a href="https://lumedent.de/legal.html#datenschutz" style="color:#C9A84C;text-decoration:none;">Datenschutzerklärung</a> zugestimmt. Das Widerrufsrecht erlischt bei digitalen Inhalten mit Beginn der Nutzung.
    </p></td></tr></table>
</td></tr>
</table>

  <!-- FOOTER -->
  <tr><td style="padding:24px 4px 0;" align="center">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 8px;">
      <tr>
        <td><a href="https://lumedent.de/legal.html#impressum" style="font-size:12px;color:#9CA3AF;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Impressum</a></td>
        <td style="font-size:12px;color:#D1D5DB;padding:0 8px;">&middot;</td>
        <td><a href="https://lumedent.de/legal.html#datenschutz" style="font-size:12px;color:#9CA3AF;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">Datenschutz</a></td>
        <td style="font-size:12px;color:#D1D5DB;padding:0 8px;">&middot;</td>
        <td><a href="https://lumedent.de/legal.html#agb" style="font-size:12px;color:#9CA3AF;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">AGB</a></td>
        <td style="font-size:12px;color:#D1D5DB;padding:0 8px;">&middot;</td>
        <td><a href="mailto:info@lumedent.de" style="font-size:12px;color:#9CA3AF;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">info@lumedent.de</a></td>
      </tr>
    </table>
    <p style="font-size:12px;color:#9CA3AF;line-height:1.7;margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      &copy; 2026 Nico Mario Schillings &middot; LumeDent &middot; <a href="https://lumedent.de" style="color:#9CA3AF;text-decoration:none;">lumedent.de</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;



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
          `Willkommen bei LumeDent — deine Testphase hat begonnen`,
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
