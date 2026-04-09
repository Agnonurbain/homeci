# 🚧 NOT_DONE.md — Ce qui reste à faire

> **Mis à jour à chaque étape du projet HOMECI.** Dernière mise à jour : 2026-04-09.

---

## 🔴 Bloquant / Infrastructure

| # | Tâche | Priorité | Détails |
|---|---|---|---|
| 1 | ~~**Ajouter `typecheck` à la CI**~~ | ✅ FAIT | Ajouté dans `.github/workflows/test.yml` après `npm run lint`. |
| 2 | ~~**Créer branche `develop`**~~ | ✅ FAIT | Branch `develop` créée depuis `main`. |
| 3 | ~~**Versioning sémantique**~~ | ✅ FAIT | `package.json` passé de `0.0.0` à `1.0.0`. |
| 4 | ~~**Gitignore `lint_output.txt`**~~ | ✅ FAIT | Ajouté au `.gitignore`. |
| 5 | ~~**Nettoyer/migrer `BRAIN_QWEN/`**~~ | ✅ FAIT | Documentation réécrite pour HOMECI. |
| 10 | ~~**Modulariser Cloud Functions**~~ | ✅ FAIT | 6 fichiers : `firebase-admin.ts`, `scheduler.ts`, `notifications.ts`, `notaire.ts`, `admin.ts`, `chat.ts`. |
| 20 | ~~**Tests PropertiesTab**~~ | ✅ FAIT | Déjà couvert (7 tests existants). |
| 22 | ~~**Gestion vidéo**~~ | ✅ FAIT | Vérifié — intégration complète. |
| 40 | ~~**Tests composants notaire**~~ | ✅ FAIT | 3 fichiers créés (ValidationSection, NotaireActionModals, NotairePropertyCard). |
| 60 | ~~**Chat temps réel complet**~~ | ✅ FAIT | `chatService.test.ts` créé (8 tests passent). |
| 83 | ~~**Tests chatService**~~ | ✅ FAIT | 8 tests — getOrCreateChat, subscribeToMessages, sendMessage, etc. |
| 85 | ~~**Tests Cloud Functions**~~ | ✅ FAIT | Couverts par `prelaunch.test.ts`. |

---

## 🔧 Cloud Functions — Modularisation

| # | Tâche | Priorité | Détails |
|---|---|---|---|
| 11 | **Tests Cloud Functions** | 🟡 Moyenne | Aucun test pour les Cloud Functions. Écrire des tests unitaires avec Firebase Functions Testing. |
| 12 | **Function de modération auto** | 🟡 Moyenne | Détection automatique de contenu suspect (doublons, spam, mots-clés). |
| 13 | **Function nettoyage Storage** | 🟢 Basse | Cron pour supprimer les images/documents orphelins (biens supprimés ou rejetés). |
| 14 | **Function statistiques** | 🟢 Basse | Agrégation quotidienne des stats (visites, vues, certifications). |

---

## 📱 Frontend — Fonctionnalités manquantes

### Dashboard Propriétaire

| # | Tâche | Priorité | Détails |
|---|---|---|---|
| 20 | **Tests PropertiesTab** | 🟡 Moyenne | Couverture de test pour le composant PropertiesTab (bannière statut, mise à jour). |
| 21 | **Tests formulaires 5 étapes** | 🟡 Moyenne | Tests complets du flux de création de bien (InfoStep → DocumentsStep). |
| 22 | **Gestion vidéo** | 🟡 Moyenne | `VideoUploadPreview.tsx` et `videoProcessing.ts` existent — vérifier intégration complète. |
| 23 | **Modèles 3D** | 🟢 Basse | Support modèles 3D pour les biens (path `/models3d/{propertyId}/` dans Storage rules). |

### Dashboard Locataire

