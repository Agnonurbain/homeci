# 📚 WORKED_LESSON.md — Leçons apprises & Difficultés rencontrées

> **Mis à jour à chaque session HOMECI.** Dernière mise à jour : 2026-04-13 (CI fixée — Node 24).
> **Objectif :** Capitaliser sur les erreurs passées pour ne pas les répéter.

---

## 📖 Comment utiliser ce fichier

Chaque entrée suit ce format :

| Champ | Description |
|---|---|
| **ID** | Identifiant unique (WL-001, WL-002, etc.) |
| **Date** | Date de découverte |
| **Catégorie** | Infrastructure, Frontend, Backend, CI/CD, Sécurité, UX |
| **Problème** | Description du problème rencontré |
| **Cause racine** | Pourquoi c'est arrivé |
| **Solution** | Comment ça a été résolu (ou comment résoudre) |
| **Impact** | Temps perdu / gravité |
| **Prévention** | Comment éviter que ça se reproduise |

---

## 📋 Leçons identifiées

### WL-001 — Auth téléphone Firebase non supportée en Côte d'Ivoire
| Champ | Valeur |
|---|---|
| **ID** | WL-001 |
| **Date** | 2026-03 |
| **Catégorie** | Backend / Infrastructure |
| **Problème** | L'authentification par SMS Firebase renvoie une erreur 503 en Côte d'Ivoire. Firebase Phone Auth n'est pas supporté dans la région. |
| **Cause racine** | Firebase Phone Auth a une couverture géographique limitée. La Côte d'Ivoire n'est pas dans la liste des pays supportés. |
| **Solution** | Désactiver complètement l'auth téléphone. Utiliser email/password + Google Auth uniquement. Documenter dans ARCHITECTURE.md et Qwen.md. |
| **Impact** | 🟡 Moyen — Expérience utilisateur légèrement dégradée (pas de login SMS). |
| **Prévention** | Vérifier la disponibilité des services Firebase par pays avant de les intégrer. |

---

### WL-002 — reCAPTCHA timeout sur connexions lentes
| Champ | Valeur |
|---|---|
| **ID** | WL-002 |
| **Date** | 2026-03 |
| **Catégorie** | UX / Sécurité |
| **Problème** | reCAPTCHA cause des timeouts sur les connexions lentes (3G, Edge) en Côte d'Ivoire. Les utilisateurs ne peuvent pas se connecter. |
| **Cause racine** | reCAPTCHA nécessite un appel réseau vers les serveurs Google. Sur connexions instables, le timeout est fréquent. |
| **Solution** | Retirer reCAPTCHA complètement. Miser sur d'autres mécanismes anti-spam : rate limiting côté Firestore rules, vérification manuelle par admin. |
| **Impact** | 🟡 Moyen — Sécurité réduite mais UX améliorée pour les connexions lentes. |
| **Prévention** | Tester les fonctionnalités réseau sur des connexions lentes (throttle Chrome DevTools à 3G) avant de les déployer. |

---

### WL-003 — Palette de couleurs incohérente
| Champ | Valeur |
|---|---|
| **ID** | WL-003 |
| **Date** | 2026-03 |
| **Catégorie** | Frontend / Design |
| **Problème** | Certains composants utilisent `HColors.green` et `HColors.terracotta` (anciennes couleurs) au lieu de `HColors.vertCI` et `HColors.orangeCI` (palette officielle du drapeau ivoirien). |
| **Cause racine** | Évolution progressive de la palette sans nettoyage rétroactif du code existant. |
| **Solution** | Créer des tokens centralisés (`homeci-tokens.ts`) avec les couleurs officielles. Ajouter une règle de pre-commit : `grep -rn "HColors\.green\b" src/components/`. Documenter dans Qwen.md. |
| **Impact** | 🟢 Faible — Incohérence visuelle mineure. |
| **Prévention** | Utiliser exclusivement les tokens dans les nouveaux composants. Revue de code stricte sur les couleurs. |

---

