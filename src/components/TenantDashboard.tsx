import { useState, lazy, Suspense } from 'react';
import { 
  Heart, Calendar, Search, Bell, FileText, CheckCircle, Clock
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// Hooks
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { useTenantProperties } from '../hooks/useTenantProperties';
import { useTenantVisits } from '../hooks/useTenantVisits';
import { useTenantNotifications } from '../hooks/useTenantNotifications';

// Components
import { PropertyGridSkeleton } from './Skeletons';
import PropertyViewModal from './PropertyViewModal';
import CGVLocataireModal from './CGVLocataireModal';
import ChatBox from './ChatBox';
import TutorialButton from './TutorialButton';
import { KenteLine } from './ui/KenteLine';
import Toast from './ui/Toast';
import { useToast } from '../hooks/useToast';

// Specialized Tab Components
import SearchTab from './tenant/SearchTab';
import VisitsTab from './tenant/VisitsTab';
import FavoritesTab from './tenant/FavoritesTab';
import NotificationsTab from './tenant/NotificationsTab';
import VisitRequestModal from './tenant/VisitRequestModal';

// Styles
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { chatService } from '../services/chatService';

const TenantDossier = lazy(() => import('./TenantDossier'));

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function TenantDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites(user?.uid);

  const { toast, showToast, hideToast } = useToast();
  
  // Modular Hooks
  const { filtered, loading: propsLoading, handleFilterChange, allProperties } = useTenantProperties();
  const { visitRequests, visitProperties, handleAcceptCounter, handleProposeCounter, requestVisit } = useTenantVisits(user?.uid, profile?.full_name, showToast);
  const { notifications, unreadCount, handleMarkAllRead, loading: notifLoading } = useTenantNotifications(user?.uid);

  // UI State
  const tabFromUrl = location.pathname.split('/')[2];
  const validTabs = ['search', 'favorites', 'visits', 'notifications', 'dossier'];
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl as any : 'search';

  const [viewingPropertyId, setViewingPropertyId] = useState<string | null>(null);
  const [visitModalProperty, setVisitModalProperty] = useState<any | null>(null);
  const [showCGV, setShowCGV] = useState(false);
  const [pendingVisitProp, setPendingVisitProp] = useState<any | null>(null);
  
  const [activeChat, setActiveChat] = useState<{ chatId: string; otherName: string; otherRole: any } | null>(null);
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);

  // Handlers
  const handleOpenChat = async (visit: any) => {
    if (!user) return;
    setChatLoadingId(visit.id);
    try {
      const chatId = await chatService.getOrCreateChat(visit.id, visit.property_id, user.uid, visit.owner_id);
      setActiveChat({ chatId, otherName: 'Propriétaire / Agent', otherRole: 'Propriétaire' });
    } catch (e) { console.error(e); }
    finally { setChatLoadingId(null); }
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'vous';
  const pendingVisitsCount = visitRequests.filter(v => v.status === 'pending').length;
  const acceptedVisitsCount = visitRequests.filter(v => v.status === 'accepted').length;

  return (
    <div className="min-h-screen" style={{ background: HColors.creamBg }}>

      {/* Header */}
      <div style={{ background: HColors.forest, borderBottom: `1px solid ${HAlpha.gold25}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 mb-5">
            <div className="text-center sm:text-left">
              <h1 className="font-bold mb-0.5 text-cream" style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.2rem, 5vw, 1.8rem)' }}>
                Bonjour, {firstName} 👋
              </h1>
              <p className="text-[10px] sm:text-sm text-cream/50 uppercase tracking-widest font-bold">Trouvez et planifiez vos visites</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center sm:justify-start items-center">
              <TutorialButton />
              <StatBadge icon={<Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="Favoris" value={favoriteIds.length} accent="#FF6B00" onClick={() => navigate('/dashboard/favorites')} />
              <StatBadge icon={<Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="En attente" value={pendingVisitsCount} accent="#D4A017" onClick={() => navigate('/dashboard/visits')} />
              {acceptedVisitsCount > 0 && <StatBadge icon={<CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} label="Acceptées" value={acceptedVisitsCount} accent="#009E49" onClick={() => navigate('/dashboard/visits')} />}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 homeci-tabs-scroll">
            {[
              { id: 'search', icon: Search, label: 'Rechercher' },
              { id: 'favorites', icon: Heart, label: 'Mes favoris' },
              { id: 'visits', icon: Calendar, label: 'Mes visites' },
              { id: 'notifications', icon: Bell, label: 'Notifications', count: unreadCount },
              { id: 'dossier', icon: FileText, label: 'Mon Dossier' },
            ].map(tab => (
              <button key={tab.id} onClick={() => navigate(`/dashboard/${tab.id}`)}
                className={`py-3 px-4 border-b-2 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'border-gold text-gold' : 'border-transparent text-cream/50'}`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-bordeaux text-cream">{tab.count}</span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        
        {activeTab === 'search' && (
          <SearchTab 
            loading={propsLoading}
            properties={filtered}
            onFilterChange={handleFilterChange}
            onFavorite={toggleFavorite}
            isFavorite={isFavorite}
            onViewProperty={setViewingPropertyId}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesTab 
             favoriteProperties={allProperties.filter(p => favoriteIds.includes(p.id))}
             onFavorite={toggleFavorite}
             onViewProperty={setViewingPropertyId}
          />
        )}

        {activeTab === 'visits' && (
          <VisitsTab 
             visitRequests={visitRequests}
             visitProperties={visitProperties}
             onViewProperty={setViewingPropertyId}
             onOpenChat={handleOpenChat}
             chatLoadingId={chatLoadingId}
             onAcceptCounter={handleAcceptCounter}
             onProposeCounter={handleProposeCounter}
             onReplan={(p) => { setPendingVisitProp(p); setShowCGV(true); }}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsTab 
             notifications={notifications}
             unreadCount={unreadCount}
             onMarkAllRead={handleMarkAllRead}
             loading={notifLoading}
             onNavigate={(tab: any) => navigate(`/dashboard/${tab}`)}
          />
        )}

        {activeTab === 'dossier' && (
          <Suspense fallback={<PropertyGridSkeleton count={2} />}>
            <TenantDossier />
          </Suspense>
        )}

        {/* Africa Kente Banner (Shared) */}
        {(activeTab === 'search' || activeTab === 'visits') && (
            <div className="mt-6 rounded-2xl overflow-hidden">
                <KenteLine />
                <div className="p-5 flex items-center gap-4 flex-wrap" style={{ background: 'linear-gradient(135deg,#0D1F12,#1A0E00)' }}>
                    <div className="flex-1">
                        <h3 className="font-bold mb-1 text-cream" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
                            💳 Paiements mobiles — Bientôt disponibles
                        </h3>
                        <p className="text-sm text-cream/60">Payez cautions et loyers via Orange Money, MTN MoMo, Wave...</p>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Modals */}
      {viewingPropertyId && (
        <PropertyViewModal 
           propertyId={viewingPropertyId} 
           onClose={() => setViewingPropertyId(null)}
           onRequestVisit={() => { 
             const prop = allProperties.find(p => p.id === viewingPropertyId);
             if (prop) {
               setPendingVisitProp(prop); 
               setShowCGV(true); 
             }
           }}
        />
      )}

      {showCGV && pendingVisitProp && (
        <CGVLocataireModal 
           onAccept={() => { setShowCGV(false); setVisitModalProperty(pendingVisitProp); }}
           onClose={() => { setShowCGV(false); setPendingVisitProp(null); }}
        />
      )}

      {visitModalProperty && (
        <VisitRequestModal 
           property={visitModalProperty}
           onClose={() => setVisitModalProperty(null)}
           onSubmit={(date, time) => requestVisit(visitModalProperty, date, time, profile)}
        />
      )}

      {activeChat && user && (
        <ChatBox 
          chatId={activeChat.chatId}
          currentUserId={user.uid}
          otherUserName={activeChat.otherName}
          otherUserRole={activeChat.otherRole}
          onClose={() => setActiveChat(null)}
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

function StatBadge({ icon, label, value, accent, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-bold transition-all hover:scale-105"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: HColors.cream }}>
      <span style={{ color: accent }}>{icon}</span>
      <span className="opacity-50">{label}</span>
      <span className="px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded-full bg-white/10">{value}</span>
    </button>
  );
}
