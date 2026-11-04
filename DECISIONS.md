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
