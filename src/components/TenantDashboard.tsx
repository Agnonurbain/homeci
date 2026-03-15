import { useState, useEffect, useRef } from 'react';
import {
  Heart, Calendar, Search, Map, List, X, Phone, CheckCircle,
  XCircle, Clock, Bell, MapPin, Bed, Bath, Maximize, Eye,
  ChevronLeft, ChevronRight, Star, AlertCircle, TrendingUp,
} from 'lucide-react';
import { propertyService } from '../services/propertyService';
import { visitService } from '../services/visitService';
import ScrollTimePicker from './ScrollTimePicker';
import { notificationService } from '../services/notificationService';
import type { VisitRequest } from '../services/visitService';
import type { Notification } from '../services/notificationService';
import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';
import MapDisplay from './MapDisplay';
import PropertyViewModal from './PropertyViewModal';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import type { Property } from '../services/propertyService';
import type { FilterValues } from './PropertyFilters';
import { KenteLine } from './ui/KenteLine';
import CGVLocataireModal from './CGVLocataireModal';
import PaymentModal from './PaymentModal';
import SatisfactionModal from './SatisfactionModal';
import { HColors, HAlpha, HS } from '../styles/homeci-tokens';

const PER_PAGE = 9;

function formatPrice(p: number) {
  return new Intl.NumberFormat('fr-FR').format(p) + ' FCFA';
}

/* ── Palette statuts visites ─────────────────────────────────────────────── */
const VISIT_STATUS: Record<string, {
  bg: string; border: string; text: string; label: string; icon: React.ReactNode;
}> = {
  pending:          { bg: HAlpha.gold10,  border: HAlpha.gold35,  text: HColors.brownMid, label: 'Demande envoyée',        icon: <Clock className="w-3.5 h-3.5"/> },
  accepted:         { bg: HAlpha.green10,   border: HAlpha.green30,   text: HColors.green, label: 'Confirmée',              icon: <CheckCircle className="w-3.5 h-3.5"/> },
  rejected:         { bg: HAlpha.bord10,   border: HAlpha.bord30,    text: HColors.bordeaux, label: 'Refusée',                icon: <XCircle className="w-3.5 h-3.5"/> },
  completed:        { bg: HAlpha.navy08,   border: HAlpha.navy30,    text: HColors.navy, label: 'Effectuée',              icon: <CheckCircle className="w-3.5 h-3.5"/> },
  counter_proposed: { bg: HAlpha.terra10, border: HAlpha.terra35,   text: HColors.brownDeep, label: 'Nouvelle date proposée', icon: <Calendar className="w-3.5 h-3.5"/> },
  counter_waiting:  { bg: HAlpha.navy08,  border: HAlpha.navy25,   text: HColors.navy, label: 'En attente de réponse',  icon: <Clock className="w-3.5 h-3.5"/> },
};

/* ── Icônes notifications ─────────────────────────────────────────────────── */
const NOTIF_ICON: Record<string, React.ReactNode> = {
  visit_request:   <Calendar className="w-4 h-4" style={{ color:HColors.navy }}/>,
  visit_accepted:  <CheckCircle className="w-4 h-4" style={{ color:HColors.green }}/>,
  visit_rejected:  <XCircle className="w-4 h-4" style={{ color:HColors.bordeaux }}/>,
  visit_completed: <Star className="w-4 h-4" style={{ color:HColors.gold }}/>,
  system:          <Bell className="w-4 h-4" style={{ color:HAlpha.brown50 }}/>,
};


