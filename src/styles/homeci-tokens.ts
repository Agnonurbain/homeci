/**
 * HOMECI Design Tokens — v4 (Palette Drapeau Ivoirien 🇨🇮)
 * Source unique de vérité pour toutes les couleurs et styles inline.
 */
import type { CSSProperties } from 'react';

// ── Couleurs brutes ───────────────────────────────────────────────────────────
export const HColors = {
  // Palette primaire CI
  orangeCI:    '#FF6B00',
  vertCI:      '#009E49',
  blanc:       '#FFFFFF',

  // Fonds sombres
  night:       '#0A3D1F',
  darkForest:  '#0D2F15',
  darkBrown:   '#1A0E00',

  // Accents
  gold:        '#D4A017',
  forest:      '#1B5E3A',
  green:       '#2D6A4F',
  terracotta:  '#C07C3E',

  // Neutres
  cream:       '#F5E6C8',
  creamBg:     '#FFF8ED',
  terre:       '#F5E6C8',
  bois:        '#5C3D1E',
  brown:       '#8B6A30',
  brownDark:   '#5A4000',
  brownMid:    '#7A5500',
  brownDeep:   '#7A4200',

  // Statuts
  bordeaux:    '#8B1D1D',
  navy:        '#1A3A6B',
  navyDark:    '#1A3A2A',
  white:       '#FFFFFF',
  errorText:   '#FFAAAA',
} as const;

// ── Opacités pré-calculées ────────────────────────────────────────────────────
export const HAlpha = {
  // Orange CI
  orange05: 'rgba(255,107,0,0.05)',
  orange08: 'rgba(255,107,0,0.08)',
  orange10: 'rgba(255,107,0,0.10)',
  orange15: 'rgba(255,107,0,0.15)',
  orange20: 'rgba(255,107,0,0.20)',
  orange25: 'rgba(255,107,0,0.25)',
  orange30: 'rgba(255,107,0,0.30)',
  // Vert CI
  vertCI10: 'rgba(0,158,73,0.10)',
  vertCI15: 'rgba(0,158,73,0.15)',
  vertCI20: 'rgba(0,158,73,0.20)',
  vertCI25: 'rgba(0,158,73,0.25)',
  vertCI30: 'rgba(0,158,73,0.30)',
  // Or
  gold02:  'rgba(212,160,23,0.02)',
  gold05:  'rgba(212,160,23,0.05)',
  gold08:  'rgba(212,160,23,0.08)',
  gold10:  'rgba(212,160,23,0.10)',
  gold12:  'rgba(212,160,23,0.12)',
  gold15:  'rgba(212,160,23,0.15)',
  gold18:  'rgba(212,160,23,0.18)',
  gold20:  'rgba(212,160,23,0.20)',
  gold25:  'rgba(212,160,23,0.25)',
  gold30:  'rgba(212,160,23,0.30)',
  gold35:  'rgba(212,160,23,0.35)',
  gold40:  'rgba(212,160,23,0.40)',
  gold50:  'rgba(212,160,23,0.50)',
  // Vert classique
  green10: 'rgba(45,106,79,0.10)',
  green15: 'rgba(45,106,79,0.15)',
  green20: 'rgba(45,106,79,0.20)',
  green25: 'rgba(45,106,79,0.25)',
  green30: 'rgba(45,106,79,0.30)',
  // Terracotta
  terra08: 'rgba(192,124,62,0.08)',
  terra10: 'rgba(192,124,62,0.10)',
  terra15: 'rgba(192,124,62,0.15)',
  terra20: 'rgba(192,124,62,0.20)',
  terra22: 'rgba(192,124,62,0.22)',
  terra28: 'rgba(192,124,62,0.28)',
  terra30: 'rgba(192,124,62,0.30)',
  terra35: 'rgba(192,124,62,0.35)',
  // Navy
  navy06:  'rgba(26,58,107,0.06)',
  navy08:  'rgba(26,58,107,0.08)',
  navy18:  'rgba(26,58,107,0.18)',
  navy20:  'rgba(26,58,107,0.20)',
  navy25:  'rgba(26,58,107,0.25)',
  navy30:  'rgba(26,58,107,0.30)',
  // Bordeaux
  bord10:  'rgba(139,29,29,0.10)',
  bord15:  'rgba(139,29,29,0.15)',
  bord20:  'rgba(139,29,29,0.20)',
  bord25:  'rgba(139,29,29,0.25)',
  bord30:  'rgba(139,29,29,0.30)',
  bord35:  'rgba(139,29,29,0.35)',
  // Brown
  brown30: 'rgba(139,106,48,0.30)',
  brown40: 'rgba(139,106,48,0.40)',
  brown50: 'rgba(139,106,48,0.50)',
  brown55: 'rgba(139,106,48,0.55)',
  brown60: 'rgba(139,106,48,0.60)',
  brown65: 'rgba(139,106,48,0.65)',
  // Cream
  cream40: 'rgba(245,230,200,0.40)',
  cream45: 'rgba(245,230,200,0.45)',
  cream50: 'rgba(245,230,200,0.50)',
  cream60: 'rgba(245,230,200,0.60)',
  cream70: 'rgba(245,230,200,0.70)',
  // White
  white05: 'rgba(255,255,255,0.05)',
  white10: 'rgba(255,255,255,0.10)',
  white20: 'rgba(255,255,255,0.20)',
  white30: 'rgba(255,255,255,0.30)',
  white50: 'rgba(255,255,255,0.50)',
  white70: 'rgba(255,255,255,0.70)',
} as const;

