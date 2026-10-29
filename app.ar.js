// WalkMeIn mobile-first landing: photo hero, app-style flow, a live 3D apartment card.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildApartment, ROOMS } from './model.ar.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const capture = params.has('capture');
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
if (params.get('c')) { const f = $('#forLine'); f.textContent = 'أُعدّ لـ ' + params.get('c'); f.hidden = false; }

// ------------------------------------------------------------ reveal on scroll
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.25 });
$$('.flow,.meter,.chartc,.dash,.pgrid').forEach(el => capture ? el.classList.add('in') : io.observe(el));

// hero parallax + tab bar appears after the hero
const photo = $('.photo'), tabs = $('#tabs'), hero = $('.hero');
function onScroll() {
  const y = scrollY, h = hero.offsetHeight;
  if (!reduce && innerWidth >= 900) photo.style.transform = `translateY(${y * 0.25}px) scale(1.06)`;
  tabs.classList.toggle('on', y > h * 0.6);
  const ids = ['top', 'model', 'contact', 'pricing', 'faq'];
  let cur = 'top'; for (const id of ['model', 'pricing', 'faq', 'contact']) { const el = document.getElementById(id); if (el.getBoundingClientRect().top < innerHeight * 0.5) cur = id; }
  $$('#tabs a').forEach((a, i) => a.classList.toggle('on', ids[i] === cur && cur !== 'contact'));
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// ------------------------------------------------------------ pinned scenes: progress 0..1 while the section is stuck
const pins = $$('[data-pin]');
const prog = el => { const r = el.getBoundingClientRect(); return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight))); };
const live = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };

// ------------------------------------------------------------ live 3D card
const canvas = $('#gl'), card = canvas.parentElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: capture });
renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.5;
const camera = new THREE.PerspectiveCamera(18, 1, 0.05, 400);
const sun = new THREE.DirectionalLight(0xfffaf0, 2.6); sun.position.set(-12, 24, -6); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 2, far: 70 }); sun.shadow.radius = 5; sun.shadow.blurSamples = 12;
scene.add(sun, new THREE.HemisphereLight(0xffffff, 0xdcd8cc, 1.1));
const catcher = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ color: 0x3e4a36, opacity: 0.18 }));
catcher.rotation.x = -Math.PI / 2; catcher.position.y = -0.52; catcher.receiveShadow = true; scene.add(catcher);

const L = buildApartment(), root = new THREE.Group(); scene.add(root);
root.add(L.base, L.walls); for (const k in L.sets) root.add(L.sets[k]);
const SETS = { baths: [4.2, 0], kitchen: [4.8, 1], dining: [5.2, 2], living: [5.6, 3], closet: [4.6, 4], master: [6.0, 5], bed2: [5.0, 6], bed3: [5.4, 7], balcony: [4.4, 8], plants: [5.9, 9] };
const [hx0, hz0, hx1, hz1] = ROOMS.living.r;
const hlMat = new THREE.MeshBasicMaterial({ color: 0xf3dc2d, transparent: true, opacity: 0, depthWrite: false });
const hl = new THREE.Mesh(new THREE.PlaneGeometry(hx1 - hx0 - 0.1, hz1 - hz0 - 0.1), hlMat); hl.rotation.x = -Math.PI / 2; hl.position.set((hx0 + hx1) / 2, 0.08, (hz0 + hz1) / 2); root.add(hl);

// one state per feature card: camera (target, azimuth, elevation, distance, fov) + model (wall lift, furniture lift, highlight, tags)
const K = [
  { tx: 0, ty: -0.3, tz: 0.9, az: 0.62, el: 0.8, d: 56, fov: 18, wy: 0, fy: 0, hl: 0, tg: 0 },
  { tx: 0, ty: 0, tz: 0.9, az: 0.0, el: 1.5, d: 58, fov: 18, wy: 0, fy: 0, hl: 0, tg: 0 },
  { tx: -1.2, ty: 0, tz: 1.6, az: 0.4, el: 0.95, d: 44, fov: 18, wy: 0, fy: 0, hl: 1, tg: 1 },
  { tx: 0, ty: 3.4, tz: 0.9, az: 0.85, el: 0.55, d: 74, fov: 18, wy: 3.2, fy: 1, hl: 0, tg: 0 },
  { tx: -3.4, ty: 0.8, tz: 3.4, az: 2.411, el: 0.146, d: 5.15, fov: 62, wy: 0, fy: 0, hl: 0, tg: 0 },
];
const st = { ...K[0] };
const sm = THREE.MathUtils.smoothstep;
function sample(x) { const i = Math.min(K.length - 2, Math.floor(x)), t = sm(Math.min(1, Math.max(0, (x - i - 0.25) / 0.5)), 0, 1); for (const k in K[0]) st[k] = K[i][k] + (K[i + 1][k] - K[i][k]) * t; }

