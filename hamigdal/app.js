import { SITE, RENDERS, FLOORS, TYPES, GROUPS } from './data.js';
import { TOUR, NAV } from './tour.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const mqPhone = matchMedia('(max-width: 900px)'); const isPhone = () => mqPhone.matches;
const ICON = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
  cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  room: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-7h6v7"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h9v9M12 3v5M16 12h5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16.5v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.5 5.2 2 2 0 0 1 4.5 3h3a2 2 0 0 1 2 1.7c.13.9.36 1.8.68 2.6a2 2 0 0 1-.45 2.1L8.4 10.7a16 16 0 0 0 4.9 4.9l1.3-1.3a2 2 0 0 1 2.1-.45c.84.32 1.7.55 2.6.68A2 2 0 0 1 21 16.5z"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  walk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="m9 21 2.5-6.5L14 17v4M7 12l2.5-4.5L14 8l2.5 4 2.5 1M11.5 14.5 10 9"/></svg>',
  move: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 12h18M12 3 9 6M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  top: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v6M9 6l3-3 3 3"/><path d="M4 14l8 4 8-4-8-4z"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
};
const floorTypes = k => TYPES.filter(t => t.floors.includes(k));
const ftx = s => s;
const typesTxt = n => n === 1 ? 'דגם דירה אחד' : `${n} דגמי דירות`;

// ================================================================ SCREEN 1 – the building
const stage = $('#stage'), svg = $('#floorsSvg'), img = $('#heroImg');
let R = null, layout = { s: 1, x: 0, y: 0 };
function useRender() {
  // portrait screens get the vertical render
  const next = innerWidth / innerHeight < 0.9 ? RENDERS.mob : RENDERS.desk; if (next === R) return; R = next;
  stage.classList.remove('ready'); img.onload = () => stage.classList.add('ready');
  img.sizes = Math.ceil(Math.max(innerWidth, innerHeight * R.w / R.h)) + 'px'; img.srcset = R.srcset; img.src = R.src; if (img.complete) stage.classList.add('ready');
  svg.setAttribute('viewBox', `0 0 ${R.w} ${R.h}`);
  svg.innerHTML = FLOORS.map(f => { const pts = R.floors[f.k]; const ys = pts.split(' ').map(p => +p.split(',')[1]), xs = pts.split(' ').map(p => +p.split(',')[0]); const cy = (Math.min(...ys) + Math.max(...ys)) / 2, x0 = Math.min(...xs);
    return `<g class="fl" style="--i:${f.k}" data-k="${f.k}" role="button" tabindex="0" aria-label="${f.label} – ${typesTxt(floorTypes(f.k).length)}"><polygon points="${pts}"/><g class="num" data-x0="${x0}" data-cy="${cy}" transform="translate(${x0 + 34},${cy})"><circle class="ring" r="22"/><circle r="22" fill="rgba(255,255,255,.92)"/><text text-anchor="middle" dy="7" font-family="Heebo" font-size="21" font-weight="500" fill="#14161a">${f.short}</text></g></g>`; }).join('');
  fitStage();
}
const bld = $('#bld');
function fitStage() {
  const W = innerWidth, H = innerHeight; let s, w, h, x, y;
  if (R.tall) { // a tall portrait render: the tower stays large and centred, the page scrolls to see all of it
    const ib = $('#intro').getBoundingClientRect(); const pad = Math.max(isPhone() ? 190 : 250, Math.round(ib.bottom + bld.scrollTop + 18)); s = (H * (isPhone() ? 1.12 : 1.5)) / R.h; w = R.w * s; h = R.h * s;
    x = w > W ? Math.min(0, Math.max(W - w, W / 2 - R.focus.x * s)) : (W - w) / 2; y = pad;
    bld.classList.add('scroll'); bld.style.setProperty('--bgimg', `url(${R.src})`); $('#spacer').style.height = (h + pad) + 'px';
    layout = { s, x, y: y - bld.scrollTop, pad };
  } else {
  bld.classList.remove('scroll'); $('#spacer').style.height = '0px';
  s = Math.max(W / R.w, H / R.h); w = R.w * s; h = R.h * s;
  x = Math.min(0, Math.max(W - w, W / 2 - R.focus.x * s)); y = Math.min(0, Math.max(H - h, H / 2 - R.focus.y * s)); }
  img.sizes = Math.ceil(w) + 'px';
  if (!R.tall) layout = { s, x, y }; Object.assign(stage.style, { width: w + 'px', height: h + 'px', transform: `translate(${x}px,${y}px)` });
  // keep the floor numbers inside the visible part of the render
  const visL = -x / s; $$('.fl .num').forEach(n => { const x0 = +n.dataset.x0; n.setAttribute('transform', `translate(${Math.max(x0 + 34, visL + 34 / s)},${n.dataset.cy})`); });
}
addEventListener('resize', () => { useRender(); fitStage(); placeTag(hovK); });
bld.addEventListener('scroll', () => { if (R.tall) { layout.y = layout.pad - bld.scrollTop; placeTag(hovK); $('#hint').classList.toggle('off', bld.scrollTop > 60 || selK !== null); } }, { passive: true });
useRender();
$('#rail').insertAdjacentHTML('beforeend', FLOORS.map(f => `<button data-k="${f.k}" aria-label="${f.label}"><b>${f.short}</b></button>`).join(''));
$('#hintTx').textContent = isPhone() ? 'הקישו על קומה בבניין או ברשימה' : 'העבירו את העכבר על הבניין ובחרו קומה';

let hovK = null, selK = null;
function hover(k) { hovK = k; $$('.fl').forEach(g => g.classList.toggle('hov', +g.dataset.k === k)); $$('#rail button').forEach(b => b.classList.toggle('hov', +b.dataset.k === k)); placeTag(k); }
function placeTag(k) {
  const tag = $('#ftag'); if (k === null || k === undefined || selK !== null || isPhone()) { tag.classList.remove('show'); return; }
  const f = FLOORS.find(x => x.k === k), pts = R.floors[k]; const ys = pts.split(' ').map(p => +p.split(',')[1]); const y = (Math.min(...ys) + Math.max(...ys)) / 2;
  tag.querySelector('.n').textContent = f.short; tag.querySelector('b').textContent = f.label; tag.querySelector(':scope > div > span').textContent = `${typesTxt(floorTypes(k).length)}${f.sub ? ' · ' + f.sub : ''} · לחצו לצפייה`;
  const sx = layout.x + R.tagX * layout.s, sy = layout.y + y * layout.s;
  tag.style.left = Math.max(20, sx - tag.offsetWidth - 14) + 'px'; tag.style.top = sy + 'px'; tag.classList.add('show');
}
svg.addEventListener('pointerover', e => { if (isPhone()) return; const g = e.target.closest('.fl'); if (g) hover(+g.dataset.k); });
svg.addEventListener('pointerleave', () => hover(null));
svg.addEventListener('click', e => { const g = e.target.closest('.fl'); if (g) go({ floor: +g.dataset.k }); });
svg.addEventListener('keydown', e => { const g = e.target.closest('.fl'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go({ floor: +g.dataset.k }); } });
$('#rail').addEventListener('pointerover', e => { const b = e.target.closest('[data-k]'); if (b) hover(+b.dataset.k); });
$('#rail').addEventListener('pointerleave', () => hover(null));
$('#rail').onclick = e => { const b = e.target.closest('[data-k]'); if (b) go({ floor: +b.dataset.k }); };

