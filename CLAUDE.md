# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# HOMECI — Manifeste Développeur IA

> Plateforme immobilière certifiée par notaire pour la Côte d'Ivoire (Abidjan).
> Voir `ARCHITECTURE.md` pour les schémas Firestore et flux de données détaillés.
> Voir `WORKFLOW.md` pour les protocoles de session et checklists de déploiement.

## Commandes essentielles

```bash
# Développement
npm run dev              # Serveur Vite local (HMR)
npm run build            # Build production (vite build)
npm run preview          # Preview du build local

# Tests
npm test                 # Tous les tests (vitest run)
npm run test:watch       # Mode watch (vitest)
npx vitest run src/components/__tests__/AuthModal.test.tsx  # Un seul fichier
npm run test:coverage    # Couverture (utils, services, hooks uniquement)

# Qualité
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit -p tsconfig.app.json

# Cloud Functions (depuis functions/)
cd functions && npm run build    # Compile TS → lib/
cd functions && npm run serve    # Build + emulators
```

## Stack et déploiement

- **Frontend** : React 18 + TypeScript strict + Vite 5 + Tailwind 3 + React Router DOM v7
- **Backend** : Firebase (Auth + Firestore + Storage + FCM) + Cloud Functions v2 (europe-west1)
- **Déploiement** : Vercel (frontend) + Firebase (functions). Firebase project : `homeci-prod-72e4b`
- **Monitoring** : Sentry (`@sentry/react`)
- **Validation** : Zod
- **Cartes** : Leaflet + react-leaflet (chunked séparément dans le build)
- **Graphiques** : Recharts (chunked séparément dans le build)
- **SEO** : react-helmet-async
- **CI** : GitHub Actions (`.github/workflows/test.yml`) — lint → build → test → coverage. Node 24.

## Architecture — Vue d'ensemble

**SPA** (Vercel) ↔ **Firebase** (Auth + Firestore + Storage + FCM) + **Cloud Functions v2**.

**Flux principal** : Propriétaire soumet un bien (formulaire 5 étapes) → admin modère (checklist 10 critères) → notaire certifie → bien publié. Visites à 1000 FCFA, auto-reset après 3 jours via Cloud Function scheduler.

**Routing par rôle** : `AuthContext` (seul React Context) détermine le rôle. `/dashboard/*` rend l'un des 4 dashboards (TenantDashboard, OwnerAgentDashboard, NotaireDashboard, AdminDashboard) selon `user.role`. Admin : `/portail-securise` derrière un code d'accès.

**4 rôles** : `locataire`, `proprietaire`, `notaire` (code invitation), `admin` (code accès + 11 onglets).

## Règles de code (IMPÉRATIVES)

### TypeScript
- Mode strict obligatoire. Pas de `any` sauf dans les `catch` blocks.
- Toute interface/type exporté va dans `src/types/`.
- Pas de `@ts-ignore` — utiliser `@ts-expect-error` avec justification.

### React
- Composants fonctionnels uniquement (sauf `ErrorBoundary`).
- Hooks custom dans `src/hooks/`. Nommage : `use<Domain><Action>` (ex: `useOwnerVisits`).
- Pas de prop drilling > 2 niveaux — utiliser un Context ou un hook dédié.
- Lazy loading obligatoire pour les routes/dashboards (`React.lazy` + `Suspense`).

### Styles
- Utiliser **exclusivement** les tokens de `src/styles/homeci-tokens.ts` (`HColors`, `HAlpha`, `HFonts`, `HGradients`, `HS`).
- Couleurs primaires : `HColors.orangeCI` (#FF6B00), `HColors.vertCI` (#009E49), `HColors.gold` (#D4A017).
- **NE PAS utiliser dans les nouveaux composants** : `HColors.green`, `HColors.terracotta` — préférer `vertCI`/`orangeCI`.
- Styles inline réutilisables via `HS.*` (ex: `HS.btnPrimary`, `HS.input`, `HS.card`).
- Font families : `var(--font-cormorant)` (titres), `var(--font-nunito)` (corps).

### Firebase / Firestore
- **Jamais** de modification de schéma Firestore sans documenter dans `ARCHITECTURE.md`.
- Toute nouvelle collection → ajouter les règles dans `firestore.rules` ET `storage.rules`.
- Services dans `src/services/`. Un service par collection Firestore.
- Cloud Functions dans `functions/src/index.ts` — v2 API uniquement, région `europe-west1`.

### Tests
- Tout nouveau composant/service → au moins 1 fichier de test.
- Tests dans `__tests__/` au même niveau que le fichier testé.
- Firebase est **entièrement mocké** dans `src/tests/setup.ts` (global setup via `vite.config.ts`). Ne jamais connecter aux vrais services Firebase dans les tests.
- Coverage limitée à `src/utils/`, `src/services/`, `src/hooks/` (configuré dans `vite.config.ts`).
- Lancer avant tout commit : `npx vitest run`.

### Git
- Format de commit : `type(scope): description` (ex: `feat(admin): ajout onglet signalements`).
- Types : `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `ci`.
- Un commit par fonctionnalité. Pas de commits monolithiques.

## Checklist pré-commit

1. `npx vitest run` — 0 échec
2. `npm run build` — 0 erreur
3. Pas de `HColors.green` ni `HColors.terracotta` dans du code nouveau
4. Pas de `any` non justifié
5. Pas de doublon d'import
6. Nouveau composant → test associé

## Contraintes Côte d'Ivoire / Abidjan

- **Pas d'auth téléphone Firebase** (SMS non supporté en CI, désactivé — erreur 503).
- **Connexions lentes** — lazy loading, images < 200KB, skeletons obligatoires.
- **Mobile Money** — Orange Money, MTN MoMo, Wave, Moov Flooz, Djamo.
- **Droit ivoirien** — CGV conformes loi n°2013-546 et n°2014-138 (notaires).
- **reCAPTCHA retiré** — timeout sur connexions lentes.
