# Décisions — Meet da Tribu

Choix faits pendant la construction, quand le prompt ou les skills laissaient
une ambiguïté. Format : décision · pourquoi.

## Phase 1 — Setup

1. **Next.js 16.4.5 : `src/proxy.ts` au lieu de `middleware.ts`.** Next 16 a
   renommé « Middleware » en « Proxy ». next-intl 4 s'y branche tel quel.
2. **`cacheComponents` et `partialPrefetching` désactivés** (activés par défaut
   par create-next-app 16). Le site n'a aucune donnée serveur ; next-intl
   pré-rend chaque langue avec `setRequestLocale` + `generateStaticParams`.
   Avec Cache Components, chaque lecture de la langue devient dynamique.
3. **Turbopack conservé.** En Next 16 c'est le bundler stable par défaut, pas
   une option expérimentale (le prompt ne l'excluait que « si instable »).
4. **npm au lieu de pnpm** : pnpm n'est pas installé sur la machine.
5. **Palette validée** : navy `#001948` (structure) + or `#DFA408` (accent
   unique), sources CSS Elementor de hei.school + logo. En thème clair, l'or
   en *texte* devient `#8A6400` (l'or pur fait 2,2:1 sur blanc, sous le AA).
   Écartés : `#61CE70` (vert Elementor par défaut, inutilisé) et `#7A7A7A`
   (4,29:1, sous le AA).
6. **Polices** : Space Grotesk en local (`next/font/local`, fichiers TTF du
   skill verre, licence OFL) ; DM Mono via `next/font/google`.
7. **Header = le « dock » du skill Site Immersif** (pilule flottante desktop,
   barre à 10 px des bords sur mobile, mêmes easings/durées). Ajouts imposés par
   le prompt : sélecteur de langue et bouton de thème dans le dock. Sous 400 px,
   le sélecteur n'affiche que l'autre langue pour que tout tienne sur une ligne.
   Le CTA en or est le seul élément d'accent du header.
8. **Script de thème** : rendu par un composant client qui sort un vrai
   `<script>` au SSR et un `text/plain` côté navigateur. Évite le flash de thème
   ET l'avertissement React 19 « script tag while rendering » au changement de
   langue (le layout racine dépend de la langue).
9. **Skills portés, pas copiés** : les moteurs vanilla (Site Immersif, verre)
   sont réécrits en composants React ; on garde leurs valeurs (easings, durées,
   ratios, chronologie) et leurs checklists. Les questionnaires
   `AskUserQuestion` des skills ne sont pas posés (réponses dans le prompt).
10. **Photos d'équipe** : 4 originaux en haute définition (`Frame-46/47/51/52`)
    sont introuvables sur hei.school ; on a les vignettes 150 px du site. À
    remplacer si de meilleures photos sont disponibles.
11. **`.claude/` hors du dépôt Git** : les skills sont des packs tiers (dont un Three.js vendu de 1,2 Mo) ; ils restent en local et ne sont pas publiés sur GitHub.

## Phase 2 — Verre 3D

12. **Forme = le symbole du logo HEI, redessiné.** Le logo, c'est le mot « HEI »
    encadré de deux crochets. Le texte ne tient pas en verre (shapes.md) : on
    garde les deux crochets. Mesurés sur le PNG officiel puis redessinés en
    vecteur (`tools/hei_mark.py`). La version fidèle (trait à 4,3 % de la
    largeur, sous la règle des 5 %) donnait deux petits L perdus dans le vide.
    Trois variantes ont été jugées en verre avec `tools/preview.html` ; retenue :
    **compacte** (les deux crochets d'un cadre carré, trait à 17,5 %).
    `make_shape.py --check-file` : `crossings 0`, noyau 18,8 %.
13. **Moteur en Three.js « brut »** (classe `GlassEngine`), pas en R3F : c'est
    le port le plus fidèle du moteur du skill (même scène, lumières, caméra,
    chronologie 0/12/28/40/54/60 %, fenêtres de chapitres, temps de maintien).
    Le canvas est chargé en `dynamic(..., { ssr: false })`.
14. **Deux solides = deux crochets.** Le moteur d'origine découpe le pourtour en
    3 secteurs et garde le second solide entier. Ici, chaque crochet reçoit 2
    fragments (un par bras) : 4 fragments symétriques, un par pilier de HEI.
    Avec une forme d'un seul solide, le comportement est celui du skill.
15. **Three r187 au lieu de r160.** La greffe de dispersion (`onBeforeCompile`)
    a été réécrite pour la nouvelle signature de `getIBLVolumeRefraction`
    (mêmes 3 réfractions, même écart 0,018 renforcé aux angles rasants).
    `iridescenceThicknessRange` → `iridescenceThicknessMinimum/Maximum`.
    `THREE.Clock` remplacé par un chrono maison (déprécié en r187).
16. **Palette du fond** : bleus de la teinte du navy HEI (le navy pur serait
    invisible dans ce shader qui éclaire à 13 %), or HEI au chapitre de la
    recomposition. Deux panneaux du studio passés à l'or (reflets chauds), les
    étincelles violettes passées à l'or.
17. **La scène du verre reste sombre en thème clair** : le verre transmissif
    n'existe que devant une lumière colorée sur fond noir.
18. **Retiré du moteur** (sans objet ici) : curseur réticule (conflit avec la
    traînée d'images du skill Site Immersif), header du template, formulaire
    de contact et sa dalle de verre, ombres (aucun objet ne les reçoit).
19. **Pixel ratio plafonné à 1,75** (prompt) au lieu de 1,5 (skill). Rendu en
    pause hors écran (IntersectionObserver), 30 i/s au repos comme le skill.
20. **Portrait, chapitre 2** : seuls les noms des 4 piliers s'affichent (le
    détail reste accessible aux lecteurs d'écran), et la caméra recule un peu
    plus pendant l'éclatement (2,8 au lieu de 2,0), sinon le texte passe sous
    les fragments à 390 px.
21. **Mode statique** (mouvement réduit, ou WebGL absent) : image du verre
    (rendue par le moteur lui-même, `public/glass/hei-glass.webp`) et les 4
    chapitres empilés, tout visible. Décidé au chargement, comme le skill.