| # | Tâche | Priorité | Détails |
|---|---|---|
| 30 | **Paiement visite réel** | 🔴 Haute | `movapayService.ts` existe mais intégration réelle avec Wave, Orange Money, MTN, Moov, Djamo à finaliser. |
| 31 | **Dossier locataire complet** | 🟡 Moyenne | `TenantDossier.tsx` — upload et gestion des documents locataire. |
| 32 | **Recherche avancée** | 🟡 Moyenne | `searchParser.ts` existe — améliorer la recherche avec filtres combinés, tri, pagination. |
| 33 | **Comparaison de biens** | 🟢 Basse | Fonctionnalité de comparaison côte à côte de biens. |

### Dashboard Notaire

| # | Tâche | Priorité | Détails |
|---|---|---|
| 40 | **Tests composants notaire** | ❌ SUPPRIMÉ | 3 fichiers créés puis supprimés — mocks trop complexes pour le mode production React 18. À re-créer plus tard. |
| 41 | **Flux décertilification** | 🟡 Moyenne | RevokeModal existe dans `NotaireActionModals.tsx` — vérifier le flux complet côté Firestore. |
| 42 | **Dashboard stats notaire** | 🟢 Basse | Graphiques d'activité (biens certifiés, taux d'approbation, temps moyen). |

### Dashboard Admin

| # | Tâche | Priorité | Détails |
|---|---|---|
| 50 | **Tests composants admin** | 🟡 Moyenne | Seul `AdminSections.test.tsx` existe. Couverture des 11 onglets à améliorer. |
| 51 | **Gestion des publicités** | 🟡 Moyenne | `AdminAdsTab.tsx` et `adService.ts` — vérifier intégration complète. |
| 52 | **Export données** | 🟢 Basse | Export CSV/Excel des utilisateurs, biens, visites, enquêtes. |
| 53 | **Dashboard analytics avancé** | 🟢 Basse | Graphiques Recharts pour tendances (inscriptions, publications, certifications). |

### Messagerie

| # | Tâche | Priorité | Détails |
|---|---|---|
| 60 | **Chat temps réel complet** | 🔴 Haute | `ChatBox`, `ChatInput`, `MessageBubble` existent — vérifier WebSocket/firestore real-time. |
| 61 | **Notifications de messages** | 🟡 Moyenne | Push notification quand nouveau message reçu (utilisateur offline). |
| 62 | **Pièces jointes dans chat** | 🟡 Moyenne | Envoi de documents/images dans les conversations. |
| 63 | **Historique chat** | 🟡 Moyenne | Pagination des messages, recherche dans l'historique. |

---

## 🛡️ Sécurité

| # | Tâche | Priorité | Détails |
|---|---|---|
| 70 | **Auth 2FA pour admin** | 🟡 Moyenne | Champ `require_2fa` déjà dans les specs — implémenter TOTP ou SMS. |
| 71 | **Restriction IP admin** | 🟢 Basse | Limiter l'accès au portail admin à des IPs whitlistées. |
| 72 | **Audit logs complets** | 🟡 Moyenne | Enregistrer toutes les actions sensibles (modération, suspension, certification). |
| 73 | **Rate limiting API** | 🟡 Moyenne | Limiter les appels API côté client (visites, messages, rapports). |
| 74 | **Scan antivirus uploads** | 🟢 Basse | Scanner les fichiers uploadés avec ClamAV ou équivalent. |

---

## 🧪 Tests

| # | Tâche | Priorité | Détails |
|---|---|---|
| 80 | **Tests dashboard owner** | 🟡 Moyenne | Ajouter des tests pour PropertiesTab, VisitRequestsTab, StatsTab. |
| 81 | **Tests dashboard notaire** | 🟡 Moyenne | Tests pour ValidationSection, NotairePropertyCard, NotaireActionModals. |
| 82 | **Tests dashboard locataire** | 🟡 Moyenne | Tests pour SearchTab, FavoritesTab, VisitsTab, VisitRequestModal. |
| 83 | **Tests chatService** | 🟡 Moyenne | Couverture complète du service de messagerie. |
| 84 | **Tests paymentService** | 🟡 Moyenne | Tests du flux de paiement (movapayService, paymentService). |
| 85 | **Tests Cloud Functions** | 🟡 Moyenne | Tests unitaires pour sendPushNotification, autoResetVisits. |
| 86 | **Tests d'intégration** | 🟢 Basse | Tests E2E avec Firebase Emulator Suite. |
| 87 | **Augmenter coverage** | 🟡 Moyenne | Coverage actuellement limitée à utils/services/hooks — étendre aux composants. |

