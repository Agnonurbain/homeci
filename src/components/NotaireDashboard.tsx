import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotaireDashboard, TabId, isReadyToCertify } from '../hooks/useNotaireDashboard';
import { NotaireTabs } from './notaire/NotaireTabs';
import { NotairePropertyCard } from './notaire/NotairePropertyCard';
import NotaireStatsTab from './notaire/NotaireStatsTab';
import PipelineBar from './notaire/PipelineBar';
import NotaireSidebar from './notaire/NotaireSidebar';
import { RevokeModal, DelegationModal } from './notaire/NotaireActionModals';
import { NotaireListSkeleton, StatGridSkeleton } from './Skeletons';
import { Search, Building2, FileCheck, X } from 'lucide-react';
import CGVNotaireModal from './CGVNotaireModal';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import TutorialButton from './TutorialButton';
import StatBadge from './shared/StatBadge';
import RealTimeIndicator from './shared/RealTimeIndicator';
import { TYPE_LABELS } from '../constants/labels';

export default function NotaireDashboard() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const {
    loading,
    owners,
    stats,
    actionLoading,
    takingId,
    certifyingId,
    revokeModal,
    setRevokeModal,
    delegationToken,
    setDelegationToken,
    handleDocAction,
    handleCertify,
    doTakeCharge,
    handleRevoke
  } = useNotaireDashboard(profile, showToast);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCGVNotaire, setShowCGVNotaire] = useState(false);
  const [pendingTakeChargeProperty, setPendingTakeChargeProperty] = useState<any>(null);

  const tabFromUrl = location.pathname.split('/')[2];
  const validTabs: TabId[] = ['disponible', 'en_cours', 'pret', 'certifie', 'stats'];
  const activeTab = validTabs.includes(tabFromUrl as TabId) ? tabFromUrl as TabId : 'disponible';

  const filtered = useMemo(() => {
    let list = [...(stats.lists[activeTab as keyof typeof stats.lists] || [])];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.city?.toLowerCase().includes(q) || 
        (owners[p.owner_id]?.full_name || '').toLowerCase().includes(q)
      );
    }
    if (filterType) list = list.filter(p => p.property_type === filterType);
    return list;
  }, [stats.lists, activeTab, searchQuery, filterType, owners]);

  if (loading) return (
    <div className="min-h-screen p-4 sm:p-10 space-y-6 sm:space-y-8" style={{ background: HColors.creamBg }}>
      <StatGridSkeleton count={4} />
      <NotaireListSkeleton count={4} />
    </div>
  );

  const urgentCount = stats.disponible || 0;
  const enCoursCount = stats.enCours || 0;
  const certifiesMoisCount = stats.certifie || 0;

  return (
    <div className="min-h-screen pb-20" style={{ background: HColors.creamBg }}>
      <header className="sticky top-14 z-10" style={{ background: HColors.forest, borderBottom: `1px solid ${HAlpha.gold25}` }}>
        <KenteLine />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 pb-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
                   style={{ background: HAlpha.gold10, border: `1.5px solid ${HAlpha.gold25}` }}>
                <span style={{ fontSize: 22 }}>🏛</span>
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.3rem', fontWeight: 700, color: HColors.cream, lineHeight: 1 }}>
                  Espace Notaire
                </h1>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(245,230,200,0.55)', fontFamily: 'var(--font-nunito)' }}>
                  Maître {profile?.full_name} — Abidjan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <StatBadge icon="🔴" label="Urgent" value={urgentCount} color={HColors.orangeCI} onClick={() => navigate('/dashboard/disponible')} />
              <StatBadge icon="📋" label="En cours" value={enCoursCount} color={HColors.gold} onClick={() => navigate('/dashboard/en_cours')} />
              <StatBadge icon="✅" label="Certifiés ce mois" value={certifiesMoisCount} color={HColors.vertCI} onClick={() => navigate('/dashboard/certifie')} />
              <RealTimeIndicator />
              <TutorialButton />
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <PipelineBar activeTab={activeTab} stats={stats} />
          </div>
          <div className="max-w-7xl mx-auto">
            <NotaireTabs activeTab={activeTab} stats={stats} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'stats' ? (
          <NotaireStatsTab notaireId={profile?.id || ''} />
        ) : (
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 320px' }}>
            <div className="space-y-5 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.25rem', fontWeight: 700, color: HColors.darkBrown }}>
                    {activeTab === 'disponible' ? 'Disponibles' : activeTab === 'en_cours' ? 'En cours' : activeTab === 'pret' ? 'Prêts à certifier' : 'Certifiés'}
                  </h2>
                  <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: HAlpha.gold10, color: HColors.gold, border: `1px solid ${HAlpha.gold25}` }}>
                    {filtered.length}
                  </span>
                </div>
                {activeTab === 'pret' && stats.pret > 0 && (
                  <div className="flex items-center gap-1.5" style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(139,29,29,0.08)', border: '1px solid rgba(139,29,29,0.2)' }}>
                    <span style={{ fontSize: 12 }}>⚡</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: HColors.bordeaux }}>{stats.pret} dossiers urgents</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                         placeholder="Rechercher un dossier..."
                         className="w-full pl-10 pr-4 py-3 text-sm outline-none"
                         style={{ background: '#FFFFFF', border: `1px solid ${HAlpha.gold15}`, borderRadius: 12, fontSize: 13, color: HColors.darkBrown }} />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                        className="px-4 py-3 text-sm outline-none font-bold"
                        style={{ background: '#FFFFFF', border: `1px solid ${HAlpha.gold15}`, color: HColors.darkBrown, borderRadius: 12, fontSize: 12 }}>
                  <option value="">Tous les biens</option>
                  {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div className="space-y-2.5">
                {filtered.length === 0 ? (
                  <div className="p-10 sm:p-20 text-center" style={{ background: '#FFFFFF', border: `1px dashed ${HAlpha.gold30}`, borderRadius: 18 }}>
                    <Building2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-20" />
                    <p className="text-xs sm:text-sm font-bold opacity-40">Aucun dossier trouvé dans cette section</p>
                  </div>
                ) : (
                  filtered.map(property => (
                    <NotairePropertyCard
                      key={property.id}
                      property={property}
                      owners={owners}
                      activeTab={activeTab}
                      isExpanded={expandedId === property.id}
                      onToggleExpand={() => setExpandedId(expandedId === property.id ? null : property.id)}
                      onTakeCharge={(p: any) => { setPendingTakeChargeProperty(p); setShowCGVNotaire(true); }}
                      takingId={takingId}
                      actionLoading={actionLoading}
                      handleDocAction={handleDocAction}
                      handleCertify={handleCertify}
                      certifyingId={certifyingId}
                      isReadyToCertify={isReadyToCertify}
                    />
                  ))
                )}
              </div>
            </div>

            <aside className="hidden lg:block">
              <NotaireSidebar stats={stats} onCreateDelegation={() => setDelegationToken({ token: '', action: 'certify', propertyTitle: '' })} />
            </aside>
          </div>
        )}
      </main>

      <RevokeModal 
        isOpen={!!revokeModal} 
        onClose={() => setRevokeModal(null)} 
        onConfirm={(reason: string) => revokeModal && handleRevoke(revokeModal.property, reason)}
        loading={revokeModal?.loading}
        property={revokeModal?.property}
        hasActiveVisit={revokeModal?.hasActiveVisit}
      />

      <DelegationModal 
        token={delegationToken?.token} 
        action={delegationToken?.action} 
        propertyTitle={delegationToken?.propertyTitle}
        onClose={() => setDelegationToken(null)}
      />

      {showCGVNotaire && (
        <CGVNotaireModal 
          onClose={() => setShowCGVNotaire(false)}
          onAccept={() => {
            if (pendingTakeChargeProperty) doTakeCharge(pendingTakeChargeProperty);
            setShowCGVNotaire(false);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 duration-500">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md`}
               style={{ background: toast.ok ? 'rgba(45,106,79,0.95)' : 'rgba(139,29,29,0.95)', color: '#FFFFFF' }}>
            {toast.ok ? <FileCheck className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <span className="text-sm font-bold">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