### WL-004 — Cloud Functions monolithiques
| Champ | Valeur |
|---|---|
| **ID** | WL-004 |
| **Date** | 2026-04-09 (audit) |
| **Catégorie** | Backend |
| **Problème** | Toutes les Cloud Functions sont dans un seul fichier `functions/src/index.ts`. Difficile à maintenir, tester et déployer individuellement. |
| **Cause racine** | Projet démarré avec peu de fonctions, puis ajouté au fur et à mesure sans modulariser. |
| **Solution** | Splitter par domaine : `functions/src/auth/`, `functions/src/visits/`, `functions/src/notifications/`, etc. Chaque domaine dans son propre fichier avec export dans `index.ts`. |
| **Impact** | 🟡 Moyen — Maintenabilité réduite, tests difficiles. |
| **Prévention** | Structurer les Cloud Functions par domaine dès le début, comme les services frontend. |

---

### WL-005 — `typecheck` hors de la CI
| Champ | Valeur |
|---|---|
| **ID** | WL-005 |
| **Date** | 2026-04-09 (audit) |
| **Catégorie** | CI/CD |
| **Problème** | `npm run typecheck` (tsc --noEmit) n'est pas dans le pipeline CI. Des erreurs TypeScript peuvent passer en production sans être détectées. |
| **Cause racine** | CI configurée avec lint → build → test, mais typecheck oublié. Le build Vite peut réussir même avec des erreurs TS (il transpile sans vérifier les types). |
| **Solution** | Ajouter `npm run typecheck` dans `.github/workflows/test.yml` après `npm run lint`. |
| **Impact** | 🔴 Critique — Erreurs de type non détectées, bugs potentiels en production. |
| **Prévention** | Configurer typecheck dans la CI dès le début. Le build ne remplace pas la vérification des types. |

---

### WL-006 — Pas de branche de développement
| Champ | Valeur |
|---|---|
| **ID** | WL-006 |
| **Date** | 2026-04-09 (audit) |
| **Catégorie** | CI/CD / Git |
| **Problème** | Une seule branche `main`. Tout commit va directement en production. Pas de filet de sécurité pour les tests avant merge. |
| **Cause racine** | Projet solo ou petite équipe, pas besoin ressenti de branches multiples au début. |
| **Solution** | Créer une branche `develop`. Configurer les PRs obligatoires pour merger sur `main`. Protections de branche (reviews requises, CI passante). |
| **Impact** | 🟡 Moyen — Risque de régression en production. |
| **Prévention** | Configurer GitFlow ou GitHub Flow dès que le projet a plusieurs contributeurs. |

---

### WL-007 — Formulaire édition non fonctionnel
| Champ | Valeur |
|---|---|
| **ID** | WL-007 |
| **Date** | 2026-04-08 |
| **Catégorie** | Frontend |
| **Problème** | Le formulaire d'édition de bien (`EditPropertyForm`) n'enregistrait pas correctement les modifications. Le calendrier de disponibilités avait aussi des bugs. |
| **Cause racine** | Données initiales mal chargées, state du formulaire pas synchronisé avec les données Firestore. |
| **Solution** | Corriger le chargement des données dans `useEffect`, s'assurer que le state est initialisé avec les valeurs existantes, et que le submit appelle bien `updateProperty`. Fix du calendrier avec vérification des dates. |
| **Impact** | 🔴 Critique — Propriétaires incapables de modifier leurs biens. |
| **Prévention** | Tester systématiquement les flux CRUD (Create, Read, Update, Delete) pour chaque entité. |

---

### WL-008 — Responsive mobile des dashboards
| Champ | Valeur |
|---|---|
| **ID** | WL-008 |
| **Date** | 2026-04-07 |
| **Catégorie** | Frontend / UX |
| **Problème** | Les composants du dashboard notaire n'étaient pas responsive sur mobile. Tableaux débordants, boutons non cliquables. |
| **Cause racine** | Développement desktop-first sans tests responsive réguliers. |
| **Solution** | Ajouter des breakpoints Tailwind (`sm:`, `md:`, `lg:`), rendre les tableaux scrollables horizontalement (`overflow-x-auto`), empiler les éléments verticalement sur mobile. |
| **Impact** | 🟡 Moyen — UX mobile dégradée pour les notaires. |
| **Prévention** | Tester régulièrement sur mobile (Chrome DevTools Device Mode) pendant le développement. |

