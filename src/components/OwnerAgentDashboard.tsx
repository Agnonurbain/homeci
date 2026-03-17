import { useState, useEffect } from 'react';
import {
  Plus, Home, Calendar, BarChart3, FileText, Eye, Edit, X,
  CheckCircle, Clock, XCircle, Bell, TrendingUp, Users,
  Send, MapPin, Star, AlertTriangle, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { KenteLine } from './ui/KenteLine';
import { propertyService } from '../services/propertyService';
import { visitService } from '../services/visitService';
import { notificationService } from '../services/notificationService';
import type { Property } from '../types/property';
import type { VisitRequest } from '../services/visitService';
import type { Notification } from '../services/notificationService';
import AddPropertyForm from './AddPropertyForm';
import EditPropertyForm from './EditPropertyForm';
import PropertyViewModal from './PropertyViewModal';
import ScrollTimePicker from './ScrollTimePicker';
import CGVModal from './CGVModal';
import PaymentModal from './PaymentModal';
import type { PaymentConfig } from './PaymentModal';
import SatisfactionModal from './SatisfactionModal';
import { HColors, HAlpha, HS } from '../styles/homeci-tokens';

/* ── Constants ─────────────────────────────────────────────────────────── */
const TYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', villa: 'Villa',
  terrain: 'Terrain', hotel: 'Hôtel', appart_hotel: 'Appart-Hôtel',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  published: { bg: HAlpha.vertCI10, text: HColors.vertCI, border: HAlpha.vertCI25,  label: 'Publié' },
  pending:   { bg: HAlpha.gold12, text: HColors.brownMid, border: HAlpha.gold30, label: 'En attente' },
  draft:     { bg: 'rgba(90,64,0,0.08)',    text: HColors.brown, border: 'rgba(90,64,0,0.2)',    label: 'Brouillon' },
  rented:    { bg: HAlpha.navy18,  text: HColors.navy, border: HAlpha.navy30,  label: 'Loué' },
  sold:      { bg: HAlpha.bord10,  text: HColors.bordeaux, border: HAlpha.bord30,  label: 'Vendu' },
  rejected:  { bg: HAlpha.bord10, text: HColors.bordeaux, border: HAlpha.bord30,  label: 'Refusé' },
};

const VISIT_STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string; icon: React.ReactNode }> = {
  pending:          { bg: HAlpha.orange10, text: HColors.orangeCI, border: HAlpha.orange25, label: 'En attente',   icon: <Clock className="w-3.5 h-3.5"/> },
  accepted:         { bg: HAlpha.vertCI10, text: HColors.vertCI, border: HAlpha.vertCI25, label: 'Acceptée',      icon: <CheckCircle className="w-3.5 h-3.5"/> },
  rejected:         { bg: HAlpha.bord10,  text: HColors.bordeaux, border: HAlpha.bord30, label: 'Refusée',       icon: <XCircle className="w-3.5 h-3.5"/> },
  completed:        { bg: HAlpha.navy18,  text: HColors.navy, border: HAlpha.navy30, label: 'Effectuée',     icon: <CheckCircle className="w-3.5 h-3.5"/> },
  counter_proposed: { bg: HAlpha.orange10, text: HColors.orangeCI, border: HAlpha.orange25, label: 'Date proposée', icon: <Calendar className="w-3.5 h-3.5"/> },
};
const VISIT_STATUS_FALLBACK = { bg: 'rgba(90,64,0,0.08)', text: HColors.brown, border: 'rgba(90,64,0,0.2)', label: 'Inconnu', icon: <Clock className="w-3.5 h-3.5"/> };

const PIE_COLORS = [HColors.gold, HColors.green, HColors.orangeCI, HColors.bordeaux, HColors.navy];


