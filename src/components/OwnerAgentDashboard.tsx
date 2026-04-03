import { useState } from 'react';
import { Home, Calendar, BarChart3, Bell, X } from 'lucide-react';
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
import { HColors, HAlpha } from '../styles/homeci-tokens';
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
          background: 'rgba(3,10,6,0.98)', backdropFilter: 'blur(16px)',
          borderBottom: `1.5px solid ${HAlpha.gold15}`,
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
