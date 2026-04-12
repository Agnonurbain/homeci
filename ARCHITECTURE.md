# HOMECI — Architecture Technique

> Document de référence pour tout développeur (humain ou IA) intervenant sur le projet.
> Dernière mise à jour : 2026-04-12

## Vue d'ensemble

HOMECI est une plateforme immobilière B2C pour la Côte d'Ivoire. Les biens sont vérifiés et certifiés par des notaires agréés avant publication. L'application est une SPA (Single Page Application) avec authentification Firebase, stockage Firestore, et Cloud Functions pour la logique serveur.

```
┌─────────────────────────────────────────────────────┐
│                    VERCEL (CDN)                      │
│  React 18 + Vite 5 + Tailwind + React Router DOM    │
│  PWA (Service Worker) + Sentry + SEO (Helmet)       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Firebase │  │ Firestore│  │ Storage  │          │
│  │   Auth   │  │ Database │  │ (images, │          │
│  │(Email/   │  │ (15+coll.)│  │  docs)   │          │
│  │ Google)  │  │          │  │          │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │              │              │                │
│  ┌────┴──────────────┴──────────────┴────┐          │
│  │    Cloud Functions v2 (Node 20)       │          │
│  │    europe-west1 — 7 fonctions         │          │
│  └───────────────────────────────────────┘          │
│                                                     │
│  ┌──────────────────────────────────────────┐       │
│  │  FCM Push Notifications + Analytics      │       │
│  │  + Audit Logs + Auto-Moderation          │       │
│  └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

## Flux de données principaux

### 1. Publication d'un bien
```
Propriétaire → PropertyForm (5 étapes)
  → Upload images → Firebase Storage /properties/{id}/
  → Upload documents → Firebase Storage /documents/{id}/
  → Upload identité → Firebase Storage /identity/{userId}/
  → Firestore /properties/{id} (status: 'pending')
  → Notification admin (modération)
  → Admin vérifie checklist (10 critères)
  → Si OK → status: 'published'
  → Notaire prend en charge → vérifie → certifie
  → Badge "Vérifié Notaire" accordé
```

### 2. Flux de visite
```
Locataire → Demande visite + paiement (1000 FCFA)
  → Firestore /visits/{id} (status: 'pending')
  → Notification propriétaire
  → Propriétaire accepte/refuse/contre-propose
  → Si accepté → Bien bloqué (en cours de transaction)
  → Visite effectuée → Enquête satisfaction
  → Propriétaire choisit : Loué / Vendu / Non abouti
  → Si pas de réponse 3j → Cloud Function auto-reset
```

### 3. Certification notaire
```
Notaire → Prend en charge un bien (pending → en cours)
  → Conflit d'intérêts vérifié (owner != notaire)
  → Vérifie titre foncier → approuve/refuse
  → Vérifie documents identité → approuve/refuse
  → Si tout validé → Certifie le bien
  → Badge "Vérifié Notaire" + notification propriétaire
  → Peut décertifier avec motif → notification locataires
