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
  bed1: { id: 'B07H8V7MQS', alt: 'B071H75K71' },
  night: { id: 'B07QD6TXWS', lamp: 'B0824FHWSX' },
  desk: { id: 'B07QF9Y6Z9', alt: 'B07GF5DCK2', chair: 'B07M66SYGT', chairAlt: 'B07QF9Y248' },
};
const EXTRA = { floorLamp: 'B0742F7GT8', bedRug: 'B0714MJKX2' };
export const HANDLED = new Set(['sofa', 'arm', 'rcoffee', 'coffee', 'pouf', 'rug', 'dining', 'bed1', 'bed2', 'night', 'desk']);

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
  const bed2 = E2.furniture.find(f => f[0] === 'bed2'); let n1 = 0, nd = 0;

  for (const [t, x0, y0, x1, y1, o] of E2.furniture) {
    if (!HANDLED.has(t)) continue; const r = rect(x0, y0, x1, y1), out = outside(x0, y0, x1, y1);
    switch (t) {
      case 'sofa': { const [fx, fz] = DIR[o]; const k = sz(PICK.sofa.id); if (!k) break; const L0 = fz ? r.w : r.d, D0 = fz ? r.d : r.w; const s = L0 / k.x;
        const v = -D0 / 2 + k.z * s / 2; put(PICK.sofa.id, r.cx + fx * v, r.cz + fz * v, fx, fz, s); break; }
      case 'arm': { const [fx, fz] = DIR[o]; const k = sz(PICK.arm.id); if (!k) break; put(PICK.arm.id, r.cx, r.cz, fx, fz, PICK.arm.size / Math.max(k.x, k.z)); break; }
      case 'coffee': case 'rcoffee': case 'pouf': { const p = PICK[t]; const k = sz(p.id); if (!k) break; const d = Math.min(r.w, r.d); put(p.id, r.cx, r.cz, 0, 1, d / Math.max(k.x, k.z)); break; }
      case 'rug': { const k = sz(PICK.rug.id); if (!k) break; const turn = (r.w > r.d) !== (k.x > k.z); const W = turn ? r.d : r.w, D = turn ? r.w : r.d;
        const o2 = put(PICK.rug.id, r.cx, r.cz, turn ? 1 : 0, turn ? 0 : 1, 1, 0.002, W / k.x, D / k.z); if (o2) o2.scale.y = 0.6; break; }
      case 'dining': { const p = out ? PICK.odining : PICK.dining; const k = sz(p.id), kc = sz(p.chair); if (!k) break;
        const along = o === 'v' ? 'z' : 'x'; const L0 = along === 'x' ? r.w : r.d; const s = Math.min(1.12, Math.max(0.85, L0 / k.x));
        put(p.id, r.cx, r.cz, along === 'x' ? 0 : 1, along === 'x' ? 1 : 0, s);
        if (kc) { const n = Math.max(2, Math.round(L0 / 0.62)), cs = 0.56 / Math.max(kc.x, kc.z), half = k.z * s / 2 + 0.16;
          for (let i = 0; i < n; i++) { const u = -L0 / 2 + (i + 0.5) * L0 / n;
            for (const sg of [-1, 1]) { if (along === 'x') put(p.chair, r.cx + u, r.cz + sg * half, 0, -sg, cs); else put(p.chair, r.cx + sg * half, r.cz + u, -sg, 0, cs); } } }
        break; }
      case 'bed2': case 'bed1': { const id = t === 'bed2' ? PICK.bed2.id : (n1++ % 2 ? PICK.bed1.alt : PICK.bed1.id); const k = sz(id); if (!k) break;
        const [hx, hz] = DIR[o]; const fx = -hx, fz = -hz; // the foot faces away from the head wall
        const W0 = hz ? r.w : r.d, Lr = hz ? r.d : r.w; const s = W0 / k.x;
        const v = Lr / 2 - k.z * s / 2; put(id, r.cx + hx * v, r.cz + hz * v, fx, fz, s);
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
        put(id, r.cx + fx * v, r.cz + fz * v, -fx, -fz, s); // its front (user side) faces into the room
        const kc = sz(cid); if (kc) put(cid, r.cx - fx * 0.45, r.cz - fz * 0.45, fx, fz, 0.6 / Math.max(kc.x, kc.z));
        break; }
    }
  }
  // a floor lamp at the window end of the sofa
  const sf = E2.furniture.find(f => f[0] === 'sofa'); const kf = sz(EXTRA.floorLamp);
  if (sf && kf) { const r = rect(sf[1], sf[2], sf[3], sf[4]); const [fx, fz] = DIR[sf[5]]; const alongZ = fx !== 0; const cx = alongZ ? r.cx + fx * 0.05 : r.x1 + 0.3, cz = alongZ ? r.z1 + 0.3 : r.cz; put(EXTRA.floorLamp, cx, cz, fx, fz, 1.55 / kf.y); }
  root.updateMatrixWorld(true);
  C.root.add(root); console.log('abo ready', root.children.length, Object.values(L).filter(Boolean).length + '/' + ids.size); onReady && onReady(root); return root;
}
