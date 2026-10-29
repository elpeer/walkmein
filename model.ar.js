// A compact 3-room apartment (≈ 85 m² + balcony), built as an architectural "white model":
// matte white walls, light oak floors, grey stone in the wet rooms, minimal furniture.
// Every layer is its own group so the page can explode and assemble it.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const H = 2.6;            // wall height (cut)
const TE = 0.24, TI = 0.12;      // exterior / interior wall thickness

// ---------------------------------------------------------------- procedural textures
function canvasTex(w, h, draw, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const oakTex = canvasTex(512, 512, (g, w, h) => {
  const r = rnd(7); g.fillStyle = '#d9c3a3'; g.fillRect(0, 0, w, h);
  const rows = 8, ph = h / rows;
  for (let i = 0; i < rows; i++) {
    let x = -r() * 300;
    while (x < w) { const len = 260 + r() * 220, tone = 0.94 + r() * 0.1;
      g.fillStyle = `rgb(${217 * tone | 0},${195 * tone | 0},${163 * tone | 0})`; g.fillRect(x, i * ph, len, ph);
      for (let k = 0; k < 6; k++) { g.strokeStyle = `rgba(150,115,80,${0.05 + r() * 0.06})`; g.lineWidth = 1; g.beginPath(); const yy = i * ph + r() * ph; g.moveTo(x, yy); g.bezierCurveTo(x + len * .3, yy + r() * 6 - 3, x + len * .6, yy + r() * 6 - 3, x + len, yy); g.stroke(); }
      g.fillStyle = 'rgba(120,90,60,.22)'; g.fillRect(x, i * ph, 1.5, ph); x += len; }
    g.fillStyle = 'rgba(120,90,60,.18)'; g.fillRect(0, i * ph, w, 1.2);
  }
}, [1, 1]);
const tileTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#d4d1cb'; g.fillRect(0, 0, w, h); const r = rnd(3);
  for (let i = 0; i < 2000; i++) { { const q = r() > .5 ? 255 : 110; g.fillStyle = `rgba(${q},${q},${q - 4},.05)`; } g.fillRect(r() * w, r() * h, 2, 2); }
  g.fillStyle = 'rgba(150,145,138,.55)'; for (let i = 0; i <= 2; i++) { g.fillRect(i * w / 2 - 1, 0, 2, h); g.fillRect(0, i * h / 2 - 1, w, 2); }
});
const deckTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#c9b294'; g.fillRect(0, 0, w, h); const r = rnd(11);
  for (let i = 0; i < 8; i++) { { const q = 0.92 + r() * 0.12; g.fillStyle = `rgb(${201 * q | 0},${178 * q | 0},${148 * q | 0})`; } g.fillRect(i * w / 8, 0, w / 8, h); g.fillStyle = 'rgba(90,70,50,.35)'; g.fillRect(i * w / 8, 0, 2, h); }
});

export const M = {
  wall: new THREE.MeshStandardMaterial({ color: 0xf3f1ed, roughness: 0.96 }),
  base: new THREE.MeshStandardMaterial({ color: 0xeeebe6, roughness: 0.95 }),
  oak: new THREE.MeshStandardMaterial({ color: 0xffffff, map: oakTex, roughness: 0.78 }),
  tile: new THREE.MeshStandardMaterial({ color: 0xffffff, map: tileTex, roughness: 0.55 }),
  deck: new THREE.MeshStandardMaterial({ color: 0xffffff, map: deckTex, roughness: 0.85 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xdfe8ea, roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false }),
  frame: new THREE.MeshStandardMaterial({ color: 0xe9e7e3, roughness: 0.6 }),
  fabric: new THREE.MeshStandardMaterial({ color: 0xe8e3db, roughness: 1 }),
  fabric2: new THREE.MeshStandardMaterial({ color: 0xc9c2b8, roughness: 1 }),
  linen: new THREE.MeshStandardMaterial({ color: 0xf6f4f0, roughness: 1 }),
  wood: new THREE.MeshStandardMaterial({ color: 0xc8a57d, roughness: 0.7 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x3a3733, roughness: 0.5, metalness: 0.2 }),
  stone: new THREE.MeshStandardMaterial({ color: 0xdedbd6, roughness: 0.4 }),
  white: new THREE.MeshStandardMaterial({ color: 0xfbfaf8, roughness: 0.5 }),
  rug: new THREE.MeshStandardMaterial({ color: 0xe2ddd4, roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x9aa58a, roughness: 0.95, flatShading: true }),
  pot: new THREE.MeshStandardMaterial({ color: 0xe9e6e1, roughness: 0.8 }),
  slat: new THREE.MeshStandardMaterial({ color: 0xf6f5f2, roughness: 0.9 }),
};

