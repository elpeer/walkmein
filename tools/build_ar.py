# Build the Arabic page (ar/) from the Hebrew source + tools/ar.json (Hebrew string -> Arabic).
# usage: python3 tools/build_ar.py   (run from the repo root after editing the Hebrew page)
import json, os, re
T = json.load(open('tools/ar.json', encoding='utf-8'))
keys = sorted(T, key=len, reverse=True)
def tr(s):
    # replace only whole runs (same boundaries the extractor used) so short keys never hit inside longer text
    def rep(m):
        t = m.group(0); core = t.strip()
        if core in T: return t.replace(core, T[core])
        return t
    return re.sub(r"[^<>\"`'{}\n$]*[֐-׿][^<>\"`'{}\n$]*", rep, s)

os.makedirs('ar', exist_ok=True)
h = tr(open('index.html', encoding='utf-8').read())
h = h.replace('<html lang="he" dir="rtl">', '<html lang="ar" dir="rtl">')
for a in ('src="img/', 'src="media/', 'poster="media/', 'href="style.css"'):
    h = h.replace(a, a.replace('="', '="../', 1))
h = h.replace('<script type="module" src="app.js"></script>', '<script type="module" src="../app.ar.js"></script>')
h = h.replace('<a class="lang" href="ar/" hreflang="ar" lang="ar" aria-label="العربية">عربي</a>', '<a class="lang" href="../" hreflang="he" lang="he" aria-label="עברית">עברית</a>')
h = h.replace('<a class="logo" href="./">', '<a class="logo" href="./">')
h = h.replace('family=Heebo:wght@300;400;500;600&', 'family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&family=Heebo:wght@300;400;500;600&')
h = h.replace('</head>', '<style>:root{--f:"IBM Plex Sans Arabic","Heebo",system-ui,Arial,sans-serif}</style>\n</head>', 1)
h = h.replace('<span>ألمنيوم</span> <span>مع</span> ', '<span>ألمنيوم</span> ')
h = h.replace('placeholder="050-0000000"', 'placeholder="+971 50 000 0000"').replace('placeholder="name@company.co.il"', 'placeholder="name@company.com"')
h = h.replace('<a class="dcta" href="#contact">', '<a class="dcta" href="#contact" style="white-space:nowrap">', 1).replace('style="white-space:nowrap">احجزوا عرضًا توضيحيًا<', 'style="white-space:nowrap">احجزوا عرضًا<', 1)
open('ar/index.html', 'w', encoding='utf-8').write(h)

j = tr(open('app.js', encoding='utf-8').read())
j = j.replace("from './model.js'", "from './model.ar.js'")
j = re.sub(r"(['\"`(=])(img|media)/", r"\1../\2/", j)
j = j.replace("const H = '../img/';", "const H = '../img/';")
j = j.replace("he-IL", "en-US")
j = j.replace("media/living.mp3", "media/living-ar.mp3")
j = j.replace("JSON.stringify(own)", "JSON.stringify({ ...own, lang: 'ar' })")
open('app.ar.js', 'w', encoding='utf-8').write(j)
open('model.ar.js', 'w', encoding='utf-8').write(tr(open('model.js', encoding='utf-8').read()))
left = [f for f, s in (('ar/index.html', h), ('app.ar.js', j)) if re.search(r'[֐-׿]', s.replace('עברית', ''))]
print('built ar/; files with Hebrew left:', left)
