/**
 * HomeciIcons.tsx — Système d'icônes Homeci 🇨🇮
 *
 * 64 icônes SVG custom dessinées dans la DNA Homeci :
 *   • viewBox 24×24 · stroke 1.6 · linecap rond
 *   • currentColor par défaut (héritent de la couleur du parent)
 *   • prop "accent" pour les détails colorés (or, orange, vert CI…)
 *
 * Usage:
 *   import { Villa, Verified, ElephantMark } from '@/components/icons/HomeciIcons';
 *   <Villa size={24} />
 *   <Verified size={20} color="#1A0E00" accent="#009E49" />
 *
 * Catégories:
 *   • Navigation        : Home, Search, Heart, Calendar, Bell, UserIcon, Dashboard, Menu
 *   • Types de bien     : Villa, Appartement, Terrain, Studio, Duplex, Commercial, Bureau, Cour
 *   • Statuts           : Verified, Notarise, Pending, Check, Cross, Warning, Boost, ShieldIcon, Crown, Flag
 *   • Actions           : Edit, Trash, Eye, Share, Download, Upload, Plus, Filter, Sort, Refresh
 *   • Communication     : Chat, Phone, Mail, Video, Send, Megaphone
 *   • Documents         : DocumentIcon, Signed, Dossier, Receipt, Contract, IdCard, Stamp, Book
 *   • Immobilier        : Bed, Bath, Area, Parking, Garden, Key, Location, Elevator
 *   • Brand Homeci      : ElephantMark, Kente, FlagCI, MobileMoney, Cocoa, Adinkra
 */

import { SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  size?: number;
  color?: string;
  accent?: string;
}

const baseProps = {
  fill: 'none' as const,
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/* ══════════════════════════════════════════════════════════════════
   NAVIGATION (8)
   ══════════════════════════════════════════════════════════════════ */

export const Home = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M3 11.5L12 4l9 7.5" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </svg>
);

export const Search = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.35-4.35" />
    <circle cx="10.5" cy="10.5" r="2" fill={accent} stroke="none" opacity="0.4" />
  </svg>
);

export const Heart = ({
  size = 24, color = 'currentColor', accent = '#FF6B00', filled = false, ...rest
}: IconProps & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? accent : 'none'}
    stroke={filled ? accent : color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    <path d="M12 21s-7.5-4.5-9.5-9.5C1 7.5 4 4 7.5 4c2 0 3.5 1 4.5 2.5C13 5 14.5 4 16.5 4 20 4 23 7.5 21.5 11.5 19.5 16.5 12 21 12 21z" />
  </svg>
);

export const Calendar = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17" />
    <path d="M8 3v4M16 3v4" />
    <circle cx="8.5" cy="14" r="1.2" fill={accent} stroke="none" />
    <circle cx="12" cy="14" r="1.2" fill={color} stroke="none" opacity="0.3" />
    <circle cx="15.5" cy="14" r="1.2" fill={color} stroke="none" opacity="0.3" />
  </svg>
);

export const Bell = ({ size = 24, color = 'currentColor', accent = '#FF6B00', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M6 17V11.5a6 6 0 1 1 12 0V17l1.5 2H4.5z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
    <circle cx="18" cy="6.5" r="2.2" fill={accent} stroke="none" />
  </svg>
);

export const UserIcon = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" />
  </svg>
);

export const Dashboard = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" fill={accent} fillOpacity="0.15" stroke={accent} />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
  </svg>
);

export const Menu = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={1.7} strokeLinecap="round" {...rest}>
    <path d="M4 7h16M4 12h12M4 17h16" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════
   PROPERTY TYPES (8)
   ══════════════════════════════════════════════════════════════════ */

export const Villa = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M2 12L12 4l10 8" />
    <path d="M4 11v9h6v-5h4v5h6v-9" />
    <path d="M9 9h6" stroke={accent} strokeWidth={1.8} />
    <circle cx="17" cy="6" r="0.8" fill={accent} stroke="none" />
  </svg>
);

