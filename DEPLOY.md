# 🚀 Guide de Déploiement HOMECI

> Guide étape par étape pour déployer HOMECI en production.

---

## 📋 Prérequis

- Compte [Vercel](https://vercel.com) lié au repo GitHub `Agnonurbain/homeci`
- Compte [Firebase](https://console.firebase.google.com) avec le projet `homeci-prod-72e4b`
- Firebase CLI installé : `npm install -g firebase-tools`
- Node.js 24+
- Accès au repo GitHub

---

## 1. Déploiement Frontend (Vercel)

Le frontend se déploie **automatiquement** à chaque push sur `main`.

### Configuration Vercel

1. Aller sur [vercel.com](https://vercel.com) → Import Git Repository → `homeci`
2. Framework Preset : **Vite**
3. Build Command : `npm run build`
4. Output Directory : `dist`
5. Variables d'environnement à configurer :

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Clé API Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine d'auth Firebase |
| `VITE_FIREBASE_PROJECT_ID` | `homeci-prod-72e4b` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID FCM |
| `VITE_FIREBASE_APP_ID` | App ID Firebase |
| `SENTRY_DSN` | DSN Sentry pour le monitoring |

### Déploiement manuel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### Vérifier le déploiement

1. Aller sur `https://homeci.ci` (ou l'URL Vercel assignée)
2. Vérifier que la page d'accueil charge correctement
3. Tester la connexion (email/password ou Google)

---

## 2. Déploiement Cloud Functions (Firebase)

### Prérequis

```bash
# Se connecter à Firebase
firebase login

# Vérifier le projet
firebase use homeci-prod-72e4b
```

### Déployer

```bash
# 1. Compiler TypeScript
cd functions && npm run build

# 2. Déployer les fonctions uniquement
firebase deploy --only functions

# Ou déployer tout (functions + rules + indexes)
firebase deploy
```

### Vérifier les Cloud Functions

Aller sur [Firebase Console](https://console.firebase.google.com) → Functions → Vérifier que :
- `autoResetPropertyStatus` (scheduler) est actif
- `sendPushNotification` (firestore trigger) est actif
- `assignNotaireRole` (callable) est actif
- `certifyProperty` (callable) est actif
- `createAdmin` (callable) est actif
- `onNewChatMessage` (firestore trigger) est actif
- `onReportCreated` (firestore trigger) est actif — auto-modération
- `cleanupOrphanedFiles` (scheduler) est actif — nettoyage fichiers orphelins
- `aggregateDailyStats` (scheduler) est actif — agrégation stats quotidiennes

---

## 3. Déploiement des Règles Firestore

```bash
# Vérifier que firestore.rules est à jour
cat firestore.rules

# Déployer
firebase deploy --only firestore:rules
```

### Règles critiques à vérifier

- `/users/{uid}` — lecture : authentifié + owner ; écriture : owner uniquement
- `/properties/{propertyId}` — lecture publique ; écriture : owner + admin
- `/visits/{visitId}` — lecture : participants ; écriture : tenant
- `/notifications/{notifId}` — lecture : owner uniquement
- `/notaire_codes/{codeId}` — lecture publique ; écriture : admin uniquement

---

## 4. Déploiement des Règles Storage

```bash
# Vérifier que storage.rules est à jour
cat storage.rules

# Déployer
firebase deploy --only storage
```

### Paths critiques

| Path | Accès | Limite |
|---|---|---|
| `/images/**` | Lecture publique, écriture authentifié | 5 MB |
| `/documents/{propertyId}/**` | Owner/Notaire/Admin | 10 MB |
| `/identity/{userId}/**` | Propriétaire uniquement | 5 MB |
| `/avatars/{userId}/**` | Lecture publique, écriture owner | 2 MB |
| `/videos/**` | Lecture publique, écriture authentifié | 100 MB |

---

## 5. Déploiement des Index Firestore

```bash
# Vérifier les index
cat firestore.indexes.json

# Déployer
firebase deploy --only firestore:indexes
```

---

## 6. Monitoring (Sentry)

### Configuration

1. Aller sur [sentry.io](https://sentry.io) → Projet HOMECI
2. Copier le DSN → Variable d'environnement `SENTRY_DSN` sur Vercel
3. Vérifier dans le code que `@sentry/react` est bien initialisé dans `main.tsx`

### Vérifier le monitoring

1. Provoquer une erreur volontaire : ouvrir la console du navigateur → `throw new Error('test')`
2. Vérifier que l'erreur apparaît dans Sentry Dashboard

---

## 7. Checklist post-déploiement

### Frontend
- [ ] Page d'accueil charge correctement
- [ ] Auth email/password fonctionne
- [ ] Auth Google fonctionne
- [ ] Dashboard locataire s'affiche
- [ ] Dashboard propriétaire s'affiche
- [ ] Dashboard notaire s'affiche
- [ ] Dashboard admin s'affiche (`/portail-securise`)
- [ ] Création d'un bien fonctionne (formulaire 5 étapes)
- [ ] Upload d'images fonctionne
- [ ] Demande de visite fonctionne
- [ ] Chat fonctionne (pagination + recherche)
- [ ] Push notifications FCM fonctionnent
- [ ] Auto-reset des visites après 3 jours fonctionne
- [ ] Sentry reçoit les erreurs
- [ ] Service Worker fonctionne (PWA offline)

### Sécurité
- [ ] 2FA admin fonctionne (setup + vérification TOTP)
- [ ] Restriction IP admin fonctionne (variable `ADMIN_ALLOWED_IPS`)
- [ ] Journal d'audit admin enregistre les actions
- [ ] Rate limiting fonctionne (visites, login, messages)
- [ ] Auto-modération détecte spam/doublons
- [ ] Scan fichiers uploads fonctionne (magic bytes, MIME, patterns suspects)
- [ ] Husky pre-commit hooks fonctionnent (lint → typecheck → test)

### Performance
- [ ] Bundle index < 350KB gzip (vérifier `npm run build:analyze`)
- [ ] Images compressées avant upload
- [ ] Lazy loading routes fonctionnel

---

## 8. Rollback (en cas de problème)

### Frontend (Vercel)

1. Aller sur Vercel Dashboard → Deployments
2. Cliquer sur le déploiement précédent → **Promote to Production**

### Cloud Functions (Firebase)

```bash
# Re-déployer la version précédente
git revert HEAD
firebase deploy --only functions
```

### Règles Firestore/Storage

```bash
# Revenir au commit précédent des règles
git checkout HEAD~1 -- firestore.rules
firebase deploy --only firestore:rules
```

---

## 9. Environnement de développement local

```bash
# Cloner le repo
git clone https://github.com/Agnonurbain/homeci.git
cd homeci

# Installer les dépendances (Node 24+ requis — voir .nvmrc)
npm install

# Démarrer le serveur de dev
npm run dev

# Lancer les tests
npm test

# Vérifier le typecheck
npm run typecheck

# Linter
npm run lint

# Analyser le bundle
npm run build:analyze
# → Ouvrir dist/stats.html dans le navigateur

# Exécuter les hooks pre-commit manuellement
npx husky
```

### Versions recommandées

| Outil | Version |
|---|---|
| Node.js | 24+ |
| npm | 10.8+ |
| Firebase CLI | 13+ |

### Problèmes connus

| Problème | Solution |
|---|---|
| `npm ci` échoue sur CI | Utiliser `npm install` à la place (bug npm 10.8.x sur Node 24) |
| Tests Firebase non mockés | Vérifier `src/tests/setup.ts` — tout Firebase est mocké globalement |
| Husky pre-commit échoue | Vérifier Node 24 actif (`nvm alias default 24`) et que `lint`, `typecheck` et `test` passent |
| Lighthouse CI échoue | Workflow non-bloquant (`continue-on-error: true`), lancement manuel possible |

### Nouvelles fonctionnalités récentes

| Fonctionnalité | Variables d'env requises |
|---|---|
| Restriction IP admin | `ADMIN_ALLOWED_IPS` (ex: `41.210.5.10,192.168.1.0/24`) |
| Analytics admin | Aucune (données Firestore) |
| Export CSV admin | Aucune |
| Comparaison de biens | Aucune (localStorage) |
| Autocomplétion adresse | Aucune (données locales `coteIvoireGeo.ts`) |

---

*Dernière mise à jour : 2026-04-19 — 10 modules Cloud Functions (+ pushHelper), Node 24 (.nvmrc), Lighthouse CI*
