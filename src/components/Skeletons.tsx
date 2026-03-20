/**
 * HOMECI — Loading Skeletons
 * Placeholders animés pendant le chargement des données.
 * Tous les skeletons utilisent la palette HOMECI (tons dorés sur fond crème).
 */
import { HColors, HAlpha } from '../styles/homeci-tokens';

/* ── Base Skeleton Pulse ────────────────────────────────────────────────── */

const pulseStyle: React.CSSProperties = {
  background: `linear-gradient(90deg, ${HAlpha.gold08} 25%, ${HAlpha.gold15} 50%, ${HAlpha.gold08} 75%)`,
  backgroundSize: '200% 100%',
  animation: 'homeci-skeleton-pulse 1.5s ease-in-out infinite',
  borderRadius: 8,
};

/** Injecte l'animation CSS une seule fois dans le document */
function ensureAnimation() {
  if (typeof document === 'undefined') return;
  const id = 'homeci-skeleton-style';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    @keyframes homeci-skeleton-pulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}

/** Bloc rectangulaire animé */
function Bone({ w, h, r = 8, className = '', style = {} }: {
  w?: string | number; h?: string | number; r?: number;
  className?: string; style?: React.CSSProperties;
}) {
  ensureAnimation();
  return (
    <div className={className}
      style={{ width: w, height: h, borderRadius: r, ...pulseStyle, ...style }} />
  );
}

/** Cercle animé */
function Circle({ size = 40 }: { size?: number }) {
  ensureAnimation();
  return <div style={{ width: size, height: size, borderRadius: '50%', ...pulseStyle }} />;
}

/* ── Property Card Skeleton ──────────────────────────────────────────── */

export function PropertyCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
               boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
      {/* Image placeholder */}
      <Bone w="100%" h={180} r={0} />
      <div className="p-4 space-y-3">
        {/* Title */}
        <Bone w="75%" h={16} />
        {/* Location */}
        <Bone w="50%" h={12} />
        {/* Price */}
        <Bone w="40%" h={20} />
        {/* Specs row */}
        <div className="flex gap-3 pt-1">
          <Bone w={60} h={12} />
          <Bone w={60} h={12} />
          <Bone w={60} h={12} />
        </div>
        {/* CTA button */}
        <Bone w="100%" h={40} r={12} style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}

/** Grille de cartes skeleton (pour PublicPropertyList & TenantDashboard) */
export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Stat Card Skeleton ──────────────────────────────────────────────── */

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 text-center"
      style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
               boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
      <div className="flex justify-center mb-3">
        <Bone w={44} h={44} r={12} />
      </div>
      <Bone w={48} h={28} r={6} style={{ margin: '0 auto 4px' }} />
      <Bone w={64} h={12} r={4} style={{ margin: '0 auto' }} />
    </div>
  );
}

/** Ligne de stat cards skeleton */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Table Row Skeleton (Owner Dashboard) ────────────────────────────── */

export function TableRowSkeleton() {
  return (
    <tr style={{ borderBottom: '1px solid rgba(212,160,23,0.08)' }}>
      {/* Bien */}
      <td className="px-5 py-4">
        <Bone w="80%" h={14} style={{ marginBottom: 6 }} />
        <Bone w="50%" h={10} />
      </td>
      {/* Type */}
      <td className="px-5 py-4"><Bone w={70} h={14} /></td>
      {/* Prix */}
      <td className="px-5 py-4">
        <Bone w={90} h={14} style={{ marginBottom: 4 }} />
        <Bone w={40} h={10} />
      </td>
      {/* Statut */}
      <td className="px-5 py-4"><Bone w={70} h={24} r={12} /></td>
      {/* Notaire */}
      <td className="px-5 py-4"><Bone w={60} h={14} /></td>
      {/* Vues */}
      <td className="px-5 py-4"><Bone w={30} h={14} /></td>
      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex gap-1">
          <Bone w={32} h={32} r={8} />
          <Bone w={32} h={32} r={8} />
        </div>
      </td>
    </tr>
  );
}

/** Table skeleton complète (Owner Dashboard) */
export function PropertyTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
               boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
      <table className="min-w-full">
        <thead>
          <tr style={{ borderBottom: `1px solid ${HAlpha.gold15}`, background: 'rgba(212,160,23,0.04)' }}>
            {['Bien','Type','Prix','Statut','Notaire','Vues','Actions'].map(h => (
              <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider"
                style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Visit Card Skeleton ─────────────────────────────────────────────── */

export function VisitCardSkeleton() {
  return (
    <div className="rounded-2xl p-5"
      style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
               boxShadow: '0 2px 10px rgba(26,14,0,0.05)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Bone w={80} h={22} r={12} />
            <Bone w="60%" h={16} />
          </div>
          <div className="flex gap-4">
            <Bone w={100} h={12} />
            <Bone w={120} h={12} />
            <Bone w={80} h={12} />
          </div>
        </div>
        <Bone w={90} h={36} r={12} />
      </div>
    </div>
  );
}

/** Liste de visites skeleton */
export function VisitListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <VisitCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Notaire Property Card Skeleton ──────────────────────────────────── */

export function NotaireCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
               boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bone w={44} h={44} r={12} />
            <div>
              <Bone w={160} h={16} style={{ marginBottom: 4 }} />
              <Bone w={100} h={12} />
            </div>
          </div>
          <Bone w={80} h={28} r={12} />
        </div>
        <div className="flex gap-3">
          <Bone w={100} h={12} />
          <Bone w={120} h={12} />
        </div>
        <Bone w="100%" h={1} />
        <div className="flex gap-2">
          <Bone w={90} h={32} r={8} />
          <Bone w={90} h={32} r={8} />
        </div>
      </div>
    </div>
  );
}

/** Liste de cartes notaire skeleton */
export function NotaireListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <NotaireCardSkeleton key={i} />
      ))}
    </div>
  );
}
