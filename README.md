# LoL Quiz

Jeu web Next.js pour deviner les champions de **League of Legends**.  
Modes **Facile/Normal**, **alias** et **légères fautes** tolérés, **timer**, **indice lettre par lettre**, **progression**, **cartes carrées HD**, **lore à la demande** (DDragon), **sticky compact** avec auto-focus, **accessibilité** et **CSP** soignées.

> Fan-made – non affilié à Riot Games.

---

## ✨ Fonctionnalités

- **Cartes carrées HD** (CDragon “champion-icons”) avec **fallback DDragon**.
- **Deux modes** :  
  - **Normal** : dos de carte “?” (aucune image avant de trouver).  
  - **Facile** : image **noir & blanc + blur**.
- **Saisie tolérante** : accents/espaces/ponctuation ignorés, alias & erreurs fréquentes gérées.
- **Indice** : révèle **une lettre** à la fois.
- **Timer** (pause/reprendre), **progress bar**, **reset**.
- **Sticky compact** fluide (fondu + blur), **auto-focus** quand on scrolle.
- **Panneau de carte** (en bas) :  
  - carte non trouvée → saisie + indice ;  
  - carte trouvée → **nom, titre, rôles, ressource, lore** (fetch à la demande).
- **Overlay de victoire** (timer stoppé).
- **Accessibilité** : ARIA, inert/hidden, annonce du dernier essai, Échap, clic extérieur, taille des cibles.
- **Perfs** : images responsives `sizes`, `next/image`, `preconnect` CDN, scroll via `requestAnimationFrame`, `content-visibility`, Lighthouse **100/100/100/100** (avec la config livrée).

---

## 🕹️ Règles de saisie & alias

- Normalisation : **minuscules**, **accents/espaces/apostrophes/ponctuation supprimés**.
- **Tokens** du nom utilisables (≥ 3 lettres) — ex. “Nunu & Willump” → `nunu`, `willump`.
- **Jarvan IV** : `jarvan`, `jarvan4` → `Jarvan IV`.
- **Master Yi** : `maitreyi` → `Master Yi`.
- **Wukong** ↔ `monkeyking`.
- **Fautes courantes** prises en charge (extraits) :
  - Shyvana : `shivana`, `shyvanna`, …  
  - Qiyana : `qiana`, `quiana`, `kiyana`, …  
  - Taliyah : `talia`, `taliya`, `talya`, …  
  - Tryndamere : `trindamer`, `trynda`, …  
  - Xin Zhao : `xinzao`, `xinzaho`  
  - Tahm Kench : `tahmken`, `tamkench`, …  
  - Kassadin : `kasadin` ; Katarina : `katarena`…

> Tolérance **fuzzy** (Levenshtein ≤ 1) **seulement si** la saisie fait **≥ 4 lettres**.  
> Pour les clés très courtes (2–3), on **évite le fuzzy** pour ne pas matcher n’importe quoi.

---

## 🧱 Stack

- **Next.js 15 (App Router)**, TypeScript, React 18
- **Tailwind CSS** (importé dans `app/globals.css`)
- **next/image** optimisé
- **CDN**:  
  - CDragon (carrés HD fiables)  
  - DDragon (fallback + lore, versionnée)
- **CSP** stricte (pas de scripts inline), styles inline **minimaux** uniquement pour le **filet CssGuard**.

---

## 📁 Structure

app/
a-propos/
games/
champions/
page.tsx # page SSR
ChampionsGame.tsx # logique + UI (client)
layout.tsx # layout global + <CssGuard/>
globals.css # thème + utilitaires + flip 3D propres (+ grille)
components/
ChampionCard.tsx # carte carrée HD, bandeau infos, dos '?'
SiteHeader.tsx # header + menu mobile accessible
CssGuard.tsx # filet si le CSS ne charge pas (overlay + reload)
lib/
champions.ts # parsing d’exports DDragon-like si besoin
championAssets.ts # URLs CDragon/DDragon (+ DDRAGON_VERSION)
ddragon.ts # fetch “lore” on-demand
public/

icônes SVG

reports/
lighthouse-*.html # audits (hors git)
scripts/
predeploy.mjs # build + checks + Lighthouse
kill-port.mjs # util port (Windows)


---

## ⚙️ Configuration

- **`next.config.ts`** → `images.remotePatterns` doit autoriser :
  - `ddragon.leagueoflegends.com`
  - `raw.communitydragon.org`
- **`lib/championAssets.ts`** → `DDRAGON_VERSION` (à pinner ou mettre à jour)
- **`app/layout.tsx`** → `metadataBase` (URL du site en prod), `preconnect/dns-prefetch` vers DDragon/CDragon.

Aucune clé privée n’est requise (tout est public côté CDN).  
Optionnel : `.env.local` avec `NEXT_PUBLIC_SITE_URL`.

---

## 🚀 Lancer le projet

```bash
# Install
npm i

# Dev (avec HMR)
npm run dev

# Prod local (build + start)
npm run prod:local

# Pré-déploiement complet + Lighthouse (rapports HTML dans /reports)
npm run predeploy

# Variante rapide sans Lighthouse (port 3001)
npm run predeploy:fast


Ports bloqués ?

npm run stop:3000
npm run stop:3001

🔒 Sécurité / CSP

Pas de scripts inline (évite XSS).

style-src 'self' 'unsafe-inline' : autorise les styles inline du CssGuard (overlay si le CSS ne charge pas).

Tu peux durcir plus tard (hash/nonce) si tu veux enlever 'unsafe-inline'.

♿ Accessibilité

Menu mobile : pas focusable quand masqué (hidden + inert).

Panneaux : role="dialog", Échap ferme, clic extérieur ferme.

Annonce du dernier essai (aria-live="polite").

Focus management : auto-focus sticky compact quand le header sort de l’écran ; focus correct lors des validations/indices.

⚡ Performance

Images responsives (sizes soignés, quality=90, placeholder=blur).

preconnect / dns-prefetch vers les CDN d’images.

Scroll lissé (RAF + throttling), sticky “GPU-friendly”.

content-visibility pour les cartes hors écran.

Lighthouse : 100 / 100 / 100 / 100 avec la config actuelle.

🛟 Dépannage

CSS non chargé (page “brute”) :
→ Overlay CssGuard s’affiche avec un bouton Recharger.
Vérifie app/globals.css importé dans app/layout.tsx.
En dev: CTRL+F5, regarde la console, vérifie la CSP.

CSP “Refused to execute inline script” :
→ Pas de scripts inline dans l’app (OK). Garde la politique actuelle.

EADDRINUSE: 3000 :
→ npm run stop:3000 puis relance. Idem 3001.

Images 403/404 :
→ Vérifie next.config.ts (remotePatterns) et l’ID/slug/version DDragon.

🧪 Qualité / Lint

ESLint (Next + TS) sans any inutiles ni “unused vars”.

npm run predeploy lance build + checks + Lighthouse.

🤝 Contrib / Git

Branches feat/*, fix/*, chore/*, docs/*.

Commits Conventional :

feat(game): mode facile/normal, cartes HD, alias…

fix(a11y): aria-hidden + inert menu mobile

docs(readme): sections stack & dépannage

PR, review, merge → main.

🗺️ Roadmap (idées)

Filtres (rôle/ressource/lane), stats de fin détaillées.

PWA/offline léger (optionnel).

Autres jeux (items, sorts, splash quiz…).