// ---------------------------------------------------------------- layout (metres, centred on the apartment)
// rooms: footprint rectangles [x0,z0,x1,z1]
export const ROOMS = {
  living: { r: [-5, -0.6, 1, 4.2], floor: 'oak', name: 'الصالة وركن الطعام والمطبخ', size: '28 م²' },
  bed2: { r: [-5, -4.2, -1.6, -0.6], floor: 'oak', name: 'غرفة نوم', size: '3.4 × 3.6' },
  bath: { r: [-1.6, -4.2, 1, -1.8], floor: 'tile', name: 'الحمّام', size: '2.6 × 2.4' },
  hall: { r: [-1.6, -1.8, 1, -0.6], floor: 'oak', name: 'المدخل', size: '' },
  master: { r: [1, 0.6, 5, 4.2], floor: 'oak', name: 'الجناح الرئيسي', size: '4.0 × 3.6' },
  closet: { r: [1, -1.2, 2.6, 0.6], floor: 'oak', name: 'خزائن', size: '' },
  ensuite: { r: [2.6, -1.2, 5, 0.6], floor: 'tile', name: 'حمّام الغرفة الرئيسية', size: '2.4 × 1.8' },
  bed3: { r: [1, -4.2, 5, -1.2], floor: 'oak', name: 'غرفة إضافية / مكتب', size: '4.0 × 3.0' },
};
export const BAL = [-5, 4.2, 5, 6.0];

// walls: [x0,z0,x1,z1,thickness,[openings:[from,to,kind]]] — axis aligned; opening offsets measured from x0/z0
const WALLS = [
  // exterior
  [-5, -4.2, 5, -4.2, TE, [[1.0, 2.6, 'win'], [5.6, 6.6, 'win'], [7.4, 9.2, 'win']]],
  [5, -4.2, 5, 4.2, TE, [[1.2, 2.6, 'win'], [5.0, 7.6, 'win']]],
  [-5, 4.2, 5, 4.2, TE, [[0.5, 5.2, 'door'], [6.6, 9.2, 'door']]],
  [-5, -4.2, -5, 4.2, TE, [[1.0, 2.8, 'win'], [5.2, 7.6, 'win']]],
  // interior
  [-5, -0.6, -1.6, -0.6, TI, [[2.3, 3.2, 'gap']]],
  [-1.6, -4.2, -1.6, -0.6, TI, [[2.6, 3.5, 'gap']]],
  [-1.6, -1.8, 1, -1.8, TI, [[0.4, 1.2, 'gap']]],
  [1, -4.2, 1, 4.2, TI, [[1.7, 2.6, 'gap'], [4.0, 4.9, 'gap'], [5.0, 5.9, 'gap']]],
  [1, -1.2, 5, -1.2, TI, []],
  [1, 0.6, 5, 0.6, TI, [[0.3, 1.2, 'gap'], [2.0, 2.8, 'gap']]],
  [2.6, -1.2, 2.6, 0.6, TI, []],
];

const geo = {}; // material key → geometries (merged at the end per layer)
function add(bucket, mat, g, x, y, z, ry = 0) { g.rotateY(ry); g.translate(x, y, z); (bucket[mat] ||= []).push(g.index ? g.toNonIndexed() : g); }
function bake(bucket) {
  const grp = new THREE.Group();
  for (const [k, list] of Object.entries(bucket)) {
    list.forEach(g => { if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); });
    const m = new THREE.Mesh(mergeGeometries(list, false), M[k]); m.castShadow = !M[k].transparent; m.receiveShadow = true; grp.add(m);
  }
  return grp;
}
// planar UVs for floor boxes so the plank texture keeps its real-world scale
function floorBox(x0, z0, x1, z1, y, t, scale) {
  const g = new THREE.BoxGeometry(x1 - x0, t, z1 - z0); g.translate((x0 + x1) / 2, y - t / 2, (z0 + z1) / 2);
  const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / scale, p.getZ(i) / scale);
  return g;
}

