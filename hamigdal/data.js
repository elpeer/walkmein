// Hamigdal Bechorshot (Minrav) – apartment picker data (from hamigdal.co.il sales plans).
export const SITE = {
  phone: '*9730', tel: 'tel:*9730', wa: 'https://wa.me/972747335900', form: 'https://www.hamigdal.co.il/#footer',
  disclaimer: 'התכניות והפרטים הינם לצרכי המחשה בלבד וכפופים לשינויים, לרבות על פי היתרי הבנייה והנחיות גורמי התכנון. ההדמיות להמחשה בלבד. ט.ל.ח.',
  pdfBase: 'https://www.hamigdal.co.il/wp-content/uploads/2025/08/',
};

// Until the project render is supplied, the building screen shows a drawn elevation of the 19-storey tower
// (a stacking diagram, clearly not a photo). Floors carrying the type C plan are the interactive bands.
const C_FLOORS = [2, 3, 4, 7, 8, 9, 12, 13, 14, 17, 18];
const V1_FLOORS = [5, 6, 10, 11, 15, 16];
const ALL_FLOORS = Array.from({ length: 19 }, (_, i) => i + 1);
function tower(W, H, { cx, top, ground, tw }) {
  const N = 19, fh = (ground - top) / (N + 1.4), lob = fh * 1.4; // lobby is taller
  const yOf = k => ground - lob - (k - 1) * fh; // bottom edge of floor k (1..19)
  const x0 = cx - tw / 2, x1 = cx + tw / 2, floors = {};
  let g = '';
  // tree-ring motif from the logo, very faint, behind the tower
  for (let i = 0; i < 9; i++) { const rx = tw * (0.75 + i * 0.42), ry = (ground - top) * (0.5 + i * 0.16); g += `<ellipse cx="${cx}" cy="${ground - (ground - top) * 0.46}" rx="${rx}" ry="${ry}" fill="none" stroke="rgba(188,214,166,${(0.11 - i * 0.009).toFixed(3)})" stroke-width="2"/>`; }
  // ground + park
  g += `<rect x="0" y="${ground}" width="${W}" height="${H - ground}" fill="#0a241e"/><rect x="0" y="${ground - 1}" width="${W}" height="2" fill="rgba(188,214,166,.35)"/>`;
  const tree = (x, s) => `<g transform="translate(${x},${ground}) scale(${s})" fill="#1d4a3d"><rect x="-3" y="-46" width="6" height="46"/><circle cx="0" cy="-58" r="17"/><circle cx="0" cy="-80" r="14"/><circle cx="0" cy="-98" r="10"/></g>`;
  [[-1.75, 1.3], [-1.45, 0.9], [-1.15, 1.15], [1.2, 1.05], [1.5, 1.35], [1.82, 0.95], [-2.2, 1.1], [2.25, 1.2], [-2.6, 0.8], [2.65, 0.85]].forEach(([k, sc]) => { g += tree(cx + k * tw, sc * fh / 30); });
  // lobby
  g += `<rect x="${x0 + 6}" y="${ground - lob}" width="${tw - 12}" height="${lob}" fill="rgba(255,236,200,.16)" stroke="rgba(255,255,255,.35)"/>`;
  for (let x = x0 + 30; x < x1 - 20; x += 34) g += `<rect x="${x}" y="${ground - lob + 6}" width="1.5" height="${lob - 6}" fill="rgba(255,255,255,.25)"/>`;
  // floors: glazing + slab + alternating balconies
  for (let k = 1; k <= N; k++) {
    const yb = yOf(k), yt = yb - fh, side = k % 2 ? 1 : -1, bw = tw * 0.42, bx = side > 0 ? x1 - bw * 0.15 : x0 - bw * 0.85, lit = false;
    g += `<rect x="${x0}" y="${yt}" width="${tw}" height="${fh}" fill="${lit ? 'rgba(255,224,170,.20)' : 'rgba(255,255,255,.06)'}"/>`;
    for (let x = x0 + 18; x < x1 - 8; x += 26) g += `<rect x="${x}" y="${yt + 4}" width="1.2" height="${fh - 7}" fill="rgba(188,214,166,.32)"/>`;
    g += `<rect x="${bx}" y="${yb - fh * 0.48}" width="${bw}" height="${fh * 0.48}" fill="rgba(188,214,166,.10)" stroke="rgba(188,214,166,.45)" stroke-width="1.2"/>`;
    g += `<rect x="${Math.min(x0, bx) - 4}" y="${yb - 3}" width="${Math.max(x1, bx + bw) - Math.min(x0, bx) + 8}" height="4" fill="rgba(255,255,255,.62)"/>`;
    if (C_FLOORS.includes(k)) { const px0 = Math.min(x0, bx) - 8, px1 = Math.max(x1, bx + bw) + 8; floors[k] = `${px0},${yt} ${px1},${yt} ${px1},${yb} ${px0},${yb}`; }
  }
  // roof crown
  const yr = yOf(N) - fh; g += `<rect x="${x0 + tw * 0.12}" y="${yr - fh * 0.9}" width="${tw * 0.76}" height="${fh * 0.9}" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.3)"/><rect x="${x0 - 6}" y="${yr - 4}" width="${tw + 12}" height="5" fill="rgba(255,255,255,.7)"/>`;
  const bg = `<defs><radialGradient id="g" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#1b4a3d"/><stop offset=".6" stop-color="#0f3329"/><stop offset="1" stop-color="#0a231d"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${bg}${g}</svg>`;
  return { w: W, h: H, focus: { x: cx, y: (top + ground) / 2 }, src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), srcset: '', floors, tagX: x0 - tw * 0.5 };
}
// The project render (supplied by the client, upscaled ×4.6). Floor bands are traced on the 746×885 original and scaled.
// Slab lines measured on the balcony column; perspective tilt applied across the front face and the side face.
const SLABS = [808, 755, 719, 682, 645, 609, 573, 536, 500, 464, 427, 391, 355, 318, 282, 246, 208, 171, 120, 70]; // bottom of floor 1 (garden level) … top of floor 19 (penthouse)
// Wide 16:9 version (outpainted around the original); floor lines traced on the 746×885 original are mapped in by an affine fit.
const RW = 2752, RH = 1536, AX = x => 798.7 + 1.6127 * x, AY = (x, y) => -67.89 + 0.03483 * x + 1.6699 * y; // affine fitted with SIFT matches
const yAt = (y, x) => x <= 472 ? y - 0.044 * (755 - y) * (x - 285) / 110 : yAt(y, 472) + 0.06 * (755 - yAt(y, 472)) * (x - 472) / 88;
const band = k => { const b = SLABS[k - 1], t = SLABS[k]; const P = (x, y) => `${Math.round(AX(x))},${Math.round(AY(x, yAt(y, x)))}`; return [P(220, b), P(472, b), P(560, b), P(560, t), P(472, t), P(220, t)].join(' '); };
const REAL = { w: RW, h: RH, focus: { x: AX(390), y: AY(390, 430) }, src: 'img/bld_wide_1920.webp?v=2', srcset: 'img/bld_wide_1280.webp?v=2 1280w, img/bld_wide_1920.webp?v=2 1920w, img/bld_wide_2752.webp?v=2 2752w', floors: Object.fromEntries(ALL_FLOORS.map(k => [k, band(k)])), tagX: AX(210) };
// Phones keep the tall original (scrolls under the title).
const K = 2400 / 746, bandT = k => { const b = SLABS[k - 1], t = SLABS[k]; const P = (x, y) => `${Math.round(x * K)},${Math.round(yAt(y, x) * K)}`; return [P(220, b), P(472, b), P(560, b), P(560, t), P(472, t), P(220, t)].join(' '); };
const TALL = { tall: true, w: 2400, h: 2844, focus: { x: 390 * K, y: 430 * K }, src: 'img/bld_1600.webp', srcset: 'img/bld_1000.webp 1000w, img/bld_1600.webp 1600w, img/bld_2400.webp 2400w', floors: Object.fromEntries(ALL_FLOORS.map(k => [k, bandT(k)])), tagX: 210 * K };
export const RENDERS = { desk: REAL, mob: TALL };

