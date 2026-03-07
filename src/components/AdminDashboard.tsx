import { useState, useEffect, useMemo } from 'react';
import {
  Users, Home, Shield, FileCheck, AlertCircle, TrendingUp,
  CheckCircle, XCircle, Activity, UserCog, RotateCcw,
  MapPin, Calendar, Building2, Eye, Award, Copy, Plus, Loader as LoaderIcon,
} from 'lucide-react';
import { collection, getDocs, orderBy, query, limit, Timestamp, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { propertyService } from '../services/propertyService';
import type { Property } from '../types/property';
import type { Profile } from '../contexts/AuthContext';
import AdminLoginHistory from './AdminLoginHistory';
import AdminManagement from './AdminManagement';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface Stats {
  total_users: number;
  total_properties: number;
  pending_properties: number;
  verified_properties: number;
}

const ROLE_CFG: Record<string, { label: string; bg: string; bd: string; text: string }> = {
  locataire:    { label: 'Locataire',     bg: HAlpha.navy08,  bd: HAlpha.navy20,  text: HColors.navy     },
  proprietaire: { label: 'Propriétaire',  bg: HAlpha.green10, bd: HAlpha.green25, text: HColors.green    },
  agent:        { label: 'Agent',         bg: HAlpha.gold10,  bd: HAlpha.gold25,  text: HColors.brownMid },
  notaire:      { label: 'Notaire',       bg: HAlpha.terra10, bd: HAlpha.terra20, text: HColors.brownDeep},
  admin:        { label: 'Admin',         bg: HAlpha.bord10,  bd: HAlpha.bord25,  text: HColors.bordeaux },
};

const TYPE_LABELS: Record<string, string> = {
  appartement:'Appartement', maison:'Maison', villa:'Villa',
  terrain:'Terrain', hotel:'Hôtel', appart_hotel:'Appart-Hôtel',
};

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview'|'users'|'properties'|'verification'|'notaires'|'security'|'admin-management'>('overview');
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [stats, setStats] = useState<Stats>({ total_users:0, total_properties:0, pending_properties:0, verified_properties:0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [filterRole, setFilterRole] = useState('');
  const [filterDate, setFilterDate] = useState<'asc'|'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [filterPropType, setFilterPropType] = useState('');
  const [filterPropStatus, setFilterPropStatus] = useState('');
  const [filterPropCity, setFilterPropCity] = useState('');
  const [sortProp, setSortProp] = useState<'date_desc'|'date_asc'|'price_asc'|'price_desc'>('date_desc');
  const [filterModType, setFilterModType] = useState('');
  const [sortMod, setSortMod] = useState<'date_desc'|'date_asc'|'price_asc'|'price_desc'>('date_desc');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => { loadData(); }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3000);
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const usersQuery = query(collection(db,'profiles'), orderBy('created_at','desc'), limit(20));
      const usersSnapshot = await getDocs(usersQuery);
      const profiles = usersSnapshot.docs.map(d => {
        const data = d.data();
        const toISO = (v: unknown) => {
          if (!v) return new Date().toISOString();
          if (v instanceof Timestamp) return v.toDate().toISOString();
          return String(v);
        };
        return {
          id: d.id, email: String(data.email ?? ''), full_name: String(data.full_name ?? ''),
          phone: (data.phone as string | null) ?? null, role: (data.role as Profile['role']) ?? 'locataire',
          avatar_url: (data.avatar_url as string | null) ?? null, company_name: (data.company_name as string | null) ?? null,
          verified: Boolean(data.verified ?? false), created_at: toISO(data.created_at), updated_at: toISO(data.updated_at),
        } as Profile;
      });
      const allProperties = await propertyService.getAllProperties();
      setUsers(profiles); setProperties(allProperties.slice(0, 20));
      setStats({
        total_users: profiles.length, total_properties: allProperties.length,
        pending_properties: allProperties.filter(p => p.status === 'pending').length,
        verified_properties: allProperties.filter(p => p.verified_notaire).length,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const approveProperty = async (propertyId: string) => {
    try { await propertyService.updateProperty(propertyId, { status: 'published' }); loadData(); showToast('Bien approuvé ✅'); }
    catch { showToast('Erreur', false); }
  };

  const rejectProperty = async (propertyId: string) => {
    try { await propertyService.updateProperty(propertyId, { status: 'rejected' }); loadData(); showToast('Bien rejeté'); }
    catch { showToast('Erreur', false); }
  };

  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (filterRole) list = list.filter(u => u.role === filterRole);
    list.sort((a, b) => {
      const d = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return filterDate === 'desc' ? -d : d;
    });
    return list;
  }, [users, filterRole, filterDate]);

  const filteredProperties = useMemo(() => {
    let list = [...properties];
    if (filterPropType)   list = list.filter(p => p.property_type === filterPropType);
    if (filterPropStatus) list = list.filter(p => p.status === filterPropStatus);
    if (filterPropCity)   list = list.filter(p => p.city?.toLowerCase().includes(filterPropCity.toLowerCase()));
    list.sort((a, b) => {
      if (sortProp === 'price_asc')  return a.price - b.price;
      if (sortProp === 'price_desc') return b.price - a.price;
      if (sortProp === 'date_asc')   return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [properties, filterPropType, filterPropStatus, filterPropCity, sortProp]);

  const pendingProperties = properties.filter(p => p.status === 'pending');

  const filteredPendingProperties = useMemo(() => {
    let list = [...pendingProperties];
    if (filterModType) list = list.filter(p => p.property_type === filterModType);
    list.sort((a, b) => {
      if (sortMod === 'price_asc')  return a.price - b.price;
      if (sortMod === 'price_desc') return b.price - a.price;
      if (sortMod === 'date_asc')   return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [pendingProperties, filterModType, sortMod]);
  const firstName = profile?.full_name?.split(' ')[0] || 'Admin';

  const TABS = [
    { id: 'overview',          icon: TrendingUp, label: 'Vue d\'ensemble', count: undefined           },
    { id: 'users',             icon: Users,      label: 'Utilisateurs',    count: stats.total_users   },
    { id: 'properties',        icon: Home,       label: 'Biens',           count: stats.total_properties },
    { id: 'verification',      icon: FileCheck,  label: 'Modération',      count: stats.pending_properties || undefined },
    { id: 'notaires',          icon: Award,      label: 'Notaires',        count: undefined           },
    { id: 'security',          icon: Activity,   label: 'Sécurité',        count: undefined           },
    { id: 'admin-management',  icon: UserCog,    label: 'Admins',          count: undefined           },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: HColors.creamBg }}>

      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg,${HColors.night},#1A0E00)`, borderBottom: `1px solid ${HAlpha.gold20}` }}>
        <KenteLine height={4} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-0">
          <div className="flex items-center justify-between gap-4 flex-wrap pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: HAlpha.bord20, border: `1px solid ${HAlpha.bord35}` }}>
                <Shield className="w-5 h-5" style={{ color: HColors.cream }} />
              </div>
              <div>
                <h1 className="font-bold" style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)', fontSize: '1.6rem' }}>
                  Panneau Administrateur
                </h1>
                <p className="text-sm" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                  Bonjour, {firstName} — Gestion & modération HOMECI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Stats rapides */}
              <div className="hidden md:flex items-center gap-2 text-xs" style={{ fontFamily: 'var(--font-nunito)' }}>
                <span className="px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: HAlpha.gold10, color: HColors.gold, border: `1px solid ${HAlpha.gold30}` }}>
                  {stats.total_users} utilisateurs
                </span>
                <span className="px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: HAlpha.green10, color: HColors.green, border: `1px solid ${HAlpha.green25}` }}>
                  {stats.verified_properties} certifiés
                </span>
                {stats.pending_properties > 0 && (
                  <span className="px-2.5 py-1 rounded-full font-bold animate-pulse"
                    style={{ background: HAlpha.bord20, color: HColors.cream, border: `1px solid ${HAlpha.bord35}` }}>
                    {stats.pending_properties} en attente
                  </span>
                )}
              </div>
              <button onClick={loadData} aria-label="Actualiser"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                style={{ background: HAlpha.gold10, border: `1px solid ${HAlpha.gold25}`, color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                <RotateCcw className="w-3.5 h-3.5" /> Actualiser
              </button>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex space-x-1 homeci-tabs-scroll">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                aria-label={tab.label}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className="flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-medium transition-all whitespace-nowrap"
                style={activeTab === tab.id
                  ? { borderColor: HColors.gold, color: HColors.gold, fontFamily: 'var(--font-nunito)' }
                  : { borderColor: 'transparent', color: HAlpha.cream45, fontFamily: 'var(--font-nunito)' }}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={tab.id === 'verification'
                      ? { background: HAlpha.bord20, color: HColors.cream }
                      : { background: HAlpha.gold15, color: HColors.gold }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">

        {/* ══ VUE D'ENSEMBLE ══ */}
        {activeTab === 'overview' && (
          <div>
            <SectionTitle title="Vue d'ensemble" sub="Statistiques générales de la plateforme HOMECI" />
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: HAlpha.gold20, borderTopColor: HColors.gold }} />
              </div>
            ) : (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { icon: Users,     label: 'Utilisateurs inscrits',    value: stats.total_users,        accent: HColors.navy,      bg: HAlpha.navy08  },
                    { icon: Home,      label: 'Biens immobiliers',         value: stats.total_properties,   accent: HColors.green,     bg: HAlpha.green10 },
                    { icon: AlertCircle, label: 'En attente de modération',value: stats.pending_properties, accent: HColors.gold,      bg: HAlpha.gold10  },
                    { icon: FileCheck, label: 'Biens vérifiés Notaire',    value: stats.verified_properties,accent: HColors.terracotta,bg: HAlpha.terra10 },
                  ].map(({ icon: Icon, label, value, accent, bg }) => (
                    <div key={label} className="rounded-2xl p-5"
                      style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`, boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: bg, border: `1px solid ${accent}30` }}>
                        <Icon className="w-5 h-5" style={{ color: accent }} />
                      </div>
                      <div className="text-2xl font-bold mb-0.5"
                        style={{ color: accent, fontFamily: 'var(--font-cormorant)' }}>{value}</div>
                      <div className="text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Biens récents */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: `1px solid ${HAlpha.gold10}` }}>
                    <h3 className="font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
                      Biens récents
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: HAlpha.gold08, color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                      {properties.length} affichés
                    </span>
                  </div>
                  <div className="divide-y" style={{ borderColor: HAlpha.gold08 }}>
                    {properties.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-4 px-5 py-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded-lg object-cover shrink-0"
                            style={{ border: `1px solid ${HAlpha.gold15}` }} />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: HAlpha.gold08 }}>
                            <Building2 className="w-4 h-4" style={{ color: HAlpha.gold30 }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate"
                            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>{p.title}</p>
                          <p className="text-xs flex items-center gap-1"
                            style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                            <MapPin className="w-3 h-3" style={{ color: HColors.terracotta }} />
                            {p.city} · {TYPE_LABELS[p.property_type] || p.property_type}
                          </p>
                        </div>
                        <PropertyStatusBadge status={p.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ UTILISATEURS ══ */}
        {activeTab === 'users' && (
          <div>
            <SectionTitle title="Gestion des Utilisateurs" sub="Liste des utilisateurs inscrits sur la plateforme" />
            <div className="rounded-2xl overflow-hidden"
              style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>

              {/* ── Barre filtres ── */}
              <div className="flex items-center gap-3 px-5 py-3.5 flex-wrap"
                style={{ borderBottom: `1px solid ${HAlpha.gold10}`, background: 'rgba(249,243,232,0.5)' }}>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none"
                  style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}`,
                           color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
                  <option value="">Tous les rôles</option>
                  <option value="locataire">Locataire</option>
                  <option value="proprietaire">Propriétaire</option>
                  <option value="agent">Agent</option>
                  <option value="notaire">Notaire</option>
                  <option value="admin">Admin</option>
                </select>

                <button onClick={() => setFilterDate(d => d === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                  style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}`,
                           color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                  <Calendar className="w-3.5 h-3.5" style={{ color: HColors.terracotta }}/>
                  {filterDate === 'desc' ? '↓ Plus récent' : '↑ Plus ancien'}
                </button>

                {filterRole && (
                  <button onClick={() => setFilterRole('')}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs transition-all hover:opacity-80"
                    style={{ background: HAlpha.bord10, border: `1px solid ${HAlpha.bord20}`,
                             color: HColors.bordeaux, fontFamily: 'var(--font-nunito)' }}>
                    <XCircle className="w-3 h-3"/> Effacer filtre
                  </button>
                )}

                <span className="ml-auto text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                  {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="homeci-table-scroll">
                <table className="min-w-full">
                  <thead>
                    <tr style={{ background: HColors.night }}>
                      {['Utilisateur', 'Rôle', 'Statut', "Date d'inscription", 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider"
                          style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-sm"
                          style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                          Aucun utilisateur pour ce filtre
                        </td>
                      </tr>
                    ) : filteredUsers.map((user, i) => (
                      <tr key={user.id}
                        style={{ background: i % 2 === 0 ? HColors.white : 'rgba(249,243,232,0.4)',
                                 borderBottom: `1px solid ${HAlpha.gold08}` }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                              style={{ background: HAlpha.gold10, color: HColors.gold,
                                       fontFamily: 'var(--font-cormorant)', border: `1px solid ${HAlpha.gold25}` }}>
                              {user.full_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold"
                                style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
                                {user.full_name}
                              </div>
                              <div className="text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: HAlpha.green10, color: HColors.green,
                                     border: `1px solid ${HAlpha.green20}`, fontFamily: 'var(--font-nunito)' }}>
                            Actif
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" style={{ color: HColors.terracotta }} />
                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => setSelectedUser(user)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                            style={{ background: HAlpha.navy08, border: `1px solid ${HAlpha.navy20}`,
                                     color: HColors.navy, fontFamily: 'var(--font-nunito)' }}>
                            <Eye className="w-3.5 h-3.5" /> Détails
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ BIENS ══ */}
        {activeTab === 'properties' && (
          <div>
            <SectionTitle title="Tous les Biens" sub="Vue complète de tous les biens immobiliers de la plateforme" />
            <div className="rounded-2xl overflow-hidden"
              style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>

              {/* ── Filtres ── */}
              <div className="flex items-center gap-3 px-5 py-3.5 flex-wrap"
                style={{ borderBottom: `1px solid ${HAlpha.gold10}`, background: 'rgba(249,243,232,0.5)' }}>

                {/* Type */}
                <select value={filterPropType} onChange={e => setFilterPropType(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none"
                  style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}`,
                           color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
                  <option value="">Tous les types</option>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>

                {/* Statut */}
                <select value={filterPropStatus} onChange={e => setFilterPropStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs outline-none"
                  style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}`,
                           color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
                  <option value="">Tous les statuts</option>
                  <option value="published">Publié</option>
                  <option value="pending">En attente</option>
                  <option value="draft">Brouillon</option>
                  <option value="rejected">Rejeté</option>
                  <option value="rented">Loué</option>
                  <option value="sold">Vendu</option>
                </select>

                {/* Ville */}
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3"
                    style={{ color: HColors.terracotta }} />
                  <input type="text" value={filterPropCity}
                    onChange={e => setFilterPropCity(e.target.value)}
                    placeholder="Ville…"
                    className="pl-7 pr-3 py-2 rounded-xl text-xs outline-none w-28"
                    style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}`,
                             color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }} />
                </div>

                {/* Tri */}
                <select value={sortProp} onChange={e => setSortProp(e.target.value as typeof sortProp)}
                  className="px-3 py-2 rounded-xl text-xs outline-none"
                  style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}`,
                           color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
                  <option value="date_desc">↓ Date (récent)</option>
                  <option value="date_asc">↑ Date (ancien)</option>
                  <option value="price_desc">↓ Prix (élevé)</option>
                  <option value="price_asc">↑ Prix (bas)</option>
                </select>

                {/* Effacer */}
                {(filterPropType || filterPropStatus || filterPropCity) && (
                  <button onClick={() => { setFilterPropType(''); setFilterPropStatus(''); setFilterPropCity(''); }}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs transition-all hover:opacity-80"
                    style={{ background: HAlpha.bord10, border: `1px solid ${HAlpha.bord20}`,
                             color: HColors.bordeaux, fontFamily: 'var(--font-nunito)' }}>
                    <XCircle className="w-3 h-3"/> Effacer
                  </button>
                )}

                <span className="ml-auto text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                  {filteredProperties.length} bien{filteredProperties.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="homeci-table-scroll">
                <table className="min-w-full">
                  <thead>
                    <tr style={{ background: HColors.night }}>
                      {['Bien', 'Type', 'Ville', 'Prix', 'Statut', 'Date'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider"
                          style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-sm"
                          style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                          Aucun bien pour ces filtres
                        </td>
                      </tr>
                    ) : filteredProperties.map((p, i) => (
                      <tr key={p.id}
                        style={{ background: i % 2 === 0 ? HColors.white : 'rgba(249,243,232,0.4)',
                                 borderBottom: `1px solid ${HAlpha.gold08}` }}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0"
                                style={{ border: `1px solid ${HAlpha.gold15}` }} />
                            ) : (
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: HAlpha.gold08 }}>
                                <Building2 className="w-3.5 h-3.5" style={{ color: HAlpha.gold30 }} />
                              </div>
                            )}
                            <span className="text-sm font-medium truncate max-w-[180px]"
                              style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>{p.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                          {TYPE_LABELS[p.property_type] || p.property_type}
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" style={{ color: HColors.terracotta }} />{p.city}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold" style={{ color: HColors.terracotta, fontFamily: 'var(--font-nunito)' }}>
                          {p.price.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-5 py-3"><PropertyStatusBadge status={p.status} /></td>
                        <td className="px-5 py-3 text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                          {new Date(p.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODÉRATION ══ */}
        {activeTab === 'verification' && (
          <div>
            <SectionTitle title="Modération des Biens"
              sub="Approuvez ou rejetez les nouvelles annonces soumises à validation" />

            {pendingProperties.length === 0 ? (
              <div className="rounded-2xl p-16 text-center"
                style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
                <CheckCircle className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.green15 }} />
                <h3 className="font-bold mb-1"
                  style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.3rem' }}>
                  File vide
                </h3>
                <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                  Tous les biens ont été modérés
                </p>
              </div>
            ) : (
              <>
                {/* ── Filtres modération ── */}
                <div className="flex items-center gap-3 px-5 py-3.5 mb-4 flex-wrap rounded-2xl"
                  style={{ background: 'rgba(249,243,232,0.7)', border: `1px solid ${HAlpha.gold15}` }}>

                  <select value={filterModType} onChange={e => setFilterModType(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}`,
                             color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
                    <option value="">Tous les types</option>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>

                  <select value={sortMod} onChange={e => setSortMod(e.target.value as typeof sortMod)}
                    className="px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}`,
                             color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
                    <option value="date_desc">↓ Date (récent)</option>
                    <option value="date_asc">↑ Date (ancien)</option>
                    <option value="price_desc">↓ Prix (élevé)</option>
                    <option value="price_asc">↑ Prix (bas)</option>
                  </select>

                  {filterModType && (
                    <button onClick={() => setFilterModType('')}
                      className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs transition-all hover:opacity-80"
                      style={{ background: HAlpha.bord10, border: `1px solid ${HAlpha.bord20}`,
                               color: HColors.bordeaux, fontFamily: 'var(--font-nunito)' }}>
                      <XCircle className="w-3 h-3"/> Effacer
                    </button>
                  )}

                  <span className="ml-auto text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                    {filteredPendingProperties.length} bien{filteredPendingProperties.length > 1 ? 's' : ''} en attente
                  </span>
                </div>

                {filteredPendingProperties.length === 0 ? (
                  <div className="rounded-2xl p-10 text-center"
                    style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
                    <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                      Aucun bien ne correspond à ce filtre
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPendingProperties.map(p => (
                      <div key={p.id} className="rounded-2xl overflow-hidden"
                        style={{ background: HColors.white, border: `1px solid ${HAlpha.gold25}`,
                                 boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
                        <div className="h-1" style={{ background: 'linear-gradient(90deg,#D4A017,#C07C3E)', opacity: 0.5 }} />
                        <div className="flex items-start gap-4 p-5">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.title} className="w-20 h-20 rounded-xl object-cover shrink-0"
                              style={{ border: `1px solid ${HAlpha.gold20}` }} />
                          ) : (
                            <div className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: HAlpha.gold08, border: `1px solid ${HAlpha.gold15}` }}>
                              <Building2 className="w-7 h-7" style={{ color: HAlpha.gold30 }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold mb-2"
                              style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
                              {p.title}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3"
                              style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                              <span><span className="font-semibold" style={{ color: HColors.brownMid }}>Type : </span>{TYPE_LABELS[p.property_type] || p.property_type}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" style={{ color: HColors.terracotta }} />{p.city}</span>
                              <span><span className="font-semibold" style={{ color: HColors.brownMid }}>Prix : </span>{p.price.toLocaleString('fr-FR')} FCFA</span>
                              <span><span className="font-semibold" style={{ color: HColors.brownMid }}>Soumis : </span>{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                            {p.description && (
                              <p className="text-xs line-clamp-2"
                                style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>{p.description}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button onClick={() => setSelectedProperty(p)}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl transition-all hover:opacity-80"
                              style={{ background: HAlpha.navy08, border: `1px solid ${HAlpha.navy20}`,
                                       color: HColors.navy, fontFamily: 'var(--font-nunito)' }}>
                              <Eye className="w-3.5 h-3.5" /> Voir détails
                            </button>
                            <button onClick={() => approveProperty(p.id)}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all hover:opacity-90"
                              style={{ background: 'linear-gradient(135deg,#2D6A4F,#1A4F3A)', color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                              <CheckCircle className="w-3.5 h-3.5" /> Approuver
                            </button>
                            <button onClick={() => rejectProperty(p.id)}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl transition-all hover:opacity-80"
                              style={{ background: HAlpha.bord10, border: `1px solid ${HAlpha.bord25}`,
                                       color: HColors.bordeaux, fontFamily: 'var(--font-nunito)' }}>
                              <XCircle className="w-3.5 h-3.5" /> Rejeter
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'notaires' && <NotairesTab showToast={showToast} />}
        {activeTab === 'security' && <AdminLoginHistory />}
        {activeTab === 'admin-management' && <AdminManagement />}
      </div>

      {/* ── Modal Détails Bien ── */}
      {selectedProperty && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedProperty(null)}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}
            onClick={e => e.stopPropagation()}>
            <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#D4A017,#C07C3E,#2D6A4F,#D4A017)' }}/>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: `1px solid ${HAlpha.gold10}` }}>
              <div>
                <h3 className="font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>
                  {selectedProperty.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <PropertyStatusBadge status={selectedProperty.status} />
                  <span className="text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                    {TYPE_LABELS[selectedProperty.property_type] || selectedProperty.property_type}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedProperty(null)}
                className="p-1.5 rounded-full hover:opacity-70 transition-all"
                style={{ background: HAlpha.gold08, color: HColors.brown }}>
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto p-6 space-y-5">

              {/* Photos */}
              {selectedProperty.images && selectedProperty.images.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                    Photos ({selectedProperty.images.length})
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedProperty.images.map((img, i) => (
                      <img key={i} src={img} alt={`Photo ${i+1}`}
                        className="w-32 h-24 rounded-xl object-cover shrink-0"
                        style={{ border: `1px solid ${HAlpha.gold20}` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Infos principales */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                  Informations générales
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Type de bien',    value: TYPE_LABELS[selectedProperty.property_type] || selectedProperty.property_type },
                    { label: 'Transaction',      value: selectedProperty.listing_type === 'rent' ? 'Location' : 'Vente' },
                    { label: 'Prix',             value: `${selectedProperty.price.toLocaleString('fr-FR')} FCFA${selectedProperty.listing_type === 'rent' ? '/mois' : ''}` },
                    { label: 'Surface',          value: selectedProperty.area ? `${selectedProperty.area} m²` : '—' },
                    { label: 'Chambres',         value: selectedProperty.bedrooms ?? '—' },
                    { label: 'Salles de bain',   value: selectedProperty.bathrooms ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2 px-3 rounded-xl"
                      style={{ background: HColors.creamBg, border: `1px solid ${HAlpha.gold10}` }}>
                      <span className="text-xs font-semibold" style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>{label}</span>
                      <span className="text-xs font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Localisation */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                  Localisation
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Ville',      value: selectedProperty.city || '—' },
                    { label: 'Quartier',   value: selectedProperty.neighborhood || '—' },
                    { label: 'Adresse',    value: selectedProperty.address || '—' },
                    { label: 'Pays',       value: selectedProperty.country || "Côte d'Ivoire" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2 px-3 rounded-xl"
                      style={{ background: HColors.creamBg, border: `1px solid ${HAlpha.gold10}` }}>
                      <span className="text-xs font-semibold" style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>{label}</span>
                      <span className="text-xs text-right max-w-[140px] truncate" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Équipements */}
              {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                    Équipements
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProperty.amenities.map((a: string) => (
                      <span key={a} className="px-2.5 py-1 rounded-full text-xs"
                        style={{ background: HAlpha.gold08, color: HColors.brownMid,
                                 border: `1px solid ${HAlpha.gold20}`, fontFamily: 'var(--font-nunito)' }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedProperty.description && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                    Description
                  </p>
                  <div className="p-3 rounded-xl text-xs leading-relaxed"
                    style={{ background: HColors.creamBg, border: `1px solid ${HAlpha.gold10}`,
                             color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                    {selectedProperty.description}
                  </div>
                </div>
              )}

              {/* Métadonnées */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                  Métadonnées
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'ID',           value: selectedProperty.id },
                    { label: 'Propriétaire', value: selectedProperty.owner_id || '—' },
                    { label: 'Soumis le',    value: new Date(selectedProperty.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }) },
                    { label: 'Modifié le',   value: selectedProperty.updated_at ? new Date(selectedProperty.updated_at).toLocaleDateString('fr-FR') : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2 px-3 rounded-xl"
                      style={{ background: HColors.creamBg, border: `1px solid ${HAlpha.gold10}` }}>
                      <span className="text-xs font-semibold" style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>{label}</span>
                      <span className="text-xs text-right max-w-[150px] truncate font-mono" style={{ color: HColors.darkBrown }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="flex gap-2 px-6 py-4" style={{ borderTop: `1px solid ${HAlpha.gold10}` }}>
              <button onClick={() => { approveProperty(selectedProperty.id); setSelectedProperty(null); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#2D6A4F,#1A4F3A)', color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                <CheckCircle className="w-4 h-4" /> Approuver
              </button>
              <button onClick={() => { rejectProperty(selectedProperty.id); setSelectedProperty(null); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ background: HAlpha.bord10, border: `1px solid ${HAlpha.bord25}`,
                         color: HColors.bordeaux, fontFamily: 'var(--font-nunito)' }}>
                <XCircle className="w-4 h-4" /> Rejeter
              </button>
              <button onClick={() => setSelectedProperty(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ background: HAlpha.gold08, border: `1px solid ${HAlpha.gold20}`,
                         color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Détails Utilisateur ── */}
      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}
            onClick={e => e.stopPropagation()}>
            <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#D4A017,#C07C3E,#2D6A4F,#D4A017)' }}/>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl"
                    style={{ background: HAlpha.gold15, color: HColors.gold,
                             fontFamily: 'var(--font-cormorant)', border: `2px solid ${HAlpha.gold30}` }}>
                    {selectedUser.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold mb-1"
                      style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.3rem' }}>
                      {selectedUser.full_name}
                    </h3>
                    <RoleBadge role={selectedUser.role} />
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)}
                  className="p-1.5 rounded-full hover:opacity-70 transition-all"
                  style={{ background: HAlpha.gold08, color: HColors.brown }}>
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Infos */}
              <div className="space-y-2">
                {[
                  { label: 'Email',        value: selectedUser.email,                              icon: '✉' },
                  { label: 'Téléphone',    value: selectedUser.phone || '—',                       icon: '📞' },
                  { label: 'Entreprise',   value: selectedUser.company_name || '—',                icon: '🏢' },
                  { label: 'Vérifié',      value: selectedUser.verified ? 'Oui ✓' : 'Non',        icon: '🔒' },
                  { label: 'Inscrit le',   value: new Date(selectedUser.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }), icon: '📅' },
                  { label: 'ID',           value: selectedUser.id,                                 icon: '#'  },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl"
                    style={{ background: HColors.creamBg, border: `1px solid ${HAlpha.gold10}` }}>
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider shrink-0"
                      style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                      <span>{icon}</span>{label}
                    </span>
                    <span className="text-xs text-right truncate max-w-[200px]"
                      style={{ color: HColors.darkBrown, fontFamily: label === 'ID' ? 'monospace' : 'var(--font-nunito)' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-5">
                <button onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: HAlpha.gold08, border: `1px solid ${HAlpha.gold20}`,
                           color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 overflow-hidden rounded-2xl shadow-2xl" style={{ minWidth: 260 }}>
          <KenteLine height={3} />
          <div className="flex items-center gap-2 px-4 py-3"
            style={{ background: toast.ok ? HColors.night : HColors.bordeaux }}>
            {toast.ok
              ? <CheckCircle className="w-4 h-4 shrink-0" style={{ color: HColors.gold }} />
              : <XCircle className="w-4 h-4 shrink-0" style={{ color: HColors.cream }} />}
            <span className="text-sm font-medium" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
              {toast.msg}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sous-composants ────────────────────────────────────────────────────────────
function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-bold mb-0.5" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem' }}>
        {title}
      </h2>
      <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>{sub}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CFG[role] || ROLE_CFG.locataire;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, border: `1px solid ${cfg.bd}`, color: cfg.text, fontFamily: 'var(--font-nunito)' }}>
      {cfg.label}
    </span>
  );
}

function PropertyStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; bd: string; text: string; label: string }> = {
    published: { bg: HAlpha.green10, bd: HAlpha.green25, text: HColors.green,     label: 'Publié'      },
    pending:   { bg: HAlpha.gold10,  bd: HAlpha.gold25,  text: HColors.brownMid,  label: 'En attente'  },
    draft:     { bg: HAlpha.gold08,  bd: HAlpha.gold15,  text: HColors.brown,     label: 'Brouillon'   },
    rejected:  { bg: HAlpha.bord10,  bd: HAlpha.bord25,  text: HColors.bordeaux,  label: 'Rejeté'      },
    rented:    { bg: HAlpha.navy08,  bd: HAlpha.navy20,  text: HColors.navy,      label: 'Loué'        },
    sold:      { bg: HAlpha.terra10, bd: HAlpha.terra20, text: HColors.brownDeep, label: 'Vendu'       },
  };
  const c = cfg[status] || cfg.draft;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, border: `1px solid ${c.bd}`, color: c.text, fontFamily: 'var(--font-nunito)' }}>
      {c.label}
    </span>
  );
}

// ── Onglet Notaires ────────────────────────────────────────────────────────────
interface NotaireCode {
  id: string;
  code: string;
  used: boolean;
  used_at?: string;
  created_at: string;
  expires_at?: string;
  note?: string;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(10);
  crypto.getRandomValues(array);
  return Array.from(array, b => chars[b % chars.length]).join('');
}

function NotairesTab({ showToast }: { showToast: (msg: string, ok?: boolean) => void }) {
  const [codes, setCodes] = useState<NotaireCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [note, setNote] = useState('');
  const [expireDays, setExpireDays] = useState(7);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { loadCodes(); }, []);

  async function loadCodes() {
    setLoading(true);
    try {
      const q = query(collection(db, 'notaire_codes'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      setCodes(snap.docs.map(d => ({ id: d.id, ...d.data() } as NotaireCode)));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const code = generateCode();
      const expires = new Date();
      expires.setDate(expires.getDate() + expireDays);
      const data = {
        code,
        used: false,
        created_at: new Date().toISOString(),
        expires_at: expires,
        note: note.trim() || null,
      };
      const ref = await addDoc(collection(db, 'notaire_codes'), data);
      setCodes(prev => [{ id: ref.id, ...data, expires_at: expires.toISOString() }, ...prev]);
      setNote('');
      showToast(`Code notaire généré : ${code}`);
    } catch { showToast('Erreur lors de la génération', false); }
    finally { setGenerating(false); }
  }

  async function handleRevoke(id: string) {
    try {
      await updateDoc(doc(db, 'notaire_codes', id), { used: true, used_at: new Date().toISOString() });
      setCodes(prev => prev.map(c => c.id === id ? { ...c, used: true } : c));
      showToast('Code révoqué.');
    } catch { showToast('Erreur', false); }
  }

  async function handleCopy(code: string, id: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const isExpired = (c: NotaireCode) => c.expires_at ? new Date(c.expires_at) < new Date() : false;

  return (
    <div>
      <SectionTitle title="Accès Notaires" sub="Générez des codes d'invitation à usage unique pour les notaires agréés" />

      {/* Générateur */}
      <div className="rounded-2xl p-6 mb-6"
        style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
        <h3 className="font-bold mb-4" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.2rem' }}>
          Générer un nouveau code
        </h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
              Note (optionnel)
            </label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Ex: Me Konaté, Cabinet Abidjan..."
              className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
              style={{ background: HColors.creamBg, border: `1px solid ${HAlpha.gold20}`,
                       color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
              Expire dans
            </label>
            <select value={expireDays} onChange={e => setExpireDays(Number(e.target.value))}
              className="px-3 py-2.5 rounded-xl outline-none text-sm"
              style={{ background: HColors.creamBg, border: `1px solid ${HAlpha.gold20}`,
                       color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
              <option value={1}>1 jour</option>
              <option value={3}>3 jours</option>
              <option value={7}>7 jours</option>
              <option value={30}>30 jours</option>
            </select>
          </div>
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#D4A017,#C07C3E)', color: HColors.night,
                     fontFamily: 'var(--font-nunito)' }}>
            {generating ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Générer un code
          </button>
        </div>
      </div>

      {/* Liste codes */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${HAlpha.gold10}` }}>
          <h3 className="font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            Codes générés
          </h3>
          <button onClick={loadCodes} className="text-xs flex items-center gap-1 hover:opacity-70 transition-all"
            style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            <RotateCcw className="w-3.5 h-3.5" /> Actualiser
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <LoaderIcon className="w-6 h-6 animate-spin" style={{ color: HColors.gold }} />
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-10 h-10 mx-auto mb-3" style={{ color: HAlpha.gold20 }} />
            <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
              Aucun code généré pour l'instant
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: HAlpha.gold08 }}>
            {codes.map((c, i) => {
              const expired = isExpired(c);
              const inactive = c.used || expired;
              return (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3.5"
                  style={{ background: i % 2 === 0 ? HColors.white : 'rgba(249,243,232,0.4)', opacity: inactive ? 0.6 : 1 }}>
                  {/* Code */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold tracking-widest text-sm"
                        style={{ color: inactive ? HColors.brown : HColors.darkBrown }}>
                        {c.code}
                      </span>
                      {c.note && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: HAlpha.gold08, color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                          {c.note}
                        </span>
                      )}
                      {/* Badge statut */}
                      {c.used ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: HAlpha.green10, color: HColors.green, border: `1px solid ${HAlpha.green20}`, fontFamily: 'var(--font-nunito)' }}>
                          Utilisé
                        </span>
                      ) : expired ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: HAlpha.bord10, color: HColors.bordeaux, border: `1px solid ${HAlpha.bord20}`, fontFamily: 'var(--font-nunito)' }}>
                          Expiré
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: HAlpha.gold10, color: HColors.brownMid, border: `1px solid ${HAlpha.gold25}`, fontFamily: 'var(--font-nunito)' }}>
                          Actif
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs mt-0.5" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" style={{ color: HColors.terracotta }} />
                        Créé le {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      {c.expires_at && (
                        <span>Expire le {new Date(c.expires_at).toLocaleDateString('fr-FR')}</span>
                      )}
                      {c.used_at && (
                        <span>Utilisé le {new Date(c.used_at).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!inactive && (
                      <>
                        <button onClick={() => handleCopy(c.code, c.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all hover:opacity-80"
                          style={{ background: HAlpha.navy08, border: `1px solid ${HAlpha.navy20}`,
                                   color: copiedId === c.id ? HColors.green : HColors.navy, fontFamily: 'var(--font-nunito)' }}>
                          <Copy className="w-3 h-3" />
                          {copiedId === c.id ? 'Copié !' : 'Copier'}
                        </button>
                        <button onClick={() => handleRevoke(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all hover:opacity-80"
                          style={{ background: HAlpha.bord10, border: `1px solid ${HAlpha.bord20}`,
                                   color: HColors.bordeaux, fontFamily: 'var(--font-nunito)' }}>
                          <XCircle className="w-3 h-3" /> Révoquer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
