// WalkMeIn lead endpoint: validates the form, then sends a branded Hebrew (RTL) email through Resend.
// Env: RESEND_API_KEY (required), LEAD_TO (default eli@elevate.co.il), LEAD_FROM (default onboarding@resend.dev, works without a domain).
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ils = v => '₪' + Math.round(+v || 0).toLocaleString('he-IL');

function html(d) {
  const row = (k, v, link, ltr) => `<tr><td style="padding:12px 0;border-bottom:1px solid #ecebe3;color:#6d716a;font-size:14px;width:38%;vertical-align:top">${esc(k)}</td><td style="padding:12px 0;border-bottom:1px solid #ecebe3;color:#1c1f1b;font-size:16px;font-weight:600"><span${ltr ? ' dir="ltr" style="unicode-bidi:isolate"' : ''}>${link ? `<a href="${esc(link)}" style="color:#1c1f1b;text-decoration:none">${esc(v)}</a>` : esc(v)}</span></td></tr>`;
  const tel = String(d.phone || '').replace(/[^\d+]/g, '');
  const wa = tel.replace(/^\+/, '').replace(/^0/, '972');
  const pkg = d.pkg && Array.isArray(d.pkg.lines) ? d.pkg : null;
  const pkgRows = pkg ? pkg.lines.map(([k, v]) => `<tr><td style="padding:8px 0;color:rgba(255,255,255,.78);font-size:14px">${esc(k)}</td><td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;text-align:left;white-space:nowrap">${ils(v)}</td></tr>`).join('') : '';
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ליד חדש</title></head>
<body style="margin:0;padding:0;background:#f2f1ea;font-family:Heebo,Arial,Helvetica,sans-serif;direction:rtl">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ea;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;direction:rtl;text-align:right">
  <tr><td style="padding:0 6px 16px;font-size:22px;font-weight:700;color:#1c1f1b;letter-spacing:-.5px">WalkMeIn<span style="color:#e6c92a">.</span></td></tr>
  <tr><td style="background:#1d2621;border-radius:26px 26px 0 0;padding:30px 30px 26px">
    <span style="display:inline-block;background:#fff27a;color:#1c1f1b;font-size:13px;font-weight:600;padding:6px 14px;border-radius:20px">ליד חדש · ${esc(d.source)}</span>
    <h1 style="margin:16px 0 6px;color:#fff;font-size:30px;line-height:1.2;font-weight:600">${esc(d.name)}</h1>
    <p style="margin:0;color:rgba(255,255,255,.7);font-size:16px">${esc(d.company || 'לא צוינה חברה')} מבקש/ת לתאם שיחת הדגמה</p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:8px 30px 26px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row('שם מלא', d.name)}${row('חברה / פרויקט', d.company || '-')}${row('טלפון', d.phone, tel ? 'tel:' + tel : '', 1)}${d.email ? row('אימייל', d.email, 'mailto:' + d.email, 1) : ''}
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px"><tr>
      ${tel ? `<td style="padding-left:10px"><a href="tel:${esc(tel)}" style="display:inline-block;background:#f3dc2d;color:#1c1f1b;font-weight:700;font-size:15px;text-decoration:none;padding:13px 22px;border-radius:14px">התקשרו עכשיו</a></td>
      <td style="padding-left:10px"><a href="https://wa.me/${esc(wa)}" style="display:inline-block;background:#25d366;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:13px 22px;border-radius:14px">וואטסאפ</a></td>` : ''}
      ${d.email ? `<td><a href="mailto:${esc(d.email)}" style="display:inline-block;background:#1c1f1b;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:13px 22px;border-radius:14px">מייל</a></td>` : ''}
    </tr></table>
  </td></tr>
  ${pkg ? `<tr><td style="background:#1d2621;padding:24px 30px 26px">
    <p style="margin:0 0 4px;color:#fff27a;font-size:13px;font-weight:600">החבילה שנבחרה במחשבון</p>
    <p style="margin:0 0 14px;color:#fff;font-size:36px;font-weight:300">${ils(pkg.total)} <span style="font-size:14px;color:rgba(255,255,255,.55)">לפני מע״מ · ${esc(pkg.n)} סוגי דירות</span></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,.12)">${pkgRows}</table>
  </td></tr>` : ''}
  <tr><td style="background:#fbfaf5;border-radius:0 0 26px 26px;padding:18px 30px;color:#9a9e96;font-size:12.5px">התקבל ב־${esc(d.when)} · walkmein.com</td></tr>
</table></td></tr></table></body></html>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'POST only' });
  let d = req.body; if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } }
  d = d || {};
  if (d.botcheck) return res.status(200).json({ success: true });
  if (!d.name || !d.phone) return res.status(400).json({ success: false, message: 'missing name/phone' });
  d.source = (d.pkg ? 'מחשבון התמחור' : 'טופס תחתית העמוד') + ({ ar: ' · עמוד בערבית', en: ' · עמוד באנגלית' }[d.lang] || '');
  d.when = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', dateStyle: 'short', timeStyle: 'short' });
  const subject = `ליד חדש מ־WalkMeIn: ${d.name}${d.pkg ? ' · חבילה ' + ils(d.pkg.total) : ''}`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `WalkMeIn <${process.env.LEAD_FROM || 'onboarding@resend.dev'}>`, to: [process.env.LEAD_TO || 'eli@elevate.co.il'], reply_to: d.email || undefined, subject, html: html(d) }),
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) return res.status(502).json({ success: false, message: out.message || 'send failed' });
  res.status(200).json({ success: true });
};
module.exports.html = html;
