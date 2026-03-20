import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, Eye, Loader } from 'lucide-react';
import { reportService, REASON_LABELS } from '../services/reportService';
import type { PropertyReport } from '../services/reportService';
import { HColors, HAlpha } from '../styles/homeci-tokens';

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  pending:  { bg: HAlpha.orange10, text: HColors.orangeCI, border: HAlpha.orange25, label: 'En attente' },
  reviewed: { bg: HAlpha.vertCI10, text: HColors.vertCI,   border: HAlpha.vertCI25, label: 'Traité' },
  dismissed:{ bg: HAlpha.navy08,   text: HColors.navy,     border: HAlpha.navy18,   label: 'Rejeté' },
};

export default function AdminReportsTab({ showToast }: { showToast: (msg: string, ok?: boolean) => void }) {
  const [reports, setReports] = useState<PropertyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    reportService.getAllReports().then(r => { setReports(r); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleAction = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    setActionLoading(reportId);
    try {
      await reportService.updateReportStatus(reportId, status);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
      showToast(status === 'reviewed' ? 'Signalement marqué comme traité.' : 'Signalement rejeté.');
    } catch { showToast('Erreur', false); }
    finally { setActionLoading(null); }
  };

  const filtered = filter ? reports.filter(r => r.status === filter) : reports;
  const pending = reports.filter(r => r.status === 'pending').length;

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: HAlpha.gold20, borderTopColor: HColors.gold }} />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-xl" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
            Signalements d'annonces
          </h2>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            {pending > 0
              ? <span style={{ color: HColors.orangeCI, fontWeight: 600 }}>{pending} en attente de traitement</span>
              : 'Tous les signalements ont été traités'}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { val: '', label: `Tous (${reports.length})` },
          { val: 'pending', label: `En attente (${reports.filter(r => r.status === 'pending').length})` },
          { val: 'reviewed', label: `Traités (${reports.filter(r => r.status === 'reviewed').length})` },
          { val: 'dismissed', label: `Rejetés (${reports.filter(r => r.status === 'dismissed').length})` },
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

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-14 text-center"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <CheckCircle className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.vertCI15 }} />
          <p className="font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.2rem' }}>
            Aucun signalement {filter ? 'dans cette catégorie' : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => {
            const s = STATUS_STYLES[report.status] || STATUS_STYLES.pending;
            return (
              <div key={report.id} className="rounded-2xl p-5"
                style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`, boxShadow: '0 2px 10px rgba(26,14,0,0.05)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" style={{ color: HColors.orangeCI }} />
                      <span className="text-sm font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
                        {report.property_title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, fontFamily: 'var(--font-nunito)' }}>
                        {s.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs mb-2" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                      <span className="px-2 py-1 rounded-lg" style={{ background: HAlpha.orange08 }}>
                        {REASON_LABELS[report.reason] || report.reason}
                      </span>
                      <span>Par : {report.reporter_role}</span>
                      <span>{new Date(report.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {report.details && (
                      <p className="text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                        « {report.details} »
                      </p>
                    )}
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleAction(report.id, 'reviewed')}
                        disabled={actionLoading === report.id}
                        className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: HAlpha.vertCI10, color: HColors.vertCI, border: `1px solid ${HAlpha.vertCI25}`, fontFamily: 'var(--font-nunito)' }}>
                        {actionLoading === report.id ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Traiter
                      </button>
                      <button onClick={() => handleAction(report.id, 'dismissed')}
                        disabled={actionLoading === report.id}
                        className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: HAlpha.navy08, color: HColors.navy, border: `1px solid ${HAlpha.navy18}`, fontFamily: 'var(--font-nunito)' }}>
                        <XCircle className="w-3 h-3" /> Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
