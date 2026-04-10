# 📋 PLAN — HOMECI: Plateforme Immobilière Certifiée Côte d'Ivoire

> **Vision** : Un marketplace immobilier de confiance en Côte d'Ivoire — biens vérifiés par des notaires agréés, visites à 1000 FCFA, certification notariale.
> **Dernière mise à jour** : 2026-04-09 — Projet à ~82%

---

## 🏗️ Architecture Finale

```
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL (CDN + Hosting)                      │
│  React 18 + TypeScript + Vite 5 + Tailwind 3 + React Router v7 │
│  PWA (Service Worker) + Sentry + react-helmet-async (SEO)      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           │ SPA Routes → /index.html
┌──────────────────────────┴───────────────────────────────────────┐
│                       FIREBASE                                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐│
│  │   Auth   │  │  Firestore   │  │  Storage │  │     FCM      ││
│  │(Email/   │  │  (10+ coll.) │  │(images,  │  │  Push Notif  ││
│  │ Google)  │  │              │  │  docs)   │  │              ││
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └──────┬───────┘│
│       │                │               │                │        │
│  ┌────┴────────────────┴───────────────┴────────────────┴──────┐│
│  │            Cloud Functions v2 (Node 20)                      ││
│  │  europe-west1 — sendPushNotification, autoResetVisits, ...  ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

---

## 📱 Structure de l'Application Frontend

### Routes principales (App.tsx)

| Route | Description | Accès |
|---|---|---|
| `/` | Page publique (Hero + PropertyList + Features) | Public → redirect si connecté |
| `/bien/:id` | Détail d'un bien | Public (connecté ou non) |
| `/dashboard/*` | Dashboard par rôle | Connecté uniquement |
| `/portail-securise` | Portail admin sécurisé | Admin uniquement |
| `/faq` | FAQ | Public |
| `/cgv` | Conditions Générales de Vente | Public |
| `/tutoriel` | Tutoriel d'utilisation | Public |

### 1. Page Publique ✅

| Composant | Description | Statut |
|---|---|---|
| **Hero** | Titre, sous-titre, CTA, illustration | ✅ Fait |
| **PublicPropertyList** | Liste des biens publics | ✅ Fait |
| **PropertyCard** | Carte bien (image, titre, prix, localisation, badges) | ✅ Fait |
| **PropertyFilters** | Filtres (type, transaction, prix, localisation) | ✅ Fait |
| **Features** | Section fonctionnalités | ✅ Fait |
| **AdBanner** | Bannière publicitaire | ✅ Fait |
| **Header** | Navigation, logo, auth buttons | ✅ Fait |
| **Footer** | Liens légaux, copyright | ✅ Fait |

### 2. Authentification ✅

| Composant | Description | Statut |
|---|---|---|
| **AuthModal** | Modal connexion/inscription (email/password, Google) | ✅ Fait |
| **RoleSelectModal** | Sélection rôle (locataire/propriétaire) | ✅ Fait |
| **AuthContext** | Seul React Context — user, profile, loading, signIn, signUp | ✅ Fait |

### 3. Dashboard Admin (11 onglets) ✅

| Onglet | Description | Statut |
|---|---|---|
| **Vue d'ensemble** | KPIs : users, biens, visites, modération | ✅ Fait |
| **Utilisateurs** | Recherche et gestion des utilisateurs | ✅ Fait |
| **Biens immobiliers** | Vue d'ensemble des propriétés | ✅ Fait |
| **Modération** | Checklist 10 critères, approuver/rejeter | ✅ Fait |
| **Notaires** | Gestion des notaires (codes d'invitation) | ✅ Fait |
| **Visites** | Gestion des demandes de visites | ✅ Fait |
| **Signalements** | Signalements de biens frauduleux | ✅ Fait |
| **Enquêtes** | Résultats enquêtes de satisfaction | ✅ Fait |
| **CGV** | Gestion des conditions générales | ✅ Fait |
| **Publicités** | Gestion des bannières publicitaires | ✅ Fait |
| **Sécurité** | Historique connexions, gestion admins | ✅ Fait |

**Composants admin clés :**
| Composant | Statut |
|---|---|
| AdminLogin (email/password) | ✅ |
| AdminAccessCode (code dynamique 5 min) | ✅ |
| AdminSessionManager (timeout 30 min) | ✅ |
| AdminStats, AdminTabs, AdminSections | ✅ |
| AdminManagement (gestion comptes admins) | ✅ |
| AdminLoginHistory (50 dernières tentatives) | ✅ |

### 4. Dashboard Propriétaire ✅

| Composant | Description | Statut |
|---|---|---|
| **OwnerAgentDashboard** | Dashboard principal | ✅ Fait |
| **PropertiesTab** | Liste des biens avec statuts | ✅ Fait |
| **VisitRequestsTab** | Demandes de visites reçues | ✅ Fait |
| **NotificationsTab** | Notifications | ✅ Fait |
| **StatsTab** | Statistiques (vues, visites) | ✅ Fait |

#### Formulaire propriété (5 étapes)

| Étape | Composant | Champs | Statut |
|---|---|---|---|
| 1 | **InfoStep** | Type, transaction, titre, description | ✅ |
| 2 | **LocationStep** | Ville, commune, quartier, GPS | ✅ |
| 3 | **CharacteristicsStep** | Chambres, SDB, surface, prix | ✅ |
| 4 | **MediaStep** | Images, vidéo, modèle 3D | ✅ |
| 5 | **DocumentsStep** | Titre foncier, permis, etc. | ✅ |

**Autres composants propriétaire :**
| Composant | Statut |
|---|---|
| PropertyFormBase | ✅ |
| EditPropertyForm | ✅ |
| PropertyRow, PropertyStats | ✅ |
| PropertyStatusModal | ✅ |
| VisitResponseModal (accepter/refuser/contre-proposer) | ✅ |
| VisitDisclaimerModal | ✅ |
| AvailabilityManager | ✅ |
| DossierViewerModal | ✅ |
| BoostModal | ✅ |

### 5. Dashboard Locataire ✅

| Composant | Description | Statut |
|---|---|---|
| **TenantDashboard** | Dashboard principal | ✅ Fait |
| **SearchTab** | Recherche de biens avec filtres | ✅ Fait |
| **FavoritesTab** | Biens favoris | ✅ Fait |
| **VisitsTab** | Historique des visites | ✅ Fait |
| **NotificationsTab** | Notifications | ✅ Fait |

**Autres composants locataire :**
| Composant | Statut |
|---|---|
| VisitRequestModal (demande + paiement 1000 FCFA) | ✅ |
| TenantDossier (documents locataire) | ✅ |
| SatisfactionModal (enquête post-visite) | ✅ |
| CGVLocataireModal | ✅ |

### 6. Dashboard Notaire ✅

| Composant | Description | Statut |
|---|---|---|
| **NotaireDashboard** | Dashboard principal | ✅ Fait |
| **NotaireTabs** | Navigation entre onglets | ✅ Fait |
| **NotaireStats** | Statistiques notaire | ✅ Fait |
| **NotairePropertyCard** | Carte bien pour notaire | ✅ Fait |
| **ValidationSection** | Validation/certification de biens | ✅ Fait |
| **NotaireActionModals** | Approuver/refuser/certifier | ✅ Fait |

### 7. Messagerie ✅ (basique)

| Composant | Description | Statut |
|---|---|---|
| **ChatBox** | Composant chat complet | ✅ Fait |
| **ChatInput** | Input de saisie message | ✅ Fait |
| **MessageBubble** | Bulle de message individuelle | ✅ Fait |

### 8. Composants Transverses

| Composant | Description | Statut |
|---|---|---|
| **PropertyViewModal** | Prévisualisation rapide d'un bien | ✅ |
| **OptimizedImage** | Image avec lazy loading + placeholder | ✅ |
| **OptimizedVideoPlayer** | Lecteur vidéo optimisé | ✅ |
| **Skeletons** | Loading states | ✅ |
| **SEO** | Meta tags dynamiques (react-helmet-async) | ✅ |
| **ErrorBoundary** | Catch erreurs React | ✅ |
| **NotFoundPage** | Page 404 | ✅ |
| **Toast** | Notifications toast | ✅ |
| **CGVModal, CGVNotaireModal** | Modals CGV par rôle | ✅ |
| **PrivacyPolicyModal** | Politique de confidentialité | ✅ |
| **LocationPicker** | Sélection localisation avec carte Leaflet | ✅ |
| **MapDisplay** | Affichage carte Leaflet | ✅ |
| **KenteLine** | Élément décoratif kente | ✅ |
| **HomeCIEmblem** | Logo/emblème HOMECI | ✅ |
| **ScrollTimePicker** | Sélecteur d'heure par scroll | ✅ |

---

## 🔧 Cloud Functions

### Actuelles

| Fonction | Trigger | Description | Statut |
|---|---|---|---|
| **sendPushNotification** | Firestore onCreate `/notifications/{id}` | Envoie push FCM au destinataire | ✅ Fait |
| **autoResetVisits** | Scheduler (quotidien) | Reset les visites sans réponse après 3 jours | ✅ Fait |

### À implémenter

| Fonction | Description | Priorité |
|---|---|---|
| **Modération auto** | Détection automatique de contenu suspect | 🟡 Moyenne |
| **Nettoyage Storage** | Cron pour supprimer fichiers orphelins | 🟢 Basse |
| **Statistiques agrégées** | Agrégation quotidienne des stats | 🟢 Basse |

---

## 🗄️ Schéma de Base de Données — Firestore

### Collections principales

```
users/{uid}
  id, email, full_name, phone, role, avatar_url, company_name
  verified, suspended, suspension_reason
  cgv_accepted, cgv_accepted_at, cgv_notaire_accepted
  created_at, updated_at
  ├─ favorites/{propertyId} → { added_at }
  └─ fcm_tokens/{token}     → { token, platform, created_at }

properties/{id}
  id, owner_id, title, description
  property_type (appartement|maison|villa|terrain|hotel|appart_hotel)
  transaction_type (location|vente|both)
  price (FCFA), city, commune, quartier, latitude, longitude
  bedrooms, bathrooms, surface_area
  images[], documents[], status (8 statuts)
  verified_notaire, notaire_id, views_count
  created_at, updated_at

visits/{id}
  id, property_id, owner_id, tenant_id, tenant_name
  preferred_date, preferred_time
  status (pending|accepted|rejected|completed|counter_proposed)
  counter_date, counter_time, owner_notes
  created_at, updated_at

notifications/{id}
  user_id, type (6 types), title, message, property_id, read
  created_at
  → Trigger: sendPushNotification Cloud Function

reports/{id}
  property_id, property_title, reporter_id, reporter_role
  reason (5 types), details, status (3 statuts)
  created_at

surveys/{id}
  user_id, user_role, rating (1-5), comment
  trigger (4 types), property_id, property_title
  created_at

chats/{chatId}
  participants[], property_id, created_at
  └─ messages/{msgId}
       sender_id, content, type, timestamp, read

notaire_codes/{code}
  code, used (bool), created_at

admin_logs/{id}
  action, user_id, details, timestamp

property_availabilities/{id}
  owner_id, date_ranges[], created_at

delegation_tokens/{id}
  notaire_id, token, property_id, expires_at

transactions/{id}
  user_id, amount, type, status, payment_method, reference
  created_at
```

---

## 🌍 Infrastructure & Déploiement

### Environnements

| Env | Usage |
|---|---|
| **Local** | `npm run dev` (Vite HMR), Firebase Emulators |
| **Production** | Vercel (frontend) + Firebase (backend) |

### CI/CD

| Workflow | Fichier | Déclencheur | Actions |
|---|---|---|---|
| **Test** | `.github/workflows/test.yml` | Push/PR main | Node 24, lint → build → test → coverage |

### Production Stack

| Service | Config |
|---|---|
| **Vercel** | SPA rewrites, immutable cache assets, headers sécurité |
| **Firebase Auth** | Email/password + Google |
| **Firestore** | 10+ collections, 230+ lignes de règles, 7 index |
| **Storage** | 7 paths avec size limits et MIME types |
| **Cloud Functions** | v2, europe-west1, nodejs20 |
| **FCM** | Push notifications via Cloud Function |
| **Sentry** | Error tracking + performance monitoring |

---

## 📊 Paliers de Développement

### Palier 1 — MVP (Biens + Visites + Modération) — ✅ ~95%

- ✅ Authentification (email/password, Google)
- ✅ 4 dashboards (admin, owner, notaire, tenant)
- ✅ Formulaire propriété 5 étapes
- ✅ Modération admin avec checklist 10 critères
- ✅ Certification notaire
- ✅ Demandes de visites (1000 FCFA)
- ✅ Auto-reset après 3 jours (Cloud Function)
- ✅ Notifications FCM
- ✅ Service Worker PWA
- ⚠️ Paiement Mobile Money réel à finaliser

### Palier 2 — Messagerie + Analytics + Performance — 🟡 ~60%

- ✅ Messagerie basique (ChatBox, ChatInput, MessageBubble)
- ❌ Chat temps réel complet (WebSocket/Firestore real-time)
- ❌ Pièces jointes dans chat
- ✅ Enquêtes de satisfaction
- ✅ Statistiques propriétaires
- ❌ Analytics avancé admin (graphiques Recharts)
- ✅ Code splitting (recharts, leaflet)
- ❌ Bundle size monitoring CI
- ⚠️ Tests dashboard owner à améliorer

### Palier 3 — Avancé — 🟡 ~30%

- ❌ Modèles 3D pour les biens
- ❌ Vidéo complète (upload, preview, streaming)
- ❌ Comparaison de biens
- ❌ Authentification 2FA admin
- ❌ Export données (CSV/Excel)
- ❌ Support autres villes CI (au-delà d'Abidjan)
- ❌ Autocomplétion adresses
- ❌ Scan antivirus uploads

---

## 🎨 Charte Graphique

### Couleurs principales (drapeau ivoirien)
| Nom | Hex | Usage |
|---|---|---|
| Orange CI | `#FF6B00` | Couleur primaire (boutons, CTA) |
| Vert CI | `#009E49` | Couleur secondaire (validation, succès) |
| Gold | `#D4A017` | Accent (badges, premium) |
| **NE PAS utiliser** | `HColors.green`, `HColors.terracotta` | Anciennes couleurs |

### Typographies
| Usage | Font |
|---|---|
| Titres | Cormorant Garamond (`var(--font-cormorant)`) |
| Corps | Nunito (`var(--font-nunito)`) |

### Performance cible
| Métrique | Cible |
|---|---|
| FCP | < 2.5s |
| LCP | < 4s |
| Bundle initial | < 350KB gzip |
| Images | < 200KB chacune |
| Offline | Page d'accueil (Service Worker) |

---

## 📊 Progression & Historique

### Résumé
```
Palier 1 (MVP) : ████████████████████████░  ~95%
Palier 2 (Messagerie + Analytics) : ██████████████░░░░░░░░░░░░  ~65% (+5%)
Palier 3 (Avancé) : ██████░░░░░░░░░░░░░░░░░░░░░░░░░░  ~30%

Global : ██████████████████████████████░░  ~85%
```

### Historique des mises à jour

| Date | Changement |
|---|---|
| 2026-04-10 | **Fix CI** — `package-lock.json` regénéré (dépendances netbsd/arm64 retirées). Commit `d68d4a4`. |
| 2026-04-10 | **Session tests massive** — 221 nouveaux tests ajoutés (Cloud Functions 101, services 58, owner 75, admin 34, chat 24, formulaires 18, hooks 17). 78 fichiers de test au total, 778 tests, 100% passent. typecheck clean à 0 erreur. |
| 2026-04-09 | Création PLAN.md pour HOMECI (audit complet) |
| 2026-04-09 | Documentation BRAIN_QWEN mise à jour (était Djama → maintenant HOMECI) |
| 2026-04-08 | Champs hôtel/appart-hôtel dans formulaire propriété |
| 2026-04-08 | Fix formulaire édition + calendrier disponibilités |
| 2026-04-08 | Tests PropertiesTab (bannière mise à jour statut) |
| 2026-04-08 | Bannière d'alerte pour mise à jour statut post-visite |
| 2026-04-07 | Responsive mobile composants notaire |

---

## 📐 Nommage & Conventions

| Type | Convention | Exemple |
|---|---|---|
| Composant | PascalCase | `PropertyCard.tsx` |
| Hook | camelCase + use | `useOwnerVisits.ts` |
| Service | camelCase + Service | `visitService.ts` |
| Type/Interface | PascalCase | `Property`, `VisitRequest` |
| Fichier test | `*.test.ts(x)` | `AuthModal.test.tsx` |
| Constante | UPPER_SNAKE | `REASON_LABELS` |
| Route | kebab-case | `/portail-securise` |
| Collection Firestore | snake_case pluriel | `notaire_codes` |

---

*Ce fichier est mis à jour à chaque session de développement.*
*Dernière mise à jour : 2026-04-09*
