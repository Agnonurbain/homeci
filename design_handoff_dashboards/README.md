# Handoff — Refonte Dashboards Homeci

> **Pour Claude Code** : ce dossier contient les designs de référence pour mettre à jour les 4 dashboards de l'application Homeci (`Agnonurbain/homeci`) ainsi qu'un système d'iconographie unifié.

---

## 📦 Contenu du package

```
design_handoff_dashboards/
├── README.md                           ← ce fichier (instructions complètes)
├── designs/
│   ├── Dashboard Admin.html            ← 16 onglets admin
│   ├── Dashboard Notaire.html          ← 5 onglets notaire
│   ├── Dashboard Locataire.html        ← 5 onglets locataire
│   ├── Dashboard Proprietaire.html     ← 4 onglets propriétaire
│   └── Iconographie Homeci.html        ← Showcase visuel des 64 icônes
└── icons/
    ├── HomeciIcons.tsx                 ← ⭐ 64 icônes React prêtes à copier
    └── README.md                       ← Guide d'intégration des icônes
```

---

## 🎯 Overview

Cette refonte modernise les 4 dashboards de Homeci (plateforme immobilière ivoirienne) en **harmonisant l'identité visuelle** autour de la palette drapeau ivoirien 🇨🇮 (orange / blanc / vert) avec accents or, motifs Kente et typographie Cormorant. Tous les dashboards partagent désormais :

- Header sticky avec identité utilisateur + badges KPI cliquables (filtres rapides)
- Bandeau Kente décoratif (3px) en haut du header
- Indicateur "Temps réel" (point vert pulsant)
- Tabs avec underline orange + badges compteurs
- Cards avec ombres douces + bordures `gold/15`
- Typographie : `Cormorant` pour titres / `Nunito` pour corps

---

## 📐 About the Design Files

**Les fichiers HTML sont des références de design — pas du code de production à copier-coller.**

Ils sont écrits en **React + Babel inline** uniquement pour le prototypage. La tâche est de **recréer ces designs dans le codebase existant** (`Agnonurbain/homeci`, React + TypeScript + Tailwind + design tokens dans `src/styles/homeci-tokens.ts`) en respectant les conventions du projet :

- Composants TypeScript existants dans `src/components/admin/`, `src/components/notaire/`, `src/components/owner/`, `src/components/tenant/`
- Hooks personnalisés existants (`useOwnerProperties`, `useOwnerVisits`, `useTenantVisits`, etc.)
- Tokens dans `src/styles/homeci-tokens.ts` (`HColors`, `HAlpha`)
- Recharts pour les graphiques (déjà installé)
- `lucide-react` pour les icônes (à compléter avec icônes custom — voir section dédiée)

---

## ✨ Fidelity

**High-fidelity** — pixel-perfect.

Toutes les couleurs, espacements, typographies, ombres et animations sont des valeurs finales. À recréer fidèlement avec les tokens existants du codebase.

---

## 🎨 Design Tokens (à utiliser depuis `src/styles/homeci-tokens.ts`)

### Couleurs principales (HColors)

```typescript
// Palette ivoirienne (déjà dans homeci-tokens.ts)
orange:     '#FF6B00'   // Orange CI – CTAs primaires
orangeDark: '#AF4B00'   // Orange foncé – tabs actifs (sur fond sombre)
vertCI:     '#009E49'   // Vert drapeau CI – validation, succès
gold:       '#D4A017'   // Or – accents premium, vérifications
forest:     '#1B5E3A'   // Vert forêt – header sombre
night:      '#0A3D1F'   // Vert nuit – sidebar admin

// Neutres
cream:      '#F5E6C8'   // Texte sur fond sombre
creamBg:    '#FFF8ED'   // Fond pages
brown:      '#8B6A30'   // Texte secondaire
bois:       '#5C3D1E'   // Texte tertiaire
darkBrown:  '#1A0E00'   // Titres
white:      '#FFFFFF'

// Sémantiques
bordeaux:   '#8B1D1D'   // Erreurs, refus
navy:       '#1A3A6B'   // Info
navyDark:   '#1A3A2A'   // Filtres actifs
```

### Alpha helpers (HAlpha)
Utiliser `HAlpha.gold15`, `HAlpha.orange25`, `HAlpha.vert10`, etc. — déjà définis.

### Typographie

