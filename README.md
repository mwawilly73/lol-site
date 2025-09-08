# Legends Rift

Jeu et quiz autour des champions de League of Legends.  
➡️ Page du jeu principale : `/games/champions`

## 🚀 Pile technique

- **Next.js 15** (app router)
- **TypeScript**
- **Tailwind** (classes utilitaires dans `globals.css`)
- **next/image** optimisé (CDN Riot & CommunityDragon)
- **ESLint** + règles Next/TS

## ✨ Fonctionnalités clés

- **Jeu “Liste des champions”** :
  - Saisie globale + version **compacte sticky** (apparition fluide).
  - **Mode Facile/Normal**, **indices** lettre par lettre, **alias** tolérants.
  - Cartes carrées HD, **infos** (nom/titre/rôles/ressource), **lore** on-demand.
  - **Overlay de fin** (timer figé) + bouton **Rejouer**.
  - **Accessibilité** : 100% Lighthouse (focus management, ARIA, landmarks).

- **Images / Assets** :
  - **Data Dragon** (JSON + passives/spells).
  - **CommunityDragon** (icônes carrées HD).
  - `next.config.ts` autorise les domaines externes (remotePatterns).

- **Perf / DX** :
  - `content-visibility`, blur placeholders, preconnect DNS.
  - Scripts **pré-déploiement** avec Lighthouse local.
  - **CssGuard** : avertit si `globals.css` ne se charge pas et propose de recharger.

## 📁 Structure

app/
a-propos/
games/
champions/
page.tsx
ChampionsGame.tsx
globals.css
layout.tsx
components/
ChampionCard.tsx
SiteHeader.tsx
CssGuard.tsx
lib/
champions.ts
championAssets.ts
ddragon.ts
scripts/
predeploy.mjs
kill-port.mjs



## 🔧 Scripts

- Dev : `npm run dev`
- Build prod : `npm run build`
- Démarrer prod local : `npm run start` (par défaut port 3000)
- **Prod rapide local** : `npm run prod:local` (build + start)
- **Pré-déploiement complet** : `npm run predeploy` (vérifs + Lighthouse)
- **Pré-déploiement rapide** : `npm run predeploy:fast`
- Libérer le port (PowerShell/Windows) :  
  `npm run stop:3000` • `npm run stop:3001`

## 🌐 Données & CDN

- **Champion JSON (DDragon)** :  
  `https://ddragon.leagueoflegends.com/cdn/<VERSION>/data/fr_FR/champion/Aatrox.json`
- **Images passives & sorts (DDragon)** :  
  `.../cdn/<VERSION>/img/passive/<PassiveFile.png>`  
  `.../cdn/<VERSION>/img/spell/<SpellFile.png>`
- **Icônes carrées HD (CommunityDragon)** (via `championAssets.ts`).

> La version DDragon est centralisée dans `lib/championAssets.ts` (`DDRAGON_VERSION`).

## 🔒 Sécurité (CSP)

- **Prod** : CSP stricte sans `unsafe-inline`.  
- **Dev** : headers sécurité non appliqués (HMR, React Refresh).

## ♿ Accessibilité

- Landmarks (`<main>`, `role="dialog"`), focus visible & géré (sticky).
- Fermeture click-outside + Escape pour overlays.
- **Lighthouse** : 100% Accessibilité.

## 🧪 Pré-déploiement

1. `npm run predeploy` (ou `predeploy:fast`)  
2. Rapports Lighthouse dans `./reports/` (git-ignorés)
3. `npm run prod:local` pour un test manuel

## 🆘 Dépannage

- **Port déjà utilisé** : `npm run stop:3000` (ou `stop:3001`) puis relancer.
- **CSP bloque scripts/styles inline** : passer par des fichiers/props ou ajouter un **hash/nonce** si nécessaire.
- **Images 403/404** : vérifier `DDRAGON_VERSION` et l’ID champion.
- **CSS non chargé** : **CssGuard** affiche un toast + bouton *Recharger*.

## 📝 Licence & crédits

- Fan-made, non affilié à Riot.  
- Données & assets via **Riot Data Dragon** et **CommunityDragon**.
