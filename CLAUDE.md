## RTK (Rust Token Killer)

Use `rtk` as a proxy for shell commands to reduce token usage (60-90% savings).
Hook-based: `git status`, `ls`, `find`, `grep`, `cat`, `wc` are automatically rewritten to `rtk <cmd>`.

- `rtk gain` — show token savings analytics
- `rtk gain --history` — command usage history with savings
- `rtk discover` — find missed optimization opportunities
- `rtk proxy <cmd>` — execute raw command without filtering (debugging)

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## UI/UX Pro Max

Design system persisté dans `design-system/homeci/MASTER.md`. Palette : Orange CI (#FF6B00) + Vert CI (#009E49) + Gold (#D4A017). Typo : Cormorant Garamond (headings) / Nunito (body). Pattern : Marketplace/Directory. Tokens : `src/styles/homeci-tokens.ts`.

- Avant tout travail UI, lire `design-system/homeci/MASTER.md`
- Pour une page spécifique, vérifier d'abord `design-system/homeci/pages/{page}.md` (override le Master si présent)
- Icônes : Lucide React (déjà installé), jamais d'emojis comme icônes
- `cursor-pointer` sur tous les éléments cliquables
- Transitions hover : 150-300ms
- Tester responsive : 375px, 768px, 1024px, 1440px

## Stop-Slop

Avant de rédiger ou modifier de la documentation :
- Pas de filler phrases ni throat-clearing ("Il est important de noter que...")
- Voix active, sujet humain. Pas de passif ni d'objets inanimés comme sujets
- Pas d'adverbes. Pas de em-dashes. Pas de listes de 3 (préférer 2)
- Pas de pull-quotes ni de phrases punchlines en fin de paragraphe
- Score minimum 35/50 (Directness, Rhythm, Trust, Authenticity, Density)

## Security Review

Lancer `/security-review` avant chaque PR touchant :
- Firestore rules (`firestore.rules`, `storage.rules`)
- Cloud Functions (`functions/src/`)
- Auth/session (`AuthContext`, `AdminLogin`, `AdminAccessCode`)
- Upload fichiers (`useImageUpload`, `fileScanner`, `storageService`)
- Paiements (`PaymentModal`, `movapayService`)

## Code Review

Lancer `/code-review` sur chaque PR. Niveaux : low/medium (findings haute confiance), high/max (couverture large), ultra (multi-agent cloud).
- `--comment` pour poster les findings en commentaires inline sur la PR
- `--fix` pour appliquer les corrections au working tree

## Repo Recap

`/repo-recap` pour générer un récap structuré : PRs ouvertes, issues, releases, résumé exécutif.
- Output Markdown avec liens GitHub cliquables
- Défaut en français, `en` pour anglais

## Issue Triage

`/issue-triage` pour auditer les issues ouvertes. 3 phases : audit → deep analysis → actions.
- Détection doublons (Jaccard > 60%)
- Classification risque (rouge/jaune/vert)
- Staleness (>30j stale, >90j very stale)
- Commentaires GitHub toujours en anglais

## Vercel

Frontend déployé sur Vercel. Projet : `homeci-prod-72e4b` (Firebase) + Vercel (CDN).
- `/vercel:deploy` — déployer (ajouter `prod` pour production)
- `/vercel:status` — diagnostic complet du projet
- `/vercel:env` — gérer les variables d'environnement
- Actions en attente : `vercel link`, installer `@vercel/analytics` + `@vercel/speed-insights`