```

## Schéma Firestore

### users/{uid}
```typescript
{
  id: string;                    // Firebase UID
  email: string;
  full_name: string;
  phone: string | null;
  role: 'locataire' | 'proprietaire' | 'admin' | 'notaire';
  avatar_url: string | null;
  company_name: string | null;
  verified: boolean;
  suspended?: boolean;           // Admin peut suspendre
  suspension_reason?: string;
  cgv_accepted?: boolean;
  cgv_accepted_at?: string;
  cgv_notaire_accepted?: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
// Sous-collections :
//   favorites/{propertyId} → { added_at }
//   fcm_tokens/{token}     → { token, platform, created_at }
```

### properties/{id}
```typescript
{
  id: string;
  owner_id: string;              // → users/{uid}
  title: string;
  description: string;
  property_type: 'appartement' | 'maison' | 'villa' | 'terrain' | 'hotel' | 'appart_hotel';
  transaction_type: 'location' | 'vente' | 'both';
  price: number;                 // En FCFA
  city: string;
  commune: string | null;
  quartier: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  bathrooms: number;
  surface_area: number | null;   // m²
  images: string[];              // URLs Firebase Storage
  documents: PropertyDocument[]; // Titre foncier, permis, etc.
  status: 'draft' | 'pending' | 'published' | 'rented' | 'sold' | 'rejected' | 'failed';
  verified_notaire: boolean;
  notaire_id: string | null;     // UID du notaire certifiant
  views_count: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### visits/{id}
```typescript
{
  id: string;
  property_id: string;
  owner_id: string;
  tenant_id: string;
  tenant_name: string;
  preferred_date: string;
  preferred_time: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'counter_proposed';
  counter_date?: string;
  counter_time?: string;
  owner_notes: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### notifications/{id}
```typescript
{
  user_id: string;               // Destinataire
  type: 'visit_request' | 'visit_accepted' | 'visit_rejected' | 'notaire_approved' | 'notaire_rejected' | 'new_message' | 'auto_moderation';
  title: string;
  message: string;
  property_id?: string;
  chat_id?: string;              // Pour les notifications de chat
  sender_id?: string;            // Pour les messages
  read: boolean;
  created_at: Timestamp;
}
// → Trigger Cloud Function sendPushNotification
```

### reports/{id}
```typescript
{
  property_id: string;
  property_title: string;
  reporter_id: string;
  reporter_role: string;
  reason: 'fraudulent' | 'misleading' | 'inappropriate' | 'duplicate' | 'other';
  details: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: Timestamp;
}
```

### surveys/{id}
```typescript
{
  user_id: string;
  user_role: string;
  rating: number;                // 1-5
  comment: string;
  trigger: 'visit_accepted' | 'visit_completed' | 'property_rented' | 'property_sold';
  property_id?: string;
  property_title?: string;
  created_at: Timestamp;
}
```

### chats/{chatId}
```typescript
{
  id: string;
  property_id: string;
  tenant_id: string;
  owner_id: string;
  visit_id: string;
  updated_at: Timestamp;
  // Sous-collection :
  // messages/{msgId} → { chat_id, sender_id, content, attachment_url?, attachment_type?, attachment_name?, created_at, read }
}
```

### admin_logs/{id}
```typescript
{
  id: string;
  action: string;                  // 'admin_login', 'user_suspended', 'property_approved', etc.
  performed_by: string;            // UID de l'admin
  performed_by_email?: string;
  target_uid?: string;             // Utilisateur visé
  property_id?: string;            // Bien visé
  report_id?: string;              // Signalement visé
  reason?: string;                 // Motif de l'action
  details?: Record<string, any>;   // Métadonnées supplémentaires
  created_at: Timestamp;
}
```

### boosts/{id}
```typescript
{
  id: string;
  property_id: string;
  property_title: string;
  owner_id: string;
  duration: number;                // 7, 14, ou 30 jours
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
  amount_paid: number;             // En FCFA
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### ad_banners/{id}
```typescript
{
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  advertiser_name: string;
  status: 'active' | 'paused' | 'expired';
  start_date: string;
  end_date: string;
  amount_paid: number;
  impressions: number;
  clicks: number;
  target_city?: string;
  target_transaction_type?: string;
  target_property_type?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### notaire_codes/{codeId}
```typescript
{
  code: string;                    // Code alphanumérique à 10 caractères
  used: boolean;
  created_at: Timestamp;
  used_at?: Timestamp;
  used_by?: string;                // UID du notaire
}
```

## Cloud Functions (7 fonctions)

| Fonction | Type | Région | Description |
|----------|------|--------|-------------|
| `autoResetPropertyStatus` | Scheduler (quotidien) | europe-west1 | Reset visites sans réponse après 3 jours |
| `sendPushNotification` | Firestore onCreate | europe-west1 | Envoi push FCM quand notification créée |
| `assignNotaireRole` | Callable | europe-west1 | Code invitation → rôle notaire |
| `certifyProperty` | Callable | europe-west1 | Certification/rejet par notaire |
| `createAdmin` | Callable | europe-west1 | Création compte admin |
| `onNewChatMessage` | Firestore onCreate | europe-west1 | Notification chat + détection online/offline |
| `onReportCreated` | Firestore onCreate | europe-west1 | Auto-modération (keywords, spam, doublons Levenshtein) |

## Sécurité — Règles Firestore

### Principes
- `isAuth()` : `request.auth != null`
- `isOwner(uid)` : `request.auth.uid == uid`
- `isAdmin()` : vérifie `role == 'admin'` dans `/users/{uid}`
- `isNotaire()` : vérifie `role == 'notaire'` dans `/users/{uid}`

### Points critiques
- `/identity/{userId}/` (Storage) : lecture **uniquement** par le propriétaire du fichier
- `/notaire_codes/` : seule la transition `used: false → true` est autorisée
- `/reports/` : update autorisé uniquement pour admin
- `/fcm_tokens/` : écriture autorisée uniquement par le propriétaire du token

## Performances

| Métrique | Cible | Actuel | Technique |
|----------|-------|--------|-----------|
| FCP | < 2.5s | ~1.8s | Lazy loading routes, skeletons |
| LCP | < 4s | ~2.2s | Logo optimisé, cache Vercel |
| Bundle initial | < 350KB gzip | 335KB | Code splitting 9 chunks (firebase, recharts, leaflet, sentry, zod, router, lucide, reactCore, firebaseMessaging) |
| Images | < 200KB chacune | ~150KB | Compression JPEG avant upload |
| Offline | Page d'accueil | ✅ | Service Worker cache-first |
| Tests | 100% passent | 999/1000 | Husky pre-commit (lint → typecheck → test) |

### Chunking Vite

| Chunk | Taille (minifié) | gzip |
|---|---|---|
| `index` | 1,284KB | 340KB |
| `firebase` | 521KB | 122KB |
| `recharts` | 408KB | 120KB |
| `leaflet` | 154KB | 45KB |
| `sentry` | 263KB | 86KB |
| `router` | 352KB | 109KB |
| `zod` | 58KB | 16KB |
| `lucide` | 45KB | 8KB |

## Conventions de nommage

| Type | Convention | Exemple |
|------|-----------|---------|
| Composant | PascalCase | `PropertyCard.tsx` |
| Hook | camelCase + use | `useOwnerVisits.ts` |
| Service | camelCase + Service | `visitService.ts` |
| Type/Interface | PascalCase | `Property`, `VisitRequest` |
| Fichier test | `*.test.ts(x)` | `AuthModal.test.tsx` |
| Constante | UPPER_SNAKE | `REASON_LABELS` |
| Route | kebab-case | `/portail-securise` |
| Collection Firestore | snake_case pluriel | `notaire_codes` |

## Journal des décisions architecturales

| Date | Décision | Motif |
|------|----------|-------|
| Mars 2026 | Auth téléphone désactivée | Firebase SMS non supporté en CI (erreur 503) |
| Mars 2026 | reCAPTCHA retiré | Timeout sur connexions lentes |
| Mars 2026 | Palette CI (orange/vert/or) | Couleurs du drapeau ivoirien |
| Mars 2026 | Lazy loading 5 dashboards | Réduction bundle initial ~40% |
| Mars 2026 | Cloud Function auto-reset | Propriétaire a 3j pour mettre à jour après visite |
| Mars 2026 | FCM via Cloud Function | Push déclenché par Firestore onCreate |
| Mars 2026 | Modération admin avec checklist 10 critères | Empêcher approbation arbitraire |
| Avr 2026 | Chat paginé (30 msg/page) | Performance pour longues conversations |
| Avr 2026 | `npm install` au lieu de `npm ci` en CI | Bug npm 10.8.x sur Node 24 |
| Avr 2026 | Cloud Function auto-modération | Détection spam/doublons avec Levenshtein |
| Avr 2026 | 2FA TOTP pour admin | Sécurité renforcée (otplib v13) |
| Avr 2026 | Audit logs Firestore | Traçabilité complète des actions admin |
| Avr 2026 | Rate limiting client-side | Prévention spam (visites, messages, login) |
| Avr 2026 | Husky pre-commit hooks | lint → typecheck → test automatique |
| Avr 2026 | 9 chunks manuels Vite | Optimisation bundle (335KB gzip index) |