const tags = [[$('.t1'), new THREE.Vector3(-3.2, 1.0, 1.0)], [$('.t2'), new THREE.Vector3(-1.0, 1.0, 5.4)], [$('.t3'), new THREE.Vector3(3.6, 1.0, 2.6)]];
const v = new THREE.Vector3(), tgt = new THREE.Vector3();
let yawU = 0, drag = null, W = 1, H = 1, fx = 0, fxs = 0;
function fit() { W = card.clientWidth; H = card.clientHeight; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
new ResizeObserver(fit).observe(card); fit();
canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: yawU }; canvas.setPointerCapture(e.pointerId); $('#hint').style.opacity = 0; });
canvas.addEventListener('pointermove', e => { if (drag) yawU = drag.y + (e.clientX - drag.x) * 0.012; });
canvas.addEventListener('pointerup', () => (drag = null)); canvas.addEventListener('pointercancel', () => (drag = null));

const modelSec = $('#model'), deckCards = $$('.dcard'), dots = $$('#dots i');
function deck(x) {
  if (innerWidth >= 900) { const cur = Math.round(x); deckCards.forEach((c, i) => { c.style.transform = ''; c.style.opacity = ''; c.style.removeProperty('--c'); c.classList.toggle('on', i === cur); c.classList.toggle('done', i < cur); }); dots.forEach((d, i) => d.classList.toggle('on', i === cur)); return; }
  deckCards.forEach((c, i) => {
    const o = i - x; // 0 = front, >0 waiting below, <0 gone
    let ty, s, op, rx;
    if (o >= 0) { ty = Math.min(o, 3) * 14; s = 1 - Math.min(o, 3) * 0.05; op = o > 2.5 ? 0 : 1 - Math.max(0, o - 1.5); rx = 0; }
    else { ty = o * 160; s = 1 + o * 0.1; op = 1 + o * 1.4; rx = o * -30; }
    c.style.transform = `translateY(${ty}px) scale(${s}) rotateX(${rx}deg)`;
    c.style.opacity = Math.max(0, op); c.style.zIndex = 10 - i;
    c.style.setProperty('--c', Math.max(0, Math.min(1, 1 - Math.abs(o) * 1.6)).toFixed(3));
  });
  dots.forEach((d, i) => d.classList.toggle('on', i === Math.round(x)));
}

let last = performance.now(), time = 0;
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
  vscene(); hscene();
  if (!live(modelSec)) return;
  fx = prog(modelSec) * (K.length - 1) * 1.04; fx = Math.min(fx, K.length - 1);
  fxs += (fx - fxs) * (capture ? 1 : 1 - Math.exp(-dt * 6));
  sample(fxs); deck(fxs);
  // model
  L.walls.position.y = st.wy;
  for (const k in SETS) { const [h, i] = SETS[k]; L.sets[k].position.y = h * sm(Math.min(1, Math.max(0, st.fy * 1.6 - i * 0.06)), 0, 1); }
  hlMat.opacity = 0.42 * st.hl; hl.visible = st.hl > 0.01;
  const spin = fxs < 0.6 && !reduce && !capture ? time * 0.12 : 0;
  root.rotation.y = (1 - Math.min(1, fxs)) * (Math.sin(spin) * 0.6) + yawU * (st.fov > 30 ? 0.3 : 1);
  const k = st.fov > 30 ? 1 : Math.max(1, 0.85 / camera.aspect) * (innerWidth >= 900 ? 0.8 : 1);
  tgt.set(st.tx, st.ty, st.tz);
  camera.position.set(Math.sin(st.az) * Math.cos(st.el), Math.sin(st.el), Math.cos(st.az) * Math.cos(st.el)).multiplyScalar(st.d * k).add(tgt);
  camera.lookAt(tgt); camera.fov = st.fov; camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  root.updateMatrixWorld();
  const tagOn = fxs < 0.5 || Math.abs(fxs - 2) < 0.5;
  for (const [elx, p3] of tags) { v.copy(p3).applyMatrix4(root.matrixWorld).project(camera); elx.style.left = (v.x + 1) / 2 * W + 'px'; elx.style.top = (1 - v.y) / 2 * H + 'px'; elx.style.opacity = tagOn ? 1 : 0; }
  $('#hint').style.display = fxs < 0.4 ? '' : 'none';
}
requestAnimationFrame(tick);