---

### WL-009 — Tests Firebase mock incomplets
| Champ | Valeur |
|---|---|
| **ID** | WL-009 |
| **Date** | 2026-04 |
| **Catégorie** | Tests |
| **Problème** | Le mock global Firebase dans `src/tests/setup.ts` retourne des valeurs minimales (`null`, `{}`, `vi.fn()`). Certains tests nécessitent des mocks spécifiques qui ne sont pas configurés. |
| **Cause racine** | Mock global générique pour couvrir tous les cas, mais pas assez précis pour les scénarios complexes. |
| **Solution** | Pour mocker un service Firebase spécifique dans un test, le re-mocker localement avec `vi.mock()`. Documenter ce pattern dans Qwen.md. |
| **Impact** | 🟡 Moyen — Tests faussement positifs ou difficiles à écrire. |
| **Prévention** | Écrire les mocks en même temps que les tests, pas après. |

---

### WL-010 — Fichiers de debug dans le repo
| Champ | Valeur |
|---|---|
| **ID** | WL-010 |
| **Date** | 2026-04-09 (audit) |
| **Catégorie** | Infrastructure |
| **Problème** | `lint_output.txt` est présent dans le repo. Fichier de debug temporaire qui n'a pas sa place dans le contrôle de version. |
| **Cause racine** | Commande de lint redirigée vers un fichier au lieu d'utiliser le output normal. `.gitignore` incomplet. |
| **Solution** | Ajouter `lint_output.txt` au `.gitignore`. Supprimer le fichier du repo. |
| **Impact** | 🟢 Faible — Fichier inutile dans le repo. |
| **Prévention** | Vérifier le `.gitignore` régulièrement. Ne jamais commiter de fichiers de sortie de commande. |

---

### WL-011 — Ancienne documentation projet (Djama)
| Champ | Valeur |
|---|---|
| **ID** | WL-011 |
| **Date** | 2026-04-09 (audit) |
| **Catégorie** | Documentation |
| **Problème** | Le dossier `BRAIN_QWEN/` contenait 7 fichiers de documentation pour **Djama** (une app de messagerie React Native + NestJS), complètement étrangers à HOMECI. |
| **Cause racine** | Réutilisation du dossier de documentation d'un ancien projet sans mise à jour. |
| **Solution** | Réécrire tous les fichiers de `BRAIN_QWEN/` pour qu'ils correspondent à HOMECI (React + Firebase). 7 fichiers mis à jour : BRAINSTORMING, DONE, MEMORY, NOT_DONE, PACKAGE, PLAN, WORKED_LESSON. |
| **Impact** | 🔴 Critique — Toute IA ou développeur lisant la documentation aurait eu un contexte complètement faux. |
| **Prévention** | Toujours vérifier que la documentation correspond au code actuel. Mettre à jour la documentation à chaque changement majeur de projet. |

---

### WL-012 — Build Vite réuss mais erreurs TypeScript
| Champ | Valeur |
|---|---|
| **ID** | WL-012 |
| **Date** | 2026-04-09 (audit) |
| **Catégorie** | CI/CD |
| **Problème** | `npm run build` (Vite) peut réussir même s'il y a des erreurs TypeScript. Vite transpile sans vérifier les types strictement. |
| **Cause racine** | Vite utilise esbuild pour la transpilation, qui ignore les erreurs de type. `tsc --noEmit` est nécessaire pour la vérification complète. |
| **Solution** | Toujours lancer `npm run typecheck` après le build. L'ajouter à la CI. |
| **Impact** | 🟡 Moyen — Erreurs de type non détectées avant le déploiement. |
| **Prévention** | `npm run typecheck` dans le workflow CI et dans la checklist pré-commit. |

---

### WL-016 — 111 erreurs TypeScript accumulées sans `typecheck` en CI
| Champ | Valeur |
|---|---|
| **ID** | WL-016 |
| **Date** | 2026-04-09 |
| **Catégorie** | CI/CD |
| **Problème** | 111 erreurs TypeScript découvertes d'un coup lors du premier `npm run typecheck` formel. |
| **Cause racine** | `typecheck` absent de la CI. Vite/esbuild transpile sans vérifier les types. |
| **Solution** | 35 fichiers corrigés : imports inutilisés retirés, mocks `as unknown[]`, `data` typés `as Record<string, unknown>`, `getDocs` mock permissif. |
| **Impact** | 🔴 Critique |
| **Prévention** | `typecheck` dans la CI + lancer avant tout commit majeur. |