```css
--font-cormorant: 'Cormorant', Georgia, serif;  /* Titres, KPI, h1-h3 */
--font-nunito:    'Nunito', system-ui, sans-serif;  /* Corps, UI */
```

### Échelle d'espacement
- `gap: 4 / 6 / 8 / 10 / 12 / 14 / 16 / 20 / 24 / 28 px`
- Padding cards : `padding: 18-22px`
- Border radius : `8 / 10 / 12 / 14 / 18 / 20 / 99(pill)`

### Ombres
```css
/* Cards standard */
box-shadow: 0 2px 10px rgba(26,14,0,0.05);

/* Cards en hover */
box-shadow: 0 4px 20px rgba(26,14,0,0.08);

/* CTAs */
box-shadow: 0 4px 14px rgba(255,107,0,0.3);
```

### Élément signature : KenteLine
Bandeau de 3px en haut du header, motif drapeau ivoirien :
```css
height: 3px;
background: repeating-linear-gradient(
  90deg,
  #FF6B00 0, #FF6B00 14px,
  #009E49 14px, #009E49 28px,
  #FFFFFF 28px, #FFFFFF 42px,
  #D4A017 42px, #D4A017 56px
);
```

---

## 🗂 Mapping Designs → Composants TSX existants

### Dashboard Admin (`Dashboard Admin.html` → `AdminDashboard.tsx` + `src/components/admin/`)

**16 onglets** (réels, tirés de `src/components/admin/AdminTabs.tsx`) :

| # | Onglet | ID | Composant cible |
|---|---|---|---|
| 1 | Vue d'ensemble | `analytics` | `admin/AdminAnalyticsTab.tsx` |
| 2 | Notaires | `notaires` | `admin/AdminNotairesTab.tsx` |
| 3 | Validations bien | `validation` | (intégré au flow propriétés) |
| 4 | Utilisateurs | `users` | `AdminUsersSearchTab.tsx` |
| 5 | Recherche utilisateurs | `search` | `AdminUsersSearchTab.tsx` |
| 6 | Modération biens | `moderation` | (à extraire) |
| 7 | Visites | `visits` | `AdminVisitsTab.tsx` |
| 8 | Signalements | `reports` | `AdminReportsTab.tsx` |
| 9 | Satisfaction | `surveys` | `AdminSurveysTab.tsx` |
| 10 | CGV | `cgv` | `AdminCGVTab.tsx` |
| 11 | Sécurité (logs login) | `security` | `AdminLoginHistory.tsx` |
| 12 | Gestion admins | `admins` | `AdminManagement.tsx` |
| 13 | Audit logs | `audit` | `admin/AdminAuditLogs.tsx` |
| 14 | Exports CSV | `export` | `admin/AdminExportTab.tsx` |
| 15 | Publicités | `ads` | (à créer si manquant) |
| 16 | Paramètres | `settings` | (existant) |

**Layout particulier** : sidebar gauche sombre (`#071F0F`) verticale + zone contenu — différent des autres dashboards qui ont une nav horizontale.

### Dashboard Notaire (`Dashboard Notaire.html` → `NotaireDashboard.tsx` + `src/components/notaire/`)

**5 onglets** (de `notaire/NotaireTabs.tsx`) :
| Onglet | ID | Composant |
|---|---|---|
| Disponibles | `disponible` | `NotairePropertyCard.tsx` (filter) |
| En cours | `en_cours` | idem |
| Prêts à certifier | `pret` | idem |
| Certifiés | `certifie` | idem |
| Statistiques | `stats` | `notaire/NotaireStatsTab.tsx` |

**Améliorations** apportées par rapport à l'existant :
- Header enrichi : nom du notaire + ville d'exercice + numéro de licence
- Pipeline visuel des dossiers (4 étapes en barre de progression)
- Section "Activité récente" avec timeline
- Quick action sur les KPIs (clic = filtre)

### Dashboard Locataire (`Dashboard Locataire.html` → `TenantDashboard.tsx` + `src/components/tenant/`)

**5 onglets** (de `TenantDashboard.tsx`) :
| Onglet | ID | Composant |
|---|---|---|
| Recherche | `search` | `tenant/SearchTab.tsx` |
| Favoris | `favorites` | `tenant/FavoritesTab.tsx` |
| Visites | `visits` | `tenant/VisitsTab.tsx` |
| Notifications | `notifications` | `tenant/NotificationsTab.tsx` |
| Mon dossier | `dossier` | `tenant/DossierTab.tsx` (lazy) |

