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

## Phase 3 — Scènes de scroll

22. **Épinglage en `position: sticky`, progression par ScrollTrigger.** Le skill
    émule l'épinglage en translatant le pin dans un wrapper lissé maison. Ici
    Lenis lisse le défilement, chaque scène fait N écrans de haut (`--pin`,
    mêmes N que le skill : 5 / 3.5 / 4 / 9 / 3 / 2.6) et ScrollTrigger donne
    la progression 0..1. Les courbes `seg`, `easeOut`, `easeInOut`, `makeGrow`,
    `makeDraw` et toutes les fenêtres de temps sont celles de `app.js`.
23. **Ordre de la page** : le verre (accueil + Découvrir HEI) → le nuage
    (« Avant le premier cours, il y a la Tribu ») → Se repérer (rideau de lames,
    4 étapes) → [Outils, phase 4] → devise → manifeste + objections → [Chiffres,
    phase 4] → témoignage → footer. Le nuage sert de passage de l'école (le
    verre) aux gens (la Tribu).
24. **Nuage : dérive ralentie.** Avec la dérive du skill (linéaire, `vh * 1.15`),
    plus aucune photo n'était à l'écran quand l'image naît entre les mots, or
    c'est le repère de fidélité de la checklist. Même fenêtre (0.06 → 0.46),
    mais dérive en t² et `vh * 0.4` : 5 photos restent à l'écran à p = 0.27 en
    desktop, 4 en mobile ; le nuage a disparu à p = 0.7.
25. **Zoom du nuage assombri à -42 %** (skill : -16 %) : les photos HEI (foules
    en plein jour) sont plus chargées que les visuels du template ; le
    positionnement blanc doit se lire.
26. **Processus à 4 étapes** (skill : 3) : le prompt demande « une étape par jour
    clé » (avant le jour 1, jour 1, LEI, ensuite). L'odomètre gère N étapes.
27. **Devise = « Penser, Travailler, Impacter »**, la signature de HEI visible sur
    ses visuels officiels (infographie alumni).
28. **Ovales en or** (`--accent-text`) : c'est l'élément « regarde ici » de
    chaque écran (règle color-and-brand-discipline).
29. **Footer dans le layout** (commun à toutes les pages) ; nom géant ramené à
    13vw sur mobile (« Meet da Tribu » est plus long que le nom du template).
30. **Visuels** : 100 % HEI. Les collages du site ont été découpés en photos
    individuelles et chaque visuel recadré au ratio exact de son emplacement
    (`tools/crop_scenes.py`). Aucune banque d'images, aucune image générée.
31. **Traînée d'images** : desktop uniquement (`hover: hover` et
    `pointer: fine`), désactivée en mouvement réduit.
32. **Accessibilité des textes découpés** : le manifeste et la devise sont
    découpés en lettres pour l'animation ; une version entière est donnée aux
    lecteurs d'écran (`sr-only` / `aria-label`).

## Refonte des animations (demande du 4 nov. 2026)

Les scènes de la phase 3 ressemblaient trop à zahavania.vercel.app, construit
avec le même skill Site Immersif. Les décisions 22 à 31 sont remplacées par
celles-ci. Conservés tels quels : le verre 3D (phase 2) et la bande devise
« Penser, Travailler, Impacter » (`motto.css`).

33. **Nouveau langage** inspiré de checky-mg.vercel.app et getartcraft.com
    (observés en captures, rien copié : ni code, ni texte, ni image) : titres
    mixtes grotesque + UN mot en serif italique (Instrument Serif), étiquettes
    mono précédées d'un filet, index des chapitres à droite, filets fins.
34. **Barre de navigation** pleine largeur (wordmark en capitales + crochets
    HEI, CTA en pilule d'or) qui se cache en descendant, revient en remontant.
    Remplace le « dock » en pilule du skill.
35. **Loader** : les deux crochets du logo HEI se dessinent, compteur 00 → 100,
    puis les crochets s'écartent et le voile se retire vers le haut.
36. **Index des chapitres** (≥ 1100 px) : lit les sections `data-chapter`, le
    chapitre courant grossit et son libellé se brouille puis se recompose ;
    clic = défilement Lenis. En `mix-blend-mode: difference` pour rester
    lisible sur le verre, l'or et les fonds clairs.
37. **La Tribu = anneau 3D de photos** (CSS 3D, pas de second contexte WebGL) :
    14 photos HEI en orbite autour du titre ; l'anneau tourne, se couche,
    s'élargit hors cadre, puis une photo s'ouvre du centre au plein écran.
    Portrait : titre en haut, anneau en dessous.
38. **Se repérer = frise horizontale épinglée** : 4 panneaux (J-1, J1, S1-2, +),
    rail qui se remplit, repère géant en mono qui monte lettre à lettre.
39. **Les bons conseils = paquet de cartes** 01 / 05 : la carte du dessus
    s'envole, la suivante avance. Remplace le manifeste, les objections et la
    traînée d'images (5 conseils PLACEHOLDER en attendant le Google Form).
40. **Témoignage** : la parole se défloute mot à mot, puis signature et chiffre.
41. **Footer** sur le modèle de structure de checky : grand appel « Rejoins
    la Tribu. », 3 boutons pilule, 4 colonnes de liens, ligne légale, puis
    « HEI LEIS DADA AH » en géant (texte demandé, à la place de « TRIBU »),
    coupé par le bas, qui sort du flou avec un halo doré. Taille calculée pour
    15 signes (12,6vw) ; révélé dès son entrée à l'écran.
