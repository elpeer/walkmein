// Furnishing test: real product models from Amazon Berkeley Objects (ABO, CC BY 4.0 – Amazon.com, Collins et al. CVPR 2022),
// converted by codepawl/abo-glb. Each plan item of a handled type is replaced by a scanned product, fitted to its slot.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// type -> model; fit: 'len' scales by the long side and keeps the back on the wall, 'fit' fits inside, 'rug' stretches flat
const PICK = {
  sofa: { id: 'B07HYYBHNK', fit: 'len' },
  arm: { id: 'B0746GYJJD', fit: 'chair', size: 0.76 },
  rcoffee: { id: 'B07QFB1TLZ', fit: 'round' },
  coffee: { id: 'B07QFB1TLZ', fit: 'round' },
  pouf: { id: 'B07QBMQPWG', fit: 'round' },
  rug: { id: 'B07Q9CTQ2K', fit: 'rug' },
  dining: { id: 'B07HSJJF2X', chair: 'B07QJ1X2QB' },
  odining: { id: 'B07K7SJWCH', chair: 'B07QK35B7K' },
  bed2: { id: 'B07B4VY12X' },
  bed1: { id: 'B07H8V7MQS', alt: 'B07H8V7MQS' },
  night: { id: 'B07QD6TXWS', lamp: 'B0824FHWSX' },
  desk: { id: 'B079HYXWPC', alt: 'B07HSJDN75', chair: 'B07M66SYGT', chairAlt: 'B07QF9Y248' },
};
const EXTRA = { floorLamp: 'B0742F7GT8', bedRug: 'B0714MJKX2', media: 'B07VHNMRY8', oChair: 'B082VFPXGJ', stool: 'B07MHMJD1P', bench: 'B075QFCZ1Z',
  readChair: 'B07B4MMPSW', bean: 'B07TN1ZSX8', books: 'B07HSCNKCT', deskLamp: 'B07DTFBDTL', console: 'B075YQ46KX', mirror: 'B071NHXGFY', side: 'B072ZK887F', sideLamp: 'B07HK3HJ6P',
  artLeaf: 'B073P13P8Z', artGold: 'B073NZT5CF', artSea: 'B073NZPNNL', artHorizon: 'B073P13JKT',
  pLumbar: 'B074VLPC13', pLinen: 'B079TXJCR5', pDiamond: 'B079TXJTY4', pCream: 'B074VKWJWP', pPink: 'B074VMBGSZ', pNavy: 'B074VLRP5T',
  vaseTall: 'B075HWDSZY', bowl: 'B075HX7JFC', planterStand: 'B075HWR58K' };
export const HANDLED = new Set(['sofa', 'arm', 'rcoffee', 'coffee', 'pouf', 'rug', 'dining', 'bed1', 'bed2', 'night', 'desk', 'lounger']);

