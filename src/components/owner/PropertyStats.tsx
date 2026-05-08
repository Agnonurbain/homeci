import { Home, Eye, Calendar, CheckCircle, Star } from 'lucide-react';
import { HColors, HAlpha } from '../../styles/homeci-tokens';

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
    views?: number;
    visits?: number;
  };
}

function StatCard({ icon: Icon, label, value, accent = HColors.gold }: StatCardProps) {
  return (
    <div className="rounded-2xl p-3 sm:p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: HColors.white,
        border: `1px solid ${HAlpha.gold15}`,
        boxShadow: '0 2px 10px rgba(26,14,0,0.05)',
        minWidth: 0,
        overflow: 'hidden',
      }}>
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-2"
        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: accent }} />
      </div>
      <div className="text-lg sm:text-xl font-black" style={{ color: accent, fontFamily: 'var(--font-cormorant)' }}>{value}</div>
      <div className="text-[9px] sm:text-[10px] mt-0.5 truncate uppercase tracking-wide font-bold"
           style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>{label}</div>
    </div>
  );
}

export default function PropertyStats({ stats }: PropertyStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
      <StatCard icon={Home} label="Total biens" value={stats.total} accent="#D4A017" />
      <StatCard icon={Eye} label="Vues totales" value={stats.views ?? 0} accent="#FF6B00" />
      <StatCard icon={Calendar} label="Visites reçues" value={stats.visits ?? 0} accent="#1A3A6B" />
      <StatCard icon={CheckCircle} label="Publiés" value={stats.published} accent="#009E49" />
      <StatCard icon={Star} label="Vérifiés notaire" value={stats.verified} accent="#D4A017" />
    </div>
  );
}