try { if (sessionStorage.getItem('hmSeen')) svg.classList.add('seen'); } catch (e) { }
function showFloor(k) {
  selK = k; placeTag(null); svg.classList.add('seen'); try { sessionStorage.setItem('hmSeen', '1'); } catch (e) { }
  $$('.fl').forEach(g => g.classList.toggle('on', +g.dataset.k === k)); $$('#rail button').forEach(b => b.classList.toggle('on', +b.dataset.k === k));
  const f = FLOORS.find(x => x.k === k), list = floorTypes(k);
  $('#dT').textContent = f.label; $('#dS').textContent = `${typesTxt(list.length)}${f.sub ? ' · ' + f.sub : ''} · בחרו טיפוס לצפייה בתלת־ממד`;
  $('#fnav').innerHTML = FLOORS.slice().reverse().map(x => `<button data-k="${x.k}" class="${x.k === k ? 'on' : ''}">${x.k}</button>`).join('');
  let n = 0;
  $('#list').innerHTML = GROUPS.map(g => { const ts = list.filter(t => t.rooms === g.rooms); if (!ts.length) return '';
    return `<details class="grp" open><summary>${g.label}<span class="cnt">${ts.length}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></summary>${ts.map(t => `<button class="card" data-t="${t.id}" style="animation-delay:${0.06 + (n++) * 0.04}s">
      <span class="vis"><img src="img/c_3d.webp" alt="" loading="lazy"></span>
      <span class="tx"><b>טיפוס ${t.name}</b><span class="sub">${t.rooms} חדרים${t.area ? ` · ${t.area} מ״ר` : ''}${t.floors.length > 1 ? ` · ${t.floors.length} קומות` : ''}</span><span class="go">${ICON.cube}תוכנית בתלת־ממד</span></span>
      <span class="arr">${ICON.arrow}</span></button>`).join('')}</details>`; }).join('');
  $('#drawer').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false'); $('#scrim').classList.toggle('on', isPhone());
  $('#intro').classList.toggle('dim', isPhone()); $('#intro').classList.toggle('shift', !isPhone()); $('#hint').classList.add('off'); $('#list').scrollTop = 0; { const b = $('#fnav .on'); b && b.scrollIntoView({ block: 'nearest', inline: 'center' }); }
}
function hideFloor() { selK = null; $('#drawer').classList.remove('open'); $('#drawer').setAttribute('aria-hidden', 'true'); $('#scrim').classList.remove('on'); $$('.fl,.rail button').forEach(el => el.classList.remove('on')); $('#intro').classList.remove('dim', 'shift'); $('#hint').classList.remove('off'); }
$('#dClose').onclick = () => go({});
$('#scrim').onclick = () => go({});
$('#fnav').onclick = e => { const b = e.target.closest('[data-k]'); if (b) go({ floor: +b.dataset.k }, true); };
$('#list').onclick = e => { const c = e.target.closest('[data-t]'); if (c) go({ floor: selK, apt: c.dataset.t }); };
addEventListener('pointermove', e => { if (isPhone()) return; const dx = (e.clientX / innerWidth - .5) * -12, dy = (e.clientY / innerHeight - .5) * -6; $('#kb').style.translate = `${dx}px ${dy}px`; }, { passive: true });
// swipe the phone sheet down to close it
{ let y0 = null; const d = $('#drawer'); d.addEventListener('touchstart', e => { if (e.target.closest('.list')) return; y0 = e.touches[0].clientY; }, { passive: true }); d.addEventListener('touchend', e => { if (y0 !== null && e.changedTouches[0].clientY - y0 > 70) go({}); y0 = null; }, { passive: true }); }

// ================================================================ routing – every screen has a URL so Back always works
function parse() { const p = new URLSearchParams(location.hash.slice(1)); return { floor: p.has('floor') ? +p.get('floor') : null, apt: p.get('apt'), tour: p.get('tour') }; }
function hashOf(s) { const p = new URLSearchParams(); if (s.floor !== null && s.floor !== undefined) p.set('floor', s.floor); if (s.apt) p.set('apt', s.apt); if (s.apt && s.tour) p.set('tour', s.tour); const h = p.toString(); return h ? '#' + h : location.pathname + location.search; }
let inApp = false;
function go(s, replace) { const h = hashOf(s); if (!replace) inApp = true; if ((location.hash || '') === (h.startsWith('#') ? h : '')) return render(); replace ? history.replaceState(null, '', h) : history.pushState(null, '', h); render(); }
let cur = { floor: null, apt: null };
function render() {
  const s = parse();
  if (s.apt) { if (s.floor !== null && selK !== s.floor) showFloor(s.floor); openPlan(s.apt); }
  else { if (cur.apt) closePlan(); if (s.floor !== null) showFloor(s.floor); else if (selK !== null) hideFloor(); }
  cur = s;
}
addEventListener('popstate', render);
addEventListener('keydown', e => { if (T.on || E.on) return tourKey(e); if (e.key === 'Escape') { if (cur.apt) $('#back').click(); else if (selK !== null) go({}); } });

