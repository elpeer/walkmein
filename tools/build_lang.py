# Build translated pages (ar/, en/) from the Hebrew source + tools/<lang>.json (Hebrew string -> translation).
# usage: python3 tools/build_lang.py [ar|en ...]   (run from the repo root after editing the Hebrew page)
import json, os, re, sys

HE_RUN = r"[^<>\"`'{}\n$]*[֐-׿][^<>\"`'{}\n$]*"
LANG_BTN_HE = '<a class="lang" href="ar/" hreflang="ar" lang="ar" aria-label="العربية">عربي</a><a class="lang" href="en/" hreflang="en" lang="en" aria-label="English">EN</a>'

CFG = {
    'ar': dict(dir='rtl', font='IBM+Plex+Sans+Arabic', ff='"IBM Plex Sans Arabic","Heebo"', phone='+971 50 000 0000',
               audio='living-ar.mp3', cta=('احجزوا عرضًا توضيحيًا', 'احجزوا عرضًا'),
               fixes=[('<span>ألمنيوم</span> <span>مع</span> ', '<span>ألمنيوم</span> ')]),
    'en': dict(dir='ltr', font='Inter', ff='"Inter","Heebo"', phone='+1 305 000 0000',
               audio='living-en.mp3', cta=('Book a demo', 'Book demo'), fixes=[('<span>72</span> <span>square-meter</span>', '<span>72-square-meter</span>')]),
}
NAMES = {'he': ('עברית', '../'), 'ar': ('عربي', '../ar/'), 'en': ('EN', '../en/')}

def mirror(s):
    # swap direction-dependent chevrons for LTR pages
    return (s.replace('M15 6l-6 6 6 6', '@@L@@').replace('M9 6l6 6-6 6', 'M15 6l-6 6 6 6').replace('@@L@@', 'M9 6l6 6-6 6')
             .replace('‹‹‹', '›››'))

def build(lang):
    c = CFG[lang]
    T = json.load(open(f'tools/{lang}.json', encoding='utf-8'))
    def tr(s):
        def rep(m):
            t = m.group(0); core = t.strip()
            return t.replace(core, T[core]) if core in T else t
        return re.sub(HE_RUN, rep, s)

    os.makedirs(lang, exist_ok=True)
    src = open('index.html', encoding='utf-8').read()
    # language switcher: links to the two other languages (protect it from translation)
    others = ''.join(f'<a class="lang" href="{NAMES[k][1]}" hreflang="{k}" lang="{k}">{"HE" if (lang == "en" and k == "he") else NAMES[k][0]}</a>' for k in ('he', 'ar', 'en') if k != lang)
    src = src.replace(LANG_BTN_HE, '@@LANG@@')
    h = tr(src).replace('@@LANG@@', others)
    h = h.replace('<html lang="he" dir="rtl">', f'<html lang="{lang}" dir="{c["dir"]}">')
    for a in ('src="img/', 'src="media/', 'poster="media/', 'data-img="img/', 'data-img="media/', 'href="style.css"'):
        h = h.replace(a, a.replace('="', '="../', 1))
    h = h.replace('<script type="module" src="app.js"></script>', f'<script type="module" src="../app.{lang}.js"></script>')
    h = h.replace('family=Heebo:wght@300;400;500;600&', f'family={c["font"]}:wght@300;400;500;600&family=Heebo:wght@300;400;500;600&')
    extra = f':root{{--f:{c["ff"]},system-ui,Arial,sans-serif}}'
    if c['dir'] == 'ltr' and os.path.exists('tools/ltr.css'):
        extra += open('tools/ltr.css', encoding='utf-8').read()
    h = h.replace('</head>', f'<style>{extra}</style>\n</head>', 1)
    for a, b in c['fixes']: h = h.replace(a, b)
    h = h.replace('placeholder="050-0000000"', f'placeholder="{c["phone"]}"').replace('placeholder="name@company.co.il"', 'placeholder="name@company.com"')
    h = h.replace('<a class="dcta" href="#contact">', '<a class="dcta" href="#contact" style="white-space:nowrap">', 1)
    if c['cta']: h = h.replace(f'style="white-space:nowrap">{c["cta"][0]}<', f'style="white-space:nowrap">{c["cta"][1]}<', 1)
    if c['dir'] == 'ltr': h = mirror(h)
    open(f'{lang}/index.html', 'w', encoding='utf-8').write(h)

    j = tr(open('app.js', encoding='utf-8').read())
    j = j.replace("from './model.js'", f"from './model.{lang}.js'")
    j = re.sub(r"(['\"`(=])(img|media)/", r"\1../\2/", j)
    j = j.replace("he-IL", "en-US")
    j = j.replace("media/living.mp3", f"media/{c['audio']}")
    j = j.replace("JSON.stringify(own)", f"JSON.stringify({{ ...own, lang: '{lang}' }})")
    if c['dir'] == 'ltr': j = mirror(j)
    open(f'app.{lang}.js', 'w', encoding='utf-8').write(j)
    open(f'model.{lang}.js', 'w', encoding='utf-8').write(tr(open('model.js', encoding='utf-8').read()))
    left = [f for f, s in ((f'{lang}/index.html', h), (f'app.{lang}.js', j)) if re.search(r'[֐-׿]', s.replace('עברית', ''))]
    print(f'built {lang}/; files with Hebrew left:', left)

for l in (sys.argv[1:] or ['ar', 'en']):
    build(l)
