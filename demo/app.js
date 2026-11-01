// WalkMeIn Studio — dashboard demo (Hebrew / English). All data is simulated in the browser; nothing is sent anywhere.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildApartment, ROOMS, BAL } from './model.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
let seed = 42; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const nf = n => n.toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ------------------------------------------------------------------ language (Hebrew default, English toggle)
let EN = false; try { EN = localStorage.getItem('wmi-lang') === 'en'; } catch (e) {}
const tr = (he, en) => EN ? en : he;
const P = p => Array.isArray(p) ? p[EN ? 1 : 0] : p; // [he, en] → current language

// static page text (index.html) → English
const DICT = {
  'פרויקט': 'Project', 'נוף הכרמל': 'Nof HaCarmel', 'קריית ים · 36 דירות · 4 טיפוסים': 'Kiryat Yam · 36 units · 4 types',
  'סקירה': 'Overview', 'עכשיו באתר': 'Live now', 'בניין ודירות': 'Building & units', 'דירה בעומק': 'Unit insights', 'לידים': 'Leads', 'לינקים אישיים': 'Personal links', 'הגדרות': 'Settings',
  'ר': 'R', 'א': 'A', 'מ': 'M', 'ד': 'D', 'רונית אלון': 'Ronit Alon', 'מנהלת מכירות': 'Sales manager', 'גרסת הדגמה · הנתונים להמחשה': 'Demo version · sample data',
  'היום': 'Today', '7 ימים': '7 days', '30 יום': '30 days', 'גולשים עכשיו': 'visitors now', 'גולשים באתר עכשיו': 'Visitors online',
  'דירת 4 חדרים · טיפוס B': '4-room apartment · Type B', 'הכי נצפית השבוע': 'Most viewed this week',
  'שד׳ ירושלים, קריית ים · 104 מ״ר + מרפסת 18 מ״ר': 'Yerushalayim Blvd, Kiryat Yam · 104 m² + 18 m² balcony',
  'צפיות במודל השבוע': 'Model views this week', 'משבוע שעבר': 'vs last week', 'זמן צפייה ממוצע': 'Avg. viewing time', 'פי 3.1': '3.1×', 'מעמוד PDF': 'a PDF page',
  'השאירו פרטים לפגישה': 'Booked a meeting', '3 לידים מוכרים צופים כרגע ·': '3 known leads viewing now ·', 'להציע עזרה ←': 'Offer help →',
  'קונים בתוך הדירה הזו עכשיו': 'buyers inside this unit now', 'גררו כדי לסובב · המספרים = זמן ממוצע בחדר': 'Drag to rotate · numbers = avg. time per room',
  'צפיות ופניות': 'Views & inquiries', '14 ימים': '14 days', 'צפיות': 'Views', 'פניות ×10': 'Inquiries ×10', 'מאיפה הקונים מגיעים': 'Where buyers come from',
  'איפה הקונים מתעכבים': 'Where buyers linger', 'זמן ממוצע': 'Avg. time', 'הדירות הנצפות ביותר': 'Most viewed units', 'לבניין': 'Building', 'פעילות אחרונה': 'Recent activity', 'חי': 'Live',
  'בכל דירות הפרויקט': 'across all units', 'בסיור המודרך כרגע': 'In the guided tour', 'שומעים את הקריינות': 'listening to the narration', 'לידים מוכרים באתר': 'Known leads online',
  'נכנסו מלינק אישי': 'came in from a personal link', 'כדאי לפנות עכשיו': 'Reach out now', 'מעל 3 דקות בדירה אחת': '3+ minutes in one unit',
  'מבקר': 'Visitor', 'דירה': 'Unit', 'איפה עכשיו': 'Where now', 'זמן': 'Time', 'רמת עניין': 'Interest',
  'נמכרו': 'Sold', '+3 החודש': '+3 this month', 'שמורות': 'Reserved', 'בתהליך חתימה': 'contract in progress', 'פנויות': 'Available', 'מתוכן 9 עם פניות פתוחות': '9 with open inquiries',
  'יחס פנייה למכירה': 'Inquiry-to-sale', 'טוב פי 2 מהממוצע בפרויקט הקודם': '2× better than the previous project', 'בחרו דירה על הבניין': 'Pick a unit on the building',
  'מעבר עם העכבר מציג נתונים, לחיצה פותחת את פרטי הדירה.': 'Hover for numbers, click to open the unit.', 'טיפוסי הדירות': 'Unit types', '7 ימים אחרונים': 'Last 7 days',
  'טיפוס': 'Type', 'חדרים': 'Rooms', 'שטח': 'Size', 'מחיר מ־': 'From', 'פניות': 'Inquiries', 'המרה': 'Conversion',
  'מפת חום · זמן ממוצע בחדר': 'Heatmap · avg. time per room', 'פחות': 'Less', 'יותר': 'More', 'משפך הצפייה': 'Viewing funnel', 'הסיור המודרך: איפה עוזבים': 'Guided tour: where people drop off',
  '% ביקרו · זמן': '% visited · time', 'שימוש ביכולות': 'Feature usage', 'מה אומרים הנתונים': 'What the data says',
  'לינק אישי חדש': 'New personal link', 'שם הלקוח': 'Client name', 'טלפון': 'Phone', 'נשלח מ': 'Sent by', 'אבי שושן': 'Avi Shoshan', 'מאיה כץ': 'Maya Katz', 'יצירת לינק': 'Create link',
  'לינקים שנשלחו': 'Links sent', 'לקוח': 'Client', 'נשלח': 'Sent', 'נפתח': 'Opened', 'זמן צפייה': 'Viewing time', 'ביקורים': 'Visits', 'חזר לראות': 'Came back for',
  'יכולות בחוויה': 'Experience features', 'מה הקונה רואה': 'What the buyer sees', 'עזרה בלייב': 'Live assist', 'התראה על קונה חם': 'Hot-buyer alert',
  'כשקונה נמצא מעל 3 דקות בדירה אחת': 'When a buyer spends 3+ minutes in one unit', 'שיחת וידאו מתוך הדירה': 'Video call from inside the unit',
  'הקונה מקבל הזמנה ומצטרף בלחיצה, בלי התקנה': 'The buyer gets an invite and joins in one tap, nothing to install', 'שעות זמינות': 'Availability',
  'א׳–ה׳ 09:00–19:00 · ו׳ 09:00–13:00': 'Sun–Thu 09:00–19:00 · Fri 09:00–13:00', 'עריכה': 'Edit', 'הטמעה באתר הפרויקט': 'Embed on the project site', 'העתקה': 'Copy',
  'חיבור ל־CRM': 'CRM connection', 'מחובר': 'Connected', 'חיבור': 'Connect', 'צוות': 'Team', 'הוספה': 'Add', 'מנהלת מכירות · מנהלת': 'Sales manager · admin',
  'איש מכירות': 'Sales rep', 'משרד מכירות · צפייה בלבד': 'Sales office · view only', 'סיור משותף · הקונה רואה את מה שאתם רואים': 'Shared tour · the buyer sees what you see',
  'דני כהן': 'Dani Cohen', 'אתם': 'You', 'מתקשרים לדני…': 'Calling Dani…', 'ההזמנה הופיעה על המסך של הקונה, בתוך הדירה': 'The invite popped up on the buyer’s screen, inside the unit',
  'פרטי השיחה': 'Call details', 'שליחה': 'Send', 'התראות': 'Notifications', 'הדמיית בניין A בפרויקט נוף הכרמל': 'Building A rendering, Nof HaCarmel',
  'שיחת וידאו': 'Video call', 'שיחת וידאו עם קונה': 'Video call with a buyer', 'מיקרופון': 'Microphone', 'מצלמה': 'Camera', 'סיום שיחה': 'End call', 'הודעה בצ׳אט…': 'Chat message…',
  'סקירת הפרויקט': 'Project overview', 'נוף הכרמל · בניין A': 'Nof HaCarmel · Building A',
};
const ORIG = new WeakMap();
function translateStatic() {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes) {
    if (n.parentElement.closest('script,style')) continue;
    if (!ORIG.has(n)) { if (!/[֐-׿]/.test(n.nodeValue) || !DICT[n.nodeValue.trim()]) continue; ORIG.set(n, n.nodeValue); }
    const o = ORIG.get(n), k = o.trim();
    n.nodeValue = EN ? o.replace(k, DICT[k]) : o;
  }
  $$('[placeholder],[aria-label],[alt],[title]').forEach(el => ['placeholder', 'aria-label', 'alt', 'title'].forEach(a => {
    const v = el.getAttribute(a); if (v == null) return; const key = 'o' + a.replace('-', '');
    if (el.dataset[key] == null) { if (!DICT[v]) return; el.dataset[key] = v; }
    const o = el.dataset[key]; el.setAttribute(a, EN ? DICT[o] : o);
  }));
}
function applyLang() {
  document.documentElement.lang = EN ? 'en' : 'he'; document.documentElement.dir = EN ? 'ltr' : 'rtl';
  $('#langLbl').textContent = EN ? 'עברית' : 'English';
  translateStatic();
}
$('#langBtn').onclick = () => { EN = !EN; try { localStorage.setItem('wmi-lang', EN ? 'en' : 'he'); } catch (e) {} applyLang(); route(); };

// ------------------------------------------------------------------ data
const RNP = { living: ['סלון ומטבח', 'Living & kitchen'], bal: ['מרפסת', 'Balcony'], master: ['יחידת הורים', 'Master suite'], bed2: ['חדר שינה', 'Bedroom'], bed3: ['ממ״ד / עבודה', 'Safe room / study'], bath: ['חדר רחצה', 'Bathroom'], ensuite: ['מקלחת הורים', 'Master bath'], hall: ['כניסה', 'Entrance'], closet: ['ארונות', 'Closets'] };
const RN = k => P(RNP[k]);
const RNS = k => (EN ? { living: 'Living', bal: 'Balcony', master: 'Master', bed2: 'Bedroom', bed3: 'Safe room', bath: 'Bath', ensuite: 'Ensuite' } : { living: 'סלון', bal: 'מרפסת', master: 'הורים', bed2: 'שינה', bed3: 'ממ״ד', bath: 'רחצה', ensuite: 'מקלחת' })[k] || '';
const WALK = ['living', 'bal', 'master', 'bed2', 'bed3', 'bath', 'ensuite', 'hall'];
const roomPos = k => { if (k === 'bal') return [(BAL[0] + BAL[2]) / 2, (BAL[1] + BAL[3]) / 2]; const [x0, z0, x1, z1] = ROOMS[k].r; return [(x0 + x1) / 2, (z0 + z1) / 2]; };
const AVG = { living: 108, bal: 72, master: 58, bed3: 34, bed2: 29, ensuite: 18, bath: 14, hall: 9 };