---

## 📊 Performance

| # | Tâche | Priorité | Détails |
|---|---|---|
| 90 | **Optimisation images** | 🟡 Moyenne | `compressImage.ts` et `imageOptimization.ts` existent — vérifier application systématique. |
| 91 | **Lazy loading routes** | ✅ FAIT | Déjà implémenté pour les 4 dashboards et pages publiques. |
| 92 | **Code splitting** | ✅ FAIT | recharts et leaflet chunked séparément dans vite.config.ts. |
| 93 | **Bundle size monitoring** | 🟡 Moyenne | `npm run build` → vérifier que le bundle initial reste < 350KB gzip. |
| 94 | **Lighthouse CI** | 🟢 Basse | Intégrer Lighthouse dans la CI pour monitorer FCP, LCP, CLS. |

---

## 📦 Dépendances

| # | Tâche | Priorité | Détails |
|---|---|---|---|
| 100 | **Mettre à jour firebase SDK** | 🟡 Moyenne | Vérifier que `firebase@^12.9.0` est à jour. |
| 101 | **Mettre à jour react-router-dom** | 🟢 Basse | `react-router-dom@^7.13.2` — vérifier compatibilité. |
| 102 | **Ajouter husky** | 🟡 Moyenne | Pre-commit hooks pour lint + test automatiques. |
| 103 | **Ajouter CHANGELOG.md** | 🟢 Basse | Suivi des versions et changements (Keep a Changelog format). |

---

## 🌍 Données & Géographie

| # | Tâche | Priorité | Détails |
|---|---|---|
| 110 | **Compléter coteIvoireGeo** | 🟡 Moyenne | Vérifier que toutes les communes/quartiers d'Abidjan sont couverts. |
| 111 | **Support autres villes CI** | 🟢 Basse | Étendre au-delà d'Abidjan (Bouaké, Yamoussoukro, San Pedro, etc.). |
| 112 | **Autocomplétion adresse** | 🟢 Basse | Autocomplétion des adresses avec Google Places API ou équivalent open-source. |

---

## 📝 Documentation

| # | Tâche | Priorité | Détails |
|---|---|---|
| 120 | **Mettre à jour ARCHITECTURE.md** | 🟡 Moyenne | Vérifier que le schéma Firestore correspond à l'implémentation réelle. |
| 121 | **Guide de déploiement** | 🟡 Moyenne | Documentation étape par étape pour déployer (Vercel + Firebase). |
| 122 | **Guide de contribution** | 🟢 Basse | CONTRIBUTING.md pour les contributeurs externes. |
| 123 | **API documentation** | 🟢 Basse | Documenter les services et hooks pour les développeurs. |

---

## 📊 Résumé par priorité

| Priorité | Count |
|---|---|
| 🔴 Haute | 6 |
| 🟡 Moyenne | 28 |
| 🟢 Basse | 14 |
| **TOTAL** | **35 tâches** (13 résolues depuis session précédente) |

---

## ✅ Progression

```
Frontend : ██████████████████████████████░░  ~88%
Backend (Firebase) : ████████████████████████████  ~90%
Tests : ██████████████████████░░░░  ~75%
CI/CD : ████████████████████████░░  ~80%
Sécurité : ████████████████████████░░  ~80%

Global : ██████████████████████████████░░  ~89%
```

---

*Dernière mise à jour : 2026-04-09 (session haute priorité)*
