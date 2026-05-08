import { useState, lazy, Suspense } from 'react';
import {
  Heart, Calendar, Search, Bell, FileText
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
import Toast from './ui/Toast';
import { useToast } from '../hooks/useToast';
import StatBadge from './shared/StatBadge';
import MobilePaymentBanner from './shared/MobilePaymentBanner';

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
  const { filtered, loading: propsLoading, handleFilterChange, allProperties, sortBy, setSortBy } = useTenantProperties();
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
      <div className="sticky top-14 z-10" style={{ background: HColors.forest, borderBottom: `1px solid ${HAlpha.gold25}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 mb-3.5">
            <div className="text-center sm:text-left">
              <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.2rem, 4vw, 1.75rem)', fontWeight: 700, color: HColors.cream, lineHeight: 1 }}>
                Bonjour, {firstName} 👋
              </h1>
              <p style={{ fontSize: 10, color: 'rgba(245,230,200,0.50)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginTop: 4, fontFamily: 'var(--font-nunito)' }}>
                Trouvez et planifiez vos visites
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center sm:justify-start items-center">
              <TutorialButton />
              <StatBadge icon="❤️" label="Favoris" value={favoriteIds.length} color="#FF6B00" onClick={() => navigate('/dashboard/favorites')} />
              <StatBadge icon="⏳" label="En attente" value={pendingVisitsCount} color="#D4A017" onClick={() => navigate('/dashboard/visits')} />
              {acceptedVisitsCount > 0 && <StatBadge icon="✅" label="Acceptées" value={acceptedVisitsCount} color="#009E49" onClick={() => navigate('/dashboard/visits')} />}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-0.5 homeci-tabs-scroll">
            {[
              { id: 'search', icon: Search, label: 'Rechercher', count: undefined },
              { id: 'favorites', icon: Heart, label: 'Mes favoris', count: favoriteIds.length || undefined },
              { id: 'visits', icon: Calendar, label: 'Mes visites', count: visitRequests.length || undefined },
              { id: 'notifications', icon: Bell, label: 'Notifications', count: unreadCount || undefined },
              { id: 'dossier', icon: FileText, label: 'Mon Dossier', count: undefined },
            ].map(tab => (
              <button key={tab.id} onClick={() => navigate(`/dashboard/${tab.id}`)}
                className="flex items-center gap-1.5 py-2.5 px-4 whitespace-nowrap transition-all"
                style={{
                  borderBottom: `2.5px solid ${activeTab === tab.id ? HColors.gold : 'transparent'}`,
                  color: activeTab === tab.id ? HColors.gold : 'rgba(245,230,200,0.50)',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: 13,
                  fontFamily: 'var(--font-nunito)',
                }}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="rounded-full text-[10px] font-extrabold"
                    style={{
                      padding: '1px 7px',
                      ...(tab.id === 'notifications'
                        ? { background: HColors.bordeaux, color: '#fff', border: `1px solid ${HColors.bordeaux}` }
                        : activeTab === tab.id
                          ? { background: HAlpha.gold20, color: HColors.gold, border: `1px solid ${HAlpha.gold20}` }
                          : { background: HAlpha.gold10, color: 'rgba(245,230,200,0.50)', border: `1px solid ${HAlpha.gold20}` }
                      ),
                    }}>
                    {tab.count}
                  </span>
                )}
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
            sortBy={sortBy}
            onSortChange={setSortBy}
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

        {(activeTab === 'search' || activeTab === 'visits' || activeTab === 'dossier') && <MobilePaymentBanner />}
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

