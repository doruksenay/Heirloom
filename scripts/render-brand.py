"""Builds the app icon and splash PNGs from the brand logo.

Input:  assets/brand/logo-source.png  (the 1024x1024 logo artwork: the sunset "H" on night blue)
Output: assets/brand/logo-h.png        (the H cut out, transparent)
        assets/icon-only.png, icon-foreground.png, icon-background.png, splash.png, splash-dark.png
Then:   npx capacitor-assets generate --ios --android   (writes every iOS/Android size; skip --pwa, the app is not a PWA)

Run from the project root: python3 scripts/render-brand.py   (needs Pillow, and Playwright for the splash text)
"""
import pathlib
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
BRAND = ROOT / 'assets' / 'brand'
ASSETS = ROOT / 'assets'
NIGHT_TOP, NIGHT_BOTTOM = (38, 32, 94), (12, 11, 38)


def cut_h() -> Image.Image:
    """The H in the source art is a rounded shape: rebuild its outline geometrically (supersampled) and use it as alpha."""
    s = 4
    m = Image.new('L', (1024 * s, 1024 * s), 0)
    d = ImageDraw.Draw(m)

    def rect(x0, y0, x1, y1, r, fill):
        d.rounded_rectangle([x0 * s, y0 * s, x1 * s, y1 * s], radius=r * s, fill=fill)

    rect(99, 111, 904, 866, 105, 255)  # outer body
    rect(423, -200, 583, 394, 42, 0)  # top notch between the legs
    rect(423, 650, 583, 1300, 42, 0)  # bottom notch
    # round the convex corners left by the notches, then pull the edge in a little to drop the dark rim
    m = m.filter(ImageFilter.MinFilter(21)).filter(ImageFilter.MaxFilter(41)).filter(ImageFilter.MinFilter(21))
    m = m.resize((1024, 1024), Image.LANCZOS).filter(ImageFilter.MinFilter(5))
    src = Image.open(BRAND / 'logo-source.png').convert('RGBA')
    src.putalpha(m)
    return src.crop((96, 108, 908, 870))


def night(size: int) -> Image.Image:
    """Vertical night-blue gradient with a soft violet glow in the upper middle."""
    bg = Image.new('RGB', (size, size))
    px = bg.load()
    for y in range(size):
        t = y / (size - 1)
        c = tuple(round(a + (b - a) * t) for a, b in zip(NIGHT_TOP, NIGHT_BOTTOM))
        for x in range(size):
            px[x, y] = c
    glow = Image.new('L', (size, size), 0)
    ImageDraw.Draw(glow).ellipse([size * 0.15, size * 0.05, size * 0.85, size * 0.65], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.12))
    violet = Image.new('RGB', (size, size), (123, 97, 255))
    return Image.composite(violet, bg, glow)


def place(canvas: Image.Image, h: Image.Image, width_ratio: float, center_y=0.5, shadow=True):
    size = canvas.size[0]
    w = round(size * width_ratio)
    hh = round(h.size[1] * w / h.size[0])
    logo = h.resize((w, hh), Image.LANCZOS)
    x, y = (size - w) // 2, round(size * center_y - hh / 2)
    if shadow:
        sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
        a = logo.split()[3].point(lambda v: v * 0.55)
        sh.paste((5, 4, 26, 255), (x, y + round(size * 0.02)), a)
        sh = sh.filter(ImageFilter.GaussianBlur(size * 0.025))
        canvas.alpha_composite(sh)
    canvas.alpha_composite(logo, (x, y))
    return canvas


h = cut_h()
h.save(BRAND / 'logo-h.png')

icon = night(1024).convert('RGBA')
place(icon, h, 0.80)
icon.convert('RGB').save(ASSETS / 'icon-only.png')

fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))  # Android adaptive icon: keep the art inside the safe circle
place(fg, h, 0.60, shadow=False)
fg.save(ASSETS / 'icon-foreground.png')
night(1024).save(ASSETS / 'icon-background.png')

# Splash: logo + wordmark, rendered by the browser so the Fredoka font is exact
html = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: F; src: url('%(font)s') format('woff2'); font-weight: 700; }
@font-face { font-family: F; src: url('%(fontx)s') format('woff2'); font-weight: 700; unicode-range: U+0100-024F; }
html,body { margin:0; width:2732px; height:2732px; overflow:hidden; background: radial-gradient(circle at 50%% 38%%, #2E2470, %(bg)s 70%%); }
.c { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:70px; }
img { width:1000px; filter: drop-shadow(0 50px 70px rgba(5,4,26,.6)); }
.w { position:relative; font-family:F; font-weight:700; font-size:280px; line-height:1;
     background:linear-gradient(180deg,#FFF8F1,#FFE2CF 55%%,#FFC9B0); -webkit-background-clip:text; background-clip:text; color:transparent; }
.i { position:relative; display:inline-block; background:inherit; -webkit-background-clip:text; background-clip:text; }
.star { position:absolute; left:50%%; top:0.02em; width:0.38em; height:0.38em; transform:translateX(-50%%); }
.t { font-family:F; font-size:96px; color:#FFE9DC; opacity:.85; }
</style></head><body><div class="c">
<img src="%(logo)s"/>
<div class="w">He<span class="i">&#305;<svg class="star" viewBox="0 0 20 20"><path d="M10 0 l2.6 7.4 L20 10 l-7.4 2.6 L10 20 l-2.6 -7.4 L0 10 l7.4 -2.6z" fill="#FFF4EC"/></svg></span>rloom</div>
</div></body></html>"""
font_dir = ROOT / 'node_modules' / '@fontsource' / 'fredoka' / 'files'
import base64  # noqa: E402

def data_uri(path: pathlib.Path, mime: str) -> str:
    # inline files: a page made with set_content can't load file:// URLs
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()

params = {
    'font': data_uri(font_dir / 'fredoka-latin-700-normal.woff2', 'font/woff2'),
    'fontx': data_uri(font_dir / 'fredoka-latin-ext-700-normal.woff2', 'font/woff2'),
    'logo': data_uri(BRAND / 'logo-h.png', 'image/png'),
}
from playwright.sync_api import sync_playwright  # noqa: E402

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 2732, 'height': 2732})
    for name, bg in (('splash.png', '#141238'), ('splash-dark.png', '#0C0B26')):
        pg.set_content(html % {**params, 'bg': bg})
        pg.wait_for_timeout(700)
        pg.screenshot(path=str(ASSETS / name))
    b.close()
print('icon and splash PNGs written to assets/')