// ------------------------------------------------------------ narrated tour player
const vid = $('#tourVid'), snd = $('#snd'), aud = new Audio('../media/living-ar.mp3'), wcv = $('#vwave'), wctx = wcv.getContext('2d'), words = $$('#sub2 span'), vt = $('#vt');
aud.loop = true; let actx = null, an = null, buf = null, soundOn = false;
new IntersectionObserver(es => { const on = es[0].isIntersecting; if (on) { vid.play().catch(() => {}); if (soundOn) aud.play().catch(() => {}); } else { vid.pause(); aud.pause(); } }, { threshold: 0.35 }).observe($('#player'));
snd.addEventListener('click', () => {
  soundOn = !soundOn; snd.setAttribute('aria-pressed', soundOn); snd.setAttribute('aria-label', soundOn ? 'كتم التعليق الصوتي' : 'تشغيل التعليق الصوتي'); $('#tapme').style.opacity = soundOn ? 0 : 0.7;
  if (soundOn) {
    if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; actx = new AC(); const src = actx.createMediaElementSource(aud); an = actx.createAnalyser(); an.fftSize = 128; buf = new Uint8Array(an.frequencyBinCount); src.connect(an); an.connect(actx.destination); }
    actx.resume(); aud.currentTime = 0; aud.play().catch(() => {}); vid.currentTime = 0; vid.play().catch(() => {});
  } else aud.pause();
});
const BARS = 44;
function vwave(t) {
  const w = wcv.clientWidth, h = wcv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  if (wcv.width !== Math.round(w * dpr)) { wcv.width = Math.round(w * dpr); wcv.height = Math.round(h * dpr); }
  wctx.setTransform(dpr, 0, 0, dpr, 0, 0); wctx.clearRect(0, 0, w, h);
  if (soundOn && an) an.getByteFrequencyData(buf);
  const bw = w / BARS, prog = soundOn ? aud.currentTime / (aud.duration || 18) : (t / 18000) % 1;
  for (let i = 0; i < BARS; i++) {
    let a = soundOn && buf ? buf[Math.min(buf.length - 1, 2 + Math.floor(i * 0.9))] / 255 : 0.25 + 0.2 * Math.sin(t / 380 + i * 0.7) * Math.sin(t / 900 + i * 0.3);
    a = Math.max(0.08, Math.min(1, a)); const bh = a * h, x = w - (i + 1) * bw; // RTL: progress grows from the right
    wctx.fillStyle = (i / BARS) < prog ? '#f3dc2d' : 'rgba(255,255,255,.5)';
    wctx.beginPath(); wctx.roundRect(x + bw * 0.2, (h - bh) / 2, bw * 0.6, bh, 2); wctx.fill();
  }
  const sec = soundOn ? aud.currentTime : (t / 1000) % 18; vt.textContent = `0:${String(Math.floor(sec)).padStart(2, '0')}`;
  const n = Math.floor(prog * words.length * 1.04); words.forEach((s, i) => s.classList.toggle('on', i < n));
}
(function vloop(t) { requestAnimationFrame(vloop); const r = $('#player').getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) vwave(t); })(0);

// ------------------------------------------------------------ (legacy chat, removed)
function vscene() {}

// ------------------------------------------------------------ how it works: one simulated step at a time
const how = $('#how'), hs = $$('.hs'), hsteps = $$('#hsteps li'), hstage = $('#hstage');
function hscene() {
  if (!live(how)) return;
  const p = prog(how) * 4, i = Math.min(3, Math.floor(p)), k = Math.min(1, (p - i) * 1.4);
  hs.forEach((s, j) => { s.classList.toggle('on', j === i); s.classList.toggle('k', j === i && k > 0.55); });
  hsteps.forEach((s, j) => s.classList.toggle('on', j === i));
  hstage.style.setProperty('--k', capture ? 1 : k.toFixed(3));
}


