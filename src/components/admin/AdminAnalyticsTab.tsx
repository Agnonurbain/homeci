/**
 * AdminAnalyticsTab — Dashboard analytics avancé (Admin Dashboard).
 *
 * Graphiques Recharts pour tendances :
 * - Inscriptions d'utilisateurs (30 derniers jours)
 * - Publications de biens (30 derniers jours)
 * - Demandes de visites (30 derniers jours)
 * - Certification notaire (30 derniers jours)
 * - Répartition par type de bien
 * - Répartition par ville
 */

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart,
} from 'recharts';
import {
  Users, Home, Calendar, Shield, TrendingUp, BarChart3, PieChart as PieIcon
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { SectionTitle } from './AdminSections';

// ── Types ─────────────────────────────────────────────────────────────────

interface DayData {
  date: string;
  count: number;
  label: string;
}

interface PieData {
  name: string;
  value: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Génère les 30 derniers jours avec comptage */
function aggregateByDay(docs: any[], dateField = 'created_at'): DayData[] {
  const now = new Date();
  const days: DayData[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    days.push({ date: dateStr, count: 0, label });
  }

  const toISO = (v: unknown): string => {
    if (!v) return '';
    if (typeof v === 'object' && v !== null && 'toDate' in v) return (v as any).toDate().toISOString();
    return String(v);
  };

  docs.forEach((doc) => {
    const data = doc.data();
    const dateStr = toISO(data[dateField])?.split('T')[0];
    const day = days.find(d => d.date === dateStr);
    if (day) day.count++;
  });

  return days;
}

/** Agrège par catégorie (type, ville, etc.) */
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
    .slice(0, 8); // Top 8
}

const COLORS = [HColors.orangeCI, HColors.vertCI, HColors.gold, HColors.navy, HColors.bordeaux, '#8B5CF6', '#06B6D4', '#EC4899'];

// ── Component ─────────────────────────────────────────────────────────────

export default function AdminAnalyticsTab() {
  const [userDays, setUserDays] = useState<DayData[]>([]);
  const [propertyDays, setPropertyDays] = useState<DayData[]>([]);
  const [visitDays, setVisitDays] = useState<DayData[]>([]);
  const [certDays, setCertDays] = useState<DayData[]>([]);
  const [typePie, setTypePie] = useState<PieData[]>([]);
  const [cityPie, setCityPie] = useState<PieData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [usersSnap, propsSnap, visitsSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), orderBy('created_at', 'desc'), limit(5000))),
          getDocs(query(collection(db, 'properties'), orderBy('created_at', 'desc'), limit(5000))),
          getDocs(query(collection(db, 'visits'), orderBy('created_at', 'desc'), limit(5000))),
        ]);

        setUserDays(aggregateByDay(usersSnap.docs));
        setPropertyDays(aggregateByDay(propsSnap.docs));
        setVisitDays(aggregateByDay(visitsSnap.docs));
        setCertDays(aggregateByDay(propsSnap.docs.filter((d: any) => d.data().verified_notaire)));
        setTypePie(aggregateByCategory(propsSnap.docs, 'property_type'));
        setCityPie(aggregateByCategory(propsSnap.docs, 'city'));
      } catch (e) {
        console.error('[HOMECI] Analytics load error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalUsers = useMemo(() => userDays.reduce((s, d) => s + d.count, 0), [userDays]);
  const totalProperties = useMemo(() => propertyDays.reduce((s, d) => s + d.count, 0), [propertyDays]);
  const totalVisits = useMemo(() => visitDays.reduce((s, d) => s + d.count, 0), [visitDays]);
  const totalCertified = useMemo(() => certDays.reduce((s, d) => s + d.count, 0), [certDays]);

  const PROPERTY_TYPE_LABELS: Record<string, string> = {
    appartement: 'Appartement',
    maison: 'Maison',
    villa: 'Villa',
    terrain: 'Terrain',
    hotel: 'Hôtel',
    appart_hotel: 'Appart-Hôtel',
  };

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
      <SectionTitle
        title="Analytics & Tendances"
        sub="Évolution sur les 30 derniers jours"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: 'Inscriptions (30j)', value: totalUsers, color: HColors.orangeCI },
          { icon: Home, label: 'Publications (30j)', value: totalProperties, color: HColors.vertCI },
          { icon: Calendar, label: 'Visites (30j)', value: totalVisits, color: HColors.gold },
          { icon: Shield, label: 'Certifications (30j)', value: totalCertified, color: HColors.navy },
        ].map((kpi, i) => (
          <div key={i} className="rounded-2xl p-4 text-center"
            style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
            <kpi.icon className="w-5 h-5 mx-auto mb-2" style={{ color: kpi.color }} />
            <div className="text-2xl font-bold" style={{ color: kpi.color, fontFamily: 'var(--font-cormorant)' }}>{kpi.value}</div>
            <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: HColors.brown }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Trend Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Inscriptions */}
        <div className="rounded-2xl p-5"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <h3 className="font-bold mb-4 flex items-center gap-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <TrendingUp className="w-5 h-5" style={{ color: HColors.orangeCI }} /> Inscriptions quotidiennes
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={userDays} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.1)" />
              <XAxis dataKey="label" angle={-45} textAnchor="end" height={50} tick={{ fontSize: 10, fill: HColors.brown }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: HColors.brown }} />
              <Tooltip contentStyle={{ background: '#FFF', border: `1px solid ${HAlpha.gold20}`, borderRadius: 8, fontFamily: 'var(--font-nunito)', fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke={HColors.orangeCI} fill={`${HAlpha.orange15}`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Publications */}
        <div className="rounded-2xl p-5"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <h3 className="font-bold mb-4 flex items-center gap-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <BarChart3 className="w-5 h-5" style={{ color: HColors.vertCI }} /> Publications quotidiennes
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={propertyDays} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.1)" />
              <XAxis dataKey="label" angle={-45} textAnchor="end" height={50} tick={{ fontSize: 10, fill: HColors.brown }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: HColors.brown }} />
              <Tooltip contentStyle={{ background: '#FFF', border: `1px solid ${HAlpha.gold20}`, borderRadius: 8, fontFamily: 'var(--font-nunito)', fontSize: 12 }} />
              <Bar dataKey="count" fill={HColors.vertCI} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Visites */}
        <div className="rounded-2xl p-5"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <h3 className="font-bold mb-4 flex items-center gap-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <Calendar className="w-5 h-5" style={{ color: HColors.gold }} /> Visites quotidiennes
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={visitDays} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.1)" />
              <XAxis dataKey="label" angle={-45} textAnchor="end" height={50} tick={{ fontSize: 10, fill: HColors.brown }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: HColors.brown }} />
              <Tooltip contentStyle={{ background: '#FFF', border: `1px solid ${HAlpha.gold20}`, borderRadius: 8, fontFamily: 'var(--font-nunito)', fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke={HColors.gold} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Certifications */}
        <div className="rounded-2xl p-5"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <h3 className="font-bold mb-4 flex items-center gap-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <Shield className="w-5 h-5" style={{ color: HColors.navy }} /> Certifications quotidiennes
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={certDays} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.1)" />
              <XAxis dataKey="label" angle={-45} textAnchor="end" height={50} tick={{ fontSize: 10, fill: HColors.brown }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: HColors.brown }} />
              <Tooltip contentStyle={{ background: '#FFF', border: `1px solid ${HAlpha.gold20}`, borderRadius: 8, fontFamily: 'var(--font-nunito)', fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke={HColors.navy} fill={`${HAlpha.navy08}`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Répartition par type */}
        <div className="rounded-2xl p-5"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <h3 className="font-bold mb-4 flex items-center gap-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <PieIcon className="w-5 h-5" style={{ color: HColors.gold }} /> Répartition par type de bien
          </h3>
          {typePie.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: HColors.brown }}>Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={typePie} cx="50%" cy="50%" outerRadius={80} labelLine={false}
                  label={({ name, percent }) => `${PROPERTY_TYPE_LABELS[name as string] || name} ${((percent || 0) * 100).toFixed(0)}%`}
                  dataKey="value">
                  {typePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#FFF', border: `1px solid ${HAlpha.gold20}`, borderRadius: 8, fontFamily: 'var(--font-nunito)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Répartition par ville */}
        <div className="rounded-2xl p-5"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <h3 className="font-bold mb-4 flex items-center gap-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            <Home className="w-5 h-5" style={{ color: HColors.vertCI }} /> Top villes
          </h3>
          {cityPie.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: HColors.brown }}>Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cityPie} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: HColors.brown }} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10, fill: HColors.brown }} />
                <Tooltip contentStyle={{ background: '#FFF', border: `1px solid ${HAlpha.gold20}`, borderRadius: 8, fontFamily: 'var(--font-nunito)', fontSize: 12 }} />
                <Bar dataKey="value" fill={HColors.vertCI} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
