# 🧠 BRAINSTORMING.md — Point d'entrée central

> **Ce fichier est le premier et dernier fichier .md à lire à chaque session.**
> Il orchestre la lecture de tous les autres fichiers de contexte HOMECI.

---

## 📖 Ordre de lecture optimal (début de session)

Lire **dans cet ordre** pour une compréhension maximale avec un minimum de lectures :

| Ordre | Fichier | Chemin | Pourquoi | Temps de lecture |
|---|---|---|---|---|
| **1** | **BRAINSTORMING.md** | `BRAIN_QWEN/BRAINSTORMING.md` | Ce fichier — sait quoi lire ensuite | 30s |
| **2** | **QWEN.md** | `QWEN.md` (racine) | Règles de codage, conventions, stack, règles métier | 1 min |
| **3** | **MEMORY.md** | `BRAIN_QWEN/MEMORY.md` | Contexte projet résumé, état actuel, problèmes critiques, prochaines étapes | 2 min |
| **4** | **NOT_DONE.md** | `BRAIN_QWEN/NOT_DONE.md` | Tâches restantes numérotées, priorisées, détaillées | 1 min |
| **5** | **WORKED_LESSON.md** | `BRAIN_QWEN/WORKED_LESSON.md` | Pièges à éviter, solutions déjà trouvées | 1 min |

### En résumé :

```
BRAINSTORMING.md → QWEN.md → MEMORY.md → NOT_DONE.md → WORKED_LESSON.md
       (30s)         (1 min)     (2 min)       (1 min)         (1 min)
                                       Total : ~5-6 min
```

---

## 📖 Ordre de lecture optionnel (selon le besoin)

| Besoin | Lire ensuite | Chemin |
|---|---|---|
| **Comprendre l'architecture complète** | `ARCHITECTURE.md` | `ARCHITECTURE.md` (racine) |
| **Vérifier ce qui a été fait** | `DONE.md` | `BRAIN_QWEN/DONE.md` |
| **Détail complet de l'app finale** | `PLAN.md` | `BRAIN_QWEN/PLAN.md` |
| **Résoudre un bug connu** | `WORKED_LESSON.md` | `BRAIN_QWEN/WORKED_LESSON.md` |
| **Contexte projet rapide** | `MEMORY.md` | `BRAIN_QWEN/MEMORY.md` |
| **Installer/gérer les dépendances** | `PACKAGE.md` | `BRAIN_QWEN/PACKAGE.md` |
| **Workflow de session + checklists** | `WORKFLOW.md` | `WORKFLOW.md` (racine) |

---

## 📝 En fin de session — Mettre à jour

**Après chaque tâche complétée**, mettre à jour **dans cet ordre** :

| Ordre | Fichier | Action |
|---|---|---|
| **1** | `DONE.md` | Ajouter la tâche complétée avec détails |
| **2** | `NOT_DONE.md` | Marquer la tâche comme faite, ajuster la progression |
| **3** | `PLAN.md` | Mettre à jour les statuts ✅/❌, ajouter l'historique |
| **4** | `WORKED_LESSON.md` | Ajouter toute difficulté rencontrée avec sa leçon |
| **5** | `TEST.md` | Vérifier que les tests associés au code modifié sont à jour |
| **6** | `MEMORY.md` | Mettre à jour le résumé si l'état global a changé |
| **7** | `BRAINSTORMING.md` (ce fichier) | Mettre à jour les problèmes critiques et prochaines étapes |
| **8** | `Qwen.md` | Mettre à jour la section "Audit" si changement majeur |

---

## 📁 Inventaire des fichiers

| Fichier | Rôle | À lire quand |
|---|---|---|
| `BRAINSTORMING.md` | **Hub central** — orchestre la lecture | Toujours en premier |
| `QWEN.md` | **Conventions** — règles de codage, stack, règles métier | Toujours en 2ème, référence permanente |
| `MEMORY.md` | **Mémoire vive** — contexte, état, rappels | Toujours après QWEN.md |
| `NOT_DONE.md` | **TODO** — tâches numérotées et priorisées | Pour savoir quoi faire |
| `DONE.md` | **Historique** — ce qui a été accompli | Pour vérifier le progrès |
| `PLAN.md` | **Plan complet** — architecture, écrans, DB, paliers | Pour comprendre le scope |
| `WORKED_LESSON.md` | **Leçons** — erreurs passées et solutions | Pour éviter les pièges |
| `PACKAGE.md` | **Dépendances** — packages installés, non installés | Pour ajouter/mettre à jour des packages |
| `TEST.md` | **Règles de test** — rappel impératif de mise à jour des tests | **À lire avant chaque commit** |