const SUB = { 1: 'דירות גן', 19: 'פנטהאוזים' };
export const FLOORS = ALL_FLOORS.slice().reverse().map(k => ({ k, label: 'קומה ' + k, short: String(k), sub: SUB[k] }));

// Every type is listed as on the sales site; for now all of them open the type C 3D model (only the title and PDF change).
export const GROUPS = [
  { rooms: '3', label: 'דירות 3 חדרים' }, { rooms: '3.5', label: 'דירות 3.5 חדרים' }, { rooms: '4', label: 'דירות 4 חדרים' },
  { rooms: '4.5', label: 'דירות גן 4.5 חדרים' }, { rooms: '5', label: 'דירות פנטהאוז 5 חדרים' },
];
const T = (id, name, rooms, floors, floorTxt, pdf, extra = {}) => ({ id, name, label: GROUPS.find(g => g.rooms === rooms).label.replace('דירות', 'דירת').replace(/^דירת (גן|פנטהאוז) ([\d.]+) חדרים$/, 'דירת $1 $2 חדרים'), rooms, floors, floorTxt, pdf, ...extra });
const TYP = 'קומות ' + C_FLOORS.join(', '), ALT = 'קומות ' + V1_FLOORS.join(', ');
export const TYPES = [
  T('FF2', 'F+F2', '3', C_FLOORS, TYP, 'FF2_02.pdf'),
  T('EE2', 'E+E2', '3.5', C_FLOORS, TYP, 'EE2_02.pdf'),
  T('E1', 'E1', '3.5', V1_FLOORS, ALT, 'E1_24.8.pdf'),
  T('CC2', 'C+C2', '4', C_FLOORS, TYP, 'CC2_02.pdf', { area: 101, out: ['מרפסת', '14'] }),
  T('C1', 'C1', '4', V1_FLOORS, ALT, 'C1_02.pdf'),
  T('DD2', 'D+D2', '4', C_FLOORS, TYP, 'DD2_02.pdf'),
  T('D1', 'D1', '4', V1_FLOORS, ALT, 'D1_24.8.pdf'),
  T('GG2', 'G+G2', '4', C_FLOORS, TYP, 'GG2_02.pdf'),
  T('G1', 'G1', '4', V1_FLOORS, ALT, 'G1_02.pdf'),
  T('A', 'A', '4.5', [1], 'קומת קרקע עם גינה', 'A_02.pdf'),
  T('B', 'B', '4.5', [1], 'קומת קרקע עם גינה', 'B_02.pdf'),
  T('H', 'H', '5', [19], 'קומת הפנטהאוזים', 'H_02.pdf'),
  T('I', 'I', '5', [19], 'קומת הפנטהאוזים', 'I_24.8.pdf'),
];