// ================================================================ SCREEN 2 – apartment in 3D
// All apartment types open the penthouse E2 model for now (the other plans follow once the look is approved).
let A = null, view = '3d', planOpen = false, openId = null; const hotEls = [];
const TOURBTN = `<div class="tourBox"><button class="tourBtn" data-tour="top"><i>${ICON.play}</i><span><b>סיור מודרך בדירה</b><small>כ־3 דקות · עם קריינות בעברית</small></span></button><div class="tbo"><button data-tour="pov">${ICON.walk}<span>סיור בגובה העיניים</span></button><button data-tour="walk">${ICON.move}<span>שיטוט חופשי</span></button></div></div>`;
async function openPlan(id) {
  const t = TYPES.find(x => x.id === id) || TYPES.find(x => x.id === 'CC2');
  if (planOpen && openId === t.id) return; planOpen = true; openId = t.id;
  const stats = `<div class="stats"><div><span>חדרים</span><b>${t.rooms}</b></div>${t.area ? `<div><span>שטח דירה</span><b>${t.area} <small>מ״ר</small></b></div><div><span>${t.out[0]}</span><b>${t.out[1]} <small>מ״ר</small></b></div>` : `<div><span>טיפוס</span><b>${t.name}</b></div><div><span>מספר קומות</span><b>${t.floors.length}</b></div>`}<div><span>גובה תקרה</span><b>3 <small>מ׳</small></b></div></div>`;
  const acts = `<div class="acts"><a class="btn gold" href="${SITE.tel}">${ICON.phone}לתיאום פגישה</a><a class="btn line" href="${SITE.pdfBase}${t.pdf}" target="_blank" rel="noopener">${ICON.pdf}תוכנית PDF</a></div>`;
  $('#info').innerHTML = `<span class="t">TYPE ${t.name}</span><h1>${t.label}</h1><span class="sub">טיפוס ${t.name} · ${ftx(t.floorTxt)}</span>${TOURBTN}${stats}${acts}<p class="note">${SITE.disclaimer}</p>`;
  $('#ptitle').innerHTML = `<small>TYPE ${t.name}</small><b>${t.label}</b>`;
  $('#mdetails').innerHTML = `<span class="note" style="font-size:12.5px">טיפוס ${t.name} · ${ftx(t.floorTxt)}</span>${stats}${acts}`;
  $('#p2d img').src = 'plans/C_hi.webp';
  setTab(isPhone() ? 'details' : 'rooms');
  $('#bld').classList.add('away'); $('#plan').classList.add('open'); $('#plan').setAttribute('aria-hidden', 'false');
  setView('3d');
  if (!A) { const { createApt } = await import('./apt.js'); A = await createApt($('#gl'), { base: './', onFrame: paintHots, capture: !!window.__capture, onGoal: () => leaveNode() }); window.__A = A; buildRooms(); }
  if (!planOpen) return;
  $('#loading').classList.add('done'); A.start(); A.replayIntro();
  const want = parse().tour; if (want === 'pov' || want === 'top') offerTour(want);
  // realistic mode is the default: switch it on as soon as the model is up (the button shows the loading progress)
  if (!A.realistic && !openPlan.auto) { openPlan.auto = true; $('#realBtn').dataset.told = 1; $('#realBtn').click(); }
}
function closePlan() { tourStop(true); walkStop(true); planOpen = false; openId = null; $('#plan').classList.remove('open'); $('#plan').setAttribute('aria-hidden', 'true'); $('#bld').classList.remove('away'); A && A.stop(); $('.rcard') && $('.rcard').remove(); selectRoomUI(null); }
$('#back').onclick = () => { if (inApp) history.back(); else go({ floor: parse().floor }, true); };
function setView(v) { $('#plan').classList.toggle('v2d', v !== '3d'); if (v !== '3d') { tourStop(true); walkStop(true); } view = v; $$('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); $('#p2d').hidden = v !== '2d'; ['#gl', '#hots', '#tools'].forEach(s => $(s).classList.toggle('off', v !== '3d')); if (v === '2d') $('.rcard') && $('.rcard').remove(); if (A && planOpen) v === '3d' ? A.start() : A.stop(); }
$$('.seg button').forEach(b => b.onclick = () => setView(b.dataset.v));
function setTab(t) { $('#panel').dataset.tab = t; $$('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t)); }
$$('.tabs button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
$('#tools').onclick = e => { const b = e.target.closest('[data-t]'); if (!b || !A) return; const t = b.dataset.t;
  if (t === 'in') A.zoom(0.78); else if (t === 'out') A.zoom(1.28); else if (t === 'home') selectRoom(null);
  else if (t === 'walls') { const low = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', low); A.setWalls(low ? 0.42 : 1); } };
function buildRooms() {
  hotEls.length = 0; $('#hots').innerHTML = '';
  const MINOR = new Set(['entry', 'laundry', 'bath', 'tub']);
  A.rooms.forEach(r => { const el = document.createElement('div'); el.className = 'hot' + (MINOR.has(r.id) ? ' minor' : ''); el.innerHTML = `<button aria-label="${r.name}">${ICON.plus}</button><div class="pill">${r.img ? `<img src="img/${r.img}_s.webp" alt="">` : ''}<div><b>${r.name}</b><span>${r.size}</span></div></div>`; el.querySelector('button').onclick = () => selectRoom(r.id); el.onpointerenter = e => e.pointerType === 'mouse' && A.highlight(r.id); el.onpointerleave = () => A.highlight(selRoom); $('#hots').append(el); hotEls.push({ el, r }); });
  $('#rooms').innerHTML = `<button class="rc" data-r=""><div class="im">${ICON.home}</div><b>כל הדירה</b><span>כ־101 מ״ר + מרפסת כ־14 מ״ר</span></button>` + A.rooms.map(r => `<button class="rc" data-r="${r.id}"><div class="im">${r.img ? `<img src="img/${r.img}_s.webp" alt="" loading="lazy">` : ICON.room}</div><b>${r.name}</b><span>${r.size}</span></button>`).join('');
}
$('#rooms').onclick = e => { const b = e.target.closest('.rc'); if (b) selectRoom(b.dataset.r || null); };
// room strip: arrows, mouse-wheel and drag scrolling, edge fades that show there is more (RTL: scrollLeft runs 0 … -max)
{ const R = $('#rooms'), W = $('#rwrap'); const upd = () => { const max = R.scrollWidth - R.clientWidth, x = Math.abs(R.scrollLeft); W.classList.toggle('mr', x > 4); W.classList.toggle('ml', x < max - 4); };
  R.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); new ResizeObserver(upd).observe(R); new MutationObserver(upd).observe(R, { childList: true });
  const step = d => R.scrollBy({ left: d * R.clientWidth * 0.8, behavior: 'smooth' }); $('#rPrev').onclick = () => step(1); $('#rNext').onclick = () => step(-1);
  R.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && R.scrollWidth > R.clientWidth) { e.preventDefault(); R.scrollLeft -= e.deltaY; } }, { passive: false });
  let d = null; R.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; d = { x: e.clientX, s: R.scrollLeft, moved: false }; });
  addEventListener('pointermove', e => { if (!d) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 5) { d.moved = true; R.classList.add('drag'); } if (d.moved) R.scrollLeft = d.s - dx; });
  addEventListener('pointerup', () => { if (!d) return; setTimeout(() => R.classList.remove('drag'), 0); d = null; }); }