/* ── Stat Card ────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, accent = HColors.gold }: { icon: any; label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl p-5 text-center"
      style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
               boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div className="text-2xl font-bold" style={{ color: accent, fontFamily: 'var(--font-cormorant)' }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>{label}</div>
    </div>
  );
}

/* ── StatusBadge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`,
               fontFamily: 'var(--font-nunito)' }}>
      {s.label}
    </span>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function OwnerAgentDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'properties' | 'requests' | 'stats' | 'notifications'>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCGV, setShowCGV] = useState(false);
  const [showPublicationPayment, setShowPublicationPayment] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [viewingPropertyId, setViewingPropertyId] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<VisitRequest | null>(null);
  const [counterDate, setCounterDate] = useState('');
  const [counterTime, setCounterTime] = useState('');
  const [visitActionLoading, setVisitActionLoading] = useState(false);
  const [visitFilter, setVisitFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [submittingVerif, setSubmittingVerif] = useState<string | null>(null);
  const [surveyData, setSurveyData] = useState<{ trigger: 'visit_accepted' | 'visit_completed'; propertyId?: string; propertyTitle?: string } | null>(null);
  const [disclaimerVisit, setDisclaimerVisit] = useState<{ propertyTitle: string; visitDate: string } | null>(null);
  const [statusModal, setStatusModal] = useState<{ property: Property; loading: boolean } | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [props, visits, notifs] = await Promise.all([
        propertyService.getPropertiesByOwner(user.uid),
        visitService.getVisitRequestsByOwner(user.uid),
        notificationService.getNotifications(user.uid),
      ]);
      setProperties(props);
      setVisitRequests(visits);
      setNotifications(notifs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  /** Vérifie les CGV avant d'ouvrir le formulaire d'ajout */
  const handleAddProperty = () => {
    if (profile?.cgv_accepted) {
      setShowPublicationPayment(true);
    } else {
      setShowCGV(true);
    }
  };

  const stats = {
    total: properties.length,
    published: properties.filter(p => p.status === 'published').length,
    pending: properties.filter(p => p.status === 'pending').length,
    rented_sold: properties.filter(p => p.status === 'rented' || p.status === 'sold').length,
    views: properties.reduce((s, p) => s + (p.views_count || 0), 0),
    verified: properties.filter(p => p.verified_notaire).length,
    pendingVisits: visitRequests.filter(v => v.status === 'pending').length,
    unreadNotifs: notifications.filter(n => !n.read).length,
  };

  const viewsData = [...properties]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 6)
    .map(p => ({ name: p.title.substring(0, 18) + '…', vues: p.views_count || 0 }));

  const typeData = Object.entries(
    properties.reduce((acc, p) => { acc[p.property_type] = (acc[p.property_type] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: TYPE_LABELS[name] || name, value }));

  const monthlyData = (() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months[d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })] = 0;
    }
    properties.forEach(p => {
      const key = new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      if (key in months) months[key]++;
    });
    return Object.entries(months).map(([mois, biens]) => ({ mois, biens }));
  })();

  const handleSubmitVerification = async (property: Property) => {
    setSubmittingVerif(property.id);
    try {
      await propertyService.updateProperty(property.id, { status: 'pending' });
      await notificationService.createNotification({
        user_id: 'notaires',
        type: 'visit_request',
        title: 'Nouveau bien à vérifier',
        message: `Le bien "${property.title}" à ${property.city} est soumis pour vérification.`,
        property_id: property.id,
      });
      await loadAll();
    } catch (e) { console.error(e); }
    finally { setSubmittingVerif(null); }
  };

  const handleVisitAction = async (action: 'accepted' | 'rejected' | 'counter') => {
    if (!selectedVisit || visitActionLoading) return;
    if (action === 'counter' && (!counterDate || !counterTime)) return;
    setVisitActionLoading(true);
    try {
      if (action === 'counter') {
        await visitService.proposeCounterDate(selectedVisit.id, counterDate, counterTime, 'owner');
        await notificationService.createNotification({
          user_id: selectedVisit.tenant_id,
          type: 'visit_request',
          title: '📅 Nouvelle date proposée',
          message: `Le propriétaire propose une visite de "${selectedVisit.property_title}" le ${new Date(counterDate).toLocaleDateString('fr-FR')} à ${counterTime}.`,
          property_id: selectedVisit.property_id,
        });
        setVisitRequests(prev => prev.map(v =>
          v.id === selectedVisit.id
            ? { ...v, status: 'counter_proposed', counter_date: counterDate, counter_time: counterTime, counter_proposed_by: 'owner' }
            : v
        ));
      } else if (action === 'accepted' && selectedVisit.status === 'counter_proposed' && selectedVisit.counter_proposed_by === 'tenant' && selectedVisit.counter_date) {
        // Accepter la contre-proposition du locataire → promouvoir counter_date en preferred_date
        await visitService.acceptCounterDate(selectedVisit.id);
        const confirmedDate = new Date(selectedVisit.counter_date).toLocaleDateString('fr-FR');
        const confirmedTime = selectedVisit.counter_time || selectedVisit.preferred_time;
        await notificationService.createNotification({
          user_id: selectedVisit.tenant_id,
          type: 'visit_accepted',
          title: 'Visite confirmée ✅',
          message: `Votre proposition pour "${selectedVisit.property_title}" le ${confirmedDate} à ${confirmedTime} est confirmée.`,
          property_id: selectedVisit.property_id,
        });
        setVisitRequests(prev => prev.map(v =>
          v.id === selectedVisit.id
            ? { ...v, status: 'accepted', preferred_date: selectedVisit.counter_date!, preferred_time: confirmedTime, counter_date: undefined, counter_time: undefined, counter_proposed_by: undefined }
            : v
        ));
      } else {
        // Accepter une visite normale (pending) ou rejeter
        await visitService.updateVisitStatus(selectedVisit.id, action);
        await notificationService.createNotification({
          user_id: selectedVisit.tenant_id,
          type: action === 'accepted' ? 'visit_accepted' : 'visit_rejected',
          title: action === 'accepted' ? 'Visite confirmée ✅' : 'Visite refusée',
          message: action === 'accepted'
            ? `Votre visite pour "${selectedVisit.property_title}" le ${new Date(selectedVisit.preferred_date).toLocaleDateString('fr-FR')} à ${selectedVisit.preferred_time} est confirmée.`
            : `Votre demande de visite pour "${selectedVisit.property_title}" a été refusée.`,
          property_id: selectedVisit.property_id,
        });
        setVisitRequests(prev => prev.map(v => v.id === selectedVisit.id ? { ...v, status: action } : v));
      }
      setSelectedVisit(null);
      setCounterDate(''); setCounterTime('');
      // Afficher le disclaimer de responsabilité après acceptation
      if (action === 'accepted') {
        const visitDate = (selectedVisit.status === 'counter_proposed' && selectedVisit.counter_proposed_by === 'tenant' && selectedVisit.counter_date)
          ? selectedVisit.counter_date
          : selectedVisit.preferred_date;
        setDisclaimerVisit({
          propertyTitle: selectedVisit.property_title,
          visitDate,
        });
      }
    } catch (e: any) {
      console.error('[HOMECI] Erreur visite:', e);
      alert(`Erreur : ${e?.message || 'Impossible de traiter la demande. Vérifiez votre connexion.'}`);
    } finally { setVisitActionLoading(false); }
  };

  const handleMarkCompleted = async (visit: VisitRequest) => {
    setVisitActionLoading(true);
    try {
      await visitService.updateVisitStatus(visit.id, 'completed');
      await notificationService.createNotification({
        user_id: visit.tenant_id,
        type: 'visit_completed',
        title: 'Visite effectuée ✅',
        message: `Votre visite de "${visit.property_title}" a été marquée comme effectuée. Merci de partager votre avis !`,
        property_id: visit.property_id,
      });
      setVisitRequests(prev => prev.map(v => v.id === visit.id ? { ...v, status: 'completed' } : v));
      // Déclencher l'enquête de satisfaction APRÈS la visite
      setSurveyData({
        trigger: 'visit_completed',
        propertyId: visit.property_id,
        propertyTitle: visit.property_title,
      });
    } catch (e) {
      console.error('[HOMECI] Erreur marquage visite:', e);
    } finally { setVisitActionLoading(false); }
  };

  const handleUpdatePropertyStatus = async (status: 'rented' | 'sold' | 'published') => {
    if (!statusModal) return;
    setStatusModal(prev => prev ? { ...prev, loading: true } : null);
    try {
      const { property } = statusModal;
      const updates: Record<string, any> = { status };
      if (status === 'rented' || status === 'sold') {
        updates.status_updated_at = new Date().toISOString();
      }
      await propertyService.updateProperty(property.id, updates);

      // Notifier les locataires qui avaient des visites en cours
      const visits = visitRequests.filter(v => v.property_id === property.id && (v.status === 'accepted' || v.status === 'completed'));
      if (status === 'rented' || status === 'sold') {
        const statusLabel = status === 'rented' ? 'loué' : 'vendu';
        for (const visit of visits) {
          await notificationService.createNotification({
            user_id: visit.tenant_id,
            type: 'system',
            title: `Bien ${statusLabel}`,
            message: `Le bien "${property.title}" a été ${statusLabel}. Merci pour votre intérêt.`,
            property_id: property.id,
          });
        }
      }

      // Mettre à jour l'état local
      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, status } : p));
      setStatusModal(null);
    } catch (e) {
      console.error('[HOMECI] Erreur mise à jour statut:', e);
    } finally {
      setStatusModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.uid);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filteredVisits = visitFilter === 'all'
    ? visitRequests
    : visitRequests.filter(v => v.status === visitFilter || (visitFilter === 'accepted' && v.status === 'completed'));

  /* ── RENDER ──────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: HColors.creamBg }}>

      {/* ── Tab navigation ── */}
      <div className="sticky top-14 z-10"
        style={{ background: 'rgba(10,22,14,0.97)', backdropFilter: 'blur(12px)',
                 borderBottom: `1px solid ${HAlpha.gold15}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 homeci-tabs-scroll">
            {[
              { id: 'properties',    icon: Home,     label: 'Mes Biens',          count: stats.total },
              { id: 'requests',      icon: Calendar, label: 'Demandes de visite', count: stats.pendingVisits },
              { id: 'stats',         icon: BarChart3, label: 'Statistiques' },
              { id: 'notifications', icon: Bell,     label: 'Notifications',      count: stats.unreadNotifs },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                aria-label={tab.label}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className="py-4 px-4 border-b-2 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2"
                style={activeTab === tab.id
                  ? { borderColor: HColors.orangeCI, color: HColors.orangeCI, fontFamily: 'var(--font-nunito)' }
                  : { borderColor: 'transparent', color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={tab.id === 'notifications'
                      ? { background: HColors.bordeaux, color: HColors.cream }
                      : { background: HAlpha.orange20, color: HColors.orangeCI }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ════════════════════════ ONGLET MES BIENS ════════════════════════ */}
        {activeTab === 'properties' && (
          <div>
            <div className="flex justify-between items-center mb-7">
              <div>
                <h1 className="font-bold mb-1"
                  style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem', color: HColors.darkBrown }}>
                  Mes Biens
                </h1>
                <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                  {stats.total} bien(s) enregistré(s)
                </p>
              </div>
              <button onClick={handleAddProperty}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-sm"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF',
                         fontFamily: 'var(--font-nunito)' }}>
                <Plus className="w-4 h-4" /> Ajouter un bien
              </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={CheckCircle} label="Publiés"       value={stats.published}   accent="#009E49" />
              <StatCard icon={Clock}       label="En attente"    value={stats.pending}     accent="#D4A017" />
              <StatCard icon={Home}        label="Loués/Vendus"  value={stats.rented_sold} accent="#1A3A6B" />
              <StatCard icon={Star}        label="Vérifiés ✓"   value={stats.verified}    accent="#FF6B00" />
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2"
                  style={{ borderColor: HColors.gold }} />
              </div>
            ) : properties.length === 0 ? (
              <div className="rounded-2xl p-14 text-center"
                style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
                <Home className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold30 }} />
                <h3 className="text-xl font-semibold mb-2"
                  style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucun bien enregistré</h3>
                <p className="text-sm mb-6" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                  Commencez par ajouter votre premier bien
                </p>
                <button onClick={handleAddProperty}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                  <Plus className="w-4 h-4" /> Ajouter un bien
                </button>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden"
                style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
                         boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
                <div className="homeci-table-scroll">
                  <table className="min-w-full">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${HAlpha.gold15}`, background: 'rgba(212,160,23,0.04)' }}>
                        {['Bien','Type','Prix','Statut','Notaire','Vues','Actions'].map(h => (
                          <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider"
                            style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map((property, idx) => (
                        <tr key={property.id}
                          className="transition-colors"
                          style={{ borderBottom: '1px solid rgba(212,160,23,0.08)',
                                   background: idx % 2 === 0 ? HColors.white : HAlpha.gold05 }}>
                          <td className="px-5 py-4">
                            <div className="text-sm font-semibold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1rem' }}>
                              {property.title}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-xs" style={{ color: HColors.terracotta }}>
                              <MapPin className="w-3 h-3"/>{property.city}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                            {TYPE_LABELS[property.property_type]}
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm font-bold" style={{ color: HColors.terracotta, fontFamily: 'var(--font-cormorant)' }}>
                              {property.price.toLocaleString()} FCFA
                            </div>
                            <div className="text-xs" style={{ color: HAlpha.brown60, fontFamily: 'var(--font-nunito)' }}>
                              {property.transaction_type === 'location' ? '/mois' : 'vente'}
                            </div>
                          </td>
                          <td className="px-5 py-4"><StatusBadge status={property.status} /></td>
                          <td className="px-5 py-4">
                            {property.verified_notaire ? (
                              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: HColors.green, fontFamily: 'var(--font-nunito)' }}>
                                <CheckCircle className="w-4 h-4"/> Vérifié
                              </span>
                            ) : property.status === 'pending' ? (
                              <span className="flex items-center gap-1 text-xs" style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                                <Clock className="w-4 h-4"/> En cours
                              </span>
                            ) : (
                              <button onClick={() => handleSubmitVerification(property)}
                                disabled={submittingVerif === property.id}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ background: HAlpha.navy08, color: HColors.navy,
                                         border: '1px solid rgba(26,58,107,0.2)', fontFamily: 'var(--font-nunito)' }}>
                                {submittingVerif === property.id
                                  ? <RefreshCw className="w-3 h-3 animate-spin"/>
                                  : <Send className="w-3 h-3"/>}
                                Soumettre
                              </button>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1 text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                              <Eye className="w-4 h-4"/>{property.views_count || 0}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setViewingPropertyId(property.id)}
                                aria-label={`Voir ${property.title}`}
                                className="p-1.5 rounded-lg transition-all hover:opacity-80"
                                style={{ color: HColors.brown, background: 'rgba(212,160,23,0.07)' }} title="Voir">
                                <Eye className="w-4 h-4"/>
                              </button>
                              <button onClick={() => setEditingPropertyId(property.id)}
                                aria-label={`Modifier ${property.title}`}
                                className="p-1.5 rounded-lg transition-all hover:opacity-80"
                                style={{ color: HColors.green, background: HAlpha.green10 }} title="Modifier">
                                <Edit className="w-4 h-4"/>
                              </button>
                              {(property.status === 'published' && visitRequests.some(v => v.property_id === property.id && v.status === 'completed')) && (
                                <button onClick={() => setStatusModal({ property, loading: false })}
                                  aria-label={`Statut ${property.title}`}
                                  className="px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all hover:opacity-80 animate-pulse"
                                  style={{ background: HAlpha.orange10, color: HColors.orangeCI, border: `1px solid ${HAlpha.orange25}`,
                                           fontFamily: 'var(--font-nunito)' }} title="Mettre à jour le statut">
                                  <AlertTriangle className="w-3.5 h-3.5"/> Statut
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ ONGLET DEMANDES DE VISITE ══════════════════ */}
        {activeTab === 'requests' && (
          <div>
            <div className="mb-7">
              <h1 className="font-bold mb-1"
                style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem', color: HColors.darkBrown }}>
                Demandes de Visite
              </h1>
              <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                {visitRequests.length} demande(s) reçue(s)
              </p>
            </div>

            {/* Filtres */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {(['all', 'pending', 'accepted', 'rejected'] as const).map(f => (
                <button key={f} onClick={() => setVisitFilter(f)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={visitFilter === f
                    ? { background: HColors.navyDark, color: HColors.cream, fontFamily: 'var(--font-nunito)' }
                    : { background: HColors.white, color: HColors.brown, border: '1px solid rgba(212,160,23,0.2)', fontFamily: 'var(--font-nunito)' }}>
                  {f === 'all'      ? `Toutes (${visitRequests.length})`
                  : f === 'pending'  ? `En attente (${visitRequests.filter(v => v.status === 'pending').length})`
                  : f === 'accepted' ? `Acceptées (${visitRequests.filter(v => v.status === 'accepted').length})`
                  :                   `Refusées (${visitRequests.filter(v => v.status === 'rejected').length})`}
                </button>
              ))}
            </div>

            {filteredVisits.length === 0 ? (
              <div className="rounded-2xl p-14 text-center"
                style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
                <Calendar className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold25 }} />
                <p className="text-lg font-semibold mb-1"
                  style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucune demande</p>
                <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                  Les demandes de visite apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVisits.map(visit => {
                  const vs = VISIT_STATUS_STYLES[visit.status] ?? VISIT_STATUS_FALLBACK;
                  return (
                    <div key={visit.id} className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                      style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
                               boxShadow: '0 2px 10px rgba(26,14,0,0.05)' }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: vs.bg, color: vs.text, border: `1px solid ${vs.border}`,
                                       fontFamily: 'var(--font-nunito)' }}>
                              {vs.icon} {vs.label}
                            </span>
                            <h3 className="font-bold text-sm" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1rem' }}>
                              {visit.property_title}
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm"
                            style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" style={{ color: HColors.terracotta }}/>{visit.tenant_name}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" style={{ color: HColors.terracotta }}/>
                              {visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant' && visit.counter_date
                                ? <>{new Date(visit.counter_date).toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'long' })} à {visit.counter_time}</>
                                : <>{new Date(visit.preferred_date).toLocaleDateString('fr-FR')} à {visit.preferred_time}</>
                              }
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" style={{ color: HColors.terracotta }}/>{visit.property_city}
                            </div>
                          </div>

                          {/* Counter proposals */}
                          {visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant' && visit.counter_date && (
                            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                              style={{ background: HAlpha.terra10, border: '1px solid rgba(192,124,62,0.25)',
                                       color: HColors.brownDeep, fontFamily: 'var(--font-nunito)' }}>
                              <Calendar className="w-3.5 h-3.5 shrink-0"/>
                              Le locataire propose : <strong className="ml-1">
                                {new Date(visit.counter_date).toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'long' })} à {visit.counter_time}
                              </strong>
                              <span className="ml-2 opacity-60" style={{ textDecoration: 'line-through' }}>
                                (initial : {new Date(visit.preferred_date).toLocaleDateString('fr-FR')} à {visit.preferred_time})
                              </span>
                            </div>
                          )}
                          {visit.status === 'counter_proposed' && visit.counter_proposed_by === 'owner' && visit.counter_date && (
                            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                              style={{ background: HAlpha.navy08, border: '1px solid rgba(26,58,107,0.2)',
                                       color: HColors.navy, fontFamily: 'var(--font-nunito)' }}>
                              <Calendar className="w-3.5 h-3.5 shrink-0"/>
                              Votre proposition : <strong className="ml-1">
                                {new Date(visit.counter_date).toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'long' })} à {visit.counter_time}
                              </strong> — en attente du locataire
                            </div>
                          )}
                        </div>

                        {(visit.status === 'pending' || (visit.status === 'counter_proposed' && visit.counter_proposed_by === 'tenant')) && (
                          <button onClick={() => { setSelectedVisit(visit); setCounterDate(''); setCounterTime(''); }}
                            className="px-4 py-2 rounded-xl text-sm font-semibold shrink-0 transition-all hover:opacity-90"
                            style={visit.status === 'counter_proposed'
                              ? { background: HColors.navyDark, color: HColors.cream, fontFamily: 'var(--font-nunito)' }
                              : { background: HAlpha.gold12, color: HColors.brownMid,
                                  border: '1px solid rgba(212,160,23,0.3)', fontFamily: 'var(--font-nunito)' }}>
                            {visit.status === 'counter_proposed' ? 'Répondre' : 'Répondre'}
                          </button>
                        )}
                        {visit.status === 'accepted' && (
                          <button onClick={() => handleMarkCompleted(visit)}
                            disabled={visitActionLoading}
                            className="px-4 py-2 rounded-xl text-sm font-semibold shrink-0 transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                            style={{ background: HColors.vertCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                            <CheckCircle className="w-3.5 h-3.5" /> Visite effectuée
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════ ONGLET STATISTIQUES ════════════════════ */}
        {activeTab === 'stats' && (
          <div>
            <div className="mb-7">
              <h1 className="font-bold mb-1"
                style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem', color: HColors.darkBrown }}>
                Statistiques
              </h1>
              <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                Performance de votre portefeuille immobilier
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Home}        label="Total biens"       value={stats.total}              accent="#D4A017" />
              <StatCard icon={Eye}         label="Vues totales"      value={stats.views}              accent="#FF6B00" />
              <StatCard icon={Calendar}    label="Visites demandées" value={visitRequests.length}     accent="#1A3A6B" />
              <StatCard icon={CheckCircle} label="Biens vérifiés"    value={stats.verified}           accent="#009E49" />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Vues par bien */}
              <div className="rounded-2xl p-6"
                style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
                         boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
                <h3 className="font-bold mb-5 flex items-center gap-2"
                  style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
                  <TrendingUp className="w-5 h-5" style={{ color: HColors.gold }}/> Vues par bien (top 6)
                </h3>
                {viewsData.length === 0 ? (
                  <div className="text-center py-10 text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                    Ajoutez des biens pour voir les statistiques
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={viewsData} margin={{ top:5, right:10, left:0, bottom:40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.1)"/>
                      <XAxis dataKey="name" tick={{ fontSize:11, fill:HColors.brown }} angle={-30} textAnchor="end"/>
                      <YAxis tick={{ fontSize:11, fill:HColors.brown }}/>
                      <Tooltip contentStyle={{ borderRadius:12, border:'1px solid rgba(212,160,23,0.2)', fontFamily:'var(--font-nunito)' }}/>
                      <Bar dataKey="vues" fill="#D4A017" radius={[6,6,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Camembert par type */}
              <div className="rounded-2xl p-6"
                style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
                         boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
                <h3 className="font-bold mb-5 flex items-center gap-2"
                  style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
                  <BarChart3 className="w-5 h-5" style={{ color: HColors.terracotta }}/> Répartition par type
                </h3>
                {typeData.length === 0 ? (
                  <div className="text-center py-10 text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                    Aucun bien à afficher
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius:12, border:'1px solid rgba(212,160,23,0.2)', fontFamily:'var(--font-nunito)' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Ligne mensuelle */}
            <div className="rounded-2xl p-6"
              style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
                       boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
              <h3 className="font-bold mb-5 flex items-center gap-2"
                style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
                <TrendingUp className="w-5 h-5" style={{ color: HColors.green }}/> Biens ajoutés (6 derniers mois)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData} margin={{ top:5, right:20, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,160,23,0.1)"/>
                  <XAxis dataKey="mois" tick={{ fontSize:12, fill:HColors.brown }}/>
                  <YAxis tick={{ fontSize:12, fill:HColors.brown }} allowDecimals={false}/>
                  <Tooltip contentStyle={{ borderRadius:12, border:'1px solid rgba(212,160,23,0.2)', fontFamily:'var(--font-nunito)' }}/>
                  <Line type="monotone" dataKey="biens" stroke="#2D6A4F" strokeWidth={2.5} dot={{ fill:HColors.green, r:5 }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ════════════════════════ ONGLET NOTIFICATIONS ════════════════════ */}
        {activeTab === 'notifications' && (
          <div>
            <div className="flex items-center justify-between mb-7">
              <div>
                <h1 className="font-bold mb-1"
                  style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem', color: HColors.darkBrown }}>
                  Notifications
                </h1>
                <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                  {stats.unreadNotifs} non lue(s)
                </p>
              </div>
              {stats.unreadNotifs > 0 && (
                <button onClick={handleMarkAllRead}
                  aria-label="Marquer toutes les notifications comme lues"
                  className="px-4 py-2 text-sm font-medium rounded-xl transition-all hover:opacity-80"
                  style={{ background: HAlpha.gold10, color: HColors.brownMid,
                           border: '1px solid rgba(212,160,23,0.25)', fontFamily: 'var(--font-nunito)' }}>
                  Tout marquer lu
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="rounded-2xl p-14 text-center"
                style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
                <Bell className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold25 }} />
                <p className="text-lg font-semibold mb-1"
                  style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucune notification</p>
                <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                  Vous serez notifié des nouvelles demandes et vérifications
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(notif => (
                  <div key={notif.id}
                    onClick={() => !notif.read && notificationService.markAsRead(notif.id).then(() =>
                      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
                    )}
                    className="rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5"
                    style={{ background: HColors.white,
                             border: `1px solid ${notif.read ? HAlpha.gold10 : HAlpha.gold35}`,
                             opacity: notif.read ? 0.65 : 1,
                             boxShadow: notif.read ? 'none' : '0 2px 10px rgba(212,160,23,0.08)' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-2 shrink-0"
                        style={{ background: notif.read ? 'rgba(139,106,48,0.3)' : HColors.gold }}/>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm"
                            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>{notif.title}</p>
                          <span className="text-xs shrink-0"
                            style={{ color: HAlpha.brown60, fontFamily: 'var(--font-nunito)' }}>
                            {new Date(notif.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          config={{
            title: 'Frais de publication',
            description: 'Publication de votre annonce sur HOMECI',
            amount: 1000,
          }}
          onSuccess={() => { setShowPublicationPayment(false); setShowAddForm(true); }}
          onClose={() => setShowPublicationPayment(false)}
        />
      )}
      {showAddForm && <AddPropertyForm onClose={() => setShowAddForm(false)} onSuccess={loadAll}/>}
      {editingPropertyId && <EditPropertyForm propertyId={editingPropertyId} onClose={() => setEditingPropertyId(null)} onSuccess={loadAll}/>}
      {viewingPropertyId && <PropertyViewModal propertyId={viewingPropertyId} onClose={() => setViewingPropertyId(null)}/>}

      {/* Modal réponse visite */}
      {selectedVisit && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(160deg,#0D1F12,#1A0E00)',
                     border: '1px solid rgba(212,160,23,0.25)' }}>
            <KenteLine />
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-bold mb-0.5"
                    style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)', fontSize: '1.3rem' }}>
                    Répondre à la demande
                  </h3>
                  <p className="text-sm" style={{ color: 'rgba(245,230,200,0.55)', fontFamily: 'var(--font-nunito)' }}>
                    {selectedVisit.property_title}
                  </p>
                </div>
                <button onClick={() => { setSelectedVisit(null); setCounterDate(''); setCounterTime(''); }}
                  aria-label="Fermer le modal de visite"
                  className="p-1.5 rounded-full transition-all hover:opacity-70"
                  style={{ background: HAlpha.gold10, border: '1px solid rgba(212,160,23,0.2)' }}>
                  <X className="w-4 h-4" style={{ color: HColors.gold }}/>
                </button>
              </div>

              {/* Locataire info */}
              <div className="rounded-xl p-4 mb-4 text-sm"
                style={{ background: 'rgba(212,160,23,0.07)', border: `1px solid ${HAlpha.gold15}` }}>
                <div className="flex items-center gap-2" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                  <Users className="w-4 h-4" style={{ color: HColors.gold }}/>
                  <span className="font-medium">{selectedVisit.tenant_name}</span>
                </div>
              </div>

              {/* Date demandée (ou contre-proposition locataire) */}
              {selectedVisit.status === 'counter_proposed' && selectedVisit.counter_proposed_by === 'tenant' && selectedVisit.counter_date ? (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-xl mb-2 text-sm"
                    style={{ background: HAlpha.terra10, border: '1px solid rgba(192,124,62,0.25)' }}>
                    <Calendar className="w-4 h-4 shrink-0" style={{ color: HColors.terracotta }}/>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                        style={{ color: HColors.terracotta, fontFamily: 'var(--font-nunito)' }}>Contre-proposition du locataire</p>
                      <p className="font-semibold" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                        {new Date(selectedVisit.counter_date).toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })} à {selectedVisit.counter_time}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs mb-4 pl-1" style={{ color: 'rgba(245,230,200,0.4)', fontFamily: 'var(--font-nunito)', textDecoration: 'line-through' }}>
                    Date initiale : {new Date(selectedVisit.preferred_date).toLocaleDateString('fr-FR')} à {selectedVisit.preferred_time}
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl mb-4 text-sm"
                  style={{ background: HAlpha.terra10, border: '1px solid rgba(192,124,62,0.25)' }}>
                  <Calendar className="w-4 h-4 shrink-0" style={{ color: HColors.terracotta }}/>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                      style={{ color: HColors.terracotta, fontFamily: 'var(--font-nunito)' }}>Date demandée</p>
                    <p className="font-semibold" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                      {new Date(selectedVisit.preferred_date).toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })} à {selectedVisit.preferred_time}
                    </p>
                  </div>
                </div>
              )}

              {/* Contre-date */}
              <div className="mb-5">
                <p className="text-sm font-semibold mb-2"
                  style={{ color: HAlpha.cream70, fontFamily: 'var(--font-nunito)' }}>
                  Proposer une autre date (optionnel)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'rgba(212,160,23,0.6)', fontFamily: 'var(--font-nunito)' }}>
                      Nouvelle date
                    </label>
                    <input type="date" value={counterDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setCounterDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.2)',
                               color: HColors.cream, fontFamily: 'var(--font-nunito)' }}/>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'rgba(212,160,23,0.6)', fontFamily: 'var(--font-nunito)' }}>Heure</label>
                    <ScrollTimePicker value={counterTime} onChange={setCounterTime}/>
                  </div>
                </div>
                {counterDate && counterTime && (
                  <p className="mt-2 text-xs flex items-center gap-1"
                    style={{ color: HColors.gold, fontFamily: 'var(--font-nunito)' }}>
                    <Calendar className="w-3 h-3"/>
                    Proposition : {new Date(counterDate).toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'long' })} à {counterTime}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                {counterDate && counterTime ? (
                  <button onClick={() => handleVisitAction('counter')} disabled={visitActionLoading}
                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: HColors.navy, color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                    {visitActionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"/> : <Calendar className="w-4 h-4"/>}
                    Proposer le {new Date(counterDate).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' })} à {counterTime}
                  </button>
                ) : (
                  <button onClick={() => handleVisitAction('accepted')} disabled={visitActionLoading}
                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                    {visitActionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"/> : <CheckCircle className="w-4 h-4"/>}
                    Confirmer le {selectedVisit.status === 'counter_proposed' && selectedVisit.counter_proposed_by === 'tenant' && selectedVisit.counter_date
                      ? <>{new Date(selectedVisit.counter_date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' })} à {selectedVisit.counter_time}</>
                      : <>{new Date(selectedVisit.preferred_date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' })} à {selectedVisit.preferred_time}</>
                    }
                  </button>
                )}
                <button onClick={() => handleVisitAction('rejected')} disabled={visitActionLoading}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: HAlpha.bord20, color: HColors.errorText,
                           border: '1px solid rgba(139,29,29,0.35)', fontFamily: 'var(--font-nunito)' }}>
                  <XCircle className="w-4 h-4"/> Refuser la demande
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal mise à jour du statut du bien */}
      {statusModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: 'rgba(10,61,31,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: HColors.night, border: `1px solid ${HAlpha.gold20}` }}>
            <KenteLine height={3} />
            <div className="px-6 pt-5 pb-6">
              <h2 className="text-center text-lg font-bold mb-2"
                style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>
                Quel est le résultat de la visite ?
              </h2>
              <p className="text-center text-sm mb-5" style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
                Bien : <strong style={{ color: HColors.orangeCI }}>« {statusModal.property.title} »</strong>
              </p>

              <div className="space-y-3 mb-5">
                {/* Loué */}
                <button onClick={() => handleUpdatePropertyStatus('rented')}
                  disabled={statusModal.loading}
                  className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: HAlpha.vertCI10, border: `1px solid ${HAlpha.vertCI25}` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: HColors.vertCI }}>
                    <Home className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold" style={{ color: HColors.vertCI, fontFamily: 'var(--font-nunito)' }}>
                      Le bien a été loué
                    </p>
                    <p className="text-xs" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                      Le bien sera retiré des annonces
                    </p>
                  </div>
                </button>

                {/* Vendu */}
                <button onClick={() => handleUpdatePropertyStatus('sold')}
                  disabled={statusModal.loading}
                  className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: HAlpha.navy08, border: `1px solid ${HAlpha.navy18}` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: HColors.navy }}>
                    <CheckCircle className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold" style={{ color: HColors.navy, fontFamily: 'var(--font-nunito)' }}>
                      Le bien a été vendu
                    </p>
                    <p className="text-xs" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                      Le bien sera retiré des annonces
                    </p>
                  </div>
                </button>

                {/* Transaction non aboutie */}
                <button onClick={() => handleUpdatePropertyStatus('published')}
                  disabled={statusModal.loading}
                  className="w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: HAlpha.orange08, border: `1px solid ${HAlpha.orange15}` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: HColors.orangeCI }}>
                    <RefreshCw className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold" style={{ color: HColors.orangeCI, fontFamily: 'var(--font-nunito)' }}>
                      Transaction non aboutie
                    </p>
                    <p className="text-xs" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                      Le bien redevient disponible pour d'autres visites
                    </p>
                  </div>
                </button>
              </div>

              <div className="p-3 rounded-xl mb-4"
                style={{ background: 'rgba(139,29,29,0.08)', border: '1px solid rgba(139,29,29,0.2)' }}>
                <p className="text-xs leading-relaxed" style={{ color: HColors.errorText, fontFamily: 'var(--font-nunito)' }}>
                  <strong>⚠️ Rappel :</strong> Conformément aux CGU (Art. 4a), toute déclaration mensongère
                  engage votre responsabilité civile. Passé le délai de 3 jours, le bien sera automatiquement
                  remis en disponible.
                </p>
              </div>

              <button onClick={() => setStatusModal(null)}
                className="w-full py-2 text-xs text-center transition-all hover:opacity-80"
                style={{ color: HAlpha.cream40, fontFamily: 'var(--font-nunito)' }}>
                Je mettrai à jour plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer responsabilité propriétaire — après acceptation de visite */}
      {disclaimerVisit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: 'rgba(10,61,31,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: HColors.night, border: `1px solid ${HAlpha.orange20}` }}>
            <KenteLine height={3} />
            <div className="px-6 pt-5 pb-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ background: HAlpha.orange10, border: `2px solid ${HAlpha.orange25}` }}>
                <AlertTriangle className="w-7 h-7" style={{ color: HColors.orangeCI }} />
              </div>
              <h2 className="text-center text-lg font-bold mb-3"
                style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>
                Visite confirmée — Vos obligations
              </h2>

              <div className="space-y-3 mb-5">
                <div className="p-3 rounded-xl" style={{ background: HAlpha.orange08, border: `1px solid ${HAlpha.orange15}` }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: HColors.orangeCI, fontFamily: 'var(--font-nunito)' }}>
                    Bien : « {disclaimerVisit.propertyTitle} »
                  </p>
                  <p className="text-xs" style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
                    Visite prévue le : <strong style={{ color: HColors.cream }}>
                      {new Date(disclaimerVisit.visitDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </strong>
                  </p>
                </div>

                <p className="text-sm leading-relaxed" style={{ color: HAlpha.cream70, fontFamily: 'var(--font-nunito)' }}>
                  Ce bien est désormais <strong style={{ color: HColors.orangeCI }}>en cours de transaction</strong>.
                  Aucune autre demande de visite ne sera acceptée pendant cette période.
                </p>

                <p className="text-sm leading-relaxed" style={{ color: HAlpha.cream70, fontFamily: 'var(--font-nunito)' }}>
                  Vous disposez d'un <strong style={{ color: HColors.cream }}>délai de 3 jours après la date de visite</strong> pour
                  revenir sur la plateforme et mettre à jour le statut de votre bien :
                </p>

                <div className="flex flex-col gap-2 pl-2">
                  <p className="text-xs flex items-center gap-2" style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: HColors.vertCI }} />
                    <span><strong style={{ color: HColors.vertCI }}>Loué / Vendu</strong> — le bien sera retiré des annonces</span>
                  </p>
                  <p className="text-xs flex items-center gap-2" style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" style={{ color: HColors.gold }} />
                    <span><strong style={{ color: HColors.gold }}>Transaction non aboutie</strong> — le bien redevient disponible</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl" style={{ background: 'rgba(139,29,29,0.08)', border: '1px solid rgba(139,29,29,0.2)' }}>
                  <p className="text-xs leading-relaxed" style={{ color: HColors.errorText, fontFamily: 'var(--font-nunito)' }}>
                    <strong>⚠️ Avertissement :</strong> Conformément aux CGU que vous avez acceptées (Art. 4a),
                    toute déclaration mensongère sur l'état de votre bien engage votre responsabilité civile
                    au sens des articles 1382 et suivants du Code civil ivoirien.
                    Passé le délai de 3 jours sans mise à jour de votre part, le bien sera automatiquement remis en disponible sur la plateforme.
                  </p>
                </div>
              </div>

              <button onClick={() => setDisclaimerVisit(null)}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: HColors.orangeCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                J'ai compris mes obligations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enquête de satisfaction */}
      {surveyData && user && (
        <SatisfactionModal
          isOpen={true}
          onClose={() => {
            const { trigger, propertyId } = surveyData;
            setSurveyData(null);
            // Après l'enquête d'une visite complétée → proposer la mise à jour du statut
            if (trigger === 'visit_completed' && propertyId) {
              const prop = properties.find(p => p.id === propertyId);
              if (prop && prop.status === 'published') {
                setStatusModal({ property: prop, loading: false });
              }
            }
          }}
          userId={user.uid}
          userRole={profile?.role || 'proprietaire'}
          trigger={surveyData.trigger}
          propertyId={surveyData.propertyId}
          propertyTitle={surveyData.propertyTitle}
        />
      )}
    </div>
  );
}
