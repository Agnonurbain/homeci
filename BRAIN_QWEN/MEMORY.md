# 🧠 MEMORY.md — Mémoire projet HOMECI

> **Dernière session :** 2026-04-13 (tests composants admin + notaire + UI — 1109 tests, 104 fichiers)
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

Tests : ████████████████████████████████░  ~98%
  - 104 fichiers de test, 1109 tests (100% passent) ✅
  - 0 échec résiduel, 0 erreur TypeScript

CI/CD : ██████████████████████████████░  ~95%
  - GitHub Actions fonctionnelle (lint→build→test→coverage) ✅
  - Vercel deployment ✅
  - typecheck dans CI ✅
  - Husky pre-commit hooks ✅
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

## ✅ Résolu dans la session chat paginé (2026-04-12)

- **Chat paginé** — `subscribeToMessages` limité à 30 messages/page (orderBy desc + limit)
- **`getMessagesBefore`** — Fonction dans chatService pour charger des messages plus anciens via `endBefore` + `limit`
- **`searchMessages`** — Recherche côté client dans les messages récents (filtrage client-side, limit maxResults)
- **`getLastMessage`** — Récupère le dernier message d'un chat (utile pour la pagination)
- **Hook `useChat` amélioré** — `loadMoreMessages` (prépend messages), `hasMore`, `loadingMore`, `searchResults`, `searchTerm`, `clearSearch`, `messagesContainerRef`
- **Auto-scroll intelligent** — Ne scroll vers le bas que si l'utilisateur est près du bottom (150px)
- **Scroll infini** — Détection du scroll vers le top (< 50px) déclenche `loadMoreMessages`
- **Bouton "Messages plus anciens"** — Visible en haut de la liste, avec état de chargement
- **Barre de recherche** — Toggle dans le header du chat, formulaire avec input + bouton OK + reset
- **Highlight des résultats** — `HighlightedText` dans MessageBubble avec `<mark>` jaune
- **Indicateur "Début de la conversation"** — Affiché quand plus de messages à charger
- **Déduplication** — Merge des messages réels avec le state existant via `id` unique
- **18 nouveaux tests** — 12 chatService (getMessagesBefore, searchMessages, getLastMessage, subscribeToMessages pageSize) + 13 useChat (loadMore, search, clearSearch)
- **843 tests totaux, 100% passent, typecheck clean**

- **Notifications FCM offline pour chat** — Détection en ligne/hors ligne avec `last_seen` (seuil 30s)
- **Cloud Function `onNewChatMessage` améliorée** — Vérifie `last_seen` du destinataire, détermine `isOnline`, envoie push direct si offline
- **Anti-doublons** — Flag `push_sent: true` dans notification Firestore, `sendPushNotification` vérifie et skip si déjà envoyé
- **Métadonnées notifications** — `delivery_mode` ('instant' vs 'push'), `recipient_online`, `chat_id`, `sender_id`, `sender_name`, `message_id`
- **Hook `usePresence`** — Met à jour `last_seen` toutes les 15s + sur activité utilisateur (mouse, keyboard, scroll, touch, visibilitychange)
- **Service worker amélioré** — Deep link vers chat `/dashboard?open_chat={chatId}`, fonction `buildNotificationUrl` par type
- **Préférences notifications** — Séparation `messages` vs `visits` dans `notification_prefs`
- **Notification interface** — Champs `chat_id`, `sender_id`, `sender_name`, `attachment_type`, `delivery_mode`, `push_sent`
- **19 nouveaux tests** — 7 usePresence + 12 cloud functions
- **825 tests totaux, 100% passent, 0 erreur TypeScript**

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

1. **Tests composants admin** — Couverture des 11 onglets
2. **Tests dashboard notaire** — Re-créer les mocks
3. **Augmenter coverage** — Étendre aux composants UI

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
