# HOMECI — Architecture Technique

> Document de référence pour tout développeur (humain ou IA) intervenant sur le projet.
> Dernière mise à jour : Avril 2026

## Vue d'ensemble

HOMECI est une plateforme immobilière B2C pour la Côte d'Ivoire. Les biens sont vérifiés et certifiés par des notaires agréés avant publication. L'application est une SPA (Single Page Application) avec authentification Firebase, stockage Firestore, et Cloud Functions pour la logique serveur.

```
┌─────────────────────────────────────────────────────┐
│                    VERCEL (CDN)                      │
│  React 18 + Vite 5 + Tailwind + React Router DOM    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Firebase │  │ Firestore│  │ Storage  │          │
│  │   Auth   │  │ Database │  │ (images, │          │
│  │(Email/   │  │ (7 coll.)│  │  docs)   │          │
│  │ Google)  │  │          │  │          │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │              │              │                │
│  ┌────┴──────────────┴──────────────┴────┐          │
│  │    Cloud Functions v2 (Node 20)       │          │
│  │    europe-west1 — 6 fonctions         │          │
│  └───────────────────────────────────────┘          │
│                                                     │
│  ┌──────────────────────────────────────────┐       │
│  │  FCM Push Notifications + Analytics      │       │
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
  type: 'visit_request' | 'visit_accepted' | 'visit_rejected' | 'notaire_approved' | 'notaire_rejected' | 'new_message';
  title: string;
  message: string;
  property_id?: string;
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

| Métrique | Cible | Technique |
|----------|-------|-----------|
| FCP | < 2.5s | Lazy loading routes, skeletons |
| LCP | < 4s | Logo optimisé 76KB, cache Vercel |
| Bundle initial | < 350KB gzip | Code splitting 5 dashboards |
| Images | < 200KB chacune | Compression avant upload |
| Offline | Page d'accueil | Service Worker cache-first |

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