### Fichiers racine complémentaires

| Fichier | Rôle |
|---|---|
| `ARCHITECTURE.md` | Architecture technique détaillée, schémas Firestore, flux de données |
| `WORKFLOW.md` | Protocoles de session (`/init`, `/plan`, `/review`, `/security-review`, `/compact`) |
| `ADMIN_SETUP.md` | Configuration du compte administrateur principal |
| `ADMIN_PORTAL.md` | Documentation du portail admin sécurisé |

---

## 🚀 Commandes rapides

```bash
# Développement
npm run dev              # Serveur Vite local (HMR)
npm run build            # Build production (vite build)
npm run preview          # Preview du build local

# Tests
npm test                 # Tous les tests (vitest run)
npm run test:watch       # Mode watch (vitest)
npm run test:coverage    # Couverture (utils, services, hooks uniquement)

# Qualité
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit -p tsconfig.app.json

# Cloud Functions (depuis functions/)
cd functions && npm run build    # Compile TS → lib/
cd functions && npm run serve    # Build + emulators
```

---

## 🔴 Problèmes critiques actuels (rappel)

1. ~~Auth téléphone désactivée~~ ✅ CONNU — Firebase SMS non supporté en CI (erreur 503)
2. ~~reCAPTCHA retiré~~ ✅ CONNU — Timeout sur connexions lentes
3. ~~`typecheck` hors CI~~ ✅ RÉSOLU
4. ~~Cloud Functions monolithique~~ ✅ RÉSOLU — 6 fichiers modulaires
5. ~~Pas de branche `develop`~~ ✅ RÉSOLU
6. ~~Version `0.0.0`~~ ✅ RÉSOLU — 1.0.0
7. ~~Gitignore `lint_output.txt`~~ ✅ RÉSOLU
8. ~~Tests Cloud Functions~~ ✅ RÉSOLU — 101 tests
9. ~~Tests services manquants~~ ✅ RÉSOLU — 58 tests (7 services)
10. ~~Tests dashboard owner~~ ✅ RÉSOLU — 60 tests (6 composants)
11. ~~Tests dashboard admin~~ ✅ RÉSOLU — 34 tests (5 composants)
12. ~~Tests formulaires 5 étapes~~ ✅ RÉSOLU — 18 tests (2 étapes)

⚠️ **Restants :** Tests composants notaire (mocks complexes), paiement Mobile Money réel, notifications messages offline

---

## 📊 Prochaines étapes prioritaires

1. **Chat pièces jointes** — Envoi images/documents dans les conversations
2. **Notifications messages offline** — Push FCM quand message reçu et destinataire hors ligne
3. **Historique chat paginé** — Pagination + recherche dans l'historique
4. **Tests composants notaire** — ValidationSection, NotairePropertyCard, NotaireActionModals (mocks complexes)
5. **Intégration paiement Mobile Money réelle** — Wave, Orange Money, MTN, Moov, Djamo (laissé de côté pour l'instant)

---

## ⚠️ RAPPEL IMPÉRATIF — Mise à jour des fichiers de suivi

> **À la fin de CHAQUE session de travail, tu DOIS mettre à jour ces fichiers dans cet ordre :**
>
> 1. **`DONE.md`** — Ajouter les tâches complétées avec détails
> 2. **`NOT_DONE.md`** — Marquer les tâches comme faites, ajuster la progression (%)
> 3. **`PLAN.md`** — Mettre à jour les statuts ✅/❌, ajouter l'historique des changements
> 4. **`WORKED_LESSON.md`** — Ajouter toute difficulté rencontrée avec sa leçon apprise
> 5. **`TEST.md`** — Vérifier les tests associés au code modifié, ajouter nouveaux tests
> 6. **`MEMORY.md`** — Mettre à jour le résumé si l'état global a changé
> 7. **`BRAINSTORMING.md`** (ce fichier) — Mettre à jour les problèmes critiques et prochaines étapes
> 8. **`Qwen.md`** — Mettre à jour la section "Audit" si changement majeur
>
> **NE JAMAIS terminer une session sans cette mise à jour.** C'est la mémoire du projet. Sans ça, le contexte est perdu.
>
> **NE JAMAIS commit sans avoir lancé `npx vitest run` + `npm run typecheck`.**

---

*Ce fichier est le point d'entrée unique. Toujours le lire en premier.*
*Dernière mise à jour : 2026-04-10 (session tests massive)*