const TYPES = {
  A: { name: ['טיפוס A', 'Type A'], rooms: ['3 חד׳', '3 rooms'], sqm: ['82 מ״ר', '82 m²'], price: 1790000, views: 318, avg: 214, leads: 13, free: 5 },
  B: { name: ['טיפוס B', 'Type B'], rooms: ['4 חד׳', '4 rooms'], sqm: ['104 מ״ר', '104 m²'], price: 2290000, views: 512, avg: 276, leads: 27, free: 6 },
  C: { name: ['טיפוס C', 'Type C'], rooms: ['5 חד׳', '5 rooms'], sqm: ['128 מ״ר', '128 m²'], price: 2790000, views: 287, avg: 251, leads: 16, free: 3 },
  P: { name: ['פנטהאוז', 'Penthouse'], rooms: ['5 חד׳ + גג', '5 rooms + roof'], sqm: ['156 מ״ר', '156 m²'], price: 3950000, views: 167, avg: 342, leads: 8, free: 2 },
};
const APTS = {
  3: { f: 2, t: 'A', st: 'sd', views: 96, leads: 3 }, 4: { f: 2, t: 'B', st: 'av_', views: 188, leads: 6 },
  5: { f: 3, t: 'A', st: 'rs', views: 121, leads: 4 }, 6: { f: 3, t: 'C', st: 'av_', views: 204, leads: 7 },
  7: { f: 4, t: 'A', st: 'sd', views: 143, leads: 5 }, 8: { f: 4, t: 'B', st: 'av_', views: 412, leads: 9 },
  9: { f: 5, t: 'C', st: 'av_', views: 233, leads: 6 }, 10: { f: 5, t: 'B', st: 'rs', views: 356, leads: 8 },
};
const ST = { sd: [['נמכרה', 'Sold'], 'c'], rs: [['שמורה', 'Reserved'], 'w'], av_: [['פנויה', 'Available'], 'g'] };
const COLORS = ['#fff27a', '#cfe3c3', '#e4ebf2', '#fde3d6', '#eadcf7', '#d6eee6', '#f6e3c4'];
const SRC = [['וואטסאפ', 'WhatsApp'], ['קמפיין פייסבוק', 'Facebook ads'], ['אתר הפרויקט', 'Project website'], ['גוגל', 'Google'], ['אינסטגרם', 'Instagram'], ['לינק אישי', 'Personal link'], ['פייסבוק', 'Facebook'], ['משרד המכירות', 'Sales office']];
const S = n => SRC[n];
const CITIES = [['חיפה', 'Haifa'], ['קריית ים', 'Kiryat Yam'], ['קריית ביאליק', 'Kiryat Bialik'], ['עכו', 'Acre'], ['נשר', 'Nesher'], ['תל אביב', 'Tel Aviv'], ['קריית מוצקין', 'Kiryat Motzkin'], ['נהריה', 'Nahariya']];
const DEV = [['נייד', 'Mobile'], ['מחשב', 'Desktop']];

const LEADS = [
  { id: 1, name: ['דני כהן', 'Dani Cohen'], phone: '054-7712093', email: 'dani.cohen@gmail.com', apt: 8, src: S(6), score: 5, st: 'h', visits: 3, total: 860, date: ['היום, 10:12', 'Today, 10:12'], rooms: { living: 320, bal: 210, master: 150, bed3: 80, bed2: 60, bath: 40 } },
  { id: 2, name: ['מיכל לוי', 'Michal Levi'], phone: '052-3381772', email: 'michal.levi@walla.co.il', apt: 10, src: S(5), score: 5, st: 'h', visits: 4, total: 1240, date: ['היום, 09:40', 'Today, 09:40'], rooms: { living: 410, master: 300, bal: 260, bed2: 120, ensuite: 90, bed3: 60 } },
  { id: 3, name: ['יוסי אברהם', 'Yossi Avraham'], phone: '050-6612448', email: 'yossi.av@gmail.com', apt: 6, src: S(3), score: 4, st: 'h', visits: 2, total: 640, date: ['אתמול, 21:05', 'Yesterday, 21:05'], rooms: { living: 240, bed2: 130, bed3: 110, bal: 90, master: 70 } },
  { id: 4, name: ['רינה שפירא', 'Rina Shapira'], phone: '053-9910021', email: 'rina.sh@gmail.com', apt: 9, src: S(2), score: 3, st: 'w', visits: 2, total: 410, date: ['אתמול, 18:30', 'Yesterday, 18:30'], rooms: { living: 150, master: 100, bal: 80, bed2: 50, bath: 30 } },
  { id: 5, name: ['עומר חדאד', 'Omar Haddad'], phone: '054-2237811', email: 'omar.haddad@outlook.com', apt: 8, src: S(0), score: 4, st: 'h', visits: 3, total: 720, date: ['אתמול, 13:15', 'Yesterday, 13:15'], rooms: { living: 260, bal: 180, master: 130, bed3: 90, bed2: 60 } },
  { id: 6, name: ['נועה ברגר', 'Noa Berger'], phone: '052-7745520', email: 'noa.berger@gmail.com', apt: 4, src: S(4), score: 3, st: 'w', visits: 1, total: 330, date: ['לפני יומיים', '2 days ago'], rooms: { living: 130, bal: 90, master: 60, bed2: 50 } },
  { id: 7, name: ['אלכס פרידמן', 'Alex Friedman'], phone: '058-4410093', email: 'alex.f@gmail.com', apt: 'P', src: S(3), score: 4, st: 'h', visits: 2, total: 980, date: ['לפני יומיים', '2 days ago'], rooms: { living: 330, bal: 300, master: 200, ensuite: 80, bed2: 70 } },
  { id: 8, name: ['שירן מזרחי', 'Shiran Mizrahi'], phone: '050-2290817', email: 'shiran.m@gmail.com', apt: 5, src: S(1), score: 2, st: 'w', visits: 1, total: 190, date: ['לפני 3 ימים', '3 days ago'], rooms: { living: 90, master: 50, bal: 50 } },
  { id: 9, name: ['חסן עלי', 'Hassan Ali'], phone: '054-8826610', email: 'hassan.ali@gmail.com', apt: 9, src: S(0), score: 3, st: 'w', visits: 2, total: 470, date: ['לפני 3 ימים', '3 days ago'], rooms: { living: 170, bed2: 110, bed3: 100, bal: 90 } },
  { id: 10, name: ['טל גרינברג', 'Tal Greenberg'], phone: '052-6609941', email: 'tal.g@gmail.com', apt: 10, src: S(2), score: 1, st: 'c', visits: 1, total: 75, date: ['לפני 4 ימים', '4 days ago'], rooms: { living: 50, bal: 25 } },
  { id: 11, name: ['אורית נחום', 'Orit Nahum'], phone: '053-3341290', email: 'orit.n@gmail.com', apt: 6, src: S(7), score: 2, st: 'c', visits: 1, total: 120, date: ['לפני 5 ימים', '5 days ago'], rooms: { living: 70, master: 50 } },
  { id: 12, name: ['בני סלאמה', 'Beni Salameh'], phone: '050-7713380', email: 'beni.s@gmail.com', apt: 4, src: S(5), score: 3, st: 'n', visits: 1, total: 260, date: ['היום, 11:02', 'Today, 11:02'], rooms: { living: 110, bal: 70, master: 50, bed2: 30 } },
];
const LBL = { h: [['חם', 'Hot'], 'h'], w: [['פושר', 'Warm'], 'w'], c: [['קר', 'Cold'], 'c'], n: [['חדש', 'New'], 'y'] };
const aptLabelL = (a, en) => en ? (a === 'P' ? 'Penthouse 21' : `unit ${a}`) : (a === 'P' ? 'פנטהאוז 21' : `דירה ${a}`);
const aptLabel = a => a === 'P' ? tr('פנטהאוז 21', 'Penthouse 21') : tr(`דירה ${a}`, `Unit ${a}`);
const aptType = a => a === 'P' ? 'P' : APTS[a].t;
const first = n => P(n).split(' ')[0];

// live visitors (names / labels are [he, en] pairs)
let vid = 0;
function mkVisitor(o = {}) {
  const known = o.lead ? LEADS.find(l => l.id === o.lead) : null;
  const apt = o.apt ?? (known ? known.apt : pick([8, 8, 10, 6, 9, 4, 5, 'P']));
  const room = o.room ?? pick(WALK.slice(0, 5)), city = pick(CITIES);
  return {
    id: ++vid, lead: known?.id || null, name: known ? known.name : [`מבקר מ${city[0]}`, `Visitor from ${city[1]}`],
    color: known ? COLORS[known.id % COLORS.length] : '#ecebe4', src: known ? known.src : pick(SRC.slice(0, 5)), dev: rnd() > .3 ? DEV[0] : DEV[1],
    apt, room, path: [room], t: o.t ?? Math.floor(30 + rnd() * 300), aptT: o.aptT ?? Math.floor(20 + rnd() * 160), tour: o.tour ?? rnd() > .6,
    score: known ? known.score : 1 + Math.floor(rnd() * 3), visit: known ? known.visits + 1 : 1, alerted: false,
  };
}
const VIS = [
  mkVisitor({ lead: 1, apt: 8, room: 'bal', t: 412, aptT: 168, tour: true }),
  mkVisitor({ lead: 2, apt: 10, room: 'master', t: 655, aptT: 248 }),
  mkVisitor({ lead: 5, apt: 8, room: 'living', t: 133, aptT: 92 }),
  mkVisitor({ apt: 8, room: 'master', tour: true }), mkVisitor({ apt: 6 }), mkVisitor({ apt: 9, tour: true }), mkVisitor({ apt: 4 }),
  mkVisitor({ apt: 10 }), mkVisitor({ apt: 'P', tour: true }), mkVisitor({ apt: 5 }), mkVisitor({ apt: 8 }), mkVisitor({ apt: 6 }),
];
VIS.forEach(v => { v.path = [...new Set([pick(WALK), pick(WALK), v.room])]; });
VIS[1].alerted = true; // already past the threshold when the demo opens
const POOL = [3, 7, 9, 12];
const vName = v => P(v.name), vInit = v => v.init || (v.lead ? P(v.name)[0] : '?');

