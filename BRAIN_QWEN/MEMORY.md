# 🧠 MEMORY.md — Mémoire projet HOMECI

> **Dernière session :** 2026-04-10 (fix CI package-lock + session tests massive)
> **Prochain rappel :** Lire NOT_DONE.md et DONE.md avant chaque session de travail.

---

## 📌 Contexte projet

- **Nom** : HOMECI — Plateforme immobilière certifiée par notaire pour la Côte d'Ivoire
- **Auteur** : N'DA Agnon Aymeric Urbain
- **Type** : SPA (Single Page Application)
- **Stack** : React 18 + TypeScript strict + Vite 5 + Tailwind 3 + React Router DOM v7
- **Backend** : Firebase (Auth + Firestore + Storage + FCM) + Cloud Functions v2 (europe-west1, nodejs20)
- **Déploiement** : Vercel (frontend) + Firebase (functions). Project : `homeci-prod-72e4b`
- **Monitoring** : Sentry (`@sentry/react`)
- **Validation** : Zod
- **Cartes** : Leaflet + react-leaflet (chunked séparément)
- **Graphiques** : Recharts (chunked séparément)
- **SEO** : react-helmet-async
- **Langue** : Code en anglais, UI strings en français
- **Monnaie** : XOF (FCFA)
- **Pays** : Côte d'Ivoire (Abidjan)

---

## 📁 Layout du projet

```
homeci/
├── src/                          # Code source frontend (~188 fichiers)
│   ├── App.tsx, main.tsx         # Points d'entrée
│   ├── components/               # 91 composants (.tsx)
│   │   ├── admin/                # Dashboard admin (11 onglets)
│   │   ├── owner/                # Dashboard propriétaire + formulaire 5 étapes
│   │   ├── notaire/              # Dashboard notaire + validation
│   │   ├── tenant/               # Dashboard locataire
│   │   ├── chat/                 # Messagerie
│   │   ├── ui/                   # Composants UI réutilisables
│   │   └── __tests__/            # 18 fichiers de test
│   ├── hooks/                    # 14 hooks custom (+ 8 tests)
│   ├── services/                 # 15 services Firestore/API (+ 8 tests)
│   ├── utils/                    # 8 utilitaires (+ 8 tests)
│   ├── contexts/AuthContext.tsx  # Seul React Context
│   ├── lib/firebase.ts           # Init Firebase (point unique)
│   ├── types/                    # 2 fichiers de types
│   ├── constants/                # Labels et statuts
│   ├── data/coteIvoireGeo.ts     # Données géographiques CI
│   ├── styles/homeci-tokens.ts   # Design tokens
│   └── tests/                    # Infrastructure de test (mocks, factories)
│
├── functions/                    # Cloud Functions v2 (Node 20)
│   ├── src/index.ts              # Toutes les functions (1 fichier)
│   └── lib/                      # Build compilé
│
├── public/                       # Assets statiques
│   ├── cgv/                      # CGV 3 versions (txt + pdf)
│   ├── logos/                    # Logos paiement (Wave, Orange, MTN, etc.)
│   ├── sw.js                     # Service Worker (cache + FCM)
│   └── manifest.json, robots.txt, sitemap.xml
│
├── .github/workflows/test.yml    # CI (Node 24, lint→build→test)
├── scripts/generate_pdfs.js      # Script génération PDF CGV
│
└── BRAIN_QWEN/                   # Documentation projet (ce dossier)
```

---

## 🔑 Commandes clés

```bash
# Développement
npm run dev              # Serveur Vite local (HMR)
npm run build            # Build production
npm run preview          # Preview du build

# Tests
npm test                 # Tous les tests (vitest run)
npm run test:watch       # Mode watch
npm run test:coverage    # Couverture

# Qualité
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit

# Cloud Functions
cd functions && npm run build    # Compile TS → lib/
cd functions && npm run serve    # Build + emulators
```

---

## 📊 État d'avancement

```
Frontend : ██████████████████████████████  ~85%
  - 4 dashboards (admin, owner, notaire, tenant) ✅
  - Formulaire propriété 5 étapes ✅
  - Messagerie basique ✅
  - PWA + Service Worker ✅
  - SEO ✅

Backend (Firebase) : ████████████████████████████  ~90%
  - Auth (email/password, Google) ✅
  - Firestore 10+ collections ✅
  - Storage rules ✅
  - Cloud Functions (2+) ✅
  - FCM Push ✅

Tests : ██████████████████████████████░░  ~92%
  - 74 fichiers de test, 731 tests (221 ajoutés cette session) ✅
  - Coverage utils/services/hooks ✅
  - Tests Cloud Functions, services, dashboards owner/admin ✅
  - 8 échecs résiduels (composants complexes) ⚠️

CI/CD : ████████████████░░░░░░░░░░  ~60%
  - GitHub Actions (lint→build→test) ✅
  - Vercel deployment ✅
  - typecheck hors CI ❌
  - Pas de branche develop ❌
```