$('#rooms').onpointerover = e => { const b = e.target.closest('.rc'); if (b && A && e.pointerType === 'mouse') A.highlight(b.dataset.r || selRoom); };
$('#rooms').onpointerleave = () => A && A.highlight(selRoom);
let selRoom = null;
function selectRoomUI(id) { selRoom = id; A && A.highlight(id); $$('.rc').forEach(c => c.classList.toggle('on', (c.dataset.r || null) === id)); hotEls.forEach(h => h.el.classList.toggle('on', h.r.id === id)); }
function selectRoom(id) {
  if (id && id === selRoom) id = null; // tapping the selected room again clears it
  selectRoomUI(id); $('.rcard') && $('.rcard').remove();
  if (!id) { A.home(); return; }
  if (isPhone()) setTab('rooms');
  A.focus(id); const r = A.rooms.find(x => x.id === id);
  const c = document.createElement('div'); c.className = 'rcard' + (r.img ? '' : ' noimg');
  c.innerHTML = `${r.img ? `<button class="im" aria-label="הגדלת ההדמיה"><img src="img/${r.img}.webp" alt="${r.name}"><i>${ICON.expand}</i></button>` : ''}<div class="rt"><b>${r.name}</b><span>${r.size}${r.img ? ' · הדמיה להמחשה' : ''}</span></div><button class="x" aria-label="ביטול הבחירה">${ICON.x}</button>`;
  c.querySelector('.x').onclick = () => selectRoom(null);
  if (r.img) c.querySelector('.im').onclick = () => lightbox(`img/${r.img}.webp`, `${r.name} · ${r.size}`);
  $('#plan').append(c);
  const card = $(`.rc[data-r="${id}"]`); card && card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}
