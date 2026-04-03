import { useState } from 'react';
import { Home, Calendar, BarChart3, Bell, X, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';
import { adService } from '../services/adService';
import { KenteLine } from './ui/KenteLine';
import type { Property } from '../types/property';
import type { VisitRequest } from '../services/visitService';
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
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { BOOST_PRICES } from '../types/ad';
import type { BoostDuration } from '../types/ad';
import Toast from './ui/Toast';
import { useToast } from '../hooks/useToast';

// Hooks
import { useOwnerProperties } from '../hooks/useOwnerProperties';
import { useOwnerVisits } from '../hooks/useOwnerVisits';
import { useOwnerNotifications } from '../hooks/useOwnerNotifications';

// Sub-components
import PropertiesTab from './owner/PropertiesTab';
import VisitRequestsTab from './owner/VisitRequestsTab';
import StatsTab from './owner/StatsTab';
import NotificationsTab from './owner/NotificationsTab';
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

  /* ── RENDER ──────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: HColors.creamBg }}>

      {/* ── Tab navigation ── */}
      <div className="sticky top-14 z-10"
        style={{
          background: 'rgba(10,22,14,0.97)', backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${HAlpha.gold15}`,
          overflow: 'hidden'
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <nav className="flex space-x-1 homeci-tabs-scroll flex-1" style={{ minWidth: 0 }}>
            {[
              { id: 'properties', icon: Home, label: 'Mes Biens', count: props.stats.total },
              { id: 'requests', icon: Calendar, label: 'Demandes', count: visits.pendingCount },
              { id: 'stats', icon: BarChart3, label: 'Statistiques' },
              { id: 'notifications', icon: Bell, label: 'Notif.', count: notifs.unreadCount },
            ].map(tab => (
              <button key={tab.id} onClick={() => navigate(`/dashboard/${tab.id}`)}
                aria-label={tab.label}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className="py-4 px-3 sm:px-4 border-b-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2"
                style={activeTab === tab.id
                  ? { borderColor: HColors.orangeCI, color: HColors.orangeDark, fontFamily: 'var(--font-nunito)' }
                  : { borderColor: 'transparent', color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={tab.id === 'notifications'
                      ? { background: HColors.bordeaux, color: HColors.cream }
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
      {boostProp && !boostPaymentConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,22,14,0.88)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" style={{ background: HColors.night, border: `1px solid ${HAlpha.gold20}` }}>
            <div className="px-6 pt-5 pb-3">
              <KenteLine />
              <div className="flex items-center justify-between mt-4 mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
                  <Zap className="w-5 h-5 text-yellow-400" /> Sponsoriser le bien
                </h2>
                <button onClick={() => setBoostProp(null)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <X className="w-4 h-4" style={{ color: 'rgba(245,230,200,0.4)' }} />
                </button>
              </div>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <p className="text-sm" style={{ color: 'rgba(245,230,200,0.8)', fontFamily: 'var(--font-nunito)' }}>
                Augmentez la visibilité de <strong>{boostProp.title}</strong> en l'affichant en tête des résultats avec un badge spécial.
              </p>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(245,230,200,0.6)', fontFamily: 'var(--font-nunito)' }}>
                  Durée du boost
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([7, 14, 30] as BoostDuration[]).map(d => (
                    <button key={d} onClick={() => setBoostDuration(d)}
                      className="py-3 rounded-xl text-center text-sm font-medium transition-all"
                      style={boostDuration === d
                        ? { background: HAlpha.gold20, border: `2px solid ${HColors.gold}`, color: HColors.cream, fontFamily: 'var(--font-nunito)' }
                        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,230,200,0.6)', fontFamily: 'var(--font-nunito)' }}>
                      <div className="font-bold">{BOOST_PRICES[d].label}</div>
                      <div className="text-xs mt-0.5" style={{ color: HColors.gold }}>{BOOST_PRICES[d].price} FCFA</div>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setBoostPaymentConfig({ amount: BOOST_PRICES[boostDuration].price, title: 'Sponsoriser le bien', description: 'Boost : ' + boostProp.title })}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                Payer {BOOST_PRICES[boostDuration].price} FCFA
              </button>
            </div>
          </div>
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,22,14,0.88)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative" style={{ background: HColors.night, border: `1px solid ${HAlpha.gold20}` }}>
            <button onClick={() => setAvailabilityProp(null)} className="absolute top-4 right-4 p-1.5 rounded-lg z-10" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <X className="w-4 h-4" style={{ color: 'rgba(245,230,200,0.4)' }} />
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