**Améliorations** :
- Salutation personnalisée "Bonjour, {prenom} 👋"
- Barre de progression du dossier locative dans le header
- Toggle Liste / Carte / Filtre sur l'onglet Recherche

### Dashboard Propriétaire (`Dashboard Proprietaire.html` → `OwnerAgentDashboard.tsx` + `src/components/owner/`)

**4 onglets** (de `OwnerAgentDashboard.tsx`) :
| Onglet | ID | Composant |
|---|---|---|
| Mes Biens | `properties` | `owner/PropertiesTab.tsx` |
| Demandes | `requests` | `owner/VisitRequestsTab.tsx` |
| Statistiques | `stats` | `owner/StatsTab.tsx` |
| Notifications | `notifications` | `owner/NotificationsTab.tsx` |

**Améliorations** :
- KPI cards avec icônes colorées dans le header
- Badge "⚡ Boost" sur les biens boostés
- Bandeau d'alerte orange si visite effectuée nécessite mise à jour de statut
- Bandeau "Paiements mobiles bientôt" (Orange Money / MTN / Wave / Flooz / Djamo)

---

## 🧩 Composants partagés à factoriser

Ces patterns sont communs aux 4 dashboards — je recommande de les extraire dans `src/components/shared/` :

### `<KenteLine height={3} />`
Le bandeau motif drapeau (utilisé en haut de chaque header)

### `<DashboardHeader>`
Header sticky avec :
- KenteLine top
- Identité (avatar + nom + rôle)
- StatBadges (badges KPI cliquables — filtres rapides)
- Indicateur "Temps réel" (point vert pulsant `animation: pulse 2s infinite`)
- Tabs avec underline orange `borderBottom: 2.5px solid #AF4B00`

### `<StatBadge icon label value color onClick />`
Badge KPI cliquable du header (clic = filtre/navigation vers tab concerné)

### `<KPICard icon label value color>`
Card stat avec icône colorée + valeur en Cormorant + label uppercase

### `<NotificationItem>`
Item du feed notif avec :
- Icône colorée selon `type`
- Point pulsant orange si non-lu
- Auto-navigation vers `target_tab` au clic
- Style dégradé : opacity 0.8 + scale 1.0 si lu / scale 1.01 + bordure colorée si non-lu

### `<EmptyState icon title description ctaLabel onCta />`
État vide réutilisable (`Bell`, `Calendar`, `Home`, etc.)

---

## 🎭 Interactions & comportements

### Hover states
- Cards : `transform: translateY(-2px)` + ombre renforcée
- Boutons : `opacity: 0.9` + `active:scale-95`
- Lignes de table : `background: rgba(255,248,237,0.7)`

### Animations
- Fade-in onglet : `animation: fadeIn 0.35s ease both` (translateY 8px → 0)
- Indicator "Temps réel" : `animation: pulse 2s infinite`
- Notification non-lue : point pulsant orange

### Responsive
- Stat grids : `grid-cols-2 md:grid-cols-4` ou `repeat(5, 1fr)` desktop
- Tabs : `overflow-x: auto` sur mobile
- Header : `flex-wrap` sur mobile

### Accessibilité
- Tous les badges KPI sont `<button>` cliquables (filtres)
- États focus visibles
- Hit targets ≥ 44px

---

## 🎨 Iconographie — Intégration

**`Iconographie Homeci.html`** présente 60+ icônes SVG custom dessinées dans la DNA Homeci (stroke 1.75, lineCap rond, viewBox 24×24).

### 8 catégories
1. **Navigation** : home, dashboard, search, settings, bell, menu
2. **Types de biens** : villa, appartement, terrain, bureau, maison
3. **Statuts & Vérification** : verified-shield, certified, pending, rejected, boost
4. **Actions** : edit, delete, download, share, filter, sort
5. **Communication** : message, phone, mail, chat-bubble
6. **Documents** : file, contract, certificate, dossier
7. **Immobilier ivoirien** : akan-stool, baobab, kente-pattern
8. **Identité Homeci** : elephant-mark, homeci-logo, gold-leaf

### Stratégie d'intégration recommandée

**Option A (rapide)** : continuer avec `lucide-react` + ajouter quelques icônes custom signature (éléphant, kente) en SVG inline

**✅ Le fichier TSX est déjà prêt** : `icons/HomeciIcons.tsx` contient les 64 icônes React/TypeScript exportées individuellement.

