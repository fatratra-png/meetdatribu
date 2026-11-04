"""Redessine le symbole du logo HEI (les deux crochets en L) pour le verre.

Le logo HEI = le mot « HEI » encadré de deux crochets (haut-gauche, bas-droite).
Le texte ne tient pas en verre (skill premium-3d-glass, references/shapes.md) :
on garde le symbole, les deux crochets, mesurés sur le PNG officiel
(200 x 157 px) puis redessinés en vecteur.

Mesures du PNG : crochet A (22,39)-(70,88), crochet B (137,87)-(186,135),
trait 7 px. Le trait est épaissi (7 -> 13 px) pour dépasser 5 % de la largeur
totale, sinon le biseau du verre le mange. Coins arrondis (congés) plus grands
que le biseau.

    python3 tools/hei_mark.py public/glass/hei-mark.svg compact   (forme retenue)
Valider : python3 .claude/skills/.../tools/make_shape.py --check-file public/glass/hei-mark.svg
"""
import math, sys

STROKE = 13.0          # épaisseur du trait, en px du PNG d'origine
ARM = 49.0             # longueur d'un bras de crochet
A = (22.0, 39.0)       # coin extérieur du crochet haut-gauche
B = (186.0, 135.0)     # coin extérieur du crochet bas-droite
R_OUT, R_IN, R_END = 4.0, 2.0, 2.0   # rayons des congés (px d'origine)


def fillet(corners, radii, step=1.0):
    """Arrondit chaque coin d'un polygone (même logique que make_shape.fillet)."""
    n, out = len(corners), []
    for i in range(n):
        p, a, b, r = corners[i], corners[i - 1], corners[(i + 1) % n], radii[i]
        ua = ((a[0]-p[0]), (a[1]-p[1])); la = math.hypot(*ua); ua = (ua[0]/la, ua[1]/la)
        ub = ((b[0]-p[0]), (b[1]-p[1])); lb = math.hypot(*ub); ub = (ub[0]/lb, ub[1]/lb)
        th = math.acos(max(-1, min(1, ua[0]*ub[0]+ua[1]*ub[1])))
        d = r / math.tan(th/2)
        t1 = (p[0]+ua[0]*d, p[1]+ua[1]*d); t2 = (p[0]+ub[0]*d, p[1]+ub[1]*d)
        bis = (ua[0]+ub[0], ua[1]+ub[1]); lb2 = math.hypot(*bis); bis = (bis[0]/lb2, bis[1]/lb2)
        c = (p[0]+bis[0]*r/math.sin(th/2), p[1]+bis[1]*r/math.sin(th/2))
        a1 = math.atan2(t1[1]-c[1], t1[0]-c[0]); a2 = math.atan2(t2[1]-c[1], t2[0]-c[0])
        da = (a2-a1+math.pi) % (2*math.pi) - math.pi
        steps = max(4, int(abs(da)*r/step*4))
        out += [(c[0]+r*math.cos(a1+da*k/steps), c[1]+r*math.sin(a1+da*k/steps)) for k in range(steps+1)]
    return out


def bracket(corner, sx, sy):
    """Un L : coin extérieur `corner`, bras qui partent vers (sx, sy)."""
    x, y, s, L = corner[0], corner[1], STROKE, ARM
    pts = [(x, y), (x+sx*L, y), (x+sx*L, y+sy*s), (x+sx*s, y+sy*s), (x+sx*s, y+sy*L), (x, y+sy*L)]
    radii = [R_OUT, R_END, R_END, R_IN, R_END, R_END]
    return fillet(pts, radii)


# Variantes testées en verre (voir DECISIONS.md) :
#   logo    : proportions exactes du logo, trait 7,9 %
#   bold    : proportions du logo, trait et bras renforcés
#   compact : les deux crochets d'un cadre carré, version la plus pleine
PRESETS = {
    'logo':    dict(STROKE=13.0, ARM=49.0, A=(22.0, 39.0), B=(186.0, 135.0)),
    'bold':    dict(STROKE=20.0, ARM=62.0, A=(22.0, 39.0), B=(186.0, 135.0)),
    'compact': dict(STROKE=21.0, ARM=66.0, A=(0.0, 0.0), B=(120.0, 120.0)),
}


def main(out, preset='logo'):
    globals().update(PRESETS[preset])
    contours = [bracket(A, 1, 1), bracket(B, -1, -1)]
    xs = [p[0] for c in contours for p in c]; ys = [p[1] for c in contours for p in c]
    cx, cy = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2
    k = 820 / max(max(xs)-min(xs), max(ys)-min(ys))      # tient dans 1000 x 1000
    d = ''
    for c in contours:
        pts = [(500+(p[0]-cx)*k, 500+(p[1]-cy)*k) for p in c]
        # sens anti-horaire uniforme (aire signée)
        if sum(pts[i][0]*pts[i-1][1]-pts[i-1][0]*pts[i][1] for i in range(len(pts))) < 0:
            pts.reverse()
        d += 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in pts) + ' Z '
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">'
           f'<path fill="#000" fill-rule="evenodd" d="{d.strip()}"/></svg>\n')
    open(out, 'w').write(svg)
    print('écrit', out, f'trait = {STROKE/(max(xs)-min(xs))*100:.1f} % de la largeur')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'hei-mark.svg', sys.argv[2] if len(sys.argv) > 2 else 'logo')
