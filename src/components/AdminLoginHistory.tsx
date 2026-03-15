import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Monitor, RotateCcw, Loader } from 'lucide-react';
import { collection, getDocs, orderBy, query, limit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface LoginAttempt {
  id: string;
  email: string;
  attempted_at: string;
  ip_address: string | null;
  success: boolean;
  user_agent: string | null;
  role?: string;
}

function getBrowserInfo(ua: string | null): string {
  if (!ua) return 'Inconnu';
  if (ua.includes('Edg'))     return 'Edge';
  if (ua.includes('Chrome'))  return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari'))  return 'Safari';
  return 'Autre';
}

function getOSInfo(ua: string | null): string {
  if (!ua) return '';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac'))     return 'macOS';
  if (ua.includes('Linux'))   return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return '';
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(d));
}

export default function AdminLoginHistory() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    try {
      // Requête simple sur orderBy uniquement — on filtre côté client pour éviter l'index composite
      const q = query(collection(db, 'admin_logs'), orderBy('attempted_at', 'desc'), limit(100));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as LoginAttempt[];
      if (filter === 'success') data = data.filter(a => a.success);
      if (filter === 'failed')  data = data.filter(a => !a.success);
      setAttempts(data.slice(0, 50));
    } catch (e) {
      console.error(e);
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  }

  const successCount = attempts.filter(a => a.success).length;
  const failedCount  = attempts.filter(a => !a.success).length;

  const FILTERS: { key: typeof filter; label: string; color: string; bg: string; border: string }[] = [
    { key: 'all',     label: 'Toutes',   color: HColors.darkBrown, bg: HAlpha.gold10,  border: HAlpha.gold25  },
    { key: 'success', label: 'Réussies', color: HColors.green,     bg: HAlpha.green10, border: HAlpha.green25 },
    { key: 'failed',  label: 'Échouées', color: HColors.bordeaux,  bg: HAlpha.bord10,  border: HAlpha.bord25  },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="font-bold mb-1"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.6rem' }}>
            Historique des Connexions
          </h2>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Surveillance des tentatives de connexion au portail admin
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
          style={{ background: HAlpha.gold08, border: `1px solid ${HAlpha.gold20}`,
                   color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
          <RotateCcw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total',    value: attempts.length, bg: HAlpha.gold08,  border: HAlpha.gold20,  color: HColors.darkBrown },
          { label: 'Réussies', value: successCount,    bg: HAlpha.green10, border: HAlpha.green20, color: HColors.green     },
          { label: 'Échouées', value: failedCount,     bg: HAlpha.bord10,  border: HAlpha.bord20,  color: HColors.bordeaux  },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="text-2xl font-bold mb-0.5"
              style={{ color: s.color, fontFamily: 'var(--font-cormorant)' }}>{s.value}</div>
            <div className="text-xs" style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={filter === f.key
              ? { background: f.bg, border: `1px solid ${f.border}`, color: f.color, fontFamily: 'var(--font-nunito)' }
              : { background: HColors.white, border: `1px solid ${HAlpha.gold15}`, color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="flex justify-center py-16 rounded-2xl"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <Loader className="w-7 h-7 animate-spin" style={{ color: HColors.gold }} />
        </div>
      ) : attempts.length === 0 ? (
        <div className="rounded-2xl p-16 text-center"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: HAlpha.gold20 }} />
          <h3 className="font-bold mb-1"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.2rem' }}>
            Aucune tentative enregistrée
          </h3>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Les connexions au portail admin apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <KenteLine height={3} />
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ background: HColors.night }}>
                  {['Statut', 'Email', 'Date & Heure', 'IP', 'Navigateur / OS'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attempts.map((a, i) => (
                  <tr key={a.id}
                    style={{ background: i % 2 === 0 ? HColors.white : 'rgba(249,243,232,0.4)',
                             borderBottom: `1px solid ${HAlpha.gold08}` }}>
                    <td className="px-5 py-3.5">
                      {a.success ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: HColors.green }}>
                          <CheckCircle className="w-4 h-4" /> Réussie
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: HColors.bordeaux }}>
                          <XCircle className="w-4 h-4" /> Échouée
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium"
                      style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
                      {a.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-xs"
                        style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                        <Clock className="w-3.5 h-3.5" style={{ color: HColors.terracotta }} />
                        {formatDate(a.attempted_at)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono"
                      style={{ color: HColors.brown }}>
                      {a.ip_address || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-xs"
                        style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                        <Monitor className="w-3.5 h-3.5" style={{ color: HColors.navy }} />
                        {getBrowserInfo(a.user_agent)}
                        {getOSInfo(a.user_agent) && (
                          <span className="px-1.5 py-0.5 rounded-md text-xs"
                            style={{ background: HAlpha.navy08, color: HColors.navy }}>
                            {getOSInfo(a.user_agent)}
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