// ------------------------------------------------------------------ 3D viewer
const heatCol = v => { const s = [[1, .965, .69], [.953, .76, .176], [.941, .525, .18], [.878, .314, .165]]; const x = Math.min(.999, Math.max(0, v)) * 3, i = Math.floor(x), t = x - i; return new THREE.Color(...s[i].map((c, k) => c + (s[i + 1][k] - c) * t)); };
class Viewer {
  constructor(host, { heat = null, labels = null, az = 0.62, el = 0.82, auto = true, zoom = 1 } = {}) {
    this.host = host; this.autoDef = auto; this.auto = auto; this.dead = false; this.paused = false; this.tags = []; this.dots = new Map();
    const c = this.canvas = document.createElement('canvas'); host.prepend(c);
    const r = this.r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    r.setClearColor(0, 0); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NeutralToneMapping; r.shadowMap.enabled = true; r.shadowMap.type = THREE.VSMShadowMap;
    const s = this.scene = new THREE.Scene();
    s.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture; s.environmentIntensity = 0.5;
    this.cam = new THREE.PerspectiveCamera(18, 1, 0.1, 400);
    const sun = new THREE.DirectionalLight(0xfffaf0, 2.6); sun.position.set(-12, 24, -6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 2, far: 70 }); sun.shadow.radius = 5; sun.shadow.blurSamples = 12;
    s.add(sun, new THREE.HemisphereLight(0xffffff, 0xdcd8cc, 1.1));
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ color: 0x3e4a36, opacity: 0.16 }));
    catcher.rotation.x = -Math.PI / 2; catcher.position.y = -0.52; catcher.receiveShadow = true; s.add(catcher);
    const L = buildApartment(); this.root = new THREE.Group(); this.root.add(L.base, L.walls); for (const k in L.sets) this.root.add(L.sets[k]); s.add(this.root);
    this.heat = {};
    if (heat) {
      for (const k of WALK) {
        let w, d; if (k === 'bal') { w = BAL[2] - BAL[0]; d = BAL[3] - BAL[1]; } else { const q = ROOMS[k].r; w = q[2] - q[0]; d = q[3] - q[1]; }
        const [x, z] = roomPos(k);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.16, d - 0.16), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
        m.rotation.x = -Math.PI / 2; m.position.set(x, 0.05, z); this.root.add(m); this.heat[k] = m;
      }
      this.setHeat(heat);
    }
    if (labels) for (const [k, txt] of labels) { const [x, z] = roomPos(k); const el = document.createElement('div'); el.className = 'tag3'; el.innerHTML = `<span>${txt}</span><i></i>`; host.append(el); this.tags.push([el, new THREE.Vector3(x, 1.6, z)]); }
    this.az = az; this.el = el; this.zoom = zoom; this.t = new THREE.Vector3(0, -0.2, 0.9); this.g = { x: 0, z: 0.9, d: 1, el }; this.dm = 1;
    let drag = null;
    c.addEventListener('pointerdown', e => { drag = { x: e.clientX, a: this.az }; c.setPointerCapture(e.pointerId); this.auto = false; c.style.cursor = 'grabbing'; const h = host.querySelector('.hint3'); if (h) h.style.opacity = 0; });
    c.addEventListener('pointermove', e => { if (drag) this.az = drag.a - (e.clientX - drag.x) * 0.01; });
    const up = () => { drag = null; c.style.cursor = ''; clearTimeout(this.ra); this.ra = setTimeout(() => { if (!drag) this.auto = this.autoDef; }, 4000); };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    this.ro = new ResizeObserver(() => this.fit()); this.ro.observe(host); this.fit();
    const v = new THREE.Vector3();
    const loop = () => {
      if (this.dead) return; requestAnimationFrame(loop); if (this.paused || !this.W) return;
      if (this.auto) this.az += 0.0016;
      const g = this.g; this.t.x += (g.x - this.t.x) * .06; this.t.z += (g.z - this.t.z) * .06; this.el += (g.el - this.el) * .06; this.dm += (g.d - this.dm) * .06;
      const d = (this.cam.aspect > 1.3 ? 52 : 52 * 1.3 / this.cam.aspect) * this.dm / this.zoom;
      this.cam.position.set(this.t.x + Math.sin(this.az) * Math.cos(this.el) * d, this.t.y + Math.sin(this.el) * d, this.t.z + Math.cos(this.az) * Math.cos(this.el) * d);
      this.cam.lookAt(this.t);
      this.r.render(this.scene, this.cam);
      const proj = (p, el) => { v.copy(p).project(this.cam); el.style.left = ((v.x + 1) / 2 * this.W) + 'px'; el.style.top = ((1 - v.y) / 2 * this.H) + 'px'; };
      for (const [el, p] of this.tags) proj(p, el);
      for (const d2 of this.dots.values()) { d2.p.lerp(d2.goal, 0.04); proj(d2.p, d2.el); }
    };
    requestAnimationFrame(loop);
  }
  fit() { this.W = this.host.clientWidth; this.H = this.host.clientHeight; if (!this.W || !this.H) return; this.r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); this.r.setSize(this.W, this.H, false); this.cam.aspect = this.W / this.H; this.cam.updateProjectionMatrix(); }
  setHeat(map) { const mx = Math.max(...Object.values(map)); for (const k in this.heat) { const v = (map[k] || 0) / mx, m = this.heat[k].material; m.color.copy(heatCol(v)); m.opacity = map[k] ? 0.28 + v * 0.42 : 0; } }
  setDot(id, room, html) {
    const [x, z] = roomPos(room), jit = () => (Math.random() - .5) * 1.4, goal = new THREE.Vector3(x + jit(), 1.0, z + jit());
    let d = this.dots.get(id);
    if (!d) { const el = document.createElement('div'); el.className = 'vis'; el.innerHTML = html; this.host.append(el); d = { el, p: goal.clone(), goal }; this.dots.set(id, d); }
    else d.goal = goal;
  }
  dropDot(id) { const d = this.dots.get(id); if (d) { d.el.remove(); this.dots.delete(id); } }
  flyTo(k) { if (!k) { this.g = { x: 0, z: 0.9, d: 1, el: 0.82 }; return; } const [x, z] = roomPos(k); this.g = { x, z, d: 0.55, el: 1.02 }; this.auto = false; this.autoDef = false; }
  dispose() { this.dead = true; this.ro.disconnect(); this.r.dispose(); this.r.forceContextLoss?.(); this.canvas.remove(); this.tags.forEach(([el]) => el.remove()); this.dots.forEach(d => d.el.remove()); }
}

