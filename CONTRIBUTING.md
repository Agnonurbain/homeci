# Contribuer à HOMECI

Merci de votre intérêt pour HOMECI — la plateforme immobilière certifiée par notaire pour la Côte d'Ivoire.

---

## 📋 Table des matières

1. [Code de conduite](#code-de-conduite)
2. [Comment contribuer](#comment-contribuer)
3. [Setup du projet](#setup-du-projet)
4. [Branches et commits](#branches-et-commits)
5. [Tests](#tests)
6. [Architecture](#architecture)
7. [Review de PR](#review-de-pr)
8. [Déploiement](#déploiement)

---

## Code de conduite

- Respectez les conventions de code existantes
- Écrivez des tests pour chaque nouvelle fonctionnalité
- Commentez en anglais le code, les messages de commit en anglais
- Les UI strings sont en français

---

## Comment contribuer

### 1. Trouver quelque chose à faire
- Voir `BRAIN_QWEN/NOT_DONE.md` pour les tâches restantes
- Voir `BRAIN_QWEN/PLAN.md` pour le plan complet
- Voir `BRAIN_QWEN/WORKED_LESSON.md` pour les pièges connus

### 2. Forker et cloner
```bash
git clone https://github.com/Agnonurbain/homeci.git
cd homeci
```

### 3. Créer une branche
```bash
git checkout -b feat/ma-fonctionnalite
```

### 4. Développer et tester
```bash
npm run dev          # Serveur local
npm run typecheck    # TypeScript
npm test             # Tests
npm run lint         # Linter
```

### 5. Commiter
```bash
git add -A
git commit -m "feat(domaine): description de la fonctionnalité"
```

### 6. Pusher et créer une PR
```bash
git push origin feat/ma-fonctionnalite
```

---

## Setup du projet

### Prérequis
- Node.js 24+
- npm

### Installation
```bash
npm install
```

### Variables d'environnement
Copier `.env.example` vers `.env` et configurer les variables Firebase.

### Lancer en local
```bash
npm run dev          # Vite HMR
npm run typecheck    # TypeScript
npm test             # Vitest
```

---

## Branches et commits

### Convention de nommage des branches
- `feat/nom-de-la-fonctionnalite`
- `fix/description-du-bug`
- `docs/description-de-la-doc`
- `refactor/description-du-refacto`

### Convention de commits
Format : `type(scope): description`

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `perf` | Amélioration de performance |
| `refactor` | Refacto sans changement fonctionnel |
| `test` | Ajout/modification de tests |
| `docs` | Documentation |
| `ci` | Changements CI/CD |
| `chore` | Maintenance, deps, etc. |

Exemples :
```
feat(admin): ajout onglet export CSV
fix(chat): correction pagination messages
docs: mettre à jour ARCHITECTURE.md
test(notaire): +15 tests ValidationSection
```

---

## Tests

### Règles impératives
1. **Code modifié = Tests mis à jour dans le MÊME commit**
2. **Pas de commit sans `npm test` + `npm run typecheck`**
3. Husky bloque automatiquement si lint/typecheck/test échouent

### Lancer les tests
```bash
npm test                          # Tous les tests
npm test -- src/components/...    # Un dossier
npx vitest run --coverage         # Avec couverture
```

### Couverture
- `src/utils/` — ciblée
- `src/services/` — ciblée
- `src/hooks/` — ciblée

---

## Architecture

Voir les fichiers suivants pour comprendre le projet :
- `QWEN.md` — Conventions, stack, règles de code
- `BRAIN_QWEN/` — Documentation projet complète
- `ARCHITECTURE.md` — Architecture technique, schémas Firestore
- `DEPLOY.md` — Guide de déploiement

### Structure
```
homeci/
├── src/
│   ├── components/       # Composants React
│   │   ├── admin/        # Dashboard admin
│   │   ├── owner/        # Dashboard propriétaire
│   │   ├── notaire/      # Dashboard notaire
│   │   ├── tenant/       # Dashboard locataire
│   │   └── chat/         # Messagerie
│   ├── services/         # Services Firestore
│   ├── hooks/            # Hooks custom
│   ├── utils/            # Utilitaires
│   └── tests/            # Infrastructure de test
├── functions/            # Cloud Functions v2
├── BRAIN_QWEN/           # Documentation projet
└── .github/workflows/    # CI/CD
```

---

## Review de PR

### Checklist
- [ ] `npm run lint` passe
- [ ] `npm run typecheck` passe
- [ ] `npm test` passe (100%)
- [ ] Pas de `any` non justifié
- [ ] Pas de `HColors.green` / `HColors.terracotta` dans le code nouveau
- [ ] Tests ajoutés pour les nouvelles fonctionnalités
- [ ] Fichiers de suivi mis à jour si changement majeur

---

## Déploiement

### Frontend (Vercel)
Push sur `main` → déploiement automatique.

### Cloud Functions
```bash
cd functions && npm run build
firebase deploy --only functions
```

### Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Storage Rules
```bash
firebase deploy --only storage
```

---

## Questions ?

- Voir `BRAIN_QWEN/WORKED_LESSON.md` pour les pièges connus
- Voir `QWEN.md` pour les règles de code
- Voir `ARCHITECTURE.md` pour l'architecture technique
