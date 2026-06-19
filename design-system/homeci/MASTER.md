# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** HOMECI
**Updated:** 2026-06-19
**Category:** Real Estate / Marketplace B2C — Cote d'Ivoire

---

## Global Rules

### Color Palette (Drapeau Ivoirien)

Source of truth: `src/styles/homeci-tokens.ts`

| Role | Hex | Token | Usage |
|------|-----|-------|-------|
| Orange CI | `#FF6B00` | `HColors.orangeCI` | CTA, accents, badges actifs |
| Orange Dark | `#AF4B00` | `HColors.orangeDark` | Texte accessible sur fond clair (4.5:1+) |
| Vert CI | `#009E49` | `HColors.vertCI` | Verified, success, statuts positifs |
| Vert Dark | `#007536` | `HColors.vertDark` | Texte accessible sur fond clair (4.5:1+) |
| Gold | `#D4A017` | `HColors.gold` | Labels, titres chiffres, accents premium |
| Night | `#0A3D1F` | `HColors.night` | Fond principal (header, hero, footer, sidebar) |
| Dark Brown | `#1A0E00` | `HColors.darkBrown` | Fond secondaire, overlay |
| Cream | `#F5E6C8` | `HColors.cream` | Texte sur fond sombre |
| Cream BG | `#FFF8ED` | `HColors.creamBg` | Fond clair des pages |
| Bordeaux | `#8B1D1D` | `HColors.bordeaux` | Erreur, danger, suppression |
| Terracotta | `#C07C3E` | `HColors.terracotta` | Accent chaud secondaire |
| White | `#FFFFFF` | `HColors.white` | Texte sur fond sombre, cards |

**Gradients:**
- Hero: `linear-gradient(160deg, #0A3D1F, #0D2F15 60%, #1A0E00)` — `HGradients.hero`
- CTA: `linear-gradient(135deg, #FF6B00, #D4A017)` — `HGradients.cta`
- Verified: `linear-gradient(135deg, #009E49, #2D6A4F)` — `HGradients.verified`

**Couleurs interdites (Tailwind off-brand):**
- `blue-*` (blue-50, blue-400, blue-500, blue-600, blue-700) — Remplacer par `vertCI` ou `gold`
- `gray-*` (gray-50, gray-200, gray-400, gray-700) — Remplacer par les alphas HOMECI (`HAlpha.gold*`, `HAlpha.cream*`)
- `green-*` (emerald-50, etc.) — Remplacer par `HAlpha.vertCI*`

### Typography

- **Heading Font:** Cormorant Garamond (`--font-cormorant`)
- **Body Font:** Nunito (`--font-nunito`)
- **Mood:** Africain, élégant, notarial, premium, confiance

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Nunito:wght@400;500;600;700&display=swap');
```

### Spacing (Tailwind scale)

| Token | Tailwind | Usage |
|-------|----------|-------|
| 1 (4px) | `p-1` | Tight gaps |
| 2 (8px) | `p-2` | Icon gaps, inline |
| 4 (16px) | `p-4` | Standard padding |
| 6 (24px) | `p-6` | Section padding |
| 8 (32px) | `p-8` | Large gaps |
| 12 (48px) | `p-12` | Section margins |
| 16 (64px) | `p-16` | Hero padding |

### Z-Index Scale

| Level | Value | Usage |
|-------|-------|-------|
| Base | `z-[1]` | Éléments positionnés |
| Dropdown | `z-[20]` | Menus, autocomplete |
| Sticky | `z-50` | Header, sidebar |
| Modal | `z-[60]` | Modals |
| Toast | `z-[70]` | Notifications toast |
| Critical | `z-[100]` | Logout confirm, overlays critiques |

---

## Component Specs

### Buttons

```tsx
// Primary — gradient CTA
style={{ background: HGradients.cta, color: '#FFFFFF', fontFamily: 'var(--font-nunito)', fontWeight: 700 }}
className="rounded-xl py-3 px-6 transition-all hover:opacity-90"

// Secondary — orange subtil
style={{ background: HAlpha.orange08, border: `1px solid ${HAlpha.orange20}`, color: HColors.orangeDark }}
className="rounded-xl py-3 px-6 transition-all hover:opacity-80"

// Danger — bordeaux
style={{ background: HColors.bordeaux, color: HColors.white }}
className="rounded-xl py-3 px-6 transition-all hover:opacity-90"
```

### Cards

```tsx
style={{ background: '#ffffff', border: `1px solid ${HAlpha.gold15}` }}
className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
```

### Inputs

```tsx
style={HS.input}  // ou { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(212,160,23,0.25)' }
className="px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#D4A017]/40"
```

### Modals

```tsx
// Overlay
className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]"

// Modal body
style={{ background: HColors.night, border: `1px solid ${HAlpha.gold30}` }}
className="rounded-2xl max-w-md w-full p-6 shadow-2xl"
```

### Labels

```tsx
style={HS.label}  // color: #604200, uppercase, font-nunito, 0.7rem, bold
className="block mb-1"
```

---

## Style Guidelines

**Visual Identity:** Drapeau Ivoirien — Orange, Vert, Blanc, Or.
**Pattern:** Kente Line (`<KenteLine height={3} />`) en séparateur signature.
**Motif:** BaoulePattern (losanges SVG) en watermark subtil.
**Mascotte:** Éléphant (HomeCIEmblem) en watermark.

### Page Pattern: Marketplace / Directory

- **Section Order:** Hero (Search) → Categories → Featured Listings → Trust/Safety → CTA
- **CTA Principal:** Barre de recherche hero avec NLP
- **CTA Secondaire:** "Publier un bien" dans le header

---

## Anti-Patterns

- Emojis comme icônes UI — Utiliser Lucide React uniquement
- `cursor: default` sur éléments interactifs — Géré globalement via CSS
- `outline-none` sans focus ring — Toujours ajouter `focus:ring-2 focus:ring-[#D4A017]/40`
- Couleurs Tailwind brutes (`blue-*`, `gray-*`) — Utiliser les tokens HColors/HAlpha
- Layout-shifting hovers (scale qui décale les voisins)
- `z-index` hors de l'échelle définie ci-dessus

---

## Pre-Delivery Checklist

- [ ] Pas d'emojis comme icônes (SVG Lucide uniquement)
- [ ] Icônes d'un set unique (Lucide React)
- [ ] `cursor-pointer` via CSS global (pas besoin de le mettre manuellement)
- [ ] Hover avec transitions 150-300ms
- [ ] Contraste texte 4.5:1 minimum
- [ ] Focus rings visibles (`focus:ring-2 focus:ring-[#D4A017]/40`)
- [ ] `prefers-reduced-motion` respecté (CSS global)
- [ ] Responsive : 375px, 768px, 1024px, 1440px
- [ ] Pas de contenu caché derrière le header sticky
- [ ] Pas de scroll horizontal sur mobile
- [ ] Couleurs exclusivement depuis `homeci-tokens.ts`
- [ ] Polices : `--font-cormorant` (titres) + `--font-nunito` (body)