function lightbox(src, cap) { const b = $('#lbox'); b.querySelector('img').src = src; b.querySelector('figcaption').textContent = cap; b.hidden = false; requestAnimationFrame(() => b.classList.add('on')); }
$('#lbox').onclick = () => { const b = $('#lbox'); b.classList.remove('on'); setTimeout(() => b.hidden = true, 300); };
// a plain tap on the model (no drag) clears the room selection
{ let d = null; $('#gl').addEventListener('pointerdown', e => { d = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  $('#gl').addEventListener('pointerup', e => { if (d && selRoom && !T.on && !E.on && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6 && performance.now() - d.t < 350) selectRoom(null); d = null; }); }
function paintHots() {
  if (!A || view !== '3d') return; if (E.on) { freeTick(); paintNav(); return; }
  for (const h of hotEls) { const s = A.project(h.r.p); h.el.style.opacity = s.vis ? 1 : 0; h.el.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%)`; }
}

// ================================================================ guided tour (narrated, room by room) + free walk
// Two ways to watch the tour: "top" (orbiting the model from above) or "pov" (walking through at eye level).
// A third mode, the free walk, lets the visitor move between viewpoints with arrows while the narrator follows along.
const TIMG = { entry: 'r_entry', living: 'living_kitchen', kitchen: 'living_kitchen', balcony: 'living_balcony', wing: 'r_tub', kids: 'r_bed2', mbed: 'r_mbed' };
const vo = i => `vo/t${String(i + 1).padStart(2, '0')}.mp3`;
const T = { on: false, mode: 'top', i: -1, playing: false, muted: false, timer: 0, raf: 0, fake: null, cum: [], clip: -1, aud: new Audio() };
const E = { on: false, node: null, busy: false, heard: new Set(), arrows: [] };
T.aud.preload = 'auto';
const roomInfo = id => (A && A.rooms.find(r => r.id === id)) || null;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tour]'); if (!b) return; $('#tmenu') && $('#tmenu').classList.remove('open');
  if (b.dataset.tour === 'menu') { $('#tmenu').classList.toggle('open'); return; }
  if (b.dataset.tour === 'walk') walkStart(); else tourStart(b.dataset.tour || 'top');
});
function unlockAudio() { T.aud.src = vo(0); T.aud.muted = true; T.aud.play().then(() => { T.aud.pause(); T.aud.muted = T.muted; }).catch(() => { T.aud.muted = T.muted; }); }
function fadeCut(fn) { const f = $('#fade'); f.classList.add('on'); return new Promise(r => setTimeout(async () => { await fn(); requestAnimationFrame(() => f.classList.remove('on')); r(); }, 420)); }
function uiMode(cls) {
  const p = $('#plan'); p.classList.toggle('touring', !!cls); p.classList.toggle('walking', cls === 'walk'); p.classList.toggle('pov', cls === 'walk' || (cls === 'tour' && T.mode === 'pov'));
  $('#tcard').hidden = !cls; $('#tbar').hidden = cls !== 'tour'; if (cls !== 'walk') $('#whint').hidden = true; $('#tcard').classList.toggle('explore', cls === 'walk'); $('#nav').hidden = cls !== 'walk'; $('#mini').hidden = cls !== 'walk';
}
// ---------- narration (shared by both modes): one clip at a time, words light up as they are spoken
function setNarr(text) {
  const words = text.split(/\s+/); let acc = 0; const w = words.map(x => (acc += x.length + 1 + (/[,.:?!]$/.test(x) ? 5 : 0)));
  T.cum = w.map(v => v / acc); $('#ttext').classList.remove('full'); $('#ttext').innerHTML = words.map(x => `<span>${x}</span>`).join(' ');
}
function loadClip(i) { T.clip = i; T.fake = null; T.aud.pause(); T.aud.src = vo(i); T.aud.muted = T.muted; if (i + 1 < TOUR.length) fetch(vo(i + 1)).catch(() => { }); }
function playClip() { if (T.clip < 0) return; T.aud.play().then(() => { T.fake = null; }).catch(() => { T.fake = { t0: performance.now(), dur: TOUR[T.clip].text.length * 72 }; }); }
T.aud.addEventListener('ended', clipDone);
T.aud.addEventListener('error', () => { if ((T.on || E.on) && T.playing && !T.fake && T.clip >= 0) T.fake = { t0: performance.now(), dur: TOUR[T.clip].text.length * 72 }; });
function clipDone() { T.fake = null; markWords(1); if (E.on) { T.playing = false; paintPlay(); return; } if (!T.on) return; if (T.i < TOUR.length - 1) T.timer = setTimeout(() => T.playing && tourGo(T.i + 1), 900); }
function clipProgress() {
  if (T.fake) { const p = (performance.now() - T.fake.t0) / T.fake.dur; if (p >= 1 && T.playing) { T.fake = null; clipDone(); return 1; } return Math.min(1, p); }
  const d = T.aud.duration; return d && isFinite(d) ? T.aud.currentTime / d : 0;
}
function markWords(p) { const sp = $('#ttext').children; for (let k = 0; k < sp.length; k++) sp[k].classList.toggle('on', (k ? T.cum[k - 1] : 0) <= p * 1.04); }
function loopNarr() {
  if (!T.on && !E.on) return; T.raf = requestAnimationFrame(loopNarr);
  const p = clipProgress(); if (T.on) { const seg = $$('#tsegs button')[T.i]; if (seg) seg.firstChild.style.width = (p * 100).toFixed(1) + '%'; }
  if (p > 0) markWords(p); $('#twave').classList.toggle('live', T.playing && (!T.aud.paused || !!T.fake));
  if (E.on) paintMini();
}
function paintPlay() { const b = $('#tplay'); b.innerHTML = T.playing ? ICON.pause : ICON.play; b.setAttribute('aria-label', T.playing ? 'השהיה' : 'המשך'); }
function paintMode() { $$('#tmode button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === T.mode)); }

// ---------- room renderings beside the eye-level tour (what the narrator is talking about)
const TSIDE = { entry: [['r_entry', 'כניסה']], living: [['living_kitchen', 'סלון ומטבח'], ['living_balcony', 'סלון ויציאה למרפסת']], kitchen: [['living_kitchen', 'מטבח']], balcony: [['living_balcony', 'מרפסת']], wing: [['r_tub', 'חדר אמבטיה'], ['r_laundry', 'מרפסת שירות']], kids: [['r_bed2', 'חדר שינה'], ['r_mamad', 'חדר שינה / ממ״ד']], mbed: [['r_mbed', 'חדר שינה הורים'], ['r_bath', 'חדר רחצה הורים']] };
const SD = { list: [], k: -1 };
function sideShow(s) {
  const box = $('#tside'); SD.list = T.on && T.mode === 'pov' ? (TSIDE[s.id] || []) : []; SD.k = -1;
  if (!SD.list.length) { box.hidden = true; return; }
  box.querySelector('.tsd').innerHTML = SD.list.length > 1 ? SD.list.map(() => '<i></i>').join('') : '';
  box.hidden = false; sideImg(0);
}
function sideImg(k) {
  if (k === SD.k || !SD.list[k]) return; SD.k = k; const box = $('#tside'), [f, cap] = SD.list[k];
  const img = new Image(); img.alt = cap; img.src = `img/${f}.webp`; img.className = 'in';
  const old = box.querySelector('.tsimg img'); box.querySelector('.tsimg').append(img); if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 700); }
  box.querySelector('figcaption b').textContent = cap; box.dataset.f = f;
  box.querySelectorAll('.tsd i').forEach((d, j) => d.classList.toggle('on', j === k));
}
T.aud.addEventListener('timeupdate', () => { if (SD.list.length > 1 && T.aud.duration) sideImg(T.aud.currentTime / T.aud.duration >= 0.5 ? 1 : 0); });
$('#tside').onclick = () => { const f = $('#tside').dataset.f; if (f) lightbox(`img/${f}.webp`, $('#tside figcaption b').textContent); };
// a shared link with &tour=pov opens the unit and offers the narrated eye-level tour (audio needs one tap)
function offerTour(mode) {
  if (T.on || $('#tstart')) return;
  const b = document.createElement('button'); b.id = 'tstart'; b.className = 'tstart';
  b.innerHTML = `<i>${ICON.play}</i><span><b>${mode === 'pov' ? 'סיור מודרך בגובה העיניים' : 'סיור מודרך בדירה'}</b><small>כ־3 דקות · עם קריינות · הקישו כדי להתחיל</small></span>`;
  b.onclick = () => { b.remove(); tourStart(mode); };
  $('#plan').append(b);
}

// ---------- guided tour
function tourStart(mode) {
  $('#tstart') && $('#tstart').remove();
  if (!A || !planOpen) return; if (view !== '3d') setView('3d'); if (E.on) walkStop(true);
  $('.rcard') && $('.rcard').remove(); selectRoomUI(null);
  T.on = true; T.playing = true; T.mode = mode; document.body.classList.add('touring'); T.i = -1; uiMode('tour'); paintMode();
  $('#tsegs').innerHTML = TOUR.map((s, i) => `<button data-i="${i}" aria-label="${s.title}"><i></i></button>`).join('');
  unlockAudio(); tourGo(0); loopNarr();
}
function tourStop(silent) {
  if (!T.on) return; T.on = false; T.playing = false; clearTimeout(T.timer); cancelAnimationFrame(T.raf); T.aud.pause(); T.fake = null; uiMode(null); document.body.classList.remove('touring'); $('#tside').hidden = true; SD.list = [];
  if (A) { A.highlight(selRoom); if (A.pov) A.povExit(silent ? 1.2 : 2.4); else if (!silent) A.home(1.8); else A.setDrift(0); }
}
function stageStop(s, prev) {
  if (T.mode === 'pov' && s.pov) {
    A.highlight(null);
    if (!A.pov) return fadeCut(() => { A.povEnter(s.pov.from || s.pov.pos, s.pov.look); return s.pov.from ? null : A.povGo(s.pov.pos, s.pov.look, [], { jump: true, sweep: s.pov.sweep }); }).then(() => s.pov.from && A.povGo(s.pov.pos, s.pov.look, [], { sweep: s.pov.sweep }));
    A.povOver(false); const arrive = () => s.pov.over && T.on && T.i === TOUR.indexOf(s) && A.povOver(true, s.pov.over.c, s.pov.over);
    if (prev === T.i - 1 && s.pov.path) return A.povGo(s.pov.pos, s.pov.look, s.pov.path, { sweep: s.pov.sweep }).then(arrive);
    return fadeCut(() => A.povGo(s.pov.pos, s.pov.look, [], { jump: true, sweep: s.pov.sweep })).then(arrive);
  }
  A.highlight(s.rooms); if (A.pov) A.povExit(2.4);
  A.tourTo(s);
}
function tourGo(i) {
  clearTimeout(T.timer); const prev = T.i; T.i = i = Math.max(0, Math.min(TOUR.length - 1, i)); const s = TOUR[i], last = i === TOUR.length - 1;
  stageStop(s, prev); if (!T.playing) A.setDrift(0);
  const c = $('#tcard'); c.classList.remove('in'); void c.offsetWidth; c.classList.add('in'); c.classList.toggle('end', last);
  $('#tn').innerHTML = `<b>${String(i + 1).padStart(2, '0')}</b> / ${TOUR.length}`; $('#ttitle').textContent = s.title;
  const im = $('#timg'); if (TIMG[s.id] && T.mode === 'top') { im.src = `img/${TIMG[s.id]}.webp`; im.alt = s.title; im.hidden = false; } else im.hidden = true;
  sideShow(s); setNarr(s.text); $('#tprev').disabled = i === 0; $('#tnext').disabled = last;
  $$('#tsegs button').forEach((b, k) => { b.classList.toggle('done', k < i); b.classList.toggle('cur', k === i); b.firstChild.style.width = k < i ? '100%' : '0%'; });
  loadClip(i); T.timer = setTimeout(() => T.playing && playClip(), i === 0 ? 1300 : T.mode === 'pov' ? 1100 : 1500); paintPlay();
}
function tourMode(m) {
  if (!T.on || m === T.mode) return; T.mode = m; paintMode(); uiMode('tour');
  const s = TOUR[T.i]; $('#timg').hidden = !(TIMG[s.id] && m === 'top'); if (TIMG[s.id] && m === 'top') $('#timg').src = `img/${TIMG[s.id]}.webp`;
  sideShow(s); stageStop(s, -9);
}
function tourToggle() {
  T.playing = !T.playing;
  if (T.playing) { if (!A.pov) A.setDrift(0.022); if (T.fake) T.fake.t0 = performance.now() - T.fake.pausedAt; else if (T.aud.ended || clipProgress() >= 1) { if (E.on) { T.aud.currentTime = 0; playClip(); } else clipDone(); } else playClip(); }
  else { A.setDrift(0); clearTimeout(T.timer); T.aud.pause(); if (T.fake) T.fake.pausedAt = performance.now() - T.fake.t0; }
  paintPlay();
}

// ---------- free walk with arrows
const NODES = NAV.nodes, EDGES = {};
for (const [a, b, via = []] of NAV.edges) { (EDGES[a] ||= []).push({ to: b, via }); (EDGES[b] ||= []).push({ to: a, via: [...via].reverse() }); }
const P2 = (p) => ({ x: p[0], y: p[1] });
function edgePoint(from, e, dist) { // point `dist` plan-px along the walking path of an edge
  const pts = [NODES[from].p, ...e.via, NODES[e.to].p]; let left = dist;
  for (let k = 1; k < pts.length; k++) { const [ax, ay] = pts[k - 1], [bx, by] = pts[k], L = Math.hypot(bx - ax, by - ay); if (left <= L || k === pts.length - 1) { const t = Math.min(1, left / (L || 1)); return [ax + (bx - ax) * t, ay + (by - ay) * t]; } left -= L; }
}
function walkStart() {
  if (!A || !planOpen) return; if (view !== '3d') setView('3d'); if (T.on) tourStop(true);
  $('.rcard') && $('.rcard').remove(); selectRoomUI(null); A.highlight(null);
  E.on = true; T.playing = false; T.clip = -1; uiMode('walk'); { const h = $('#whint'); h.hidden = true; void h.offsetWidth; h.hidden = false; h.style.setProperty('--tch', $('#tcard').offsetHeight + 'px'); } buildMini(); unlockAudio(); loopNarr();
  fadeCut(() => A.povEnter(NAV.start.p, NAV.start.look)).then(() => walkTo('entry', { to: 'entry', via: [] })).then(() => { if (E.on) A.povFree(true); });
  $('#joy').hidden = false;
}
function walkStop(silent) {
  if (!E.on) return; E.on = false; E.over = false; E.room = null; $('#joy').hidden = true; keys.clear(); A && A.povFree(false); $('#plan').classList.remove('overhead'); closeRooms(); E.busy = false; T.playing = false; T.aud.pause(); T.fake = null; cancelAnimationFrame(T.raf); uiMode(null); $('#nav').innerHTML = '';
  if (A && A.pov) A.povExit(silent ? 1.2 : 2.4);
}
async function walkTo(id, edge) {
  if (E.busy || !E.on) return; E.busy = true; const n = NODES[id]; $('#nav').innerHTML = ''; E.arrows = [];
  $('#plan').classList.add('moving'); if (E.over) setOver(false, true);
  if (edge) await A.povGo(n.p, n.look, edge.via, { sweep: 0.22 }); else await fadeCut(() => A.povGo(n.p, n.look, [], { jump: true, sweep: 0.22 }));
  $('#plan').classList.remove('moving'); if (!E.on) return;
  E.node = id; E.busy = false; showPlace(n); buildArrows(); if (n.over) setOver(true);
}
function setOver(on, quiet) {
  const n = NODES[E.node] || {}; const r = n.room && roomInfo(n.room); const c = (n.over && n.over.c) || (r && r.c) || n.p;
  E.over = on; A.povOver(on, c, n.over || {}); $('#plan').classList.toggle('overhead', on);
  const b = $('#tover'); b.innerHTML = on ? `${ICON.eye}<span>בגובה העיניים</span>` : `${ICON.top}<span>מבט מלמעלה</span>`; b.setAttribute('aria-pressed', on);
}
function showPlace(n) {
  const r = n.room ? roomInfo(n.room) : null; const c = $('#tcard'); c.classList.remove('in'); void c.offsetWidth; c.classList.add('in');
  $('#tn').innerHTML = r ? `<b>${r.size}</b>` : '<b>לאן ממשיכים?</b>'; $('#ttitle').textContent = r ? r.name : n.label;
  $('#timg').hidden = true;
  const fresh = n.clip != null && !E.heard.has(n.clip), same = n.clip != null && n.clip === T.clip;
  if (n.clip != null && !same) { setNarr(TOUR[n.clip].text); loadClip(n.clip); if (fresh) { E.heard.add(n.clip); T.playing = true; setTimeout(() => E.on && T.clip === n.clip && playClip(), 350); } else { T.playing = false; markWords(1); } }
  else if (n.clip == null) { T.aud.pause(); T.clip = -1; T.playing = false; setNarr('המסדרון מחבר בין חדרי השינה, הממ״ד, יחידת ההורים והמרפסת הגדולה. בחרו חץ כדי להמשיך.'); markWords(1); }
  $('#tplay').hidden = n.clip == null; paintPlay(); E.over = false; $('#plan').classList.remove('overhead'); { const b = $('#tover'); b.innerHTML = `${ICON.top}<span>מבט מלמעלה</span>`; b.setAttribute('aria-pressed', false); }
  $('#tgo').innerHTML = (EDGES[E.node] || []).map(e => `<button data-to="${e.to}">${ICON.next}${NODES[e.to].label}</button>`).join('');
  paintMini();
}
function buildArrows() {
  const box = $('#nav'); box.innerHTML = '';
  E.arrows = (EDGES[E.node] || []).map(e => {
    const len = (() => { const pts = [NODES[E.node].p, ...e.via, NODES[e.to].p]; let L = 0; for (let k = 1; k < pts.length; k++) L += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); return L; })();
    // anchor ~2.6 m out along the first leg (a point on the floor that sits comfortably inside the view)
    const p0 = NODES[E.node].p, p1 = e.via[0] || NODES[e.to].p, L1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, ux = (p1[0] - p0[0]) / L1, uy = (p1[1] - p0[1]) / L1;
    const d = 165, a = [p0[0] + ux * d, p0[1] + uy * d], b = [a[0] + ux * 25, a[1] + uy * 25];
    const el = document.createElement('button'); el.className = 'narrow'; el.innerHTML = `<i>${ICON.up}</i><span>${NODES[e.to].label}</span>`; el.onclick = () => walkTo(e.to, e); box.append(el);
    return { el, e, a: A.floorPoint(...a), b: A.floorPoint(...b) };
  });
}
function paintNav() {
  if (!E.on || !A || E.busy) return; const W = innerWidth, H = innerHeight;
  for (const r of E.arrows) {
    const p = A.project(r.a), q = A.project(r.b); const ok = p.vis && q.vis && p.x > 40 && p.x < W - 40 && p.y > H * 0.42 && p.y < H - 30;
    r.el.style.opacity = ok ? 1 : 0; r.el.style.pointerEvents = ok ? 'auto' : 'none';
    if (ok) { const ang = Math.atan2(q.x - p.x, -(q.y - p.y)) * 180 / Math.PI; r.el.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%)`; r.el.firstChild.style.transform = `rotateX(52deg) rotate(${ang}deg)`; }
  }
}
const keys = new Set();
const KEYMAP = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', KeyD: 'r', ArrowLeft: 'tl', ArrowRight: 'tr', KeyQ: 'tl', KeyE: 'tr' };
function applyKeys() { if (!A) return; const f = (keys.has('f') ? 1 : 0) - (keys.has('b') ? 1 : 0), st = (keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0), t = (keys.has('tl') ? 1 : 0) - (keys.has('tr') ? 1 : 0); if (f || st || t) leaveNode(); A.povMove(f, st, t); }
function walkKey(e) {
  if (e.key === 'Escape') return $('#rmap').hidden ? walkStop() : closeRooms();
  const k = KEYMAP[e.code]; if (k && !e.target.closest('input,textarea')) { e.preventDefault(); if (E.busy) return; keys.add(k); applyKeys(); return; }
  if (e.key === ' ' && !e.target.closest('button,a')) { e.preventDefault(); if (T.clip >= 0) tourToggle(); }
  else if (e.key === 'm' || e.key === 'צ') openRooms(); else if (e.key === 'o' || e.key === 'ם') setOver(!E.over);
}
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k && keys.delete(k)) applyKeys(); });
addEventListener('blur', () => { if (keys.size) { keys.clear(); applyKeys(); } });
// once you move on your own, the point-of-interest arrows step aside; they return when you stop near a viewpoint
function leaveNode() { if (E.node === null) return; E.node = null; E.arrows = []; $('#nav').innerHTML = ''; $('#tgo').innerHTML = ''; paintMini(); }
let lastFree = 0;
function freeTick() {
  const pv = A.pov; if (!pv || E.busy) return;
  const room = A.roomAt(pv.x, pv.y) || E.room; if (room && room !== E.room) { E.room = room; showRoom(room); }
  const now = performance.now(); if (now - lastFree < 300) return; lastFree = now; paintMini();
  if (E.node === null && !keys.size && !pv.walking) { let best = null, bd = 45; for (const [id, n] of Object.entries(NODES)) { const d = Math.hypot(n.p[0] - pv.x, n.p[1] - pv.y); if (d < bd) { bd = d; best = id; } } if (best) { E.node = best; buildArrows(); $('#tgo').innerHTML = (EDGES[best] || []).map(e => `<button data-to="${e.to}">${ICON.next}${NODES[e.to].label}</button>`).join(''); } }
}
function showRoom(id) { // card follows the room you are standing in
  const r = roomInfo(id); if (!r) return; const node = Object.values(NODES).find(n => n.room === id);
  $('#tn').innerHTML = `<b>${r.size}</b>`; $('#ttitle').textContent = r.name;
  if (node && node.clip != null && node.clip !== T.clip) { setNarr(TOUR[node.clip].text); loadClip(node.clip); T.playing = false; markWords(1); $('#tplay').hidden = false; paintPlay(); }
}
// on-screen joystick (touch + mouse): up/down walks, left/right turns
{ const j = $('#joy'), knob = j.querySelector('i'); let id = null, c = null;
  const set = (dx, dy) => { const R = 44, L = Math.min(R, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); const x = Math.cos(a) * L, y = Math.sin(a) * L; knob.style.transform = `translate(${x}px,${y}px)`; const f = -y / R, t = -x / R; const ff = Math.abs(f) < 0.15 ? 0 : f, tt = Math.abs(t) < 0.2 ? 0 : t * 0.9; if (ff || tt) leaveNode(); A && A.povMove(ff, 0, tt); };
  j.addEventListener('pointerdown', e => { id = e.pointerId; j.setPointerCapture(id); const r = j.getBoundingClientRect(); c = [r.left + r.width / 2, r.top + r.height / 2]; j.classList.add('on'); set(e.clientX - c[0], e.clientY - c[1]); e.preventDefault(); });
  j.addEventListener('pointermove', e => { if (e.pointerId === id) set(e.clientX - c[0], e.clientY - c[1]); });
  const end = e => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; j.classList.remove('on'); A && A.povMove(0, 0, 0); };
  j.addEventListener('pointerup', end); j.addEventListener('pointercancel', end); }