// ------------------------------------------------------------------ small UI helpers
const avatar = v => `<span class="av" style="background:${v.color}">${esc(vInit(v))}</span>`;
const heatBars = n => `<span class="heat ${n >= 4 ? '' : n >= 3 ? 'w' : 'c'}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
const TEAM = () => tr('רונית · צוות המכירות', 'Ronit · Sales team');
function toast({ v, title, sub, action }) {
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `${v ? avatar(v) : ''}<div><b>${title}</b><small>${sub || ''}</small></div>${action ? `<button>${action.label}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { action.fn(); el.remove(); };
  $('#toasts').prepend(el); setTimeout(() => el.remove(), 7000);
  while ($('#toasts').children.length > 3) $('#toasts').lastChild.remove();
}
function countUp(el, to, dur = 1100) { const t0 = performance.now(); const f = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = nf(Math.round(to * e)); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
function planSVG(cur, seen = [], heat = null) {
  const mx = heat ? Math.max(...Object.values(heat)) : 1;
  const rect = (k, [x0, z0, x1, z1]) => {
    const fill = heat ? (heat[k] ? `style="fill:#${heatCol(heat[k] / mx).getHexString()}"` : '') : '';
    return `<rect class="rm ${k === cur ? 'cur' : seen.includes(k) ? 'seen' : ''}" ${fill} x="${x0}" y="${z0}" width="${x1 - x0}" height="${z1 - z0}" rx=".08"/>` +
      (RNP[k] && !['closet', 'hall'].includes(k) ? `<text x="${(x0 + x1) / 2}" y="${(z0 + z1) / 2 + .15}" text-anchor="middle">${RNS(k)}</text>` : '');
  };
  let s = `<svg class="plan" viewBox="-5.3 -4.5 10.6 10.8" aria-label="${tr('תוכנית הדירה', 'Unit floor plan')}">`;
  for (const k in ROOMS) s += rect(k, ROOMS[k].r);
  s += rect('bal', BAL);
  if (cur) { const [x, z] = roomPos(cur); s += `<circle class="me3r" cx="${x}" cy="${z - .45}" r=".22"/><circle class="me3" cx="${x}" cy="${z - .45}" r=".2"/>`; }
  return s + '</svg>';
}

// ------------------------------------------------------------------ router
const PAGES = {
  overview: [['סקירת הפרויקט', 'Project overview'], ['נוף הכרמל · בניין A · מה קורה בחוויה השבוע', 'Nof HaCarmel · Building A · this week in the experience']],
  live: [['עכשיו באתר', 'Live now'], ['מי צופה כרגע, באיזו דירה ובאיזה חדר. אפשר להציע עזרה בצ׳אט או בשיחת וידאו', 'Who is viewing right now, in which unit and which room. Offer help by chat or video call']],
  building: [['בניין ודירות', 'Building & units'], ['זמינות, צפיות ופניות לכל דירה', 'Availability, views and inquiries for every unit']],
  apartment: [['דירה בעומק', 'Unit insights'], ['איך קונים עוברים בתוך הדירה ואיפה הם עוזבים', 'How buyers move through the unit and where they drop off']],
  leads: [['לידים', 'Leads'], ['כל ליד מגיע עם מה שראה בדירה', 'Every lead arrives with what they saw in the unit']],
  links: [['לינקים אישיים', 'Personal links'], ['שולחים לקונה לינק משלו ויודעים מתי פתח ומה ראה', 'Send each buyer their own link and see when they opened it and what they saw']],
  settings: [['הגדרות', 'Settings'], ['מה הקונה רואה, הטמעה, CRM וצוות', 'What buyers see, embedding, CRM and team']],
};
let pageViewer = null, current = null; const sel = { live: VIS[0].id, lead: 1, apt: 8, type: 'B' };
function route() {
  const r = (location.hash || '#overview').slice(1);
  const key = PAGES[r] ? r : 'overview';
  if (pageViewer) { pageViewer.dispose(); pageViewer = null; }
  current = key;
  $$('.page').forEach(p => p.classList.toggle('on', p.id === 'p-' + key));
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === key));
  $('#ptitle').textContent = P(PAGES[key][0]); $('#psub').textContent = P(PAGES[key][1]);
  ({ overview, live, building, apartment, leads, links, settings })[key]();
  scrollTo({ top: 0 });
}
addEventListener('hashchange', route);

// ------------------------------------------------------------------ overview
let range = 1;
function overview() {
  pageViewer = new Viewer($('#heroStage'), { heat: AVG, labels: ['living', 'bal', 'master', 'bed3'].map(k => [k, `${RN(k).split(' /')[0]} <b>${mmss(AVG[k])}</b>`]) });
  syncHeroDots();
  $$('[data-count]').forEach(el => countUp(el, Math.round(+el.dataset.count * [0.16, 1, 4.1][range])));
  $('#gArc').animate([{ strokeDashoffset: 204 }, { strokeDashoffset: 204 * (1 - .64) }], { duration: 1200, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' });
  $('#gArc').closest('svg').querySelectorAll('text')[1].textContent = tr('5.0% מהצופים', '5.0% of viewers');
  const sp = (id, n, base) => { seed = base; $(id).innerHTML = Array.from({ length: n }, (_, i) => `<i style="height:${20 + rnd() * 60 + i * 2}%"></i>`).join(''); };
  sp('#sp1', 14, 7); sp('#sp2', 14, 19);
  seed = 11 + range; const days = 14, now = new Date();
  const data = Array.from({ length: days }, (_, i) => { const w = new Date(now - (days - 1 - i) * 864e5); const v = Math.round((120 + i * 6 + rnd() * 90) * [0.2, 1, 3.6][range]); return { d: EN ? `${w.getMonth() + 1}/${w.getDate()}` : `${w.getDate()}.${w.getMonth() + 1}`, v, l: Math.max(1, Math.round(v * (0.03 + rnd() * .04))) }; });
  const mx = Math.max(...data.map(x => Math.max(x.v, x.l * 10)));
  $('#vbars').innerHTML = data.map(x => `<div class="b" style="flex-direction:row;align-items:flex-end" data-t="${x.d} · ${nf(x.v)} ${tr('צפיות', 'views')} · ${x.l} ${tr('פניות', 'inquiries')}"><i class="v1" style="width:50%;height:${x.v / mx * 100}%"></i><i class="v2" style="width:50%;height:${x.l * 10 / mx * 100}%"></i></div>`).join('');
  $('#vx').innerHTML = data.map((x, i) => `<span>${i % 2 ? '' : x.d}</span>`).join('');
  const src = [[S(0), 46, '#1d2621'], [['קמפיין ממומן', 'Paid campaign'], 27, '#f3dc2d'], [S(2), 17, '#7fb069'], [S(7), 10, '#cfccc2']];
  let acc = 0; const C = 2 * Math.PI * 40;
  $('#donut').innerHTML = `<svg viewBox="0 0 100 100"><g transform="rotate(-90 50 50)">${src.map(([, p, c]) => { const s = `<circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-width="16" stroke-dasharray="${C * p / 100 - 1.2} ${C}" stroke-dashoffset="${-C * acc / 100}"/>`; acc += p; return s; }).join('')}</g><text x="50" y="49" text-anchor="middle" font-family="Sora,Heebo" font-size="16" fill="#1c1f1b">46%</text><text x="50" y="62" text-anchor="middle" font-family="Heebo" font-size="8" fill="#6d716a">${P(S(0))}</text></svg>
    <ul>${src.map(([n, p, c]) => `<li><i style="background:${c}"></i>${P(n)}<b>${p}%</b></li>`).join('')}</ul>`;
  const rk = Object.entries(AVG).slice(0, 6), rmx = rk[0][1];
  $('#roomBars').innerHTML = rk.map(([k, s]) => `<div class="r"><span>${RN(k)}</span><span class="t"><i style="width:${s / rmx * 100}%"></i></span><b>${mmss(s)}</b></div>`).join('');
  const top = Object.entries(APTS).sort((a, b) => b[1].views - a[1].views).slice(0, 5);
  $('#topApts').innerHTML = top.map(([n, a], i) => `<a class="r" href="#building" data-apt="${n}" style="text-decoration:none"><span class="n">0${i + 1}</span><span>${aptLabel(n)} · ${tr('קומה', 'floor')} ${a.f} <span class="mute">· ${P(TYPES[a.t].rooms)} ${P(TYPES[a.t].name)}</span></span><span class="num">${nf(a.views)} <span class="mute" style="font-family:var(--f)">${tr('צפיות', 'views')}</span></span><span class="chip ${ST[a.st][1]}">${P(ST[a.st][0])}</span></a>`).join('');
  $$('#topApts [data-apt]').forEach(a => a.onclick = () => { sel.apt = +a.dataset.apt; });
  renderFeed();
}
function syncHeroDots() {
  if (current !== 'overview' || !pageViewer) return;
  const inApt = VIS.filter(v => v.apt === 8), ids = new Set(inApt.map(v => v.id));
  for (const id of [...pageViewer.dots.keys()]) if (!ids.has(id)) pageViewer.dropDot(id);
  inApt.forEach(v => pageViewer.setDot(v.id, v.room, avatar(v)));
  $('#inAptN').textContent = inApt.length;
  $('#inAptStack').innerHTML = inApt.slice(0, 3).map(avatar).join('');
  $('#ovStack').innerHTML = VIS.slice(0, 5).map(avatar).join('');
}
$$('#range button').forEach((b, i) => b.onclick = () => { $$('#range button').forEach(x => x.classList.toggle('on', x === b)); range = i; if (current === 'overview') route(); else toast({ title: tr('הטווח עודכן', 'Range updated'), sub: b.textContent }); });

const FEED = [
  ['tour', ['קונה מחיפה סיים סיור מודרך בדירה 8', 'A buyer from Haifa finished the guided tour of unit 8'], [2]],
  ['wa', ['הלינק לדירה 10 שותף בוואטסאפ', 'The unit 10 link was shared on WhatsApp'], [6]],
  ['lead', ['פנייה חדשה: בני סלאמה · דירה 4', 'New inquiry: Beni Salameh · unit 4'], [11]],
  ['eye', ['מיכל לוי חזרה לראות את יחידת ההורים בדירה 10', 'Michal Levi came back to look at the master suite in unit 10'], [18]],
  ['tour', ['אלכס פרידמן צפה 6 דק׳ בפנטהאוז', 'Alex Friedman spent 6 min in the penthouse'], [32]],
];
const ago = ([n]) => n === 0 ? tr('עכשיו', 'just now') : tr(`לפני ${n} דק׳`, `${n} min ago`);
const IC = {
  tour: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.4 8.4 0 1 1 21 11.5z"/></svg>',
  lead: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  live: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4"/></svg>',
  call: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>',
};
function renderFeed(fresh = false) { const el = $('#feed'); if (!el) return; el.innerHTML = FEED.slice(0, 6).map(([i, t, w], k) => `<li class="${fresh && k === 0 ? 'new' : ''}"><span class="ic" style="${i === 'lead' ? 'background:var(--y2)' : ''}">${IC[i]}</span><div>${P(t)}<small>${ago(w)}</small></div></li>`).join(''); }
function pushFeed(i, t) { FEED.forEach(f => f[2][0] += 1); FEED.unshift([i, t, [0]]); if (FEED.length > 20) FEED.pop(); if (current === 'overview') renderFeed(true); }

// ------------------------------------------------------------------ live
function live() { renderSessions(); renderPanel(); }
const isHot = v => v.aptT >= 180 && v.score >= 3;
function renderSessions() {
  $$('[data-live-n]').forEach(e => e.textContent = VIS.length);
  if (current !== 'live') return;
  $('#kTour').textContent = VIS.filter(v => v.tour).length; $('#kKnown').textContent = VIS.filter(v => v.lead).length; $('#kHot').textContent = VIS.filter(isHot).length;
  const order = [...VIS].sort((a, b) => (b.lead ? 1 : 0) - (a.lead ? 1 : 0) || b.score - a.score || b.aptT - a.aptT);
  $('#sess').innerHTML = order.map(v => `<div class="srow ${v.id === sel.live ? 'on' : ''}" data-id="${v.id}" tabindex="0">
    <div class="who">${avatar(v)}<div style="min-width:0"><b>${esc(vName(v))}</b><small>${v.lead ? tr('ליד מוכר · ', 'Known lead · ') : ''}${P(v.src)} · ${P(v.dev)}${v.visit > 1 ? tr(` · ביקור ${v.visit}`, ` · visit ${v.visit}`) : ''}</small></div></div>
    <div>${aptLabel(v.apt)} <span class="mute" style="font-size:12px">· ${P(TYPES[aptType(v.apt)].rooms)}</span></div>
    <div class="room"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/></svg><em data-room="${v.id}">${RN(v.room)}</em>${v.tour ? `<span class="chip dk" style="height:22px;font-size:11px">${tr('בסיור', 'On tour')}</span>` : ''}</div>
    <div class="num" data-tick="${v.id}">${mmss(v.aptT)}</div>
    <div>${heatBars(v.score)}</div>
    <div><button class="btn sm ${isHot(v) ? 'y' : 'o'}" data-help="${v.id}">${tr('הציעו עזרה', 'Offer help')}</button></div></div>`).join('');
  $$('#sess .srow').forEach(r => r.onclick = e => { sel.live = +r.dataset.id; renderSessions(); renderPanel(); if (e.target.dataset.help && innerWidth < 1100) $('#vpanel').scrollIntoView({ behavior: 'smooth' }); });
}
const chat = {};
function renderPanel() {
  if (current !== 'live') return;
  const v = VIS.find(x => x.id === sel.live) || VIS[0]; if (!v) { $('#vpanel').innerHTML = `<div class="card empty">${tr('אין כרגע גולשים', 'Nobody is online right now')}</div>`; return; }
  sel.live = v.id; const L = v.lead && LEADS.find(l => l.id === v.lead);
  const th = chat[v.id] || [];
  const tpl = [tr(`היי! רואה שאתה בודק את ${aptLabel(v.apt)}. רוצה שאראה לך אותה בשיחת וידאו קצרה?`, `Hi! I see you're looking at ${aptLabel(v.apt)}. Want me to show it to you on a quick video call?`),
    tr(`יש לך שאלה על ה${RN(v.room)}? אני כאן`, `Any questions about the ${RN(v.room).toLowerCase()}? I'm here`), tr('אפשר לשלוח לך תוכנית מכר ומחירון?', 'Can I send you the floor plan and price list?')];
  $('#vpanel').innerHTML = `
  <div class="card">
    <div class="vh">${avatar(v)}<div style="flex:1;min-width:0"><b>${esc(vName(v))}</b><div class="mute" style="font-size:12.5px">${L ? tr('ליד מוכר · ', 'Known lead · ') + `<span dir="ltr">${L.phone}</span>` : tr('מבקר אנונימי · עדיין לא השאיר פרטים', 'Anonymous visitor · no details yet')}</div></div>${heatBars(v.score)}</div>
    <div class="kv"><div><small>${tr('בדירה הזו', 'In this unit')}</small><b class="num" data-tick2="${v.id}">${mmss(v.aptT)}</b></div><div><small>${tr('חדרים שראה', 'Rooms seen')}</small><b class="num">${new Set(v.path).size}/8</b></div><div><small>${tr('ביקור', 'Visit')}</small><b class="num">${v.visit}</b></div></div>
    <div style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px"><span class="chip y">${aptLabel(v.apt)}</span><span>${tr('עכשיו ב', 'Now in: ')}<b style="font-weight:500" data-room2="${v.id}">${RN(v.room)}</b></span></div>
    <div data-plan="${v.id}">${planSVG(v.room, v.path)}</div>
    ${L ? `<p class="note" style="margin-top:6px">${tr('בביקורים קודמים: ', 'Previous visits: ')}${Object.entries(L.rooms).slice(0, 3).map(([k, s]) => `${RN(k)} ${mmss(s)}`).join(' · ')}</p>` : ''}
  </div>
  <div class="card">
    <div class="hd"><h3>${tr('הציעו עזרה עכשיו', 'Offer help now')}</h3></div>
    <div class="acts"><button class="btn y" id="vInvite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>${tr('הזמנה לשיחת וידאו', 'Invite to video call')}</button>${L ? `<a class="btn g" href="https://wa.me/972${L.phone.replace(/\D/g, '').slice(1)}" target="_blank" rel="noopener">WhatsApp</a>` : `<button class="btn o" disabled title="${tr('זמין אחרי שהקונה משאיר פרטים', 'Available once the buyer leaves details')}">${tr('שיחה טלפונית', 'Phone call')}</button>`}</div>
    <div class="tpl">${tpl.map(t => `<button>${esc(t)}</button>`).join('')}</div>
    <form class="compose" id="vForm"><input id="vIn" placeholder="${tr('הודעה שתקפוץ לקונה בתוך הדירה', 'Message that pops up for the buyer inside the unit')}" autocomplete="off"><button class="btn sm" type="submit">${tr('שליחה', 'Send')}</button></form>
    <div class="thread" id="vThread">${th.map(m => `<div class="msg ${m.me ? 'me' : 'them'}">${esc(P(m.text))}</div>`).join('')}</div>
  </div>
  <div class="card">
    <div class="hd"><h3>${tr('מה הקונה רואה', 'What the buyer sees')}</h3><span class="grow"></span><span class="chip">${P(v.dev)}</span></div>
    <div class="phone"><div class="scr"><div class="bar"><b>WalkMeIn</b><span>${aptLabel(v.apt)}</span></div><div class="pop" id="pop"></div><div class="rm"><span class="mute">${tr('אתם נמצאים ב', 'You are in')}</span><b data-room3="${v.id}">${RN(v.room)}</b></div></div></div>
    <p class="cap">${tr('ההודעה קופצת בפינת המסך, בלי להוציא את הקונה מהדירה', 'The message pops up in a corner, without taking the buyer out of the unit')}</p>
  </div>`;
  $$('.tpl button').forEach(b => b.onclick = () => { $('#vIn').value = b.textContent; $('#vIn').focus(); });
  $('#vForm').onsubmit = e => { e.preventDefault(); const t = $('#vIn').value.trim(); if (!t) return; $('#vIn').value = ''; sendChat(v, t); };
  $('#vInvite').onclick = () => invite(v);
}
function showPop(html, accept) {
  const p = $('#pop'); if (!p) return; p.innerHTML = html; p.classList.remove('on'); void p.offsetWidth; p.classList.add('on');
  if (accept) setTimeout(() => p.querySelector('.y')?.classList.add('hit'), 2300);
}
const REPLIES = [['כן, אשמח! יש חניה כלולה?', 'Yes please! Is parking included?'], ['תודה, רציתי לשאול מתי המסירה', 'Thanks, when is the handover?'], ['המרפסת נראית מעולה. מה הכיוון שלה?', 'The balcony looks great. Which way does it face?'], ['אפשר לקבל מחירון לקומה גבוהה יותר?', 'Can I get prices for a higher floor?']];
const popHead = () => `<div class="ph"><span class="av">${tr('ר', 'R')}</span><b>${TEAM()}</b></div>`;
function sendChat(v, t) {
  (chat[v.id] ||= []).push({ me: true, text: t }); renderThread(v);
  showPop(`${popHead()}${esc(t)}<div class="pa"><span class="y">${tr('לענות', 'Reply')}</span><span>${tr('לא עכשיו', 'Not now')}</span></div>`, true);
  setTimeout(() => { if (sel.live !== v.id) return; const th = $('#vThread'); if (th) { th.insertAdjacentHTML('beforeend', `<div class="typing" id="typing">${tr('הקונה מקליד…', 'Buyer is typing…')}</div>`); th.scrollTop = 1e4; } }, 1600);
  setTimeout(() => { $('#typing')?.remove(); const r = REPLIES[(chat[v.id].length - 1) % REPLIES.length]; chat[v.id].push({ me: false, text: r }); if (sel.live === v.id) renderThread(v);
    pushFeed('live', [`${v.name[0]} ענה בצ׳אט מתוך ${aptLabelL(v.apt, 0)}`, `${v.name[1]} replied in chat from ${aptLabelL(v.apt, 1)}`]); v.score = Math.min(5, v.score + 1); }, 3600);
}
function renderThread(v) { const th = $('#vThread'); if (!th) return; th.innerHTML = (chat[v.id] || []).map(m => `<div class="msg ${m.me ? 'me' : 'them'}">${esc(P(m.text))}</div>`).join(''); th.scrollTop = 1e4; }
function invite(v) {
  showPop(`${popHead()}${tr(`רוצה שאעבור איתך על ${aptLabel(v.apt)} בשיחת וידאו קצרה? אני רואה את מה שאתה רואה.`, `Want me to walk you through ${aptLabel(v.apt)} on a quick video call? I can see what you see.`)}<div class="pa"><span class="y">${tr('הצטרפות', 'Join')}</span><span>${tr('לא עכשיו', 'Not now')}</span></div>`, true);
  toast({ v, title: tr('ההזמנה נשלחה', 'Invite sent'), sub: tr(`${vName(v)} רואה אותה עכשיו בתוך הדירה`, `${vName(v)} sees it now, inside the unit`) });
  setTimeout(() => openCall(v), 2900);
}