// ------------------------------------------------------------ desktop hero: cycle through apartments on the building
{
  const svg = $('#apts'), tag = $('#aptag');
  const mob = () => innerWidth < 900;
  // mobile: same wide photo, building centred; svg viewBox follows the visible crop
  function fit() {
    const img = $('.hero .photo');
    if (!mob()) { img.style.objectPosition = ''; svg.setAttribute('viewBox', '0 0 2688 1520'); svg.setAttribute('preserveAspectRatio', 'xMidYMid slice'); return; }
    const W = hero.clientWidth, H = hero.clientHeight, sc = Math.max(W / 2688, H / 1520);
    const ox = Math.min(0, Math.max(W - 2688 * sc, W * 0.5 - 943 * sc)), oy = (H - 1520 * sc) * 0.3;
    img.style.objectPosition = `${ox}px ${oy}px`;
    svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('viewBox', `${-ox / sc} ${-oy / sc} ${W / sc} ${H / sc}`);
  }
  if (svg) {
    fit();
    const aps = $$('#apts .ap'), line = $('#apl'), dot = $('#apc');
    const FEED = [['أحمد','من دبي','شاهد الشقة','الآن'],['سارة','من الشارقة','قامت بجولة مرشدة في الشقة','قبل دقيقة'],['خالد وليلى','من أبوظبي','شاركا الشقة','قبل 3 د'],['نورة','من الرياض','استعرضت الشقة','قبل 4 د'],['أيمن','من جدة','ترك بياناته بخصوص الشقة','قبل 6 د'],['ريم','من الدوحة','قامت بجولة مرشدة في الشقة','قبل 8 د'],['عمر','من العين','شاهد الشقة','قبل 9 د'],['مريم','من الدمام','حفظت الشقة','قبل 12 د']]; let i = 0;
    const toScreen = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const m = svg.getScreenCTM(); const p = pt.matrixTransform(m); const r = svg.parentElement.getBoundingClientRect(); return [p.x - r.left, p.y - r.top]; };
    function show() {
      aps.forEach(a => a.classList.remove('on')); const a = aps[i % aps.length]; a.classList.add('on');
      const cx = +a.dataset.cx, cy = +a.dataset.cy;
      dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); line.setAttribute('x1', cx); line.setAttribute('y1', cy);
      if (mob()) {
        // card above the apartment (or below when there is no room under the bar)
        const r = a.getBBox(), [, top] = toScreen(cx, r.y), [, bot] = toScreen(cx, r.y + r.height), [sx] = toScreen(cx, cy);
        const W = hero.clientWidth, tw = tag.offsetWidth || 250, th = tag.offsetHeight || 92, above = top - th - 18 > 84;
        const ty = above ? top - 14 - th : bot + 14, lx = Math.min(W - 12 - tw, Math.max(12, sx - tw / 2));
        tag.style.left = lx + 'px'; tag.style.top = ty + 'px'; tag.classList.add('on');
        const m = svg.getScreenCTM().inverse(), pt = svg.createSVGPoint(), hr = hero.getBoundingClientRect();
        pt.x = sx + hr.left; pt.y = (above ? ty + th : ty) + hr.top; const q = pt.matrixTransform(m);
        line.setAttribute('x2', cx); line.setAttribute('y2', q.y);
      } else {
        const tx = 1330; line.setAttribute('x2', tx); line.setAttribute('y2', cy);
        const [sx, sy] = toScreen(tx, cy); tag.style.left = sx + 'px'; tag.style.top = sy + 'px'; tag.classList.add('on');
      }
      const f = FEED[i % FEED.length]; $('#apav').textContent = f[0][0]; $('#aptb').textContent = `${f[0]} ${f[1]}`; $('#aptk').textContent = `${f[2]} ${a.dataset.n}، الطابق ${a.dataset.f}`; $('#apts').lastChild.textContent = f[3];
      i++;
      if (mob() && i % aps.length >= 6) i += aps.length - (i % aps.length); // floor 2 sits under the headline on phones
    }
    setTimeout(() => { show(); if (!capture) setInterval(show, 2800); }, capture ? 0 : 2600);
    addEventListener('resize', () => { fit(); i = Math.max(0, i - 1); show(); });
  }
}

// ------------------------------------------------------------ dashboard: counters + bars
{
  const bars = $('#bars'); let html = '';
  const V = [38, 52, 47, 61, 58, 72, 66, 80, 77, 91, 86, 98, 94, 112], Lq = [3, 4, 3, 5, 5, 6, 5, 7, 6, 8, 7, 9, 8, 10];
  V.forEach((v, i) => { const x = 280 - (i + 1) * 20 + 3; html += `<rect class="bv" x="${x}" y="120" width="9" height="0" rx="3" fill="#1c1f1b" data-h="${v}"/><rect class="bl" x="${x + 9.5}" y="120" width="6" height="0" rx="2" fill="#f3dc2d" data-h="${Lq[i] * 6}"/>`; });
  bars.innerHTML = html;
  const run = () => {
    $$('#bars rect').forEach((r, i) => setTimeout(() => { const hh = +r.dataset.h; r.setAttribute('y', 120 - hh); r.setAttribute('height', hh); }, capture ? 0 : i * 40));
    $$('.kpi b').forEach(b => { const n = +b.dataset.n, d = +(b.dataset.d || 0), s = b.dataset.s || ''; let t0 = null;
      const step = t => { t0 ??= t; const k = capture ? 1 : Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - k, 3); b.textContent = (n * e).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) + s; if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step); });
  };
  const dash = $('#dash');
  if (capture) { dash.classList.add('in'); run(); } else new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { dash.classList.add('in'); run(); o.disconnect(); } }, { threshold: 0.2 }).observe(dash);
}

