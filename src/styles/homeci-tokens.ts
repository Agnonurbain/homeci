/**
 * HOMECI Design Tokens
 * Source unique de vérité pour toutes les couleurs et styles inline.
 * Utiliser ces constantes dans les props style={{}} plutôt que des valeurs hex hardcodées.
 */

// ── Couleurs brutes ───────────────────────────────────────────────────────────
export const HColors = {
  night:       '#0D1F12',
  darkBrown:   '#1A0E00',
  gold:        '#D4A017',
  terracotta:  '#C07C3E',
  green:       '#2D6A4F',
  cream:       '#F5E6C8',
  creamBg:     '#F9F3E8',
  brown:       '#8B6A30',
  brownDark:   '#5A4000',
  brownMid:    '#7A5500',
  brownDeep:   '#7A4200',
  navy:        '#1A3A6B',
  navyDark:    '#1A3A2A',
  bordeaux:    '#8B1D1D',
  white:       '#FFFFFF',
  errorText:   '#FFAAAA',
} as const;

// ── Opacités pré-calculées ────────────────────────────────────────────────────
export const HAlpha = {
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
  green10: 'rgba(45,106,79,0.10)',
  green15: 'rgba(45,106,79,0.15)',
  green20: 'rgba(45,106,79,0.20)',
  green25: 'rgba(45,106,79,0.25)',
  green30: 'rgba(45,106,79,0.30)',
  terra08: 'rgba(192,124,62,0.08)',
  terra10: 'rgba(192,124,62,0.10)',
  terra15: 'rgba(192,124,62,0.15)',
  terra20: 'rgba(192,124,62,0.20)',
  terra22: 'rgba(192,124,62,0.22)',
  terra28: 'rgba(192,124,62,0.28)',
  terra30: 'rgba(192,124,62,0.30)',
  terra35: 'rgba(192,124,62,0.35)',
  navy06:  'rgba(26,58,107,0.06)',
  navy08:  'rgba(26,58,107,0.08)',
  navy18:  'rgba(26,58,107,0.18)',
  navy20:  'rgba(26,58,107,0.20)',
  navy25:  'rgba(26,58,107,0.25)',
  navy30:  'rgba(26,58,107,0.30)',
  bord10:  'rgba(139,29,29,0.10)',
  bord15:  'rgba(139,29,29,0.15)',
  bord20:  'rgba(139,29,29,0.20)',
  bord25:  'rgba(139,29,29,0.25)',
  bord30:  'rgba(139,29,29,0.30)',
  bord35:  'rgba(139,29,29,0.35)',
  brown30: 'rgba(139,106,48,0.30)',
  brown40: 'rgba(139,106,48,0.40)',
  brown50: 'rgba(139,106,48,0.50)',
  brown55: 'rgba(139,106,48,0.55)',
  brown60: 'rgba(139,106,48,0.60)',
  brown65: 'rgba(139,106,48,0.65)',
  cream40: 'rgba(245,230,200,0.40)',
  cream45: 'rgba(245,230,200,0.45)',
  cream50: 'rgba(245,230,200,0.50)',
  cream60: 'rgba(245,230,200,0.60)',
  cream70: 'rgba(245,230,200,0.70)',
} as const;

// ── Polices ───────────────────────────────────────────────────────────────────
export const HFonts = {
  cormorant: 'var(--font-cormorant)' as string,
  nunito:    'var(--font-nunito)'    as string,
} as const;

// ── Styles réutilisables ──────────────────────────────────────────────────────
import type { CSSProperties } from 'react';

export const HS: Record<string, CSSProperties> = {
  // Inputs / Selects
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
  // Labels
  label: {
    color:          'rgba(122,85,0,0.8)',
    fontFamily:     'var(--font-nunito)',
    fontSize:       '0.7rem',
    fontWeight:     700,
    letterSpacing:  '0.06em',
    textTransform:  'uppercase',
  } as CSSProperties,
  labelSm: {
    color:         'rgba(192,124,62,0.85)',
    fontFamily:    'var(--font-nunito)',
    fontSize:      '0.65rem',
    fontWeight:    700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  } as CSSProperties,
  // Titres sections
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
  // Bouton primaire (dégradé or→terracotta)
  btnPrimary: {
    background: 'linear-gradient(135deg,#D4A017,#C07C3E)',
    color:      HColors.night,
    fontFamily: 'var(--font-nunito)',
    fontWeight: 700,
  },
  // Bouton secondaire (outline or)
  btnSecondary: {
    background: 'rgba(212,160,23,0.08)',
    border:     '1px solid rgba(212,160,23,0.2)',
    color:      HColors.brownMid,
    fontFamily: 'var(--font-nunito)',
    fontWeight: 600,
  },
  // Header dark (nuit)
  headerDark: {
    background:  HColors.night,
    borderBottom:'1px solid rgba(212,160,23,0.2)',
  },
  // Fond principal crème
  bgCream: { background: HColors.creamBg },
  // Modal overlay
  overlay: {
    background:    'rgba(0,0,0,0.78)',
    backdropFilter:'blur(4px)',
  },
  // Carte / panel blanc
  card: {
    background: '#ffffff',
    border:     '1px solid rgba(212,160,23,0.15)',
  },
  // Texte corps brun
  textBody: {
    color:      HColors.brownDark,
    fontFamily: 'var(--font-nunito)',
  },
  // Texte subtil
  textMuted: {
    color:      HColors.brown,
    fontFamily: 'var(--font-nunito)',
  },
  // Titre Cormorant crème (sur dark bg)
  titleCream: {
    color:      HColors.cream,
    fontFamily: 'var(--font-cormorant)',
    fontWeight: 700,
  },
  // Titre Cormorant sombre (sur light bg)
  titleDark: {
    color:      HColors.darkBrown,
    fontFamily: 'var(--font-cormorant)',
    fontWeight: 700,
  },
};

// ── Kente stripe colors ───────────────────────────────────────────────────────
export const KENTE_COLORS = [
  '#D4A017','#2D6A4F','#C07C3E','#7B1D1D',
  '#D4A017','#2D6A4F','#C07C3E','#7B1D1D',
  '#D4A017','#2D6A4F','#C07C3E','#7B1D1D',
  '#D4A017','#2D6A4F','#C07C3E','#7B1D1D',
  '#D4A017','#2D6A4F','#C07C3E','#7B1D1D',
  '#D4A017','#2D6A4F',
] as const;