export const Appartement = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <rect x="5" y="3" width="14" height="18" rx="1.5" />
    <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
    <path d="M11 21v-3h2v3" fill={accent} fillOpacity="0.25" />
  </svg>
);

export const Terrain = ({ size = 24, color = 'currentColor', accent = '#009E49', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M3 18h18" />
    <path d="M5 18l2-7 5 4 4-9 5 12" stroke={accent} />
    <circle cx="7" cy="11" r="0.8" fill={accent} stroke="none" />
    <circle cx="16" cy="6" r="0.8" fill={accent} stroke="none" />
  </svg>
);

export const Studio = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <rect x="3" y="6" width="18" height="14" rx="1.5" />
    <path d="M3 11h18" />
    <path d="M7 6V4M17 6V4" />
  </svg>
);

export const Duplex = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M3 13L12 6l9 7" />
    <path d="M5 12v8h14v-8" />
    <path d="M5 16h14" stroke={accent} />
    <path d="M11 20v-3h2v3" />
  </svg>
);

export const Commercial = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M3 8L4.5 4.5h15L21 8" />
    <path d="M5 8v12h14V8" />
    <path d="M9 14h6v6H9z" />
    <circle cx="12" cy="11" r="0.8" fill={accent} stroke="none" />
  </svg>
);

export const Bureau = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <rect x="3" y="4" width="18" height="16" rx="1.5" />
    <path d="M3 9h18M9 9v11M15 9v11" />
  </svg>
);