// ------------------------------------------------------------ pricing calculator
{
  const BASE = 1490, TIER = n => n <= 3 ? 890 : n <= 8 ? 690 : 490;
  const range = $('#range'), out = $('#nTypes'), fmt = n => '₪' + Math.round(n).toLocaleString('en-US');
  function typesCost(n) { let c = 0; for (let i = 2; i <= n; i++) c += TIER(i); return c; }
  function calc() {
    const n = +range.value; out.textContent = n;
    $$('.tiers span').forEach(s => s.classList.toggle('on', (s.dataset.t == 1 && n >= 2 && n <= 3) || (s.dataset.t == 2 && n >= 4 && n <= 8) || (s.dataset.t == 3 && n >= 9)));
    const lines = [['أساس المشروع (يشمل نوع الشقة الأول)', BASE]];
    if (n > 1) lines.push([`${n - 1} أنواع شقق إضافية`, typesCost(n)]);
    let unitCost = BASE + typesCost(n);
    $$('#adds input').forEach(i => { if (!i.checked) return; const name = i.closest('label').querySelector('b').textContent; const c = i.dataset.per ? +i.dataset.per * n : +i.dataset.fix; lines.push([name, c]); if (i.dataset.per) unitCost += c; });
    const total = lines.reduce((s, l) => s + l[1], 0);
    $('#lines').innerHTML = lines.map(([k, v]) => `<li><span>${k}</span><b>${fmt(v)}</b></li>`).join('');
    window.__pkg = { n, lines, total };
    animateTo($('#total'), total); $('#per').textContent = fmt(unitCost / n);
    $('#perbar').style.width = Math.max(18, Math.min(100, (unitCost / n) / BASE * 100)) + '%';
  }
  let cur = 0;
  function animateTo(el, v) { const from = cur; cur = v; const t0 = performance.now(); const step = t => { const k = Math.min(1, (t - t0) / 450); el.textContent = fmt(from + (v - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; capture ? (el.textContent = fmt(v)) : requestAnimationFrame(step); }
  range.addEventListener('input', calc);
  $('#minus').addEventListener('click', () => { range.value = +range.value - 1; calc(); });
  $('#plus').addEventListener('click', () => { range.value = +range.value + 1; calc(); });
  $$('#adds input').forEach(i => i.addEventListener('change', calc));
  $('#adds input[data-k="tour"]').checked = true; calc();
}

// ------------------------------------------------------------ FAQ: tabs + stacked deck
{
  let g = 0, i = 0; const desk = () => innerWidth >= 900;
  const deckOf = () => $(`.qdeck[data-g="${g}"]`), cards = () => [...deckOf().querySelectorAll('.qc')];
  function lay() {
    const cs = cards(); i = (i + cs.length) % cs.length;
    cs.forEach((c, j) => {
      const o = (j - i + cs.length) % cs.length;
      const x = desk() ? -o * 9 : 0, y = desk() ? 0 : o * 14, s = 1 - o * (desk() ? 0.06 : 0.05);
      c.style.transform = `translate(${x}%, ${y}px) scale(${s})`; c.style.zIndex = 20 - o;
      c.style.opacity = o > 3 ? 0 : 1; c.style.filter = o ? `brightness(${1 - o * 0.12})` : '';
      c.querySelector('.qb').style.opacity = o ? 0.25 : 1;
    });
    $('#qcount').textContent = `${i + 1} / ${cs.length}`;
  }
  $$('.qtabs button').forEach(b => b.addEventListener('click', () => {
    g = +b.dataset.g; i = 0; $$('.qtabs button').forEach(x => x.setAttribute('aria-selected', x === b));
    $$('.qdeck').forEach(d => d.hidden = d.dataset.g != g); lay();
  }));
  $('#qnext').addEventListener('click', () => { i++; lay(); });
  $('#qprev').addEventListener('click', () => { i--; lay(); });
  $$('.qc').forEach(c => c.addEventListener('click', () => { const j = +c.dataset.i; if (j !== i) { i = j; lay(); } }));
  addEventListener('resize', lay); lay();
}

// ------------------------------------------------------------ top bar + menu
const barEl = $('#bar'), burger = $('#burger');
addEventListener('scroll', () => barEl.classList.toggle('solid', scrollY > innerHeight * 0.75), { passive: true });
function setMenu(on) { document.body.classList.toggle('mopen', on); burger.setAttribute('aria-expanded', on); $('#menu').setAttribute('aria-hidden', !on); }
burger.addEventListener('click', () => setMenu(!document.body.classList.contains('mopen')));
$$('#menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// ------------------------------------------------------------ features accordion: one open, picture follows
const fimg = $('#fimg');
$$('#acc details').forEach(d => d.addEventListener('toggle', () => {
  if (!d.open) return;
  $$('#acc details').forEach(o => o !== d && (o.open = false));
  fimg.style.opacity = 0; setTimeout(() => { fimg.src = d.dataset.img; fimg.style.opacity = 1; }, 200);
}));

// mobile: open the feature that reaches the pinned picture as you scroll
if (innerWidth < 900) {
  const items = $$('#acc details'); let lastOpen = null;
  addEventListener('scroll', () => {
    const line = 64 + 240 + 40; let pick = null;
    for (const d of items) { const r = d.getBoundingClientRect(); if (r.top < line + 30) pick = d; }
    if (pick && pick !== lastOpen && $('#feats').getBoundingClientRect().top < 80) { lastOpen = pick; pick.open = true; }
  }, { passive: true });
}

// ------------------------------------------------------------ footer: the model turning slowly in the dark
{
  const c2 = $('#gl2'), box = c2.parentElement;
  const r2 = new THREE.WebGLRenderer({ canvas: c2, antialias: true, alpha: true, preserveDrawingBuffer: capture });
  r2.setClearColor(0, 0); r2.outputColorSpace = THREE.SRGBColorSpace; r2.toneMapping = THREE.NeutralToneMapping;
  const s2 = new THREE.Scene(); s2.environment = scene.environment; s2.environmentIntensity = 0.35;
  const k2 = new THREE.DirectionalLight(0xfff0d0, 2.2); k2.position.set(-10, 20, 8); s2.add(k2, new THREE.HemisphereLight(0xcfe3c6, 0x1d2621, 0.9));
  const glow = new THREE.PointLight(0xf3dc2d, 30, 30, 1.6); glow.position.set(0, 4, 0); s2.add(glow);
  const L2 = buildApartment(), g2 = new THREE.Group(); g2.add(L2.base, L2.walls); for (const k in L2.sets) g2.add(L2.sets[k]); s2.add(g2);
  const cam2 = new THREE.PerspectiveCamera(20, 1, 1, 300);
  let on2 = false; new IntersectionObserver(es => { on2 = es[0].isIntersecting; }).observe(box);
  const fit2 = () => { const w = box.clientWidth, h = box.clientHeight; r2.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r2.setSize(w, h, false); cam2.aspect = w / h; cam2.updateProjectionMatrix(); };
  new ResizeObserver(fit2).observe(box); fit2();
  (function loop2(t) {
    requestAnimationFrame(loop2); if (!on2 && !capture) return;
    g2.rotation.y = capture ? 0.6 : t / 9000;
    const d = cam2.aspect > 1.4 ? 31 : 38 * Math.max(1, 1.1 / cam2.aspect); cam2.position.set(0, d * 0.6, d * 0.8); cam2.lookAt(0, -1.4, 1.2);
    r2.render(s2, cam2);
  })(0);
}

// ------------------------------------------------------------ lead form
// contact routing — fill one of these in (WhatsApp number in international format, no +)
const CONFIG = { web3forms: '6d20a567-6d98-43fb-b228-9d86b1bec2ac' }; // Web3Forms access key (sent to the destination inbox from web3forms.com)
function sendLead(fd, msg, extra = '', pkg = null) {
  if (!fd.get('name') || !fd.get('phone')) { msg.textContent = 'لنتواصل معكم، املأوا الاسم ورقم الهاتف.'; msg.classList.add('err'); return false; }
  msg.classList.remove('err');
  const btn = msg.closest('form').querySelector('[type=submit]'), label = btn.innerHTML;
  const data = { 'الاسم': fd.get('name'), 'الشركة / المشروع': fd.get('company') || '-', 'الهاتف': fd.get('phone') };
  if (fd.get('email')) data['البريد الإلكتروني'] = fd.get('email');
  if (pkg) { data['أنواع الشقق'] = pkg.n; pkg.lines.forEach(([k, v]) => data[k] = '₪' + Math.round(v).toLocaleString('en-US')); data['الإجمالي قبل ضريبة القيمة المضافة'] = '₪' + Math.round(pkg.total).toLocaleString('en-US'); }
  data['المصدر'] = pkg ? 'حاسبة الأسعار' : 'النموذج أسفل الصفحة';
  Object.assign(data, { access_key: CONFIG.web3forms, subject: `عميل محتمل جديد من WalkMeIn: ${fd.get('name')}${pkg ? ' · الباقة ₪' + Math.round(pkg.total).toLocaleString('en-US') : ''}`, from_name: 'WalkMeIn', botcheck: '' });
  if (fd.get('email')) data.replyto = fd.get('email');
  if (!CONFIG.web3forms) { msg.textContent = 'النموذج غير مربوط بعد. في هذه الأثناء، تواصلوا معنا مباشرة.'; msg.classList.add('err'); return false; }
  btn.disabled = true; btn.textContent = 'جارٍ الإرسال…'; msg.textContent = '';
  // own endpoint first (branded Hebrew email); Web3Forms as a fallback when it is not deployed/configured
  const own = { name: fd.get('name'), company: fd.get('company') || '', phone: fd.get('phone'), email: fd.get('email') || '', pkg, botcheck: '' };
  const w3f = () => fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
  fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...own, lang: 'ar' }) })
    .then(r => r.ok ? r.json() : w3f(), w3f).then(r => { console.info('[lead]', r); if (!r.success) throw r;
      msg.textContent = 'شكرًا! استلمنا بياناتكم وسنتواصل معكم قريبًا لتحديد موعد المكالمة.'; msg.classList.add('ok'); msg.closest('form').reset(); })
    .catch(err => { console.warn('[lead] failed', err); msg.textContent = 'حدث خطأ أثناء الإرسال. حاولوا مجددًا بعد لحظة.'; msg.classList.add('err'); })
    .finally(() => { btn.disabled = false; btn.innerHTML = label; });
  return true;
}
$('#form').addEventListener('submit', e => { e.preventDefault(); sendLead(new FormData(e.target), $('#msg')); });
// pricing CTA: open a lead form that carries the chosen package
{
  const m = $('#leadM'), fmtN = v => '₪' + Math.round(v).toLocaleString('en-US'); let back = null;
  const open = e => {
    e.preventDefault(); back = e.currentTarget; const p = window.__pkg || { lines: [], total: 0, n: 1 };
    $('#ldTot').textContent = fmtN(p.total);
    $('#ldLines').innerHTML = `<li><span>أنواع الشقق</span><b>${p.n}</b></li>` + p.lines.map(([k, v]) => `<li><span>${k}</span><b>${fmtN(v)}</b></li>`).join('');
    $('#ldMsg').textContent = ''; m.hidden = false; requestAnimationFrame(() => m.classList.add('in')); document.body.style.overflow = 'hidden';
    setTimeout(() => m.querySelector('input[name=name]').focus(), 350);
  };
  const close = () => { m.classList.remove('in'); document.body.style.overflow = ''; setTimeout(() => { m.hidden = true; }, 300); back && back.focus(); };
  $('#sumcta').addEventListener('click', open);
  m.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !m.hidden) close(); });
  $('#ldForm').addEventListener('submit', e => { e.preventDefault(); const p = window.__pkg || { lines: [], total: 0, n: 1 };
    const extra = `\n\nالباقة المختارة (${p.n} أنواع شقق):\n` + p.lines.map(([k, v]) => `• ${k}: ${fmtN(v)}`).join('\n') + `\nالإجمالي: ${fmtN(p.total)} قبل ضريبة القيمة المضافة`;
    sendLead(new FormData(e.target), $('#ldMsg'), extra, p); });
}

