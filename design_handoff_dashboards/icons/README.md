# Icônes Homeci — Intégration

## 📦 Fichier prêt à l'emploi

**`HomeciIcons.tsx`** — 64 icônes React/TypeScript prêtes à copier dans le projet.

### Installation

```bash
# Copier le fichier dans le projet :
cp design_handoff_dashboards/icons/HomeciIcons.tsx src/components/icons/HomeciIcons.tsx
```

### Usage

```tsx
import { Villa, Verified, ElephantMark, Bell, Search } from '@/components/icons/HomeciIcons';

// Taille par défaut (24px) avec currentColor (hérite de la couleur parent)
<Villa />

// Taille custom
<Verified size={32} />

// Couleur custom + accent
<Verified size={20} color="#1A0E00" accent="#009E49" />

// Heart avec état rempli (favoris)
<Heart filled={isFav} size={20} />
```

## 📋 Liste des 64 icônes

### Navigation (8)
`Home` · `Search` · `Heart` · `Calendar` · `Bell` · `UserIcon` · `Dashboard` · `Menu`

### Types de bien (8)
`Villa` · `Appartement` · `Terrain` · `Studio` · `Duplex` · `Commercial` · `Bureau` · `Cour`

### Statuts (10)
`Verified` · `Notarise` · `Pending` · `Check` · `Cross` · `Warning` · `Boost` · `ShieldIcon` · `Crown` · `Flag`

### Actions (10)
`Edit` · `Trash` · `Eye` · `Share` · `Download` · `Upload` · `Plus` · `Filter` · `Sort` · `Refresh`

### Communication (6)
`Chat` · `Phone` · `Mail` · `Video` · `Send` · `Megaphone`

### Documents (8)
`DocumentIcon` · `Signed` · `Dossier` · `Receipt` · `Contract` · `IdCard` · `Stamp` · `Book`

### Immobilier (8)
`Bed` · `Bath` · `Area` · `Parking` · `Garden` · `Key` · `Location` · `Elevator`

### Brand Homeci 🇨🇮 (6)
`ElephantMark` · `Kente` · `FlagCI` · `MobileMoney` · `Cocoa` · `Adinkra`

## 🎨 Caractéristiques techniques

- **viewBox** : 24×24
- **stroke** : 1.6 (1.4 pour Adinkra/FlagCI, 1.7 pour Menu, 1.8 pour Plus/Check/Cross/Warning)
- **strokeLinecap** : round
- **Couleur par défaut** : `currentColor` (hérite du parent)
- **Accent** : prop `accent` pour les détails colorés (or, orange, vert CI…)

## 🔄 Migration depuis lucide-react

Stratégie recommandée : remplacer **progressivement** les icônes Lucide par les Homeci sur les éléments **brand-critical** :

| Élément | Avant (Lucide) | Après (Homeci) |
|---|---|---|
| Logo / header | `<Home />` | `<ElephantMark />` ou `<Adinkra />` |
| Bandeau identité CI | `<Flag />` | `<FlagCI />` ou `<Kente />` |
| Badge "Certifié notaire" | `<BadgeCheck />` | `<Notarise />` |
| Badge "Vérifié" | `<ShieldCheck />` | `<Verified />` |
| Boost | `<Zap />` | `<Boost />` |
| Type de bien | `<Building />` | `<Villa />`, `<Appartement />`, etc. |
| Mobile Money / Paiement | `<Wallet />` | `<MobileMoney />` |
| Dossier locataire | `<FolderOpen />` | `<Dossier />` |

Garder Lucide pour le reste (chevrons, X, ...).

## 📖 Référence visuelle

Le fichier `designs/Iconographie Homeci.html` permet :
- de voir toutes les icônes en grille
- de les rechercher par nom ou label français
- de les tester en mode clair/sombre
- de les visualiser en plusieurs tailles (16/20/24/32 px)