// ------------------------------------------------------------------ video call (simulated)
let callV = null, callTimer = null, callT = 0, callScript = [];
function openCall(v) {
  if (callV) return;
  const m = $('#callM'); m.hidden = false; if (pageViewer) pageViewer.paused = true;
  $('#cAv').textContent = $('#rAv').textContent = vInit(v); $('#cAv').style.background = $('#rAv').style.background = v.color;
  $('#cName').textContent = vName(v); $('#rName').textContent = v.lead ? tr(`מתחברים ל${vName(v)}…`, `Connecting to ${vName(v)}…`) : tr('מתחברים לקונה…', 'Connecting to the buyer…'); $('#ring').hidden = false;
  const L = v.lead && LEADS.find(l => l.id === v.lead);
  $('#cInfo').innerHTML = `<div><b>${esc(vName(v))}</b> · ${aptLabel(v.apt)}</div><div>${tr('הגיע מ', 'Came from ')}${P(v.src)} · ${P(v.dev)}</div><div>${tr('חדרים שראה לפני השיחה: ', 'Rooms seen before the call: ')}${[...new Set(v.path)].map(RN).join(', ')}</div>${L ? `<div>${tr('טלפון', 'Phone')}: <span dir="ltr">${L.phone}</span></div>` : ''}`;
  $('#cThread').innerHTML = ''; callT = 0; $('#cTime').textContent = '00:00';
  callV = new Viewer($('#callStage'), { az: 0.5, el: 0.9, auto: false }); callV._v = v;
  const rooms = [['', tr('כל הדירה', 'Whole unit')], ['living', RN('living')], ['bal', RN('bal')], ['master', RN('master')], ['bed2', RN('bed2')], ['bed3', RN('bed3')]];
  $('#croom').innerHTML = rooms.map(([k, n]) => `<button data-k="${k}" class="${k ? '' : 'on'}">${n}</button>`).join('');
  $$('#croom button').forEach(b => b.onclick = () => { $$('#croom button').forEach(x => x.classList.toggle('on', x === b)); callV.flyTo(b.dataset.k); sys(tr(`עברתם ל${b.textContent} · הקונה רואה את אותו מבט`, `Moved to ${b.textContent} · the buyer sees the same view`)); });
  callScript = [setTimeout(() => {
    if (!callV) return; $('#ring').hidden = true; callTimer = setInterval(() => { callT++; $('#cTime').textContent = `${String(Math.floor(callT / 60)).padStart(2, '0')}:${String(callT % 60).padStart(2, '0')}`; }, 1000);
    say(tr('היי, כן, שומע אותך מצוין', 'Hi, yes, I can hear you fine'));
    callScript.push(setTimeout(() => { callV?.flyTo('bal'); $$('#croom button').forEach(x => x.classList.toggle('on', x.dataset.k === 'bal')); sys(tr('הקונה ביקש לראות את המרפסת', 'The buyer asked to see the balcony')); }, 3500),
      setTimeout(() => say(tr('וואו, היא גדולה ממה שחשבתי. לאיזה כיוון היא פונה?', 'Wow, it’s bigger than I thought. Which way does it face?')), 5200),
      setTimeout(() => say(tr('ויש מחסן לדירה הזו?', 'And does this unit come with storage?')), 14000));
  }, 1700)];
  pushFeed('call', [`שיחת וידאו התחילה עם ${v.name[0]} · ${aptLabelL(v.apt, 0)}`, `Video call started with ${v.name[1]} · ${aptLabelL(v.apt, 1)}`]);
}
function sys(t) { $('#cThread').insertAdjacentHTML('beforeend', `<div class="note" style="text-align:center;margin:2px 0">${esc(t)}</div>`); $('#cThread').scrollTop = 1e4; }
function say(t, me = false) { $('#cThread').insertAdjacentHTML('beforeend', `<div class="msg ${me ? 'me' : 'them'}">${esc(t)}</div>`); $('#cThread').scrollTop = 1e4; if (!me) { $('#tThem').classList.add('spk'); setTimeout(() => $('#tThem').classList.remove('spk'), 2500); } }
$('#cForm').onsubmit = e => { e.preventDefault(); const t = $('#cIn').value.trim(); if (t) { say(t, true); $('#cIn').value = ''; } };
$$('.cbar .tgl').forEach(b => b.onclick = () => b.classList.toggle('off'));
function closeCall() {
  if (!callV) return; const v = callV._v; clearInterval(callTimer); callScript.forEach(clearTimeout);
  callV.dispose(); callV = null; $('#callM').hidden = true; if (pageViewer) pageViewer.paused = false;
  toast({ v, title: tr('השיחה הסתיימה', 'Call ended'), sub: tr(`${mmss(callT)} דק׳ · נשמרה בכרטיס של ${vName(v)}`, `${mmss(callT)} min · saved to ${vName(v)}'s card`) });
  pushFeed('call', [`שיחת וידאו עם ${v.name[0]} הסתיימה · ${mmss(callT)} דק׳`, `Video call with ${v.name[1]} ended · ${mmss(callT)} min`]);
}
$('#cEnd').onclick = closeCall;
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#callM').hidden) closeCall(); });

