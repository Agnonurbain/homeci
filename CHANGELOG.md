# Changelog

Toutes les modifications notables de HOMECI seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/)
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-04-13

### ✅ Ajouté
- **Tests** — 1109 tests (104 fichiers), 100% passent, 0 erreur TypeScript
- **Tests composants admin** — AdminAuditLogs (11), AdminNotairesTab (15)
- **Tests dashboard notaire** — 5 fichiers (63 tests) : ValidationSection, NotairePropertyCard, NotaireActionModals, NotaireTabs, NotaireStats
- **Tests UI** — Skeletons (14), HomeCIEmblem (5), SEO (3)
- **Chat pièces jointes** — Images (JPG, PNG, WebP, GIF) + PDF, bouton clip, lightbox, Storage rules
- **Notifications FCM offline** — Détection online/offline (30s), `delivery_mode`, `push_sent` anti-doublons, deep link chat
- **Chat paginé + recherche** — 30 msg/page, scroll infini, recherche dans historique, highlight résultats
- **Dossier locataire complet** — Service, hook, soumission, suppression, 36 tests
- **Recherche avancée locataire** — Tri 5 options, NLP complet, dropdown tri, 14 tests
- **Flux décértilification** — `handleRevoke` + RevokeModal, annulation visites, 3 tests
- **Modération automatique** — Cloud Function : keywords (14), spam, Levenshtein, 11 tests
- **Auth 2FA admin** — TOTP via otplib, QR code, vérification, 9 tests
- **Audit logs complets** — 16 types d'actions, AdminAuditLogs avec filtres, 15 tests
- **Rate limiting API** — 7 actions limitées, RateLimitError, persistence localStorage, 12 tests
- **Optimisation images** — `compressImage` unifié, 4 presets, `getConnectionQuality`, 987 tests
- **Géographie CI** — 13 communes Abidjan, 220+ quartiers, 11 tests
- **Husky pre-commit** — lint → typecheck → test automatique
- **Bundle size monitoring** — 9 chunks manuels, visualizer, index 335KB gzip
- **Gestion vidéo** — VideoUploadPreview, OptimizedVideoPlayer, videoProcessing, 23 tests
- **Gestion publicités** — adService complet, AdminAdsTab avec stats/CRUD/modals, 18 tests
- **Formulaire 5 étapes** — Tests LocationStep (7), MediaStep (11), CharacteristicsStep (9), InfoStep (10), DocumentsStep (13)
- **Dashboard owner** — Tests VisitRequestsTab (14), StatsTab (9), VisitResponseModal (10), PropertyRow (13), PropertyStats (3), BoostModal (11), PropertiesTab (17)
- **Dashboard locataire** — Tests SearchTab (8), FavoritesTab (5), VisitsTab (10), VisitRequestModal (4)
- **Dashboard admin** — Tests AdminTabs (4), AdminStats (4), OverviewSection (6), AdminModals (12)
- **CI/CD** — GitHub Actions (lint → build → test → coverage), typecheck ajouté, Node 22→24
- **Branches** — Branche `develop` créée, version 1.0.0
- **DEPLOY.md** — Guide de déploiement Vercel + Firebase
- **ARCHITECTURE.md** — Documentation technique mise à jour
- **CGV** — 3 versions (locataire, propriétaire, notaire), conformité droit ivoirien
- **Service Worker** — PWA avec cache strategies + FCM push + deep links
- **Headers sécurité** — X-Frame-Options, COOP, X-Content-Type-Options via Vercel

### 🔧 Modifié
- Cloud Functions modulaires — 6 fichiers (firebase-admin, scheduler, notifications, notaire, admin, chat)
- 111 erreurs TypeScript corrigées (35 fichiers)
- `package-lock.json` fixé (dépendances optionnelles netbsd/arm64 retirées)

### 🗑️ Supprimé
- reCAPTCHA (timeout sur connexions lentes CI)
- Auth téléphone Firebase (SMS non supporté en Côte d'Ivoire, erreur 503)
- Modèles 3D (retiré des priorités MVP)

### ⚠️ Connu
- Auth téléphone Firebase non supportée en Côte d'Ivoire
- reCAPTCHA retiré (timeout 3G/Edge)

---

## [0.1.0] — 2026-03-XX (avant audit)

### ✅ Ajouté
- Setup initial Vite + React + TypeScript + Tailwind 3
- 4 dashboards (admin, owner, notaire, tenant)
- Formulaire propriété 5 étapes
- Messagerie basique (ChatBox, ChatInput, MessageBubble)
- PWA complète (manifest, favicons, sw.js)
- SEO (react-helmet-async, robots.txt, sitemap.xml)
- Firestore (10+ collections, 230+ lignes de règles, 7 index)
- Storage rules (7 paths avec size limits et MIME types)
- Cloud Functions v2 (sendPushNotification, autoResetVisits)
- Design tokens centralisés (palette CI : orange/vert/or)
- Pages publiques (Hero, Features, PublicPropertyList, PropertyCard, PropertyFilters)
- Authentification (email/password, Google)
- Sélection de rôle (locataire/propriétaire)

---

*Pour plus de détails, voir les fichiers de suivi dans `BRAIN_QWEN/`.*
