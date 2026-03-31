import {
  Home, Eye, Calendar, BarChart3, CheckCircle, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import type { ChartItem, PropertyStats } from '../../hooks/useOwnerProperties';
import { HColors, HAlpha } from '../../styles/homeci-tokens';

const PIE_COLORS = [HColors.gold, HColors.vertCI, HColors.orangeCI, HColors.bordeaux, HColors.navy];

/* ── Sub-component ────────────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, accent = HColors.gold }: { icon: any; label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl p-3 sm:p-5 text-center"
      style={{
        background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
        boxShadow: '0 2px 12px rgba(26,14,0,0.05)',
        minWidth: 0, overflow: 'hidden'
      }}>
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3"
        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: accent }} />
      </div>
      <div className="text-xl sm:text-2xl font-bold" style={{ color: accent, fontFamily: 'var(--font-cormorant)' }}>{value}</div>
      <div className="text-[10px] sm:text-xs mt-0.5 truncate" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>{label}</div>
    </div>
  );
}

/* ── Props ─────────────────────────────────────────────────────────────────── */

interface StatsTabProps {
  stats: PropertyStats;
  totalVisits: number;
  viewsChartData: ChartItem[];
  typeChartData: ChartItem[];
  monthlyChartData: ChartItem[];
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function StatsTab({ stats, totalVisits, viewsChartData, typeChartData, monthlyChartData }: StatsTabProps) {
  return (
    <div>
      <div className="mb-7">
        <h1 className="font-bold mb-1"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem', color: HColors.darkBrown }}>
          Statistiques
        </h1>
        <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
          Performance de votre portefeuille immobilier
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Home} label="Total biens" value={stats.total} accent="#D4A017" />
        <StatCard icon={Eye} label="Vues totales" value={stats.views} accent="#FF6B00" />
        <StatCard icon={Calendar} label="Visites demandées" value={totalVisits} accent="#1A3A6B" />
        <StatCard icon={CheckCircle} label="Biens vérifiés" value={stats.verified} accent="#009E49" />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Views chart */}
        <div className="rounded-2xl p-6"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`, boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
          <h3 className="font-bold mb-5 flex items-center gap-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <TrendingUp className="w-5 h-5" style={{ color: HColors.gold }} /> Vues par bien (top 6)
          </h3>
          {viewsChartData.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
              Ajoutez des biens pour voir les statistiques
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={viewsChartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: HColors.brown }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: HColors.brown }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(212,160,23,0.2)', fontFamily: 'var(--font-nunito)' }} />
                <Bar dataKey="vues" fill="#D4A017" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="rounded-2xl p-6"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`, boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
          <h3 className="font-bold mb-5 flex items-center gap-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <BarChart3 className="w-5 h-5" style={{ color: HColors.orangeDark }} /> Répartition par type
          </h3>
          {typeChartData.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
              Aucun bien à afficher
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={typeChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {typeChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(212,160,23,0.2)', fontFamily: 'var(--font-nunito)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly line chart */}
      <div className="rounded-2xl p-6"
        style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`, boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
        <h3 className="font-bold mb-5 flex items-center gap-2"
          style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
          <TrendingUp className="w-5 h-5" style={{ color: HColors.vertCI }} /> Biens ajoutés (6 derniers mois)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.1)" />
            <XAxis dataKey="mois" tick={{ fontSize: 12, fill: HColors.brown }} />
            <YAxis tick={{ fontSize: 12, fill: HColors.brown }} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(212,160,23,0.2)', fontFamily: 'var(--font-nunito)' }} />
            <Line type="monotone" dataKey="biens" stroke="#2D6A4F" strokeWidth={2.5} dot={{ fill: HColors.vertCI, r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
