// Realistic layer for Hamigdal Bechorshot type C: real PBR materials, detailed furniture in the spirit of the project renders,
// light fixtures, curtains, plants and a 360° view of the coast behind the windows.
// Loaded only when the visitor switches it on; the default dollhouse stays untouched underneath.
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export async function buildReal(C, onProgress = () => { }) {
  const { THREE, X, Z, S, E2, WALL_H, CEIL_H, M, mobile } = C;
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const BASE = C.BASE + 'real/shared/', OWN = C.BASE + 'real/';
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- loading (with progress)
  let done = 0, total = 0; const tick = () => onProgress(Math.min(0.99, ++done / total));
  const tl = new THREE.TextureLoader();
  const T = {};
  const tex = (key, file, srgb, size = 1) => { total++; return tl.loadAsync(BASE + file).then(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(1 / size, 1 / size); T[key] = t; tick(); }); };
  const texO = (key, file, srgb, size = 1) => { total++; return tl.loadAsync(OWN + file).then(t => { t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(1 / size, 1 / size); T[key] = t; tick(); }); };
  const jobs = [
    texO('onyxC', 'tex/onyx_c.webp', true, 1.3), texO('rugwC', 'tex/rugw_c.webp', true, 1.5), texO('rugwN', 'tex/rugw_n.webp', false, 1.5),
    tex('floorC', 'tex/oak_c.jpg', true, 1.2), tex('floorN', 'tex/floor_n.jpg', false, 2.4), tex('floorR', 'tex/floor_r.jpg', false, 2.4),
    tex('deckC', 'tex/deck_c.jpg', true, 2.2), tex('deckN', 'tex/deck_n.jpg', false, 2.2), tex('deckR', 'tex/deck_r.jpg', false, 2.2),
    tex('plasterN', 'tex/plaster_n.jpg', false, 3), tex('linenN', 'tex/linen_n.jpg', false, 0.45),
    tex('marbleC', 'tex/marble_c.jpg', true, 1.6), tex('marbleN', 'tex/marble_n.jpg', false, 1.6),
    tex('boucleC', 'tex/boucle_c.jpg', true, 0.35), tex('boucleN', 'tex/boucle_n.jpg', false, 0.35),
    tex('rugC', 'tex/rug_c.jpg', true, 0.9), tex('rugN', 'tex/rug_n.jpg', false, 0.9), tex('rug2C', 'tex/rug2_c.jpg', true, 2.2), tex('rug2N', 'tex/rug2_n.jpg', false, 2.2),
    tex('oakC', 'tex/oak_c.jpg', true, 0.9), tex('oakN', 'tex/oak_n.jpg', false, 0.9),
    tex('fluteN', 'tex/flute_n.jpg', false, 1), tex('art1', 'tex/art1.jpg', true), tex('art2', 'tex/art2.jpg', true),
    tex('pano', mobile ? 'pano_4k.jpg' : 'pano_8k.jpg', true),
  ];
  total += 4;
  const hdr = new HDRLoader().setDataType(THREE.FloatType).loadAsync(BASE + 'sky_1k.hdr').then(t => { tick(); return t; });
  const gl = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const plants = Promise.all(['potted_plant_01', 'potted_plant_02', 'potted_plant_04'].map(n => gl.loadAsync(BASE + n + '.glb').then(g => { tick(); return g.scene; })));
  const OWN_HERO = new Set(['sofa', 'stool', 'wicker', 'chair']), YAW = { chair: Math.PI / 4 }; // generated from this project's renders (Higgsfield / Tripo)
  const HERO = ['sofa', 'arm', 'table', 'chair', 'stool', 'bed', 'coffee', 'wicker']; total += HERO.length;
  const heroes = Promise.all(HERO.map(n => gl.loadAsync((OWN_HERO.has(n) ? OWN : BASE) + 'm_' + n + '.glb').then(g => { tick(); return g.scene; }, () => { tick(); return null; })));
  const [, env, [plantTree, plantLeafy, plantSmall], heroList] = await Promise.all([Promise.all(jobs), hdr, plants, heroes]);
  // meshopt-packed models carry quantized (int16/int8) attributes; the path tracer merges raw arrays, so expand them to float
  const dequant = o => o && o.traverse(m => { if (!m.isMesh) return; const g = m.geometry; for (const k of Object.keys(g.attributes)) { const at = g.attributes[k]; if (at.isInterleavedBufferAttribute || !(at.array instanceof Float32Array)) { const n = at.count, sz = at.itemSize, f = new Float32Array(n * sz); for (let i = 0; i < n; i++) for (let c = 0; c < sz; c++) f[i * sz + c] = at.getComponent(i, c); g.setAttribute(k, new THREE.BufferAttribute(f, sz)); } } });
  [plantTree, plantLeafy, plantSmall, ...heroList].forEach(dequant);
  T.pano.wrapS = THREE.RepeatWrapping; T.pano.repeat.set(1, 1); T.art1.repeat.set(1, 1); T.art2.repeat.set(1, 1); T.fluteN.repeat.set(1, 1);

  // large-format porcelain (100×100, spec): soft stone mottling with fine grout, one tile per texture repeat
  T.porc = (() => { const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); g.fillStyle = '#ebe7e1'; g.fillRect(0, 0, 1024, 1024);
    let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 260; i++) { const x = rnd() * 1024, y = rnd() * 1024, r = 40 + rnd() * 160, a = 0.018 + rnd() * 0.03; const gr = g.createRadialGradient(x, y, 0, x, y, r); const tone = rnd() < 0.5 ? '214,206,196' : '247,244,239'; gr.addColorStop(0, `rgba(${tone},${a})`); gr.addColorStop(1, `rgba(${tone},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    g.strokeStyle = 'rgba(160,150,138,.12)'; g.lineWidth = 1.2; for (let i = 0; i < 9; i++) { g.beginPath(); let x = rnd() * 1024, y = rnd() * 1024; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rnd() - 0.3) * 160; y += (rnd() - 0.5) * 120; g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = '#cfc8be'; g.fillRect(0, 0, 1024, 3); g.fillRect(0, 0, 3, 1024);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; })();

  // ---------------------------------------------------------------- materials
  const std = o => new THREE.MeshStandardMaterial(o), phys = o => new THREE.MeshPhysicalMaterial(o);
  const n2 = k => new THREE.Vector2(k, k);
  const R = {
    floor: std({ map: T.floorC, normalMap: T.floorN, normalScale: n2(0.4), roughnessMap: T.floorR, roughness: 0.6, color: 0xf3e6d6, envMapIntensity: 1 }),
    deck: std({ map: T.deckC, normalMap: T.deckN, roughnessMap: T.deckR, roughness: 0.95, color: 0xeee4d8 }),
    plaster: std({ color: 0xf8f3eb, normalMap: T.plasterN, normalScale: n2(0.12), roughness: 0.93 }),
    plasterOut: std({ color: 0xefede8, normalMap: T.plasterN, normalScale: n2(0.2), roughness: 0.95 }),
    ceiling: std({ color: 0xf6f4f0, roughness: 0.95, emissive: 0xfffaf2, emissiveIntensity: 0.42 }),
    marble: phys({ map: T.marbleC, normalMap: T.marbleN, normalScale: n2(0.15), roughness: 0.16, clearcoat: 0.4, clearcoatRoughness: 0.12 }),
    marbleFloor: std({ map: T.porc, roughness: 0.32, color: 0xffffff, envMapIntensity: 0.9 }),
    onyx: phys({ map: T.onyxC, normalMap: T.marbleN, normalScale: n2(0.06), roughness: 0.12, clearcoat: 0.6, clearcoatRoughness: 0.08, color: 0xffffff }),
    veneer: std({ map: T.oakC, normalMap: T.oakN, normalScale: n2(0.25), roughness: 0.55, color: 0x9c948e }),
    walnut: phys({ map: T.oakC, normalMap: T.oakN, normalScale: n2(0.3), roughness: 0.45, color: 0x7a5a44, clearcoat: 0.15, clearcoatRoughness: 0.4 }),
    fluteWhite: std({ color: 0xf3ede4, roughness: 0.85 }),
    fluteGroove: std({ color: 0xcdc8c0, roughness: 0.9 }),
    tvVeneer: std({ map: T.oakC, normalMap: T.oakN, normalScale: n2(0.2), roughness: 0.62, color: 0xaeb0b2 }),
    consoleOak: phys({ map: T.oakC, normalMap: T.oakN, normalScale: n2(0.25), roughness: 0.5, color: 0xa08672, clearcoat: 0.1, clearcoatRoughness: 0.5 }),
    pouf: phys({ color: 0x8e8a84, normalMap: T.linenN, normalScale: n2(0.8), roughness: 1, sheen: 0.5, sheenColor: 0xc9c5bf }),
    alabaster: std({ color: 0xfbf6ee, roughness: 0.6, emissive: 0xffeedd, emissiveIntensity: 1.1 }),
    stone: std({ color: 0xd9d4cc, normalMap: T.plasterN, normalScale: n2(0.3), roughness: 0.8 }),
    stoneDark: std({ map: T.marbleC, color: 0x9d968d, roughness: 0.35 }),
    boucle: phys({ map: T.boucleC, normalMap: T.boucleN, normalScale: n2(0.9), roughness: 1, sheen: 0.6, sheenRoughness: 0.8, sheenColor: 0xfff8ee, color: 0xfffcf6 }),
    boucleSand: phys({ map: T.boucleC, normalMap: T.boucleN, normalScale: n2(0.9), roughness: 1, sheen: 0.5, sheenRoughness: 0.8, sheenColor: 0xf6e9d6, color: 0xe4d4bf }),
    linenTaupe: phys({ color: 0xb4aa9e, normalMap: T.linenN, normalScale: n2(0.6), roughness: 0.95, sheen: 0.5, sheenRoughness: 0.7, sheenColor: 0xe8dccd }),
    linenWhite: phys({ color: 0xf8f6f1, normalMap: T.linenN, normalScale: n2(0.5), roughness: 0.95, sheen: 0.4, sheenColor: 0xffffff }),
    linenSand: phys({ color: 0xcdb99c, normalMap: T.linenN, normalScale: n2(0.6), roughness: 0.95, sheen: 0.4, sheenColor: 0xf0e2cc }),
    linenGrey: phys({ color: 0x8f8b85, normalMap: T.linenN, normalScale: n2(0.6), roughness: 0.95, sheen: 0.4, sheenColor: 0xc9c5bf }),
    linenBlue: phys({ color: 0x55657a, normalMap: T.linenN, normalScale: n2(0.7), roughness: 0.95, sheen: 0.4, sheenColor: 0x9aa9bb }),
    oak: phys({ map: T.oakC, normalMap: T.oakN, normalScale: n2(0.3), roughness: 0.42, clearcoat: 0.15, clearcoatRoughness: 0.4 }),
    oakDark: phys({ map: T.oakC, normalMap: T.oakN, normalScale: n2(0.3), roughness: 0.45, color: 0x6e5240, clearcoat: 0.2, clearcoatRoughness: 0.4 }),
    teak: std({ map: T.oakC, normalMap: T.oakN, roughness: 0.7, color: 0xb18a66 }),
    fluteOak: std({ map: T.oakC, normalMap: T.oakN, normalScale: n2(0.3), roughness: 0.5, color: 0xd9c2a5 }),
    cabinet: std({ color: 0xf1eee9, roughness: 0.6 }),
    cabinetDark: std({ color: 0x8a7f74, roughness: 0.5 }),
    blackMatte: std({ color: 0x1a1a1b, roughness: 0.55 }),
    blackMetal: std({ color: 0x161617, roughness: 0.32, metalness: 0.75 }),
    brass: std({ color: 0xc9a46c, roughness: 0.25, metalness: 1 }),
    steel: std({ color: 0xd5d7d9, roughness: 0.18, metalness: 1 }),
    ceramic: phys({ color: 0xfbfbf9, roughness: 0.12, clearcoat: 0.8, clearcoatRoughness: 0.08 }),
    ceramicSand: phys({ color: 0xd8c8b3, roughness: 0.6, clearcoat: 0.2 }),
    glass: phys({ color: 0xeef6f8, roughness: 0.02, transparent: true, opacity: 0.12, envMapIntensity: 1.4, depthWrite: false, clearcoat: 1 }),
    glassShower: phys({ color: 0xeef6f8, roughness: 0.03, transparent: true, opacity: 0.18, envMapIntensity: 1.2, depthWrite: false }),
    glassAmber: phys({ color: 0xc58a4a, roughness: 0.08, transparent: true, opacity: 0.55, envMapIntensity: 1.2, depthWrite: false }),
    glassSmoke: phys({ color: 0x9a948c, roughness: 0.08, transparent: true, opacity: 0.45, envMapIntensity: 1.2, depthWrite: false }),
    led: std({ color: 0x222222, emissive: 0xfff1d8, emissiveIntensity: 7 }),
    ledWarm: std({ color: 0x333333, emissive: 0xffe3b8, emissiveIntensity: 7 }),
    bulb: std({ color: 0xffffff, emissive: 0xfff0d8, emissiveIntensity: 8 }),
    shade: std({ color: 0xf3eadc, roughness: 0.9, emissive: 0xffe9c8, emissiveIntensity: 0.6, side: THREE.DoubleSide }),
    screen: phys({ color: 0x08090b, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 }),
    rugLiving: std({ map: T.rugwC, normalMap: T.rugwN, normalScale: n2(1.0), roughness: 1, color: 0xffffff }),
    rug: std({ map: T.rugC, normalMap: T.rugN, normalScale: n2(1.1), roughness: 1, color: 0xf3eee6 }),
    rugBed: std({ map: T.rugC, normalMap: T.rugN, normalScale: n2(1.1), roughness: 1, color: 0xe2d6c4 }),
    rugOut: std({ map: T.rugC, normalMap: T.rugN, normalScale: n2(1.2), roughness: 1, color: 0xd8cfbf }),
    rope: std({ color: 0x6e5d4c, normalMap: T.fluteN, normalScale: n2(1.4), roughness: 0.9 }),
    ribbed: phys({ color: 0xece2d3, normalMap: T.fluteN, normalScale: n2(0.6), roughness: 0.95, sheen: 0.5, sheenColor: 0xffffff }),
    canvas: std({ color: 0xece4d6, roughness: 0.9, side: THREE.DoubleSide }),
    concrete: std({ color: 0xd9d5cc, normalMap: T.plasterN, normalScale: n2(0.6), roughness: 0.92 }),
    soil: std({ color: 0x3d3128, roughness: 1 }),
    curtain: std({ color: 0xfbf9f5, roughness: 1, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false }),
    curtainLinen: std({ color: 0xe9e1d4, normalMap: T.linenN, normalScale: n2(0.5), roughness: 1, side: THREE.DoubleSide }),
    paper: std({ color: 0xf1ece2, roughness: 0.9 }), book1: std({ color: 0x2b2a28, roughness: 0.8 }), book2: std({ color: 0xc9b9a0, roughness: 0.8 }), book3: std({ color: 0x8c7b68, roughness: 0.8 }),
    fruit: std({ color: 0xd8a24a, roughness: 0.5 }), fruitG: std({ color: 0x9fb35a, roughness: 0.5 }),
    art1: std({ map: T.art1, roughness: 0.9 }), art2: std({ map: T.art2, roughness: 0.9 }),
    water: std({ color: 0xffffff, roughness: 1 }),
  };
  for (const k in R) if (!R[k].transparent && R[k].isMeshStandardMaterial) C.patch(R[k]);

  // ---------------------------------------------------------------- geometry builder (merged per material, world-space UVs in metres)
  const group = new THREE.Group(), povGroup = new THREE.Group(); group.visible = povGroup.visible = false;
  C.scene.add(group, povGroup);
  function worldUV(g) { const p = g.attributes.position, n = g.attributes.normal; const uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)); let u, v; if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); } else if (ax >= az) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); } uv[i * 2] = u; uv[i * 2 + 1] = v; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
  let bucket = new Map(), target = group;
  function add(m, g, keepUV = false) { g = g.index ? g.toNonIndexed() : g; if (!keepUV) worldUV(g); else if (!g.attributes.uv) worldUV(g); const k = (target === group ? 'g|' : 'p|') + m.uuid + (keepUV ? '|uv' : ''); if (!bucket.has(k)) bucket.set(k, { m, t: target, list: [] }); bucket.get(k).list.push(g); return g; }
  function bake() { bucket.forEach(({ m, t, list }) => { const gs = list.map(g => { const h = new THREE.BufferGeometry(); h.setAttribute('position', g.attributes.position); h.setAttribute('normal', g.attributes.normal); h.setAttribute('uv', g.attributes.uv); return h; }); const mesh = new THREE.Mesh(C.mergeGeometries(gs, false), m); mesh.castShadow = !m.transparent && m !== R.led && m !== R.ledWarm && m !== R.bulb; mesh.receiveShadow = true; t.add(mesh); }); bucket.clear(); }
  const place = (g, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) => { g.scale(sx, sy, sz); if (rz) g.rotateZ(rz); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; };
  const box = (m, x0, y0, z0, x1, y1, z1) => { const g = new THREE.BoxGeometry(Math.max(1e-3, Math.abs(x1 - x0)), Math.max(1e-3, Math.abs(y1 - y0)), Math.max(1e-3, Math.abs(z1 - z0))); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return add(m, g); };
  const rb = (m, cx, cy, cz, sx, sy, sz, r, o = {}, seg = 4) => add(m, place(new C.RoundedBoxGeometry(Math.max(0.01, sx), Math.max(0.01, sy), Math.max(0.01, sz), seg, Math.max(0.003, Math.min(r, sx / 2 - 1e-3, sy / 2 - 1e-3, sz / 2 - 1e-3))), { x: cx, y: cy, z: cz, ...o }));
  const cyl = (m, cx, cy, cz, r0, r1, h, seg = 32, o = {}) => add(m, place(new THREE.CylinderGeometry(r0, r1, h, seg), { x: cx, y: cy, z: cz, ...o }));
  const sph = (m, cx, cy, cz, sx, sy, sz, seg = 24) => add(m, place(new THREE.SphereGeometry(1, seg, Math.max(8, seg / 2 | 0)), { x: cx, y: cy, z: cz, sx, sy, sz }));
  const tor = (m, cx, cy, cz, r, t, o = {}, arc = TAU) => add(m, place(new THREE.TorusGeometry(r, t, 12, 72, arc), { x: cx, y: cy, z: cz, ...o }));
  const lathe = (m, pts, cx, cy, cz, seg = 48, o = {}) => add(m, place(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg), { x: cx, y: cy, z: cz, ...o }));
  const rect = (x0, y0, x1, y1) => ({ x0: X(Math.min(x0, x1)), x1: X(Math.max(x0, x1)), z0: Z(Math.min(y0, y1)), z1: Z(Math.max(y0, y1)), cx: X((x0 + x1) / 2), cz: Z((y0 + y1) / 2), w: Math.abs(x1 - x0) * S, d: Math.abs(y1 - y0) * S });
  const DIR = { l: [-1, 0], r: [1, 0], t: [0, -1], b: [0, 1] };
  // local frame for a piece facing `face`: u runs along it, v runs toward the front
  function frame(r, face) { const [fx, fz] = DIR[face] || [0, 1]; const alongX = fz !== 0; const L = alongX ? r.w : r.d, D = alongX ? r.d : r.w; const at = (u, v) => [r.cx + (alongX ? u : fx * v), r.cz + (alongX ? fz * v : u)]; const size = (su, sv) => alongX ? [su, sv] : [sv, su]; const ry = Math.atan2(fx, fz); return { L, D, at, size, fx, fz, ry }; }
  function pillow(m, cx, cy, cz, w, h, d, ry = 0, tilt = 0.25) { const g = new THREE.SphereGeometry(1, 32, 20); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const sq = 1 - 0.18 * (Math.abs(x) + Math.abs(y)); p.setXYZ(i, Math.sign(x) * Math.pow(Math.abs(x), 0.6), Math.sign(y) * Math.pow(Math.abs(y), 0.6), z * sq * 0.9); } g.computeVertexNormals(); add(m, place(g, { x: cx, y: cy, z: cz, sx: w / 2, sy: h / 2, sz: d / 2, rx: -tilt, ry })); }
  const legs = (m, pts, y0, y1, r = 0.012, r2 = r) => pts.forEach(([x, z]) => cyl(m, x, (y0 + y1) / 2, z, r2, r, y1 - y0, 12));


  // ---------------------------------------------------------------- hero furniture: scanned-quality models in the style of the renders
  const H = {}; HERO.forEach((n, i) => { const sc = heroList[i]; if (!sc) return; const g = new THREE.Group(); sc.rotation.y = -Math.PI / 2 + (YAW[n] || 0); g.add(sc); g.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(g), c = b.getCenter(V()); sc.position.set(-c.x, -b.min.y, -c.z); g.userData.size = b.getSize(V());
    g.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; const mt = m.material; if (mt.isMeshStandardMaterial) { mt.envMapIntensity = 0.9; C.patch(mt); } } }); H[n] = g; });
  // w = width (local x), h = height, d = depth (local z, front faces +z); missing sizes keep proportions
  function put(n, cx, cz, ry, w, h, d, y = 0) { const p = H[n]; if (!p) return false; const k = p.userData.size; const sx = w / k.x, sy = h ? h / k.y : sx, sz = d ? d / k.z : sx;
    const o = p.clone(true); o.scale.set(sx, sy, sz); o.position.set(cx, y, cz); o.rotation.y = ry; group.add(o); return true; }
  // ---------------------------------------------------------------- furniture, modelled after the project renders
  function sofa(r, face, mat = R.linenTaupe, outdoor = false) {
    const F = frame(r, face), L = F.L, D = Math.max(F.D, 0.95), base = outdoor ? R.teak : R.blackMatte;
    const c0 = F.at(0, (D - F.D) / 2); const o = { ry: F.ry };
    if (!outdoor && put('sofa', c0[0], c0[1], F.ry, L + 0.05, 0.74, 1.12)) return;
    const at = (u, v) => [c0[0] + (F.fz ? u : F.fx * v), c0[1] + (F.fz ? F.fz * v : u)];
    let [x, z] = at(0, 0); rb(base, x, 0.05, z, L - 0.12, 0.1, D - 0.12, 0.01, { ry: F.ry });
    rb(mat, x, 0.24, z, L, 0.26, D, 0.07, o, 5);
    for (const s of [-1, 1]) { [x, z] = at(s * (L / 2 - 0.11), 0); rb(mat, x, 0.47, z, 0.22, 0.44, D, 0.09, o, 5); }
    const n = Math.max(1, Math.round((L - 0.44) / 0.85)), cw = (L - 0.44) / n;
    for (let i = 0; i < n; i++) { const u = -L / 2 + 0.22 + cw * (i + 0.5);
      [x, z] = at(u, 0.08); rb(mat, x, 0.45, z, cw - 0.015, 0.16, D - 0.3, 0.075, o, 6);
      [x, z] = at(u, -D / 2 + 0.17); rb(mat, x, 0.72, z, cw - 0.03, 0.5, 0.24, 0.11, { ry: F.ry, rx: -0.12 }, 6); }
    const pm = outdoor ? [R.linenBlue, R.linenWhite] : [R.boucleSand, R.linenSand, R.boucle];
    for (let i = 0; i < 3; i++) { const u = [-L / 2 + 0.5, L / 2 - 0.5, -L / 2 + 0.9][i]; if (i === 2 && L < 2) continue; [x, z] = at(u, -D / 2 + 0.36); pillow(pm[i % pm.length], x, 0.72, z, 0.48, 0.44, 0.14, F.ry, 0.25 + i * 0.05); }
    if (!outdoor) { [x, z] = at(L / 2 - 0.11, 0.05); rb(R.linenSand, x, 0.7, z, 0.26, 0.02, D * 0.55, 0.008, { ry: F.ry }); }
  }
  function tubChair(cx, cz, face, mat = R.ribbed, seat = R.boucle, size = 0.86) {
    const [fx, fz] = DIR[face] || [0, 1]; const ry = Math.atan2(fx, fz); const len = 3.9, back = ry + Math.PI;
    if (put('arm', cx, cz, ry, size, size * 0.88, size * 0.98)) return;
    const shell = (r, h, y, m) => { const g = new THREE.CylinderGeometry(r, r * 0.96, h, 64, 1, true, back - len / 2, len); g.translate(cx, y, cz); add(m, g, true); };
    shell(0.4, 0.46, 0.5, mat); shell(0.34, 0.4, 0.52, mat);
    tor(mat, cx, 0.73, cz, 0.37, 0.04, { rx: Math.PI / 2, ry: back + len / 2 - Math.PI / 2 }, len);
    cyl(mat, cx, 0.3, cz, 0.4, 0.38, 0.06, 48);
    rb(seat, cx + fx * 0.04, 0.4, cz + fz * 0.04, 0.6, 0.13, 0.56, 0.06, { ry }, 5);
    pillow(R.boucleSand, cx - fx * 0.18, 0.58, cz - fz * 0.18, 0.36, 0.3, 0.12, ry, 0.3);
    legs(R.blackMetal, [[cx + 0.25, cz + 0.25], [cx - 0.25, cz + 0.25], [cx + 0.25, cz - 0.25], [cx - 0.25, cz - 0.25]], 0, 0.27, 0.011, 0.016);
  }
  function chair(cx, cz, face, seatM = R.boucleSand, frameM = R.blackMetal) {
    const [fx, fz] = DIR[face] || [0, 1]; const ry = Math.atan2(fx, fz);
    rb(seatM, cx, 0.47, cz, 0.48, 0.08, 0.46, 0.035, { ry }, 4);
    rb(seatM, cx - fx * 0.22, 0.74, cz - fz * 0.22, 0.46, 0.34, 0.06, 0.03, { ry, rx: -0.12 }, 4);
    const s = 0.19; legs(frameM, [[cx + s, cz + s], [cx - s, cz + s], [cx + s, cz - s], [cx - s, cz - s]], 0, 0.43, 0.011);
    for (const k of [-1, 1]) { const px = cx - fx * 0.2 + (fz ? k * 0.19 : 0), pz = cz - fz * 0.2 + (fx ? k * 0.19 : 0); cyl(frameM, px, 0.62, pz, 0.009, 0.009, 0.32, 8); }
  }
  function stool(cx, cz) { if (put('stool', cx, cz, Math.PI / 2, 0.5, 0.96, 0.5)) return; cyl(R.boucleSand, cx, 0.7, cz, 0.2, 0.19, 0.08, 40); rb(R.boucleSand, cx - 0.17, 0.86, cz, 0.05, 0.2, 0.34, 0.02); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; cyl(R.blackMetal, cx + Math.cos(a) * 0.15, 0.33, cz + Math.sin(a) * 0.15, 0.011, 0.011, 0.66, 10); } tor(R.blackMetal, cx, 0.28, cz, 0.16, 0.008, { rx: Math.PI / 2 }); }
  function vase(cx, cy, cz, s = 1, m = R.ceramicSand) { lathe(m, [[0, 0], [0.05 * s, 0], [0.07 * s, 0.05 * s], [0.075 * s, 0.11 * s], [0.04 * s, 0.2 * s], [0.03 * s, 0.24 * s], [0.032 * s, 0.25 * s], [0, 0.25 * s]], cx, cy, cz, 32); }
  function books(cx, cy, cz, ry = 0, n = 3) { let y = cy; for (let i = 0; i < n; i++) { const h = 0.025 + (i % 2) * 0.012; rb([R.book2, R.book1, R.book3][i % 3], cx, y + h / 2, cz, 0.24 - i * 0.02, h, 0.17 - i * 0.01, 0.003, { ry: ry + i * 0.12 }, 2); y += h; } return y; }
  function bowlFruit(cx, cy, cz, s = 1) { lathe(R.ceramic, [[0, 0], [0.06 * s, 0], [0.13 * s, 0.05 * s], [0.15 * s, 0.07 * s], [0.145 * s, 0.072 * s], [0.125 * s, 0.05 * s], [0.055 * s, 0.012 * s], [0, 0.012 * s]], cx, cy, cz, 40); for (let i = 0; i < 5; i++) { const a = i * 1.3; sph(i % 2 ? R.fruit : R.fruitG, cx + Math.cos(a) * 0.06 * s, cy + 0.05 * s, cz + Math.sin(a) * 0.06 * s, 0.035 * s, 0.035 * s, 0.035 * s, 16); } }
  function coffee(r) {
    if (put('coffee', r.cx - r.w * 0.05, r.cz, 0, 1.1, null, null)) return;
    const a = [r.cx - r.w * 0.16, r.cz], b = [r.cx + r.w * 0.3, r.cz + 0.12];
    cyl(R.oakDark, a[0], 0.17, a[1], 0.4, 0.4, 0.34, 64); cyl(R.marble, a[0], 0.36, a[1], 0.47, 0.47, 0.05, 64);
    cyl(R.blackMatte, b[0], 0.13, b[1], 0.2, 0.2, 0.26, 48); cyl(R.marble, b[0], 0.28, b[1], 0.27, 0.27, 0.04, 48);
    rb(R.blackMatte, a[0] + 0.08, 0.395, a[1] - 0.05, 0.42, 0.02, 0.3, 0.008, { ry: 0.3 }, 2); books(a[0] + 0.08, 0.405, a[1] - 0.05, 0.3, 2);
    vase(a[0] - 0.22, 0.385, a[1] + 0.14, 0.9, R.ceramicSand); bowlFruit(b[0], 0.3, b[1], 0.8);
  }
  function rug(r, m = R.rug, pad = 0) { const w = r.w + pad, d = r.d + pad, rad = 0.08; const s = new THREE.Shape(); s.moveTo(-w / 2 + rad, -d / 2); s.lineTo(w / 2 - rad, -d / 2); s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + rad); s.lineTo(w / 2, d / 2 - rad); s.quadraticCurveTo(w / 2, d / 2, w / 2 - rad, d / 2); s.lineTo(-w / 2 + rad, d / 2); s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - rad); s.lineTo(-w / 2, -d / 2 + rad); s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + rad, -d / 2); const g = new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.004, bevelSegments: 2, curveSegments: 6 }); g.rotateX(-Math.PI / 2); g.translate(r.cx, 0.006, r.cz); add(m, g); }
  function tvWall(r) {
    const zw = r.z1 + 0.035, x0 = r.cx - 1.3, x1 = r.cx + 1.3; // cladding on the wall the unit stands against
    box(R.stone, x0, 0, zw - 0.035, x1, 2.15, zw); for (let x = x0 + 0.5; x < x1; x += 0.5) box(R.cabinetDark, x - 0.002, 0.02, zw - 0.037, x + 0.002, 2.13, zw - 0.034);
    box(R.blackMatte, r.cx - 0.6, 0.22, zw - 0.45, r.cx + 1.25, 0.58, zw - 0.035); box(R.cabinetDark, r.cx - 0.6, 0.398, zw - 0.452, r.cx + 1.25, 0.402, zw - 0.45);
    box(R.screen, r.cx - 0.82, 0.9, zw - 0.07, r.cx + 0.82, 1.84, zw - 0.04); box(R.blackMatte, r.cx - 0.83, 0.89, zw - 0.065, r.cx + 0.83, 1.85, zw - 0.05);
    const sx = x0 + 0.05; box(R.ledWarm, sx, 0.62, zw - 0.04, sx + 0.012, 2.1, zw - 0.036); for (const y of [0.95, 1.35, 1.75]) box(R.blackMetal, sx, y, zw - 0.32, sx + 0.7, y + 0.025, zw - 0.036);
    vase(sx + 0.2, 0.975, zw - 0.18, 1.1, R.ceramic); books(sx + 0.5, 1.375, zw - 0.18, 0.1, 3); vase(sx + 0.45, 1.775, zw - 0.18, 0.8, R.ceramicSand); books(r.cx + 0.85, 0.58, zw - 0.25, -0.1, 2); vase(r.cx + 1.08, 0.58, zw - 0.22, 1.3, R.ceramic);
  }
  function dining(r, orient, outdoor = false) {
    const long = orient === 'v' ? r.d : r.w, vx = orient === 'v';
    if (!outdoor) { diningOval(r, vx); return; }
    if (!outdoor) { rb(R.marble, r.cx, 0.755, r.cz, r.w + 0.04, 0.035, r.d + 0.04, 0.01, {}, 3); for (const s of [-1, 1]) rb(R.blackMatte, r.cx, 0.37, r.cz, vx ? 0.12 : r.w * 0.55, 0.74, vx ? r.d * 0.55 : 0.12, 0.02, { ry: s * 0.55 }, 2); bowlFruit(r.cx, 0.773, r.cz, 1.1); vase(r.cx + (vx ? 0 : 0.5), 0.773, r.cz + (vx ? 0.5 : 0), 1.2, R.ceramic); }
    else { rb(R.teak, r.cx, 0.74, r.cz, r.w, 0.04, r.d, 0.01, {}, 2); legs(R.teak, [[r.x0 + 0.1, r.z0 + 0.1], [r.x1 - 0.1, r.z0 + 0.1], [r.x0 + 0.1, r.z1 - 0.1], [r.x1 - 0.1, r.z1 - 0.1]], 0, 0.72, 0.03); vase(r.cx, 0.76, r.cz, 1.2, R.concrete); }
    const n = Math.max(2, Math.round(long / 0.62)); for (let i = 0; i < n; i++) { const t = -long / 2 + (i + 0.5) * long / n; const sm = outdoor ? R.rope : R.boucleSand, fm = outdoor ? R.teak : R.blackMetal;
      if (vx) { chair(r.x0 - 0.32, r.cz + t, 'r', sm, fm); chair(r.x1 + 0.32, r.cz + t, 'l', sm, fm); } else { chair(r.cx + t, r.z0 - 0.32, 'b', sm, fm); chair(r.cx + t, r.z1 + 0.32, 't', sm, fm); } }
    if (!outdoor) { target = povGroup; const cx = r.cx, cz = r.cz; cyl(R.brass, cx, CEIL_H - 0.35, cz, 0.012, 0.012, 0.7, 8); for (let i = 0; i < 14; i++) { const a = i * 2.399, rr = 0.12 + (i % 4) * 0.08, y = CEIL_H - 0.75 - (i % 3) * 0.1; cyl(R.brass, cx + Math.cos(a) * rr / 2, y + 0.04, cz + Math.sin(a) * rr / 2, 0.004, 0.004, rr, 6, { rz: Math.PI / 2, ry: -a }); sph(R.bulb, cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr, 0.075, 0.075, 0.075, 20); } target = group; }
  }

  function diningOval(r, vx) {
    const long = vx ? r.d : r.w, short = vx ? r.w : r.d;
    { const g = new THREE.CylinderGeometry(0.5, 0.5, 0.04, 64); g.scale(vx ? short : long, 1, vx ? long : short); g.translate(r.cx, 0.75, r.cz); add(R.oak, g); }
    for (const k of [-0.27, 0.27]) { const px = r.cx + (vx ? 0 : k * long), pz = r.cz + (vx ? k * long : 0); for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; cyl(R.oak, px + Math.cos(a) * 0.15, 0.37, pz + Math.sin(a) * 0.15, 0.022, 0.022, 0.73, 10); } cyl(R.oak, px, 0.37, pz, 0.14, 0.14, 0.73, 32); }
    vase(r.cx, 0.77, r.cz, 1.3, R.ceramic); for (let i = 0; i < 9; i++) { const a = i * 2.4; sph(R.water, r.cx + Math.cos(a) * 0.12, 1.12 + (i % 3) * 0.05, r.cz + Math.sin(a) * 0.12, 0.05, 0.05, 0.05, 12); }
    const n = Math.max(2, Math.round(long / 0.46)); for (let i = 0; i < n; i++) { const t = -long / 2 + (i + 0.5) * long / n;
      if (vx) { seat(r.x0 - 0.2, r.cz + t, 'r'); seat(r.x1 + 0.2, r.cz + t, 'l'); } else { seat(r.cx + t, r.z0 - 0.2, 'b'); seat(r.cx + t, r.z1 + 0.2, 't'); } }
    function seat(cx, cz, face) { const [fx, fz] = DIR[face]; const ry = Math.atan2(fx, fz);
      rb(R.boucleSand, cx, 0.46, cz, 0.42, 0.07, 0.4, 0.03, { ry }, 4);
      const g = new THREE.CylinderGeometry(0.23, 0.23, 0.26, 32, 1, true, ry + Math.PI - 1.2, 2.4); g.scale(1, 1, 0.85); g.translate(cx, 0.66, cz); add(R.boucleSand, g, true);
      legs(R.oak, [[cx + 0.16, cz + 0.16], [cx - 0.16, cz + 0.16], [cx + 0.16, cz - 0.16], [cx - 0.16, cz - 0.16]], 0, 0.43, 0.014); }
    target = povGroup; { const y = CEIL_H - 1.05, L2 = long * 0.42, pts = [];
      for (let i = 0; i <= 24; i++) { const t = i / 24, u = -L2 + 2 * L2 * t, w = Math.sin(t * Math.PI * 2.2) * 0.09, h = Math.sin(t * Math.PI * 1.6 + 0.6) * 0.06; pts.push(vx ? V(r.cx + w, y + h, r.cz + u) : V(r.cx + u, y + h, r.cz + w)); }
      const curve = new THREE.CatmullRomCurve3(pts); add(R.alabaster, new THREE.TubeGeometry(curve, 80, 0.055, 16, false), true);
      for (const t of [0.12, 0.88]) { const p = curve.getPoint(t); cyl(R.blackMetal, p.x, (p.y + CEIL_H) / 2, p.z, 0.0025, 0.0025, CEIL_H - p.y, 6); } } target = group;
  }
  function diningHero(r, vx) {
    const long = vx ? r.d : r.w; put('table', r.cx, r.cz, vx ? 0 : Math.PI / 2, (vx ? r.w : r.d) + 0.04, 0.76, long + 0.06);
    bowlFruit(r.cx, 0.765, r.cz - (vx ? 0.35 : 0), 1.1); vase(r.cx + (vx ? 0 : 0.5), 0.765, r.cz + (vx ? 0.45 : 0), 1.3, R.ceramic);
    const n = Math.max(2, Math.round(long / 0.78)); for (let i = 0; i < n; i++) { const t = -long / 2 + (i + 0.5) * long / n;
      if (vx) { put('chair', r.x0 - 0.3, r.cz + t, Math.PI / 2, 0.6, 0.8, 0.62); put('chair', r.x1 + 0.3, r.cz + t, -Math.PI / 2, 0.6, 0.8, 0.62); }
      else { put('chair', r.cx + t, r.z0 - 0.3, 0, 0.6, 0.8, 0.62); put('chair', r.cx + t, r.z1 + 0.3, Math.PI, 0.6, 0.8, 0.62); } }
    // sculptural wave pendant over the table (alabaster-like, like the render)
    target = povGroup; { const y = CEIL_H - 1.05, L2 = long * 0.42, pts = [];
      for (let i = 0; i <= 24; i++) { const t = i / 24, u = -L2 + 2 * L2 * t, w = Math.sin(t * Math.PI * 2.2) * 0.09, h = Math.sin(t * Math.PI * 1.6 + 0.6) * 0.06; pts.push(vx ? V(r.cx + w, y + h, r.cz + u) : V(r.cx + u, y + h, r.cz + w)); }
      const curve = new THREE.CatmullRomCurve3(pts); const g = new THREE.TubeGeometry(curve, 80, 0.055, 16, false); add(R.alabaster, g, true);
      for (const t of [0.12, 0.88]) { const p = curve.getPoint(t); cyl(R.blackMetal, p.x, (p.y + CEIL_H) / 2, p.z, 0.0025, 0.0025, CEIL_H - p.y, 6); } } target = group;
  }
  function island(r) {
    // onyx-clad island like the render: onyx top, waterfall ends and front, walnut drawers on the kitchen side
    box(R.walnut, r.x0 + 0.04, 0.1, r.z0, r.x1, 0.9, r.z1); box(R.blackMatte, r.x0 + 0.08, 0, r.z0 + 0.06, r.x1 - 0.06, 0.1, r.z1 - 0.06);
    for (let z = r.z0 + 0.6; z < r.z1 - 0.1; z += 0.6) box(R.blackMatte, r.x1, 0.12, z - 0.002, r.x1 + 0.002, 0.88, z + 0.002);
    box(R.onyx, r.x0 - 0.04, 0.9, r.z0 - 0.04, r.x1 + 0.03, 0.94, r.z1 + 0.04); box(R.onyx, r.x0 - 0.04, 0, r.z0 - 0.04, r.x0 + 0.02, 0.9, r.z1 + 0.04);
    for (const z of [r.z0 - 0.04, r.z1]) box(R.onyx, r.x0 - 0.04, 0, z, r.x1 + 0.03, 0.9, z + 0.04);
    box(R.screen, r.cx - 0.3, 0.941, r.z0 + 0.1, r.cx + 0.3, 0.946, r.z0 + 0.7); for (const [a, b] of [[-.14, .26], [.14, .26], [-.14, .54], [.14, .54]]) tor(R.steel, r.cx + a, 0.95, r.z0 + b, 0.075, 0.009, { rx: Math.PI / 2 });
    for (let i = 0; i < 4; i++) stool(r.x0 - 0.26, r.z0 + 1.0 + i * (r.d - 1.3) / 3);
    target = povGroup; for (let i = 0; i < 2; i++) { const z = r.z0 + 0.9 + i * (r.d - 1.3); cyl(R.blackMetal, r.cx, CEIL_H - 0.45, z, 0.004, 0.004, 0.9, 6); lathe(R.glassAmber, [[0.01, 0.3], [0.05, 0.28], [0.12, 0.16], [0.13, 0.06], [0.1, 0], [0, -0.01]], r.cx, CEIL_H - 1.25, z, 40); sph(R.bulb, r.cx, CEIL_H - 1.15, z, 0.035, 0.035, 0.035, 16); cyl(R.brass, r.cx, CEIL_H - 0.94, z, 0.025, 0.03, 0.04, 20); } target = group;
  }
  function counter(r, o) {
    if (o === 'r') { // base run against the wall on the +x side: walnut fronts, onyx top and splash, white wall cabinets, sink + tap
      box(R.walnut, r.x0, 0.1, r.z0, r.x1, 0.88, r.z1); box(R.blackMatte, r.x0 + 0.05, 0, r.z0, r.x1, 0.1, r.z1); box(R.onyx, r.x0 - 0.02, 0.88, r.z0, r.x1, 0.92, r.z1); box(R.onyx, r.x1 - 0.02, 0.92, r.z0, r.x1, 1.55, r.z1);
      const n = Math.max(1, Math.round(r.d / 0.6)); for (let i = 1; i < n; i++) box(R.blackMatte, r.x0 - 0.002, 0.12, r.z0 + i * r.d / n - 0.002, r.x0, 0.86, r.z0 + i * r.d / n + 0.002);
      box(R.cabinet, r.x1 - 0.35, 1.55, r.z0, r.x1, 2.4, r.z1); box(R.ledWarm, r.x1 - 0.32, 1.545, r.z0, r.x1 - 0.28, 1.55, r.z1);
      box(R.steel, r.cx - 0.2, 0.885, r.cz - 0.3, r.cx + 0.12, 0.921, r.cz + 0.2); const tz = r.cz; cyl(R.blackMetal, r.x1 - 0.1, 1.08, tz, 0.014, 0.014, 0.32, 12); tor(R.blackMetal, r.x1 - 0.18, 1.24, tz, 0.08, 0.012, { ry: 0 }, Math.PI);
      vase(r.cx, 0.92, r.z0 + 0.25, 0.9, R.ceramic); return;
    }
    if (o === 'T') { // tall wall: cabinets, oven column, fridge column
      box(R.cabinet, r.x0, 0.1, r.z0, r.x1, 2.25, r.z1); box(R.blackMatte, r.x0 + 0.05, 0, r.z0, r.x1, 0.1, r.z1);
      const n = Math.round(r.d / 0.6); for (let i = 1; i < n; i++) box(R.cabinetDark, r.x0 - 0.002, 0.12, r.z0 + i * r.d / n - 0.002, r.x0, 2.23, r.z0 + i * r.d / n + 0.002);
      const zc = r.z0 + r.d * 0.35; box(R.screen, r.x0 - 0.01, 0.85, zc - 0.3, r.x0, 1.45, zc + 0.3); box(R.screen, r.x0 - 0.01, 1.5, zc - 0.3, r.x0, 1.95, zc + 0.3); box(R.steel, r.x0 - 0.03, 1.38, zc - 0.25, r.x0 - 0.01, 1.4, zc + 0.25); box(R.steel, r.x0 - 0.03, 1.88, zc - 0.25, r.x0 - 0.01, 1.9, zc + 0.25);
      for (let i = 0; i < n; i++) box(R.blackMetal, r.x0 - 0.02, 1.0, r.z0 + (i + 0.5) * r.d / n + 0.24, r.x0 - 0.008, 1.3, r.z0 + (i + 0.5) * r.d / n + 0.25);
    } else { // base run with marble worktop + backsplash, sink and tap
      box(R.cabinet, r.x0, 0.1, r.z0, r.x1, 0.88, r.z1); box(R.blackMatte, r.x0, 0, r.z0 + 0.05, r.x1, 0.1, r.z1); box(R.marble, r.x0 - 0.01, 0.88, r.z0 - 0.02, r.x1, 0.92, r.z1); box(R.marble, r.x0, 0.92, r.z1 - 0.02, r.x1, 1.55, r.z1);
      box(R.ledWarm, r.x0, 1.54, r.z1 - 0.06, r.x1, 1.55, r.z1 - 0.02); box(R.cabinet, r.x0, 1.55, r.z1 - 0.35, r.x1, 2.25, r.z1);
      const n = Math.round(r.w / 0.6); for (let i = 1; i < n; i++) box(R.cabinetDark, r.x0 + i * r.w / n - 0.002, 0.12, r.z0 - 0.002, r.x0 + i * r.w / n + 0.002, 0.86, r.z0);
      box(R.steel, r.cx - 0.3, 0.885, r.cz - 0.22, r.cx + 0.2, 0.921, r.cz + 0.12); const tx = r.cx + 0.3; cyl(R.blackMetal, tx, 1.08, r.z1 - 0.1, 0.014, 0.014, 0.32, 12); tor(R.blackMetal, tx, 1.24, r.z1 - 0.18, 0.08, 0.012, { ry: Math.PI / 2 }, Math.PI);
      vase(r.x0 + 0.35, 0.92, r.z1 - 0.15, 0.9, R.ceramic); rb(R.oak, r.x1 - 0.5, 0.94, r.z1 - 0.12, 0.45, 0.03, 0.3, 0.01, { ry: 0.2 }, 2);
    }
  }
  function bed(r, head, dbl) {
    const F = frame(r, head === 'l' ? 'r' : head === 'r' ? 'l' : head === 't' ? 'b' : 't'); const L = F.D, W = F.L; let [cx, cz] = F.at(0, 0); const o = { ry: F.ry };
    if (put('bed', cx, cz, F.ry, W + (dbl ? 0.25 : 0.2), dbl ? 1.3 : 1.15, L + 0.12)) { if (dbl) { const [bx, bz] = F.at(0, L / 2 + 0.38); const [sx2, sz2] = F.size(W * 0.8, 0.42); rb(R.boucleSand, bx, 0.42, bz, sx2, 0.1, sz2, 0.04, {}, 4); for (const u of [-W * 0.36, W * 0.36]) { const [lx, lz] = F.at(u, L / 2 + 0.38); cyl(R.blackMetal, lx, 0.19, lz, 0.012, 0.012, 0.38, 10); } } return; }
    let [sx, sz] = F.size(W + 0.1, L + 0.08); rb(R.oak, cx, 0.16, cz, sx, 0.22, sz, 0.02, {}, 2); box(R.blackMatte, cx - sx / 2 + 0.1, 0, cz - sz / 2 + 0.1, cx + sx / 2 - 0.1, 0.06, cz + sz / 2 - 0.1);
    [sx, sz] = F.size(W - 0.04, L - 0.05); rb(R.linenWhite, cx, 0.39, cz, sx, 0.24, sz, 0.08, {}, 5);
    let [dx, dz] = F.at(0, L * 0.12); [sx, sz] = F.size(W + 0.06, L * 0.76); rb(R.linenWhite, dx, 0.52, dz, sx, 0.08, sz, 0.035, {}, 4);
    [dx, dz] = F.at(0, L / 2 - L * 0.17); [sx, sz] = F.size(W + 0.09, L * 0.26); rb(dbl ? R.boucleSand : R.linenSand, dx, 0.565, dz, sx, 0.04, sz, 0.018, {}, 3);
    const np = dbl ? 2 : 1; for (let i = 0; i < np; i++) { const u = np === 1 ? 0 : (i ? 1 : -1) * W * 0.24; let [px, pz] = F.at(u, -L / 2 + 0.24); pillow(R.linenWhite, px, 0.66, pz, W / np - 0.12, 0.42, 0.16, F.ry, 0.5); [px, pz] = F.at(u * 0.9, -L / 2 + 0.38); pillow(dbl ? R.linenSand : R.boucleSand, px, 0.63, pz, W / np - 0.3, 0.32, 0.13, F.ry, 0.35); }
    const [hx, hz] = F.at(0, -L / 2 - 0.06); [sx, sz] = F.size(W + 0.5, 0.1); rb(R.boucle, hx, 0.62, hz, sx, 1.16, sz, 0.05, {}, 5);
    if (dbl) { const [bx, bz] = F.at(0, L / 2 + 0.32); [sx, sz] = F.size(W * 0.8, 0.42); rb(R.boucleSand, bx, 0.42, bz, sx, 0.1, sz, 0.04, {}, 4); for (const u of [-W * 0.36, W * 0.36]) { const [lx, lz] = F.at(u, L / 2 + 0.32); cyl(R.blackMetal, lx, 0.19, lz, 0.012, 0.012, 0.38, 10); } }
  }
  function night(r) { rb(R.oak, r.cx, 0.27, r.cz, r.w, 0.46, r.d, 0.015, {}, 2); box(R.cabinetDark, r.x0 + 0.02, 0.27, r.z0 - 0.002, r.x1 - 0.02, 0.274, r.z1 + 0.002); lathe(R.ceramicSand, [[0, 0], [0.06, 0], [0.09, 0.08], [0.06, 0.2], [0.012, 0.24], [0, 0.24]], r.cx, 0.5, r.cz, 32); const g = new THREE.CylinderGeometry(0.12, 0.15, 0.2, 40, 1, true); g.translate(r.cx, 0.84, r.cz); add(R.shade, g); books(r.cx + 0.05, 0.5, r.cz + 0.08, 0.4, 1); }
  function ward(r) { const along = r.w > r.d; box(R.cabinet, r.x0, 0.06, r.z0, r.x1, 2.25, r.z1); box(R.blackMatte, r.x0 + 0.02, 0, r.z0 + 0.02, r.x1 - 0.02, 0.06, r.z1 - 0.02); const n = Math.max(1, Math.round((along ? r.w : r.d) / 0.5)); for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n; if (i) { if (along) box(R.cabinetDark, r.x0 + r.w * t0 - 0.002, 0.08, r.z0 - 0.002, r.x0 + r.w * t0 + 0.002, 2.22, r.z1 + 0.002); else box(R.cabinetDark, r.x0 - 0.002, 0.08, r.z0 + r.d * t0 - 0.002, r.x1 + 0.002, 2.22, r.z0 + r.d * t0 + 0.002); } const hp = i % 2 ? t0 + 0.04 : t1 - 0.04; if (along) { box(R.blackMetal, r.x0 + r.w * hp - 0.006, 0.9, r.z1, r.x0 + r.w * hp + 0.006, 1.4, r.z1 + 0.02); box(R.blackMetal, r.x0 + r.w * hp - 0.006, 0.9, r.z0 - 0.02, r.x0 + r.w * hp + 0.006, 1.4, r.z0); } else { box(R.blackMetal, r.x1, 0.9, r.z0 + r.d * hp - 0.006, r.x1 + 0.02, 1.4, r.z0 + r.d * hp + 0.006); box(R.blackMetal, r.x0 - 0.02, 0.9, r.z0 + r.d * hp - 0.006, r.x0, 1.4, r.z0 + r.d * hp + 0.006); } } }
  function desk(r, face) { rb(R.oak, r.cx, 0.745, r.cz, r.w, 0.03, r.d, 0.008, {}, 2); legs(R.blackMetal, [[r.x0 + 0.05, r.z0 + 0.05], [r.x1 - 0.05, r.z0 + 0.05], [r.x0 + 0.05, r.z1 - 0.05], [r.x1 - 0.05, r.z1 - 0.05]], 0, 0.73, 0.012); const [fx, fz] = DIR[face] || [0, 1]; chair(r.cx - fx * 0.55, r.cz - fz * 0.55, face, R.boucle); const mx = r.cx + fx * Math.min(r.w, r.d) * 0.22, mz = r.cz + fz * Math.min(r.w, r.d) * 0.22; rb(R.screen, mx, 1.02, mz, fx ? 0.02 : 0.6, 0.36, fz ? 0.02 : 0.6, 0.006, {}, 2); cyl(R.steel, mx, 0.84, mz, 0.015, 0.015, 0.2, 10); rb(R.steel, mx, 0.765, mz, 0.16, 0.012, 0.12, 0.004); vase(r.cx - fx * 0.0 + (fz ? r.w * 0.35 : 0), 0.76, r.cz + (fx ? r.d * 0.35 : 0), 0.7, R.ceramic); }
  function plantAt(src, px, pz, h, ry = 0, y = 0) { const o = src.clone(true); const b = new THREE.Box3().setFromObject(src), sz = b.getSize(V()); const k = h / sz.y; o.scale.setScalar(k); o.position.set(X(px), y - b.min.y * k, Z(pz)); o.rotation.y = ry; o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); group.add(o); return o; }
  function floorLamp(px, pz) { const x = X(px), z = Z(pz); cyl(R.blackMetal, x, 0.015, z, 0.16, 0.17, 0.03, 40); cyl(R.blackMetal, x, 0.8, z, 0.01, 0.01, 1.55, 10); const g = new THREE.SphereGeometry(0.2, 40, 20, 0, TAU, 0, Math.PI * 0.55); g.rotateZ(Math.PI); g.translate(x, 1.62, z); add(R.brass, g); sph(R.bulb, x, 1.55, z, 0.05, 0.05, 0.05, 16); }
  function art(m, x0, z0, x1, z1, y0, y1, nx, nz) { // framed print on a wall, normal (nx,nz) points into the room
    const g = new THREE.PlaneGeometry(Math.hypot(x1 - x0, z1 - z0) - 0.06, y1 - y0 - 0.06); g.rotateY(Math.atan2(nx, nz)); g.translate((x0 + x1) / 2 + nx * 0.031, (y0 + y1) / 2, (z0 + z1) / 2 + nz * 0.031); add(m, g, true);
    const wdt = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(nx, nz); rb(R.blackMatte, (x0 + x1) / 2 + nx * 0.015, (y0 + y1) / 2, (z0 + z1) / 2 + nz * 0.015, wdt, y1 - y0, 0.03, 0.004, { ry }, 2);
  }

  // place everything listed in the plan
  for (const [t, x0, y0, x1, y1, o] of E2.furniture) {
    if (C.ABO && C.ABO.has(t)) continue; // scanned products live in their own group (abo.js)
    const r = rect(x0, y0, x1, y1); if (t !== 'umbrella' && (r.w < 0.05 || r.d < 0.05)) continue;
    const outside = E2.zones.deck.some(([a, b, c, d]) => (x0 + x1) / 2 > a && (x0 + x1) / 2 < c && (y0 + y1) / 2 > b && (y0 + y1) / 2 < d);
    switch (t) {
      case 'rug': rug(r, R.rugLiving, 0.4); break;
      case 'sofa': sofa(r, o); break;
      case 'osofa': rug(rect(x0 - 10, y0 - 10, x1 + 10, y1 + 70), R.rugOut); sofa(r, o, R.linenGrey, true); break;
      case 'arm': if (outside) { const [fx, fz] = DIR[o]; const ry = Math.atan2(fx, fz); if (put('wicker', r.cx, r.cz, ry, 0.84, 0.8, 0.84)) break; rb(R.teak, r.cx, 0.2, r.cz, 0.66, 0.06, 0.66, 0.01, { ry }, 2); rb(R.linenGrey, r.cx, 0.33, r.cz, 0.6, 0.14, 0.6, 0.05, { ry }, 4); rb(R.rope, r.cx - fx * 0.27, 0.58, r.cz - fz * 0.27, fx ? 0.06 : 0.62, 0.5, fz ? 0.06 : 0.62, 0.02, {}, 2); legs(R.teak, [[r.cx + 0.26, r.cz + 0.26], [r.cx - 0.26, r.cz + 0.26], [r.cx + 0.26, r.cz - 0.26], [r.cx - 0.26, r.cz - 0.26]], 0, 0.2, 0.02); } else tubChair(r.cx, r.cz, o, R.ribbed, R.boucle, Math.min(0.8, Math.min(r.w, r.d) + 0.1)); break;
      case 'coffee': coffee(r); break;
      case 'otable': for (let i = 0; i < 9; i++) box(R.teak, r.x0 + i * r.w / 9 + 0.01, 0.34, r.z0, r.x0 + (i + 1) * r.w / 9 - 0.01, 0.38, r.z1); legs(R.teak, [[r.x0 + 0.05, r.z0 + 0.05], [r.x1 - 0.05, r.z0 + 0.05], [r.x0 + 0.05, r.z1 - 0.05], [r.x1 - 0.05, r.z1 - 0.05]], 0, 0.34, 0.02); bowlFruit(r.cx, 0.38, r.cz, 0.8); break;
      case 'rtable': cyl(R.concrete, r.cx, 0.24, r.cz, r.w / 2.2, r.w / 2.6, 0.48, 40); cyl(R.concrete, r.cx, 0.49, r.cz, r.w / 2, r.w / 2, 0.03, 40); vase(r.cx, 0.505, r.cz, 0.7, R.ceramic); break;
      case 'tv': if (C.ABO) { box(R.blackMatte, r.x0 + 0.05, 1.02, r.z1 - 0.045, r.x1 - 0.05, 1.62, r.z1 - 0.005); box(R.screen, r.x0 + 0.07, 1.04, r.z1 - 0.05, r.x1 - 0.07, 1.6, r.z1 - 0.044); box(R.consoleOak, r.x0, 0.42, r.z1 - 0.3, r.x1, 0.47, r.z1 - 0.005); } else tvWall(r); break;
      case 'dining': dining(r, o, outside); break;
      case 'island': island(r); break;
      case 'counter': counter(r, o); break;
      case 'fridge': box(R.cabinet, r.x0, 0.06, r.z0, r.x1, 2.25, r.z1); box(R.blackMetal, r.x0 + 0.05, 0.9, r.z0 - 0.02, r.x0 + 0.062, 1.6, r.z0); break;
      case 'tub': { const g = lathe(R.ceramic, [[0, 0], [0.3, 0], [0.36, 0.1], [0.38, 0.52], [0.4, 0.56], [0.36, 0.57], [0.33, 0.2], [0.26, 0.12], [0, 0.12]], 0, 0, 0, 64, {}); g.scale(r.w / 0.8, 1, r.d / 0.8); g.translate(r.cx, 0, r.cz); cyl(R.blackMetal, r.x1 + 0.12, 0.45, r.cz, 0.015, 0.015, 0.9, 12); tor(R.blackMetal, r.x1 + 0.12, 0.9, r.cz - 0.08, 0.08, 0.012, { rz: 0 }, Math.PI); break; }
      case 'toilet': { // wall-hung pan, soft-close seat, slim flush plate
        const [hx, hz] = DIR[o]; const ry = Math.atan2(-hx, -hz); const wx = r.cx + hx * (r.w / 2), wz = r.cz + hz * (r.d / 2); // wall behind the pan
        const at = d => [wx - hx * d, wz - hz * d]; const ax = hx !== 0;
        const pan = new THREE.CylinderGeometry(0.18, 0.15, 0.22, 48); pan.scale(ax ? 1.5 : 1, 1, ax ? 1 : 1.5); let [x, z] = at(0.3); pan.translate(x, 0.3, z); add(R.ceramic, pan, true);
        rb(R.ceramic, ...[at(0.1)].map(([a, b]) => [a, 0.31, b])[0], ax ? 0.2 : 0.36, 0.24, ax ? 0.36 : 0.2, 0.06, {}, 4);
        const seat = new THREE.CylinderGeometry(0.185, 0.185, 0.025, 48); seat.scale(ax ? 1.5 : 1, 1, ax ? 1 : 1.5); seat.translate(x, 0.425, z); add(R.ceramic, seat, true);
        [x, z] = at(0.012); rb(R.ceramic, x, 1.0, z, ax ? 0.012 : 0.24, 0.15, ax ? 0.24 : 0.012, 0.01, {}, 2); [x, z] = at(0.02); rb(R.steel || R.blackMetal, x, 1.0, z, ax ? 0.006 : 0.07, 0.1, ax ? 0.07 : 0.006, 0.004, {}, 2);
        break; }
      case 'vanity': rb(R.oak, r.cx, 0.62, r.cz, r.w, 0.36, r.d, 0.012, {}, 2); box(R.marble, r.x0, 0.8, r.z0, r.x1, 0.83, r.z1); for (const t2 of [0.3, 0.7]) { lathe(R.ceramic, [[0, 0], [0.16, 0], [0.2, 0.1], [0.19, 0.12], [0.15, 0.03], [0, 0.03]], r.x0 + r.w * t2, 0.83, r.cz - 0.02, 48); cyl(R.blackMetal, r.x0 + r.w * t2, 1.08, r.z1 - 0.03, 0.012, 0.012, 0.16, 10); box(R.blackMetal, r.x0 + r.w * t2 - 0.01, 1.14, r.z1 - 0.15, r.x0 + r.w * t2 + 0.01, 1.16, r.z1 - 0.03); } box(R.steel, r.x0 + 0.1, 1.2, r.z1 - 0.02, r.x1 - 0.1, 1.95, r.z1 - 0.005); box(R.led, r.x0 + 0.08, 1.18, r.z1 - 0.012, r.x1 - 0.08, 1.2, r.z1 - 0.004); break;
      case 'sink': rb(R.oak, r.cx, 0.62, r.cz, r.w, 0.36, r.d, 0.012, {}, 2); lathe(R.ceramic, [[0, 0], [0.13, 0], [0.16, 0.1], [0.15, 0.12], [0.12, 0.03], [0, 0.03]], r.cx, 0.8, r.cz, 40); break;
      case 'shower': if (o === 'l') { box(R.glassShower, r.x0 - 0.005, 0, r.z0, r.x0 + 0.005, 2.05, r.z1); box(R.blackMetal, r.x0 - 0.012, 2.03, r.z0, r.x0 + 0.012, 2.05, r.z1); box(R.blackMetal, r.x0 - 0.012, 0, r.z1 - 0.02, r.x0 + 0.012, 2.05, r.z1); } else { box(R.glassShower, r.x0, 0, r.z0 - 0.005, r.x1, 2.05, r.z0 + 0.005); box(R.blackMetal, r.x0, 2.03, r.z0 - 0.012, r.x1, 2.05, r.z0 + 0.012); box(R.blackMetal, r.x0, 0, r.z0 - 0.012, r.x0 + 0.02, 2.05, r.z0 + 0.012); } box(R.stoneDark, r.x0, 0.002, r.z0, r.x1, 0.012, r.z1); cyl(R.blackMetal, r.cx, 2.1, r.cz + 0.1, 0.15, 0.15, 0.012, 40); cyl(R.blackMetal, r.cx, 2.15, r.z1 - 0.05, 0.01, 0.01, 0.12, 8); box(R.blackMetal, r.x1 - 0.12, 1.0, r.z1 - 0.02, r.x1 - 0.06, 1.1, r.z1); break;
      case 'washer': rb(R.ceramic, r.cx, 0.43, r.cz, r.w - 0.02, 0.85, r.d, 0.02, {}, 3); cyl(R.blackMetal, r.cx, 0.45, r.z1 + 0.003, 0.16, 0.16, 0.012, 40, { rx: Math.PI / 2 }); cyl(R.glassSmoke, r.cx, 0.45, r.z1 + 0.01, 0.13, 0.13, 0.01, 40, { rx: Math.PI / 2 }); break;
      case 'bed1': rug(rect(x0 - 15, y0 - 12, x1 + 15, y1 + 12), R.rugBed); bed(r, o, false); break;
      case 'bed2': rug(rect(x0 - 18, y0 + 20, x1 + 18, y1 + 25), R.rugBed); bed(r, o, true); break;
      case 'night': night(r); break;
      case 'ward': ward(r); break;
      case 'desk': desk(r, o); break;
      case 'lounger': rb(R.teak, r.cx, 0.2, r.cz, r.w, 0.06, r.d, 0.01, {}, 2); legs(R.teak, [[r.x0 + 0.06, r.z0 + 0.06], [r.x1 - 0.06, r.z0 + 0.06], [r.x0 + 0.06, r.z1 - 0.06], [r.x1 - 0.06, r.z1 - 0.06]], 0, 0.18, 0.02); if (o === 'v') { rb(R.linenWhite, r.cx, 0.28, r.cz + 0.08, r.w - 0.04, 0.1, r.d - 0.3, 0.04, {}, 4); rb(R.linenWhite, r.cx, 0.4, r.z0 + 0.3, r.w - 0.06, 0.09, 0.45, 0.04, { rx: -0.55 }, 4); pillow(R.linenSand, r.cx, 0.55, r.z0 + 0.26, 0.36, 0.26, 0.1, 0, 0.3); } else { rb(R.linenWhite, r.cx + 0.08, 0.28, r.cz, r.w - 0.3, 0.1, r.d - 0.04, 0.04, {}, 4); rb(R.linenWhite, r.x0 + 0.3, 0.4, r.cz, 0.45, 0.09, r.d - 0.06, 0.04, { rz: 0.55 }, 4); pillow(R.linenBlue, r.x0 + 0.26, 0.55, r.cz, 0.36, 0.26, 0.1, Math.PI / 2, 0.3); } break;
      case 'umbrella': { const cx = X(x0), cz = Z(y0); cyl(R.teak, cx, 1.25, cz, 0.025, 0.025, 2.5, 12); const g = new THREE.ConeGeometry(1.05, 0.4, 16, 1, true); g.translate(cx, 2.45, cz); add(R.canvas, g); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; cyl(R.teak, cx + Math.cos(a) * 0.5, 2.43, cz + Math.sin(a) * 0.5, 0.008, 0.008, 1.05, 6, { rz: Math.PI / 2 - 0.33, ry: -a }); } cyl(R.concrete, cx, 0.05, cz, 0.3, 0.32, 0.1, 32); break; }
      case 'pouf': { const d = Math.min(r.w, r.d); rb(R.pouf, r.cx, 0.2, r.cz, d, 0.4, d, 0.17, {}, 8); break; }
      case 'rcoffee': { const rr = Math.min(r.w, r.d) / 2; cyl(R.glassSmoke, r.cx, 0.4, r.cz, rr, rr, 0.016, 64); box(R.glassSmoke, r.cx - rr * 0.62, 0, r.cz - 0.006, r.cx + rr * 0.62, 0.392, r.cz + 0.006); box(R.glassSmoke, r.cx - 0.006, 0, r.cz - rr * 0.62, r.cx + 0.006, 0.392, r.cz + rr * 0.62); books(r.cx - 0.1, 0.41, r.cz + 0.08, 0.2, 2); books(r.cx + 0.16, 0.41, r.cz - 0.1, -0.3, 1); break; }
      case 'tvwall': { // render 2: white ribbed wall, a floating light-oak panel with a warm LED halo, TV, long floating oak console
        const [fx] = DIR[o]; const w0 = fx > 0 ? r.x0 : r.x1, sg = fx > 0 ? 1 : -1, z0 = r.z0 - 0.45, z1 = r.z1 + 0.45;
        box(R.fluteWhite, w0, 0, z0 - 0.5, w0 + sg * 0.02, CEIL_H, z1 + 0.5); for (let z = z0 - 0.5 + 0.13; z < z1 + 0.5; z += 0.13) box(R.fluteGroove, w0 + sg * 0.02, 0, z - 0.003, w0 + sg * 0.022, CEIL_H, z + 0.003);
        const top = CEIL_H - 0.42; box(R.tvVeneer, w0 + sg * 0.05, 0.1, z0, w0 + sg * 0.09, top, z1);
        box(R.ledWarm, w0 + sg * 0.03, top - 0.02, z0 + 0.04, w0 + sg * 0.045, top + 0.012, z1 - 0.04); for (const z of [z0 - 0.012, z1]) box(R.ledWarm, w0 + sg * 0.03, 0.7, z, w0 + sg * 0.045, top - 0.02, z + 0.012);
        if (!C.ABO) { box(R.consoleOak, w0 + sg * 0.09, 0.3, z0 + 0.12, w0 + sg * 0.5, 0.62, z1 - 0.12); box(R.ledWarm, w0 + sg * 0.1, 0.296, z0 + 0.18, w0 + sg * 0.48, 0.3, z1 - 0.18); }
        box(R.screen, w0 + sg * 0.09, 1.08, r.cz - 0.85, w0 + sg * 0.12, 2.02, r.cz + 0.85); books(w0 + sg * 0.32, 0.585, r.z1 + 0.1, 0.2, 2); lathe(R.blackMatte, [[0, 0], [0.02, 0], [0.02, 0.32], [0, 0.32]], w0 + sg * 0.25, 0.585, r.z0 - 0.05, 12); lathe(R.blackMatte, [[0, 0], [0.02, 0], [0.02, 0.22], [0, 0.22]], w0 + sg * 0.3, 0.585, r.z0 + 0.05, 12); break; }
      case 'oven': box(R.cabinet, r.x0, 0.06, r.z0, r.x1, 2.4, r.z1); box(R.screen, r.x0 - 0.01, 0.9, r.z0 + 0.05, r.x0, 1.5, r.z1 - 0.05); box(R.steel, r.x0 - 0.03, 1.43, r.z0 + 0.1, r.x0 - 0.01, 1.45, r.z1 - 0.1); break;
      case 'boiler': cyl(R.ceramic, r.cx, 1.45, r.cz, r.w / 2, r.w / 2, 1.0, 40); break;
      case 'acu': box(R.cabinet, r.x0, 0.1, r.z0, r.x1, 0.85, r.z1); for (let y = 0.2; y < 0.8; y += 0.04) box(R.blackMatte, r.x0 - 0.003, y, r.z0 + 0.05, r.x0, y + 0.015, r.z1 - 0.05); break;
      case 'shelf': for (let x = r.x0; x < r.x1 + 0.6; x += 0.07) box(R.teak, x, 0, r.z0 - 0.2, x + 0.045, 1.8, r.z0 - 0.17); break;
    }
  }
  // decor that the plan does not draw (positions live in the data file)
  const DEC = E2.decor || {};
  (DEC.floorLamps || []).forEach(([x, y]) => floorLamp(x, y));
  (DEC.art || []).forEach(([k, x0, y0, x1, y1, ya, yb, nx, ny]) => art(R[k], X(x0), Z(y0), X(x1), Z(y1), ya, yb, nx, ny));
  // white fluted wall panelling (render 1: the wall beside the kitchen and behind the dining nook)
  (DEC.flutes || []).forEach(([x0, y0, x1, y1, nx, ny]) => { const a = V(X(x0), 0, Z(y0)), b = V(X(x1), 0, Z(y1)), len = a.distanceTo(b), n = Math.round(len / 0.045);
    for (let i = 0; i < n; i++) { const p = a.clone().lerp(b, (i + 0.5) / n); const g = new THREE.CylinderGeometry(0.022, 0.022, CEIL_H - 0.02, 10, 1, false, 0, Math.PI); g.rotateY(Math.atan2(nx, ny) - Math.PI / 2); g.translate(p.x + nx * 0.004, CEIL_H / 2, p.z + ny * 0.004); add(R.fluteWhite, g); } });

  // glass balustrade with a slim black top rail (spec: aluminium railing combined with glass)
  for (const [x0, y0, x1, y1] of E2.rails) { const a = V(X(x0), 0, Z(y0)), b = V(X(x1), 0, Z(y1)); const len = a.distanceTo(b); const ry = -Math.atan2(b.z - a.z, b.x - a.x);
    let g = new THREE.BoxGeometry(len, 1.0, 0.012); g.rotateY(ry); g.translate((a.x + b.x) / 2, 0.55, (a.z + b.z) / 2); add(R.glass, g);
    g = new THREE.BoxGeometry(len + 0.03, 0.045, 0.045); g.rotateY(ry); g.translate((a.x + b.x) / 2, 1.07, (a.z + b.z) / 2); add(R.blackMetal, g);
    g = new THREE.BoxGeometry(len + 0.03, 0.05, 0.05); g.rotateY(ry); g.translate((a.x + b.x) / 2, 0.03, (a.z + b.z) / 2); add(R.blackMetal, g); }

  // ceiling details and curtains: only meaningful at eye level, where the ceiling is shown
  target = povGroup;
  { // linear LED profiles over the living room and recessed downlights everywhere else
    for (const [x0, x1, y] of (DEC.tracks || [])) { box(R.blackMetal, X(x0), CEIL_H - 0.04, Z(y) - 0.025, X(x1), CEIL_H, Z(y) + 0.025); for (let x = x0 + 12; x < x1 - 18; x += 34) box(R.led, X(x), CEIL_H - 0.041, Z(y) - 0.012, X(x + 20), CEIL_H - 0.039, Z(y) + 0.012); }
    for (const [px, py] of (DEC.downlights || [])) cyl(R.led, X(px), CEIL_H - 0.005, Z(py), 0.05, 0.05, 0.01, 24);
  }
  // sheer + linen curtains stacked at the ends of each window wall
  const inside = (px, py) => [...E2.zones.oak, ...E2.zones.tile, ...E2.zones.wet].some(([a, b, c, d]) => px > a && px < c && py > b && py < d);
  for (const [x0, y0, x1, y1] of E2.glass) {
    const horiz = Math.abs(y1 - y0) < 1, mx = (x0 + x1) / 2, my = (y0 + y1) / 2; const side = horiz ? (inside(mx, my + 12) ? 1 : -1) : (inside(mx + 12, my) ? 1 : -1);
    if (!inside(horiz ? mx : mx + side * 12, horiz ? my + side * 12 : my)) continue;
    const len = Math.hypot(x1 - x0, y1 - y0) * S; if (len < 0.9) continue;
    for (const end of [0, 1]) for (const [w, m, off] of [[0.55, R.curtain, 0.12], [0.32, R.curtainLinen, 0.2]]) {
      const segs = 40, g = new THREE.PlaneGeometry(w, CEIL_H - 0.08, segs, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) / w * Math.PI * 9) * 0.035); g.computeVertexNormals();
      const t = end ? 1 - (w / 2 + 0.03) / len : (w / 2 + 0.03) / len; const px = X(x0 + (x1 - x0) * t), pz = Z(y0 + (y1 - y0) * t);
      if (horiz) g.translate(0, 0, 0); else g.rotateY(Math.PI / 2);
      g.translate(px + (horiz ? 0 : side * off), (CEIL_H - 0.08) / 2 + 0.02, pz + (horiz ? side * off : 0)); add(m, g);
    }
    if (horiz) box(R.blackMetal, X(x0), CEIL_H - 0.06, Z(y0) + side * 0.16 - 0.01, X(x1), CEIL_H - 0.04, Z(y0) + side * 0.16 + 0.01); else box(R.blackMetal, X(x0) + side * 0.16 - 0.01, CEIL_H - 0.06, Z(y0), X(x0) + side * 0.16 + 0.01, CEIL_H - 0.04, Z(y1));
  }
  target = group;
  bake();

  // plants (real scanned models)
  E2.plants.forEach(([x, y, sc = 1, tall = 0], i) => plantAt(tall ? plantTree : sc < 0.7 ? plantSmall : plantLeafy, x, y, tall ? 1.6 * sc : sc < 0.7 ? 0.45 : 0.9 * sc, i * 1.7));

  // ---------------------------------------------------------------- 360° view of the coast + sky, seen at eye level
  const view = (() => {
    const Rr = 175, top = 15.2 * Math.PI / 180, bot = -34.4 * Math.PI / 180, uW = 0.2778, rs = 160, hs = 40;
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= hs; j++) { const th = bot + (top - bot) * j / hs; for (let i = 0; i <= rs; i++) { const u = i / rs, a = Math.PI + TAU * (u - uW); pos.push(Rr * Math.cos(a), C.EYE + Rr * Math.tan(th), Rr * Math.sin(a)); uv.push(u, j / hs); } }
    for (let j = 0; j < hs; j++) for (let i = 0; i < rs; i++) { const a = j * (rs + 1) + i, b = a + rs + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const ac = document.createElement('canvas'); ac.width = 2; ac.height = 128; const ag = ac.getContext('2d'); const agr = ag.createLinearGradient(0, 0, 0, 128); agr.addColorStop(0, '#000'); agr.addColorStop(0.22, '#fff'); agr.addColorStop(1, '#fff'); ag.fillStyle = agr; ag.fillRect(0, 0, 2, 128);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: T.pano, alphaMap: new THREE.CanvasTexture(ac), transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false, fog: false })); m.renderOrder = -10; m.frustumCulled = false; m.visible = false; m.position.set(0, 0, 0); C.scene.add(m); return m;
  })();
  const skyBg = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 512; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#8db3dc'); gr.addColorStop(0.3, '#adc8e4'); gr.addColorStop(0.46, '#bacde4'); gr.addColorStop(0.5, '#d4cec8'); gr.addColorStop(1, '#9a978f'); g.fillStyle = gr; g.fillRect(0, 0, 4, 512); const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();

  // ---------------------------------------------------------------- lighting + post for this mode
  env.mapping = THREE.EquirectangularReflectionMapping;
  { // the sky HDRI carries its own sun; clip it so the scene keeps one sun (the directional light) and no double shadows
    const d = env.image.data; for (let i = 0; i < d.length; i += 4) { const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; if (l > 3) { const k = 3 / l; d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; } } env.needsUpdate = true; }
  const envTex = C.pmrem.fromEquirectangular(env).texture;
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.35, 0.5, 2.6); bloom.enabled = false;
  { const passes = C.composer.passes; C.composer.insertPass(bloom, passes.length - 1); }

  // ---------------------------------------------------------------- progressive path tracing while the view is still
  // Raster while moving; once the camera rests, a GPU path tracer (real global illumination, soft light through the
  // windows, glossy reflections) refines the frame in place and fades over the raster image.
  const ptCfg = { on: /[?&]pt=1/.test(location.search), exposure: 1.6, env: 2.4, envEye: 0.5, portal: 3.2, denoise: 4.5, target: mobile ? 160 : 500, scale: mobile ? 0.4 : (C.DPR > 1.5 ? 0.45 : 0.65), bounces: mobile ? 4 : 6 };
  // invisible sky 'portals' in every window opening (camera rays never see them): soft daylight with little noise
  const portals = [];
  for (const [x0, y0, x1, y1] of E2.glass) {
    const horiz = Math.abs(y1 - y0) < 1, mx = (x0 + x1) / 2, my = (y0 + y1) / 2; const side = horiz ? (inside(mx, my + 12) ? 1 : -1) : (inside(mx + 12, my) ? 1 : -1);
    if (!inside(horiz ? mx : mx + side * 12, horiz ? my + side * 12 : my)) continue;
    const len = Math.hypot(x1 - x0, y1 - y0) * S; if (len < 0.6) continue;
    const h = CEIL_H - 0.2, l = new THREE.RectAreaLight(0xe6eef8, 1, len - 0.1, h); const cx = X(mx) + (horiz ? 0 : side * 0.06), cz = Z(my) + (horiz ? side * 0.06 : 0);
    l.position.set(cx, h / 2 + 0.05, cz); l.lookAt(cx + (horiz ? 0 : side), h / 2 + 0.05, cz + (horiz ? side : 0)); l.updateMatrixWorld(); l.userData.n = [horiz ? 0 : side, horiz ? side : 0]; l.userData.half = (len - 0.1) / 2; portals.push(l); }
  // only the windows that can light what the camera sees: fewer dead light samples, far less noise
  const near = () => { const cp = C.camera.position; return portals.filter(l => { const dx = cp.x - l.position.x, dz = cp.z - l.position.z; const d = Math.max(0, Math.hypot(dx, dz) - l.userData.half); return d < 7.5 && dx * l.userData.n[0] + dz * l.userData.n[1] > -0.2; }); };
  let portalKey = '';
  let PT = null, ptLoad = null, ptEq = null, ptSig = '', ptBusy = false, still = 0, ptShown = false, ptCam = '', ptErr = false;
  const camKey = () => { const e = C.camera.matrixWorld.elements, p = C.camera.projectionMatrix.elements; let k = ''; for (let i = 0; i < 16; i++) k += e[i].toFixed(4) + ','; return k + p[0].toFixed(4) + p[5].toFixed(4) + p[8].toFixed(4) + p[9].toFixed(4); };
  function ptLoadLib() {
    return ptLoad ||= (async () => {
      const [{ WebGLPathTracer, DenoiseMaterial }, { MeshBVH }, { FullScreenQuad }, eq] = await Promise.all([import('three-gpu-pathtracer'), import('three-mesh-bvh'), import('three/addons/postprocessing/Pass.js'), tl.loadAsync(BASE + 'pano_eq.jpg')]);
      const dmat = new DenoiseMaterial({ transparent: true }), dq = new FullScreenQuad(dmat);
      eq.mapping = THREE.EquirectangularReflectionMapping; eq.colorSpace = THREE.SRGBColorSpace; ptEq = eq;
      const t = new WebGLPathTracer(C.renderer);
      Object.assign(t, { renderToCanvas: true, rasterizeScene: true, minSamples: 2, fadeDuration: 700, renderDelay: 0, dynamicLowRes: false, renderScale: ptCfg.scale, bounces: ptCfg.bounces, filterGlossyFactor: 0.85, multipleImportanceSampling: true });
      t.tiles.set(mobile ? 3 : 2, mobile ? 3 : 2); t.textureSize.set(1024, 1024);
      t.rasterizeSceneCallback = () => C.composer.render();
      // edge-aware denoise that relaxes as samples accumulate
      t.renderToCanvasCallback = (target, r, quad) => { const e = r.toneMappingExposure, ac = r.autoClear; r.toneMappingExposure = e * ptCfg.exposure; r.autoClear = false;
        const qm = quad.material; dmat.map = target.texture; dmat.opacity = qm.opacity; dmat.blending = qm.blending; dmat.premultipliedAlpha = qm.premultipliedAlpha;
        dmat.sigma = Math.max(0.5, ptCfg.denoise * Math.pow(0.993, t.samples)); dmat.kSigma = 1; dmat.threshold = 0.035; dq.render(r);
        r.autoClear = ac; r.toneMappingExposure = e; };
      // the BVH is built in a worker so the page never freezes
      const w = new Worker(BASE + 'bvh.worker.js', { type: 'module' });
      t.setBVHWorker({ generate(geometry, options = {}) { return new Promise((res, rej) => {
        w.onerror = e => rej(new Error(e.message || 'bvh worker'));
        w.onmessage = ({ data }) => { if (data.error) rej(new Error(data.error)); else if (data.serialized) { const { serialized, position } = data; const bvh = MeshBVH.deserialize(serialized, geometry, { setIndex: false });
          geometry.attributes.position.array = position; if (serialized.index) { if (geometry.index) geometry.index.array = serialized.index; else geometry.setIndex(new THREE.BufferAttribute(serialized.index, 1, false)); }
          geometry.boundingBox = bvh.getBoundingBox(new THREE.Box3()); res(bvh); } };
        const index = geometry.index ? geometry.index.array : null, position = geometry.attributes.position.array;
        w.postMessage({ index, position, options: { ...options, onProgress: null, includedProgressCallback: false, groups: [...geometry.groups] } }, [position.buffer, ...(index ? [index.buffer] : [])]);
      }); } });
      // during an async scene build the library refreshes materials/environment on completion; we do that ourselves inside ptState
      const ue = t.updateEnvironment.bind(t), um = t.updateMaterials.bind(t), ul = t.updateLights.bind(t); t.updateEnvironment = () => { if (!ptBuilding) ue(); }; t.updateMaterials = () => { if (!ptBuilding) um(); }; t.updateLights = () => { if (!ptBuilding) ul(); }; t._ue = ue; t._um = um; t._ul = ul;
      PT = t;
    })().catch(e => { console.warn('path tracer unavailable', e); ptErr = true; });
  }
  // swap in what the path tracer should see (equirect view + raw HDR sky, no fake ceiling glow), run fn, swap back
  function ptState(fn) {
    const sc = C.scene, bg = sc.background, en = sc.environment, ei = sc.environmentIntensity, vv = view.visible, ce = R.ceiling.emissiveIntensity;
    const fake = []; sc.children.forEach(o => { if (o.isMesh && o.visible && (o.material.isShadowMaterial || (o.material.isMeshBasicMaterial && o.material.transparent))) { fake.push(o); o.visible = false; } });
    sc.traverse(o => { if (o.isMesh && o.visible && (o.material === R.glass || o.material === M.glass)) { fake.push(o); o.visible = false; } });  // open apertures: the sky lights the rooms
    const em = [[R.led, 1.4], [R.ledWarm, 1.4], [R.bulb, 1.6], [R.shade, 0.25]].map(([m, v]) => { const o = m.emissiveIntensity; m.emissiveIntensity = v; return [m, o]; });
    const rv = C.rim.visible; C.rim.visible = false; sc.environmentIntensity = C.P.on ? ptCfg.envEye : ptCfg.env; const use = C.P.on ? near() : [], usePortals = use.length > 0; portalKey = use.map(l => l.id).join(','); use.forEach(l => { l.intensity = ptCfg.portal; sc.add(l); });
    view.visible = false; sc.background = C.P.on ? ptEq : null; sc.environment = env; R.ceiling.emissiveIntensity = 0;
    try { return fn(); } finally { sc.background = bg; sc.environment = en; sc.environmentIntensity = ei; view.visible = vv; R.ceiling.emissiveIntensity = ce; fake.forEach(o => o.visible = true); em.forEach(([m, v]) => m.emissiveIntensity = v); use.forEach(l => sc.remove(l)); C.rim.visible = rv; }
  }
  let ptBuilding = false;
  function ptBuild(sig) {
    ptBuilding = true; const t0 = performance.now();
    const job = ptState(() => PT.setSceneAsync(C.scene, C.camera));
    { // degenerate normals / tangents (zero-area UVs, collapsed lathe poles) would poison pixels with NaN forever: repair them
      const A = PT._generator.geometry.attributes; let bad = 0;
      const fix = (at, def) => { if (!at) return; const a = at.array, k = at.itemSize; for (let i = 0; i < a.length; i += k) { let ok = true, l = 0; for (let c = 0; c < Math.min(3, k); c++) { const v = a[i + c]; if (!Number.isFinite(v)) ok = false; else l += v * v; } if (!ok || l < 1e-12) { bad++; for (let c = 0; c < k; c++) a[i + c] = def[c]; } else if (k === 4 && !Number.isFinite(a[i + 3])) a[i + 3] = 1; } };
      fix(A.normal, [0, 1, 0]); fix(A.tangent, [1, 0, 0, 1]); if (A.uv) { const u = A.uv.array; for (let i = 0; i < u.length; i++) if (!Number.isFinite(u[i])) { u[i] = 0; bad++; } }
      console.log('[pt] repaired attributes', bad); }
    job.then(() => { ptState(() => { PT._um(); PT._ue(); PT._ul(); }); ptSig = sig; ptShown = false; console.log('[pt] scene built', sig, Math.round(performance.now() - t0) + 'ms'); },
      e => { console.warn('path tracer build failed', e); ptErr = true; }).finally(() => { ptBuilding = false; C.invalidate(); });
  }
  // small status pill so visitors know the picture keeps refining while they stay still
  const pill = document.createElement('div'); pill.dir = 'rtl';
  pill.style.cssText = 'position:absolute;left:14px;bottom:14px;z-index:5;pointer-events:none;font:500 12px/1 Heebo,system-ui,sans-serif;color:#fff;background:rgba(13,17,25,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.16);border-radius:99px;padding:7px 12px;opacity:0;transition:opacity .4s;display:flex;gap:8px;align-items:center';
  (C.renderer.domElement.parentElement || document.body).appendChild(pill);
  let pillTxt = ''; const setPill = t => { if (t === pillTxt) return; pillTxt = t; if (t) pill.textContent = t; pill.style.opacity = t ? '1' : '0'; };
  function ptHide() { ptShown = false; ptBusy = false; still = 0; if (PT) PT.reset(); setPill(''); }
  // returns true when it drew the frame itself
  function ptRender(moving, dt) {
    if (!ptCfg.on || ptErr) { ptBusy = false; return false; }
    const k = camKey(); if (k !== ptCam) { ptCam = k; still = 0; if (ptShown && PT) PT.reset(); ptShown = false; }
    if (moving || C.hl > 0.01) { still = 0; ptBusy = false; setPill(''); return false; }
    still += dt; ptBusy = true;
    if (still < 0.35) return false;
    if (!PT) { ptLoadLib(); setPill('מכין רינדור פוטוריאליסטי…'); return false; }
    const sig = [C.P.on ? 1 : 0, C.P.overK > 0.5 ? 1 : 0, C.layers.walls.scale.y.toFixed(2), C.ceil.visible ? 1 : 0, povGroup.visible ? 1 : 0].join('|');
    if (ptBuilding) { setPill('מכין רינדור פוטוריאליסטי…'); return false; }
    if (sig !== ptSig) { ptBuild(sig); return false; }
    if (!ptShown) { if (C.P.on && near().map(l => l.id).join(',') !== portalKey) ptState(() => PT._ul()); PT.updateCamera(); ptShown = true; }
    PT.renderSample();
    if (PT.samples >= ptCfg.target) { ptBusy = false; setPill('✓ רינדור פוטוריאליסטי'); setTimeout(() => { if (!ptBusy && pillTxt[0] === '✓') setPill(''); }, 2500); }
    else setPill(PT.isCompiling || PT.samples < 1 ? 'מכין רינדור פוטוריאליסטי…' : 'רינדור פוטוריאליסטי · ' + Math.round(100 * PT.samples / ptCfg.target) + '%');
    return true;
  }
  const swap = new Map([[M.oak, R.floor], [M.tile, R.marbleFloor], [M.tileDark, R.stoneDark], [M.deck, R.deck], [M.wall, R.plaster], [M.cap, R.plaster], [M.slab, R.plasterOut], [M.slabEdge, R.plasterOut], [M.frame, R.blackMetal], [M.glass, R.glass], [M.core, R.stone]]);
  const hideMats = new Set([M.railGlass, M.railTop]);
  const saved = { env: C.scene.environment, envI: C.scene.environmentIntensity, sunI: C.sun.intensity, sunC: C.sun.color.clone(), fillI: C.fill.intensity, rimI: C.rim.intensity, exp: C.renderer.toneMappingExposure, ceil: C.ceil.material };
  let on = false;
  // ---------------------------------------------------------------- baked lighting (Blender Cycles): sun + sky + bounces in one atlas
  // Architecture gets its diffuse light only from the atlas; sun glints and reflections stay real-time.
  const LM = { ok: false, eye: false };
  (async () => {
    if (C.ABO) return; // the bake still holds the shadows of the old furniture: light the restyled flat in real time
    try {
      const [g, t] = await Promise.all([gl.loadAsync(OWN + 'lm_arch.glb'), tl.loadAsync(OWN + 'lm.webp')]);
      t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.channel = 1; t.anisotropy = 4;
      const byKey = new Map(); [['base', C.layers.base], ['walls', C.layers.walls], ['ceil', C.ceil]].forEach(([n, grp]) => { let k = 0; grp.traverse(o => { if (o.isMesh) byKey.set(n + '_' + (k++), o); }); });
      const clones = new Map();
      const lmMat = m => { if (!m) return m; if (clones.has(m)) return clones.get(m); const c = m.clone(); c.lightMap = t; c.lightMapIntensity = LM_K; if (c.emissive) c.emissiveIntensity = 0;
        c.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>', '#ifdef USE_LIGHTMAP\n reflectedLight.directDiffuse = vec3( 0.0 );\n irradiance = texture2D( lightMap, vLightMapUv ).rgb * lightMapIntensity;\n iblIrradiance = vec3( 0.0 );\n#endif\n#include <lights_fragment_end>'); };
        c.customProgramCacheKey = () => 'lmbake'; clones.set(m, c); return c; };
      g.scene.traverse(n => { if (!n.isMesh || !n.name.startsWith('A_')) return; const o = byKey.get(n.name.slice(2)); if (!o) return;
        o.userData.gLM = n.geometry; o.userData.g0 = o.geometry; o.userData.lm = true; });
      LM.ok = true; LM.mat = lmMat; LM.clones = clones; if (on) apply(true);
    } catch (e) { console.warn('lightmap', e); }
  })();
  const LM_K = 4 * Math.PI * 4.3; // eye level exposes for the room, like the renders do
  function apply(v) {
      on = v; group.visible = v; C.layers.furn.visible = !v;
      [C.layers.base, C.layers.walls, C.ceil].forEach(L => L.traverse(o => { if (!o.isMesh) return; if (o.userData.m0 === undefined) o.userData.m0 = o.material; const sw = v ? (swap.get(o.userData.m0) || o.userData.m0) : o.userData.m0; const bake = v && LM.ok && LM.eye && o.userData.lm;
        if (o.userData.lm) o.geometry = bake ? o.userData.gLM : o.userData.g0; o.material = bake ? LM.mat(o === C.ceil ? R.ceiling : sw) : sw; if (o !== C.ceil) o.visible = !(v && hideMats.has(o.userData.m0)); }));
      C.scene.environment = v ? envTex : saved.env; C.scene.environmentIntensity = v ? (LM.ok && LM.eye ? 1.5 : 0.85) : saved.envI;
      C.sun.intensity = v ? (LM.ok && LM.eye ? 0.55 : 3.1) : saved.sunI; C.sun.color.set(v ? 0xfff0de : saved.sunC); C.fill.intensity = v ? 0.32 : saved.fillI; C.rim.intensity = v ? 0 : saved.rimI;
      C.renderer.toneMappingExposure = v ? (LM.ok && LM.eye ? 1.25 : 0.93) : saved.exp; C.gtao.blendIntensity = v && LM.ok && LM.eye ? 0.5 : 1.0; if (!(v && LM.ok && LM.eye)) C.ceil.material = v ? R.ceiling : saved.ceil; bloom.enabled = v;
      if (!v) { view.visible = false; povGroup.visible = false; ptHide(); }
      C.invalidate();
  }
  return {
    apply,
    get busy() { return ptBusy; },
    render: ptRender,
    get pt() { return PT; }, ptCfg, get dbg() { return { portals: portals.length, near: near().length, key: portalKey, lights: PT && PT._pathTracer.material.lights.count, cam: C.camera.position.toArray().map(v => +v.toFixed(2)), pp: near().map(l => [l.position.x, l.position.z, l.userData.n].flat().map(v => +(+v).toFixed(2))) }; },
    frame(P) { // called every rendered frame while the mode is on
      // the bake is lit for a closed room: use it at eye level only; the open cut-away keeps real-time light
      const eyeL = !!(P.on && P.overK < 0.5); if (LM.ok && eyeL !== LM.eye) { LM.eye = eyeL; apply(true); }
      const eye = P.on && P.overK < 0.5; povGroup.visible = eye; view.visible = P.on; if (P.on) C.scene.background = skyBg;
      if (P.on) view.position.set(C.camera.position.x, 0, C.camera.position.z);
    },
  };
}