// active section in desktop nav
(()=>{const links=[...document.querySelectorAll('.dnav a')];const secs=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
if(!secs.length)return;const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id))}})},{rootMargin:'-45% 0px -50% 0px'});secs.forEach(s=>io.observe(s));
const top=document.querySelector('#top');if(top)new IntersectionObserver(es=>{if(es[0].isIntersecting)links.forEach(a=>a.classList.remove('on'))},{rootMargin:'-45% 0px -50% 0px'}).observe(top);})();

// story sections: live counters (time on page, slow production progress) once in view
{ const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const run = (el, to, dur, show, hold) => { let t0 = null; const step = t => { if (!document.body.contains(el)) return; t0 ??= t; const k = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - k, 3)); el.textContent = show(v); if (k < 1) requestAnimationFrame(step); else setTimeout(() => { t0 = null; requestAnimationFrame(step); }, hold); }; requestAnimationFrame(step); };
  const go = (sel, fn) => { const el = $(sel); if (!el) return; new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { fn(el); o.disconnect(); } }, { threshold: 0.3 }).observe(el); };
  go('.tnum', el => run(el, +el.dataset.to, 2600, fmt, 3200));
  go('.pg3 .pct', el => run(el, 18, 7000, v => Math.round(v) + '%', 1500)); }

