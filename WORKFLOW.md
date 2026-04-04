# HOMECI — Workflow de Développement

> Protocoles standardisés pour toute session de développement sur HOMECI.

## Commandes de session

### /init — Initialisation
Avant toute session de travail :
```bash
cd homeci
git pull origin main
npm install
npx vitest run           # Vérifier que la base est saine
npx vite build           # Vérifier que le build passe
```

### /plan — Planification d'une fonctionnalité
Avant de coder, documenter :
1. **Objectif** : Que doit faire la fonctionnalité ?
2. **Fichiers impactés** : Lister les fichiers à créer/modifier
3. **Dépendances** : Quels services/hooks existants sont concernés ?
4. **Tests** : Quels scénarios tester ?
5. **Risques** : Y a-t-il un impact sur les données existantes ?

### /review — Revue avant commit
```bash
# 1. Tests
npx vitest run

# 2. Build
npx vite build

# 3. Palette CI (zéro anciennes couleurs)
grep -rn "HColors\.green\b" src/components/ | grep -v vertCI
grep -rn "HColors\.terracotta\b" src/components/

# 4. Doublons d'import
for f in src/components/*.tsx; do
  grep "^import.*from" "$f" | sort | uniq -d
done

# 5. TypeScript strict
grep -rn "@ts-ignore" src/

# 6. Console.log oubliés (hors debug)
grep -rn "console\.log" src/ --include="*.tsx" --include="*.ts" | grep -v test | grep -v mock
```

### /security-review — Audit sécurité
```bash
# 1. Règles Firestore
cat firestore.rules | grep -c "allow.*write"
# Vérifier que chaque write a une condition

# 2. Clés exposées
grep -rn "apiKey\|secret\|password\|token" src/ --include="*.ts" --include="*.tsx" | grep -v test | grep -v mock | grep -v ".env"

# 3. XSS potential
grep -rn "dangerouslySetInnerHTML\|innerHTML" src/

# 4. CORS/Headers
cat vercel.json | grep -A2 "header"

# 5. Storage rules - identity files
grep "identity" storage.rules
```

### /compact — Résumé de session
À la fin de chaque session, générer :
```
## Session [DATE]
### Complété
- [ ] Feature X (fichiers: A.tsx, B.ts)
- [ ] Fix Y (fichier: C.tsx)

### État des tests
- Fichiers: X | Tests: Y | Échoués: 0

### Décisions prises
- Raison du choix A sur B

### TODO pour prochaine session
- [ ] Feature Z
- [ ] Fix W
```

### /cost — Vérification contexte
Fichiers à **toujours** inclure dans le contexte :
- `CLAUDE.md` (règles)
- `src/styles/homeci-tokens.ts` (palette)
- `src/types/property.ts` (types centraux)

Fichiers à **exclure** du contexte :
- `package-lock.json` (300KB+ de bruit)
- `dist/` (output de build)
- `node_modules/`
- `functions/lib/` (output compilé)
- Fichiers de test sauf ceux en cours de modification

## Protocole Search > Plan > Execute > Verify

Pour toute fonctionnalité non triviale :

### 1. SEARCH (Explorer)
```
Quels fichiers existants sont concernés ?
Quels services/hooks manipulent ces données ?
Y a-t-il des tests existants ?
```

### 2. PLAN (Documenter)
```
Créer/modifier quels fichiers ?
Dans quel ordre ?
Impact sur les règles Firestore ?
Impact sur les tests existants ?
```

### 3. EXECUTE (Coder)
```
Écrire le code en suivant CLAUDE.md
Un commit par unité logique
```

### 4. VERIFY (Valider)
```
npx vitest run → 0 échec
npx vite build → 0 erreur
Tester manuellement si UI impactée
```

## Checklist de déploiement

### Avant push
- [ ] `npx vitest run` — tous les tests passent
- [ ] `npx vite build` — build sans erreur
- [ ] Pas de `console.log` de debug
- [ ] Pas de clé/secret hardcodée

### Si Firestore rules modifiées
- [ ] `firebase deploy --only firestore:rules`
- [ ] Tester les accès depuis chaque rôle

### Si Storage rules modifiées
- [ ] `firebase deploy --only storage`

### Si Cloud Functions modifiées
- [ ] `cd functions && npm run build` — compilation OK
- [ ] `firebase deploy --only functions`

### Si nouvelle collection Firestore
- [ ] Ajouter les règles dans `firestore.rules`
- [ ] Créer le service dans `src/services/`
- [ ] Mettre à jour `ARCHITECTURE.md`
- [ ] Ajouter les mocks dans `firebase.mock.ts`
