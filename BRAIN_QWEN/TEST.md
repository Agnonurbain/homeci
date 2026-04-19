# 🧪 TEST.md — Règles de mise à jour des tests

> **⚠️ RAPPEL IMPÉRATIF** — À chaque fois que tu modifies du code, tu DOIS mettre à jour les tests associés.
> **Ce fichier DOIT être lu avant chaque commit.**

---

## 📋 Règle d'or

> **Code modifié = Tests mis à jour dans le MÊME commit.**
>
> Pas d'exception. Pas de "je le ferai plus tard".
> Un test qui échoue après un changement de code est un bug de test — **à corriger immédiatement**.

---

## ✅ Checklist avant commit

Après **CHAQUE** modification de code, se poser ces questions :

### 1. Ai-je modifié un composant ?
- [ ] Mettre à jour le fichier `__tests__/` associé
- [ ] Vérifier que les imports du test correspondent aux exports du composant
- [ ] Vérifier que les props/types du test sont à jour

### 2. Ai-je modifié un service ?
- [ ] Mettre à jour `services/__tests__/` associé
- [ ] Vérifier les mocks (appels, arguments, retours)
- [ ] Vérifier les assertions sur les données (`as Record<string, unknown>`)

### 3. Ai-je modifié un hook ?
- [ ] Mettre à jour `hooks/__tests__/` associé
- [ ] Vérifier les mocks de services appelés par le hook

### 4. Ai-je modifié une Cloud Function ?
- [ ] Mettre à jour le test unitaire de la function
- [ ] Vérifier que `functions/src/index.ts` exporte toujours la fonction
- [ ] Si nouveau fichier module → ajouter un test pour ce module

### 5. Ai-je modifié les exports d'un fichier ?
- [ ] Vérifier que les tests qui importent ce fichier fonctionnent encore
- [ ] Vérifier les imports dans les fichiers de test

### 6. Ai-je ajouté/modifié une interface ou un type ?
- [ ] Mettre à jour les mocks qui utilisent ce type
- [ ] Vérifier que les factories (`src/tests/factories.ts`) sont cohérentes

### 7. Ai-je modifié le mock Firebase ?
- [ ] Vérifier que TOUS les tests passent (`npx vitest run`)
- [ ] Le mock est dans `src/tests/firebase.mock.ts` — impact global

---

## 🔍 Fichiers de test par domaine

| Domaine modifié | Fichiers de test à vérifier |
|---|---|
| `src/components/*.tsx` | `src/components/__tests__/*.test.tsx` |
| `src/components/admin/*.tsx` | `src/components/admin/__tests__/*.test.tsx` |
| `src/components/owner/*.tsx` | `src/components/owner/__tests__/*.test.tsx` |
| `src/components/notaire/*.tsx` | `src/components/notaire/__tests__/*.test.tsx` |
| `src/services/*.ts` | `src/services/__tests__/*.test.ts` |
| `src/hooks/*.ts` | `src/hooks/__tests__/*.test.ts` |
| `src/utils/*.ts` | `src/utils/__tests__/*.test.ts` |
| `src/styles/homeci-tokens.ts` | `src/styles/__tests__/homeci-tokens.test.ts` |
| `functions/src/*.ts` | `functions/src/__tests__/cloud-functions.test.ts` |
| `src/tests/firebase.mock.ts` | **TOUS** les tests (impact global) |
| `src/tests/factories.ts` | Tous les tests utilisant des factories |

---

## 🚨 Pièges connus à éviter

### 1. Imports inutilisés après modification
Si tu retires un export d'un module, les tests qui l'importent vont échouer.
**Solution** : Vérifier les imports des fichiers de test après chaque refacto.

### 2. Mock `getDocs` incomplet
Le mock `firestoreMocks.getDocs` attend `{ docs: [...], empty?, size? }`.
Si tu passes juste `{ docs: [] }` → TypeScript échoue.
**Solution** : Cast `as any` ou ajouter `empty: true, size: 0`.

### 3. Mock `mock.calls[0][1]` type error
Accéder directement à `mock.calls[0][1]` cause une erreur TS.
**Solution** : `(mock.calls[0] as unknown[])[1] as Record<string, unknown>`.

### 4. Cloud Functions modulaires
Le fichier `functions/src/index.ts` ne contient plus le code — il re-exporte.
**Solution** : Les tests qui lisent le contenu doivent checker les fichiers modules (`scheduler.ts`, `notifications.ts`, etc.).

### 5. `act` importé de vitest vs testing-library
`act` n'est pas exporté de `vitest`. Il faut l'importer de `@testing-library/react`.
**Solution** : `import { renderHook, act } from '@testing-library/react'`.

---

## 🧪 Commandes de vérification

```bash
# TOUT tester avant commit
npx vitest run

# Tester un seul fichier
npx vitest run src/services/__tests__/propertyService.test.ts

# Tester avec couverture
npm run test:coverage

# Vérifier le typecheck (erreurs TS dans les tests incluses)
npm run typecheck

# Build (vérifie que tout compile)
npm run build
```

---

## 📊 État des tests

| Domaine | Fichiers de test | Couverture |
|---|---|---|
| Composants | 32 fichiers | ~65% |
| Hooks | 14 fichiers | ~75% |
| Services | 18 fichiers | ~75% |
| Utils | 12 fichiers | ~85% |
| Styles | 1 fichier | 100% |
| Data | 1 fichier | 100% |
| Cloud Functions | 2 fichiers (116 tests) | ~90% |
| Pré-lancement | 1 fichier (100 tests) | N/A |

**Total : 109 fichiers de test, 1157 tests (100% passent, 0 erreur TS)**

---

## ⚠️ DERNIÈRE RÈGLE

> Si un test échoue en CI après ton push :
> 1. **Corriger IMMÉDIATEMENT** — pas de "je verrai demain"
> 2. **Comprendre pourquoi** — le test était-il obsolète ou le code est-il bugué ?
> 3. **Mettre à jour ce fichier** si un nouveau piège est découvert

---

*Ce fichier DOIT être mis à jour à chaque nouveau piège identifié.*
*Dernière mise à jour : 2026-04-19 (109 fichiers, 1157 tests, pushHelper ajouté, @vitest-environment node pour fichiers fs/path)*
