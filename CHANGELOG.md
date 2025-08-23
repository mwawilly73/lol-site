# Changelog

Toutes les modifications notables de ce projet sont documentées ici.

## [v0.2.0] - 2025-08-23

### ✨ Features
- **Jeu “Liste des champions”**
  - Saisie globale (header) + version **compacte sticky** quand on scrolle.
  - **Mode Facile** (aperçu flou / N&B) vs **Mode Normal** (dos de carte “?”).
  - **Bouton Indice** (révèle le nom lettre par lettre).
  - **Alias tolérants** pour les noms difficiles (Shyvana, Qiyana, Taliyah, Tryndamere, Xin Zhao, Tahm Kench, etc.).
  - **Bandeau d’infos** par carte (nom / titre / rôles / ressource), visible une fois découverte.
  - **Panneau flottant** contextuel (saisie locale / infos / lore on-demand).
  - **Overlay de fin** (timer figé, bouton Rejouer).
  - **Rester en place** au scroll et lors des validations (pas de jump en haut).

- **Images haute qualité**
  - Passage aux **CDN Riot (Data Dragon / CommunityDragon)**.
  - **Portraits carrés HD** (square icons) avec **blur placeholder**.
  - Fallback automatique si une image est indisponible.

- **Lore à la demande**
  - Récupération via **DDragon** (`/cdn/<ver>/data/fr_FR/champion/<ID>.json`) quand la carte est découverte.

### 🚀 Performance
- `next/image` + `remotePatterns` + **preconnect/dns-prefetch** vers les CDN.
- **content-visibility** pour les cartes hors-écran.
- Caching simple en mémoire (lore) pour éviter les refetchs.
- Scripts **pré-déploiement** (Lighthouse local + check pages).

### ♿ Accessibilité
- Landmarks sémantiques (`<main>`, `role="dialog"`, etc.).
- **Focus management** (transfert vers input sticky quand le header sort).
- Fermeture **click-outside** & **Échap** pour les panneaux/menus.
- Résolution des alertes **Lighthouse 100% A11y**.

### 🔒 Sécurité / CSP
- CSP **production** sans `unsafe-inline` (les inline sont remplacés ou hashés si besoin).
- En dev : CSP assouplie via la config (HMR/React Refresh).

### 🔧 DX / Outillage
- Scripts utiles :
  - `npm run dev`, `npm run build`, `npm run start`
  - `npm run prod:local` (build + start prod)
  - `npm run predeploy` / `predeploy:fast` (vérifs + Lighthouse)
  - `npm run stop:3000` / `stop:3001` (Windows, PowerShell)
- ESLint/TS : clean (no unused / no any) sur les nouvelles zones.
- **CssGuard** : toast discret si `globals.css` ne se charge pas (et bouton “recharger”).

### 🗂️ Refactor / Structure
- `app/` : pages, `layout.tsx`, `globals.css`.
- `components/` : `ChampionCard`, `SiteHeader`, `CssGuard`.
- `lib/` : `champions.ts`, `championAssets.ts`, `ddragon.ts`.
- `scripts/` : `predeploy.mjs`, `kill-port.mjs`.

### 🐛 Fixes notables
- Port 3000/3001 déjà utilisé → scripts de **kill port**.
- Mobile menu : fermeture **click-outside** fiable.
- Timer arrêté sur l’écran de victoire.
- Collisions de focus (sticky vs header) résolues (focus préservé, pas de “remontée” auto).
- Images “splash” remplacées par **icônes carrées HD** (nettes).

---

## [v0.1.0] - 2025-08-xx
- Version initiale (mise en place Next.js, page d’accueil, squelette du jeu).