export function buildApartment() {
  const layers = {};
  // ---- base: plinth + floor finishes
  const base = {};
  add(base, 'base', new RoundedBoxGeometry(10.9, 0.5, 13.1, 4, 0.12), 0, -0.27, 0.9);
  for (const k in ROOMS) { const [x0, z0, x1, z1] = ROOMS[k].r; (base[ROOMS[k].floor] ||= []).push(floorBox(x0, z0, x1, z1, 0.02, 0.04, ROOMS[k].floor === 'oak' ? 3.2 : 1.2).toNonIndexed()); }
  (base.deck ||= []).push(floorBox(BAL[0], BAL[1], BAL[2], BAL[3], 0.0, 0.04, 2.0).toNonIndexed());
  layers.base = bake(base);

  // ---- walls (with window sills / lintels and glazing)
  const wb = {};
  for (const [x0, z0, x1, z1, t, ops] of WALLS) {
    const alongX = z0 === z1, L = alongX ? x1 - x0 : z1 - z0;
    const seg = (a, b, y0, y1, mat = 'wall', tt = t) => { if (b - a < 0.01) return; if (mat === 'wall') { if (a === 0) a -= tt / 2; if (Math.abs(b - L) < 1e-6) b += tt / 2; } const g = alongX ? new THREE.BoxGeometry(b - a, y1 - y0, tt) : new THREE.BoxGeometry(tt, y1 - y0, b - a); add(wb, mat, g, alongX ? x0 + (a + b) / 2 : x0, (y0 + y1) / 2, alongX ? z0 : z0 + (a + b) / 2); };
    let s = 0; const sorted = [...ops].sort((p, q) => p[0] - q[0]);
    for (const [a, b, kind] of sorted) {
      seg(s, a, 0, H);
      if (kind === 'win') { seg(a, b, 0, 0.9); seg(a, b, 2.2, H); seg(a, b, 0.9, 2.2, 'glass', 0.03); }
      if (kind === 'door') { seg(a, b, 2.3, H); seg(a, b, 0.02, 2.3, 'glass', 0.03); }
      if (kind === 'gap') seg(a, b, 2.15, H);
      s = b;
    }
    seg(s, L, 0, H);
  }
  // balcony glass rail
  add(wb, 'glass', new THREE.BoxGeometry(10, 1.05, 0.03), 0, 0.55, BAL[3] - 0.05);
  add(wb, 'glass', new THREE.BoxGeometry(0.03, 1.05, 1.8), BAL[0] + 0.05, 0.55, (BAL[1] + BAL[3]) / 2);
  add(wb, 'glass', new THREE.BoxGeometry(0.03, 1.05, 1.8), BAL[2] - 0.05, 0.55, (BAL[1] + BAL[3]) / 2);
  add(wb, 'frame', new THREE.BoxGeometry(10.02, 0.05, 0.06), 0, 1.08, BAL[3] - 0.05);
  layers.walls = bake(wb);

  // ---- furniture, grouped by room so pieces can arrive one set at a time
  const sets = {};
  const F = k => (sets[k] ||= {});
  const rb = (w, h, d, r = 0.06) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, h / 2 - 0.001, w / 2 - 0.001, d / 2 - 0.001));
  // living: sofa facing the balcony, armchair, coffee table, rug, plant
  { const L = F('living');
    add(L, 'rug', new THREE.BoxGeometry(3.0, 0.015, 2.0), -3.0, 0.05, 2.9);
    add(L, 'fabric', rb(2.5, 0.42, 0.95, 0.1), -3.0, 0.25, 2.05); add(L, 'fabric', rb(2.5, 0.42, 0.22, 0.08), -3.0, 0.62, 1.68);
    add(L, 'fabric', rb(0.24, 0.55, 0.95, 0.08), -4.15, 0.32, 2.05); add(L, 'fabric', rb(0.24, 0.55, 0.95, 0.08), -1.85, 0.32, 2.05);
    add(L, 'fabric2', rb(0.85, 0.42, 0.85, 0.1), -1.3, 0.25, 3.4, -0.6); add(L, 'fabric2', rb(0.85, 0.45, 0.2, 0.08), -1.05, 0.58, 3.65, -0.6);
    add(L, 'wood', new THREE.CylinderGeometry(0.45, 0.45, 0.05, 40), -3.0, 0.42, 3.05); add(L, 'wood', new THREE.CylinderGeometry(0.08, 0.12, 0.38, 16), -3.0, 0.2, 3.05);
    add(L, 'pot', new THREE.CylinderGeometry(0.22, 0.17, 0.42, 20), -4.55, 0.23, 3.75); }
  // kitchen along the inner wall + island
  { const K = F('kitchen');
    add(K, 'white', new THREE.BoxGeometry(0.62, 2.2, 0.75), 0.6, 1.12, -0.18);
    add(K, 'white', new THREE.BoxGeometry(0.62, 0.9, 2.2), 0.6, 0.47, 1.35); add(K, 'stone', new THREE.BoxGeometry(0.66, 0.04, 2.24), 0.6, 0.94, 1.35);
    add(K, 'wood', new THREE.BoxGeometry(0.95, 0.9, 1.8), -0.75, 0.47, 1.35); add(K, 'stone', new THREE.BoxGeometry(1.03, 0.04, 1.88), -0.75, 0.94, 1.35);
    add(K, 'dark', new THREE.BoxGeometry(0.5, 0.02, 0.4), 0.6, 0.97, 1.7); }
  { const D = F('dining');
    add(D, 'wood', new THREE.BoxGeometry(1.7, 0.05, 0.85), -3.0, 0.76, 0.35); [[-0.7, -0.36], [0.7, -0.36], [-0.7, 0.36], [0.7, 0.36]].forEach(([x, z]) => add(D, 'wood', new THREE.BoxGeometry(0.05, 0.74, 0.05), -3.0 + x, 0.37, 0.35 + z));
    [[-0.42, -0.1, 1], [0.42, -0.1, 1], [-0.42, 0.8, -1], [0.42, 0.8, -1]].forEach(([x, z, sgn]) => { add(D, 'fabric2', rb(0.44, 0.07, 0.44, 0.03), -3.0 + x, 0.46, z); add(D, 'wood', new THREE.BoxGeometry(0.44, 0.4, 0.04), -3.0 + x, 0.68, z - sgn * 0.2); });
    add(D, 'white', new THREE.SphereGeometry(0.2, 24, 12), -3.0, 1.9, 0.35); }
  // master bedroom
  { const B = F('master');
    add(B, 'wood', rb(1.9, 0.3, 2.1, 0.04), 3.3, 0.18, 2.95); add(B, 'linen', rb(1.8, 0.22, 1.9, 0.08), 3.3, 0.42, 3.0); add(B, 'fabric2', rb(1.84, 0.06, 0.8, 0.03), 3.3, 0.55, 3.55);
    add(B, 'wood', rb(2.0, 1.0, 0.08, 0.02), 3.3, 0.55, 1.88); add(B, 'linen', rb(0.6, 0.14, 0.32, 0.06), 2.9, 0.58, 2.15); add(B, 'linen', rb(0.6, 0.14, 0.32, 0.06), 3.7, 0.58, 2.15);
    add(B, 'wood', rb(0.45, 0.45, 0.4, 0.03), 2.0, 0.24, 1.95); add(B, 'wood', rb(0.45, 0.45, 0.4, 0.03), 4.6, 0.24, 1.95);
    add(B, 'rug', new THREE.BoxGeometry(2.6, 0.015, 1.4), 3.3, 0.05, 3.7); }
  { const C = F('closet'); add(C, 'white', new THREE.BoxGeometry(0.6, 2.3, 1.7), 1.42, 1.17, -0.3); }
  // bedroom 2 + study
  { const B2 = F('bed2');
    add(B2, 'wood', rb(1.0, 0.28, 2.05, 0.03), -4.35, 0.17, -2.6); add(B2, 'linen', rb(0.92, 0.2, 1.9, 0.07), -4.35, 0.38, -2.55);
    add(B2, 'white', new THREE.BoxGeometry(1.6, 2.3, 0.6), -2.5, 1.17, -3.82); add(B2, 'wood', rb(1.1, 0.05, 0.55, 0.02), -2.2, 0.75, -1.05); add(B2, 'fabric2', rb(0.45, 0.45, 0.45, 0.08), -2.2, 0.3, -1.6); }
  { const S = F('bed3');
    add(S, 'wood', rb(1.6, 0.05, 0.7, 0.02), 3.0, 0.75, -3.75); add(S, 'dark', new THREE.BoxGeometry(0.6, 0.38, 0.03), 3.0, 1.0, -3.95); add(S, 'fabric2', rb(0.5, 0.5, 0.5, 0.1), 3.0, 0.32, -3.15);
    add(S, 'fabric', rb(2.0, 0.42, 0.85, 0.1), 3.0, 0.25, -1.75); add(S, 'white', new THREE.BoxGeometry(0.4, 2.0, 1.6), 4.7, 1.02, -2.6); }
  // bathrooms
  { const W = F('baths');
    add(W, 'white', rb(0.8, 0.5, 1.7, 0.08), -0.25, 0.27, -3.3); add(W, 'white', rb(0.9, 0.12, 0.5, 0.03), 0.45, 0.85, -2.1); add(W, 'white', rb(0.38, 0.4, 0.55, 0.12), -1.2, 0.22, -2.3);
    add(W, 'glass', new THREE.BoxGeometry(0.03, 2.0, 1.1), 3.7, 1.02, 0.0); add(W, 'white', rb(1.0, 0.12, 0.45, 0.03), 4.4, 0.85, -0.95 + 0.0); add(W, 'white', rb(0.38, 0.4, 0.55, 0.12), 3.1, 0.22, 0.3); }
  // balcony
  { const P = F('balcony');
    add(P, 'fabric', rb(0.65, 0.3, 1.8, 0.08), 3.6, 0.2, 5.1, Math.PI / 2); add(P, 'fabric', rb(0.65, 0.3, 1.8, 0.08), 3.6, 0.2, 5.6 - 0.0, Math.PI / 2);
    add(P, 'wood', new THREE.CylinderGeometry(0.4, 0.4, 0.04, 32), -2.6, 0.72, 5.1); add(P, 'wood', new THREE.CylinderGeometry(0.05, 0.05, 0.7, 10), -2.6, 0.36, 5.1);
    add(P, 'fabric2', rb(0.48, 0.45, 0.48, 0.1), -3.3, 0.25, 5.1); add(P, 'fabric2', rb(0.48, 0.45, 0.48, 0.1), -1.9, 0.25, 5.1);
    add(P, 'pot', new THREE.CylinderGeometry(0.3, 0.24, 0.55, 20), 0.7, 0.29, 5.55); add(P, 'pot', new THREE.CylinderGeometry(0.3, 0.24, 0.55, 20), -4.55, 0.29, 5.55); }
  layers.sets = {};
  for (const k in sets) layers.sets[k] = bake(sets[k]);
  // foliage (separate, soft sage)
  const leaves = {};
  const tree = (x, z, s, y0) => { const r = rnd((x * 100 + z * 10) | 0 || 5); for (let i = 0; i < 7; i++) { const g = new THREE.IcosahedronGeometry(0.22 * s * (0.7 + r() * 0.5), 1); add(leaves, 'leaf', g, x + (r() - .5) * 0.5 * s, y0 + 0.4 * s + r() * 0.75 * s, z + (r() - .5) * 0.5 * s); } add(leaves, 'wood', new THREE.CylinderGeometry(0.025, 0.035, 0.6 * s, 6), x, y0 + 0.3 * s, z); };
  tree(-4.55, 3.75, 1.3, 0.44); tree(0.7, 5.55, 1.5, 0.56); tree(-4.55, 5.55, 1.5, 0.56);
  layers.sets.plants = bake(leaves);

  // ---- roof: a slatted pergola + ceiling plate that floats above in the exploded view
  const rf = {};
  for (let i = 0; i < 34; i++) add(rf, 'slat', new THREE.BoxGeometry(0.06, 0.14, 10.4), -4.95 + i * 0.3, 0, 0.9);
  add(rf, 'slat', new THREE.BoxGeometry(10.2, 0.1, 0.1), 0, 0.12, -4.2); add(rf, 'slat', new THREE.BoxGeometry(10.2, 0.1, 0.1), 0, 0.12, 6.0); add(rf, 'slat', new THREE.BoxGeometry(10.2, 0.1, 0.1), 0, 0.12, 0.9);
  layers.roof = bake(rf);
  return layers;
}
