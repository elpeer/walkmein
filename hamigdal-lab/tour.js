// Guided tour of the type C apartment (Hamigdal Bechorshot): stops, camera framing and the Hebrew narration.
// rooms = which rooms glow; at = plan point (PDF pt) the camera looks at; d = camera distance (m); az = orbit nudge.
// pov = the walk-through: stand at pos looking at look; path = waypoints walked from the previous stop (omitted = fade cut); from = where the walk starts.
export const TOUR = [
  { id: 'entry', pov: { pos: [330, 700], look: [430, 380], path: [], from: [330, 775], sweep: 0.35 }, title: 'כניסה', rooms: ['entry'], at: [420, 600], d: 11, az: 0.15, up: 2.3,
    text: 'ברוכים הבאים להמגדל בחורשות, מגדל מגורים בן 19 קומות של קבוצת מנרב, ליד פארק החורשות בתל אביב. לפניכם דירת 4 חדרים, טיפוס C: כ־101 מטרים רבועים ומרפסת של כ־14 מטרים רבועים. נכנסים דרך דלת ביטחון מעוצבת, עם אינטרקום וצג צבעוני.' },
  { id: 'living', pov: { pos: [600, 650], look: [380, 430], path: [[400, 690], [520, 670]], sweep: 0.42 }, title: 'סלון ופינת אוכל', rooms: ['living'], at: [470, 520], d: 9.5, az: 0,
    text: 'חלל המגורים פתוח ומואר: סלון של כמעט שבעה מטרים לאורכו, ופינת אוכל בגומחה משלה. ריצוף פורצלן גדול, 100 על 100, חלונות אלומיניום בזיגוג כפול, ובית חכם ששולט בתאורה ובתריסים החשמליים.' },
  { id: 'kitchen', pov: { pos: [590, 470], look: [770, 400], path: [[600, 560]], sweep: 0.38 }, title: 'מטבח', rooms: ['kitchen'], at: [740, 440], d: 7.5, az: 0.2,
    text: 'המטבח פתוח לסלון, עם אי מרכזי ומקום ישיבה לארבעה. מטבח איכותי של מותג מוביל, פרזול עם טריקה שקטה, משטח אבן קיסר או שווה ערך, והכנה לכיריים אינדוקציה ולמדיח כלים.' },
  { id: 'balcony', pov: { pos: [640, 250], look: [330, 205], path: [[560, 400], [470, 345], [470, 290]], sweep: 0.4 }, title: 'מרפסת', rooms: ['balcony'], at: [540, 220], d: 8.5, az: -0.3,
    text: 'מהסלון ומהמטבח יוצאים למרפסת של כ־14 מטרים רבועים, עם ריצוף דמוי דק ומעקה זכוכית. יש בה נקודות מים, חשמל וגז, ומקום לשולחן אוכל ולפינת שיזוף.' },
  { id: 'wing', pov: { pos: [905, 680], look: [905, 880], path: [[470, 330], [600, 560], [760, 640], [880, 640]], sweep: 0.4 }, title: 'אגף החדרים', rooms: ['tub', 'laundry'], at: [880, 720], d: 10, az: 0.25,
    text: 'מעבר קצר מפריד בין אזור האירוח לחדרי השינה. כאן חדר האמבטיה, עם ריצוף אנטי סליפ, חיפוי קרמיקה עד התקרה, אסלה תלויה וארון רחצה תלוי עם כיור אינטגרלי. ולידו מרפסת שירות, עם מסתור כביסה ומקום לדוד.' },
  { id: 'kids', pov: { pos: [1005, 820], look: [1150, 930], path: [[905, 790], [935, 790], [975, 795]], sweep: 0.42 }, title: 'חדרי שינה וממ״ד', rooms: ['bed2', 'mamad'], at: [900, 970], d: 10.5, az: 0.1,
    text: 'שני חדרי שינה נוספים. אחד מהם הוא גם המרחב המוגן, ממ״ד של כשלושה וחצי על שני מטרים ושבעים, שמשמש מקום לשינה, לעבודה או לאורחים. בכל חדר נקודת טלוויזיה ותקשורת, ומיזוג VRF עם שליטה נפרדת.' },
  { id: 'mbed', pov: { pos: [905, 500], look: [1120, 330], path: [[975, 795], [905, 760], [905, 620], [910, 570]], sweep: 0.35 }, title: 'חדר שינה הורים', rooms: ['mbed', 'bath'], at: [1010, 400], d: 8.5, az: -0.1,
    text: 'ויחידת ההורים: חדר שינה של כ־4.2 על 2.8 מטרים, עם פרוזדור ארונות פרטי, ריצוף פרקט למינציה וחלונות משני צדדים. בפרוזדור נמצא חדר רחצה צמוד, עם מקלחון זכוכית.' },
  { id: 'end', pov: null, title: 'המגדל בחורשות', rooms: [], at: null, d: 0, az: 0,
    text: 'המגדל בחורשות: מגדל מגורים יוקרתי בעיצוב משרד אדריכלים מוביל, עם לובי בעיצוב אדריכלית פנים, חניון תת־קרקעי ובנייה ירוקה. פארק החורשות ממש ליד, והקו הירוק של הרכבת הקלה בקרבת מקום. רוצים לראות את זה מקרוב? נשמח לתאם לכם פגישה.' },
];

