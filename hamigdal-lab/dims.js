// Dimension overlay, drawn like the architect's sheet: fine dashed lines from wall to wall just above the walls,
// small end ticks, and the measure in centimetres as plain text (no plates). Figures follow the sales plan.
export function buildDims(C) {
  const { THREE, X, Z } = C;
  const g = new THREE.Group(); g.name = 'dims';
  const INK = 0x26332e;
  const mDash = new THREE.LineDashedMaterial({ color: INK, dashSize: 0.12, gapSize: 0.07, transparent: true, opacity: 0.85, depthTest: false });
  const mTick = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.9, depthTest: false });
  const line = (pts, m) => { const geo = new THREE.BufferGeometry().setFromPoints(pts.map(([x, z]) => new THREE.Vector3(x, 0, z))); const l = new THREE.Line(geo, m); if (m === mDash) l.computeLineDistances(); l.renderOrder = 10; g.add(l); return l; };
  const labels = [];
  function label(text, x, z) {
    const c = document.createElement('canvas'), k = c.getContext('2d'); const F = '500 68px "Heebo","Assistant",system-ui,sans-serif';
    k.font = F; const w = Math.ceil(k.measureText(text).width) + 40; c.width = w; c.height = 96;
    k.font = F; k.textAlign = 'center'; k.textBaseline = 'middle'; k.lineJoin = 'round'; k.lineWidth = 16; k.strokeStyle = 'rgba(250,248,243,.95)'; k.strokeText(text, w / 2, 50); k.fillStyle = '#26332e'; k.fillText(text, w / 2, 50);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, toneMapped: false })); const H = 0.42; sp.scale.set(H * w / 96, H, 1); sp.userData.base = sp.scale.clone();
    sp.position.set(x, 0.02, z); sp.renderOrder = 11; g.add(sp); labels.push(sp); return sp;
  }
  // a dimension between two points (plan px), with its figure in the middle
  function dim(a, b, text) {
    const A = [X(a[0]), Z(a[1])], B = [X(b[0]), Z(b[1])]; line([A, B], mDash);
    const dx = B[0] - A[0], dz = B[1] - A[1], L = Math.hypot(dx, dz), nx = -dz / L * 0.12, nz = dx / L * 0.12;
    for (const [x, z] of [A, B]) line([[x - nx, z - nz], [x + nx, z + nz]], mTick);
    label(text, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2);
  }
  // figures from the sales plan (cm); lines run wall to wall inside each room
  dim([275, 352], [838, 352], '671');                 // living + kitchen, width
  dim([612, 326], [612, 845], '622');                 // living, depth
  dim([840, 300], [1190, 300], '417'); dim([905, 212], [905, 448], '280');   // master bedroom
  dim([960, 500], [1190, 500], '270'); dim([1000, 452], [1000, 584], '149');   // en-suite
  dim([960, 625], [1070, 625], '127'); dim([990, 598], [990, 727], '161');   // laundry
  dim([705, 860], [849, 860], '165'); dim([725, 703], [725, 892], '220');      // bathroom
  dim([960, 830], [1190, 830], '270'); dim([1000, 740], [1000, 1012], '322');  // bedroom
  dim([638, 1010], [955, 1010], '346'); dim([700, 905], [700, 1135], '267');   // bedroom / safe room
  g.userData.face = cam => { const wp = new THREE.Vector3(); labels.forEach(s => { s.getWorldPosition(wp); const k = Math.min(1.7, Math.max(0.9, wp.distanceTo(cam.position) / 26)); s.scale.copy(s.userData.base).multiplyScalar(k); }); };
  g.userData.setHeight = h => { g.position.y = h; };
  return g;
}
