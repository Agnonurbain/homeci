import { useState, useEffect, useMemo } from 'react';
import {
  Shield, Clock, Filter, Search, Eye, FileText, Trash2,
  UserPlus, UserMinus, Ban, RefreshCw, Key, Settings,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import { auditService, type AuditLog, type AuditAction } from '../../services/auditService';
import { HColors, HAlpha } from '../../styles/homeci-tokens';

const ACTION_LABELS: Record<string, string> = {
  admin_login: 'Connexion admin',
  admin_logout: 'Déconnexion admin',
  admin_login_failed: 'Échec connexion admin',
  admin_account_locked: 'Compte admin verrouillé',
  user_suspended: 'Utilisateur suspendu',
  user_reactivated: 'Utilisateur réactivé',
  user_role_changed: 'Rôle modifié',
  user_deleted: 'Utilisateur supprimé',
  property_approved: 'Bien approuvé',
  property_rejected: 'Bien rejeté',
  property_deleted: 'Bien supprimé',
  property_featured: 'Bien mis en avant',
  property_unfeatured: 'Bien retiré',
  property_certified: 'Bien certifié',
  property_decertified: 'Bien décertifié',
  notaire_code_created: 'Code notaire créé',
  notaire_assigned: 'Notaire assigné',
  create_admin: 'Admin créé',
  admin_deleted: 'Admin supprimé',
  report_reviewed: 'Signalement traité',
  report_dismissed: 'Signalement ignoré',
  cgv_updated: 'CGV modifiées',
  ad_created: 'Publicité créée',
  ad_updated: 'Publicité modifiée',
  ad_deleted: 'Publicité supprimée',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  admin_login: <CheckCircle className="w-4 h-4" />,
  admin_logout: <Key className="w-4 h-4" />,
  admin_login_failed: <XCircle className="w-4 h-4" />,
  admin_account_locked: <Ban className="w-4 h-4" />,
  user_suspended: <Ban className="w-4 h-4" />,
  user_reactivated: <RefreshCw className="w-4 h-4" />,
  user_deleted: <UserMinus className="w-4 h-4" />,
  property_approved: <CheckCircle className="w-4 h-4" />,
  property_rejected: <XCircle className="w-4 h-4" />,
  property_deleted: <Trash2 className="w-4 h-4" />,
  property_featured: <StarIcon />,
  property_certified: <Shield className="w-4 h-4" />,
  property_decertified: <AlertTriangle className="w-4 h-4" />,
  create_admin: <UserPlus className="w-4 h-4" />,
  report_reviewed: <Eye className="w-4 h-4" />,
  report_dismissed: <FileText className="w-4 h-4" />,
  cgv_updated: <Settings className="w-4 h-4" />,
  ad_created: <FileText className="w-4 h-4" />,
  ad_deleted: <Trash2 className="w-4 h-4" />,
};

function StarIcon() {
  return <span style={{ color: HColors.gold }}>★</span>;
}

function getActionColor(action: string): string {
  if (action.includes('failed') || action.includes('locked') || action.includes('suspended') || action.includes('rejected') || action.includes('deleted') || action.includes('decertified')) {
    return HColors.bordeaux;
  }
  if (action.includes('approved') || action.includes('certified') || action.includes('login') || action.includes('reactivated')) {
    return HColors.vertCI;
  }
  return HColors.gold;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<AuditAction | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const allActions = useMemo(() => {
    const actions = Object.entries(ACTION_LABELS);
    actions.sort((a, b) => a[1].localeCompare(b[1], 'fr'));
    return actions;
  }, []);

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        let result: AuditLog[];
        if (filterAction) {
          result = await auditService.getLogsByAction(filterAction, pageSize);
        } else {
          result = await auditService.getAuditLogs(page, pageSize);
        }
        setLogs(result);
      } catch (e) {
        console.error('Failed to load audit logs:', e);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, [filterAction, page]);

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(log =>
      log.action.toLowerCase().includes(term) ||
      log.performed_by_email?.toLowerCase().includes(term) ||
      log.performed_by_name?.toLowerCase().includes(term) ||
      log.target_email?.toLowerCase().includes(term) ||
      log.property_title?.toLowerCase().includes(term) ||
      log.reason?.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  const handleNextPage = () => setPage(p => p + 1);
  const handlePrevPage = () => setPage(p => Math.max(1, p - 1));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="w-6 h-6 animate-spin" style={{ color: HColors.gold }} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-7">
        <div>
          <h1 className="font-bold mb-1" style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 5vw, 2rem)', color: HColors.darkBrown }}>
            Journal d'Audit
          </h1>
          <p className="text-xs sm:text-sm uppercase tracking-widest font-bold opacity-50" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            {filteredLogs.length} entrée(s)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: HColors.brown }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher (email, action, bien...)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: HColors.white, border: `1.5px solid ${HAlpha.gold20}`, color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}
          />
        </div>
        <div className="relative sm:w-56">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: HColors.brown }} />
          <select
            value={filterAction}
            onChange={e => { setFilterAction(e.target.value as AuditAction); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: HColors.white, border: `1.5px solid ${HAlpha.gold20}`, color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}
          >
            <option value="">Toutes les actions</option>
            {allActions.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-2xl p-14 text-center" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <Shield className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold25 }} />
          <p className="text-lg font-semibold mb-1" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
            Aucun log trouvé
          </p>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            {searchTerm ? 'Essayez d\'autres critères de recherche' : 'Les actions sensibles seront enregistrées ici'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: HColors.white, border: `1.5px solid ${HAlpha.gold15}`, boxShadow: '0 4px 25px rgba(26,14,0,0.04)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: 'var(--font-nunito)' }}>
              <thead>
                <tr style={{ background: 'rgba(212,160,23,0.04)', borderBottom: `1.5px solid ${HAlpha.gold15}` }}>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: HColors.brownMid }}>Date</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: HColors.brownMid }}>Action</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: HColors.brownMid }}>Par</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: HColors.brownMid }}>Cible</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: HColors.brownMid }}>Motif</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const actionColor = getActionColor(log.action);
                  const icon = ACTION_ICONS[log.action] || <Shield className="w-4 h-4" />;

                  return (
                    <tr key={log.id} className="border-b hover:bg-amber-50/50 transition-colors" style={{ borderColor: HAlpha.gold10 }}>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: HColors.brownMid }}>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: actionColor }}>
                          {icon}
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs" style={{ color: HColors.darkBrown }}>
                          {log.performed_by_name || log.performed_by_email || log.performed_by}
                          {log.performed_by_email && log.performed_by_name && (
                            <div className="text-[10px] opacity-60">{log.performed_by_email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs" style={{ color: HColors.darkBrown }}>
                          {log.target_name || log.target_email || log.property_title || log.target_uid || '—'}
                          {log.target_email && log.target_name && (
                            <div className="text-[10px] opacity-60">{log.target_email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs max-w-[200px] truncate" style={{ color: HColors.brown }} title={log.reason}>
                          {log.reason || '—'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${HAlpha.gold15}` }}>
            <button onClick={handlePrevPage} disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
              style={{ background: HAlpha.gold10, color: HColors.brownMid }}>
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
            <span className="text-xs font-bold" style={{ color: HColors.brownMid }}>Page {page}</span>
            <button onClick={handleNextPage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: HAlpha.gold10, color: HColors.brownMid }}>
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