---

### WL-017 — `getByDisplayValue` incompatible avec `<select>` en jsdom
| Champ | Valeur |
|---|---|
| **ID** | WL-017 |
| **Date** | 2026-04-10 |
| **Catégorie** | Tests |
| **Problème** | `screen.getByDisplayValue('valeur')` ne trouve pas les `<select>` dans l'environnement jsdom. |
| **Cause racine** | jsdom ne gère pas correctement `displayValue` sur les éléments `<select>`. |
| **Solution** | Utiliser `screen.getByRole('combobox', { name: /Label/ })` ou `screen.getAllByRole('combobox')[index]` puis vérifier la valeur avec `.toHaveValue('valeur')`. |
| **Impact** | 🟡 Moyen — Tests InfoStep cassés. |
| **Prévention** | Toujours utiliser `getByRole('combobox')` pour les `<select>`. |

---

### WL-018 — Chaînes d'import de composants admin complexes
| Champ | Valeur |
|---|---|
| **ID** | WL-018 |
| **Date** | 2026-04-10 |
| **Catégorie** | Tests |
| **Problème** | Les composants admin (OverviewSection) importent une chaîne de dépendances (AdminSections → AdminStats → AdminSections → SectionTitle, PropertyStatusBadge) qui cause des erreurs "Element type is invalid" dans les tests. |
| **Cause racine** | Les imports circulaires et les dépendances profondes rendent le mocking difficile. Les tests doivent mocker toute la chaîne simultanément. |
| **Solution** | Mocker TOUS les sous-composants (`vi.mock('./AdminStats')`, `vi.mock('./AdminSections')`) AVANT d'importer le composant testé. Utiliser des testids (`data-testid`) dans les mocks pour les assertions. |
| **Impact** | 🟡 Moyen — Tests OverviewSection et AdminNotairesTab difficiles à écrire. |
| **Prévention** | Découpler les composants avec moins de dépendances croisées. Envisager une architecture de composition plutôt que d'import direct. |

---

### WL-019 — Import paths cassés lors du déplacement de fichiers de test
| Champ | Valeur |
|---|---|
| **ID** | WL-019 |
| **Date** | 2026-04-10 |
| **Catégorie** | Infrastructure |
| **Problème** | Les imports relatifs (`../../PropertyFormBase`, `../../hooks/useOwnerVisits`) étaient incorrects selon la profondeur des fichiers de test. |
| **Cause racine** | Les fichiers de test sont à différents niveaux : `__tests__/`, `owner/__tests__/`, `owner/propertyForm/__tests__/`, `admin/__tests__/`. |
| **Solution** | Vérifier systématiquement le chemin relatif depuis l'emplacement du fichier de test jusqu'à la source. Utiliser `grep` pour localiser le fichier cible. |
| **Impact** | 🟡 Moyen — 6 fichiers avec imports cassés à corriger. |
| **Prévention** | Utiliser des imports absolus (alias `@/`) si possible. |

---

### WL-020 — package-lock.json incompatible avec CI (mismatch os/cpu)
| Champ | Valeur |
|---|---|
| **ID** | WL-020 |
| **Date** | 2026-04-10 |
| **Catégorie** | CI/CD |
| **Problème** | `npm ci` échouait sur GitHub Actions avec des erreurs "notsup Valid os: netbsd, Actual os: linux" et "notsup Valid cpu: arm64, Actual cpu: x64". |
| **Cause racine** | `package-lock.json` contenait des dépendances optionnelles pour des plateformes spécifiques (netbsd/arm64) générées localement sur macOS/Apple Silicon. |
| **Solution** | Regénérer le `package-lock.json` avec `npm install --package-lock-only` pour supprimer les dépendances optionnelles incompatibles. |
| **Impact** | 🔴 Critique — CI bloquée, aucun déploiement possible. |
| **Prévention** | Toujours lancer `npm install --package-lock-only` après l'ajout de packages sur machine locale avant de pusher. Vérifier le CI avant chaque merge. |