// Free walk: viewpoints (plan points), what you face on arrival, the room info shown and the narration clip (TOUR index).
export const NAV = {
  start: { p: [330, 775], look: [380, 400] },
  nodes: {
    entry:   { p: [330, 700], look: [430, 380], label: 'כניסה', room: 'entry', clip: 0 },
    living:  { p: [560, 640], look: [360, 430], label: 'סלון', room: 'living', clip: 1 },
    dining:  { p: [570, 690], look: [570, 800], label: 'פינת אוכל', room: 'living', clip: 1 },
    kitchen: { p: [590, 470], look: [770, 400], label: 'מטבח', room: 'kitchen', clip: 2 },
    balcony: { p: [640, 250], look: [330, 205], label: 'מרפסת', room: 'balcony', clip: 3 },
    hall:    { p: [905, 660], look: [905, 880], label: 'מסדרון החדרים', room: null, clip: 4 },
    tub:     { p: [880, 825], look: [770, 800], label: 'חדר אמבטיה', room: 'tub', clip: 4, over: { c: [777, 800], d: 2.2, h: 4.4 } },
    laundry: { p: [935, 665], look: [1020, 660], label: 'מרפסת שירות', room: 'laundry', clip: 4, over: { c: [1030, 660], d: 2.2, h: 4.4 } },
    bath:    { p: [935, 500], look: [1060, 515], label: 'חדר רחצה הורים', room: 'bath', clip: 6, over: { c: [1070, 515], d: 2.4, h: 4.4 } },
    mamad:   { p: [880, 960], look: [700, 1090], label: 'חדר שינה / ממ״ד', room: 'mamad', clip: 5 },
    bed2:    { p: [1005, 820], look: [1150, 930], label: 'חדר שינה', room: 'bed2', clip: 5 },
    mbed:    { p: [905, 500], look: [1120, 330], label: 'חדר שינה הורים', room: 'mbed', clip: 6 },
  },
  // [a, b, via waypoints from a to b]
  edges: [
    ['entry', 'living', [[400, 690]]], ['living', 'dining'], ['living', 'kitchen', [[600, 560]]], ['kitchen', 'balcony', [[560, 400], [470, 345], [470, 290]]],
    ['living', 'hall', [[760, 640], [880, 640]]], ['kitchen', 'hall', [[600, 560], [760, 640], [880, 640]]],
    ['hall', 'tub', [[905, 825]]], ['hall', 'laundry', [[905, 665]]], ['hall', 'mamad', [[905, 860], [890, 905]]], ['hall', 'bed2', [[905, 790], [975, 795]]],
    ['hall', 'mbed', [[905, 620], [910, 570]]], ['mbed', 'bath', [[915, 510]]],
  ],
};
