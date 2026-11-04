"""Prépare les visuels des scènes de scroll (skill Site Immersif, étape 4).

1. Découpe les collages publiés par HEI en photos individuelles.
2. Recadre chaque visuel AU FORMAT EXACT de son emplacement (les scènes
   calculent leurs transformations sur ces ratios) :
   - zooms (hero nuage, processus) : 3:2
   - nuage : mix 2:3 / 3:2
   - traînée : petits formats, 3:4 / 4:3

    python3 -I tools/crop_scenes.py public/hei public/hei/scenes
"""
import os, sys
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

# collages HEI -> (nom, boîte en px de l'original)
COLLAGES = {
    'event-cmu.webp': [('cmu-groupe', (0, 0, 1600, 440)), ('cmu-cours', (0, 452, 530, 900)),
                       ('cmu-tshirts', (535, 452, 1065, 900)), ('cmu-salle', (1075, 452, 1600, 900))],
    'event-stellarix.webp': [('stellarix-expose', (0, 0, 762, 900)), ('stellarix-duo', (775, 0, 1600, 440)),
                             ('stellarix-salle', (775, 455, 1600, 900))],
    'maj-site-1.webp': [('integration-cour', (0, 0, 1350, 538)), ('integration-bleu', (0, 548, 618, 1080)),
                        ('integration-blanc', (628, 548, 1350, 1080))],
    'a-propos.webp': [('labo-pc', (0, 0, 275, 630)), ('pancarte-hei', (288, 165, 668, 740))],
}


def open_src(name):
    p = os.path.join(SRC, name)
    if os.path.exists(p):
        return Image.open(p).convert('RGB')
    return CROPS[name]


CROPS = {}
for f, parts in COLLAGES.items():
    im = Image.open(os.path.join(SRC, f)).convert('RGB')
    for n, box in parts:
        CROPS[n] = im.crop(box)


def fit(im, ratio, width, focus=(0.5, 0.5)):
    """Recadre au ratio (l/h) autour du point focal, puis redimensionne."""
    w, h = im.size
    if w / h > ratio:
        nw = round(h * ratio); x = round((w - nw) * focus[0]); im = im.crop((x, 0, x + nw, h))
    else:
        nh = round(w / ratio); y = round((h - nh) * focus[1]); im = im.crop((0, y, w, y + nh))
    if im.width > width:
        im = im.resize((width, round(width / ratio)), Image.LANCZOS)
    return im


def save(im, name):
    path = os.path.join(OUT, name + '.webp')
    im.save(path, 'WEBP', quality=78, method=6)
    print(f'{name:28s} {im.width}x{im.height}')


# zooms plein écran (3:2)
save(fit(open_src('event-integration-2024.webp'), 3 / 2, 1600, (0.5, 0.4)), 'zoom-tribu')
save(fit(open_src('campus-hei-madagascar.webp'), 3 / 2, 1600, (0.5, 0.5)), 'zoom-campus')

# nuage : 10 visuels, alternance portrait 2:3 / paysage 3:2 (ordre = ordre des .fl)
CLOUD = [
    ('event-club-foot.webp', 2 / 3), ('event-hei-music.webp', 3 / 2), ('cmu-groupe', 3 / 2),
    ('pancarte-hei', 2 / 3), ('event-hiu-2025.webp', 3 / 2), ('stellarix-expose', 2 / 3),
    ('event-wa-2024.webp', 3 / 2), ('integration-bleu', 2 / 3), ('maj-site-2.webp', 3 / 2),
    ('promo-tohindia.webp', 3 / 2),
]
for i, (n, r) in enumerate(CLOUD, 1):
    save(fit(open_src(n), r, 760 if r > 1 else 520, (0.5, 0.35)), f'cloud-{i:02d}')

# traînée : 20 petits visuels
TRAIL = ['integration-cour', 'cmu-tshirts', 'cmu-cours', 'cmu-salle', 'stellarix-duo', 'stellarix-salle',
         'integration-blanc', 'labo-pc', 'event-photo-mod-1.webp', 'event-integration-2024.webp',
         'event-club-foot.webp', 'event-hei-music.webp', 'cmu-groupe', 'pancarte-hei', 'event-hiu-2025.webp',
         'stellarix-expose', 'event-wa-2024.webp', 'integration-bleu', 'maj-site-2.webp', 'promo-tohindia.webp']
for i, n in enumerate(TRAIL, 1):
    r = 3 / 4 if i % 2 else 4 / 3
    save(fit(open_src(n), r, 420, (0.5, 0.4)), f'trail-{i:02d}')