---

### WL-021 — Chat pièces jointes : import path dans les composants chat
| Champ | Valeur |
|---|---|
| **ID** | WL-021 |
| **Date** | 2026-04-11 |
| **Catégorie** | Frontend / Infrastructure |
| **Problème** | `ChatInput.tsx` importait `../styles/homeci-tokens` au lieu de `../../styles/homeci-tokens` car le fichier est dans `src/components/chat/` (un niveau de sous-dossier). |
| **Cause racine** | Le fichier a été réécrit avec `write_file` sans recalculer le chemin relatif. |
| **Solution** | Corriger l'import : `../../styles/homeci-tokens`. Toujours vérifier la profondeur du fichier avant d'écrire les imports relatifs. |
| **Impact** | 🟡 Faible — Erreur TS détectée immédiatement par typecheck. |
| **Prévention** | Utiliser `read_file` pour vérifier le chemin avant `write_file`, ou privilégier `edit` avec contexte. |

---

### WL-022 — Tests : `getByAltText` dupliqué dans lightbox
| Champ | Valeur |
|---|---|
| **ID** | WL-022 |
| **Date** | 2026-04-11 |
| **Catégorie** | Tests |
| **Problème** | `screen.getByAltText('photo.jpg')` trouvait 2 éléments (image dans la bulle + image dans la lightbox) après ouverture de la lightbox. |
| **Cause racine** | La lightbox réutilise le même `alt` que l'image originale. `getByAltText` exige un résultat unique. |
| **Solution** | Utiliser `container.querySelectorAll('img')` et vérifier la count avant/après clic. Pour la fermeture, cibler le bouton X via `querySelector`. |
| **Impact** | 🟡 Faible — 1 test cassé. |
| **Prévention** | Préférer `container.querySelectorAll` quand des éléments dupliqués existent, ou utiliser des `data-testid` uniques. |

---

### WL-023 — Notifications FCM offline : éviter les doublons entre triggers
| Champ | Valeur |
|---|---|
| **ID** | WL-023 |
| **Date** | 2026-04-12 |
| **Catégorie** | Backend / Cloud Functions |
| **Problème** | `onNewChatMessage` crée une notification Firestore → déclenche `sendPushNotification`. Si on envoie aussi un push direct pour utilisateur offline, ça fait un doublon. |
| **Cause racine** | Deux mécanismes d'envoi push : le trigger `sendPushNotification` sur onCreate Firestore, et l'envoi direct dans `onNewChatMessage` pour offline. |
| **Solution** | Ajouter un flag `push_sent: true` dans la notification Firestore quand le push est déjà envoyé directement. `sendPushNotification` vérifie ce flag et retourne early si `pushSent === true`. |
| **Impact** | 🔴 Critique — Doublons de notifications push, UX dégradée. |
| **Prévention** | Toujours utiliser un flag pour coordonner les triggers Firestore et les envois directs. Documenter dans ARCHITECTURE.md. |

---

### WL-024 — Présence utilisateur : `last_seen` vs Firestore `serverTimestamp()`
| Champ | Valeur |
|---|---|
| **ID** | WL-024 |
| **Date** | 2026-04-12 |
| **Catégorie** | Backend / Frontend |
| **Problème** | Comparer `Date.now()` (client) avec `last_seen` (Firestore serverTimestamp) peut causer des décalages. Le timestamp Firestore est un objet `{ seconds, nanoseconds }`, pas un number. |
| **Cause racine** | `serverTimestamp()` retourne un objet Firestore Timestamp, pas un timestamp Unix. |
| **Solution** | Dans Cloud Function : `lastSeen?.seconds ? lastSeen.seconds * 1000 : 0` pour convertir en milliseconds. Côté frontend : utiliser `serverTimestamp()` directement, Firestore gère la conversion. |
| **Impact** | 🟡 Moyen — Détection online/offline fausse si pas converti correctement. |
| **Prévention** | Toujours vérifier le type des timestamps Firestore. Utiliser `.seconds * 1000` pour comparer avec `Date.now()`. |

