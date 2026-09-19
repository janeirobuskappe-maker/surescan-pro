# SureScan Pro

**Scanner professionnel de surebets & arbitrage sportif**  
Cible : bookmakers Gabon / Afrique Centrale (1xBet, Melbet, BetWinner, 22Bet, Premier Bet…).

Application Web moderne (Next.js 16 + React 19) conçue dès le départ pour devenir une **vraie application** (PWA → APK Android via Capacitor ou TWA).

## Fonctionnalités

- Détection automatique de surebets (arbitrage) sur matchs **réels** et **virtuels**
- Moteur probabiliste (Poisson) + génération de cotes réalistes avec marges bookmakers
- Dashboard live + historique de scans
- Calculatrice de répartition optimale des mises (FCFA)
- Support multi-marchés : 1X2, OU 2.5, BTTS, 12…
- Design clair multi-couleur, mobile-first, prêt PWA

## Stack

- **Frontend** : Next.js 16 (App Router), React 19, Tailwind CSS 4, Lucide
- **Backend** : Route Handlers Next.js + Drizzle ORM
- **Base de données** : PostgreSQL
- **Langue** : TypeScript strict, français

## Structure

```
src/
├── app/                  # App Router
│   ├── api/              # health, bookmakers, surebets, stats, scan
│   ├── calculatrice/     # Calculatrice de mises
│   ├── layout.tsx
│   ├── page.tsx          # Dashboard scanner
│   └── globals.css       # Thème clair multi-couleur
├── components/           # Shell, Dashboard, Calculator, SurebetCard, Sparkline
├── db/                   # schema + client Drizzle
└── lib/                  # arbitrage, engine, catalog, types
```

## Démarrage rapide

```bash
# 1. Variables d'environnement
cp .env.example .env.local
# DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/surescan

# 2. Install
npm install

# 3. Base de données
createdb surescan   # ou via Docker
npx drizzle-kit push

# 4. Dev
npm run dev
```

Ouvre http://localhost:3000

## Roadmap vers APK

1. **PWA** (déjà préparé) : `manifest.json` + metadata viewport/theme-color
2. **Capacitor** (recommandé) :
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init
   npx cap add android
   npm run build && npx cap sync
   ```
3. Ou **Trusted Web Activity (TWA)** pour un APK minimal autour de la PWA.

## Audit & améliorations effectuées

- Reconstruction complète de l’arborescence Next.js App Router
- Passage thème sombre → **fond blanc + accents multi-couleur** (mint / azure / amber / rose / violet)
- Design system cohérent (panel, field, badges, card-lift)
- Métadonnées PWA + safe-area pour mobile / futur APK
- Chemins API normalisés
- Code métier conservé (engine, arbitrage, schema) et nettoyé

## Licence & responsabilité

Outil d’analyse uniquement. Les paris comportent des risques. 18+. Jouez de manière responsable.