export const Cour = ({ size = 24, color = 'currentColor', accent = '#009E49', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <rect x="3" y="6" width="18" height="15" rx="1.5" />
    <path d="M3 12h18" />
    <circle cx="8" cy="16.5" r="1.5" fill={accent} fillOpacity="0.3" stroke={accent} />
    <circle cx="16" cy="16.5" r="1.5" fill={accent} fillOpacity="0.3" stroke={accent} />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════
   STATUTS (10)
   ══════════════════════════════════════════════════════════════════ */

export const Verified = ({ size = 24, color = 'currentColor', accent = '#009E49', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M12 2.5l2.5 1.7 3-.4 1.5 2.6 2.5 1.6L21 11l1 3-2 2.4 0 3-3 1-1.5 2.6-3-.4L12 24l-2.5-1.4-3 .4L5 20.4l-3-1 0-3L0 14l1.5-3-1.5-3 2.5-1.6L4 4l3 .4L9 2.7z" />
    <path d="m9 12 2 2 4-4" stroke={accent} strokeWidth={2} />
  </svg>
);

export const Notarise = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <circle cx="12" cy="10" r="6.5" fill={accent} fillOpacity="0.12" />
    <path d="M9 9.5l2 2 4-4" stroke={accent} strokeWidth={2} />
    <path d="M5 19l1.5-3M19 19l-1.5-3M12 16.5V21" />
    <path d="M6 21h12" />
  </svg>
);

export const Pending = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" stroke={accent} strokeWidth={1.8} />
  </svg>
);

export const Check = ({ size = 24, color = '#009E49', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    <circle cx="12" cy="12" r="9" fill="#009E49" fillOpacity="0.12" />
    <path d="m8 12.5 2.5 2.5L16 9.5" />
  </svg>
);

export const Cross = ({ size = 24, color = '#8B1D1D', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    <circle cx="12" cy="12" r="9" fill="#8B1D1D" fillOpacity="0.12" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </svg>
);

export const Warning = ({ size = 24, color = '#FF6B00', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    <path d="M12 3 2.5 20h19z" fill="#FF6B00" fillOpacity="0.12" />
    <path d="M12 9.5v4.5" />
    <circle cx="12" cy="17" r="0.7" fill={color} stroke="none" />
  </svg>
);

export const Boost = ({ size = 24, accent = '#FF6B00', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={accent} fillOpacity="0.18"
    stroke={accent} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
  </svg>
);

export const ShieldIcon = ({ size = 24, color = 'currentColor', accent = '#1A3A6B', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z" fill={accent} fillOpacity="0.1" />
    <path d="m9 12 2 2 4-4" stroke={accent} strokeWidth={2} />
  </svg>
);

export const Crown = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="m3 8 3 9h12l3-9-5 4-4-7-4 7z" fill={accent} fillOpacity="0.18" />
    <path d="M5 19h14" />
    <circle cx="3" cy="8" r="1" fill={accent} stroke="none" />
    <circle cx="21" cy="8" r="1" fill={accent} stroke="none" />
    <circle cx="12" cy="6" r="1" fill={accent} stroke="none" />
  </svg>
);

export const Flag = ({ size = 24, color = 'currentColor', accent = '#FF6B00', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M5 21V4" />
    <path d="M5 4h12l-2 3.5 2 3.5H5" fill={accent} fillOpacity="0.18" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════
   ACTIONS (10)
   ══════════════════════════════════════════════════════════════════ */

export const Edit = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M16 3.5 20.5 8 8 20.5H3.5V16z" />
    <path d="m13.5 6 4.5 4.5" stroke={accent} strokeWidth={1.8} />
  </svg>
);

export const Trash = ({ size = 24, color = 'currentColor', accent = '#8B1D1D', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" fill={accent} fillOpacity="0.08" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const Eye = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const Share = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="6" r="3" fill={accent} fillOpacity="0.18" />
    <circle cx="18" cy="18" r="3" fill={accent} fillOpacity="0.18" />
    <path d="m8.5 11 7-3.5M8.5 13l7 3.5" />
  </svg>
);

export const Download = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M12 4v12" />
    <path d="m6.5 11 5.5 5.5L17.5 11" />
    <path d="M4 19h16" />
  </svg>
);

export const Upload = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M12 16V4" />
    <path d="m6.5 9 5.5-5.5L17.5 9" />
    <path d="M4 19h16" />
  </svg>
);

export const Plus = ({ size = 24, accent = '#FF6B00', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" {...rest}>
    <circle cx="12" cy="12" r="9" fill={accent} fillOpacity="0.12" stroke={accent} />
    <path d="M12 8v8M8 12h8" stroke={accent} />
  </svg>
);

export const Filter = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M3 5h18l-7 8v6l-4 2v-8z" />
  </svg>
);

export const Sort = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M7 4v16M3 8l4-4 4 4" />
    <path d="M17 20V4M13 16l4 4 4-4" />
  </svg>
);

export const Refresh = ({ size = 24, color = 'currentColor', accent = '#009E49', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M3 12a9 9 0 0 1 16-5.5L21 4v6h-6" />
    <path d="M21 12a9 9 0 0 1-16 5.5L3 20v-6h6" stroke={accent} />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════
   COMMUNICATION (6)
   ══════════════════════════════════════════════════════════════════ */

export const Chat = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M3 5.5C3 4.7 3.7 4 4.5 4h15c.8 0 1.5.7 1.5 1.5v10c0 .8-.7 1.5-1.5 1.5H10l-4 4v-4H4.5C3.7 17 3 16.3 3 15.5z" fill={accent} fillOpacity="0.08" />
    <circle cx="8.5" cy="10.5" r="1" fill={color} stroke="none" />
    <circle cx="12" cy="10.5" r="1" fill={color} stroke="none" />
    <circle cx="15.5" cy="10.5" r="1" fill={color} stroke="none" />
  </svg>
);

export const Phone = ({ size = 24, color = 'currentColor', accent = '#009E49', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M5 4.5c0-.8.7-1.5 1.5-1.5h2.3c.6 0 1.2.4 1.4 1l1 3c.2.6 0 1.2-.5 1.6l-1.4 1c1.5 3 3.5 5 6.5 6.5l1-1.4c.4-.5 1-.7 1.6-.5l3 1c.6.2 1 .8 1 1.4v2.3c0 .8-.7 1.5-1.5 1.5C8.6 21 3 15.4 3 8.5z" />
    <circle cx="17" cy="7" r="2.5" fill={accent} stroke="none" />
  </svg>
);

export const Mail = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" stroke={accent} />
  </svg>
);

export const Video = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="m16 10 5-3v10l-5-3z" />
  </svg>
);

export const Send = ({ size = 24, color = 'currentColor', accent = '#FF6B00', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="m3 12 18-9-6 18-3-7z" fill={accent} fillOpacity="0.18" />
    <path d="m3 12 9 3" stroke={accent} />
  </svg>
);

export const Megaphone = ({ size = 24, color = 'currentColor', accent = '#FF6B00', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M3 10v4l13 5V5z" fill={accent} fillOpacity="0.15" />
    <path d="M16 8.5a3.5 3.5 0 0 1 0 7" />
    <path d="M8 14v5a1 1 0 0 0 1 1h2v-4" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════
   DOCUMENTS (8)
   ══════════════════════════════════════════════════════════════════ */

export const DocumentIcon = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v4h4" />
    <path d="M8 12h8M8 16h6" />
  </svg>
);

export const Signed = ({ size = 24, color = 'currentColor', accent = '#009E49', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill={accent} fillOpacity="0.06" />
    <path d="M14 3v4h4" />
    <path d="m8 14 2.5 2.5L17 10" stroke={accent} strokeWidth={2} />
  </svg>
);

export const Dossier = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M3 6c0-.8.7-1.5 1.5-1.5h5l2 2h7C19.3 6.5 20 7.2 20 8v10.5c0 .8-.7 1.5-1.5 1.5h-14c-.8 0-1.5-.7-1.5-1.5z" fill={accent} fillOpacity="0.1" />
    <path d="M3 10h17" />
  </svg>
);

export const Receipt = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M5 3v18l3-2 3 2 3-2 3 2 3-2V3z" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </svg>
);

export const Contract = ({ size = 24, color = 'currentColor', accent = '#1A3A6B', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M5 3h12l3 3v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M17 3v3h3" />
    <path d="M8 11h8M8 14h8M8 17h5" />
    <circle cx="17" cy="17.5" r="2.5" fill={accent} fillOpacity="0.2" stroke={accent} />
  </svg>
);

export const IdCard = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="11.5" r="2.5" fill={accent} fillOpacity="0.18" stroke={accent} />
    <path d="M5.5 17c.5-1.5 2-2.5 3.5-2.5s3 1 3.5 2.5" />
    <path d="M14.5 10h4M14.5 13h3" />
  </svg>
);

export const Stamp = ({ size = 24, color = 'currentColor', accent = '#8B1D1D', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <circle cx="12" cy="9" r="5" fill={accent} fillOpacity="0.18" stroke={accent} />
    <path d="M9 9h6M12 6.5v5" stroke={accent} />
    <path d="M5 17h14M5 21h14" />
  </svg>
);

export const Book = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M4 4.5C4 3.7 4.7 3 5.5 3H19a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5.5C4.7 20 4 19.3 4 18.5z" fill={accent} fillOpacity="0.06" />
    <path d="M4 18.5c0-.8.7-1.5 1.5-1.5H20" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════
   IMMOBILIER (8)
   ══════════════════════════════════════════════════════════════════ */

export const Bed = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M3 18V8h11a4 4 0 0 1 4 4v6" />
    <path d="M3 14h18M3 18h18M21 18v-6" />
    <circle cx="7" cy="11" r="1.5" />
  </svg>
);

export const Bath = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
    <path d="M6 12V6a2 2 0 0 1 4 0v1" />
    <path d="M5 19l-1 2M19 19l1 2" />
  </svg>
);

export const Area = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="1" stroke={accent} strokeDasharray="3 2" />
    <path d="m7 7 3 3M14 14l3 3M17 7l-3 3M7 17l3-3" />
  </svg>
);

export const Parking = ({ size = 24, color = 'currentColor', accent = '#1A3A6B', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <rect x="4" y="4" width="16" height="16" rx="2" fill={accent} fillOpacity="0.1" stroke={accent} />
    <path d="M10 17V8h3a3 3 0 0 1 0 6h-3" stroke={accent} strokeWidth={2} />
  </svg>
);

export const Garden = ({ size = 24, color = 'currentColor', accent = '#009E49', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M12 21V11" />
    <path d="M12 11C9 11 7 8.5 7 6c2.5 0 5 2 5 5z" fill={accent} fillOpacity="0.18" stroke={accent} />
    <path d="M12 13c3 0 5-2.5 5-5-2.5 0-5 2-5 5z" fill={accent} fillOpacity="0.18" stroke={accent} />
    <path d="M5 21h14" />
  </svg>
);

export const Key = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <circle cx="8" cy="13" r="4.5" fill={accent} fillOpacity="0.18" stroke={accent} />
    <path d="m12 13 8-8M16 9l2 2M19 6l2 2" />
  </svg>
);

export const Location = ({ size = 24, color = 'currentColor', accent = '#FF6B00', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M12 22s7-7 7-13a7 7 0 1 0-14 0c0 6 7 13 7 13z" fill={accent} fillOpacity="0.18" />
    <circle cx="12" cy="9" r="2.5" fill="white" />
  </svg>
);

export const Elevator = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M12 3v18" />
    <path d="m8 9 1.5-2L11 9M8 15l1.5 2L11 15" />
    <path d="m16 9 1.5-2L19 9M13 15l1.5 2L16 15" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════
   BRAND HOMECI (6) — identité ivoirienne
   ══════════════════════════════════════════════════════════════════ */

export const ElephantMark = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <path d="M4 16c0-5 3.5-9 8-9 4 0 6 2 7 5 1 .5 2 1.5 2 3 0 1-1 2-2 2h-1v3h-3v-3h-7v3H5v-4z" fill={accent} fillOpacity="0.18" />
    <circle cx="9" cy="11" r="0.8" fill={color} stroke="none" />
    <path d="M16 13c0 1.5 1 3.5 1 5" />
  </svg>
);

export const Kente = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
    <rect x="3" y="6" width="3" height="12" fill="#FF6B00" />
    <rect x="6" y="6" width="3" height="12" fill="#009E49" />
    <rect x="9" y="6" width="3" height="12" fill="#FFFFFF" stroke={color} strokeWidth={1} />
    <rect x="12" y="6" width="3" height="12" fill="#D4A017" />
    <rect x="15" y="6" width="3" height="12" fill="#FF6B00" />
    <rect x="18" y="6" width="3" height="12" fill="#009E49" />
  </svg>
);

export const FlagCI = ({ size = 24, color = 'currentColor', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.4} {...rest}>
    <rect x="3" y="6" width="6" height="12" fill="#FF6B00" />
    <rect x="9" y="6" width="6" height="12" fill="#FFFFFF" stroke={color} />
    <rect x="15" y="6" width="6" height="12" fill="#009E49" />
    <rect x="3" y="6" width="18" height="12" stroke={color} fill="none" />
  </svg>
);

export const MobileMoney = ({ size = 24, color = 'currentColor', accent = '#FF6B00', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <rect x="6" y="3" width="12" height="18" rx="2" fill={accent} fillOpacity="0.1" />
    <path d="M10 17h4" />
    <circle cx="12" cy="11" r="2.5" fill={accent} fillOpacity="0.3" stroke={accent} />
    <text x="12" y="12.5" textAnchor="middle" fontSize="3.5" fontWeight="900" fill={accent}>FCFA</text>
  </svg>
);

export const Cocoa = ({ size = 24, color = 'currentColor', accent = '#5C3D1E', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} {...rest}>
    <ellipse cx="12" cy="12" rx="5" ry="8" fill={accent} fillOpacity="0.15" stroke={accent} transform="rotate(20 12 12)" />
    <path d="M9 7c1 1.5 2.5 6 4 9M11 6c1 1.5 2.5 6 4 9" stroke={accent} />
  </svg>
);

export const Adinkra = ({ size = 24, color = 'currentColor', accent = '#D4A017', ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    <circle cx="12" cy="12" r="9" stroke={accent} />
    <path d="M12 4 v16M4 12 h16" stroke={accent} />
    <circle cx="12" cy="12" r="3.5" fill={accent} fillOpacity="0.2" stroke={accent} />
    <path d="m8 8 8 8M16 8l-8 8" stroke={accent} strokeWidth={1} />
  </svg>
);