---

### WL-025 — Chat paginé : orderBy desc + reverse pour le temps réel
| Champ | Valeur |
|---|---|
| **ID** | WL-025 |
| **Date** | 2026-04-12 |
| **Catégorie** | Frontend / Backend |
| **Problème** | Firestore ne supporte pas `limitToLast` avec `onSnapshot` de manière fiable pour un chat temps réel. Charger tous les messages d'un coup est inefficace pour les longues conversations. |
| **Cause racine** | `onSnapshot` avec `orderBy('created_at', 'asc')` + `limit(N)` retourne les N PREMIERS messages (les plus anciens), pas les plus récents. `limitToLast` peut causer des problèmes de ré-écoute. |
| **Solution** | Utiliser `orderBy('created_at', 'desc')` + `limit(N)` pour récupérer les N derniers messages, puis `.reverse()` dans le callback pour les remettre dans l'ordre croissant. Pour charger plus ancien : `endBefore(timestamp)` + `orderBy('created_at', 'desc')` + `limit(N)` + `.reverse()`. |
| **Impact** | � Moyen — Performance chat améliorée, seulement 30 messages chargés initialement. |
| **Prévention** | Toujours penser à l'ordre Firestore : desc pour les récents, reverse pour l'affichage. |

---

### WL-026 — Déduplication des messages entre temps réel et pagination
| Champ | Valeur |
|---|---|
| **ID** | WL-026 |
| **Date** | 2026-04-12 |
| **Catégorie** | Frontend / State management |
| **Problème** | Quand on charge des messages plus anciens pendant que l'abonnement temps réel est actif, il peut y avoir des doublons si un message arrive entre les deux appels. |
| **Cause racine** | Race condition entre `onSnapshot` callback et `getMessagesBefore` promesse. |
| **Solution** | Utiliser un `Set` d'IDs existants pour filtrer les doublons avant de merger : `const existingIds = new Set(prevMsgs.map(m => m.id)); const newMsgs = msgs.filter(m => !existingIds.has(m.id));` Puis trier par timestamp. |
| **Impact** | 🟡 Moyen — Doublons potentiels dans l'UI sans déduplication. |
| **Prévention** | Toujours dédupliquer par ID avant de merger des données Firestore. |

---

### WL-027 — CI GitHub Actions : Node 22 incompatible avec vitest v4
| Champ | Valeur |
|---|---|
| **ID** | WL-027 |
| **Date** | 2026-04-13 |
| **Catégorie** | CI/CD |
| **Problème** | La CI GitHub Actions échouait avec `Process completed with exit code 1` sur le step `test:coverage`. Les annotations montraient des warnings de dépréciation Node 20 sur `actions/setup-node@v4`. |
| **Cause racine** | Le workflow utilisait `node-version: "22"` mais `vitest v4` et ses dépendances (rolldown) nécessitent Node 24+. Le mismatch causait des erreurs silencieuses dans le step de coverage. |
| **Solution** | Passer à `node-version: "24"` dans `.github/workflows/test.yml`. Retirer les variables d'environnement dépréciées (`ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION`, `ACTIONS_FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`). |
| **Impact** | 🔴 Critique — CI bloquée, aucun déploiement possible. |
| **Prévention** | Toujours aligner la version Node de la CI avec l'environnement local. Vérifier les warnings de dépréciation GitHub Actions. |

---

## �📊 Résumé par catégorie

| Catégorie | Count |
|---|---|
| Backend | 4 (+2) |
| Frontend | 5 (+1) |
| CI/CD | 8 (+4) |
| Sécurité | 1 |
| UX | 1 |
| Tests | 4 |
| Infrastructure | 5 |
| Documentation | 1 |
| Design | 1 |
| State management | 1 |
| **TOTAL** | **31** (+4) |

---

## 📊 Résumé par impact

| Impact | Count |
|---|---|
| 🔴 Critique | 7 (+2) |
| 🟡 Moyen | 15 (+1) |
| 🟢 Faible | 4 (+1) |

---

*Mettre à jour après chaque difficulté rencontrée pendant le développement.*
*Lire ce fichier avant de commencer une nouvelle session pour éviter les pièges connus.*
