/**
 * NotaireStatsTab — Dashboard stats notaire avec graphiques Recharts.
 *
 * Graphiques d'activité :
 * - Biens certifiés par mois (12 derniers mois)
 * - Taux d'approbation (pie chart)
 * - Temps moyen de certification (bar chart)
 * - Biens par type (horizontal bar)
 * - Activité récente (timeline)
 */

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts';
import {
  Shield, XCircle, Clock, TrendingUp, BarChart3, Award
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { HColors, HAlpha } from '../../styles/homeci-tokens';

// ── Types ─────────────────────────────────────────────────────────────────

interface MonthData {
  month: string;
  certified: number;
  rejected: number;
}

interface PieData {
  name: string;
  value: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function aggregateByMonth(docs: any[], dateField = 'created_at'): MonthData[] {
  const now = new Date();
  const months: MonthData[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
      certified: 0,
      rejected: 0,
    });
  }

  const toISO = (v: unknown): string => {
    if (!v) return '';
    if (typeof v === 'object' && v !== null && 'toDate' in v) return (v as any).toDate().toISOString();
    return String(v);
  };

  docs.forEach((doc) => {
    const data = doc.data();
    const dateStr = toISO(data[dateField]);
    if (!dateStr) return;
    const d = new Date(dateStr);
    const monthIdx = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (monthIdx >= 0 && monthIdx < 12) {
      const idx = 11 - monthIdx;
      if (data.verified_notaire) months[idx].certified++;
      if (data.status === 'rejected') months[idx].rejected++;
    }
  });

  return months;
}

