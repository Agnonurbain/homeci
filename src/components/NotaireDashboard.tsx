import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useNotaireDashboard, TabId, isReadyToCertify } from '../hooks/useNotaireDashboard';
import { NotaireStats } from './notaire/NotaireStats';
import { NotaireTabs } from './notaire/NotaireTabs';
import { NotairePropertyCard } from './notaire/NotairePropertyCard';
import NotaireStatsTab from './notaire/NotaireStatsTab';
import { RevokeModal, DelegationModal } from './notaire/NotaireActionModals';
import { NotaireListSkeleton, StatGridSkeleton } from './Skeletons';
import { Search, Building2, FileCheck, RotateCcw, Stamp, X } from 'lucide-react';
import CGVNotaireModal from './CGVNotaireModal';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import TutorialButton from './TutorialButton';
import { TYPE_LABELS } from '../constants/labels';

export default function NotaireDashboard() {
  const { profile } = useAuth();
  const location = useLocation();
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

  return (
    <div className="min-h-screen pb-20" style={{ background: HColors.creamBg }}>
      <header className="pt-8 pb-4 px-4 sm:px-6 lg:px-8 border-b" style={{ background: HColors.forest, borderColor: HAlpha.gold25 }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" 
                 style={{ background: HAlpha.gold15, border: `1px solid ${HAlpha.gold25}` }}>
              <Stamp className="w-6 h-6" style={{ color: HColors.gold }} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black" style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>Espace Notaire</h1>
              <p className="text-[10px] sm:text-xs font-medium opacity-60 text-cream">Maître {profile?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <TutorialButton />
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap"
                    style={{ background: HAlpha.gold10, color: HColors.gold }}>
              <RotateCcw className="w-3 h-3" /> Temps réel actif
            </button>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-8">
          <NotaireTabs activeTab={activeTab} stats={stats} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {activeTab === 'stats' ? (
          <NotaireStatsTab notaireId={profile?.id || ''} />
        ) : (
          <>
        <NotaireStats stats={stats} />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                   placeholder="Rechercher un dossier..."
                   className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none shadow-sm"
                   style={{ background: '#FFFFFF', border: `1px solid ${HAlpha.gold15}` }} />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="px-4 py-3 rounded-2xl text-sm outline-none shadow-sm font-bold"
                  style={{ background: '#FFFFFF', border: `1px solid ${HAlpha.gold15}`, color: HColors.darkBrown }}>
            <option value="">Tous les biens</option>
            {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="p-10 sm:p-20 text-center rounded-2xl sm:rounded-[2.5rem]" style={{ background: '#FFFFFF', border: `1px dashed ${HAlpha.gold30}` }}>
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
          </>
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