// ------------------------------------------------------------------ building
function building() {
  const svg = `<svg viewBox="0 0 2688 1520" preserveAspectRatio="xMidYMid slice"><g>
  <path data-n="9" d="M635,270 L943,342 L943,536 L635,481Z"/><path data-n="10" d="M943,342 L1251,414 L1251,591 L943,536Z"/>
  <path data-n="7" d="M635,481 L943,536 L943,722 L635,684Z"/><path data-n="8" d="M943,536 L1251,591 L1251,760 L943,722Z"/>
  <path data-n="5" d="M635,684 L943,722 L943,889 L635,853Z"/><path data-n="6" d="M943,722 L1251,760 L1251,926 L943,889Z"/>
  <path data-n="3" d="M635,853 L943,889 L943,1077 L635,1064Z"/><path data-n="4" d="M943,889 L1251,926 L1251,1090 L943,1077Z"/></g></svg>`;
  const C = { 9: [789, 407], 10: [1097, 471], 7: [789, 606], 8: [1097, 652], 5: [789, 787], 6: [1097, 824], 3: [789, 971], 4: [1097, 996] };
  const w = $('#bwrap'); $$('#bwrap svg,#bwrap .blab,#bwrap .blegend').forEach(e => e.remove());
  w.insertAdjacentHTML('beforeend', svg + Object.entries(C).map(([n, [x, y]]) => { const lv = VIS.filter(v => v.apt === +n).length; return `<div class="blab" style="left:${x / 26.88}%;top:${y / 15.2}%"><b>${n}</b>${lv ? `<span class="lv"><i class="dot"></i>${lv} ${tr('עכשיו', 'now')}</span>` : `<span>${APTS[n].views} ${tr('צפיות', 'views')}</span>`}</div>`; }).join('') +
    `<div class="blegend"><span><i style="background:#7fdc5a"></i>${P(ST.av_[0])}</span><span><i style="background:#f3dc2d"></i>${P(ST.rs[0])}</span><span><i style="background:#5a5f5a"></i>${P(ST.sd[0])}</span></div>`);
  const tip = $('#btip');
  $$('#bwrap path').forEach(p => {
    const n = +p.dataset.n, a = APTS[n], T = TYPES[a.t]; p.classList.add(a.st); if (n === sel.apt) p.classList.add('sel');
    p.onmousemove = e => { const r = w.getBoundingClientRect(); const x = e.clientX - r.left; tip.style.left = Math.max(0, Math.min(r.width - 230, x + 14)) + 'px'; tip.style.top = (e.clientY - r.top + 14) + 'px'; tip.classList.add('on');
      tip.innerHTML = `<b>${aptLabel(n)}</b> <span class="chip ${ST[a.st][1]}" style="height:22px">${P(ST[a.st][0])}</span><div class="mute" style="font-size:12.5px">${tr('קומה', 'Floor')} ${a.f} · ${P(T.rooms)} · ${P(T.sqm)}</div><div class="kv"><div><small>${tr('צפיות', 'Views')}</small><b>${a.views}</b></div><div><small>${tr('פניות', 'Inquiries')}</small><b>${a.leads}</b></div><div><small>${tr('עכשיו', 'Now')}</small><b>${VIS.filter(v => v.apt === n).length}</b></div></div>`; };
    p.onmouseleave = () => tip.classList.remove('on');
    p.onclick = () => { sel.apt = n; $$('#bwrap path').forEach(x => x.classList.toggle('sel', x === p)); aptCard(n); };
  });
  aptCard(sel.apt);
  $('#typesT').innerHTML = Object.entries(TYPES).map(([k, t]) => `<tr class="click" data-t="${k}"><td><b style="font-weight:500">${P(t.name)}</b></td><td>${P(t.rooms)}</td><td>${P(t.sqm)}</td><td class="num">₪${nf(t.price)}</td><td class="num">${nf(t.views)}<span class="minibar"><i style="width:${t.views / 5.12}%"></i></span></td><td class="num">${mmss(t.avg)}</td><td class="num">${t.leads}</td><td class="num">${(t.leads / t.views * 100).toFixed(1)}%</td><td class="num">${t.free}</td></tr>`).join('');
  $$('#typesT tr').forEach(r => r.onclick = () => { sel.type = r.dataset.t; location.hash = '#apartment'; });
}
function aptCard(n) {
  const a = APTS[n], T = TYPES[a.t], lv = VIS.filter(v => v.apt === n), ld = LEADS.filter(l => l.apt === n);
  $('#bSelTitle').innerHTML = `${aptLabel(n)} <span class="chip ${ST[a.st][1]}">${P(ST[a.st][0])}</span>`;
  $('#bSel').className = '';
  $('#bSel').innerHTML = `<div class="mute" style="font-size:13px">${tr('קומה', 'Floor')} ${a.f} · ${P(T.name)} · ${P(T.rooms)} · ${P(T.sqm)} · ${tr('מ־', 'from ')}₪${nf(T.price + (a.f - 2) * 40000)}</div>
    <div class="stat3 mt"><div><small>${tr('צפיות', 'Views')}</small><b>${a.views}</b></div><div><small>${tr('פניות', 'Inquiries')}</small><b>${a.leads}</b></div><div><small>${tr('צופים עכשיו', 'Viewing now')}</small><b>${lv.length}</b></div></div>
    ${ld.length ? `<div class="mt" style="font-size:13px"><span class="mute">${tr('לידים שמתעניינים:', 'Interested leads:')}</span> ${ld.map(l => `<a href="#leads" data-l="${l.id}" class="chip ${LBL[l.st][1]}" style="text-decoration:none">${P(l.name)}</a>`).join(' ')}</div>` : ''}
    ${lv.length ? `<div class="mt" style="display:flex;align-items:center;gap:8px;font-size:13px"><span class="stack">${lv.map(avatar).join('')}</span>${tr(`${lv.length} קונים בתוך הדירה עכשיו`, `${lv.length} buyers inside the unit now`)}</div>` : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap" class="mt"><a class="btn" href="#apartment" data-type="${a.t}">${tr('לנתוני הדירה', 'Unit insights')}</a><a class="btn o" href="#links" data-apt="${n}">${tr('לינק אישי לדירה', 'Personal link')}</a>${lv.length ? `<a class="btn y" href="#live" data-v="${lv[0].id}">${tr('להציע עזרה', 'Offer help')}</a>` : ''}</div>`;
  $$('#bSel [data-l]').forEach(x => x.onclick = () => sel.lead = +x.dataset.l);
  $$('#bSel [data-type]').forEach(x => x.onclick = () => sel.type = x.dataset.type);
  $$('#bSel [data-apt]').forEach(x => x.onclick = () => sel.linkApt = n);
  $$('#bSel [data-v]').forEach(x => x.onclick = () => sel.live = +x.dataset.v);
}

// ------------------------------------------------------------------ apartment
function apartment() {
  $('#aTypes').innerHTML = Object.entries(TYPES).map(([k, t]) => `<button class="${k === sel.type ? 'on' : ''}" data-k="${k}">${P(t.name)} · ${P(t.rooms)}</button>`).join('');
  $$('#aTypes button').forEach(b => b.onclick = () => { sel.type = b.dataset.k; route(); });
  const T = TYPES[sel.type]; seed = sel.type.charCodeAt(0) * 97;
  const heat = {}; for (const k of WALK) heat[k] = Math.round(AVG[k] * (0.7 + rnd() * 0.6));
  pageViewer = new Viewer($('#apStage'), { heat, labels: Object.entries(heat).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, s]) => [k, `${RN(k).split(' /')[0]} <b>${mmss(s)}</b>`]) });
  const opened = T.views, steps = [[tr('פתחו את המודל', 'Opened the model'), opened], [tr('סובבו את הדירה', 'Rotated the unit'), Math.round(opened * .82)], [tr('התחילו סיור מודרך', 'Started the tour'), Math.round(opened * .54)], [tr('סיימו את הסיור', 'Finished the tour'), Math.round(opened * .31)], [tr('השאירו פרטים', 'Left details'), T.leads]];
  $('#aViews').textContent = tr(`${nf(opened)} צפיות · 7 ימים`, `${nf(opened)} views · 7 days`);
  $('#funnel').innerHTML = steps.map(([n, v]) => `<div class="r"><span>${n}</span><span class="t"><i style="width:${Math.max(6, v / opened * 100)}%">${Math.round(v / opened * 100)}%</i></span><b>${nf(v)}</b></div>`).join('');
  const stops = EN ? ['Entry', 'Living', 'Kitchen', 'Balcony', 'Dining', 'Hallway', 'Bedroom', 'Safe room', 'Master', 'Summary'] : ['כניסה', 'סלון', 'מטבח', 'מרפסת', 'פינת אוכל', 'מסדרון', 'חדר שינה', 'ממ״ד', 'יחידת הורים', 'סיכום'];
  let ret = 100; const vals = stops.map((s, i) => { const drop = i === 6 ? 14 : 2 + rnd() * 6; ret = i ? ret - drop : 100; return [s, Math.round(ret), i === 6]; });
  $('#stops').innerHTML = vals.map(([s, v, d]) => `<div class="s ${d ? 'drop' : ''}" title="${s}: ${v}%"><i style="height:${v}%"></i><small>${s.split(' ')[0]}</small></div>`).join('');
  $('#dropNote').textContent = tr('הנשירה הגדולה: במעבר לחדר השינה (‎-14%). כדאי לקצר את הקריינות שם או להתחיל אותה בנקודה מעניינת.', 'Biggest drop: moving into the bedroom (−14%). Shorten the narration there or open it on a stronger point.');
  const vis = { living: 99, bal: 84, master: 77, bed2: 61, bed3: 56, bath: 41, ensuite: 33, hall: 92 };
  const rk = Object.entries(heat).sort((a, b) => b[1] - a[1]), mx = rk[0][1];
  $('#aRooms').innerHTML = rk.map(([k, s]) => `<div class="r"><span>${RN(k)}</span><span class="t"><i style="width:${s / mx * 100}%"></i></span><b>${mmss(s)}</b></div><div class="soft" style="font-size:11.5px;margin-top:-8px">${tr(`${vis[k]}% מהצופים ביקרו`, `${vis[k]}% of viewers visited`)}</div>`).join('');
  const feats = [[tr('סיבוב 360°', '360° rotation'), 82], [tr('תוכנית ותלת־ממד', 'Plan & 3D'), 61], [tr('גובה העיניים', 'Eye level'), 52], [tr('חדרים ומידות', 'Rooms & sizes'), 47], [tr('תצוגה בשכבות', 'Layered view'), 38], [tr('סיור מודרך', 'Guided tour'), 54]];
  $('#aFeat').innerHTML = feats.map(([n, p]) => `<div class="r"><span>${n}</span><b class="num">${p}%</b><span class="t"><i style="width:${p}%"></i></span></div>`).join('');
  const ins = [['eye', tr(`המרפסת היא החדר השני הכי נצפה ב${P(T.name)}. כדאי לפתוח איתה את הקמפיין.`, `The balcony is the second most viewed room in ${P(T.name)}. Lead the campaign with it.`)], ['tour', tr('מי שסיים את הסיור המודרך משאיר פרטים פי 4 יותר ממי שלא.', 'Buyers who finish the guided tour leave details 4× more often.')], ['lead', tr(`${T.leads} פניות השבוע. 60% מהן מהנייד, רובן בין 20:00 ל־23:00.`, `${T.leads} inquiries this week. 60% on mobile, mostly between 8 and 11 pm.`)], ['wa', tr('כל לינק ששותף בוואטסאפ נפתח בממוצע 2.3 פעמים, לרוב על ידי בן או בת הזוג.', 'Every link shared on WhatsApp is opened 2.3 times on average, usually by a partner.')]];
  $('#aInsights').innerHTML = ins.map(([i, t]) => `<li><span class="ic">${IC[i]}</span><div>${t}</div></li>`).join('');
}