export async function furnish(C, onReady) {
  const { THREE, E2, X, Z, S } = C;
  const DIR = { l: [-1, 0], r: [1, 0], t: [0, -1], b: [0, 1] };
  const rect = (x0, y0, x1, y1) => ({ x0: X(Math.min(x0, x1)), x1: X(Math.max(x0, x1)), z0: Z(Math.min(y0, y1)), z1: Z(Math.max(y0, y1)), cx: X((x0 + x1) / 2), cz: Z((y0 + y1) / 2), w: Math.abs(x1 - x0) * S, d: Math.abs(y1 - y0) * S });
  const ids = new Set(); Object.values(PICK).forEach(p => ['id', 'alt', 'chair', 'chairAlt', 'lamp'].forEach(k => p[k] && ids.add(p[k]))); Object.values(EXTRA).forEach(i => ids.add(i));
  const gl = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const base = C.BASE + 'abo/';
  const L = {};
  await Promise.all([...ids].map(id => gl.loadAsync(base + id + '.glb').then(g => {
    const sc = g.scene; sc.updateMatrixWorld(true);
    // expand quantized attributes to float (the path tracer and the shadow pass merge raw arrays)
    sc.traverse(m => { if (!m.isMesh) return; const gg = m.geometry; for (const k of Object.keys(gg.attributes)) { const a = gg.attributes[k]; if (a.isInterleavedBufferAttribute || !(a.array instanceof Float32Array)) { const n = a.count, s = a.itemSize, f = new Float32Array(n * s); for (let i = 0; i < n; i++) for (let j = 0; j < s; j++) f[i * s + j] = a.getComponent(i, j); gg.setAttribute(k, new THREE.BufferAttribute(f, s)); } }
      m.castShadow = m.receiveShadow = true; const mt = m.material; if (mt && mt.isMeshStandardMaterial) { mt.envMapIntensity = 0.85; C.patch && C.patch(mt); } });
    const b = new THREE.Box3().setFromObject(sc), c = b.getCenter(new THREE.Vector3());
    const grp = new THREE.Group(); sc.position.set(-c.x, -b.min.y, -c.z); grp.add(sc); grp.userData.size = b.getSize(new THREE.Vector3());
    L[id] = grp;
  }, e => { console.warn('abo load', id, e && e.message); L[id] = null; })));

  const root = new THREE.Group(); root.name = 'abo';
  // place model so its front (+z) faces (fx,fz); w/d are target footprint along its own x / z
  function put(id, cx, cz, fx, fz, s, y = 0, sx = s, sz = s) {
    const p = L[id]; if (!p) return null; const o = p.clone(true); o.scale.set(sx, s, sz); o.position.set(cx, y, cz); o.rotation.y = Math.atan2(fx, fz); root.add(o); return o;
  }
  const sz = id => L[id] ? L[id].userData.size : null;
  const outside = (x0, y0, x1, y1) => E2.zones.deck.some(([a, b, c, d]) => (x0 + x1) / 2 > a && (x0 + x1) / 2 < c && (y0 + y1) / 2 > b && (y0 + y1) / 2 < d);
  const bed2 = E2.furniture.find(f => f[0] === 'bed2'); let n1 = 0, nd = 0, lounge = false; const at = {};
  const P = (px, py) => [X(px), Z(py)];
  const rc = new THREE.Raycaster(); const topOf = (obj, x, z, d = 0) => { if (!obj) return d; obj.updateMatrixWorld(true); rc.set(new THREE.Vector3(x, 4, z), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObject(obj, true); return h.length ? h[0].point.y : d; };
  // decor helpers
  const onTop = (id, obj, x, z, h, fx = 0, fz = 1) => { const k = sz(id); if (!k) return null; return put(id, x, z, fx, fz, h / k.y, topOf(obj, x, z, 0.75) - 0.005); };
  const pillow = (id, y, x, z, fx, fz, w = 0.46, lean = -0.28) => { const k = sz(id); if (!k) return null; const o = put(id, x, z, fx, fz, w / k.x, y - 0.04); if (o) o.rotateX(lean); return o; };
  // framed print / mirror on a wall: centre (px,py), facing (fx,fz), bottom height y0, width w
  const hang = (id, px, py, fx, fz, y0, w) => { const k = sz(id); if (!k) return null; const [x, z] = P(px, py); const s = w / k.x; return put(id, x + fx * (k.z * s / 2 + 0.012), z + fz * (k.z * s / 2 + 0.012), fx, fz, s, y0); };

  for (const [t, x0, y0, x1, y1, o] of E2.furniture) {
    if (!HANDLED.has(t)) continue; const r = rect(x0, y0, x1, y1), out = outside(x0, y0, x1, y1);
    switch (t) {
      case 'sofa': { const [fx, fz] = DIR[o]; const k = sz(PICK.sofa.id); if (!k) break; const L0 = fz ? r.w : r.d, D0 = fz ? r.d : r.w; const s = L0 / k.x;
        const v = -D0 / 2 + k.z * s / 2; at.sofa = { o: put(PICK.sofa.id, r.cx + fx * v, r.cz + fz * v, fx, fz, s), r, fx, fz, back: v + k.z * s / 2 }; break; }
      case 'arm': { const [fx, fz] = DIR[o]; const k = sz(PICK.arm.id); if (!k) break; put(PICK.arm.id, r.cx, r.cz, fx, fz, PICK.arm.size / Math.max(k.x, k.z)); break; }
      case 'coffee': case 'rcoffee': case 'pouf': { const p = PICK[t]; const k = sz(p.id); if (!k) break; const d = Math.min(r.w, r.d); const ob = put(p.id, r.cx, r.cz, 0, 1, d / Math.max(k.x, k.z)); if (t !== 'pouf') at.coffee = { o: ob, r }; break; }
      case 'rug': { const k = sz(PICK.rug.id); if (!k) break; const turn = (r.w > r.d) !== (k.x > k.z); const W = turn ? r.d : r.w, D = turn ? r.w : r.d;
        const o2 = put(PICK.rug.id, r.cx, r.cz, turn ? 1 : 0, turn ? 0 : 1, 1, 0.002, W / k.x, D / k.z); if (o2) o2.scale.y = 0.6; break; }
      case 'dining': { const p = out ? PICK.odining : PICK.dining; const k = sz(p.id), kc = sz(p.chair); if (!k) break;
        const along = o === 'v' ? 'z' : 'x'; const L0 = along === 'x' ? r.w : r.d; const s = Math.min(1.12, Math.max(0.85, L0 / k.x));
        const tb = put(p.id, r.cx, r.cz, along === 'x' ? 0 : 1, along === 'x' ? 1 : 0, s); if (!out) at.dining = { o: tb, r };
        if (kc) { const n = Math.max(2, Math.round(L0 / 0.62)), cs = 0.56 / Math.max(kc.x, kc.z), half = k.z * s / 2 + 0.16;
          for (let i = 0; i < n; i++) { const u = -L0 / 2 + (i + 0.5) * L0 / n;
            for (const sg of [-1, 1]) { if (along === 'x') put(p.chair, r.cx + u, r.cz + sg * half, 0, -sg, cs); else put(p.chair, r.cx + sg * half, r.cz + u, -sg, 0, cs); } } }
        break; }
      case 'bed2': case 'bed1': { const id = t === 'bed2' ? PICK.bed2.id : (n1++ % 2 ? PICK.bed1.alt : PICK.bed1.id); const k = sz(id); if (!k) break;
        const [hx, hz] = DIR[o]; const fx = -hx, fz = -hz; // the foot faces away from the head wall
        const W0 = hz ? r.w : r.d, Lr = hz ? r.d : r.w; const s = W0 / k.x;
        const v = Lr / 2 - k.z * s / 2; const bo = put(id, r.cx + hx * v, r.cz + hz * v, fx, fz, s); (at.beds ||= []).push({ i: t === 'bed1' ? n1 : 0, o: bo, t, r, hx, hz, W0, head: [r.cx + hx * Lr / 2, r.cz + hz * Lr / 2] });
        // a soft rug under the foot half
        const kr = sz(EXTRA.bedRug); if (kr) { const bl = k.z * s, across = W0 + 0.8, along = bl * 0.75, bc = v - bl * 0.22; const rx = hz ? across : along, rz = hz ? along : across;
          const g = put(EXTRA.bedRug, r.cx + hx * bc, r.cz + hz * bc, 0, 1, 1, 0.002, rx / kr.x, rz / kr.z); if (g) g.scale.y = 0.6; }
        break; }
      case 'night': { const k = sz(PICK.night.id); if (!k) break; const ho = bed2 ? DIR[bed2[5]] : [0, 1]; const fx = -ho[0], fz = -ho[1];
        const s = Math.min(1.1, (Math.max(r.w, r.d) + 0.06) / k.x); const v = (fx ? r.w : r.d) / 2 - k.z * s / 2;
        const cx = r.cx - fx * v, cz = r.cz - fz * v; put(PICK.night.id, cx, cz, fx, fz, s);
        const kl = sz(PICK.night.lamp); if (kl) put(PICK.night.lamp, cx, cz, fx, fz, 0.42 / kl.y, k.y * s); break; }
      case 'desk': { const [fx, fz] = DIR[o]; const first = nd++ === 0; const id = first ? PICK.desk.id : PICK.desk.alt, cid = first ? PICK.desk.chair : PICK.desk.chairAlt; const k = sz(id); if (!k) break;
        const L0 = fz ? r.w : r.d, D0 = fz ? r.d : r.w; const s = Math.min(1.1, L0 / k.x); const v = D0 / 2 - k.z * s / 2;
        const dk = put(id, r.cx + fx * v, r.cz + fz * v, -fx, -fz, s); // its front (user side) faces into the room
        (at.desks ||= []).push({ o: dk, r, fx, fz, x: r.cx + fx * v, z: r.cz + fz * v, L0 });
        const kc = sz(cid); if (kc) put(cid, r.cx - fx * 0.45, r.cz - fz * 0.45, fx, fz, 0.6 / Math.max(kc.x, kc.z));
        break; }
      case 'lounger': { if (lounge) break; lounge = true; // two cushioned lounge chairs facing the view, a ceramic garden stool between
        const kc = sz(EXTRA.oChair), ks = sz(EXTRA.stool); const [ax, az] = P(706, 240), [bx, bz] = P(781, 240), [mx, mz] = P(743.5, 236);
        if (kc) { const s = 0.62 / kc.x; put(EXTRA.oChair, ax, az, 0.12, -1, s); put(EXTRA.oChair, bx, bz, -0.12, -1, s); }
        if (ks) { const st = put(EXTRA.stool, mx, mz, 0, 1, 0.42 / ks.y); onTop(EXTRA.vaseTall, st, mx, mz, 0.2); }
        if (kc) { const [p1x, p1z] = P(708, 252), [p2x, p2z] = P(779, 252); pillow(EXTRA.pNavy, 0.62, p1x, p1z, 0.12, -1, 0.4, -0.35); pillow(EXTRA.pLinen, 0.62, p2x, p2z, -0.12, -1, 0.4, -0.35); }
        break; }
    }
  }
  // ---------------------------------------------------------------- bedding (procedural, soft): a duvet over the mattress and a folded throw at the foot
  const RB = C.RoundedBoxGeometry; const fab = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, envMapIntensity: 0.6 });
  const MAT = { duvet: fab(0xf3efe7), throwM: fab(0xb9835f), throwK: fab(0x9fae94), throwN: fab(0x3b4a5c), pillow: fab(0xfbf9f4) };
  function soft(m, x, y, z, w, h, d, ry, rad = 0.04) { const g = new RB(w, h, d, 4, Math.min(rad, h / 2 - 0.001)); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; root.add(o); return o; }
  function bedding(b) { const { o, t, hx, hz, W0, head } = b; if (!o) return; const k = new THREE.Box3().setFromObject(o); const Lb = hx ? k.max.x - k.min.x : k.max.z - k.min.z; const ry = Math.atan2(-hx, -hz);
    const along = d => [head[0] - hx * d, head[1] - hz * d]; const [mx, mz] = along(Lb * 0.56); const top = topOf(o, mx, mz, 0.5);
    const w = W0 + 0.04, dl = Lb * 0.66; soft(MAT.duvet, mx, top + 0.035, mz, hz ? w : dl, 0.08, hz ? dl : w, 0, 0.035);
    const [tx, tz] = along(Lb * 0.8); soft(t === 'bed2' ? MAT.throwM : b.i === 1 ? MAT.throwK : MAT.throwN, tx, top + 0.085, tz, hz ? w + 0.02 : 0.42, 0.035, hz ? 0.42 : w + 0.02, 0, 0.015);
    if (t === 'bed1') { const [px, pz] = along(0.32); soft(MAT.pillow, px, top + 0.09, pz, hz ? W0 * 0.75 : 0.36, 0.13, hz ? 0.36 : W0 * 0.75, 0, 0.06); } }
  // ---------------------------------------------------------------- styling: the touches that make it a home
  // living: throw pillows on the sofa, side table with a lamp, books and a vase on the coffee table
  if (at.sofa && at.sofa.o) { const { r, fx, fz, o } = at.sofa; const bx = r.cx + fx * at.sofa.back, bz = r.cz + fz * at.sofa.back; // back line of the sofa
    const pt = (u, d) => [bx - fx * d + (fz ? u : 0), bz - fz * d + (fx ? u : 0)];
    [[EXTRA.pDiamond, -0.82, 0.46], [EXTRA.pLumbar, -0.38, 0.56], [EXTRA.pLinen, 0.86, 0.46]].forEach(([id, u, w]) => { const [x, z] = pt(u, 0.36), [hx, hz] = pt(u, 0.5); pillow(id, topOf(o, hx, hz, 0.45), x, z, -fx, -fz, w); });
    const [sx, sz2] = P(536, 576); const k = sz(EXTRA.side); if (k) { const st = put(EXTRA.side, sx, sz2, -fx, -fz, 0.45 / k.x); onTop(EXTRA.sideLamp, st, sx, sz2, 0.56, -fx, -fz); } }
  if (at.coffee && at.coffee.o) { const { r, o } = at.coffee; onTop(EXTRA.vaseTall, o, r.cx - 0.16, r.cz - 0.08, 0.3); onTop(EXTRA.bowl, o, r.cx + 0.14, r.cz + 0.1, 0.13); }
  if (at.dining && at.dining.o) { const { r, o } = at.dining; onTop(EXTRA.bowl, o, r.cx - 0.12, r.cz, 0.16); onTop(EXTRA.vaseTall, o, r.cx + 0.22, r.cz + 0.04, 0.32); }
  // kitchen island: a bowl and a vase on the stone top (0.92 m)
  { const k1 = sz(EXTRA.bowl), k2 = sz(EXTRA.vaseTall); const [x, z] = P(668, 375); if (k1) put(EXTRA.bowl, x, z, 1, 0, 0.14 / k1.y, 0.92); if (k2) put(EXTRA.vaseTall, x, z + 0.32, 1, 0, 0.34 / k2.y, 0.92); }
  // TV wall: a low oak & white media console replaces the floating shelf
  { const tw = E2.furniture.find(f => f[0] === 'tvwall'); const k = sz(EXTRA.media); if (tw && k) { const r = rect(tw[1], tw[2], tw[3], tw[4]); const [fx] = DIR[tw[5]]; const w0 = fx > 0 ? r.x0 : r.x1;
    put(EXTRA.media, w0 + fx * (0.1 + k.z / 2), r.cz, fx, 0, 1); } }
  // entry: a slim console, a round mirror above it and a vase
  { const k = sz(EXTRA.console); if (k) { const [x, z] = P(277, 690); const s = 1.05 / k.x; const c = put(EXTRA.console, x + k.z * s / 2, z, 1, 0, s); onTop(EXTRA.vaseTall, c, x + 0.2, z - 0.32, 0.34, 1, 0); onTop(EXTRA.bowl, c, x + 0.2, z + 0.25, 0.12, 1, 0); }
    hang(EXTRA.mirror, 276, 690, 1, 0, 1.18, 0.62); }
  // master bedroom: pillows, a bench at the foot of the bed, a reading corner by the window
  for (const b of at.beds || []) { const { o, t, hx, hz, W0, head } = b; const fx = -hx, fz = -hz; const lat = (u, d) => [head[0] - hx * d + (hz ? u : 0), head[1] - hz * d + (hx ? u : 0)];
    const ids = t === 'bed2' ? [[EXTRA.pDiamond, -0.38, 0.48], [EXTRA.pDiamond, 0.38, 0.48], [EXTRA.pLumbar, 0, 0.6]] : (b.i === 1 ? [[EXTRA.pPink, 0, 0.5]] : [[EXTRA.pNavy, 0, 0.46]]);
    bedding(b);
    ids.forEach(([id, u, w], i) => { const d = i === 2 ? 0.62 : 0.48; const [x, z] = lat(u, d), [qx, qz] = lat(u, 0.62); pillow(id, topOf(root, qx, qz, 0.6), x, z, fx, fz, w * Math.min(1, W0 / 1.4 + 0.2), -0.3); }); }
  { const k = sz(EXTRA.bench); if (k && bed2) { const r = rect(bed2[1], bed2[2], bed2[3], bed2[4]); const [hx, hz] = DIR[bed2[5]]; const foot = hz ? (hz > 0 ? r.z0 : r.z1) : (hx > 0 ? r.x0 : r.x1); const s = 1.3 / k.x;
    const d = k.z * s / 2 + 0.06; put(EXTRA.bench, hx ? foot - hx * d : r.cx, hz ? foot - hz * d : r.cz, -hx, -hz, s); } }
  { const k = sz(EXTRA.readChair); if (k) { const [x, z] = P(930, 252); put(EXTRA.readChair, x, z, 0.6, 0.8, 0.76 / k.x); } const kf = sz(EXTRA.floorLamp); if (kf) { const [x, z] = P(902, 228); put(EXTRA.floorLamp, x, z, 1, 1, 1.5 / kf.y); } }
  // kids room: art over the desk and the bed, books, a bean bag, a desk lamp
  hang(EXTRA.artSea, 1013, 1011, 0, -1, 1.02, 0.78);
  hang(EXTRA.artLeaf, 1147, 1011, 0, -1, 1.2, 0.5);
  { const k = sz(EXTRA.books); if (k) { const [x, z] = P(963, 868); put(EXTRA.books, x + k.z / 2 + 0.02, z, 1, 0, 1); } }
  { const k = sz(EXTRA.bean); if (k) { const [x, z] = P(1045, 885); put(EXTRA.bean, x, z, 0, 1, 0.78 / k.x); } }
  for (const d of at.desks || []) { if (!d.o) continue; const u = d.L0 / 2 - 0.18; const x = d.x + (d.fz ? u : 0), z = d.z + (d.fx ? -u : 0); onTop(EXTRA.deskLamp, d.o, x, z, 0.45, -d.fx, -d.fz); }
  // safe room / second bedroom: art over the bed, a side table with a lamp
  hang(EXTRA.artGold, 640, 1094, 1, 0, 1.12, 0.72);
  { const k = sz(EXTRA.side); if (k) { const [x, z] = P(668, 1030); const st = put(EXTRA.side, x, z, 1, 0, 0.42 / k.x); onTop(EXTRA.sideLamp, st, x, z, 0.52, 1, 0); } }
  // a planter by the sofa window
  { const k = sz(EXTRA.planterStand); if (k) { const [x, z] = P(500, 338); put(EXTRA.planterStand, x, z, 0, 1, 0.55 / k.y); } }
  // a floor lamp at the window end of the sofa
  const sf = E2.furniture.find(f => f[0] === 'sofa'); const kf = sz(EXTRA.floorLamp);
  if (sf && kf) { const r = rect(sf[1], sf[2], sf[3], sf[4]); const [fx, fz] = DIR[sf[5]]; const alongZ = fx !== 0; const cx = alongZ ? r.cx + fx * 0.05 : r.x1 + 0.3, cz = alongZ ? r.z0 - 0.2 : r.cz; put(EXTRA.floorLamp, cx, cz, fx, fz, 1.55 / kf.y); }
  root.updateMatrixWorld(true);
  C.root.add(root); console.log('abo ready', root.children.length, Object.values(L).filter(Boolean).length + '/' + ids.size); onReady && onReady(root); return root;
}
