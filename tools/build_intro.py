# Build intro/ : the Hebrew landing page without the pricing section and without language links.
# usage: python3 tools/build_intro.py   (run from the repo root after editing the Hebrew page)
import re

def cut(s, a, b):
    i = s.index(a); j = s.index(b, i) + len(b); return s[:i] + s[j:]

h = open('index.html', encoding='utf-8').read()
h = cut(h, '<!-- 6 · pricing -->', '</section>')
for a in ('<a href="#pricing">מחירים</a>', '<a href="#pricing"><small>08</small>מחירים</a>\n'):
    assert a in h, a; h = h.replace(a, '')
h = re.sub(r'\s*<a href="#pricing"><svg.*?</a>', '', h, count=1)
h = h.replace('<small>09</small>שאלות', '<small>08</small>שאלות')
h = re.sub(r'<a class="lang"[^>]*>[^<]*</a>', '', h)
h = re.sub(r'<link rel="alternate"[^>]*>', '', h)
h = h.replace('<head>', '<head>\n<meta name="robots" content="noindex">', 1)
for a in ('src="img/', 'src="media/', 'poster="media/', 'data-img="img/', 'data-img="media/', 'href="style.css"'):
    h = h.replace(a, a.replace('="', '="../', 1))
h = h.replace('<script type="module" src="app.js"></script>', '<script type="module" src="../app.intro.js"></script>')
h = h.replace('כן. הפיילוט ב־₪990 כולל סוג דירה אחד,', 'כן. אפשר להתחיל בפיילוט של סוג דירה אחד,')
assert '#pricing' not in h and '₪' not in h and 'id="pricing"' not in h
import os; os.makedirs('intro', exist_ok=True)
open('intro/index.html', 'w', encoding='utf-8').write(h)

j = open('app.js', encoding='utf-8').read()
j = re.sub(r"(['\"`(=])(img|media)/", r"\1../\2/", j)
j = j.replace("const ids = ['top', 'model', 'contact', 'pricing', 'faq'];", "const ids = ['top', 'model', 'contact', 'faq'];")
j = j.replace("JSON.stringify(own)", "JSON.stringify({ ...own, lang: 'intro' })")
open('app.intro.js', 'w', encoding='utf-8').write(j)
print('built intro/')