```bash
# Une seule commande à lancer :
cp design_handoff_dashboards/icons/HomeciIcons.tsx src/components/icons/HomeciIcons.tsx
```

Puis utiliser :
```tsx
import { Villa, Verified, ElephantMark, Boost } from '@/components/icons/HomeciIcons';
<Villa size={24} />
<Verified accent="#009E49" />
```

Voir `icons/README.md` pour le guide complet de migration depuis `lucide-react`.

---

## 📝 Plan d'implémentation suggéré (par ordre de priorité)

1. **Phase 1 — Foundation** (1-2 jours)
   - Créer `src/components/shared/` avec `KenteLine`, `DashboardHeader`, `StatBadge`, `KPICard`, `NotificationItem`, `EmptyState`
   - Ajouter les tokens manquants à `homeci-tokens.ts` si besoin (vérifier `bordeaux`, `navyDark`)

2. **Phase 2 — Dashboard Propriétaire** (commence par le plus simple : 4 onglets)
   - Refactor `OwnerAgentDashboard.tsx` pour utiliser le nouveau header partagé
   - Ajouter les badges KPI cliquables dans le header
   - Ajouter le bandeau "Paiements mobiles bientôt"

3. **Phase 3 — Dashboard Locataire** (5 onglets)
   - Salutation personnalisée + barre de progression dossier
   - Header partagé + StatBadges
   - Toggle Liste/Carte sur Search

4. **Phase 4 — Dashboard Notaire** (5 onglets)
   - Pipeline visuel des dossiers
   - Section activité récente
   - Header partagé enrichi

5. **Phase 5 — Dashboard Admin** (16 onglets, le plus gros)
   - Sidebar verticale sombre (différent des autres)
   - Tous les onglets existent déjà → focus sur cohérence visuelle

6. **Phase 6 — Iconographie** (transverse)
   - Créer `src/components/icons/` avec les icônes signature
   - Remplacer progressivement les `lucide-react` par les custom Homeci sur les éléments brand-critical (header, KPIs, certification)

---

## 📚 Fichiers de référence

| Fichier handoff | Composant codebase à mettre à jour |
|---|---|
| `designs/Dashboard Admin.html` | `src/components/AdminDashboard.tsx` + tous les `admin/*.tsx` |
| `designs/Dashboard Notaire.html` | `src/components/NotaireDashboard.tsx` + `notaire/*.tsx` |
| `designs/Dashboard Locataire.html` | `src/components/TenantDashboard.tsx` + `tenant/*.tsx` |
| `designs/Dashboard Proprietaire.html` | `src/components/OwnerAgentDashboard.tsx` + `owner/*.tsx` |
| `designs/Iconographie Homeci.html` | `src/components/icons/` (nouveau dossier) |

---

## 🔧 Notes techniques importantes

- **Garder les hooks et la logique métier existants** (`useOwnerProperties`, `useTenantVisits`, etc.) — la refonte est **purement visuelle**
- **Garder les services Firebase intacts** — pas de changement de schéma de données
- **Tester en mobile** — tous les designs sont responsive (les valeurs `repeat(5,1fr)` doivent passer en `grid-cols-2` < 768px)
- **Lazy-load conservé** sur `DossierTab` (locataire) et autres tabs lourds
- **Recharts** utilisé pour les graphiques (déjà dans le projet) — les barres SVG dans les designs sont juste des placeholders, à remplacer par `<BarChart>`, `<LineChart>`, `<PieChart>` Recharts

---

## ✅ Checklist de validation finale

Pour chaque dashboard refait, vérifier :

- [ ] KenteLine 3px en haut du header
- [ ] Identité utilisateur visible (nom + rôle + avatar/icône)
- [ ] Au moins 3 StatBadges cliquables dans le header
- [ ] Indicateur "Temps réel" pulsant
- [ ] Tabs avec underline orange foncé sur tab actif
- [ ] Badges compteurs sur les tabs (notifications, demandes en attente, etc.)
- [ ] Cards avec ombre `0 2px 10px rgba(26,14,0,0.05)`
- [ ] Bordures cards : `1px solid rgba(212,160,23,0.15)`
- [ ] Titres en Cormorant 700, corps en Nunito
- [ ] Animation fadeIn au changement d'onglet
- [ ] États vides illustrés (icône + titre + description + CTA)
- [ ] Responsive mobile (tabs scroll horizontal, grids 2 cols)

---

**Bonne implémentation ! 🚀**