// all-rooms navigator: a large plan with numbered pins plus a list, tap either to go there
const GOTO = ['entry', 'living', 'dining', 'kitchen', 'balcony', 'hall', 'tub', 'laundry', 'mamad', 'bed2', 'mbed', 'bath'];
function openRooms() {
  const ov = $('#rmap'); ov.hidden = false; const box = $('#rmimg'), w = box.clientWidth || 320, k = w / (MK.x1 - MK.x0);
  box.style.height = (MK.y1 - MK.y0) * k + 'px'; box.style.backgroundSize = `${PI.w * k / PI.k}px auto`; box.style.backgroundPosition = `${-(MK.x0 - PI.ox) * k}px ${-(MK.y0 - PI.oy) * k}px`;
  const pv = A.pov; box.innerHTML = GOTO.map((id, i) => { const n = NODES[id]; return `<button data-n="${id}" class="${id === E.node ? 'here' : ''}" style="left:${(n.p[0] - MK.x0) * k}px;top:${(n.p[1] - MK.y0) * k}px">${i + 1}</button>`; }).join('') + (pv ? `<i class="you" style="left:${(pv.x - MK.x0) * k}px;top:${(pv.y - MK.y0) * k}px"></i>` : '');
  $('#rml').innerHTML = GOTO.map((id, i) => { const n = NODES[id], r = n.room && roomInfo(n.room); const im = r && r.img ? `<img src="img/${r.img}_s.webp" alt="">` : `<em>${i + 1}</em>`; return `<button data-n="${id}" class="${id === E.node ? 'here' : ''}">${im}<span><b>${n.label}</b><small>${id === E.node ? 'אתם כאן' : r ? r.size : ''}</small></span></button>`; }).join('');
  requestAnimationFrame(() => ov.classList.add('on'));
}
function closeRooms() { const ov = $('#rmap'); ov.classList.remove('on'); setTimeout(() => ov.hidden = true, 280); }
$('#rmap').onclick = e => { const b = e.target.closest('[data-n]'); if (b) { closeRooms(); const id = b.dataset.n; if (id !== E.node) { const ed = (EDGES[E.node] || []).find(x => x.to === id); walkTo(id, ed || null); } return; } if (e.target === $('#rmap') || e.target.closest('#rmx')) closeRooms(); };
$('#tall').onclick = () => openRooms(); $('#ttext').onclick = () => E.on && $('#ttext').classList.toggle('full'); $('#tover').onclick = () => E.on && !E.busy && setOver(!E.over);
// mini plan: where you are, which way you look; tap it for the full room map
const MK = { x0: 250, y0: 120, x1: 1230, y1: 1160 };
// the plan sheet image: plans/C_hi.webp is the PDF cropped at (240,110) pt and rendered at 2.4 px per pt
const PI = { w: 2400, k: 2.4, ox: 240, oy: 110 };
function buildMini() {
  const m = $('#mini'), k = m.clientWidth / (MK.x1 - MK.x0) || 0.18; m.style.height = (MK.y1 - MK.y0) * k + 'px';
  m.style.backgroundSize = `${PI.w * k / PI.k}px auto`; m.style.backgroundPosition = `${-(MK.x0 - PI.ox) * k}px ${-(MK.y0 - PI.oy) * k}px`;
  m.innerHTML = GOTO.map(id => { const n = NODES[id]; return `<span data-n="${id}" style="left:${(n.p[0] - MK.x0) * k}px;top:${(n.p[1] - MK.y0) * k}px"></span>`; }).join('') + `<i class="me"><b></b></i><em class="mtag">${ICON.map}<span>כל החדרים</span></em>`;
}
function paintMini() {
  const pv = A && A.pov, m = $('#mini'); if (!pv || m.hidden) return; const k = m.clientWidth / (MK.x1 - MK.x0); const me = m.querySelector('.me');
  me.style.transform = `translate(${(pv.x - MK.x0) * k}px,${(pv.y - MK.y0) * k}px) rotate(${(Math.PI - pv.yaw) * 180 / Math.PI}deg)`;
  m.querySelectorAll('span[data-n]').forEach(b => b.classList.toggle('on', b.dataset.n === E.node));
}
$('#mini').onclick = () => E.on && openRooms();
$('#tgo').onclick = e => { const b = e.target.closest('button'); if (!b || !E.on) return; const ed = (EDGES[E.node] || []).find(x => x.to === b.dataset.to); ed && walkTo(ed.to, ed); };

