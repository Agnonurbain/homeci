# 📦 PACKAGE.md — Registre des dépendances HOMECI

> **Dernière mise à jour :** 2026-04-12 (otplib, husky, rollup-plugin-visualizer)
> **Ce fichier DOIT être mis à jour à chaque ajout/suppression de dépendance.**

---

## 📋 Table des matières

1. [Installation initiale](#installation-initiale)
2. [Frontend — Dépendances principales](#frontend--dépendances-principales)
3. [Frontend — Dépendances de développement](#frontend--dépendances-de-développement)
4. [Cloud Functions — Dépendances](#cloud-functions--dépendances)
5. [Services externes](#services-externes-non-npm)
6. [Configuration manuelle requise](#configuration-manuelle-requise)
7. [Commandes d'installation de référence](#commandes-dinstallation-de-référence)

---

## Installation initiale

```bash
# Depuis la racine du projet
npm install                    # Installe toutes les dépendances
npm run dev                    # Serveur Vite local (HMR)

# Build production
npm run build                  # Build Vite → dist/

# Tests
npm test                       # Vitest run
npm run test:coverage          # Avec couverture

# Qualité
npm run lint                   # ESLint
npm run typecheck              # TypeScript no-emit
```

---

## Frontend — Dépendances principales

### Core

| Package | Version | Usage | Import |
|---|---|---|---|
| `react` | `^18.3.1` | Core React | `import React from 'react'` |
| `react-dom` | `^18.3.1` | React DOM | `import ReactDOM from 'react-dom/client'` |

### Routing & Navigation

| Package | Version | Usage | Import |
|---|---|---|---|
| `react-router-dom` | `^7.13.2` | Routing SPA | `import { BrowserRouter, Routes, Route } from 'react-router-dom'` |

### Firebase

| Package | Version | Usage | Import |
|---|---|---|---|
| `firebase` | `^12.9.0` | Auth + Firestore + Storage + FCM | `import { initializeApp } from 'firebase/app'` |

### Cartes

| Package | Version | Usage | Import |
|---|---|---|---|
| `leaflet` | `^1.9.4` | Moteur de carte | `import L from 'leaflet'` |
| `react-leaflet` | `^4.2.1` | Composants React Leaflet | `import { MapContainer, TileLayer } from 'react-leaflet'` |
| `@types/leaflet` | `^1.9.21` | Types TypeScript Leaflet | `import type { LatLngTuple } from 'leaflet'` |

### Graphiques

| Package | Version | Usage | Import |
|---|---|---|---|
| `recharts` | `^3.7.0` | Graphiques (stats, analytics) | `import { LineChart, BarChart } from 'recharts'` |

### UI & Icônes

| Package | Version | Usage | Import |
|---|---|---|---|
| `lucide-react` | `^0.344.0` | Bibliothèque d'icônes | `import { Home, Search, User } from 'lucide-react'` |

### SEO

| Package | Version | Usage | Import |
|---|---|---|---|
| `react-helmet-async` | `^3.0.0` | Meta tags dynamiques | `import { HelmetProvider, Helmet } from 'react-helmet-async'` |

### Monitoring

| Package | Version | Usage | Import |
|---|---|---|---|
| `@sentry/react` | `^10.46.0` | Error tracking + performance | `import * as Sentry from '@sentry/react'` |

### Validation

| Package | Version | Usage | Import |
|---|---|---|---|
| `zod` | `^4.3.6` | Validation de schémas | `import { z } from 'zod'` |

### Sécurité / 2FA

| Package | Version | Usage | Import |
|---|---|---|---|
| `otplib` | `^13.0.0` | TOTP pour authentification 2FA admin | `import { generateSecret, verifySync } from 'otplib'` |

---

## Frontend — Dépendances de développement

### Build & Bundler

| Package | Version | Usage |
|---|---|---|
| `vite` | `^5.4.2` | Bundler + dev server |
| `@vitejs/plugin-react` | `^4.3.1` | Plugin React pour Vite |

### TypeScript

| Package | Version | Usage |
|---|---|---|
| `typescript` | `^5.5.3` | Compiler TypeScript |
| `typescript-eslint` | `^8.57.2` | Plugin ESLint TypeScript |
| `@types/react` | `^18.3.5` | Types React |
| `@types/react-dom` | `^18.3.0` | Types React DOM |

### Tests

| Package | Version | Usage |
|---|---|---|
| `vitest` | `^4.1.4` | Test runner |
| `@vitest/coverage-v8` | `^4.1.1` | Coverage V8 |
| `@testing-library/react` | `^16.3.2` | Tests React components |
| `@testing-library/jest-dom` | `^6.9.1` | Matchers Jest DOM |
| `jsdom` | `^28.1.0` | Environnement DOM pour tests |

### CI / Hooks

| Package | Version | Usage |
|---|---|---|
| `husky` | `^9.1.7` | Pre-commit hooks (lint → typecheck → test) |
| `rollup-plugin-visualizer` | _(latest)_ | Analyse bundle size (`dist/stats.html`) |

### Linting

| Package | Version | Usage |
|---|---|---|
| `eslint` | `^9.9.1` | Linter |
| `@eslint/js` | `^9.9.1` | Config ESLint recommandée |
| `eslint-plugin-react-hooks` | `^5.1.0-rc.0` | Rules React hooks |
| `eslint-plugin-react-refresh` | `^0.4.11` | Rules React Refresh |
| `globals` | `^15.9.0` | Globals ESLint |

### CSS

| Package | Version | Usage |
|---|---|---|
| `tailwindcss` | `^3.4.1` | Framework CSS utility-first |
| `postcss` | `^8.4.35` | PostCSS processor |
| `autoprefixer` | `^10.4.18` | Prefixes CSS automatiques |

### Utilitaires

| Package | Version | Usage |
|---|---|---|
| `pdfkit` | *(script)* | Script `generate_pdfs.js` pour générer PDFs CGV |

---

## Cloud Functions — Dépendances

### Core

| Package | Version | Usage | Import |
|---|---|---|---|
| `firebase-admin` | `^13.0.0` | Admin SDK (Firestore, Auth, FCM) | `import * as admin from 'firebase-admin'` |
| `firebase-functions` | `^6.3.0` | Cloud Functions v2 | `import { onCall, onSchedule } from 'firebase-functions/v2'` |

### Développement

| Package | Version | Usage |
|---|---|---|
| `typescript` | *(hérité)* | Compilation TS |

### Scripts (`functions/package.json`)

```json
{
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start",
    "deploy": "firebase deploy --only functions"
  }
}
```

---

## Services externes (non-npm)

Ces services nécessitent une configuration manuelle externe.

| Service | Usage | Config requise | Variables d'env |
|---|---|---|---|
| **Vercel** | Hébergement frontend | Compte Vercel, projet lié au repo | — |
| **Firebase Auth** | Authentification (email/password, Google) | Projet Firebase `homeci-prod-72e4b` | Firebase config dans `src/lib/firebase.ts` |
| **Firestore** | Base de données principale | Projet Firebase, règles déployées | — |
| **Firebase Storage** | Stockage images/documents | Projet Firebase, règles déployées | — |
| **Firebase Cloud Messaging** | Push notifications | Projet Firebase, service account | — |
| **Cloud Functions** | Logique serveur (auto-reset, push) | Projet Firebase, runtime nodejs20 | — |
| **Sentry** | Error tracking + performance | Projet Sentry `@sentry/react` | `SENTRY_DSN` |
| **Wave** | Paiement Mobile Money | Compte marchand Wave | API keys (à configurer) |
| **Orange Money** | Paiement Mobile Money | Compte Orange Developer | API keys (à configurer) |
| **MTN MoMo** | Paiement Mobile Money | Compte MoMo Developer | API keys (à configurer) |
| **Moov Flooz** | Paiement Mobile Money | Compte marchand Moov | API keys (à configurer) |
| **Djamo** | Paiement Mobile Money | Compte Djamo | API keys (à configurer) |

---

## Configuration manuelle requise

### 1. Firebase Console 🔴 Critique

- **Créer le projet** `homeci-prod-72e4b` (déjà fait)
- **Activer Authentication** — Email/password + Google
- **Activer Firestore** — Déployer les règles (`firebase deploy --only firestore:rules`)
- **Activer Storage** — Déployer les règles (`firebase deploy --only storage`)
- **Configurer FCM** — Service account pour push notifications
- **Cloud Functions** — Région `europe-west1`, runtime `nodejs20`

### 2. Vercel

- **Lier le repo GitHub** — Déploiement automatique sur push `main`
- **Variables d'environnement** — Firebase config, Sentry DSN
- **Headers** — Configurer dans `vercel.json` (déjà fait)

### 3. Sentry

- **Créer un projet** Sentry pour HOMECI
- **Configurer le DSN** — Variable d'environnement `SENTRY_DSN`
- **Sourcemaps** — Upload automatique avec `@sentry/react`

### 4. Opérateurs de paiement (Mobile Money)

- **Wave** : Créer un compte marchand → obtenir API key + webhook secret
- **Orange Money** : S'inscrire sur Orange Developer → obtenir credentials
- **MTN MoMo** : S'inscrire sur MoMo Developer → créer une app API
- **Moov Flooz** : Contacter Moov Africa CI → obtenir accès API
- **Djamo** : Contacter Djamo → obtenir credentials marchand

### 5. CGV (Conditions Générales de Vente)

- **3 versions** : locataire, propriétaire, notaire
- **Format** : `.txt` + `.pdf` dans `public/cgv/`
- **Script génération** : `scripts/generate_pdfs.js` (pdfkit)
- **Conformité** : Droit ivoirien (loi n°2013-546, n°2014-138)

---

## Commandes d'installation de référence

### Ajouter une dépendance frontend

```bash
# Dépendance principale
npm install <package-name>

# Dépendance de développement
npm install <package-name> --save-dev
```

### Ajouter une dépendance Cloud Functions

```bash
cd functions
npm install <package-name>
```

### Mettre à jour les dépendances

```bash
# Tout mettre à jour
npm update

# Vérifier les mises à jour disponibles
npx npm-check-updates
```

### Déploiement

```bash
# Frontend (Vercel — automatique sur push main)
git push origin main

# Cloud Functions
cd functions && npm run build
firebase deploy --only functions

# Règles Firestore
firebase deploy --only firestore:rules

# Règles Storage
firebase deploy --only storage

# Index Firestore
firebase deploy --only firestore:indexes
```

### Installer depuis zéro

```bash
rm -rf node_modules dist functions/node_modules functions/lib
npm install
cd functions && npm install && npm run build
cd ..
```

---

## ⚠️ Notes importantes

### Code splitting

Le `vite.config.ts` configure des manual chunks :
- `recharts` → chunk séparé (graphiques, lourd)
- `leaflet` + `react-leaflet` → chunk séparé (cartes, lourd)

Objectif : bundle initial < 350KB gzip.

### Tests

- **Firebase entièrement mocké** dans `src/tests/setup.ts`
- **Mock global** : `ResizeObserver`, `window.scrollTo`, `firebase/app-check`
- **Coverage limitée** à `src/utils/`, `src/services/`, `src/hooks/`
- **Ne jamais** connecter aux vrais services Firebase dans les tests

### TypeScript strict

- `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` activés
- Pas de `any` sauf dans les `catch` blocks
- Pas de `@ts-ignore` — utiliser `@ts-expect-error` avec justification

### ESLint

- `@typescript-eslint/no-explicit-any` et `no-unused-vars` en **warning** (TODO: passer en error progressivement)
- Ignore `dist/` et `functions/`

---

*Mettre à jour ce fichier à CHAQUE fois qu'une dépendance est ajoutée, supprimée ou mise à jour.*
*Dernière mise à jour : 2026-04-09*
