import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, XCircle, TrendingUp, Users, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { visitService } from '../services/visitService';
import type { VisitRequest } from '../services/visitService';
import { HColors, HAlpha } from '../styles/homeci-tokens';

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  pending:          { bg: HAlpha.orange10, text: HColors.orangeCI, border: HAlpha.orange25, label: 'En attente' },
  accepted:         { bg: HAlpha.vertCI10, text: HColors.vertCI,   border: HAlpha.vertCI25, label: 'Acceptée' },
  rejected:         { bg: 'rgba(139,29,29,0.08)', text: '#8B1D1D', border: 'rgba(139,29,29,0.25)', label: 'Refusée' },
  completed:        { bg: HAlpha.navy08,   text: HColors.navy,     border: HAlpha.navy18,   label: 'Effectuée' },
  counter_proposed: { bg: HAlpha.orange10, text: HColors.orangeCI, border: HAlpha.orange25, label: 'Contre-proposée' },
};

const PIE_COLORS = [HColors.orangeCI, HColors.vertCI, '#8B1D1D', HColors.navy, HColors.gold];

export default function AdminVisitsTab() {
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    visitService.getAllVisits().then(v => { setVisits(v); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filter ? visits.filter(v => v.status === filter) : visits;

  // Stats
  const stats = {
    total: visits.length,
    pending: visits.filter(v => v.status === 'pending').length,
    accepted: visits.filter(v => v.status === 'accepted').length,
    completed: visits.filter(v => v.status === 'completed').length,
    rejected: visits.filter(v => v.status === 'rejected').length,
  };

  // Pie chart data
  const pieData = [
    { name: 'En attente', value: stats.pending },
    { name: 'Acceptées', value: stats.accepted },
    { name: 'Refusées', value: stats.rejected },
    { name: 'Effectuées', value: stats.completed },
  ].filter(d => d.value > 0);

  // Bar chart — visites par mois (6 derniers mois)
  const monthlyData = (() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      months[key] = 0;
    }
    visits.forEach(v => {
      const d = new Date(v.created_at);
      const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      if (key in months) months[key]++;
    });
    return Object.entries(months).map(([mois, visites]) => ({ mois, visites }));
  })();

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: HAlpha.gold20, borderTopColor: HColors.gold }} />
    </div>
  );

  return (
    <div>
      <h2 className="font-bold text-xl mb-1" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
        Suivi des visites
      </h2>
      <p className="text-sm mb-6" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
        {visits.length} visite{visits.length > 1 ? 's' : ''} au total
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Calendar, label: 'Total', value: stats.total, accent: HColors.gold },
          { icon: Clock, label: 'En attente', value: stats.pending, accent: HColors.orangeCI },
          { icon: CheckCircle, label: 'Acceptées', value: stats.accepted, accent: HColors.vertCI },
          { icon: Eye, label: 'Effectuées', value: stats.completed, accent: HColors.navy },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 text-center"
            style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
            <s.icon className="w-7 h-7 mx-auto mb-2" style={{ color: s.accent }} />
            <div className="text-2xl font-bold" style={{ color: s.accent, fontFamily: 'var(--font-cormorant)' }}>{s.value}</div>
            <div className="text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar chart */}
        <div className="rounded-2xl p-5"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <h3 className="font-bold mb-4" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <TrendingUp className="w-4 h-4 inline mr-2" style={{ color: HColors.vertCI }} />
            Visites par mois
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.15)" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: HColors.brown }} />
              <YAxis tick={{ fontSize: 11, fill: HColors.brown }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${HAlpha.gold20}`, fontFamily: 'var(--font-nunito)', fontSize: 12 }} />
              <Bar dataKey="visites" fill={HColors.orangeCI} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="rounded-2xl p-5"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <h3 className="font-bold mb-4" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <Users className="w-4 h-4 inline mr-2" style={{ color: HColors.navy }} />
            Répartition par statut
          </h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((d, idx) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs" style={{ fontFamily: 'var(--font-nunito)' }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span style={{ color: HColors.brown }}>{d.name}</span>
                    <span className="font-bold" style={{ color: HColors.darkBrown }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: HColors.brown }}>Aucune donnée</p>
          )}
        </div>
      </div>

      {/* Filter + list */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { val: '', label: `Toutes (${visits.length})` },
          { val: 'pending', label: `En attente (${stats.pending})` },
          { val: 'accepted', label: `Acceptées (${stats.accepted})` },
          { val: 'completed', label: `Effectuées (${stats.completed})` },
          { val: 'rejected', label: `Refusées (${stats.rejected})` },
        ].map(f => (
          <button key={f.val} onClick={() => setFilter(f.val)}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
            style={filter === f.val
              ? { background: HColors.orangeCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }
              : { background: HColors.white, color: HColors.brown, border: `1px solid ${HAlpha.gold20}`, fontFamily: 'var(--font-nunito)' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Visit list */}
      <div className="space-y-3">
        {filtered.slice(0, 30).map(visit => {
          const s = STATUS_STYLES[visit.status] || STATUS_STYLES.pending;
          return (
            <div key={visit.id} className="rounded-xl p-4"
              style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, fontFamily: 'var(--font-nunito)' }}>
                      {s.label}
                    </span>
                    <span className="text-sm font-bold truncate" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
                      {visit.property_title || visit.property_id}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                    <span>{visit.tenant_name}</span>
                    <span>{visit.property_city}</span>
                    <span>{new Date(visit.preferred_date).toLocaleDateString('fr-FR')} à {visit.preferred_time}</span>
                  </div>
                </div>
                <span className="text-xs shrink-0" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                  {new Date(visit.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