**Voir `DONE.md` pour le détail des items complétés.**
**Voir `NOT_DONE.md` pour le détail des items restants.**

---

## 🔴 Problèmes CRITIQUES à résoudre

1. ~~Auth téléphone désactivée~~ ✅ CONNU — Firebase SMS non supporté en CI (erreur 503)
2. ~~reCAPTCHA retiré~~ ✅ CONNU — Timeout sur connexions lentes
3. ~~`typecheck` hors CI~~ ✅ RÉSOLU — Ajouté dans `.github/workflows/test.yml`
4. ~~Cloud Functions monolithique~~ ✅ RÉSOLU — 6 fichiers modulaires dans `functions/src/`
5. ~~Pas de branche `develop`~~ ✅ RÉSOLU — Branch `develop` créée
6. ~~Version `0.0.0`~~ ✅ RÉSOLU — Passé à `1.0.0`

## ✅ Résolu dans la session tests massive (2026-04-10)

- **Tests Cloud Functions** — 101 tests pour les 6 modules (admin, chat, notaire, notifications, scheduler, firebase-admin)
- **Tests services manquants** — 58 tests pour 7 services (payment, movapay, ad, analytics, pushNotification, email, delegate)
- **Tests dashboard owner** — 75 tests pour 9 composants (VisitRequestsTab, StatsTab, VisitResponseModal, PropertyRow, PropertyStats, BoostModal, NotificationsTab, PropertyStatusModal, VisitDisclaimerModal)
- **Tests dashboard admin** — 34 tests pour 5 composants (AdminTabs, AdminStats, OverviewSection, AdminModals)
- **Tests chat** — 24 tests (ChatInput, MessageBubble)
- **Tests formulaires** — 18 tests pour 2 étapes (LocationStep, MediaStep)
- **Tests hooks** — 17 tests (useOwnerNotifications)
- **Fix tests pré-existantes** — 6 fichiers corrigés (PropertyFormBase, VisitsTab, InfoStep, CharacteristicsStep, NotificationsTab, VisitDisclaimerModal)
- **Fix CI GitHub Actions** — `package-lock.json` regénéré (dépendances optionnelles netbsd/arm64 retirées)
- **TypeScript** — `npm run typecheck` passe à **0 erreur**
- **Total : 78 fichiers de test, 778 tests, 100% passent**

---

## 🏗️ Modules Backend (Cloud Functions)

| Fonction | Statut | Fichier | Détails |
|---|---|---|---|
| autoResetPropertyStatus | ✅ | `scheduler.ts` | Cron : reset visites sans réponse après 3j |
| sendPushNotification | ✅ | `notifications.ts` | Trigger Firestore onCreate → FCM push |
| assignNotaireRole | ✅ | `notaire.ts` | Callable : valide code → rôle notaire |
| certifyProperty | ✅ | `notaire.ts` | Callable : notaire certifie/rejette bien |
| createAdmin | ✅ | `admin.ts` | Callable : admin crée nouveau compte admin |
| onNewChatMessage | ✅ | `chat.ts` | Trigger Firestore → notification chat |

---

## 📱 Dashboards Frontend

| Dashboard | Statut | Détails |
|---|---|---|
| Admin (11 onglets) | ✅ | Vue d'ensemble, users, biens, modération, notaires, signalements, enquêtes, CGV, pubs, sécurité, gestion admins |
| Propriétaire | ✅ | Biens, visites reçues, notifications, stats, formulaire 5 étapes |
| Notaire | ✅ | Biens à certifier, validation, stats |
| Locataire | ✅ | Recherche, favoris, visites, notifications, dossier |

---

## 🗄️ Collections Firestore (10+)

`users`, `properties`, `visits`, `notifications`, `reports`, `surveys`, `chats`, `messages`, `notaire_codes`, `admin_logs`, `property_availabilities`, `delegation_tokens`, `transactions`

**Sous-collections :** `users/{uid}/favorites/{propertyId}`, `users/{uid}/fcm_tokens/{token}`

---

## 📐 Règles métier (rappel)

