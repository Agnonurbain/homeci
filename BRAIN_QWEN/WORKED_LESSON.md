# 📚 WORKED_LESSON.md — Leçons apprises & Difficultés rencontrées

> **Mis à jour à chaque session HOMECI.** Dernière mise à jour : 2026-04-09 (session haute priorité).
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

## 📊 Résumé par catégorie

| Catégorie | Count |
|---|---|
| Backend | 2 |
| Frontend | 3 |
| CI/CD | 4 |
| Sécurité | 1 |
| UX | 1 |
| Tests | 1 |
| Infrastructure | 3 |
| Documentation | 1 |
| Design | 1 |
| **TOTAL** | **17** |

---

## 📊 Résumé par impact

| Impact | Count |
|---|---|
| 🔴 Critique | 5 |
| 🟡 Moyen | 9 |
| 🟢 Faible | 3 |

---

*Mettre à jour après chaque difficulté rencontrée pendant le développement.*
*Lire ce fichier avant de commencer une nouvelle session pour éviter les pièges connus.*
