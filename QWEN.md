# Qwen.md

This file provides guidance to Qwen Code (qwen.ai/code) when working with code in this repository.

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
- **CI** : GitHub Actions (`.github/workflows/test.yml`) — lint → **typecheck** → build → test → coverage. Node 24.
  - ✅ Branche `develop` créée pour les PRs
  - ✅ Version `1.0.0`

## Audit du répertoire (2026-04-12 — notifications FCM offline)

### État global : ~95% complété

| Domaine | Progression |
|---|---|
| Frontend (4 dashboards, formulaires, PWA, chat pièces jointes, présence) | ~92% |
| Backend Firebase (Auth, Firestore, Storage, FCM, Cloud Functions, offline notifications) | ~94% |
| Tests (93 fichiers, 998 tests, 0 erreur, 100% passent) | ~98% |
| CI/CD (GitHub Actions + Vercel, typecheck, package-lock fixé) | ~85% |
| Sécurité (règles Firestore, portail admin 2 étapes, chat_attachments rules) | ~82% |
| Notifications (online/offline detection, deep links, anti-doublons) | ~95% |

### ✅ Résolu session haute priorité

- `typecheck` ajouté à la CI
- Branche `develop` créée
- Cloud Functions modularisées (6 fichiers)
- Version 1.0.0
- 111 erreurs TypeScript corrigées (35 fichiers)
- Chat temps réel audité et confirmé fonctionnel

### ✅ Résolu session notifications FCM offline (2026-04-12)

- **Notifications FCM offline** — Détection en ligne/hors ligne (seuil 30s via `last_seen`)
- **Cloud Function `onNewChatMessage`** — Vérifie `last_seen` destinataire, `isOnline`, push direct si offline
- **Anti-doublons** — Flag `push_sent: true`, `sendPushNotification` vérifie et skip
- **Métadonnées** — `delivery_mode` ('instant' vs 'push'), `recipient_online`, `chat_id`, `sender_id`, `sender_name`
- **Hook `usePresence`** — Update `last_seen` toutes les 15s + activité (mouse, keyboard, scroll, touch, visibilitychange)
- **Service worker** — Deep link `/dashboard?open_chat={chatId}`, `buildNotificationUrl` par type
- **Préférences** — Séparation `messages` vs `visits` dans `notification_prefs`
- **19 tests ajoutés** — 7 usePresence + 12 cloud functions
- **843 tests totaux, 100% passent, typecheck clean**

### ✅ Résolu session tests massive (2026-04-10)

- **778 tests, 100% passent** — Cloud Functions (101), services (58), owner (75), admin (34), chat (24), formulaires (18), hooks (17)
- **78 fichiers de test** au total
- **0 erreur TypeScript**
- **Fix CI** — `package-lock.json` regénéré (dépendances optionnelles netbsd/arm64 retirées)

### Points d'attention restants

- Intégration paiement Mobile Money réel à finaliser (laissé de côté)

## Architecture — Vue d'ensemble

**SPA** (Vercel) ↔ **Firebase** (Auth + Firestore + Storage + FCM) + **Cloud Functions v2**.

**Flux principal** : Propriétaire soumet un bien (formulaire 5 étapes) → admin modère (checklist 10 critères) → notaire certifie → bien publié. Visites à 1000 FCFA, auto-reset après 3 jours via Cloud Function scheduler.

**4 rôles** : `locataire`, `proprietaire`, `notaire` (code invitation), `admin` (code accès + 11 onglets).

### Routing (App.tsx)

Toutes les routes sont définies dans `App.tsx` (pas de fichier routes séparé) :
- `/` — page publique (Hero + PropertyList + Features). Redirige vers `/dashboard` si connecté.
- `/bien/:id` — détail d'un bien (accessible connecté ou non).
- `/dashboard/*` — redirige vers `/` si non connecté. Rend un des 4 dashboards via `renderDashboard()` selon `profile.role`.
- `/portail-securise` — admin portal : authentification en 2 étapes (AdminLogin → AdminAccessCode) + session timeout via AdminSessionManager.
- `/faq`, `/cgv`, `/tutoriel` — pages publiques lazy-loaded.

**Auth flow admin/notaire** : AdminLogin (email/password) → AdminAccessCode (code d'accès) → AdminSessionManager (timeout configurable, default 30min). Les notaires passent aussi par AdminAccessCode avec `role="notaire"`.

### Organisation des composants

- `src/components/` — composants globaux (Header, Footer, AuthModal, etc.)
- `src/components/admin/` — sous-composants du dashboard admin (onglets, stats, modals)
- `src/components/owner/` — sous-composants propriétaire (formulaire 5 étapes dans `owner/propertyForm/`)
- `src/components/notaire/` — sous-composants notaire (validation, cards, stats)
- `src/components/chat/` — composants de messagerie (ChatInput, MessageBubble)

### Fichiers clés

- `src/lib/firebase.ts` — init Firebase (auth, db, storage, functions) — point d'import unique.
- `src/contexts/AuthContext.tsx` — seul React Context. Exporte `useAuth()` (user, profile, loading, signIn, signUp, etc.).
- `src/styles/homeci-tokens.ts` — design tokens (HColors, HAlpha, HFonts, HGradients, HS).
- `src/data/coteIvoireGeo.ts` — données géographiques CI (régions, départements, communes, quartiers).
- `src/constants/labels.ts`, `src/constants/visitStatus.ts` — labels et statuts réutilisables.
- `functions/src/index.ts` — toutes les Cloud Functions (une seule entrée).
- `src/services/` — un service par domaine Firestore (15 services : property, visit, chat, payment, notification, storage, etc.).

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
- Firebase est **entièrement mocké** dans `src/tests/setup.ts` (global setup via `vite.config.ts`). Ne jamais connecter aux vrais services Firebase dans les tests. Le setup mocke aussi `ResizeObserver`, `window.scrollTo`, et `firebase/app-check`.
- Pour mocker un service Firebase spécifique dans un test, le re-mocker localement — le mock global retourne des valeurs minimales (`null`, `{}`, `vi.fn()`).
- Coverage limitée à `src/utils/`, `src/services/`, `src/hooks/` (configuré dans `vite.config.ts`).
- Lancer avant tout commit : `npx vitest run`.

### Git
- Format de commit : `type(scope): description` (ex: `feat(admin): ajout onglet signalements`).
- Types : `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `ci`.
- Un commit par fonctionnalité. Pas de commits monolithiques.

## Checklist pré-commit

1. `npx vitest run` — 0 échec
2. `npm run build` — 0 erreur
3. `npm run typecheck` — 0 erreur TypeScript (**nouveau**)
4. Pas de `HColors.green` ni `HColors.terracotta` dans du code nouveau
5. Pas de `any` non justifié
6. Pas de doublon d'import
7. Nouveau composant → test associé

## Contraintes Côte d'Ivoire / Abidjan

- **Pas d'auth téléphone Firebase** (SMS non supporté en CI, désactivé — erreur 503).
- **Connexions lentes** — lazy loading, images < 200KB, skeletons obligatoires.
- **Mobile Money** — Orange Money, MTN MoMo, Wave, Moov Flooz, Djamo.
- **Droit ivoirien** — CGV conformes loi n°2013-546 et n°2014-138 (notaires).
- **reCAPTCHA retiré** — timeout sur connexions lentes.
