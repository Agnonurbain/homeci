# HOMECI — Manifeste Développeur IA

> Plateforme immobilière certifiée par notaire pour la Côte d'Ivoire.
> **Toujours lire ce fichier en premier avant toute modification.**

## Identité du projet

- **Stack** : React 18 + TypeScript strict + Vite 5 + Tailwind 3 + Firebase (Blaze, europe-west1) + React Router DOM
- **Déploiement** : Vercel (frontend) + Firebase Cloud Functions v2 (backend)
- **Firebase project** : `homeci-prod-72e4b` (variables via `.env`)
- **GitHub** : `github.com/agnonurbain/homeci` (branche `main`)
- **Région cible** : Côte d'Ivoire (Abidjan) — connexions lentes, Mobile Money, droit ivoirien

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
- Utiliser **exclusivement** les tokens de `src/styles/homeci-tokens.ts`.
- Couleurs : `HColors.orangeCI` (#FF6B00), `HColors.vertCI` (#009E49), `HColors.gold` (#D4A017).
- **INTERDIT** : `HColors.green`, `HColors.terracotta` — couleurs obsolètes, utiliser `vertCI`/`orangeCI`.
- Font families : `var(--font-cormorant)` (titres), `var(--font-nunito)` (corps).

### Firebase / Firestore
- **Jamais** de modification de schéma Firestore sans documenter dans `ARCHITECTURE.md`.
- Toute nouvelle collection → ajouter les règles dans `firestore.rules` ET `storage.rules`.
- Services dans `src/services/`. Un service par collection Firestore.
- Cloud Functions dans `functions/src/index.ts` — v2 API uniquement, région `europe-west1`.

### Tests
- Tout nouveau composant/service → au moins 1 fichier de test.
- Tests dans `__tests__/` au même niveau que le fichier testé.
- Mock Firebase via `src/tests/firebase.mock.ts` — ne jamais connecter aux vrais services.
- Lancer avant tout commit : `npx vitest run`.

### Git
- Format de commit : `type(scope): description` (ex: `feat(admin): ajout onglet signalements`).
- Types : `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `ci`.
- Un commit par fonctionnalité. Pas de commits monolithiques.

## Architecture

```
src/
├── App.tsx                    # Routes (React Router DOM)
├── components/                # Composants UI
│   ├── admin/                 # Sous-composants AdminDashboard
│   ├── chat/                  # Messagerie (si activée)
│   ├── notaire/               # Composants spécifiques notaire
│   ├── owner/                 # Composants propriétaire
│   │   └── propertyForm/      # Formulaire ajout/édition bien
│   ├── tenant/                # Composants locataire
│   ├── ui/                    # Composants réutilisables (KenteLine, etc.)
│   └── __tests__/             # Tests composants
├── contexts/                  # AuthContext (seul context)
├── hooks/                     # Hooks métier (useAdminDashboard, useOwnerVisits, etc.)
├── lib/                       # firebase.ts (config + exports)
├── services/                  # Services Firestore (1 par collection)
├── styles/                    # homeci-tokens.ts (palette CI)
├── types/                     # Interfaces TypeScript
├── utils/                     # Utilitaires purs
└── tests/                     # Setup tests + prelaunch.test.ts

functions/src/                 # Cloud Functions v2
public/                        # Assets statiques (logos, favicons, manifest, sw.js)
```

## Rôles utilisateur

| Rôle | Auth | Dashboard | Pouvoirs |
|------|------|-----------|----------|
| `locataire` | Email, Google | TenantDashboard | Rechercher, favoris, demander visite, signaler |
| `proprietaire` | Email, Google | OwnerAgentDashboard | Publier biens, gérer visites, statut loué/vendu |
| `notaire` | Email, Google + code invitation | NotaireDashboard | Vérifier documents, certifier/décertifier |
| `admin` | Email + code accès | AdminDashboard (11 onglets) | Tout modérer, suspendre, gérer codes |

## Routes

| Route | Composant | Layout | Auth requise |
|-------|-----------|--------|--------------|
| `/` | PublicPropertyList + Hero | PublicLayout | Non |
| `/bien/:id` | PropertyViewModal | PublicLayout | Non |
| `/faq` | FAQPage | PublicLayout | Non |
| `/cgv` | CGVPage | PublicLayout | Non |
| `/tutoriel` | TutorialPage | PublicLayout | Non |
| `/dashboard/*` | *Dashboard (selon rôle) | DashboardLayout | Oui |
| `/portail-securise` | AdminDashboard | AdminLayout | Admin + code |

## Collections Firestore

| Collection | Sous-collections | Accès |
|------------|-----------------|-------|
| `users/{uid}` | `favorites/`, `fcm_tokens/` | Owner + Admin |
| `properties/{id}` | — | Lecture publique, écriture owner |
| `visits/{id}` | — | Lecture auth, écriture owner/tenant |
| `notifications/{id}` | — | Lecture owner, écriture auth |
| `reports/{id}` | — | Lecture reporter+admin, écriture auth, update admin |
| `surveys/{id}` | — | Lecture admin, écriture auth |
| `notaire_codes/{id}` | — | Lecture auth, écriture limitée |
| `chats/{id}` | `messages/` | Participants uniquement |

## Cloud Functions

| Fonction | Trigger | Description |
|----------|---------|-------------|
| `autoResetPropertyStatus` | Scheduler (1h) | Reset biens après 3j sans mise à jour |
| `sendPushNotification` | Firestore onCreate `/notifications` | Push FCM au destinataire |
| `assignNotaireRole` | onCall | Assigne le rôle notaire avec code |
| `certifyProperty` | onCall | Certifie un bien (notaire) |
| `createAdmin` | onCall | Crée un compte admin |
| `onNewChatMessage` | Firestore onCreate `/chats/messages` | Notification nouveau message |

## Checklist pré-commit

1. `npx vitest run` — 0 échec
2. `npx vite build` — 0 erreur
3. Pas de `HColors.green` ni `HColors.terracotta`
4. Pas de `any` non justifié
5. Pas de doublon d'import
6. Nouveau composant → test associé

## Contraintes CI/Abidjan

- **Pas d'auth téléphone Firebase** (SMS non supporté en CI, désactivé).
- **Connexions lentes** — lazy loading, images < 200KB, skeletons obligatoires.
- **Mobile Money** — Orange Money, MTN MoMo, Wave, Moov Flooz, Djamo.
- **Droit ivoirien** — CGV conformes loi n°2013-546 et n°2014-138 (notaires).