// ------------------------------------------------------------------ leads
let lFilter = 'all';
function leads() {
  const tabs = [['all', tr('הכל', 'All')], ['h', tr('חמים', 'Hot')], ['w', tr('פושרים', 'Warm')], ['c', tr('קרים', 'Cold')], ['n', tr('חדשים', 'New')]];
  $('#lTabs').innerHTML = tabs.map(([k, n]) => `<button class="${k === lFilter ? 'on' : ''}" data-k="${k}">${n}<b>${k === 'all' ? LEADS.length : LEADS.filter(l => l.st === k).length}</b></button>`).join('');
  $$('#lTabs button').forEach(b => b.onclick = () => { lFilter = b.dataset.k; leads(); });
  const list = LEADS.filter(l => lFilter === 'all' || l.st === lFilter);
  if (!list.find(l => l.id === sel.lead)) sel.lead = list[0]?.id;
  $('#lList').innerHTML = list.map(l => { const lv = VIS.find(v => v.lead === l.id); const v = { init: P(l.name)[0], color: COLORS[l.id % COLORS.length] };
    return `<div class="lrow ${l.id === sel.lead ? 'on' : ''}" data-id="${l.id}" tabindex="0"><div style="display:flex;align-items:center;gap:10px;min-width:0">${avatar(v)}<div style="min-width:0"><b style="font-weight:500">${P(l.name)}</b>${lv ? ` <span class="chip g" style="height:20px;font-size:11px"><i class="dot"></i>${tr('באתר עכשיו', 'Online now')}</span>` : ''}<div class="soft" style="font-size:12px">${P(l.src)} · ${P(l.date)}</div></div></div><div>${aptLabel(l.apt)}</div><div class="num">${mmss(l.total)}</div><div class="num">${l.visits} ${tr('ביקורים', 'visits')}</div><div><span class="chip ${LBL[l.st][1]}">${P(LBL[l.st][0])}</span></div></div>`; }).join('');
  $$('#lList .lrow').forEach(r => r.onclick = () => { sel.lead = +r.dataset.id; leads(); if (innerWidth < 1100) $('#lCard').scrollIntoView({ behavior: 'smooth' }); });
  leadCard();
}
function leadCard() {
  const l = LEADS.find(x => x.id === sel.lead); if (!l) { $('#lCard').innerHTML = `<div class="card empty">${tr('אין לידים בקטגוריה הזו', 'No leads in this group')}</div>`; return; }
  const v = { init: P(l.name)[0], color: COLORS[l.id % COLORS.length] }, lv = VIS.find(x => x.lead === l.id), fn = first(l.name);
  const top = Object.entries(l.rooms).sort((a, b) => b[1] - a[1]);
  seed = l.id * 31; const ago2 = EN ? ['3 days ago', 'a week ago', '9 days ago', '2 weeks ago'] : ['לפני 3 ימים', 'לפני שבוע', 'לפני 9 ימים', 'לפני שבועיים'];
  const vis = Array.from({ length: l.visits }, (_, i) => ({ when: i === 0 ? P(l.date) : ago2[i - 1], dur: Math.round(l.total / l.visits * (0.6 + rnd() * .8)), rooms: top.slice(0, 2 + Math.floor(rnd() * 3)).map(([k]) => k), tour: rnd() > .4 }));
  $('#lCard').innerHTML = `<div class="card">
    <div class="vh">${avatar(v)}<div style="flex:1"><b>${P(l.name)}</b><div class="mute" style="font-size:12.5px">${tr('מתעניין ב', 'Interested in ')}${aptLabel(l.apt)} · ${P(TYPES[aptType(l.apt)].rooms)}</div></div><span class="chip ${LBL[l.st][1]}">${P(LBL[l.st][0])}</span></div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:13px"><span dir="ltr">${l.phone}</span><span dir="ltr" class="mute">${l.email}</span></div>
    <div class="kv"><div><small>${tr('חדרים שביקר', 'Rooms visited')}</small><b class="num">${top.length}/8</b></div><div><small>${tr('הכי הרבה זמן', 'Most time')}</small><b>${RNS(top[0][0])}</b></div><div><small>${tr('ביקורים', 'Visits')}</small><b class="num">${l.visits}</b></div><div><small>${tr('זמן כולל', 'Total time')}</small><b class="num">${mmss(l.total)}</b></div><div><small>${tr('הגיע מ', 'Source')}</small><b style="font-size:13px">${P(l.src)}</b></div><div><small>${tr('רמת עניין', 'Interest')}</small><b>${heatBars(l.score)}</b></div></div>
    ${lv ? `<a class="btn y mt" style="width:100%" href="#live" id="lLive"><i class="dot"></i>${tr(`${P(l.name)} באתר עכשיו · להציע עזרה`, `${P(l.name)} is online now · offer help`)}</a>` : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap" class="mt"><a class="btn g" href="https://wa.me/972${l.phone.replace(/\D/g, '').slice(1)}" target="_blank" rel="noopener">WhatsApp</a><button class="btn o" id="lCall">${tr('שיחה', 'Call')}</button><button class="btn" id="lCrm">${tr('שליחה ל־CRM', 'Send to CRM')}</button></div>
  </div>
  <div class="card"><div class="hd"><h3>${tr(`מה ${fn} ראה בדירה`, `What ${fn} looked at`)}</h3><span class="grow"></span><span class="chip">${tr('זמן בכל חדר', 'Time per room')}</span></div>${planSVG(null, [], l.rooms)}
    <div class="rooms">${top.map(([k, s]) => `<span>${RN(k)} <b>${mmss(s)}</b></span>`).join('')}</div></div>
  <div class="card"><div class="hd"><h3>${tr('היסטוריית ביקורים', 'Visit history')}</h3></div><ul class="tl">${vis.map((x, i) => `<li class="${i === 0 ? 'hot' : ''}"><b style="font-weight:500">${x.when}</b> · ${mmss(x.dur)} ${tr('דק׳', 'min')}${x.tour ? tr(' · סיים סיור מודרך', ' · finished the guided tour') : ''}<div class="rooms">${x.rooms.map(k => `<span>${RN(k)}</span>`).join('')}</div></li>`).join('')}<li><b style="font-weight:500">${l.src === S(5) ? tr('קיבל לינק אישי', 'Received a personal link') : tr('נכנס לראשונה', 'First visit')}</b><small>${tr('מקור: ', 'Source: ')}${P(l.src)}</small></li></ul>
    <p class="note">${tr(`תקציר לאיש המכירות: ${fn} חזר ${l.visits} פעמים ובילה הכי הרבה זמן ב${RN(top[0][0])} וב${RN(top[1][0])}. כדאי לפתוח את השיחה משם.`, `Sales brief: ${fn} came back ${l.visits} times and spent the most time in the ${RN(top[0][0]).toLowerCase()} and the ${RN(top[1][0]).toLowerCase()}. Open the call there.`)}</p></div>`;
  $('#lCrm').onclick = () => toast({ v, title: tr('נשלח ל־CRM', 'Sent to CRM'), sub: tr(`${P(l.name)} · כולל היסטוריית הצפייה`, `${P(l.name)} · with viewing history`) });
  $('#lCall').onclick = () => toast({ v, title: tr(`מחייגים ל${P(l.name)}`, `Calling ${P(l.name)}`), sub: l.phone });
  if (lv) $('#lLive').onclick = () => sel.live = lv.id;
}