function aggregateByCategory(docs: any[], field: string): PieData[] {
  const counts: Record<string, number> = {};
  docs.forEach((doc) => {
    const data = doc.data();
    const val = data[field] || 'Inconnu';
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement',
  maison: 'Maison',
  villa: 'Villa',
  terrain: 'Terrain',
  hotel: 'Hôtel',
  appart_hotel: 'Appart-Hôtel',
};

// ── Component ─────────────────────────────────────────────────────────────

export default function NotaireStatsTab({ notaireId }: { notaireId: string }) {
  const [monthData, setMonthData] = useState<MonthData[]>([]);
  const [typePie, setTypePie] = useState<PieData[]>([]);
  const [cityPie, setCityPie] = useState<PieData[]>([]);
  const [loading, setLoading] = useState(true);

  const [totalCertified, setTotalCertified] = useState(0);
  const [totalRejected, setTotalRejected] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Tous les biens certifiés par ce notaire
        const certifiedQ = query(
          collection(db, 'properties'),
          where('notaire_id', '==', notaireId),
          where('verified_notaire', '==', true),
          orderBy('created_at', 'desc'),
          limit(2000)
        );
        const rejectedQ = query(
          collection(db, 'properties'),
          where('notaire_id', '==', notaireId),
          where('status', '==', 'rejected'),
          orderBy('created_at', 'desc'),
          limit(500)
        );
        const pendingQ = query(
          collection(db, 'properties'),
          where('notaire_id', '==', notaireId),
          where('status', '==', 'pending'),
          orderBy('created_at', 'desc'),
          limit(500)
        );

        const [certSnap, rejectedSnap, pendingSnap] = await Promise.all([
          getDocs(certifiedQ),
          getDocs(rejectedQ),
          getDocs(pendingQ),
        ]);

        // Combine for month aggregation
        const allDocs = [...certSnap.docs, ...rejectedSnap.docs];
        setMonthData(aggregateByMonth(allDocs));
        setTypePie(aggregateByCategory(certSnap.docs, 'property_type'));
        setCityPie(aggregateByCategory(certSnap.docs, 'city'));

        setTotalCertified(certSnap.size);
        setTotalRejected(rejectedSnap.size);
        setTotalPending(pendingSnap.size);
      } catch (e) {
        console.error('[HOMECI] Notaire stats load error:', e);
      } finally {
        setLoading(false);
      }
    };
    if (notaireId) loadData();
  }, [notaireId]);

  const approvalRate = useMemo(() => {
    const total = totalCertified + totalRejected;
    return total > 0 ? Math.round((totalCertified / total) * 100) : 0;
  }, [totalCertified, totalRejected]);

  const pieApproval = useMemo(() => [
    { name: 'Approuvés', value: totalCertified },
    { name: 'Rejetés', value: totalRejected },
  ], [totalCertified, totalRejected]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: HAlpha.gold20, borderTopColor: HColors.gold }} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl p-4 text-center" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <Award className="w-5 h-5 mx-auto mb-2" style={{ color: HColors.vertCI }} />
          <div className="text-2xl font-bold" style={{ color: HColors.vertCI, fontFamily: 'var(--font-cormorant)' }}>{totalCertified}</div>
          <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: HColors.brown }}>Certifiés</div>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <XCircle className="w-5 h-5 mx-auto mb-2" style={{ color: HColors.bordeaux }} />
          <div className="text-2xl font-bold" style={{ color: HColors.bordeaux, fontFamily: 'var(--font-cormorant)' }}>{totalRejected}</div>
          <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: HColors.brown }}>Rejetés</div>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <Clock className="w-5 h-5 mx-auto mb-2" style={{ color: HColors.gold }} />
          <div className="text-2xl font-bold" style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)' }}>{totalPending}</div>
          <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: HColors.brown }}>En attente</div>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <TrendingUp className="w-5 h-5 mx-auto mb-2" style={{ color: HColors.navy }} />
          <div className="text-2xl font-bold" style={{ color: HColors.navy, fontFamily: 'var(--font-cormorant)' }}>{approvalRate}%</div>
          <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: HColors.brown }}>Taux approbation</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Activity over time */}
        <div className="rounded-2xl p-5" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <h3 className="font-bold mb-4 flex items-center gap-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <BarChart3 className="w-5 h-5" style={{ color: HColors.vertCI }} /> Activité mensuelle (12 mois)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: HColors.brown }} interval={2} angle={-30} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 10, fill: HColors.brown }} />
              <Tooltip contentStyle={{ background: '#FFF', border: `1px solid ${HAlpha.gold20}`, borderRadius: 8, fontFamily: 'var(--font-nunito)', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-nunito)' }} />
              <Bar dataKey="certified" name="Certifiés" fill={HColors.vertCI} radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" name="Rejetés" fill={HColors.bordeaux} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Approval rate pie */}
        <div className="rounded-2xl p-5" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <h3 className="font-bold mb-4 flex items-center gap-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <PieChart className="w-5 h-5" style={{ color: HColors.gold }} /> Taux d'approbation
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieApproval} cx="50%" cy="50%" outerRadius={70} labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                dataKey="value">
                {pieApproval.map((_, i) => <Cell key={i} fill={i === 0 ? HColors.vertCI : HColors.bordeaux} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#FFF', border: `1px solid ${HAlpha.gold20}`, borderRadius: 8, fontFamily: 'var(--font-nunito)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Type distribution */}
        <div className="rounded-2xl p-5" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <h3 className="font-bold mb-4 flex items-center gap-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <Shield className="w-5 h-5" style={{ color: HColors.orangeCI }} /> Biens certifiés par type
          </h3>
          {typePie.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: HColors.brown }}>Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typePie} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.1)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: HColors.brown }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: HColors.brown }} width={80}
                  tickFormatter={(v: string) => PROPERTY_TYPE_LABELS[v] || v} />
                <Tooltip contentStyle={{ background: '#FFF', border: `1px solid ${HAlpha.gold20}`, borderRadius: 8, fontFamily: 'var(--font-nunito)', fontSize: 12 }} />
                <Bar dataKey="value" fill={HColors.orangeCI} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* City distribution */}
        <div className="rounded-2xl p-5" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <h3 className="font-bold mb-4 flex items-center gap-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <TrendingUp className="w-5 h-5" style={{ color: HColors.navy }} /> Top villes certifiées
          </h3>
          {cityPie.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: HColors.brown }}>Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={cityPie} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: HColors.brown }} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10, fill: HColors.brown }} />
                <Tooltip contentStyle={{ background: '#FFF', border: `1px solid ${HAlpha.gold20}`, borderRadius: 8, fontFamily: 'var(--font-nunito)', fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke={HColors.navy} fill={`${HAlpha.navy08}`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
