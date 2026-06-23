import { useState } from 'react';
import { Home, Calendar, BarChart3, Bell, X, Plus, Building2, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { adService } from '../services/adService';
import { chatService } from '../services/chatService';
import type { Property } from '../types/property';
import type { VisitRequest } from '../services/visitService';
import type { BoostDuration } from '../types/ad';
import AddPropertyForm from './AddPropertyForm';
import EditPropertyForm from './EditPropertyForm';
import PropertyViewModal from './PropertyViewModal';
import CGVModal from './CGVModal';
import PaymentModal from './PaymentModal';
import type { PaymentConfig } from './PaymentModal';
import AvailabilityManager from './AvailabilityManager';
import ChatBox from './ChatBox';
import SatisfactionModal from './SatisfactionModal';
import TutorialButton from './TutorialButton';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import Toast from './ui/Toast';
import { useToast } from '../hooks/useToast';
import StatBadge from './shared/StatBadge';
import RealTimeIndicator from './shared/RealTimeIndicator';
import MobilePaymentBanner from './shared/MobilePaymentBanner';

// Hooks
import { useOwnerProperties } from '../hooks/useOwnerProperties';
import { useOwnerVisits } from '../hooks/useOwnerVisits';
import { useOwnerNotifications } from '../hooks/useOwnerNotifications';
import { useTabNavigation } from '../hooks/useTabNavigation';

// Sub-components
import PropertiesTab from './owner/PropertiesTab';
import VisitRequestsTab from './owner/VisitRequestsTab';
import StatsTab from './owner/StatsTab';
import NotificationsTab from './owner/NotificationsTab';
import BoostModal from './owner/BoostModal';
import VisitResponseModal from './owner/VisitResponseModal';
import PropertyStatusModal from './owner/PropertyStatusModal';
import VisitDisclaimerModal from './owner/VisitDisclaimerModal';

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function OwnerAgentDashboard() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab routing
  type Tab = 'properties' | 'requests' | 'stats' | 'notifications';
  const validTabs: Tab[] = ['properties', 'requests', 'stats', 'notifications'];
  const tabFromUrl = location.pathname.split('/')[2];
  const { containerRef: tabsRef, handleKeyDown: tabKeyDown } = useTabNavigation(validTabs, tabFromUrl as Tab || 'properties', (id) => navigate(`/dashboard/${id}`));
  const activeTab: Tab = validTabs.includes(tabFromUrl as Tab) ? tabFromUrl as Tab : 'properties';

  // Core data hooks
  const { toast, showToast, hideToast } = useToast();
  const props = useOwnerProperties(user?.uid);
  const visits = useOwnerVisits(user?.uid, props.flagNeedsStatusUpdate, showToast);
  const notifs = useOwnerNotifications(user?.uid);

  // Modal states (CGV flow, forms, boost, chat, availability, status)
  const [showCGV, setShowCGV] = useState(false);
  const [showPublicationPayment, setShowPublicationPayment] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [viewingPropertyId, setViewingPropertyId] = useState<string | null>(null);
  const [boostProp, setBoostProp] = useState<Property | null>(null);
  const [boostDuration, setBoostDuration] = useState<BoostDuration>(7);
  const [boostPaymentConfig, setBoostPaymentConfig] = useState<PaymentConfig | null>(null);
  const [availabilityProp, setAvailabilityProp] = useState<Property | null>(null);
  const [activeChat, setActiveChat] = useState<{ chatId: string; otherName: string; otherRole: 'Locataire' } | null>(null);
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{ property: Property; loading: boolean } | null>(null);

  // Handlers
  const handleAddProperty = () => setShowCGV(true);

  const handleOpenChat = async (visit: VisitRequest) => {
    if (!user) return;
    setChatLoadingId(visit.id);
    try {
      const chatId = await chatService.getOrCreateChat(visit.id, visit.property_id, visit.tenant_id, user.uid);
      setActiveChat({ chatId, otherName: visit.tenant_name || 'Locataire', otherRole: 'Locataire' });
    } catch (e) { console.error(e); }
    finally { setChatLoadingId(null); }
  };

  const handleUpdatePropertyStatus = async (status: 'rented' | 'sold' | 'published' | 'failed') => {
    if (!statusModal) return;
    setStatusModal(prev => prev ? { ...prev, loading: true } : null);
    try {
      await props.updatePropertyStatus(statusModal.property, status, visits.visits);
      setStatusModal(null);
    } catch (e) {
      console.error('[HOMECI] Erreur mise à jour statut:', e);
    } finally {
      setStatusModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  const acceptedVisitsCount = visits.visits.filter(v => v.status === 'accepted').length;

  /* ── RENDER ──────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: HColors.creamBg }}>

      {/* ── Header ── */}
      <div className="sticky top-14 z-10"
        style={{
          background: 'rgba(27,94,58,0.97)', backdropFilter: 'blur(16px)',
          borderBottom: `1.5px solid ${HAlpha.gold25}`,
        }}>
        <KenteLine />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Identity row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3 pt-3.5 pb-0">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: HAlpha.gold10, border: `1.5px solid ${HAlpha.gold25}` }}>
                <Building2 className="w-6 h-6" style={{ color: HColors.gold }} />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.35rem', fontWeight: 700, color: HColors.cream, lineHeight: 1 }}>
                  Espace Propriétaire
                </h1>
                <p style={{ fontSize: 11, color: 'rgba(245,230,200,0.50)', fontWeight: 600, fontFamily: 'var(--font-nunito)' }}>
                  {profile?.full_name || 'Propriétaire'} · Propriétaire
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <StatBadge icon={<Home className="w-3.5 h-3.5" />} label="Biens" value={props.stats.total} color={HColors.gold} onClick={() => navigate('/dashboard/properties')} />
              <StatBadge icon={<Clock className="w-3.5 h-3.5" />} label="En attente" value={visits.pendingCount} color={HColors.orangeCI} onClick={() => navigate('/dashboard/requests')} />
              {acceptedVisitsCount > 0 && (
                <StatBadge icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Acceptées" value={acceptedVisitsCount} color={HColors.vertCI} onClick={() => navigate('/dashboard/requests')} />
              )}
              <RealTimeIndicator />
              <button onClick={handleAddProperty}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11px] font-extrabold transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#fff', boxShadow: '0 4px 14px rgba(255,107,0,0.3)' }}>
                <Plus className="w-3.5 h-3.5" /> Ajouter un bien
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-2">
            <nav ref={tabsRef as React.RefObject<HTMLElement>} role="tablist" onKeyDown={tabKeyDown} className="flex gap-1 homeci-tabs-scroll flex-1" style={{ minWidth: 0 }}>
              {[
                { id: 'properties', icon: Home, label: 'Biens', fullLabel: 'Mes Biens', count: props.stats.total },
                { id: 'requests', icon: Calendar, label: 'Visites', fullLabel: 'Demandes', count: visits.pendingCount },
                { id: 'stats', icon: BarChart3, label: 'Stats', fullLabel: 'Statistiques' },
                { id: 'notifications', icon: Bell, label: 'Notif.', fullLabel: 'Notifications', count: notifs.unreadCount },
              ].map(tab => (
                <button key={tab.id} data-tab-id={tab.id} onClick={() => navigate(`/dashboard/${tab.id}`)}
                  role="tab" aria-selected={activeTab === tab.id} tabIndex={activeTab === tab.id ? 0 : -1}
                  className="py-3 px-3 sm:px-4 text-[11px] sm:text-[13px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2"
                  style={{
                    borderBottom: `2.5px solid ${activeTab === tab.id ? HColors.orangeDark : 'transparent'}`,
                    color: activeTab === tab.id ? HColors.orangeDark : 'rgba(245,230,200,0.50)',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontFamily: 'var(--font-nunito)',
                  }}>
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.fullLabel}</span>
                  <span className="sm:hidden">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold"
                      style={tab.id === 'notifications'
                        ? { background: HColors.bordeaux, color: '#fff' }
                        : { background: HAlpha.orange20, color: HColors.orangeDark }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <TutorialButton />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ overflow: 'hidden' }}>

        {activeTab === 'properties' && (
          <PropertiesTab
            properties={props.properties}
            loading={props.loading}
            stats={props.stats}
            submittingVerif={props.submittingVerif}
            onAddProperty={handleAddProperty}
            onExportCSV={props.exportCSV}
            onViewProperty={(id) => setViewingPropertyId(id)}
            onEditProperty={(id) => setEditingPropertyId(id)}
            onStatusUpdate={(p) => setStatusModal({ property: p, loading: false })}
            onAvailability={(p) => setAvailabilityProp(p)}
            onBoost={(p) => { setBoostProp(p); setBoostDuration(7); }}
            onSubmitVerification={props.submitForVerification}
          />
        )}

        {activeTab === 'requests' && (
          <VisitRequestsTab
            visits={visits.visits}
            filteredVisits={visits.filteredVisits}
            filter={visits.filter}
            setFilter={visits.setFilter}
            actionLoading={visits.actionLoading}
            chatLoadingId={chatLoadingId}
            onRespond={visits.openVisitResponse}
            onMarkCompleted={visits.markCompleted}
            onOpenChat={handleOpenChat}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab
            stats={props.stats}
            totalVisits={visits.visits.length}
            viewsChartData={props.viewsChartData}
            typeChartData={props.typeChartData}
            monthlyChartData={props.monthlyChartData}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsTab
            notifications={notifs.notifications}
            unreadCount={notifs.unreadCount}
            onMarkAsRead={notifs.markAsRead}
            onMarkAllRead={notifs.markAllAsRead}
            onNavigate={(tab) => {
              const tabId = tab === 'visits' ? 'requests' : tab;
              navigate(`/dashboard/${tabId}`);
            }}
          />
        )}

        {(activeTab === 'properties' || activeTab === 'requests') && <MobilePaymentBanner />}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showCGV && (
        <CGVModal
          onAccept={() => { setShowCGV(false); setShowPublicationPayment(true); }}
          onClose={() => setShowCGV(false)}
        />
      )}
      {showPublicationPayment && (
        <PaymentModal
          config={{ title: 'Frais de publication', description: 'Publication de votre annonce sur HOMECI', amount: 1000 }}
          onSuccess={() => { setShowPublicationPayment(false); setShowAddForm(true); }}
          onClose={() => setShowPublicationPayment(false)}
        />
      )}
      {showAddForm && <AddPropertyForm onClose={() => setShowAddForm(false)} onSuccess={() => {}} />}
      {editingPropertyId && <EditPropertyForm propertyId={editingPropertyId} onClose={() => setEditingPropertyId(null)} onSuccess={() => {}} />}
      {viewingPropertyId && <PropertyViewModal propertyId={viewingPropertyId} onClose={() => setViewingPropertyId(null)} />}

      {/* Visit response modal */}
      {visits.selectedVisit && (
        <VisitResponseModal
          visit={visits.selectedVisit}
          counterDate={visits.counterDate}
          counterTime={visits.counterTime}
          actionLoading={visits.actionLoading}
          onCounterDateChange={visits.setCounterDate}
          onCounterTimeChange={visits.setCounterTime}
          onAction={visits.respondToVisit}
          onClose={visits.closeVisitResponse}
        />
      )}

      {/* Property status modal */}
      {statusModal && (
        <PropertyStatusModal
          property={statusModal.property}
          loading={statusModal.loading}
          onSelectStatus={handleUpdatePropertyStatus}
          onClose={() => setStatusModal(null)}
        />
      )}

      {/* Visit disclaimer */}
      {visits.disclaimerVisit && (
        <VisitDisclaimerModal
          data={visits.disclaimerVisit}
          onClose={visits.dismissDisclaimer}
        />
      )}

      {/* Boost modal */}
      {boostProp && (
        <BoostModal 
          property={boostProp}
          duration={boostDuration}
          onDurationChange={setBoostDuration}
          onConfirm={(config) => setBoostPaymentConfig(config)}
          onClose={() => setBoostProp(null)}
        />
      )}

      {/* Boost payment */}
      {boostPaymentConfig && boostProp && (
        <PaymentModal
          config={boostPaymentConfig}
          onSuccess={async () => {
            if (user) {
              await adService.createBoost(boostProp.id, boostProp.title, user.uid, boostDuration);
            }
            setBoostPaymentConfig(null);
            setBoostProp(null);
            setBoostDuration(7);
            showToast("Sponsoring activé avec succès !", "success");
          }}
          onClose={() => setBoostPaymentConfig(null)}
        />
      )}

      {/* Availability */}
      {availabilityProp && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" style={{ background: 'rgba(10,22,14,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative" style={{ background: HColors.night, border: `1.5px solid ${HAlpha.gold20}` }}>
            <button onClick={() => setAvailabilityProp(null)} className="absolute top-5 right-5 p-2 rounded-xl z-20 transition-all hover:bg-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <X className="w-4 h-4" style={{ color: 'rgba(245,230,200,0.5)' }} />
            </button>
            <AvailabilityManager propertyId={availabilityProp.id} ownerId={user.uid} />
          </div>
        </div>
      )}

      {/* Chat */}
      {activeChat && user && (
        <ChatBox
          chatId={activeChat.chatId}
          currentUserId={user.uid}
          otherUserName={activeChat.otherName}
          otherUserRole={activeChat.otherRole}
          onClose={() => setActiveChat(null)}
        />
      )}

      {/* Satisfaction survey */}
      {visits.surveyData && user && (
        <SatisfactionModal
          isOpen={true}
          onClose={() => {
            const { trigger, propertyId } = visits.surveyData!;
            visits.dismissSurvey();
            if (trigger === 'visit_completed' && propertyId) {
              const prop = props.properties.find(p => p.id === propertyId);
              if (prop && prop.status === 'published') {
                setStatusModal({ property: prop, loading: false });
              }
            }
          }}
          userId={user.uid}
          userRole={profile?.role || 'proprietaire'}
          trigger={visits.surveyData.trigger}
          propertyId={visits.surveyData.propertyId}
          propertyTitle={visits.surveyData.propertyTitle}
        />
      )}

      {/* Global Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
    </div>
  );
}