| Règle | Valeur |
|---|---|
| Visite | 1000 FCFA |
| Délai réponse visite | 3 jours (auto-reset) |
| Modération admin | Checklist 10 critères |
| Rôles | locataire, proprietaire, notaire, admin |
| Types bien | appartement, maison, villa, terrain, hotel, appart_hotel |
| Transactions | location, vente, both |
| Statuts bien | draft, pending, published, rented, sold, rejected, failed |
| Statuts visite | pending, accepted, rejected, completed, counter_proposed |
| Prix CGV | 500 FCFA visite (locataire), 75 000 FCFA certification (notaire) |

---

## 🎨 Thème (rappel)

| Nom | Hex | Usage |
|---|---|---|
| Orange CI | `#FF6B00` | Couleur primaire (boutons, CTA) |
| Vert CI | `#009E49` | Couleur secondaire (validation, succès) |
| Gold | `#D4A017` | Accent (badges, premium) |
| **NE PAS utiliser** | `HColors.green`, `HColors.terracotta` | Anciennes couleurs — remplacer par `vertCI`/`orangeCI` |

---

## 🔌 Dépendances principales

### Production
| Package | Version | Usage |
|---|---|---|
| `react` + `react-dom` | `^18.3.1` | Core React |
| `firebase` | `^12.9.0` | Auth + Firestore + Storage + FCM |
| `react-router-dom` | `^7.13.2` | Routing |
| `zod` | `^4.3.6` | Validation |
| `leaflet` + `react-leaflet` | `^1.9.4` + `^4.2.1` | Cartes |
| `recharts` | `^3.7.0` | Graphiques |
| `lucide-react` | `^0.344.0` | Icônes |
| `react-helmet-async` | `^3.0.0` | SEO |
| `@sentry/react` | `^10.46.0` | Monitoring |

### Développement
| Package | Version | Usage |
|---|---|---|
| `vite` | `^5.4.2` | Bundler |
| `typescript` | `^5.5.3` | TypeScript |
| `vitest` | `^4.1.1` | Tests |
| `@testing-library/react` | `^16.3.2` | Tests React |
| `eslint` | `^9.9.1` | Linter |
| `tailwindcss` | `^3.4.1` | CSS |

---

## 🚧 Prochaines étapes recommandées

1. **Chat pièces jointes** — Envoi images/documents dans les conversations
2. **Notifications messages offline** — Push FCM quand message reçu et destinataire hors ligne
3. **Historique chat paginé** — Pagination + recherche dans l'historique
4. **Intégration paiement réelle** — Wave, Orange Money, MTN, Moov, Djamo (laissé de côté)
5. **Tests composants notaire** — ValidationSection, NotairePropertyCard, NotaireActionModals (mocks complexes)
6. **Tests d'intégration E2E** — Firebase Emulator Suite

---

## 📝 Conventions de code (rappel)

- **Commits** : `type(scope): description` (`feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `ci`)
- **TypeScript** : Mode strict, pas de `any` sauf catch blocks
- **React** : Composants fonctionnels uniquement, hooks dans `src/hooks/`
- **Styles** : Tokens `homeci-tokens.ts` exclusivement, pas de `HColors.green`/`terracotta`
- **Tests** : 1+ par composant/service, mocks Firebase globaux, coverage sur utils/services/hooks
- **Nommage** : PascalCase (composants), camelCase + use (hooks), kebab-case (routes), snake_case pluriel (Firestore)

---

## 📋 Fichiers de suivi

| Fichier | Usage |
|---|---|
| `PLAN.md` | Plan complet de l'application — architecture, écrans, DB, paliers |
| `DONE.md` | Tâches complétées — **mis à jour à chaque étape** |
| `NOT_DONE.md` | Tâches restantes — **mis à jour à chaque étape** |
| `WORKED_LESSON.md` | Leçons apprises & difficultés — **mis à jour à chaque session** |
| `MEMORY.md` | Ce fichier — contexte et résumé pour reprises de session |
| `PACKAGE.md` | Registre des dépendances — **mis à jour à chaque ajout/suppression** |

---

## 🔒 Notes sécurité

- **Auth téléphone désactivée** — Firebase SMS non supporté en CI
- **reCAPTCHA retiré** — Timeout sur connexions lentes
- **Portail admin 2 étapes** — Email/password + code dynamique 5 min
- **Session timeout** — 30 min admin, 120 min autres
- **Anti brute force** — Verrouillage après 5 échecs (15 min)
- **Règles Firestore** — 230+ lignes, vérification rôle par collection
- **Storage rules** — 7 paths avec size limits et MIME types
- **Headers Vercel** — X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, COOP

---

*Ce fichier doit être lu au début de chaque session pour reprendre le contexte rapidement.*
*Toujours mettre à jour `PLAN.md`, `DONE.md`, `NOT_DONE.md` et `WORKED_LESSON.md` après chaque tâche complétée.*
