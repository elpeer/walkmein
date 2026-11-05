// Hamigdal Bechorshot, type C – a furnished 3D cut-away ("dollhouse") built from the sales floor plan.
// Walls are vectorised from the plan's wall fill; furniture sits where the plan draws it.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { APT as E2 } from './aptdata.js';
import { HANDLED as ABO_HANDLED } from './abo.js';

const S = E2.S, CX = E2.CX, CY = E2.CY, WALL_H = 2.2;
// footprint of everything that is drawn (apartment + balconies), in plan units
const FOOT = (() => { const all = [...Object.values(E2.zones).flat(), ...E2.slab]; return { x0: Math.min(...all.map(r => r[0])), y0: Math.min(...all.map(r => r[1])), x1: Math.max(...all.map(r => r[2])), y1: Math.max(...all.map(r => r[3])) }; })();
const KS = 0.02085 / S; // plan units are finer than the original (2.085cm) plan
const SPAN = Math.max(FOOT.x1 - FOOT.x0, FOOT.y1 - FOOT.y0) * S; // metres across the model
const X = px => (px - CX) * S, Z = py => (py - CY) * S;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export async function createApt(container, opts = {}) {
  const BASE = opts.base || '';
  const mobile = matchMedia('(max-width: 900px)').matches;
  const Q = opts.quality ?? (mobile ? 1 : 2);
  const R = rng(5);
  let idle = 0; function kick() { idle = 0; }
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.capture, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.3, 300);
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture; scene.environmentIntensity = 0.55;

  // ---------------------------------------------------------------- textures + materials
  const loader = new THREE.TextureLoader(); const pending = [];
  const tex = (f, srgb) => { const t = loader.load(BASE + 'tex/' + f); pending.push(new Promise(r => { const iv = setInterval(() => { if (t.image) { clearInterval(iv); r(); } }, 40); setTimeout(() => { clearInterval(iv); r(); }, 10000); })); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const T = { oakC: tex('oakl_c.jpg', true), oakF: tex('oakg_c.jpg', true), deckL: tex('deckl_c.jpg', true), oakN: tex('oak_n.jpg'), oakR: tex('oak_r.jpg'), tileC: tex('tile_c.jpg', true), tileN: tex('tile_n.jpg'), deckC: tex('deck_c.jpg', true), deckN: tex('deck_n.jpg'), rugC: tex('rug_c.jpg', true), fabC: tex('fabric_c.jpg', true), fabN: tex('fabric_n.jpg'), walC: tex('walnut_c.jpg', true), wallN: tex('wall_n.jpg'), marble: tex('marble_c.jpg', true), linen: tex('linen_c.jpg', true) };
  const std = (o) => new THREE.MeshStandardMaterial(o), phys = (o) => new THREE.MeshPhysicalMaterial(o);
  // palette follows the "white model" look: matte white shell, light natural oak, cream textiles, white fixtures
  const M = {
    oak: std({ color: 0xffffff, map: T.oakC, normalMap: T.oakN, normalScale: new THREE.Vector2(0.25, 0.25), roughnessMap: T.oakR, roughness: 0.82, envMapIntensity: 0.7 }),
    tile: std({ color: 0xefece7, map: T.tileC, normalMap: T.tileN, normalScale: new THREE.Vector2(0.4, 0.4), roughness: 0.42 }),
    tileDark: std({ color: 0xdedad3, map: T.tileC, normalMap: T.tileN, normalScale: new THREE.Vector2(0.4, 0.4), roughness: 0.45 }),
    core: std({ color: 0xe7e4df, roughness: 0.95 }),
    tread: std({ color: 0xd6d2cb, roughness: 0.95 }),
    deck: std({ color: 0xffffff, map: T.deckL, normalMap: T.deckN, normalScale: new THREE.Vector2(0.3, 0.3), roughness: 0.85 }),
    wall: std({ color: 0xfafaf8, roughness: 0.96, envMapIntensity: 0.9 }),
    cap: std({ color: 0xffffff, roughness: 0.98, envMapIntensity: 0.9 }),
    slab: std({ color: 0xf6f5f2, roughness: 0.96 }),
    slabEdge: std({ color: 0xf7f6f3, roughness: 0.96 }),
    glass: phys({ color: 0xeaf3f6, roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false, envMapIntensity: 0.5 }),
    frame: std({ color: 0xf4f4f2, roughness: 0.6 }),
    alu: std({ color: 0xf1f1ef, roughness: 0.5 }),
    blackMetal: std({ color: 0x2a2b2e, roughness: 0.45, metalness: 0.4 }),
    fab: std({ color: 0xddd4c7, map: T.fabC, normalMap: T.fabN, normalScale: new THREE.Vector2(0.45, 0.45), roughness: 0.97 }),
    fabGrey: std({ color: 0xd8cfc2, map: T.fabC, normalMap: T.fabN, normalScale: new THREE.Vector2(0.45, 0.45), roughness: 0.97 }),
    fabSage: std({ color: 0xf3eee6, map: T.fabC, normalMap: T.fabN, normalScale: new THREE.Vector2(0.45, 0.45), roughness: 0.97 }),
    fabBlue: std({ color: 0xcfc3b1, map: T.fabC, normalMap: T.fabN, roughness: 0.97 }),
    fabRust: std({ color: 0xc9b9a3, map: T.fabC, normalMap: T.fabN, roughness: 0.97 }),
    linen: std({ color: 0xffffff, map: T.linen, roughness: 0.97 }),
    duvet: std({ color: 0xd9cfc1, map: T.linen, roughness: 0.97 }),
    leather: std({ color: 0xd9c7ae, roughness: 0.75 }),
    walnut: std({ color: 0xffffff, map: T.oakF, roughness: 0.62 }),
    oakFurn: std({ color: 0xffffff, map: T.oakF, roughness: 0.62 }),
    marble: std({ color: 0xf6efe4, map: T.marble, roughness: 0.32 }),
    onyx: std({ color: 0xf2e6d6, map: T.marble, roughness: 0.25 }),
    veneer: std({ color: 0xb9ab9b, map: T.oakF, roughness: 0.7 }),
    walnutDark: std({ color: 0x8a6a52, map: T.walC, roughness: 0.6 }),
    glassSmoke: phys({ color: 0x3b3a38, roughness: 0.08, transparent: true, opacity: 0.55, envMapIntensity: 0.6 }),
    pouf: std({ color: 0x9c968e, map: T.fabC, roughness: 0.97 }),
    top: std({ color: 0xe4e2de, roughness: 0.45 }),
    cabinet: std({ color: 0xf7f6f3, roughness: 0.6 }),
    cabinetDark: std({ color: 0x9b7a60, map: T.walC, roughness: 0.6 }),
    groove: std({ color: 0xd9d6d0, roughness: 0.8 }),
    black: std({ color: 0x2a2b2e, roughness: 0.5, metalness: 0.2 }),
    screen: std({ color: 0x15171b, roughness: 0.2, metalness: 0.3 }),
    ceramic: phys({ color: 0xffffff, roughness: 0.22, clearcoat: 0.5 }),
    mirror: std({ color: 0xe8edf0, roughness: 0.05, metalness: 0.9 }),
    steel: std({ color: 0xd4d6d8, roughness: 0.3, metalness: 0.7 }),
    rug: std({ color: 0xe6dccb, map: T.rugC, roughness: 1 }),
    rugDark: std({ color: 0xd2c6b3, map: T.rugC, roughness: 1 }),
    pot: std({ color: 0xf3f1ed, roughness: 0.85 }),
    potDark: std({ color: 0xece9e3, roughness: 0.85 }),
    soil: std({ color: 0x5b4a3c, roughness: 1 }),
    teak: std({ color: 0xffffff, map: T.oakF, roughness: 0.7 }),
    canvas: std({ color: 0xf7f4ee, roughness: 0.9, side: THREE.DoubleSide }),
    lampShade: std({ color: 0xfbf8f2, roughness: 0.8, emissive: 0xfff3df, emissiveIntensity: 0.25, side: THREE.DoubleSide }),
    brass: std({ color: 0xf3f1ed, roughness: 0.5 }),
    fruit: std({ color: 0xb9c46a, roughness: 0.6 }),
    book: std({ color: 0xcdbfa8, roughness: 0.9 }),
  };
  M.railGlass = M.glass.clone(); M.railTop = M.alu.clone();
  const leafMats = [0x5d7a45, 0x6c8a50, 0x7c9a5a, 0x52703e, 0x88a462].map(c => std({ color: c, roughness: 0.75 }));
  const setRep = (m, s) => { ['map', 'normalMap', 'roughnessMap'].forEach(k => m[k] && (m[k] = m[k].clone(), m[k].repeat.set(1 / s, 1 / s), m[k].needsUpdate = true)); };
  // world-space UVs everywhere, so a repeat of 1 = 1 metre
  setRep(M.oak, 1.6); setRep(M.tile, 1.2); setRep(M.tileDark, 1.2); setRep(M.deck, 1.6); setRep(M.rug, 2); setRep(M.rugDark, 2); setRep(M.marble, 1.6); setRep(M.onyx, 0.9); setRep(M.veneer, 0.7); setRep(M.walnutDark, 0.8); setRep(M.cabinetDark, 0.8); setRep(M.pouf, 0.5); setRep(M.walnut, 0.8); setRep(M.oakFurn, 0.8); setRep(M.teak, 0.8); 
  ['fab', 'fabGrey', 'fabSage', 'fabBlue', 'fabRust'].forEach(k => setRep(M[k], 0.6)); setRep(M.linen, 0.5); setRep(M.duvet, 0.5);

  // ---------------------------------------------------------------- geometry buckets (merged per material, per layer)
  const layers = { base: new THREE.Group(), walls: new THREE.Group(), furn: new THREE.Group() };
  const root = new THREE.Group(); Object.values(layers).forEach(g => root.add(g)); scene.add(root);
  let B = new Map(), layer = 'base';
  function push(m, g) { g = g.index ? g.toNonIndexed() : g; worldUV(g); const k = layer + '|' + m.uuid; if (!B.has(k)) B.set(k, { m, l: layer, list: [] }); B.get(k).list.push(g); }
  function worldUV(g) { const p = g.attributes.position, n = g.attributes.normal; const uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)); let u, v; if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); } else if (ax >= az) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); } uv[i * 2] = u; uv[i * 2 + 1] = v; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
  const box = (m, x0, y0, z0, x1, y1, z1) => { const g = new THREE.BoxGeometry(Math.max(1e-3, Math.abs(x1 - x0)), Math.max(1e-3, Math.abs(y1 - y0)), Math.max(1e-3, Math.abs(z1 - z0))); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); push(m, g); };
  const rbox = (m, cx, cy, cz, sx, sy, sz, r, rotY = 0, seg = 3) => { const g = new RoundedBoxGeometry(Math.max(0.01, sx), Math.max(0.01, sy), Math.max(0.01, sz), seg, Math.max(0.002, Math.min(r, sx / 2 - 1e-3, sy / 2 - 1e-3, sz / 2 - 1e-3))); if (rotY) g.rotateY(rotY); g.translate(cx, cy, cz); push(m, g); };
  const cyl = (m, cx, cy, cz, r0, r1, h, seg = 28) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg); g.translate(cx, cy, cz); push(m, g); };
  const sph = (m, cx, cy, cz, sx, sy, sz, det = 2) => { const g = new THREE.IcosahedronGeometry(1, det); g.scale(sx, sy, sz); g.translate(cx, cy, cz); push(m, g); };
  const torus = (m, cx, cy, cz, r, t, rotX = Math.PI / 2) => { const g = new THREE.TorusGeometry(r, t, 10, 40); g.rotateX(rotX); g.translate(cx, cy, cz); push(m, g); };
  function bake() {
    B.forEach(({ m, l, list }) => {
      const norm = list.map(g => { const h = new THREE.BufferGeometry(); h.setAttribute('position', g.attributes.position); h.setAttribute('normal', g.attributes.normal); h.setAttribute('uv', g.attributes.uv); return h; });
      const mesh = new THREE.Mesh(mergeGeometries(norm, false), m); mesh.castShadow = !m.transparent; mesh.receiveShadow = true; layers[l].add(mesh); list.forEach(g => g.dispose());
    }); B.clear();
  }

  // ---------------------------------------------------------------- slab + floors (base layer)
  layer = 'base';
  // slab follows the real footprint (apartment + core + terraces) instead of one big rectangle
  [...E2.zones.oak, ...E2.zones.tile, ...E2.zones.wet, ...E2.zones.deck, ...E2.slab].forEach(([x0, y0, x1, y1]) => box(M.slabEdge, X(x0) - 0.04, -0.34, Z(y0) - 0.04, X(x1) + 0.04, -0.02, Z(y1) + 0.04));
  const fl = (m, r, y = 0.005) => box(m, X(r[0]), -0.02, Z(r[1]), X(r[2]), y, Z(r[3]));
  E2.zones.deck.forEach(r => fl(M.deck, r, 0.0));
  E2.zones.core.forEach(r => fl(M.core, r, 0.002));
  E2.zones.oak.forEach(r => fl(M.oak, r, 0.01));
  E2.zones.tile.forEach(r => fl(M.tile, r, 0.012));
  E2.zones.wet.forEach(r => fl(M.tileDark, r, 0.014));

  // ---------------------------------------------------------------- walls, glazing, railings (walls layer – they "grow" in)
  layer = 'walls';
  // the building core (stairs / lifts) is not part of the apartment: keep its walls low so the eye stays on the home
  const inCore = () => false;
  const MIN_T = 0.13; // partitions read as solid, thick model walls
  E2.walls.forEach(([x0, y0, x1, y1]) => {
    const h = inCore(x0, y0, x1, y1) ? 0.9 : WALL_H; let a = X(x0), b = X(x1), c = Z(y0), d = Z(y1);
    if (b - a < MIN_T && d - c > 0.25) { const m = (a + b) / 2; a = m - MIN_T / 2; b = m + MIN_T / 2; }
    if (d - c < MIN_T && b - a > 0.25) { const m = (c + d) / 2; c = m - MIN_T / 2; d = m + MIN_T / 2; }
    box(M.wall, a, 0, c, b, h, d); box(M.cap, a, h, c, b, h + 0.006, d);
  });
  E2.glass.forEach(([x0, y0, x1, y1]) => {
    const h = Math.abs(y1 - y0) < 1; const a = h ? X(x0) : X(x0) - 0.025, b = h ? X(x1) : X(x0) + 0.025, c = h ? Z(y0) - 0.025 : Z(y0), d = h ? Z(y0) + 0.025 : Z(y1);
    box(M.glass, a, 0.04, c, b, WALL_H - 0.12, d);
    box(M.frame, a, 0, c - 0.015, b, 0.04, d + 0.015); box(M.frame, a, WALL_H - 0.14, c - 0.015, b, WALL_H - 0.1, d + 0.015);
    const len = h ? b - a : d - c, n = Math.max(1, Math.round(len / 1.3)); for (let i = 0; i <= n; i++) { const t = i / n; if (h) box(M.frame, a + len * t - 0.022, 0, c - 0.015, a + len * t + 0.022, WALL_H - 0.1, d + 0.015); else box(M.frame, a - 0.015, 0, c + len * t - 0.022, b + 0.015, WALL_H - 0.1, c + len * t + 0.022); }
    box(M.wall, a - (h ? 0 : 0.09), WALL_H - 0.1, c - (h ? 0.09 : 0), b + (h ? 0 : 0.09), WALL_H, d + (h ? 0.09 : 0)); box(M.cap, a - (h ? 0 : 0.09), WALL_H, c - (h ? 0.09 : 0), b + (h ? 0 : 0.09), WALL_H + 0.01, d + (h ? 0.09 : 0));
  });
  E2.rails.forEach(([x0, y0, x1, y1]) => { const h = Math.abs(y1 - y0) < 1; const a = X(Math.min(x0, x1)), b = X(Math.max(x0, x1)), c = Z(Math.min(y0, y1)), d = Z(Math.max(y0, y1)); const t = 0.018; if (h) { box(M.railGlass, a, 0, c - t, b, 1.05, c + t); box(M.railTop, a, 1.05, c - 0.03, b, 1.09, c + 0.03); } else { box(M.railGlass, a - t, 0, c, a + t, 1.05, d); box(M.railTop, a - 0.03, 1.05, c, a + 0.03, 1.09, d); } });
  // louvred screen of the laundry nook
  (E2.louvers || []).forEach(([x0, y0, x1, y1]) => { const a = X(x0), c = Z(Math.min(y0, y1)), d = Z(Math.max(y0, y1)); for (let z = c + 0.03; z < d; z += 0.09) box(M.frame, a - 0.04, 0.05, z, a + 0.04, WALL_H - 0.12, z + 0.018); box(M.wall, a - 0.09, WALL_H - 0.12, c, a + 0.09, WALL_H, d); });
  if (E2.pergola) { const [x0, y0, x1, y1] = E2.pergola; const top = WALL_H + 0.25; box(M.wall, X(x0), top - 0.22, Z(y0), X(x0) + 0.14, top, Z(y1)); for (let y = y0 + 6; y < y1; y += 9) box(M.wall, X(x0), top - 0.16, Z(y), X(x1), top - 0.04, Z(y) + 0.05); for (const yy of [y0, y1]) box(M.wall, X(x0), 0, Z(yy) - (yy === y0 ? 0 : 0.14), X(x0) + 0.14, top, Z(yy) + (yy === y0 ? 0.14 : 0)); }

  // ---------------------------------------------------------------- furniture (furn layer – drops in)
  layer = 'furn';
  const rect = (x0, y0, x1, y1) => ({ x0: X(Math.min(x0, x1)), x1: X(Math.max(x0, x1)), z0: Z(Math.min(y0, y1)), z1: Z(Math.max(y0, y1)), cx: X((x0 + x1) / 2), cz: Z((y0 + y1) / 2), w: Math.abs(x1 - x0) * S, d: Math.abs(y1 - y0) * S });
  const DIR = { l: [-1, 0], r: [1, 0], t: [0, -1], b: [0, 1] };
  // helpers in "local" orientation: f = facing direction, s = side (perpendicular)
  function frame(r, face) { const [fx, fz] = DIR[face]; const alongX = fz !== 0; const L = alongX ? r.w : r.d, D = alongX ? r.d : r.w; const at = (u, v) => [r.cx + (alongX ? u : fx * v), r.cz + (alongX ? fz * v : u)]; const size = (su, sv) => alongX ? [su, sv] : [sv, su]; return { L, D, at, size, fx, fz }; }
  function legs(m, r, h, inset = 0.06, rad = 0.018) { for (const [a, b] of [[r.x0 + inset, r.z0 + inset], [r.x1 - inset, r.z0 + inset], [r.x0 + inset, r.z1 - inset], [r.x1 - inset, r.z1 - inset]]) cyl(m, a, h / 2, b, rad, rad * 0.8, h, 10); }
  function pillow(m, cx, cy, cz, w, h, d, rotY = 0) { const g = new THREE.IcosahedronGeometry(1, 3); g.scale(w / 2, h / 2, d / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (w / 2), z = p.getZ(i) / (d / 2); const k = 1 + 0.12 * (1 - Math.abs(x)) ; p.setY(i, p.getY(i) * k); } g.computeVertexNormals(); if (rotY) g.rotateY(rotY); g.translate(cx, cy, cz); push(m, g); }
  function sofa(r, face, mat = M.fab, accent = [M.fabSage, M.linen], outdoor = false) {
    const F = frame(r, face); const seatH = outdoor ? 0.36 : 0.42, baseH = 0.16, backT = 0.2, armW = 0.17;
    // base on slim legs
    let [cx, cz] = F.at(0, 0); let [sx, sz] = F.size(F.L, F.D);
    rbox(outdoor ? M.teak : mat, cx, baseH + 0.11, cz, sx, 0.22, sz, 0.05);
    if (!outdoor) for (const u of [-F.L / 2 + 0.08, F.L / 2 - 0.08]) for (const v of [-F.D / 2 + 0.08, F.D / 2 - 0.08]) { const [lx, lz] = F.at(u, v); cyl(M.oakFurn, lx, baseH / 2, lz, 0.02, 0.016, baseH, 8); }
    else for (const u of [-F.L / 2 + 0.05, F.L / 2 - 0.05]) { const [lx, lz] = F.at(u, 0); const [a, b] = F.size(0.06, F.D); rbox(M.teak, lx, baseH / 2, lz, a, baseH, b, 0.01); }
    // back + arms
    [cx, cz] = F.at(0, -F.D / 2 + backT / 2); [sx, sz] = F.size(F.L, backT); rbox(mat, cx, (seatH + 0.82) / 2 + 0.05, cz, sx, 0.82 - seatH + 0.2, sz, 0.07);
    for (const s of [-1, 1]) { [cx, cz] = F.at(s * (F.L / 2 - armW / 2), 0.02); [sx, sz] = F.size(armW, F.D - 0.02); rbox(mat, cx, 0.5, cz, sx, 0.34, sz, 0.07); }
    // seat cushions + back cushions
    const n = Math.max(1, Math.round((F.L - 2 * armW) / 0.8)), cw = (F.L - 2 * armW) / n;
    for (let i = 0; i < n; i++) { const u = -F.L / 2 + armW + cw * (i + 0.5); [cx, cz] = F.at(u, 0.05); [sx, sz] = F.size(cw - 0.02, F.D - backT - 0.04); rbox(mat, cx, seatH + 0.06, cz, sx, 0.13, sz, 0.05); [cx, cz] = F.at(u, -F.D / 2 + backT + 0.09); [sx, sz] = F.size(cw - 0.04, 0.16); rbox(mat, cx, seatH + 0.3, cz, sx, 0.38, sz, 0.07); }
    // throw pillows
    for (const [i, s] of [[0, -1], [1, 1]]) { const u = s * (F.L / 2 - armW - 0.28); [cx, cz] = F.at(u, -F.D / 2 + backT + 0.22); const rot = F.fz ? 0 : Math.PI / 2; pillow(accent[i], cx, seatH + 0.32, cz, 0.42, 0.36, 0.13, rot + s * 0.12); }
  }
  function armchair(r, face, mat = M.fab) { const F = frame(r, face); const s = Math.min(F.L, F.D); let [cx, cz] = F.at(0, 0);
    rbox(mat, cx, 0.26, cz, s, 0.3, s, 0.09); rbox(mat, cx, 0.45, cz, s - 0.16, 0.1, s - 0.16, 0.05);
    let [bx, bz] = F.at(0, -s / 2 + 0.09); let [sx, sz] = F.size(s, 0.17); rbox(mat, bx, 0.56, bz, sx, 0.5, sz, 0.08);
    for (const k of [-1, 1]) { const [ax, az] = F.at(k * (s / 2 - 0.08), 0); const [qx, qz] = F.size(0.15, s); rbox(mat, ax, 0.48, az, qx, 0.32, qz, 0.07); }
    for (const u of [-s / 2 + 0.07, s / 2 - 0.07]) for (const v of [-s / 2 + 0.07, s / 2 - 0.07]) { const [lx, lz] = F.at(u, v); cyl(M.walnut, lx, 0.06, lz, 0.018, 0.014, 0.12, 8); }
  }
  function chair(cx, cz, face, mat = M.oakFurn) { const [fx, fz] = DIR[face]; const W = 0.44;
    rbox(mat, cx, 0.45, cz, W, 0.035, W, 0.012);
    for (const [a, b] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) cyl(mat, cx + a, 0.22, cz + b, 0.018, 0.014, 0.44, 8);
    for (const k of [-1, 1]) { const px = cx - fx * 0.19 + (fz ? k * 0.18 : 0), pz = cz - fz * 0.19 + (fx ? k * 0.18 : 0); cyl(mat, px, 0.64, pz, 0.016, 0.016, 0.38, 8); }
    rbox(mat, cx - fx * 0.2, 0.76, cz - fz * 0.2, fx ? 0.03 : W - 0.02, 0.15, fz ? 0.03 : W - 0.02, 0.012);
  }
  function dining(r, orient, outdoor = false) {
    const long = orient === 'v' ? r.d : r.w;
    rbox(M.oakFurn, r.cx, 0.74, r.cz, r.w, 0.04, r.d, 0.012); legs(M.oakFurn, r, 0.72, 0.07, 0.028);
    const n = Math.max(2, Math.round(long / 0.62)); for (let i = 0; i < n; i++) { const t = -long / 2 + (i + 0.5) * long / n; if (orient === 'v') { chair(r.x0 - 0.3, r.cz + t, 'r'); chair(r.x1 + 0.3, r.cz + t, 'l'); } else { chair(r.cx + t, r.z0 - 0.3, 'b'); chair(r.cx + t, r.z1 + 0.3, 't'); } }
    // bowl of fruit, like a styled show flat
    const g = new THREE.SphereGeometry(0.16, 28, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); g.scale(1, 0.45, 1); g.translate(r.cx, 0.84, r.cz); push(M.ceramic, g);
    for (let i = 0; i < 4; i++) { const a = i * 1.7; sph(M.fruit, r.cx + Math.cos(a) * 0.06, 0.82, r.cz + Math.sin(a) * 0.06, 0.045, 0.045, 0.045, 1); }
  }
  function bed(r, head, double) {
    const F = frame(r, head === 'l' ? 'r' : head === 'r' ? 'l' : head === 't' ? 'b' : 't'); // F faces the foot end
    const L = F.D, W = F.L; let [cx, cz] = F.at(0, 0);
    // upholstered platform
    let [sx, sz] = F.size(W + 0.08, L + 0.06); rbox(M.oakFurn, cx, 0.16, cz, sx, 0.24, sz, 0.02);
    [sx, sz] = F.size(W - 0.04, L - 0.06); rbox(M.linen, cx, 0.37, cz, sx, 0.2, sz, 0.07);
    // duvet over the lower 70%
    let [dx, dz] = F.at(0, L * 0.13); [sx, sz] = F.size(W + 0.02, L * 0.72); rbox(M.duvet, dx, 0.47, dz, sx, 0.08, sz, 0.04);
    // throw at the foot
    [dx, dz] = F.at(0, L / 2 - L * 0.16); [sx, sz] = F.size(W + 0.05, L * 0.22); rbox(double ? M.fabRust : M.fabBlue, dx, 0.52, dz, sx, 0.03, sz, 0.015);
    // pillows + headboard
    const np = double ? 2 : 1; for (let i = 0; i < np; i++) { const u = np === 1 ? 0 : (i ? 1 : -1) * W * 0.24; const [px, pz] = F.at(u, -L / 2 + 0.24); pillow(M.linen, px, 0.55, pz, F.fz ? W / np - 0.12 : 0.28, 0.16, F.fz ? 0.28 : W / np - 0.12); }
    if (double) { const [px, pz] = F.at(0, -L / 2 + 0.42); pillow(M.fabSage, px, 0.56, pz, F.fz ? 0.5 : 0.14, 0.3, F.fz ? 0.14 : 0.5); }
    const [hx, hz] = F.at(0, -L / 2 - 0.04); [sx, sz] = F.size(W + 0.16, 0.09); rbox(M.oakFurn, hx, 0.55, hz, sx, 0.9, sz, 0.02);
    // bench at the foot of the double bed
    if (double) { const [bx, bz] = F.at(0, L / 2 + 0.3); [sx, sz] = F.size(W * 0.8, 0.4); rbox(M.oakFurn, bx, 0.42, bz, sx, 0.05, sz, 0.012); for (const u of [-W * 0.36, W * 0.36]) { const [lx, lz] = F.at(u, L / 2 + 0.3); const [a, b] = F.size(0.04, 0.36); rbox(M.oakFurn, lx, 0.2, lz, a, 0.4, b, 0.01); } }
  }
  function night(r) { rbox(M.walnut, r.cx, 0.27, r.cz, r.w, 0.5, r.d, 0.02); cyl(M.ceramic, r.cx, 0.6, r.cz, 0.05, 0.07, 0.18, 16); const g = new THREE.CylinderGeometry(0.1, 0.13, 0.17, 24, 1, true); g.translate(r.cx, 0.76, r.cz); push(M.lampShade, g); }
  function ward(r) { const along = r.w > r.d; box(M.cabinet, r.x0, 0, r.z0, r.x1, 2.15, r.z1); const n = Math.max(1, Math.round((along ? r.w : r.d) / 0.5)); for (let i = 1; i < n; i++) { const t = i / n; if (along) box(M.groove, r.x0 + r.w * t - 0.004, 0.06, r.z0 - 0.003, r.x0 + r.w * t + 0.004, 2.1, r.z1 + 0.003); else box(M.groove, r.x0 - 0.003, 0.06, r.z0 + r.d * t - 0.004, r.x1 + 0.003, 2.1, r.z0 + r.d * t + 0.004); } box(M.cabinet, r.x0 + 0.01, 2.15, r.z0 + 0.01, r.x1 - 0.01, 2.17, r.z1 - 0.01); }
  function desk(r, face) { rbox(M.oakFurn, r.cx, 0.74, r.cz, r.w, 0.03, r.d, 0.01); legs(M.oakFurn, r, 0.73, 0.04, 0.016); const [fx, fz] = DIR[face] || [0, 1]; chair(r.cx - fx * 0.5, r.cz - fz * 0.5, face); rbox(M.screen, r.cx + fx * (r.d * 0.25), 1.0, r.cz + fz * (r.w * 0.0), fx ? 0.03 : 0.55, 0.32, fz ? 0.03 : 0.55, 0.01); cyl(M.cabinet, r.cx + fx * (r.d * 0.25), 0.8, r.cz, 0.02, 0.02, 0.12, 8); }
  function plant(px, pz, s = 1, tall = false) {
    const x = X(px), z = Z(pz); rbox(M.pot, x, 0.22 * s, z, 0.42 * s, 0.44 * s, 0.42 * s, 0.08 * s); cyl(M.soil, x, 0.44 * s, z, 0.17 * s, 0.17 * s, 0.01, 16);
    const n = tall ? 16 : 11; for (let i = 0; i < n; i++) { const a = i * 2.4 + R() * 0.5, rr = (0.08 + R() * 0.2) * s, h = (tall ? 0.7 + R() * 0.9 : 0.55 + R() * 0.45) * s; sph(leafMats[i % 5], x + Math.cos(a) * rr, h, z + Math.sin(a) * rr, (0.13 + R() * 0.08) * s, (0.07 + R() * 0.05) * s, (0.2 + R() * 0.1) * s, 1); }
    if (tall) cyl(M.walnut, x, 0.7 * s, z, 0.015, 0.02, 0.6 * s, 6);
  }
  function lamp(px, pz) { const x = X(px), z = Z(pz); cyl(M.cabinet, x, 0.02, z, 0.14, 0.15, 0.04, 24); cyl(M.steel, x, 0.65, z, 0.01, 0.01, 1.25, 8); const g = new THREE.SphereGeometry(0.2, 28, 18); g.translate(x, 1.42, z); push(M.lampShade, g); }
  for (const [t, x0, y0, x1, y1, o] of E2.furniture) {
    if (ABO_HANDLED.has(t)) continue; // furnished with scanned products (abo.js)
    const r = rect(x0, y0, x1, y1); if (t !== 'umbrella' && (r.w < 0.05 || r.d < 0.05)) continue;
    const outside = E2.zones.deck.some(([a, b, c, d]) => (x0 + x1) / 2 > a && (x0 + x1) / 2 < c && (y0 + y1) / 2 > b && (y0 + y1) / 2 < d);
    switch (t) {
      case 'rug': rbox(M.rug, r.cx, 0.008, r.cz, r.w, 0.016, r.d, 0.006); break;
      case 'sofa': sofa(r, o); break;
      case 'osofa': sofa(r, o, M.fab, [M.fabSage, M.linen], true); break;
      case 'arm': outside ? armchair(r, o, M.fabGrey) : armchair(r, o, M.fab); break;
      case 'coffee': { const cr = { x0: r.x0 + 0.05, x1: r.x1 - 0.05, z0: r.z0 + 0.02, z1: r.z1 - 0.02 }; rbox(M.oakFurn, r.cx, 0.4, r.cz, r.w - 0.1, 0.05, r.d - 0.04, 0.012); legs(M.oakFurn, cr, 0.38, 0.05, 0.03); rbox(M.oakFurn, r.cx, 0.12, r.cz, r.w - 0.22, 0.025, r.d - 0.16, 0.008);
        cyl(M.pot, r.cx + 0.2, 0.47, r.cz, 0.06, 0.05, 0.1, 16); for (let i = 0; i < 6; i++) { const a = i * 1.05; sph(leafMats[i % 5], r.cx + 0.2 + Math.cos(a) * 0.05, 0.56, r.cz + Math.sin(a) * 0.05, 0.06, 0.03, 0.09, 1); }
        rbox(M.book, r.cx - 0.3, 0.44, r.cz, 0.3, 0.035, 0.22, 0.004); rbox(M.linen, r.cx - 0.28, 0.47, r.cz, 0.26, 0.025, 0.19, 0.004); break; }
      case 'otable': rbox(M.teak, r.cx, 0.38, r.cz, r.w, 0.04, r.d, 0.01); legs(M.teak, r, 0.36, 0.05, 0.02); break;
      case 'rtable': cyl(M.oakFurn, r.cx, 0.5, r.cz, r.w / 2, r.w / 2, 0.03, 36); cyl(M.oakFurn, r.cx, 0.25, r.cz, 0.03, 0.12, 0.48, 14); break;
      case 'tv': rbox(M.walnut, r.cx, 0.3, r.cz, r.w, 0.42, r.d, 0.012); legs(M.walnut, r, 0.1, 0.06, 0.018); box(M.groove, r.cx - 0.004, 0.12, r.z0 - 0.002, r.cx + 0.004, 0.5, r.z0); box(M.screen, r.cx - 0.55, 0.95, r.z1 - 0.03, r.cx + 0.55, 1.6, r.z1 - 0.005); break;
      case 'dining': dining(r, o, outside); break;
      case 'island': box(M.cabinetDark, r.x0 + 0.03, 0, r.z0 + 0.03, r.x1 - 0.03, 0.88, r.z1 - 0.03); box(M.onyx, r.x0 - 0.04, 0.88, r.z0 - 0.04, r.x1 + 0.04, 0.92, r.z1 + 0.04); box(M.onyx, r.x0 - 0.04, 0, r.z0 - 0.04, r.x0, 0.88, r.z1 + 0.04); box(M.onyx, r.x0 - 0.04, 0, r.z1, r.x1 + 0.04, 0.88, r.z1 + 0.04); box(M.black, r.cx - 0.27, 0.92, r.z0 + 0.12, r.cx + 0.27, 0.925, r.z0 + 0.66); for (const [a, b] of [[-.13, .26], [.13, .26], [-.13, .52], [.13, .52]]) torus(M.steel, r.cx + a, 0.93, r.z0 + b, 0.07, 0.01);
        for (let i = 0; i < 4; i++) { const z = r.z0 + 1.0 + i * (r.d - 1.3) / 3; cyl(M.oakFurn, r.x0 - 0.24, 0.66, z, 0.17, 0.17, 0.04, 24); for (const [a, b] of [[-.11, -.11], [.11, -.11], [-.11, .11], [.11, .11]]) cyl(M.oakFurn, r.x0 - 0.24 + a, 0.32, z + b, 0.013, 0.016, 0.64, 8); }
        break;
      case 'counter': box(M.cabinetDark, r.x0, 0.08, r.z0, r.x1, 0.88, r.z1); box(M.black, r.x0 + 0.04, 0, r.z0, r.x1, 0.08, r.z1); box(M.onyx, r.x0 - 0.01, 0.88, r.z0 - 0.01, r.x1 + 0.01, 0.92, r.z1 + 0.01); if (o === 'r') box(M.onyx, r.x1 - 0.02, 0.92, r.z0, r.x1, 1.5, r.z1); if (o === 'r') { box(M.cabinet, r.x0 + 0.28, 1.5, r.z0, r.x1, 2.25, r.z1); box(M.steel, r.cx - 0.25, 0.92, r.cz - 0.35, r.cx + 0.05, 0.925, r.cz + 0.05); cyl(M.steel, r.cx + 0.1, 1.05, r.cz - 0.15, 0.012, 0.012, 0.26, 8); } else box(M.cabinet, r.x0, 0, r.z0, r.x0 + 0.95, 2.25, r.z1); break;
      case 'fridge': box(M.cabinet, r.x0, 0, r.z0, r.x1, 2.25, r.z1); break;
      case 'tub': rbox(M.ceramic, r.cx, 0.28, r.cz, r.w, 0.56, r.d, 0.12); rbox(M.tile, r.cx, 0.55, r.cz, r.w - 0.14, 0.03, r.d - 0.14, 0.05); cyl(M.steel, r.x1 - 0.12, 0.65, r.cz, 0.012, 0.012, 0.2, 8); break;
      case 'toilet': { const [hx, hz] = DIR[o]; sph(M.ceramic, r.cx - hx * 0.05, 0.25, r.cz - hz * 0.05, 0.19, 0.2, 0.25, 2); rbox(M.ceramic, r.cx + hx * 0.2, 0.42, r.cz + hz * 0.2, hx ? 0.14 : 0.38, 0.36, hz ? 0.14 : 0.38, 0.04); break; }
      case 'vanity': rbox(M.walnut, r.cx, 0.65, r.cz, r.w, 0.4, r.d, 0.015); box(M.marble, r.x0, 0.85, r.z0, r.x1, 0.88, r.z1); for (const t2 of [0.3, 0.7]) { cyl(M.ceramic, r.x0 + r.w * t2, 0.93, r.cz, 0.2, 0.15, 0.1, 28); cyl(M.steel, r.x0 + r.w * t2, 1.0, r.z1 - 0.05, 0.012, 0.012, 0.25, 8); } box(M.mirror, r.x0 + 0.15, 1.15, r.z1 - 0.015, r.x1 - 0.15, 1.95, r.z1); break;
      case 'sink': rbox(M.walnut, r.cx, 0.65, r.cz, r.w, 0.4, r.d, 0.015); cyl(M.ceramic, r.cx, 0.9, r.cz, Math.min(r.w, r.d) * 0.36, Math.min(r.w, r.d) * 0.28, 0.1, 28); break;
      case 'shower': if (o === 'l') { box(M.glass, r.x0 - 0.01, 0, r.z0, r.x0 + 0.01, 2.0, r.z1); box(M.alu, r.x0 - 0.015, 1.98, r.z0, r.x0 + 0.015, 2.0, r.z1); } else { box(M.glass, r.x0, 0, r.z0 - 0.01, r.x1, 2.0, r.z0 + 0.01); box(M.alu, r.x0, 1.98, r.z0 - 0.015, r.x1, 2.0, r.z0 + 0.015); } box(M.tileDark, r.x0, 0.0, r.z0, r.x1, 0.02, r.z1); cyl(M.alu, r.cx, 2.0, r.cz + 0.15, 0.13, 0.13, 0.015, 24); cyl(M.alu, r.cx, 2.05, r.z1 - 0.05, 0.01, 0.01, 0.2, 6); break;
      case 'washer': rbox(M.ceramic, r.cx, 0.43, r.cz, r.w - 0.02, 0.85, r.d, 0.02); cyl(M.groove, r.cx, 0.45, r.z1 + 0.002, 0.15, 0.15, 0.012, 28); break;
      case 'bed1': bed(r, o, false); break;
      case 'bed2': bed(r, o, true); break;
      case 'night': night(r); break;
      case 'ward': ward(r); break;
      case 'desk': desk(r, o); break;
      case 'lounger': rbox(M.teak, r.cx, 0.18, r.cz, r.w, 0.1, r.d, 0.02); if (o === 'v') { rbox(M.linen, r.cx, 0.28, r.cz + 0.06, r.w - 0.06, 0.08, r.d - 0.25, 0.03); rbox(M.linen, r.cx, 0.42, r.z0 + 0.27, r.w - 0.08, 0.08, 0.5, 0.03, 0); } else { rbox(M.linen, r.cx + 0.06, 0.28, r.cz, r.w - 0.25, 0.08, r.d - 0.06, 0.03); rbox(M.linen, r.x0 + 0.27, 0.42, r.cz, 0.5, 0.08, r.d - 0.08, 0.03, 0); } legs(M.teak, r, 0.14, 0.06, 0.02); break;
      case 'umbrella': { const cx = X(x0), cz = Z(y0); cyl(M.alu, cx, 1.2, cz, 0.022, 0.022, 2.4, 10); const g = new THREE.ConeGeometry(1.0, 0.36, 8, 1, true); g.translate(cx, 2.32, cz); push(M.canvas, g); cyl(M.potDark, cx, 0.04, cz, 0.28, 0.3, 0.08, 20); break; }
      case 'pouf': rbox(M.pouf, r.cx, 0.2, r.cz, Math.min(r.w, r.d), 0.4, Math.min(r.w, r.d), 0.18, 0, 5); break;
      case 'rcoffee': { const rr = Math.min(r.w, r.d) / 2; cyl(M.glassSmoke, r.cx, 0.4, r.cz, rr, rr, 0.02, 48); box(M.glassSmoke, r.cx - rr * 0.6, 0, r.cz - 0.01, r.cx + rr * 0.6, 0.39, r.cz + 0.01); box(M.glassSmoke, r.cx - 0.01, 0, r.cz - rr * 0.6, r.cx + 0.01, 0.39, r.cz + rr * 0.6); rbox(M.book, r.cx - 0.12, 0.43, r.cz + 0.06, 0.28, 0.04, 0.2, 0.004); rbox(M.black, r.cx + 0.14, 0.425, r.cz - 0.08, 0.2, 0.03, 0.16, 0.004); break; }
      case 'tvwall': { const [fx] = DIR[o]; const wall = fx > 0 ? r.x0 : r.x1, sgn = fx > 0 ? 1 : -1; box(M.veneer, wall, 0.32, r.z0 - 0.35, wall + sgn * 0.05, 2.15, r.z1 + 0.35); box(M.screen, wall + sgn * 0.05, 1.05, r.cz - 0.82, wall + sgn * 0.09, 1.98, r.cz + 0.82); break; }
      case 'oven': box(M.cabinet, r.x0, 0, r.z0, r.x1, 2.25, r.z1); box(M.black, r.x0 - 0.005, 0.95, r.z0 + 0.04, r.x0, 1.55, r.z1 - 0.04); break;
      case 'boiler': cyl(M.ceramic, r.cx, 1.4, r.cz, r.w / 2, r.w / 2, 1.0, 28); break;
      case 'acu': box(M.cabinet, r.x0, 0.1, r.z0, r.x1, 0.85, r.z1); cyl(M.groove, r.x0 - 0.002, 0.48, r.cz, 0.24, 0.24, 0.01, 28); break;
      case 'shelf': box(M.cabinet, r.x0, 0, r.z0, r.x1, 1.6, r.z1); break;
    }
  }
  E2.plants.forEach(([x, y, sc = 1, tall = 0]) => plant(x, y, sc, !!tall));
  (E2.lamps || []).forEach(([x, y]) => lamp(x, y));
  (E2.planters || []).forEach(([x0, x1, y]) => { for (let x = x0; x < x1; x += 95) { box(M.potDark, X(x), 0, Z(y - 5), X(Math.min(x1, x + 70)), 0.45, Z(y + 6)); for (let k = 0; k < 4; k++) sph(leafMats[(x / 95 + k) % 5 | 0], X(x + 10 + k * 16), 0.55, Z(y), 0.16, 0.13, 0.12, 1); } });
  bake();


  // ---------------------------------------------------------------- selected-room highlight (orange tint + dashed outline, projected in plan space)
  const HL_ROOMS = E2.rects;
  const HB = { x0: FOOT.x0 - 20, y0: FOOT.y0 - 20, x1: FOOT.x1 + 20, y1: FOOT.y1 + 20 }, HK = (mobile ? 1.1 : 1.6) * 0.02085 / S;
  const hlCv = document.createElement('canvas'); hlCv.width = Math.round((HB.x1 - HB.x0) * HK); hlCv.height = Math.round((HB.y1 - HB.y0) * HK);
  const hlCtx = hlCv.getContext('2d'); const hlTex = new THREE.CanvasTexture(hlCv); hlTex.flipY = false; hlTex.colorSpace = THREE.NoColorSpace; hlTex.generateMipmaps = false; hlTex.minFilter = THREE.LinearFilter;
  const HU = { hlMap: { value: hlTex }, hlBox: { value: new THREE.Vector4(X(HB.x0), Z(HB.y0), (HB.x1 - HB.x0) * S, (HB.y1 - HB.y0) * S) }, hlAmt: { value: 0 } };
  function drawHL(id) {
    const g = hlCtx, rs = [].concat(id || []).flatMap(k => HL_ROOMS[k] || []); g.clearRect(0, 0, hlCv.width, hlCv.height); if (!rs.length) { hlTex.needsUpdate = true; return; }
    const P = (x, y) => [(x - HB.x0) * HK, (y - HB.y0) * HK];
    g.globalCompositeOperation = 'lighter'; g.fillStyle = '#ff0000';
    for (const [x0, y0, x1, y1] of rs) { const [a, b] = P(x0, y0), [c, d] = P(x1, y1); g.fillRect(a, b, c - a, d - b); }
    const inU = (x, y) => rs.some(([x0, y0, x1, y1]) => x > x0 && x < x1 && y > y0 && y < y1);
    const INS = 6 * KS; g.strokeStyle = '#00ff00'; g.lineWidth = 3.8 * KS * HK; g.lineCap = 'round'; g.setLineDash([9 * KS * HK, 7 * KS * HK]);
    for (const [x0, y0, x1, y1] of rs) for (const [ax, ay, bx, by, nx, ny] of [[x0, y0, x1, y0, 0, -1], [x1, y0, x1, y1, 1, 0], [x0, y1, x1, y1, 0, 1], [x0, y0, x0, y1, -1, 0]]) {
      const L = Math.hypot(bx - ax, by - ay), n = Math.ceil(L); let run = null; const segs = [];
      for (let i = 0; i <= n; i++) { const t = i / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t; const ok = inU(x - nx * 2, y - ny * 2) && !inU(x + nx * 2, y + ny * 2); if (ok) { if (!run) run = [x, y]; run[2] = x; run[3] = y; } else if (run) { segs.push(run); run = null; } }
      if (run) segs.push(run);
      for (const [sx, sy, ex, ey] of segs) { const [a, b] = P(sx - nx * INS, sy - ny * INS), [c, d] = P(ex - nx * INS, ey - ny * INS); g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
    }
    g.setLineDash([]); g.globalCompositeOperation = 'source-over'; hlTex.needsUpdate = true;
  }
  const patched = new Set();
  function patch(m) {
    if (patched.has(m) || m.transparent) return; patched.add(m);
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, HU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHlW;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHlW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vHlW; uniform sampler2D hlMap; uniform vec4 hlBox; uniform float hlAmt;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          if (hlAmt > 0.001) { vec2 hu = (vHlW.xz - hlBox.xy) / hlBox.zw; vec4 hs = texture2D(hlMap, clamp(hu, 0.0, 1.0));
            float f = hs.r * hlAmt; diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.74, 0.9, 0.76) + vec3(0.02, 0.06, 0.03), f * 0.9);
            float o = hs.g * hlAmt * (1.0 - smoothstep(0.03, 0.09, vHlW.y)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.4, 0.3), o * 0.95); }`);
    };
  }
  root.traverse(o => o.isMesh && patch(o.material));
  let hlId = null, hlGoal = 0;
  function highlight(id) { if (Array.isArray(id)) id = id.length ? id.join(',') : null; if (id === hlId) { hlGoal = id ? 1 : 0; kick(); return; } hlId = id; if (id) { drawHL(id.split(',')); HU.hlAmt.value = 0; hlGoal = 1; } else hlGoal = 0; kick(); }

  // ---------------------------------------------------------------- ceiling, only shown at eye level (walk mode)
  const CEIL_H = 3.0, EYE = 1.42; // camera height of an architectural render (keeps verticals straight, rooms read their true size)
  const ceil = (() => { const gs = [...E2.zones.oak, ...E2.zones.tile, ...E2.zones.wet].map(([x0, y0, x1, y1]) => { const g = new THREE.BoxGeometry((x1 - x0 + 14 * KS) * S, 0.06, (y1 - y0 + 14 * KS) * S); g.translate(X((x0 + x1) / 2), CEIL_H + 0.03, Z((y0 + y1) / 2)); return g.toNonIndexed(); });
    const m = new THREE.Mesh(mergeGeometries(gs, false), std({ color: 0xf7f6f3, roughness: 1, emissive: 0xfffcf6, emissiveIntensity: 0.42 })); m.visible = false; m.castShadow = false; m.receiveShadow = false; scene.add(m); return m; })();

  // ---------------------------------------------------------------- lights
  const sun = new THREE.DirectionalLight(0xfff6ea, 2.3); sun.position.set(-6, 16, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(Q === 2 ? 4096 : 2048, Q === 2 ? 4096 : 2048); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 2, far: 45 }); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03; sun.shadow.radius = Q === 2 ? 9 : 6; sun.shadow.blurSamples = 16; scene.add(sun);
  const fill = new THREE.HemisphereLight(0xffffff, 0xe9e2d6, 0.7); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xf2f5ff, 0.35); rim.position.set(8, 10, -6); scene.add(rim);
  // soft contact shadow under the model
  const blob = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 30, 128, 128, 128); gr.addColorStop(0, 'rgba(90,80,66,.2)'); gr.addColorStop(0.6, 'rgba(90,80,66,.08)'); gr.addColorStop(1, 'rgba(90,80,66,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(44, 38), new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.position.set(0.6, -0.42, 0.8); scene.add(ground);
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ color: 0x5a4e40, opacity: 0.16 })); catcher.rotation.x = -Math.PI / 2; catcher.position.y = -0.4; catcher.receiveShadow = true; scene.add(catcher);

  // ---------------------------------------------------------------- post: MSAA + ambient occlusion
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 512, 512); gtao.blendIntensity = 1.0;
  gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.6, thickness: 1.4, scale: 1.0, samples: Q === 2 ? 16 : 12 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 3, samples: 16 });
  // keep see-through things (glass, ground shadow) out of the AO depth pass, otherwise they get speckled
  const noAO = [ground, catcher]; root.traverse(o => o.isMesh && o.material.transparent && noAO.push(o));
  { const ov = gtao._overrideVisibility.bind(gtao); gtao._overrideVisibility = () => { ov(); for (const o of noAO) if (o.visible) { o.visible = false; gtao._visibilityCache.push(o); } }; }
  composer.addPass(gtao); composer.addPass(new OutputPass());

  // ---------------------------------------------------------------- camera + controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 4; controls.maxDistance = SPAN * 3.2; controls.maxPolarAngle = 1.2; controls.minPolarAngle = 0.15; controls.screenSpacePanning = true; controls.rotateSpeed = 0.6; controls.zoomSpeed = 0.8;
  const HOME = { dir: V(0.3, 1.45, 1).normalize(), t: V(X((FOOT.x0 + FOOT.x1) / 2), 0, Z((FOOT.y0 + FOOT.y1) / 2)), d: SPAN * 3.35 };
  const homePose = () => { const k = camera.aspect < 1 ? Math.pow(1.25 / camera.aspect, 0.74) : Math.max(1, 1.7 / camera.aspect); return { p: HOME.t.clone().addScaledVector(HOME.dir, HOME.d * k), t: HOME.t.clone() }; };
  let drift = 0; let fly = null; const flyTo = (p, t, dur = 1.5) => { fly = { t: 0, dur, p0: camera.position.clone(), t0: controls.target.clone(), p1: p, t1: t }; kick(); };
  controls.addEventListener('start', () => { fly = null; drift = 0; kick(); }); controls.addEventListener('change', () => kick());
  // Resolution: render at the screen's real density (capped), drop a step while moving if frames get slow,
  // and always settle back to full sharpness once the view is still.
  const DPR = devicePixelRatio || 1; let prNow = 0, prTarget = 1, ftEma = 16, slowFor = 0;
  function applyPR(pr) { const w = container.clientWidth, h = container.clientHeight; prNow = pr; renderer.setPixelRatio(pr); renderer.setSize(w, h, false); composer.setPixelRatio(pr); composer.setSize(w, h); gtao.updatePdMaterial({ radius: 3 + 2.5 * pr }); }
  let onFit = null;
  function fit() { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; prTarget = Math.max(1, Math.min(DPR, 2, Math.sqrt((mobile ? 2.8e6 : 4.4e6) / (w * h)))); camera.aspect = w / h; if (w > 900) camera.setViewOffset(w, h, Math.round(w * 0.085), Math.round(h * 0.06), w, h); else camera.setViewOffset(w, h, 0, Math.round(h * 0.07), w, h); controls.maxDistance = SPAN * (w / h < 1 ? 7.8 : 3.2); onFit && onFit(); camera.updateProjectionMatrix(); applyPR(prNow ? Math.min(prNow, prTarget) : prTarget); kick(); }
  new ResizeObserver(fit).observe(container); fit();
  { const hp = homePose(); camera.position.copy(hp.p); controls.target.copy(hp.t); }
  await Promise.race([Promise.all(pending), new Promise(r => setTimeout(r, 12000))]);

  // ---------------------------------------------------------------- intro animation: walls grow, furniture settles
  let intro = 1, wallH = 1, wallT = 1; layers.walls.scale.y = 0.001; layers.furn.position.y = 0.6;
  let running = false, last = performance.now(), shadowsDone = false, clock = 0;
  const tmp = V();
  // ---------------------------------------------------------------- walk mode (first-person, eye level)
  const P = { free: false, inF: 0, inS: 0, inT: 0, goal: null, vel: V(), over: 0, overK: 0, overC: V(), overH: 5.4, overD: 2.6, on: false, pos: V(), yaw: 0, pitch: -0.03, camYaw: 0, camPitch: -0.03, walk: null, look: null, sweep: 0, stay: 0, uYaw: 0, uPitch: 0, fovGoal: 26, bob: 0, done: null };
  const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  const P3 = (p, y = EYE) => V(X(p[0]), y, Z(p[1]));
  const sky = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#b9d3e6'); gr.addColorStop(0.42, '#e3eef4'); gr.addColorStop(0.5, '#f6f3ec'); gr.addColorStop(0.52, '#dcd6cb'); gr.addColorStop(1, '#cfc8bb'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();
  onFit = () => { if (P.on) P.fovGoal = eyeFov(); };
  function eyeFov() { const a = camera.aspect || 1.6; return a < 1 ? 88 : Math.max(60, 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(52)) / a) * 180 / Math.PI); } // wide, close to a real-estate wide-angle lens
  // ---- free roaming: walls, glass, railings and the big furniture are solid; the balcony slider is open
  const BLK = (() => { const out = [], R0 = 0.2; const add = (x0, z0, x1, z1) => out.push({ x0: Math.min(x0, x1) - R0, z0: Math.min(z0, z1) - R0, x1: Math.max(x0, x1) + R0, z1: Math.max(z0, z1) + R0 });
    E2.walls.forEach(([x0, y0, x1, y1]) => { let a = X(x0), b = X(x1), c = Z(y0), d = Z(y1); if (b - a < 0.13) { const m = (a + b) / 2; a = m - 0.065; b = m + 0.065; } if (d - c < 0.13) { const m = (c + d) / 2; c = m - 0.065; d = m + 0.065; } add(a, c, b, d); });
    E2.glass.forEach(([x0, y0, x1, y1], i) => { if (i === (E2.openGlass ?? 0)) return; add(X(x0), Z(y0), X(x1), Z(y1)); });
    [...E2.rails, ...(E2.louvers || [])].forEach(([x0, y0, x1, y1]) => add(X(x0), Z(y0), X(x1), Z(y1)));
    const SOLID = new Set(['sofa', 'island', 'counter', 'oven', 'fridge', 'dining', 'bed1', 'bed2', 'ward', 'tub', 'desk', 'tvwall', 'washer', 'boiler', 'acu', 'night', 'toilet', 'sink', 'pouf', 'lounger']);
    E2.furniture.forEach(([t, x0, y0, x1, y1]) => { if (SOLID.has(t) && x1) { const k = t === 'desk' || t === 'dining' ? 0.12 : 0.04; add(X(x0) + k, Z(y0) + k, X(x1) - k, Z(y1) - k); } });
    return out; })();
  const inBox = (x, z) => BLK.some(b => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1);
  const hitBox = (x, z, ox, oz) => BLK.some(b => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && !(ox > b.x0 && ox < b.x1 && oz > b.z0 && oz < b.z1));
  const inFoot = (x, z) => [...E2.zones.tile, ...E2.zones.oak, ...E2.zones.wet, ...E2.zones.deck].some(([a, b, c, d]) => x > X(a) && x < X(c) && z > Z(b) && z < Z(d));
  function freeStep(dt) { // returns true while moving
    let dx = 0, dz = 0; const SPEED = 1.45;
    if (P.goal) { const gx = P.goal.x - P.pos.x, gz = P.goal.z - P.pos.z, d = Math.hypot(gx, gz); if (d < 0.06) P.goal = null; else { const v = Math.min(SPEED, d * 2.5 + 0.3); dx = gx / d * v; dz = gz / d * v; P.yaw += angDiff(P.yaw, Math.atan2(gx, gz)) * (1 - Math.exp(-3 * dt)); P.uYaw *= Math.exp(-3 * dt); } }
    else if (P.inF || P.inS) { const fy = P.camYaw, fx = Math.sin(fy), fz = Math.cos(fy); dx = (fx * P.inF - fz * P.inS) * SPEED; dz = (fz * P.inF + fx * P.inS) * SPEED; }
    if (P.inT) P.yaw += P.inT * 1.7 * dt;
    P.vel.x += (dx - P.vel.x) * (1 - Math.exp(-9 * dt)); P.vel.z += (dz - P.vel.z) * (1 - Math.exp(-9 * dt));
    const sp = Math.hypot(P.vel.x, P.vel.z); if (sp < 0.01 && !P.inT) { P.vel.set(0, 0, 0); return false; }
    const ox = P.pos.x, oz = P.pos.z; let nx = ox + P.vel.x * dt, nz = oz + P.vel.z * dt;
    if (hitBox(nx, oz, ox, oz) || !inFoot(nx, oz)) { nx = ox; P.vel.x = 0; }
    if (hitBox(nx, nz, nx, oz) || !inFoot(nx, nz)) { nz = oz; P.vel.z = 0; }
    if (P.goal && nx === ox && nz === oz && sp > 0.05) P.goal = null; // blocked: stop instead of pushing
    P.pos.x = nx; P.pos.z = nz; P.bob += dt * 7.5 * Math.min(1, sp / SPEED); P.stay = 0;
    return true;
  }
  function povEnter(start, look) {
    scene.background = sky; P.on = true; fly = null; drift = 0; controls.enabled = false; ceil.visible = true; wallT = wallH = CEIL_H / WALL_H; P.fovGoal = eyeFov(); camera.near = 0.05;
    if (start) { P.pos.copy(P3(start)); P.look = look ? P3(look, 1.15) : null; P.yaw = P.camYaw = P.look ? yawTo(P.pos, P.look) : 0; P.camPitch = P.pitch; P.walk = null; P.stay = 0; P.uYaw = P.uPitch = 0; }
    hlGoal = 0; kick();
  }
  function povExit(dur = 2.6) {
    if (!P.on) return; P.on = false; P.walk = null; P.over = P.overK = 0; scene.background = null; controls.enabled = true; ceil.visible = false; wallT = wallH = 1; P.fovGoal = 26; camera.near = 0.3;
    const d = V(Math.sin(P.camYaw), 0, Math.cos(P.camYaw)); controls.target.copy(camera.position).addScaledVector(d, 4).setY(0.4);
    const hp = homePose(); flyTo(hp.p, hp.t, dur);
  }
  // walk along plan-pixel waypoints to `to`, then face `look`; resolves on arrival
  function povGo(to, look, path = [], o = {}) {
    if (!P.on) povEnter();
    const pts = [P.pos.clone(), ...path.map(p => P3(p)), P3(to)]; const lens = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const l = pts[i].distanceTo(pts[i - 1]); lens.push(l); total += l; }
    P.look = look ? P3(look, 1.15) : null; P.sweep = mobile ? 0 : (o.sweep ?? 0.3); P.stay = 0;
    return new Promise(res => {
      if (o.jump || total < 0.05) { P.pos.copy(pts[pts.length - 1]); P.walk = null; if (P.look) P.yaw = P.camYaw = yawTo(P.pos, P.look); P.uYaw = P.uPitch = 0; P.camPitch = P.pitch; kick(); res(); return; }
      P.walk = { pts, lens, total, t: 0, dur: Math.max(1.4, total / (o.speed || 1.35)), res }; kick();
    });
  }
  function along(w, s) { let i = 0; while (i < w.lens.length - 1 && s > w.lens[i]) { s -= w.lens[i]; i++; } return w.pts[i].clone().lerp(w.pts[i + 1], clamp(s / (w.lens[i] || 1))); }
  function povUpdate(dt) {
    const fovMoving = Math.abs(P.fovGoal - camera.fov) > 0.05; camera.fov += (P.fovGoal - camera.fov) * (1 - Math.exp(-4 * dt)); camera.updateProjectionMatrix();
    if (!P.on) return fovMoving; const y0 = P.camYaw, p0 = P.camPitch; let walking = !!P.walk;
    let want = P.camYaw;
    if (P.walk) {
      const w = P.walk; w.t += dt; const k = ease(clamp(w.t / w.dur)), s = k * w.total;
      P.pos.copy(along(w, s)); P.bob += dt * 7.5 * (1 - Math.abs(2 * k - 1));
      const ahead = along(w, Math.min(w.total, s + 1.3)); const head = ahead.distanceTo(P.pos) > 0.05 ? yawTo(P.pos, ahead) : P.camYaw;
      const fin = P.look ? yawTo(w.pts[w.pts.length - 1], P.look) : head; const m = clamp((k - 0.62) / 0.38);
      want = head + angDiff(head, fin) * ease(m); P.yaw = fin; P.uYaw *= Math.exp(-3 * dt); P.uPitch *= Math.exp(-3 * dt);
      if (w.t >= w.dur) { P.walk = null; P.stay = 0; w.res(); }
    } else if (P.free) { if (freeStep(dt)) walking = true; want = P.yaw; }
    else { P.stay += dt; const base = P.look ? yawTo(P.pos, P.look) : P.yaw; want = base + Math.sin(P.stay * 0.32) * P.sweep * (realOn ? 0 : 1) * clamp(P.stay / 2); }
    P.camYaw += angDiff(P.camYaw, want + P.uYaw) * (1 - Math.exp(-5 * dt));
    P.camPitch += (P.pitch + P.uPitch - P.camPitch) * (1 - Math.exp(-5 * dt));
    const eye = P.pos.clone(); eye.y += Math.sin(P.bob) * 0.012;
    const cp = Math.cos(P.camPitch); tmp.set(Math.sin(P.camYaw) * cp, Math.sin(P.camPitch), Math.cos(P.camYaw) * cp).add(eye);
    // bird's-eye of the current room: rise above the walls and look down into it (drag orbits around it)
    const k0 = P.overK; P.overK += (P.over - P.overK) * (1 - Math.exp(-3.2 * dt)); if (Math.abs(P.over - P.overK) < 1e-3) P.overK = P.over;
    if (P.overK > 1e-3) { const e = ease(P.overK); const op = P.overC.clone().add(V(-Math.sin(P.camYaw) * P.overD, 0, -Math.cos(P.camYaw) * P.overD)).setY(P.overH); eye.lerp(op, e); tmp.lerp(P.overC, e); }
    ceil.visible = P.overK < 0.03; { const full = CEIL_H / WALL_H; wallT = wallH = full + (0.72 - full) * ease(P.overK); }
    camera.position.copy(eye); camera.lookAt(tmp);
    return fovMoving || walking || Math.abs(P.camYaw - y0) > 2e-5 || Math.abs(P.camPitch - p0) > 2e-5 || Math.abs(P.overK - k0) > 1e-4;
  }
  // drag to look around while walking
  { let drag = null; const el = renderer.domElement;
    el.addEventListener('pointerdown', e => { if (P.on) { drag = { x: e.clientX, y: e.clientY, yaw: P.uYaw, pitch: P.uPitch, moved: 0 }; el.setPointerCapture(e.pointerId); } });
    el.addEventListener('pointermove', e => { if (!drag || !P.on) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy)); P.uYaw = drag.yaw + dx * 0.0042; P.uPitch = clamp(drag.pitch + dy * 0.003, -0.6, 0.45); P.stay = Math.min(P.stay, 0.5); kick(); });
    el.addEventListener('pointerup', e => { if (drag && drag.moved < 7 && P.on && P.free && !P.walk && P.overK < 0.05) { const r = el.getBoundingClientRect(); const ndc = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, camera); const d = rc.ray.direction; if (d.y < -0.02) { const t = -camera.position.y / d.y; const g = camera.position.clone().addScaledVector(d, t); const L = Math.hypot(g.x - P.pos.x, g.z - P.pos.z); if (L > 9) g.set(P.pos.x + (g.x - P.pos.x) / L * 9, 0, P.pos.z + (g.z - P.pos.z) / L * 9); P.goal = V(g.x, 0, g.z); P.uYaw = 0; P.yaw = P.camYaw; kick(); opts.onGoal && opts.onGoal(g); } } drag = null; });
    el.addEventListener('wheel', e => { if (P.on) e.preventDefault(); }, { passive: false });
  }
  function loop() {
    if (!running) return; requestAnimationFrame(loop);
    const now = performance.now(), raw = now - last, dt = Math.min(0.05, raw / 1000); last = now; clock += dt;
    let moving = false;
    if (intro < 2.6) { intro += dt; const a = easeOut(clamp((intro - 1.0) / 1.2)), b = easeOut(clamp((intro - 1.4) / 1.0)); layers.walls.scale.y = Math.max(0.001, a * wallH); layers.furn.position.y = (1 - b) * 0.6; moving = true; shadowsDone = false; }
    else if (Math.abs(layers.walls.scale.y - wallT) > 1e-3) { layers.walls.scale.y += (wallT - layers.walls.scale.y) * (1 - Math.exp(-6 * dt)); moving = true; shadowsDone = false; }
    if (Math.abs(HU.hlAmt.value - hlGoal) > 0.002) { HU.hlAmt.value += (hlGoal - HU.hlAmt.value) * (1 - Math.exp(-9 * dt)); if (Math.abs(HU.hlAmt.value - hlGoal) <= 0.002) HU.hlAmt.value = hlGoal; moving = true; }
    if (P.on || Math.abs(camera.fov - P.fovGoal) > 0.05) { if (povUpdate(dt)) moving = true; }
    if (drift && !fly && intro >= 2.6 && !P.on) { const o = camera.position.clone().sub(controls.target); o.applyAxisAngle(V(0, 1, 0), drift * dt); camera.position.copy(controls.target).add(o); moving = true; }
    if (fly) { fly.t += dt; const k = ease(clamp(fly.t / fly.dur)); camera.position.lerpVectors(fly.p0, fly.p1, k); controls.target.lerpVectors(fly.t0, fly.t1, k); if (fly.t >= fly.dur) fly = null; moving = true; }
    if (!P.on) controls.update();
    if (!moving) { idle += dt; if (idle > 0.35 && prNow < prTarget) { applyPR(prTarget); idle = 0.36; } else if (idle > 0.5 && shadowsDone && !(RL && realOn && RL.busy)) { opts.onFrame && opts.onFrame(); return; } }
    else { idle = 0; if (raw < 200) { ftEma += (raw - ftEma) * 0.1; slowFor = ftEma > 36 ? slowFor + dt : 0; if (slowFor > 0.6 && prNow > 1) { applyPR(Math.max(1, prNow - 0.35)); slowFor = 0; ftEma = 24; } } }
    if (RL && realOn) RL.frame(P);
    if (!shadowsDone) { renderer.shadowMap.needsUpdate = true; if (intro >= 2.6) shadowsDone = true; }
    if (RL && realOn && RL.render(moving || idle < 0.05, dt)) { opts.onFrame && opts.onFrame(); return; }
    composer.render(dt);
    opts.onFrame && opts.onFrame();
  }
  // ---------------------------------------------------------------- realistic layer (loaded on demand)
  let RL = null, realOn = false, realLoading = null;
  const ctx = { THREE, scene, root, layers, M, E2, X, Z, S, CX, CY, WALL_H, CEIL_H, EYE, renderer, camera, composer, gtao, sun, fill, rim, ceil, patch, pmrem, mobile, Q, BASE, P, mergeGeometries, RoundedBoxGeometry, DPR, get hl() { return HU.hlAmt.value; },
    invalidate() { shadowsDone = false; kick(); } };
  ctx.ABO = ABO_HANDLED;
  import('./abo.js').then(m => m.furnish(ctx)).then(() => { shadowsDone = false; kick(); }, e => console.warn('abo', e));
  async function setRealistic(on, onProgress) {
    if (on && !RL) { realLoading ||= import('./real.js').then(m => m.buildReal(ctx, onProgress)); RL = await realLoading; }
    realOn = !!on; if (RL) RL.apply(realOn); shadowsDone = false; kick(); return realOn;
  }
  const rooms = E2.rooms.map(r => ({ ...r, p: V(X(r.c[0]), 1.0, Z(r.c[1])) }));
  return {
    rooms,
    start() { if (running) return; running = true; last = performance.now(); kick(); loop(); },
    stop() { running = false; },
    replayIntro() { intro = 0; layers.walls.scale.y = 0.001; layers.furn.position.y = 0.6; const hp = homePose(); const d = hp.p.clone().sub(hp.t); camera.position.copy(hp.t).addScaledVector(d, 1.25); controls.target.copy(hp.t); flyTo(hp.p, hp.t, 2.4); },
    home(dur = 1.4) { drift = 0; const hp = homePose(); flyTo(hp.p, hp.t, dur); },
    // guided tour: look at a plan point from a given azimuth/pitch, then drift slowly around it
    tourTo(o) {
      const k = camera.aspect < 1 ? Math.pow(1.25 / camera.aspect, 0.62) : 1; drift = o.drift ?? 0.022;
      if (!o.at) { const hp = homePose(); flyTo(hp.p, hp.t, o.dur || 2.2); return; }
      const t = V(X(o.at[0]), 0.4, Z(o.at[1])), a = o.az || 0, up = o.up || 1.75;
      const dir = V(Math.sin(a), up, Math.cos(a)).normalize(); flyTo(t.clone().addScaledVector(dir, o.d * k), t, o.dur || 2.2);
    },
    setDrift(v) { drift = v; kick(); },
    focus(id) { drift = 0; const r = rooms.find(x => x.id === id); if (!r) return; const t = V(r.p.x, 0.5, r.p.z); const big = r.id === 'living' || r.id.startsWith('bal') || r.big; const dir = V(0.15, 1.7, 1).normalize(); const k = camera.aspect < 1 ? 1.6 : 1; flyTo(t.clone().addScaledVector(dir, (big ? 27 : 20) * k * SPAN / 22), t, 1.5); },
    zoom(f) { const d = camera.position.clone().sub(controls.target); const L = clamp(d.length() * f, controls.minDistance, controls.maxDistance); flyTo(controls.target.clone().add(d.setLength(L)), controls.target.clone(), 0.5); },
    setWalls(h) { wallT = h; wallH = h; kick(); },
    project(p) { const front = tmp.copy(p).applyMatrix4(camera.matrixWorldInverse).z < -0.05; tmp.copy(p).project(camera); return { x: (tmp.x * .5 + .5) * container.clientWidth, y: (-tmp.y * .5 + .5) * container.clientHeight, vis: front && tmp.z < 1 }; },
    highlight, kick, renderer, camera, scene, controls, setRealistic, layers, ceil, get realistic() { return realOn; }, get RL() { return RL; },
    povEnter, povExit, povGo, get pov() { return P.on ? { x: P.pos.x / S + CX, y: P.pos.z / S + CY, yaw: P.camYaw, walking: !!P.walk, over: !!P.over } : null; },
    povOver(on, c, o = {}) { if (!P.on) return; P.over = on ? 1 : 0; if (c) P.overC.copy(P3(c, 0.3)); P.overH = o.h || 4.8; P.overD = o.d || 2.6; kick(); },
    povTurn(d) { if (P.on) { P.uYaw += d; kick(); } },
    povFree(on) { P.free = !!on; P.goal = null; P.inF = P.inS = P.inT = 0; P.vel.set(0, 0, 0); if (on) { P.walk = null; P.look = null; P.sweep = 0; P.yaw = P.camYaw; P.uYaw = 0; } kick(); },
    povMove(f = 0, s = 0, t = 0) { P.inF = f; P.inS = s; P.inT = t; if (f || s) P.goal = null; if (f || s || t) { P.yaw += P.uYaw; P.uYaw = 0; } kick(); },
    roomAt(px, py) { for (const [id, rs] of Object.entries(E2.rects)) if (rs.some(([a, b, c, d]) => px > a && px < c && py > b && py < d)) return id; return null; },
    floorPoint(px, py) { return V(X(px), 0.02, Z(py)); },
    snap() { if (P.walk) { const w = P.walk; P.pos.copy(w.pts[w.pts.length - 1]); P.walk = null; P.stay = 0; P.camYaw = P.look ? yawTo(P.pos, P.look) : P.camYaw; w.res(); } if (P.on) { camera.fov = P.fovGoal; P.overK = P.over; } intro = 2.6; layers.walls.scale.y = wallT; layers.furn.position.y = 0; if (fly) { camera.position.copy(fly.p1); controls.target.copy(fly.t1); fly = null; } controls.update(); shadowsDone = false; kick(); },
  };
}