// ------------------------------------------------------------------ links
const LINKS = [
  [['מיכל לוי', 'Michal Levi'], 10, ['לפני 4 ימים', '4 days ago'], true, 1240, 4, 'master'], [['בני סלאמה', 'Beni Salameh'], 4, ['היום, 09:15', 'Today, 09:15'], true, 260, 1, 'bal'], [['רון קדוש', 'Ron Kadosh'], 8, ['אתמול', 'Yesterday'], true, 540, 2, 'living'],
  [['ליאת שמש', 'Liat Shemesh'], 6, ['אתמול', 'Yesterday'], false, 0, 0, ''], [['איתי ברק', 'Itai Barak'], 9, ['לפני 2 ימים', '2 days ago'], true, 310, 1, 'bed3'], [['סוהא חורי', 'Suha Khoury'], 8, ['לפני 3 ימים', '3 days ago'], true, 720, 3, 'bal'],
  [['גיל אדלר', 'Gil Adler'], 'P', ['לפני 5 ימים', '5 days ago'], true, 880, 2, 'bal'], [['אנה קוגן', 'Anna Kogan'], 5, ['לפני שבוע', 'A week ago'], false, 0, 0, ''],
];
function links() {
  $('#lnApt').innerHTML = [...Object.keys(APTS).map(n => `<option value="${n}">${aptLabel(n)} · ${tr('קומה', 'floor')} ${APTS[n].f} · ${P(TYPES[APTS[n].t].rooms)}</option>`), `<option value="P">${aptLabel('P')}</option>`].join('');
  if (sel.linkApt) $('#lnApt').value = sel.linkApt;
  if (EN && $('#lnName').value === 'יעל ברק') $('#lnName').value = 'Yael Barak'; if (!EN && $('#lnName').value === 'Yael Barak') $('#lnName').value = 'יעל ברק';
  renderLinks();
  $('#lnkForm').onsubmit = e => {
    e.preventDefault(); const name = $('#lnName').value.trim() || tr('לקוח', 'Client'), apt = $('#lnApt').value, fn = name.split(' ')[0];
    const url = `walkmein.com/p/${['dani', 'yael', 'noa', 'ron', 'maya', 'omer'][name.length % 6]}-${apt.toLowerCase()}`;
    const from = $('#lnFrom').selectedOptions[0].textContent;
    const msg = tr(`היי ${fn}, כאן ${from} מנוף הכרמל 👋\nהכנתי לך את ${aptLabel(apt)} בתלת־ממד, אפשר לסובב, להיכנס פנימה ולשמוע הסבר על כל חדר:\nhttps://${url}`,
      `Hi ${fn}, it's ${from} from Nof HaCarmel 👋\nI've set up ${aptLabel(apt)} in 3D for you. You can rotate it, step inside and hear about every room:\nhttps://${url}`);
    $('#lnOut').innerHTML = `<div class="hd"><h3>${tr('הלינק מוכן', 'Your link is ready')}</h3></div><div class="wa">${esc(msg).replace(/\n/g, '<br>').replace(/https:\/\/\S+/, m => `<a href="${m}" target="_blank" rel="noopener">${m}</a>`)}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap" class="mt"><button class="btn o sm" id="lnCopy">${tr('העתקת הודעה', 'Copy message')}</button><a class="btn g sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">${tr('פתיחה בוואטסאפ', 'Open in WhatsApp')}</a></div>`;
    $('#lnCopy').onclick = () => { navigator.clipboard?.writeText(msg).then(() => toast({ title: tr('ההודעה הועתקה', 'Message copied') }), () => toast({ title: tr('סמנו והעתיקו את ההודעה', 'Select and copy the message') })); };
    const row = [[name, name], apt === 'P' ? 'P' : +apt, ['עכשיו', 'Just now'], false, 0, 0, '']; LINKS.unshift(row); renderLinks();
    setTimeout(() => { row[3] = true; row[4] = 42; row[5] = 1; row[6] = 'living'; if (current === 'links') renderLinks();
      const tv = { init: name[0], color: '#fff27a' };
      toast({ v: tv, title: tr(`${name} פתח/ה את הלינק`, `${name} opened the link`), sub: tr(`${aptLabel(row[1])} · עכשיו בסלון`, `${aptLabel(row[1])} · now in the living room`), action: { label: tr('לצפייה', 'View'), fn: () => { const nv = mkVisitor({ apt: row[1], room: 'living', t: 40, aptT: 40 }); nv.name = [name, name]; nv.init = name[0]; nv.color = '#fff27a'; nv.src = S(5); nv.score = 3; VIS.unshift(nv); goLive(nv.id)(); } } }); }, 7000);
  };
}
function renderLinks() {
  const o = LINKS.filter(l => l[3]).length; $('#lnStat').textContent = tr(`${o} מתוך ${LINKS.length} נפתחו`, `${o} of ${LINKS.length} opened`);
  $('#lnT').innerHTML = LINKS.map(([n, a, s, op, t, v, back]) => `<tr><td><b style="font-weight:500">${esc(P(n))}</b></td><td>${aptLabel(a)}</td><td class="mute">${P(s)}</td><td>${op ? `<span class="chip g">${tr('נפתח', 'Opened')}</span>` : `<span class="chip">${tr('טרם נפתח', 'Not opened')}</span>`}</td><td class="num">${op ? mmss(t) : '–'}</td><td class="num">${op ? v : '–'}</td><td>${back ? RN(back) : '<span class="soft">–</span>'}</td></tr>`).join('');
}

// ------------------------------------------------------------------ settings
function settings() {
  const F = [[['סיבוב חופשי 360°', 'Free 360° rotation'], ['גוררים ומסובבים את הדירה', 'Drag and spin the unit'], 1], [['תוכנית ותלת־ממד', 'Plan & 3D'], ['מעבר בלחיצה בין התוכנית למודל', 'Switch between the plan and the model'], 1], [['חדרים ומידות', 'Rooms & sizes'], ['רשימת חדרים עם שטחים', 'Room list with areas'], 1], [['תצוגה בשכבות', 'Layered view'], ['רצפה, קירות וריהוט', 'Floor, walls and furniture'], 1], [['הליכה בגובה העיניים', 'Eye-level walk'], ['נכנסים לסלון ומסתכלים סביב', 'Step into the living room and look around'], 1], [['סיור מודרך עם קריינות', 'Narrated guided tour'], ['עברית ואנגלית · 10 עצירות', 'Hebrew & English · 10 stops'], 1], [['בחירת קומה ודירה', 'Floor & unit picker'], ['הבניין עם סטטוס זמינות', 'The building with availability'], 1], [['טופס פנייה בכל דירה', 'Inquiry form in every unit'], ['הליד מגיע עם שם הדירה', 'Leads arrive with the unit name'], 1], [['קישור לוואטסאפ ולאתר', 'WhatsApp & website link'], ['לינק שיתוף והטמעה', 'Share link and embed'], 1], [['שפות נוספות', 'Extra languages'], ['אנגלית ורוסית פעילות · צרפתית כבויה', 'English and Russian on · French off'], 0], [['חיבור ל־CRM', 'CRM connection'], ['Salesforce', 'Salesforce'], 1]];
  $('#feats').innerHTML = F.map(([n, s, on]) => `<div class="tg"><div><b>${P(n)}</b><small>${P(s)}</small></div><button class="sw" role="switch" aria-checked="${!!on}" aria-label="${P(n)}"></button></div>`).join('');
  bindSwitches();
  $('#cpEmbed').onclick = () => navigator.clipboard?.writeText($('#embed').textContent).then(() => toast({ title: tr('קוד ההטמעה הועתק', 'Embed code copied') }), () => toast({ title: tr('סמנו והעתיקו את הקוד', 'Select and copy the code') }));
}
function bindSwitches() { $$('.sw').forEach(s => s.onclick = () => { const on = s.getAttribute('aria-checked') !== 'true'; s.setAttribute('aria-checked', on); toast({ title: on ? tr('הופעל', 'Turned on') : tr('כובה', 'Turned off'), sub: s.getAttribute('aria-label') }); }); }
bindSwitches();

// ------------------------------------------------------------------ live simulation
const goLive = id => { const f = () => { sel.live = id; if (location.hash === '#live') live(); else location.hash = '#live'; }; return f; };
setInterval(() => {
  VIS.forEach(v => { v.t++; v.aptT++; });
  $$('[data-tick]').forEach(e => { const v = VIS.find(x => x.id === +e.dataset.tick); if (v) e.textContent = mmss(v.aptT); });
  $$('[data-tick2]').forEach(e => { const v = VIS.find(x => x.id === +e.dataset.tick2); if (v) e.textContent = mmss(v.aptT); });
  VIS.forEach(v => { if (v.lead && !v.alerted && v.aptT >= 180) { v.alerted = true; toast({ v, title: tr(`${vName(v)} כבר ${mmss(v.aptT)} דק׳ ב${aptLabel(v.apt)}`, `${vName(v)}: ${mmss(v.aptT)} min in ${aptLabel(v.apt)}`), sub: tr(`עכשיו ב${RN(v.room)} · ליד חם`, `Now in the ${RN(v.room).toLowerCase()} · hot lead`), action: { label: tr('להציע עזרה', 'Offer help'), fn: goLive(v.id) } }); } });
}, 1000);
setInterval(() => {
  const v = pick(VIS); if (!v) return;
  const next = pick(WALK.filter(k => k !== v.room)); v.room = next; v.path.push(next); if (rnd() > .8) v.tour = !v.tour;
  $$(`[data-room="${v.id}"]`).forEach(e => { e.textContent = RN(next); e.classList.add('chg'); setTimeout(() => e.classList.remove('chg'), 900); });
  $$(`[data-room2="${v.id}"],[data-room3="${v.id}"]`).forEach(e => e.textContent = RN(next));
  const pl = $(`[data-plan="${v.id}"]`); if (pl) pl.innerHTML = planSVG(next, v.path);
  if (current === 'overview' && v.apt === 8) syncHeroDots();
  if (rnd() > .65) { const c = pick(CITIES); const r = rnd();
    pushFeed(r > .66 ? 'eye' : r > .33 ? 'tour' : 'wa', r > .66 ? [`${v.name[0]} נכנס ל${RNP[next][0]} ב${aptLabelL(v.apt, 0)}`, `${v.name[1]} entered the ${RNP[next][1].toLowerCase()} in ${aptLabelL(v.apt, 1)}`]
      : r > .33 ? [`קונה מ${c[0]} התחיל סיור מודרך ב${aptLabelL(v.apt, 0)}`, `A buyer from ${c[1]} started the guided tour of ${aptLabelL(v.apt, 1)}`] : [`הלינק ל${aptLabelL(v.apt, 0)} שותף בוואטסאפ`, `The ${aptLabelL(v.apt, 1)} link was shared on WhatsApp`]); }
}, 2600);
setInterval(() => {
  if (VIS.length > 11 && rnd() > .45) { const i = VIS.findIndex(v => !v.lead && v.id !== sel.live); if (i > -1) { const [g] = VIS.splice(i, 1); if (current === 'overview') pageViewer?.dropDot(g.id); } }
  else { const lid = POOL.shift(); const v = lid ? mkVisitor({ lead: lid, t: 5, aptT: 5 }) : mkVisitor({ t: 5, aptT: 5 }); VIS.push(v);
    if (lid) { const L = LEADS.find(l => l.id === lid); toast({ v, title: tr(`${P(L.name)} חזר/ה לאתר`, `${P(L.name)} is back on the site`), sub: tr(`${aptLabel(v.apt)} · ביקור מס׳ ${v.visit} · ${P(L.src)}`, `${aptLabel(v.apt)} · visit #${v.visit} · ${P(L.src)}`), action: { label: tr('לצפייה', 'View'), fn: goLive(v.id) } }); pushFeed('live', [`${L.name[0]} חזר/ה לאתר · ${aptLabelL(v.apt, 0)}`, `${L.name[1]} is back on the site · ${aptLabelL(v.apt, 1)}`]); } }
  renderSessions(); if (current === 'live' && !VIS.find(x => x.id === sel.live)) renderPanel();
  if (current === 'overview') syncHeroDots();
}, 9000);

applyLang();
route();