function tourKey(e) {
  if (E.on) return walkKey(e);
  if (e.key === 'Escape') tourStop(); else if (e.key === ' ' && !e.target.closest('button,a')) { e.preventDefault(); tourToggle(); }
  else if (e.key === 'ArrowLeft') tourGo(T.i + 1); else if (e.key === 'ArrowRight') tourGo(T.i - 1);
}
$('#tplay').onclick = tourToggle; $('#tnext').onclick = () => tourGo(T.i + 1); $('#tprev').onclick = () => tourGo(T.i - 1);
$('#tclose').onclick = () => E.on ? walkStop() : tourStop(); $('#tfree').onclick = () => tourStop(); $('#tagain').onclick = () => { T.playing = true; tourGo(0); };
$('#twalk').onclick = () => walkStart();
$('#tmode').onclick = e => { const b = e.target.closest('button'); b && tourMode(b.dataset.m); };
$('#tmute').onclick = () => { T.muted = !T.muted; T.aud.muted = T.muted; $('#tmute').innerHTML = T.muted ? ICON.mute : ICON.sound; $('#tmute').setAttribute('aria-pressed', T.muted); };
$('#tsegs').onclick = e => { const b = e.target.closest('button'); if (b) { T.playing = true; tourGo(+b.dataset.i); } };
$('#tall').innerHTML = `${ICON.map}<span>כל החדרים</span>`; $('#tmute').innerHTML = ICON.sound; $('#tprev').innerHTML = ICON.prev; $('#tnext').innerHTML = ICON.next; $('#tclose').innerHTML = ICON.x; $('#tcall').href = SITE.tel; $('#tcall').insertAdjacentHTML('afterbegin', ICON.phone);
$('#tourFab').insertAdjacentHTML('afterbegin', `<i>${ICON.play}</i>`);
$('#tmode').innerHTML = `<button data-m="top">${ICON.cube}<span>מלמעלה</span></button><button data-m="pov">${ICON.walk}<span>הליכה</span></button>`;
$('#tmenu').innerHTML = `<button data-tour="top">${ICON.cube}<span><b>סיור מלמעלה</b><small>מבט על הדירה, חדר אחר חדר</small></span></button><button data-tour="pov">${ICON.walk}<span><b>סיור בגובה העיניים</b><small>הולכים יחד בתוך הדירה</small></span></button><button data-tour="walk">${ICON.move}<span><b>שיטוט חופשי</b><small>מנווטים בעצמכם עם חצים</small></span></button>`;

setTimeout(() => import('./apt.js').catch(() => { }), 1500);
render();
// realistic layer switch
$('#realBtn').onclick = async () => {
  const b = $('#realBtn'); if (!A || b.classList.contains('busy')) return; const on = !A.realistic;
  b.classList.add('busy'); b.style.setProperty('--p', 0); b.querySelector('.pct').textContent = on ? 'טוען…' : '';
  try { await A.setRealistic(on, p => { b.style.setProperty('--p', p); b.querySelector('.pct').textContent = Math.round(p * 100) + '%'; }); }
  catch (e) { console.error(e); } finally { b.classList.remove('busy'); }
  b.setAttribute('aria-pressed', A.realistic);
  if (A.realistic && !b.dataset.told) { b.dataset.told = 1; const t = document.createElement('div'); t.className = 'rtoast'; t.textContent = A.pov ? 'מצב ריאליסטי פעיל' : 'מצב ריאליסטי פעיל · נסו סיור בגובה העיניים כדי לראות את הנוף'; $('#plan').append(t); setTimeout(() => t.remove(), 5200); }
};
window.__app = { go, hover, showFloor, tourStart, tourGo, tourMode, walkStart, walkTo, T, E, NODES, EDGES };