// solution bands: animate as soon as a band starts entering (tall on phones)
{ const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io2.unobserve(e.target); } }), { threshold: 0.08 }); $$('.brow').forEach(el => capture ? el.classList.add('in') : io2.observe(el)); }

// ------------------------------------------------------------ add-on previews: "how it looks" popup per pricing add-on
{
  const H = '../img/';
  const P = {
    real: { tag: 'إضافة لكل نوع شقة', t: 'صورة تصورية واقعية', d: 'ينتقل النموذج من مجسم أبيض أنيق إلى غرفة تبدو كصورة فوتوغرافية: خامات وإضاءة وإطلالة حقيقية من النوافذ. اسحبوا الخط للمقارنة.',
      l: ['أثاث وخامات وتشطيبات وفق مواصفات المشروع', 'ضوء نهار ناعم وإطلالة الطابق من النوافذ', 'يعمل في الجولة وفي التجول الحر أيضًا'],
      v: `<div class="ba" style="--x:50%"><img src="${H}p-real.webp" alt=""><div class="bb"><img src="../img/f-tour.webp" alt=""></div><span class="bl l1">قبل</span><span class="bl l2">بعد</span><i class="bh"><b>‹ ›</b></i><input type="range" min="0" max="100" value="50" aria-label="مقارنة قبل وبعد"></div>` },
    tour: { tag: 'مرة واحدة للمشروع بأكمله', t: 'جولة مرشدة مع تعليق صوتي', d: 'صوت هادئ يرشد المشتري من غرفة إلى أخرى ويشرح ما يراه. نكتب النص ونسجّله ونزامنه مع الكاميرا.',
      l: ['نص مخصص لكل نوع شقة', 'تعليق صوتي بالعربية، وترجمة نصية على الشاشة', 'الكاميرا تتنقل تلقائيًا بين الغرف'],
      v: `<div class="pvvid"><video src="../media/tour.mp4" poster="../media/tour.jpg" muted loop playsinline autoplay></video><div class="pvsub"><span class="pl">▶</span><div class="vtx"><i>«هذا قلب البيت: مساحة مفتوحة من 72 مترًا…»</i><i>«المطبخ مفتوح على الصالة، مع جزيرة وسطية…»</i><i>«ومن هنا نخرج إلى الشرفة المطلة…»</i></div><span class="wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div></div>` },
    bld: { tag: 'مرة واحدة للمشروع بأكمله', t: 'اختيار الشقة على المبنى', d: 'يبدأ المشتري من صورة المبنى التصورية، يمرّر الفأرة على الطوابق ويختار شقة. ويرى فورًا الشقق المتاحة.',
      l: ['صورة تصورية لمبناكم، بطوابق قابلة للنقر', 'حالة التوفر لكل شقة', 'انتقال مباشر من الطابق إلى المخطط ثلاثي الأبعاد'],
      v: `<div class="pvbld"><img src="${H}p-building.webp" alt=""><span class="fband"></span><div class="ftip"><b>الطابق 12</b><span><i class="g"></i>2 متاحة</span><span><i class="r"></i>1 مُباعة</span></div></div>` },
    lang: { tag: 'لكل لغة', t: 'لغة إضافية', d: 'التجربة كاملة، بما فيها التعليق الصوتي والترجمة النصية، بلغة إضافية. ويغيّر المشتري اللغة بنقرة واحدة.',
      l: ['تعليق صوتي بلسان متحدث أصلي', 'القوائم والترجمة النصية وأسماء الغرف', 'الإنجليزية والروسية والفرنسية وغيرها'],
      v: `<div class="pvlang"><img src="../img/f-rooms.webp" alt=""><div class="lsw"><span>ع</span><span>EN</span><span>RU</span><span>FR</span><i></i></div><div class="lcap"><i dir="rtl">الصالة مضاءة من جهتين</i><i dir="ltr">The living room gets light from two sides</i><i dir="ltr">Гостиная освещена с двух сторон</i><i dir="ltr">Le salon est lumineux des deux côtés</i></div></div>` },
    crm: { tag: 'مرة واحدة للمشروع بأكمله', t: 'الربط مع الـCRM', d: 'كل من يترك بياناته يدخل مباشرة إلى نظامكم، مع كل ما شاهده. يفتح مندوب المبيعات ملف العميل المحتمل ويعرف عمّا يتحدث.',
      l: ['Salesforce وMonday وFireberry وHubSpot وغيرها', 'سجل مشاهدة كامل لكل عميل محتمل', 'تنبيه فوري لمندوب المبيعات'],
      v: `<div class="pvcrm"><div class="cw"><span>عملائي المحتملون</span><b>CRM</b></div><div class="crow new"><span class="lav">أ</span><div><b>أحمد الحسن</b><small>4 غرف طراز C · الصالة 3:40 · 3 زيارات</small></div><em>جديد</em></div><div class="crow"><span class="lav">م</span><div><b>مريم العلي</b><small>بنتهاوس · الشرفة 2:10 · زيارتان</small></div><em class="o">قيد المتابعة</em></div><div class="crow"><span class="lav">أ</span><div><b>أيمن رزق</b><small>3 غرف · المطبخ 1:50 · زيارة واحدة</small></div><em class="o">قيد المتابعة</em></div></div>` },
  };
  const pv = $('#pv'); let cur = null, last = null;
  const open = (k, from) => {
    const d = P[k]; if (!d) return; cur = k; last = from;
    const inp = $(`#adds input[data-k="${k}"]`), price = inp.closest('label').querySelector('em').textContent;
    $('#pvTag').textContent = d.tag; $('#pvT').textContent = d.t; $('#pvD').textContent = d.d; $('#pvP').textContent = price;
    $('#pvL').innerHTML = d.l.map(x => `<li>${x}</li>`).join(''); $('#pvVis').innerHTML = d.v;
    const ba = $('#pvVis .ba'); if (ba) ba.querySelector('input').addEventListener('input', e => ba.style.setProperty('--x', e.target.value + '%'));
    const upd = () => { $('#pvAdd').textContent = inp.checked ? '✓ أُضيف إلى الحساب · إزالة' : 'إضافة إلى الحساب'; $('#pvAdd').classList.toggle('on', inp.checked); }; upd(); $('#pvAdd').onclick = () => { inp.checked = !inp.checked; inp.dispatchEvent(new Event('change')); upd(); };
    pv.hidden = false; requestAnimationFrame(() => pv.classList.add('in')); document.body.style.overflow = 'hidden'; $('.pvx').focus();
  };
  const close = () => { pv.classList.remove('in'); document.body.style.overflow = ''; setTimeout(() => { pv.hidden = true; $('#pvVis').innerHTML = ''; }, 300); last && last.focus(); };
  $$('.peek').forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); open(b.dataset.peek, b); }));
  pv.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !pv.hidden) close(); });
}
