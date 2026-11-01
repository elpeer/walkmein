// WalkMeIn Live Assist — buyer-side widget (demo).
// A live sales agent bubble: proactive help offer → chat → video call request.
// Usage: <script src="/assist/assist.js" data-agent="אבי" data-project="המגדל" defer></script>
// Demo only: replies and the call are simulated. If the WalkMeIn dashboard is open in another tab
// of the same browser (#assist page), requests and messages are mirrored there over BroadcastChannel.
(() => {
  const me = document.currentScript, BASE = me.src.replace(/assist\.js.*$/, '');
  const AGENT = me.dataset.agent || 'אבי', PROJECT = me.dataset.project || 'הפרויקט', DELAY = +(me.dataset.delay || 6000);
  const IMG = BASE + 'avi.webp', IMG_S = BASE + 'avi-s.webp';
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('walkmein-assist') : null;
  const vid = 'v' + Math.random().toString(36).slice(2, 7);
  const send = (t, d = {}) => bc?.postMessage({ t, vid, project: PROJECT, at: Date.now(), ...d });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const css = `
.wma,.wma *{box-sizing:border-box;font-family:'Heebo',system-ui,Arial,sans-serif}
.wma{--g:#0c2a23;--g2:#163a31;--s:#bcd6a6;--ink:#14201c;--mute:#6b746f;--live:#3ddc84;position:fixed;z-index:200;left:max(20px,env(safe-area-inset-left,0px));bottom:calc(22px + env(safe-area-inset-bottom,0px));direction:rtl;color:var(--ink)}
:where(.wma,.wma-call) button{font:inherit;cursor:pointer;border:0;background:none;color:inherit;padding:0}
.wma-fab{position:relative;display:flex;align-items:center;gap:10px;padding:6px 6px 6px 16px;border-radius:50px;background:rgba(12,42,35,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#fff;box-shadow:0 18px 40px -16px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.12) inset;transition:transform .25s}
.wma-fab:hover{transform:translateY(-2px)}
.wma-ph{position:relative;width:54px;height:54px;flex:none}
.wma-ph img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;box-shadow:0 0 0 2.5px var(--live)}
.wma-ph::before{content:"";position:absolute;inset:-2px;border-radius:50%;border:2px solid var(--live);animation:wma-ring 2.2s infinite}
.wma-ph i{position:absolute;bottom:1px;left:1px;width:14px;height:14px;border-radius:50%;background:var(--live);border:2.5px solid var(--g)}
@keyframes wma-ring{0%{transform:scale(1);opacity:.9}100%{transform:scale(1.35);opacity:0}}
.wma-fab b{display:block;font-size:15px;font-weight:600;line-height:1.2}
.wma-fab small{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#cfe3c6}
.wma-fab small::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--live);box-shadow:0 0 0 3px rgba(61,220,132,.25)}
.wma-say{position:absolute;bottom:calc(100% + 12px);left:0;width:min(320px,calc(100vw - 40px));background:#fff;border-radius:20px 20px 20px 6px;padding:14px 16px;box-shadow:0 24px 50px -20px rgba(0,0,0,.55);font-size:14.5px;line-height:1.5;transform-origin:0 100%;animation:wma-pop .45s cubic-bezier(.3,1.4,.5,1)}
.wma [hidden],.wma-call[hidden],.wma-call [hidden]{display:none!important}
@keyframes wma-pop{from{opacity:0;transform:scale(.85) translateY(8px)}}
.wma-say .x{position:absolute;top:8px;left:10px;width:24px;height:24px;border-radius:50%;color:var(--mute);font-size:17px;line-height:1}
.wma-say .who{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--mute);margin-bottom:6px}
.wma-say .who img{width:22px;height:22px;border-radius:50%;object-fit:cover}
.wma-act{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.wma-btn{height:38px;padding:0 16px;border-radius:30px;background:var(--g)!important;color:#fff!important;font-size:14px;font-weight:500;display:inline-flex;align-items:center;gap:7px}
.wma-btn.o{background:#eef2ec!important;color:var(--ink)!important}
.wma-btn svg{width:17px;height:17px}
.wma-panel{position:absolute;bottom:0;left:0;width:min(370px,calc(100vw - 32px));height:min(560px,calc(100vh - 120px));display:flex;flex-direction:column;background:#f6f7f3;border-radius:24px;overflow:hidden;box-shadow:0 30px 70px -24px rgba(0,0,0,.65);animation:wma-pop .4s cubic-bezier(.3,1.3,.5,1);transform-origin:0 100%}
.wma-hd{display:flex;align-items:center;gap:11px;padding:14px 14px 14px 12px;background:var(--g);color:#fff}
.wma-hd .wma-ph{width:44px;height:44px}
.wma-hd .wma-ph i{width:12px;height:12px}
.wma-hd b{display:block;font-size:15.5px;font-weight:600}
.wma-hd small{font-size:12px;color:#cfe3c6}
.wma-hd .sp{flex:1;min-width:0}
.wma-ic{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.12)!important}
.wma-ic svg{width:18px;height:18px}
.wma-ic.v{background:var(--live)!important;color:var(--g)!important}
.wma-body{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:8px}
.wma-m{max-width:84%;padding:9px 13px;border-radius:16px;font-size:14px;line-height:1.45;animation:wma-pop .3s ease}
.wma-m.a{align-self:flex-start;background:#fff;border-bottom-right-radius:5px;box-shadow:0 2px 6px rgba(0,0,0,.05)}
.wma-m.b{align-self:flex-end;background:var(--g);color:#fff;border-bottom-left-radius:5px}
.wma-sys{align-self:center;font-size:12px;color:var(--mute);background:#e9ede6;padding:4px 10px;border-radius:10px}
.wma-typing{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;background:#fff;border-radius:16px}
.wma-typing i{width:6px;height:6px;border-radius:50%;background:#9aa49e;animation:wma-dot 1s infinite}
.wma-typing i:nth-child(2){animation-delay:.15s}.wma-typing i:nth-child(3){animation-delay:.3s}
@keyframes wma-dot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
.wma-quick{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 10px}
.wma-quick button{font-size:13px;padding:7px 12px;border-radius:16px;background:#fff;box-shadow:0 0 0 1px rgba(12,42,35,.12) inset}
.wma-quick button.v{background:var(--g);color:#fff;box-shadow:none}
.wma-in{display:flex;gap:8px;padding:10px 12px 12px;border-top:1px solid rgba(0,0,0,.06);background:#fff}
.wma-in input{flex:1;min-width:0;height:42px;border-radius:22px;border:1px solid rgba(0,0,0,.1);padding:0 14px;font:inherit;font-size:14px;background:#f6f7f3}
.wma-in button{width:42px;height:42px;border-radius:50%;background:var(--g);color:#fff;display:grid;place-items:center}
.wma-in button svg{width:18px;height:18px;transform:scaleX(-1)}
.wma-ring{align-self:stretch;display:flex;align-items:center;gap:12px;padding:12px;border-radius:16px;background:#fff;box-shadow:0 0 0 1.5px var(--live) inset}
.wma-ring img{width:46px;height:46px;border-radius:50%;object-fit:cover;animation:wma-pulse 1.3s infinite}
@keyframes wma-pulse{0%{box-shadow:0 0 0 0 rgba(61,220,132,.6)}100%{box-shadow:0 0 0 14px rgba(61,220,132,0)}}
.wma-ring b{display:block;font-size:14px}.wma-ring small{font-size:12.5px;color:var(--mute)}
.wma-call{position:fixed;inset:0;z-index:210;background:rgba(6,16,13,.78);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:grid;place-items:center;padding:16px;direction:rtl}
.wma-cv{position:relative;width:min(760px,100%);aspect-ratio:16/10;max-height:calc(100vh - 32px);border-radius:26px;overflow:hidden;background:#0c2a23;box-shadow:0 40px 90px -30px rgba(0,0,0,.8)}
.wma-cv .feed{position:absolute;inset:0;background:url(${IMG}) 50% 30%/cover;animation:wma-kb 14s ease-in-out infinite alternate}
@keyframes wma-kb{0%{transform:scale(1.04) translate(0,0)}50%{transform:scale(1.08) translate(-1%,1%)}100%{transform:scale(1.05) translate(1%,-.5%)}}
.wma-cv .grad{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),transparent 25%,transparent 60%,rgba(0,0,0,.6))}
.wma-ctop{position:absolute;top:14px;right:16px;left:16px;display:flex;align-items:center;gap:10px;color:#fff;font-size:14px}
.wma-ctop b{font-weight:600}.wma-ctop .t{margin-right:auto;font-variant-numeric:tabular-nums;background:rgba(0,0,0,.4);padding:4px 10px;border-radius:12px;display:flex;align-items:center;gap:6px}
.wma-ctop .t::before{content:"";width:7px;height:7px;border-radius:50%;background:#ff5a4a}
.wma-self{position:absolute;top:96px;left:16px;width:clamp(110px,22%,170px);aspect-ratio:3/4;border-radius:16px;overflow:hidden;background:linear-gradient(150deg,#2b3d35,#14231e);display:grid;place-items:center;color:#cfe3c6;font-size:12px;text-align:center;box-shadow:0 12px 30px -10px rgba(0,0,0,.6)}
.wma-self video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
.wma-self button{margin-top:6px;font-size:12px;padding:6px 10px;border-radius:12px;background:rgba(255,255,255,.14);color:#fff}
.wma-cap{position:absolute;bottom:86px;right:50%;transform:translateX(50%);max-width:min(560px,70%);text-align:center;color:#fff;font-size:16px;line-height:1.45;background:rgba(0,0,0,.45);padding:8px 14px;border-radius:14px;transition:opacity .4s}
.wma-cbar{position:absolute;bottom:16px;right:50%;transform:translateX(50%);display:flex;gap:10px;padding:8px;border-radius:40px;background:rgba(10,20,17,.75)}
.wma-cbar button{width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.14)!important;color:#fff!important;display:grid;place-items:center}
.wma-cbar button.off{background:#fff!important;color:var(--g)!important}
.wma-cbar button.end{width:64px;border-radius:26px;background:#e5483a!important}
.wma-cbar svg{width:21px;height:21px}
.wma-spk{position:absolute;top:56px;right:16px;display:flex;gap:3px;align-items:flex-end;height:18px}
.wma-spk i{width:4px;background:var(--live);border-radius:2px;animation:wma-wv .7s infinite ease-in-out}
.wma-spk i:nth-child(2){animation-delay:.12s}.wma-spk i:nth-child(3){animation-delay:.24s}.wma-spk i:nth-child(4){animation-delay:.36s}
.wma-spk.q i{animation:none;height:3px}
@keyframes wma-wv{0%,100%{height:4px}50%{height:18px}}
.wma-wait{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#fff;background:rgba(8,22,18,.82)}
.wma-wait img{width:96px;height:96px;border-radius:50%;object-fit:cover;margin:0 auto 14px;display:block;animation:wma-pulse 1.3s infinite}
.wma-wait b{font-size:19px;font-weight:500}.wma-wait p{margin:6px 0 0;color:#cfe3c6;font-size:14px}
.wma-tag{position:absolute;top:56px;left:16px;font-size:12px;color:#fff;background:rgba(0,0,0,.4);padding:5px 10px;border-radius:12px}
@media (max-width:640px){
  .wma{bottom:calc(150px + env(safe-area-inset-bottom,0px));left:12px}
  .wma-fab{padding:5px 5px 5px 13px}.wma-ph{width:48px;height:48px}.wma-fab b{font-size:14px}
  .wma-panel{position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));width:auto;height:min(78vh,600px)}
  .wma-cv{aspect-ratio:auto;height:100%;max-height:none;border-radius:20px}
  .wma-call{padding:8px}
  .wma-self{top:96px;width:104px}.wma-cap{font-size:14px;max-width:90%}
}
@media (prefers-reduced-motion:reduce){.wma *,.wma-call *{animation:none!important}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);

  const I = {
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    end: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 15c5-5 13-5 18 0l-2 3-4-1v-3c-2-.6-4-.6-6 0v3l-4 1z"/></svg>',
  };
  const root = document.createElement('div'); root.className = 'wma';
  root.innerHTML = `
  <div class="wma-say" hidden><button class="x" aria-label="סגירה">×</button><div class="who"><img src="${IMG_S}" alt="">${esc(AGENT)} · צוות המכירות</div><div class="txt"></div>
    <div class="wma-act"><button class="wma-btn" data-go="chat">כן, אשמח</button><button class="wma-btn o" data-go="video">${I.video}שיחת וידאו</button></div></div>
  <button class="wma-fab" aria-label="דברו עם ${esc(AGENT)} מצוות המכירות"><span class="wma-ph"><img src="${IMG_S}" alt=""><i></i></span><span style="text-align:start"><b>${esc(AGENT)} כאן לעזור</b><small>זמין עכשיו בלייב</small></span></button>
  <div class="wma-panel" hidden role="dialog" aria-label="צ׳אט עם ${esc(AGENT)}">
    <div class="wma-hd"><span class="wma-ph"><img src="${IMG_S}" alt=""><i></i></span><span class="sp"><b>${esc(AGENT)} · יועץ מכירות</b><small>זמין עכשיו · ${esc(PROJECT)}</small></span>
      <button class="wma-ic v" data-go="video" aria-label="שיחת וידאו" title="שיחת וידאו">${I.video}</button><button class="wma-ic" data-go="close" aria-label="סגירה">${I.close}</button></div>
    <div class="wma-body"></div>
    <div class="wma-quick"><button class="v" data-go="video">שיחת וידאו עכשיו</button><button data-q="מה המחיר של הדירה הזו?">מחיר</button><button data-q="מתי המסירה?">מסירה</button><button data-q="יש חניה ומחסן?">חניה ומחסן</button></div>
    <form class="wma-in"><input placeholder="כתבו ל${esc(AGENT)}…" aria-label="הודעה"><button aria-label="שליחה">${I.send}</button></form>
  </div>`;
  const callEl = document.createElement('div'); callEl.className = 'wma-call'; callEl.hidden = true;
  callEl.innerHTML = `<div class="wma-cv" role="dialog" aria-label="שיחת וידאו עם ${esc(AGENT)}"><div class="feed"></div><div class="grad"></div>
    <div class="wma-ctop"><span class="wma-ph" style="width:32px;height:32px"><img src="${IMG_S}" alt=""></span><span><b>${esc(AGENT)}</b> · צוות המכירות</span><span class="t">00:00</span></div>
    <div class="wma-spk"><i></i><i></i><i></i><i></i></div><span class="wma-tag">${esc(AGENT)} רואה את הדירה שאתם רואים</span>
    <div class="wma-cap"></div>
    <div class="wma-self"><div><div>המצלמה שלכם כבויה</div><button data-go="cam">הפעלת מצלמה</button></div></div>
    <div class="wma-cbar"><button data-go="mic" aria-label="מיקרופון">${I.mic}</button><button data-go="camt" aria-label="מצלמה">${I.video}</button><button class="end" data-go="hang" aria-label="סיום שיחה">${I.end}</button></div>
    <div class="wma-wait"><div><img src="${IMG}" alt=""><b>מחברים אתכם ל${esc(AGENT)}…</b><p>${esc(AGENT)} קיבל התראה באפליקציה ומצטרף</p></div></div></div>`;
  document.body.append(root, callEl);
  const $ = s => root.querySelector(s), say = $('.wma-say'), panel = $('.wma-panel'), body = $('.wma-body'), fab = $('.wma-fab');

  // ---- chat
  let opened = false, typingEl = null;
  const add = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; body.append(d); body.scrollTop = 1e5; return d; };
  const agentSays = (text, delay = 1300) => new Promise(res => {
    typingEl?.remove(); typingEl = add('wma-typing', '<i></i><i></i><i></i>');
    setTimeout(() => { typingEl?.remove(); typingEl = null; add('wma-m a', esc(text)); send('chat', { from: 'agent', text }); res(); }, delay);
  });
  const REPLY = [
    [/מחיר|עולה|כמה/, 'הדירה הזו מתחילה ב־3.4 מיליון ₪, והמחיר משתנה לפי קומה וכיוון. רוצה שאשלח לך מחירון מסודר?'],
    [/מסיר/, 'המסירה מתוכננת לרבעון השני של 2028. אפשר גם לעשות שינויי דיירים עד שלב השלד.'],
    [/חני|מחסן/, 'לכל דירה יש חניה תת־קרקעית, ולרוב הדירות יש גם מחסן. בדירה הזו שניהם כלולים.'],
    [/מרפס|נוף/, 'המרפסת פונה מערבה לפארק, כך שיש שקיעה כל ערב. בשיחת וידאו אני יכול להראות לך בדיוק מה רואים ממנה.'],
  ];
  function buyerSays(text) {
    add('wma-m b', esc(text)); send('chat', { from: 'buyer', text });
    const r = REPLY.find(([re]) => re.test(text));
    agentSays(r ? r[1] : 'שאלה טובה. הכי מהיר זה לעבור על זה יחד, אפשר בשיחת וידאו קצרה מתוך הדירה, או שאחזור אליך בטלפון.');
  }
  function openChat(intro = true) {
    say.hidden = true; fab.hidden = true; panel.hidden = false;
    if (!opened) { opened = true; send('open'); if (intro) { add('wma-sys', 'היום'); agentSays(`היי, אני ${AGENT} 👋 אני רואה שאתם מסתכלים על הדירות ב${PROJECT}. במה אפשר לעזור? אם נוח, אפשר גם לעבור על הדירה יחד בשיחת וידאו.`, 900); } }
    setTimeout(() => panel.querySelector('input').focus(), 300);
  }
  const closeChat = () => { panel.hidden = true; fab.hidden = false; };

  // ---- video call
  let callT = 0, tick = null, capTimers = [], stream = null, waiting = null, dash = false;
  function requestVideo(fromAgent = false) {
    if (!callEl.hidden) return;
    openChat(false);
    add('wma-sys', fromAgent ? `${AGENT} הזמין אתכם לשיחת וידאו` : 'ביקשתם שיחת וידאו');
    add('wma-ring', `<img src="${IMG_S}" alt=""><span><b>שולחים ל${esc(AGENT)} בקשה לשיחה בלייב</b><small>הוא מקבל התראה באפליקציה ומצטרף</small></span>`);
    send('call-request');
    callEl.hidden = false; callEl.querySelector('.wma-wait').hidden = false; callEl.querySelector('.wma-cap').style.opacity = 0;
    waiting = setTimeout(connect, dash ? 45000 : 3800); // demo: the agent answers on his own unless a dashboard tab is open to answer
  }
  function connect() {
    clearTimeout(waiting); waiting = null; if (callEl.hidden) return;
    callEl.querySelector('.wma-wait').hidden = true; send('call-connected');
    callT = 0; clearInterval(tick); tick = setInterval(() => { callT++; callEl.querySelector('.t').textContent = `${String(callT / 60 | 0).padStart(2, '0')}:${String(callT % 60).padStart(2, '0')}`; }, 1000);
    const cap = callEl.querySelector('.wma-cap'), spk = callEl.querySelector('.wma-spk');
    const lines = [[400, `היי! אני ${AGENT} מ${PROJECT}. אני רואה את הדירה שאתם מסתכלים עליה.`], [5200, 'בואו נתחיל מהסלון: 36 מטר, עם יציאה ישירה למרפסת שפונה לפארק.'], [10500, 'רוצים שנעבור לחדר ההורים, או שיש שאלה על מה שאתם רואים עכשיו?']];
    capTimers.forEach(clearTimeout); capTimers = lines.map(([t, s]) => setTimeout(() => { cap.textContent = s; cap.style.opacity = 1; spk.classList.remove('q'); }, t));
    capTimers.push(setTimeout(() => spk.classList.add('q'), 14500));
  }
  function hang() {
    clearTimeout(waiting); clearInterval(tick); capTimers.forEach(clearTimeout); stream?.getTracks().forEach(t => t.stop()); stream = null;
    const v = callEl.querySelector('.wma-self video'); v?.remove();
    callEl.hidden = true; send('call-end', { secs: callT });
    if (callT) { add('wma-sys', `שיחת וידאו · ${callT / 60 | 0}:${String(callT % 60).padStart(2, '0')} דק׳`); agentSays('היה כיף לעבור איתך על הדירה! שלחתי לך סיכום ומחירון בוואטסאפ. אם תרצו פגישה במשרד המכירות, אני כאן.', 1500); }
  }
  async function cam() {
    const self = callEl.querySelector('.wma-self');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const v = document.createElement('video'); v.autoplay = v.muted = v.playsInline = true; v.srcObject = stream; self.prepend(v);
      self.querySelector('div').hidden = true;
    } catch (e) { self.querySelector('div > div').textContent = 'אין גישה למצלמה. אפשר להמשיך בקול בלבד.'; }
  }

  // ---- wiring
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-go],[data-q],.x,.wma-fab'); if (!b) return;
    if (b.classList.contains('x')) { say.hidden = true; send('dismiss'); return; }
    if (b.classList.contains('wma-fab')) return openChat();
    if (b.dataset.q) return buyerSays(b.dataset.q);
    ({ chat: () => openChat(), video: () => requestVideo(), close: closeChat })[b.dataset.go]?.();
  });
  callEl.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    ({ hang, cam, mic: () => b.classList.toggle('off'), camt: () => { b.classList.toggle('off'); if (stream) stream.getVideoTracks().forEach(t => t.enabled = !b.classList.contains('off')); } })[b.dataset.go]?.();
  });
  panel.querySelector('form').addEventListener('submit', e => { e.preventDefault(); const i = panel.querySelector('input'), t = i.value.trim(); if (t) { i.value = ''; buyerSays(t); } });
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (!callEl.hidden) hang(); else if (!panel.hidden) closeChat(); } });

  // proactive offer, as if the agent saw the visitor on the dashboard
  function offer(text) {
    if (!panel.hidden || !callEl.hidden) { if (text) agentSays(text, 600); return; }
    say.querySelector('.txt').textContent = text || `היי, אני ${AGENT} מצוות המכירות של ${PROJECT} 👋 רואה שאתם בודקים דירה. רוצים שאעבור איתכם עליה? אפשר בצ׳אט או בשיחת וידאו קצרה.`;
    say.hidden = false;
  }
  setTimeout(() => offer(), DELAY);

  // dashboard tab (same browser) can drive the agent side
  bc?.addEventListener('message', ({ data: d }) => {
    if (!d || (d.vid && d.vid !== vid && d.vid !== '*')) return;
    if (d.t === 'agent-msg') { if (!panel.hidden) agentSays(d.text, 700); else offer(d.text); }
    if (d.t === 'agent-invite') requestVideo(true);
    if (d.t === 'accept' && waiting) connect();
    if (d.t === 'decline' && waiting) { clearTimeout(waiting); callEl.hidden = true; agentSays(`${AGENT} באמצע שיחה כרגע. אחזור אליכם תוך כמה דקות, או שתשאירו כאן שאלה.`, 500); }
    if (d.t === 'ping') send('hello', { page: location.pathname });
    if (d.t === 'dash') dash = true;
  });
  send('hello', { page: location.pathname });
})();