// ── Polices ───────────────────────────────────────────────────────────────────
export const HFonts = {
  cormorant: 'var(--font-cormorant)' as string,
  nunito:    'var(--font-nunito)'    as string,
} as const;

// ── Gradients ─────────────────────────────────────────────────────────────────
export const HGradients = {
  hero:     'linear-gradient(160deg, #0A3D1F 0%, #0D2F15 60%, #1A0E00 100%)',
  cta:      'linear-gradient(135deg, #FF6B00, #D4A017)',
  verified: 'linear-gradient(135deg, #009E49, #2D6A4F)',
} as const;

// ── Styles réutilisables ──────────────────────────────────────────────────────
export const HS: Record<string, CSSProperties> = {
  input: {
    background: 'rgba(255,255,255,0.75)',
    border:     '1px solid rgba(212,160,23,0.25)',
    color:      HColors.darkBrown,
    fontFamily: 'var(--font-nunito)',
  },
  inputDisabled: {
    background: 'rgba(255,255,255,0.4)',
    border:     '1px solid rgba(212,160,23,0.12)',
    color:      'rgba(26,14,0,0.4)',
    fontFamily: 'var(--font-nunito)',
  },
  label: {
    color:         'rgba(122,85,0,0.8)',
    fontFamily:    'var(--font-nunito)',
    fontSize:      '0.7rem',
    fontWeight:    700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  } as CSSProperties,
  labelSm: {
    color:         'rgba(192,124,62,0.85)',
    fontFamily:    'var(--font-nunito)',
    fontSize:      '0.65rem',
    fontWeight:    700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  } as CSSProperties,
  secTitle: {
    color:      HColors.darkBrown,
    fontFamily: 'var(--font-cormorant)',
    fontSize:   '1.15rem',
    fontWeight: 700,
  },
  secSub: {
    color:      HColors.brown,
    fontFamily: 'var(--font-nunito)',
    fontSize:   '0.8rem',
  },
  btnPrimary: {
    background: HGradients.cta,
    color:      '#FFFFFF',
    fontFamily: 'var(--font-nunito)',
    fontWeight: 700,
  },
  btnSecondary: {
    background: 'rgba(255,107,0,0.08)',
    border:     '1px solid rgba(255,107,0,0.2)',
    color:      HColors.orangeCI,
    fontFamily: 'var(--font-nunito)',
    fontWeight: 600,
  },
  headerDark: {
    background:  HColors.night,
    borderBottom:'1px solid rgba(212,160,23,0.15)',
  },
  bgCream: { background: HColors.creamBg },
  overlay: {
    background:    'rgba(0,0,0,0.78)',
    backdropFilter:'blur(4px)',
  },
  card: {
    background: '#ffffff',
    border:     '1px solid rgba(212,160,23,0.15)',
  },
  textBody: {
    color:      HColors.bois,
    fontFamily: 'var(--font-nunito)',
  },
  textMuted: {
    color:      HColors.brown,
    fontFamily: 'var(--font-nunito)',
  },
  titleCream: {
    color:      HColors.cream,
    fontFamily: 'var(--font-cormorant)',
    fontWeight: 700,
  },
  titleDark: {
    color:      HColors.darkBrown,
    fontFamily: 'var(--font-cormorant)',
    fontWeight: 700,
  },
};

// ── Kente stripe colors (drapeau CI 🇨🇮) ─────────────────────────────────────
export const KENTE_COLORS = [
  '#FF6B00','#009E49','#FFFFFF','#D4A017',
  '#FF6B00','#009E49','#FFFFFF','#D4A017',
  '#FF6B00','#009E49','#FFFFFF','#D4A017',
  '#FF6B00','#009E49','#FFFFFF','#D4A017',
  '#FF6B00','#009E49','#FFFFFF','#D4A017',
  '#FF6B00','#009E49',
] as const;
