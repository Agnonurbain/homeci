import { CheckCircle, Clock, Home, Star } from 'lucide-react';
import { HColors, HAlpha } from '../../styles/homeci-tokens';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface StatCardProps {
  icon: any;
  label: string;
  value: number;
  accent?: string;
}

interface PropertyStatsProps {
  stats: {
    total: number;
    published: number;
    pending: number;
    rented_sold: number;
    verified: number;
  };
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, accent = HColors.gold }: StatCardProps) {
  return (
    <div className="rounded-2xl p-3 sm:p-5 text-center transition-all hover:translate-y-[-2px] hover:shadow-md"
      style={{
        background: HColors.white, 
        border: `1.5px solid ${HAlpha.gold15}`,
        boxShadow: '0 2px 12px rgba(26,14,0,0.03)',
        minWidth: 0, 
        overflow: 'hidden'
      }}>
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3"
        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: accent }} />
      </div>
      <div className="text-xl sm:text-2xl font-bold" style={{ color: accent, fontFamily: 'var(--font-cormorant)' }}>{value}</div>
      <div className="text-[10px] sm:text-xs mt-0.5 truncate uppercase tracking-wider font-bold opacity-60" 
           style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>{label}</div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */

export default function PropertyStats({ stats }: PropertyStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard 
        icon={CheckCircle} 
        label="Publiés" 
        value={stats.published} 
        accent="#009E49" 
      />
      <StatCard 
        icon={Clock} 
        label="En attente" 
        value={stats.pending} 
        accent="#D4A017" 
      />
      <StatCard 
        icon={Home} 
        label="Loués/Vendus" 
        value={stats.rented_sold} 
        accent="#1A3A6B" 
      />
      <StatCard 
        icon={Star} 
        label="Vérifiés ✓" 
        value={stats.verified} 
        accent="#FF6B00" 
      />
    </div>
  );
}