/* ═══════════════════════════════════════════════════════════════════════════ */
export default function TenantDashboard() {
  const { user, profile } = useAuth();
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites(user?.uid);

  const [activeTab, setActiveTab] = useState<'search' | 'favorites' | 'visits' | 'notifications'>('search');
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filtered, setFiltered] = useState<Property[]>([]);
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([]);
  const [visitProperties, setVisitProperties] = useState<Record<string, Property>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const [viewingPropertyId, setViewingPropertyId] = useState<string | null>(null);
  const [visitRequestPropertyId, setVisitRequestPropertyId] = useState<string | null>(null);

  const [visitModalProperty, setVisitModalProperty] = useState<Property | null>(null);
  const [visitForm, setVisitForm] = useState({ preferred_date: '', preferred_time: '' });
  const [submittingVisit, setSubmittingVisit] = useState(false);
  const [visitSuccess, setVisitSuccess] = useState(false);
  const [visitError, setVisitError] = useState('');
  const [counterForm, setCounterForm] = useState<{ visitId: string; date: string; time: string } | null>(null);
  const [counterLoading, setCounterLoading] = useState(false);
  const visitSuccessTimer = useRef<ReturnType<typeof setTimeout>>();
  const [showCGVLocataire, setShowCGVLocataire] = useState(false);
  const [showVisitPayment, setShowVisitPayment] = useState(false);
  const [surveyData, setSurveyData] = useState<{ trigger: 'visit_accepted'; propertyId?: string; propertyTitle?: string } | null>(null);
  const [pendingVisitProperty, setPendingVisitProperty] = useState<Property | null>(null);

  useEffect(() => {
    propertyService.getProperties({ status: 'published' }).then(data => {
      setAllProperties(data); setFiltered(data); setLoading(false);
    }).catch(() => { setLoading(false); });
    if (user) {
      visitService.getVisitRequestsByTenant(user.uid).then(visits => {
        setVisitRequests(visits);
        const ids = [...new Set(visits.map(v => v.property_id))];
        Promise.all(ids.map(id => propertyService.getProperty(id))).then(props => {
          const map: Record<string, Property> = {};
          props.forEach(p => { if (p) map[p.id] = p; });
          setVisitProperties(map);
        }).catch(console.error);
      }).catch(console.error);
      notificationService.getNotifications(user.uid).then(setNotifications).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (favoriteIds.length === 0) { setFavoriteProperties([]); return; }
    setFavoriteProperties(allProperties.filter(p => favoriteIds.includes(p.id)));
  }, [favoriteIds, allProperties]);

  useEffect(() => {
    if (visitRequestPropertyId) {
      const prop = allProperties.find(p => p.id === visitRequestPropertyId);
      if (prop) { handleRequestVisit(prop); setViewingPropertyId(null); setVisitRequestPropertyId(null); }
    }
  }, [visitRequestPropertyId, allProperties]);

  // Cleanup timer on unmount
  useEffect(() => () => { clearTimeout(visitSuccessTimer.current); }, []);

  /** Flux : CGV (1ère fois) → Paiement 500 FCFA → Formulaire visite */
  const handleRequestVisit = (property: Property) => {
    if (!profile?.cgv_accepted) {
      setPendingVisitProperty(property);
      setShowCGVLocataire(true);
    } else {
      setPendingVisitProperty(property);
      setShowVisitPayment(true);
    }
  };

  const handleFilterChange = (filters: FilterValues) => {
    let r = [...allProperties];
    if (filters.propertyType)    r = r.filter(p => p.property_type === filters.propertyType);
    if (filters.transactionType) r = r.filter(p => p.transaction_type === filters.transactionType || p.transaction_type === 'both');
    if (filters.district)        r = r.filter(p => p.district === filters.district);
    if (filters.region)          r = r.filter(p => p.region === filters.region);
    if (filters.departement)     r = r.filter(p => p.departement === filters.departement);
    if (filters.city)            r = r.filter(p => p.city === filters.city);
    if (filters.commune)         r = r.filter(p => p.commune === filters.commune);
    if (filters.quartier)        r = r.filter(p => p.quartier?.toLowerCase().includes(filters.quartier.toLowerCase()));
    if (filters.minPrice)        r = r.filter(p => p.price >= Number(filters.minPrice));
    if (filters.maxPrice)        r = r.filter(p => p.price <= Number(filters.maxPrice));
    if (filters.bedrooms)        r = r.filter(p => p.bedrooms >= Number(filters.bedrooms));
    if (filters.furnished)       r = r.filter(p => p.furnished);
    if (filters.parking)         r = r.filter(p => p.parking);
    if (filters.verifiedOnly)    r = r.filter(p => p.verified_notaire);
    setFiltered(r); setPage(1);
  };

  const handleSubmitVisit = async () => {
    if (!user || !visitModalProperty || !visitForm.preferred_date || !visitForm.preferred_time) return;
    setSubmittingVisit(true); setVisitError('');
    try {
      const existing = visitRequests.find(v => v.property_id === visitModalProperty.id && v.status !== 'rejected');
      if (existing) { setVisitError('Vous avez déjà une demande de visite pour ce bien.'); setSubmittingVisit(false); return; }
      await visitService.createVisitRequest({
        property_id: visitModalProperty.id, property_title: visitModalProperty.title,
        property_city: visitModalProperty.city, owner_id: visitModalProperty.owner_id,
        tenant_id: user.uid, tenant_name: profile?.full_name || 'Locataire',
        tenant_phone: '', tenant_email: '',
        preferred_date: visitForm.preferred_date, preferred_time: visitForm.preferred_time,
      });
      await notificationService.createNotification({
        user_id: visitModalProperty.owner_id, type: 'visit_request',
        title: '📅 Nouvelle demande de visite',
        message: `${profile?.full_name || 'Un locataire'} souhaite visiter "${visitModalProperty.title}" le ${visitForm.preferred_date} à ${visitForm.preferred_time}.`,
        property_id: visitModalProperty.id,
      });
      const updated = await visitService.getVisitRequestsByTenant(user.uid);
      setVisitRequests(updated);
      setVisitSuccess(true);
      visitSuccessTimer.current = setTimeout(() => {
        setVisitModalProperty(null); setVisitSuccess(false);
        setVisitForm({ preferred_date: '', preferred_time: '' });
      }, 2500);
    } catch (e) {
      setVisitError('Une erreur est survenue. Veuillez réessayer.');
    } finally { setSubmittingVisit(false); }
  };

  const handleAcceptCounter = async (visit: VisitRequest) => {
    try {
      await visitService.acceptCounterDate(visit.id);
      await notificationService.createNotification({
        user_id: visit.owner_id, type: 'visit_request',
        title: 'Contre-proposition acceptée ✅',
        message: `${profile?.full_name || 'Le locataire'} a accepté la date proposée pour "${visit.property_title}" : ${visit.counter_date ? new Date(visit.counter_date).toLocaleDateString('fr-FR') : ''} à ${visit.counter_time}.`,
        property_id: visit.property_id,
      });
      const updated = await visitService.getVisitRequestsByTenant(user!.uid);
      setVisitRequests(updated);
      setSurveyData({ trigger: 'visit_accepted', propertyId: visit.property_id, propertyTitle: visit.property_title });
    } catch (e) { console.error(e); }
  };

  const handleTenantCounter = async () => {
    if (!counterForm || !user) return;
    setCounterLoading(true);
    try {
      const visit = visitRequests.find(v => v.id === counterForm.visitId);
      if (!visit) return;
      await visitService.proposeCounterDate(counterForm.visitId, counterForm.date, counterForm.time, 'tenant');
      await notificationService.createNotification({
        user_id: visit.owner_id, type: 'visit_request',
        title: '📅 Nouvelle date proposée par le locataire',
        message: `${profile?.full_name || 'Le locataire'} propose le ${new Date(counterForm.date).toLocaleDateString('fr-FR')} à ${counterForm.time} pour "${visit.property_title}".`,
        property_id: visit.property_id,
      });
      const updated = await visitService.getVisitRequestsByTenant(user.uid);
      setVisitRequests(updated); setCounterForm(null);
    } catch (e) { console.error(e); }
    finally { setCounterLoading(false); }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.uid);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount    = notifications.filter(n => !n.read).length;
  const pendingVisits  = visitRequests.filter(v => v.status === 'pending').length;
  const acceptedVisits = visitRequests.filter(v => v.status === 'accepted').length;
  const totalPages     = Math.ceil(filtered.length / PER_PAGE);
  const paginated      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const firstName      = profile?.full_name?.split(' ')[0] || 'vous';

  /* ────────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background:HColors.creamBg }}>

      {/* ── Header personnalisé ── */}
      <div style={{ background:HColors.night, borderBottom:'1px solid rgba(212,160,23,0.2)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
            <div>
              <h1 className="font-bold mb-0.5"
                style={{ color:HColors.cream, fontFamily:'var(--font-cormorant)', fontSize:'1.8rem' }}>
                Bonjour, {firstName} 👋
              </h1>
              <p className="text-sm" style={{ color:HAlpha.cream50, fontFamily:'var(--font-nunito)' }}>
                Trouvez, sauvegardez et planifiez vos visites
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <StatBadge icon={<Heart className="w-3.5 h-3.5"/>}        label="Favoris"    value={favoriteIds.length}  accent="#C07C3E" onClick={() => setActiveTab('favorites')} />
              <StatBadge icon={<Clock className="w-3.5 h-3.5"/>}        label="En attente" value={pendingVisits}        accent="#D4A017" onClick={() => setActiveTab('visits')} />
              {acceptedVisits > 0 && <StatBadge icon={<CheckCircle className="w-3.5 h-3.5"/>} label="Acceptées" value={acceptedVisits} accent="#2D6A4F" onClick={() => setActiveTab('visits')} />}
              {unreadCount > 0    && <StatBadge icon={<Bell className="w-3.5 h-3.5"/>}         label="Notifs"    value={unreadCount}    accent="#8B1D1D" onClick={() => setActiveTab('notifications')} />}
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex space-x-1 homeci-tabs-scroll">
            {[
              { id:'search',        icon:Search,   label:'Rechercher',    count:undefined },
              { id:'favorites',     icon:Heart,    label:'Mes favoris',   count:favoriteIds.length || undefined },
              { id:'visits',        icon:Calendar, label:'Mes visites',   count:pendingVisits || undefined },
              { id:'notifications', icon:Bell,     label:'Notifications', count:unreadCount || undefined },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                aria-label={tab.label}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className="py-3 px-4 border-b-2 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2"
                style={activeTab === tab.id
                  ? { borderColor:HColors.gold, color:HColors.gold, fontFamily:'var(--font-nunito)' }
                  : { borderColor:'transparent', color:HAlpha.cream45, fontFamily:'var(--font-nunito)' }}>
                <tab.icon className="w-4 h-4"/>
                {tab.label}
                {tab.count !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={tab.id === 'notifications'
                      ? { background:HColors.bordeaux, color:HColors.cream }
                      : { background:HAlpha.gold25, color:HColors.gold }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">

        {/* ══════════════════════ RECHERCHE ══════════════════════ */}
        {activeTab === 'search' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm" style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
                {loading ? 'Chargement…' : (
                  <><span className="font-bold" style={{ color:HColors.darkBrown }}>{filtered.length}</span> bien(s) disponible(s)</>
                )}
              </p>
              <div className="flex gap-2">
                {(['list', 'map'] as const).map(m => (
                  <button key={m} onClick={() => setViewMode(m)}
                    aria-label={m === 'list' ? 'Vue liste' : 'Vue carte'}
                    aria-pressed={viewMode === m}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                    style={viewMode === m
                      ? { background:HColors.navyDark, color:HColors.cream, fontFamily:'var(--font-nunito)' }
                      : { background:'rgba(255,255,255,0.7)', color:HColors.brown, border:'1px solid rgba(212,160,23,0.2)', fontFamily:'var(--font-nunito)' }}>
                    {m === 'list' ? <List className="w-4 h-4"/> : <Map className="w-4 h-4"/>}
                    {m === 'list' ? 'Liste' : 'Carte'}
                  </button>
                ))}
              </div>
            </div>

            <PropertyFilters onFilterChange={handleFilterChange}/>

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
                  style={{ borderColor:HAlpha.gold20, borderTopColor:HColors.gold }}/>
              </div>
            ) : viewMode === 'map' ? (
              <MapDisplay mode="multi" properties={filtered}/>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl p-20 text-center"
                style={{ background:HColors.white, border:`1px solid ${HAlpha.gold15}` }}>
                <Search className="w-14 h-14 mx-auto mb-4" style={{ color:HAlpha.gold25 }}/>
                <p className="text-lg font-semibold mb-1"
                  style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)' }}>Aucun bien trouvé</p>
                <p className="text-sm" style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
                  Essayez d'élargir vos critères de recherche
                </p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginated.map(property => (
                    <PropertyCard key={property.id} property={property}
                      onFavorite={() => toggleFavorite(property.id)}
                      isFavorite={isFavorite(property.id)}
                      onContactClick={() => setViewingPropertyId(property.id)}
                    />
                  ))}
                </div>
                {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPage={setPage} />}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════ FAVORIS ══════════════════════ */}
        {activeTab === 'favorites' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold mb-0.5"
                  style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)', fontSize:'1.8rem' }}>Mes Favoris</h2>
                <p className="text-sm" style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
                  {favoriteProperties.length} bien(s) sauvegardé(s)
                </p>
              </div>
            </div>
            {favoriteProperties.length === 0 ? (
              <div className="rounded-2xl p-16 text-center"
                style={{ background:HColors.white, border:`1px solid ${HAlpha.gold15}` }}>
                <Heart className="w-14 h-14 mx-auto mb-4" style={{ color:HAlpha.terra20 }}/>
                <h3 className="text-lg font-semibold mb-1"
                  style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)' }}>Aucun favori</h3>
                <p className="text-sm mb-6" style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
                  Cliquez sur le ❤ d'un bien pour le sauvegarder
                </p>
                <button onClick={() => setActiveTab('search')}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background:'linear-gradient(135deg,#D4A017,#C07C3E)', color:HColors.night, fontFamily:'var(--font-nunito)' }}>
                  Découvrir les biens
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {favoriteProperties.map(property => (
                  <PropertyCard key={property.id} property={property}
                    onFavorite={() => toggleFavorite(property.id)} isFavorite={true}
                    onContactClick={() => setViewingPropertyId(property.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════ MES VISITES ══════════════════════ */}
        {activeTab === 'visits' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold mb-0.5"
                  style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)', fontSize:'1.8rem' }}>
                  Mes Demandes de Visite
                </h2>
                <p className="text-sm" style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
                  {visitRequests.length} demande(s)
                </p>
              </div>
              {visitRequests.length > 0 && (
                <div className="flex gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full font-semibold"
                    style={{ background:HAlpha.gold12, color:HColors.brownMid, border:'1px solid rgba(212,160,23,0.3)', fontFamily:'var(--font-nunito)' }}>
                    {pendingVisits} en attente
                  </span>
                  {acceptedVisits > 0 && (
                    <span className="px-2.5 py-1 rounded-full font-semibold"
                      style={{ background:HAlpha.green10, color:HColors.green, border:'1px solid rgba(45,106,79,0.3)', fontFamily:'var(--font-nunito)' }}>
                      {acceptedVisits} acceptée{acceptedVisits > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>

            {visitRequests.length === 0 ? (
              <div className="rounded-2xl p-16 text-center"
                style={{ background:HColors.white, border:`1px solid ${HAlpha.gold15}` }}>
                <Calendar className="w-14 h-14 mx-auto mb-4" style={{ color:HAlpha.gold25 }}/>
                <h3 className="text-lg font-semibold mb-1"
                  style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)' }}>Aucune demande</h3>
                <p className="text-sm mb-6" style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
                  Ouvrez la fiche d'un bien pour planifier une visite
                </p>
                <button onClick={() => setActiveTab('search')}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background:'linear-gradient(135deg,#D4A017,#C07C3E)', color:HColors.night, fontFamily:'var(--font-nunito)' }}>
                  Rechercher un bien
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {visitRequests
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map(visit => {
                    const vsKey = visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant'
                      ? 'counter_waiting' : visit.status;
                    const vs = VISIT_STATUS[vsKey] || VISIT_STATUS['pending'];
                    const prop = visitProperties[visit.property_id];
                    const img = prop?.images?.[0];
                    return (
                      <div key={visit.id} className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                        style={{ background:HColors.white, border:`1px solid ${vs.border}`,
                                 boxShadow:'0 2px 12px rgba(26,14,0,0.06)' }}>

                        {/* Bande Kente fine en haut selon statut */}
                        <div className="h-1" style={{ background: vs.bg }} />

                        <div className="flex gap-4 p-4">
                          {/* Image bien */}
                          {img ? (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0">
                              <img src={img} alt={visit.property_title} className="w-full h-full object-cover"/>
                            </div>
                          ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background:'rgba(212,160,23,0.07)', border:`1px solid ${HAlpha.gold15}` }}>
                              <MapPin className="w-7 h-7" style={{ color:HAlpha.gold40 }}/>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <h3 className="font-bold text-sm leading-tight truncate"
                                style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)', fontSize:'1rem' }}>
                                {visit.property_title}
                              </h3>
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0"
                                style={{ background:vs.bg, color:vs.text, border:`1px solid ${vs.border}`,
                                         fontFamily:'var(--font-nunito)' }}>
                                {vs.icon} {vs.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs mb-1.5 flex-wrap"
                              style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" style={{ color:HColors.terracotta }}/>{visit.property_city}
                              </span>
                              {prop?.price && (
                                <span className="font-bold" style={{ color:HColors.terracotta }}>
                                  {formatPrice(prop.price)}{prop.transaction_type !== 'vente' ? '/mois' : ''}
                                </span>
                              )}
                              {prop && prop.bedrooms > 0 && (
                                <span className="flex items-center gap-1">
                                  <Bed className="w-3 h-3"/>{prop.bedrooms} ch.
                                </span>
                              )}
                              {prop?.surface_area && (
                                <span className="flex items-center gap-1">
                                  <Maximize className="w-3 h-3"/>{prop.surface_area} m²
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-xs"
                              style={{ fontFamily:'var(--font-nunito)' }}>
                              <Calendar className="w-3.5 h-3.5" style={{ color:HColors.terracotta }}/>
                              <span className="font-medium" style={{ color:HColors.brownDark }}>
                                {visit.status === 'counter_proposed' && visit.counter_date
                                  ? <>{new Date(visit.counter_date).toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'long' })} à {visit.counter_time}</>
                                  : <>{new Date(visit.preferred_date).toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'long' })} à {visit.preferred_time}</>
                                }
                              </span>
                              <span className="ml-auto" style={{ color:HAlpha.brown50 }}>
                                Envoyé le {new Date(visit.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ── Contre-proposition DU PROPRIÉTAIRE ── */}
                        {visit.status === 'counter_proposed' && visit.counter_proposed_by === 'owner' && (
                          <div className="mx-4 mb-4 p-4 rounded-xl"
                            style={{ background:HAlpha.terra08, border:'1px solid rgba(192,124,62,0.3)' }}>
                            <p className="text-xs font-semibold mb-1 flex items-center gap-1.5"
                              style={{ color:HColors.brownDeep, fontFamily:'var(--font-nunito)' }}>
                              <Calendar className="w-3.5 h-3.5"/> Le propriétaire propose une nouvelle date
                            </p>
                            <p className="text-base font-bold mb-3"
                              style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)', fontSize:'1.1rem' }}>
                              {visit.counter_date
                                ? new Date(visit.counter_date).toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' })
                                : ''} à {visit.counter_time}
                            </p>

                            {counterForm?.visitId === visit.id ? (
                              <div className="space-y-2 pt-2" style={{ borderTop:'1px solid rgba(192,124,62,0.25)' }}>
                                <p className="text-xs font-semibold" style={{ color:HColors.brownDeep, fontFamily:'var(--font-nunito)' }}>
                                  Proposer une autre date :
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs mb-0.5" style={{ color:'rgba(122,85,0,0.6)', fontFamily:'var(--font-nunito)' }}>Date</label>
                                    <input type="date" value={counterForm.date}
                                      min={new Date().toISOString().split('T')[0]}
                                      onChange={e => setCounterForm(f => f ? { ...f, date:e.target.value } : f)}
                                      className="w-full px-2 py-1.5 rounded-xl text-xs outline-none"
                                      style={{ background:'rgba(255,255,255,0.8)', border:'1px solid rgba(192,124,62,0.3)',
                                               color:HColors.darkBrown, fontFamily:'var(--font-nunito)' }}/>
                                  </div>
                                  <div>
                                    <label className="block text-xs mb-0.5" style={{ color:'rgba(122,85,0,0.6)', fontFamily:'var(--font-nunito)' }}>Heure</label>
                                    <ScrollTimePicker value={counterForm.time} onChange={v => setCounterForm(f => f ? { ...f, time:v } : f)}/>
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button onClick={() => setCounterForm(null)}
                                    aria-label="Annuler la contre-proposition"
                                    className="flex-1 px-3 py-2 text-xs rounded-xl font-medium transition-all hover:opacity-80"
                                    style={{ border:'1px solid rgba(192,124,62,0.3)', color:HColors.brownDeep, background:'transparent', fontFamily:'var(--font-nunito)' }}>
                                    Annuler
                                  </button>
                                  <button onClick={handleTenantCounter}
                                    disabled={!counterForm.date || !counterForm.time || counterLoading}
                                    className="flex-1 px-3 py-2 text-xs rounded-xl font-semibold flex items-center justify-center gap-1 transition-all hover:opacity-90 disabled:opacity-50"
                                    style={{ background:HColors.navy, color:HColors.cream, fontFamily:'var(--font-nunito)' }}>
                                    {counterLoading
                                      ? <div className="w-3 h-3 animate-spin rounded-full border-b border-current"/>
                                      : <Calendar className="w-3 h-3"/>}
                                    Envoyer ma proposition
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => handleAcceptCounter(visit)}
                                  className="flex-1 px-3 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                                  style={{ background:'linear-gradient(135deg,#D4A017,#C07C3E)', color:HColors.night, fontFamily:'var(--font-nunito)' }}>
                                  <CheckCircle className="w-3.5 h-3.5"/> Confirmer cette date
                                </button>
                                <button onClick={() => setCounterForm({ visitId:visit.id, date:'', time:'' })}
                                  className="flex-1 px-3 py-2.5 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
                                  style={{ border:'1px solid rgba(192,124,62,0.4)', color:HColors.brownDeep, background:HAlpha.terra08, fontFamily:'var(--font-nunito)' }}>
                                  <Calendar className="w-3.5 h-3.5"/> Proposer une autre date
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── Locataire a proposé une date, attend réponse ── */}
                        {visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant' && visit.counter_date && (
                          <div className="mx-4 mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
                            style={{ background:HAlpha.navy08, border:'1px solid rgba(26,58,107,0.2)' }}>
                            <Clock className="w-4 h-4 shrink-0" style={{ color:HColors.navy }}/>
                            <div>
                              <p className="text-xs font-semibold" style={{ color:HColors.navy, fontFamily:'var(--font-nunito)' }}>
                                Votre proposition envoyée au propriétaire
                              </p>
                              <p className="text-sm font-bold mt-0.5"
                                style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)', fontSize:'1rem' }}>
                                {new Date(visit.counter_date).toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' })} à {visit.counter_time}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* ── Actions ── */}
                        <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
                          <button onClick={() => setViewingPropertyId(visit.property_id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:opacity-80"
                            style={{ background:HAlpha.gold08, border:'1px solid rgba(212,160,23,0.2)',
                                     color:HColors.brownMid, fontFamily:'var(--font-nunito)' }}>
                            <Eye className="w-3.5 h-3.5"/> Voir le bien
                          </button>

                          {visit.status === 'accepted' && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg"
                              style={{ background:'rgba(45,106,79,0.08)', border:'1px solid rgba(45,106,79,0.25)',
                                       color:HColors.green, fontFamily:'var(--font-nunito)' }}>
                              <Phone className="w-3.5 h-3.5"/> Contact révélé après paiement caution
                            </div>
                          )}

                          {visit.status === 'rejected' && (
                            <button onClick={() => {
                              const p = allProperties.find(pr => pr.id === visit.property_id);
                              if (p) handleRequestVisit(p);
                            }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:opacity-80"
                              style={{ background:HAlpha.navy08, border:'1px solid rgba(26,58,107,0.25)',
                                       color:HColors.navy, fontFamily:'var(--font-nunito)' }}>
                              <Calendar className="w-3.5 h-3.5"/> Replanifier
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Bannière paiements africaine */}
            <div className="mt-6 rounded-2xl overflow-hidden">
              <KenteLine />
              <div className="p-5 flex items-center gap-4 flex-wrap"
                style={{ background:'linear-gradient(135deg,#0D1F12,#1A0E00)' }}>
                <div className="flex-1">
                  <h3 className="font-bold mb-1" style={{ color:HColors.cream, fontFamily:'var(--font-cormorant)', fontSize:'1.1rem' }}>
                    💳 Paiements mobiles — Bientôt disponibles
                  </h3>
                  <p className="text-sm" style={{ color:HAlpha.cream60, fontFamily:'var(--font-nunito)' }}>
                    Payez cautions et loyers via Orange Money, MTN MoMo, Wave et Flooz.
                  </p>
                </div>
                <span className="px-4 py-1.5 rounded-full text-sm font-semibold shrink-0"
                  style={{ background:HAlpha.gold15, color:HColors.gold, border:'1px solid rgba(212,160,23,0.3)',
                           fontFamily:'var(--font-nunito)' }}>
                  🚀 Prochainement
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════ NOTIFICATIONS ══════════════════════ */}
        {activeTab === 'notifications' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold mb-0.5"
                  style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)', fontSize:'1.8rem' }}>
                  Notifications
                </h2>
                <p className="text-sm" style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
                  {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est lu'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button aria-label="Marquer toutes les notifications comme lues" onClick={handleMarkAllRead}
                  className="px-4 py-2 text-sm font-medium rounded-xl transition-all hover:opacity-80"
                  style={{ background:HAlpha.gold10, border:'1px solid rgba(212,160,23,0.25)',
                           color:HColors.brownMid, fontFamily:'var(--font-nunito)' }}>
                  Tout marquer lu
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="rounded-2xl p-16 text-center"
                style={{ background:HColors.white, border:`1px solid ${HAlpha.gold15}` }}>
                <Bell className="w-14 h-14 mx-auto mb-4" style={{ color:HAlpha.gold25 }}/>
                <p className="text-lg font-semibold mb-1"
                  style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)' }}>Aucune notification</p>
                <p className="text-sm" style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
                  Vous serez notifié des réponses à vos demandes de visite
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map(notif => (
                    <div key={notif.id}
                      onClick={() => !notif.read && notificationService.markAsRead(notif.id).then(() =>
                        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read:true } : n))
                      )}
                      role="button"
                      tabIndex={notif.read ? -1 : 0}
                      aria-label={notif.read ? notif.title : `Marquer comme lu : ${notif.title}`}
                      className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5"
                      style={{ background:HColors.white,
                               border:`1px solid ${notif.read ? HAlpha.gold10 : HAlpha.gold35}`,
                               opacity: notif.read ? 0.65 : 1,
                               boxShadow: notif.read ? 'none' : '0 2px 10px rgba(212,160,23,0.08)' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: notif.read ? HAlpha.gold05 : HAlpha.gold12,
                                 border:`1px solid ${notif.read ? HAlpha.gold10 : HAlpha.gold25}` }}>
                        {NOTIF_ICON[notif.type] || NOTIF_ICON['system']}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm leading-tight"
                            style={{ color:HColors.darkBrown, fontFamily:'var(--font-nunito)' }}>
                            {notif.title}
                          </p>
                          <span className="text-xs shrink-0 mt-0.5"
                            style={{ color:HAlpha.brown50, fontFamily:'var(--font-nunito)' }}>
                            {new Date(notif.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm mt-0.5 leading-relaxed"
                          style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
                          {notif.message}
                        </p>
                        {!notif.read && (
                          <span className="inline-block mt-1.5 w-2 h-2 rounded-full" style={{ background:HColors.gold }}/>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal Fiche bien ── */}
      {viewingPropertyId && (
        <PropertyViewModal
          propertyId={viewingPropertyId}
          onClose={() => setViewingPropertyId(null)}
          onRequestVisit={() => setVisitRequestPropertyId(viewingPropertyId)}
        />
      )}

      {/* ── Modal Demande de visite ── */}
      {visitModalProperty && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background:'rgba(0,0,0,0.78)', backdropFilter:'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background:'linear-gradient(160deg,#0D1F12,#1A0E00)',
                     border:'1px solid rgba(212,160,23,0.25)' }}>
            <KenteLine />
            <div className="p-6">
              {visitSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background:HAlpha.green20, border:'2px solid rgba(45,106,79,0.5)' }}>
                    <CheckCircle className="w-8 h-8" style={{ color:HColors.green }}/>
                  </div>
                  <h3 className="font-bold mb-2"
                    style={{ color:HColors.cream, fontFamily:'var(--font-cormorant)', fontSize:'1.4rem' }}>
                    Demande envoyée !
                  </h3>
                  <p className="text-sm" style={{ color:HAlpha.cream60, fontFamily:'var(--font-nunito)' }}>
                    Le propriétaire vous contactera rapidement pour confirmer la visite.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h3 className="font-bold mb-0.5"
                        style={{ color:HColors.cream, fontFamily:'var(--font-cormorant)', fontSize:'1.3rem' }}>
                        Demander une visite
                      </h3>
                      <p className="text-sm truncate max-w-xs"
                        style={{ color:HAlpha.cream50, fontFamily:'var(--font-nunito)' }}>
                        {visitModalProperty.title} — {visitModalProperty.city}
                      </p>
                    </div>
                    <button aria-label="Fermer" onClick={() => { setVisitModalProperty(null); setVisitError(''); }}
                      className="p-1.5 rounded-full transition-all hover:opacity-70"
                      style={{ background:HAlpha.gold10, border:'1px solid rgba(212,160,23,0.2)' }}>
                      <X className="w-4 h-4" style={{ color:HColors.gold }}/>
                    </button>
                  </div>

                  {visitError && (
                    <div className="flex items-center gap-2 mb-4 p-3 rounded-xl text-sm"
                      style={{ background:HAlpha.bord20, border:'1px solid rgba(139,29,29,0.35)',
                               color:HColors.errorText, fontFamily:'var(--font-nunito)' }}>
                      <AlertCircle className="w-4 h-4 shrink-0"/> {visitError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider"
                          style={{ color:'rgba(212,160,23,0.7)', fontFamily:'var(--font-nunito)' }}>
                          Date souhaitée *
                        </label>
                        <input type="date" value={visitForm.preferred_date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setVisitForm(f => ({ ...f, preferred_date:e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ background:'rgba(13,31,18,0.7)', border:'1px solid rgba(212,160,23,0.2)',
                                   color:HColors.cream, fontFamily:'var(--font-nunito)' }}/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider"
                          style={{ color:'rgba(212,160,23,0.7)', fontFamily:'var(--font-nunito)' }}>
                          Heure *
                        </label>
                        <ScrollTimePicker value={visitForm.preferred_time}
                          onChange={v => setVisitForm(f => ({ ...f, preferred_time:v }))}/>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button onClick={() => { setVisitModalProperty(null); setVisitError(''); }}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                      style={{ border:'1px solid rgba(212,160,23,0.25)', color:HAlpha.cream60,
                               fontFamily:'var(--font-nunito)' }}>
                      Annuler
                    </button>
                    <button onClick={handleSubmitVisit}
                      disabled={!visitForm.preferred_date || !visitForm.preferred_time || submittingVisit}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background:'linear-gradient(135deg,#D4A017,#C07C3E)', color:HColors.night,
                               fontFamily:'var(--font-nunito)' }}>
                      {submittingVisit
                        ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                        : <Calendar className="w-4 h-4"/>}
                      Envoyer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CGV Locataire (1ère demande) */}
      {showCGVLocataire && (
        <CGVLocataireModal
          onAccept={() => { setShowCGVLocataire(false); setShowVisitPayment(true); }}
          onClose={() => { setShowCGVLocataire(false); setPendingVisitProperty(null); }}
        />
      )}

      {/* Paiement visite 500 FCFA */}
      {showVisitPayment && pendingVisitProperty && (
        <PaymentModal
          config={{
            title: 'Frais de visite',
            description: `Visite de « ${pendingVisitProperty.title} »`,
            amount: 500,
          }}
          onSuccess={() => {
            setShowVisitPayment(false);
            setVisitModalProperty(pendingVisitProperty);
            setPendingVisitProperty(null);
          }}
          onClose={() => { setShowVisitPayment(false); setPendingVisitProperty(null); }}
        />
      )}

      {/* Enquête de satisfaction */}
      {surveyData && user && (
        <SatisfactionModal
          isOpen={true}
          onClose={() => setSurveyData(null)}
          userId={user.uid}
          userRole={profile?.role || 'locataire'}
          trigger={surveyData.trigger}
          propertyId={surveyData.propertyId}
          propertyTitle={surveyData.propertyTitle}
        />
      )}
    </div>
  );
}

/* ── Sous-composants ─────────────────────────────────────────────────────── */

function StatBadge({ icon, label, value, accent, onClick }: {
  icon: React.ReactNode; label: string; value: number; accent: string; onClick: () => void;
}) {
  if (value === 0) return null;
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
      style={{ background:`${accent}18`, border:`1px solid ${accent}35`, color:accent,
               fontFamily:'var(--font-nunito)' }}>
      {icon} {value} {label}
    </button>
  );
}

function Pagination({ page, totalPages, onPage }: { page:number; totalPages:number; onPage:(p:number)=>void }) {
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button disabled={page === 1} onClick={() => onPage(page - 1)}
        aria-label="Page précédente"
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 hover:opacity-80"
        style={{ background:HAlpha.gold10, border:'1px solid rgba(212,160,23,0.2)' }}>
        <ChevronLeft className="w-4 h-4" style={{ color:HColors.gold }}/>
      </button>
      {pages.map(p => (
        <button key={p} onClick={() => onPage(p)}
          aria-label={`Page ${p}`}
          aria-current={page === p ? 'page' : undefined}
          className="w-9 h-9 rounded-xl text-sm font-medium transition-all"
          style={page === p
            ? { background:HColors.navyDark, color:HColors.cream, fontFamily:'var(--font-nunito)' }
            : { background:HAlpha.gold08, color:HColors.brown, border:`1px solid ${HAlpha.gold15}`, fontFamily:'var(--font-nunito)' }}>
          {p}
        </button>
      ))}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)}
        aria-label="Page suivante"
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 hover:opacity-80"
        style={{ background:HAlpha.gold10, border:'1px solid rgba(212,160,23,0.2)' }}>
        <ChevronRight className="w-4 h-4" style={{ color:HColors.gold }}/>
      </button>
      <span className="text-xs ml-1" style={{ color:HAlpha.brown50, fontFamily:'var(--font-nunito)' }}>
        {page}/{totalPages}
      </span>
    </div>
  );
}
