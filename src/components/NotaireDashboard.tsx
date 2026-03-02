import { useState, useEffect, useMemo } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { propertyService } from '../services/propertyService';
import { notificationService } from '../services/notificationService';
import type { Property } from '../services/propertyService';
import {
  FileCheck, CheckCircle, XCircle, Clock, FileText, Building2,
  MapPin, ExternalLink, Search, AlertCircle, X, Eye,
  RotateCcw, Stamp, ChevronDown, Phone, User, Calendar,
  MessageSquare, ThumbsUp, ThumbsDown, Loader, BadgeCheck,
} from 'lucide-react';

// ── Constantes ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', villa: 'Villa',
  terrain: 'Terrain', hotel: 'Hôtel', appart_hotel: 'Appart-Hôtel',
};

const DOC_LABELS: Record<string, string> = {
  titre_foncier:             'Titre foncier',
  permis_construire:         'Permis de construire',
  plan_cadastral:            'Plan cadastral',
  certificat_propriete:      'Certificat de propriété',
  arrete_lotissement:        'Arrêté de lotissement',
  autorisation_exploitation: "Autorisation d'exploitation",
  registre_commerce:         'Registre de commerce',
};

const REQUIRED_DOCS: Record<string, string[]> = {
  appartement:  ['titre_foncier', 'permis_construire'],
  maison:       ['titre_foncier', 'permis_construire'],
  villa:        ['titre_foncier', 'permis_construire'],
  terrain:      ['titre_foncier', 'plan_cadastral'],
  hotel:        ['titre_foncier', 'autorisation_exploitation', 'registre_commerce'],
  appart_hotel: ['titre_foncier', 'autorisation_exploitation', 'registre_commerce'],
};

type DocStatus = 'en_attente' | 'valide' | 'refuse';
type TabId = 'en_cours' | 'pret' | 'certifie';

function isReadyToCertify(p: Property) {
  const req = REQUIRED_DOCS[p.property_type] || ['titre_foncier'];
  return req.every(r => p.documents?.find(d => d.type === r)?.status === 'valide');
}

function getDocStatus(p: Property): 'aucun' | 'partiel' | 'complet' | 'certifie' {
  if (p.verified_notaire) return 'certifie';
  if (!p.documents?.length) return 'aucun';
  return isReadyToCertify(p) ? 'complet' : (p.documents.some(d => d.status === 'valide') ? 'partiel' : 'aucun');
}

interface OwnerProfile { full_name: string; phone?: string; email?: string; }

// ── Composant principal ───────────────────────────────────────────────────────
export default function NotaireDashboard() {
  const { profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Record<string, OwnerProfile>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('en_cours');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [certifyingId, setCertifyingId] = useState<string | null>(null);
  const [refusalReasons, setRefusalReasons] = useState<Record<string, string>>({}); // "docType:propId" → raison
  const [showRefusalInput, setShowRefusalInput] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { loadProperties(); }, []);

  async function loadProperties() {
    setLoading(true);
    try {
      const all = await propertyService.getProperties();
      const withDocs = all.filter(p => p.documents?.length > 0 || p.verified_notaire);
      setProperties(withDocs);
      // Charger les profils propriétaires uniques
      const ownerIds = [...new Set(withDocs.map(p => p.owner_id))];
      const profileEntries = await Promise.all(
        ownerIds.map(async id => {
          try {
            const snap = await getDoc(doc(db, 'profiles', id));
            if (snap.exists()) {
              const d = snap.data();
              return [id, { full_name: d.full_name || 'Propriétaire', phone: d.phone, email: d.email }] as [string, OwnerProfile];
            }
          } catch {}
          return [id, { full_name: 'Propriétaire' }] as [string, OwnerProfile];
        })
      );
      setOwners(Object.fromEntries(profileEntries));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleDocAction(property: Property, docType: string, newStatus: DocStatus) {
    const key = `${docType}:${property.id}`;
    setActionLoading(key);
    try {
      const reason = refusalReasons[key] || '';
      const updatedDocs: typeof property.documents = property.documents.map(d => {
        if (d.type !== docType) return d;
        // Firestore rejette undefined — on construit l'objet sans champs undefined
        const updated: typeof d = { ...d, status: newStatus };
        if (newStatus === 'valide') {
          updated.validated_at = new Date().toISOString();
        } else {
          delete updated.validated_at;
        }
        if (newStatus === 'refuse' && reason) {
          updated.rejection_reason = reason;
        } else {
          delete updated.rejection_reason;
        }
        return updated;
      });
      await propertyService.updateProperty(property.id, { documents: updatedDocs });

      const docLabel = DOC_LABELS[docType] || docType;
      const statusLabel = newStatus === 'valide' ? 'validé ✅' : newStatus === 'refuse' ? 'refusé ❌' : 'remis en attente';
      await notificationService.createNotification({
        user_id: property.owner_id,
        type: 'system',
        title: `📄 Document ${newStatus === 'valide' ? 'validé' : newStatus === 'refuse' ? 'refusé' : 'en attente'}`,
        message: `Votre ${docLabel} pour "${property.title}" a été ${statusLabel}${reason ? ` : ${reason}` : ''}.`,
        property_id: property.id,
      });

      setProperties(prev => prev.map(p =>
        p.id === property.id ? { ...p, documents: updatedDocs } : p
      ));
      setShowRefusalInput(null);
      showToast(`${docLabel} ${statusLabel}`);
    } catch { showToast('Erreur lors de la mise à jour', false); }
    finally { setActionLoading(null); }
  }

  async function handleCertify(property: Property) {
    if (!isReadyToCertify(property)) return;
    setCertifyingId(property.id);
    try {
      await propertyService.updateProperty(property.id, {
        verified_notaire: true,
        verification_date: new Date().toISOString(),
        status: 'published',
      });
      await notificationService.createNotification({
        user_id: property.owner_id,
        type: 'system',
        title: '🏆 Bien certifié Notaire !',
        message: `Votre bien "${property.title}" a obtenu le badge "Vérifié Notaire" et est maintenant publié.`,
        property_id: property.id,
      });
      setProperties(prev => prev.map(p =>
        p.id === property.id ? { ...p, verified_notaire: true, status: 'published' } : p
      ));
      setExpandedId(null);
      setActiveTab('certifie');
      showToast('✅ Bien certifié ! Badge "Vérifié Notaire" accordé.');
    } catch { showToast('Erreur lors de la certification', false); }
    finally { setCertifyingId(null); }
  }

  async function handleRevoke(property: Property) {
    if (!confirm(`Retirer la certification "Vérifié Notaire" de "${property.title}" ?`)) return;
    setCertifyingId(property.id);
    try {
      await propertyService.updateProperty(property.id, { verified_notaire: false, verification_date: null });
      setProperties(prev => prev.map(p =>
        p.id === property.id ? { ...p, verified_notaire: false } : p
      ));
      showToast('Certification retirée.');
    } catch { showToast('Erreur', false); }
    finally { setCertifyingId(null); }
  }

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const { enCours, pret, certifie } = useMemo(() => {
    const ec: Property[] = [], pr: Property[] = [], ce: Property[] = [];
    for (const p of properties) {
      const s = getDocStatus(p);
      if (s === 'certifie') ce.push(p);
      else if (s === 'complet') pr.push(p);
      else ec.push(p);
    }
    return { enCours: ec, pret: pr, certifie: ce };
  }, [properties]);

  const currentList = activeTab === 'en_cours' ? enCours : activeTab === 'pret' ? pret : certifie;

  const filtered = useMemo(() => {
    let list = [...currentList];
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
  }, [currentList, searchQuery, filterType, owners]);

  const stats = useMemo(() => ({
    enCours: enCours.length,
    pret: pret.length,
    certifie: certifie.length,
    docsAttente: properties.flatMap(p => p.documents || []).filter(d => d.status === 'en_attente').length,
    docsValides: properties.flatMap(p => p.documents || []).filter(d => d.status === 'valide').length,
  }), [enCours, pret, certifie, properties]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-emerald-600 animate-spin"/>
          <p className="text-gray-500 text-sm">Chargement des dossiers…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Stamp className="w-5 h-5 text-emerald-700"/>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Espace Notaire</h1>
                <p className="text-sm text-gray-500">
                  Bonjour, {profile?.full_name?.split(' ')[0] || 'Notaire'}
                  {stats.docsAttente > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                      {stats.docsAttente} doc{stats.docsAttente > 1 ? 's' : ''} à examiner
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button onClick={loadProperties}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
              <RotateCcw className="w-3.5 h-3.5"/> Actualiser
            </button>
          </div>

          {/* Stats bar */}
          <div className="flex gap-4 py-3 border-t border-gray-50 text-sm flex-wrap">
            <span className="text-gray-500">{properties.length} dossier(s) total</span>
            <span className="text-gray-300">·</span>
            <span className="text-emerald-600 font-medium">{stats.docsValides} doc(s) validé(s)</span>
            <span className="text-gray-300">·</span>
            <span className="text-amber-600 font-medium">{stats.docsAttente} doc(s) en attente</span>
            <span className="text-gray-300">·</span>
            <span className="text-blue-600 font-medium">{stats.certifie} bien(s) certifié(s)</span>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 -mb-px">
            {([
              { id: 'en_cours', label: 'En cours de révision', count: stats.enCours,  color: 'amber'   },
              { id: 'pret',     label: 'Prêts à certifier',    count: stats.pret,     color: 'blue'    },
              { id: 'certifie', label: 'Certifiés',            count: stats.certifie, color: 'emerald' },
            ] as const).map(tab => {
              const isActive = activeTab === tab.id;
              const countColors = { amber: 'bg-amber-100 text-amber-700', blue: 'bg-blue-100 text-blue-700', emerald: 'bg-emerald-100 text-emerald-700' };
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${isActive ? countColors[tab.color] : 'bg-gray-100 text-gray-500'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* Barre recherche + filtre type */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Bien, ville, propriétaire…"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"/>
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
            <option value="">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {(searchQuery || filterType) && (
            <button onClick={() => { setSearchQuery(''); setFilterType(''); }}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50">
              <X className="w-3.5 h-3.5"/> Effacer
            </button>
          )}
          <p className="self-center text-sm text-gray-400">{filtered.length} dossier(s)</p>
        </div>

        {/* ── Onglet : Prêts à certifier (prioritaire) ── */}
        {activeTab === 'pret' && filtered.length > 0 && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
            <BadgeCheck className="w-4 h-4 shrink-0"/>
            <span>Ces biens ont tous leurs documents requis validés. Vous pouvez leur accorder le badge <strong>Vérifié Notaire</strong>.</span>
          </div>
        )}

        {/* ── Liste vide ── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <FileCheck className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
            <p className="text-gray-500 text-sm">
              {activeTab === 'en_cours' ? 'Aucun dossier en cours' :
               activeTab === 'pret'     ? 'Aucun dossier prêt à certifier' :
                                         'Aucun bien certifié pour l\'instant'}
            </p>
          </div>
        ) : (

          /* ── Liste dossiers ── */
          <div className="space-y-3">
            {filtered.map(property => {
              const docSt = getDocStatus(property);
              const isExpanded = expandedId === property.id;
              const required = REQUIRED_DOCS[property.property_type] || ['titre_foncier'];
              const ready = isReadyToCertify(property);
              const owner = owners[property.owner_id];
              const validatedReq = required.filter(r => property.documents?.find(d => d.type === r)?.status === 'valide').length;
              const pct = required.length > 0 ? Math.round((validatedReq / required.length) * 100) : 0;

              return (
                <div key={property.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${
                  docSt === 'certifie' ? 'border-emerald-200' :
                  docSt === 'complet'  ? 'border-blue-200' :
                  docSt === 'partiel'  ? 'border-amber-200' : 'border-gray-200'
                }`}>

                  {/* ── Ligne résumé ── */}
                  <div className="flex gap-4 p-4 items-start">
                    {/* Photo */}
                    {property.images?.[0] ? (
                      <img src={property.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-100"/>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6 text-gray-300"/>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Titre + badge */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{property.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1"><Building2 className="w-3 h-3"/>{TYPE_LABELS[property.property_type]}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{[property.city, property.commune, property.quartier].filter(Boolean).join(', ')}</span>
                            {owner && <span className="flex items-center gap-1"><User className="w-3 h-3"/>{owner.full_name}</span>}
                          </div>
                        </div>
                        <StatusBadge status={docSt}/>
                      </div>

                      {/* Barre progression */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-400' : 'bg-gray-200'}`}
                               style={{ width: `${pct}%` }}/>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{validatedReq}/{required.length} requis</span>
                        <span className="text-xs text-gray-400">{property.documents?.length || 0} doc(s) soumis</span>
                      </div>
                    </div>

                    {/* Bouton examiner */}
                    <button onClick={() => setExpandedId(isExpanded ? null : property.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-xl shrink-0 self-start transition-colors ${
                        isExpanded ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>
                      <Eye className="w-3.5 h-3.5"/>
                      {isExpanded ? 'Fermer' : 'Examiner'}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}/>
                    </button>
                  </div>

                  {/* ── Panneau étendu ── */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/60 p-4 space-y-4">

                      {/* Infos propriétaire */}
                      {owner && (
                        <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                          <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-emerald-700"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{owner.full_name}</p>
                            <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                              {owner.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{owner.phone}</span>}
                              {owner.email && <span>{owner.email}</span>}
                            </div>
                          </div>
                          {property.verification_date && (
                            <div className="text-xs text-emerald-600 flex items-center gap-1 shrink-0">
                              <Calendar className="w-3 h-3"/>
                              Certifié le {new Date(property.verification_date).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Documents */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Documents soumis</h4>
                        <div className="space-y-2">
                          {(property.documents || []).map(docItem => {
                            const actionKey = `${docItem.type}:${property.id}`;
                            const isLoading = actionLoading === actionKey;
                            const isRequired = required.includes(docItem.type);
                            const isShowingRefusal = showRefusalInput === actionKey;

                            return (
                              <div key={docItem.type} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-3 p-3">
                                  <FileText className="w-4 h-4 text-gray-400 shrink-0"/>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium text-gray-800">
                                        {docItem.label || DOC_LABELS[docItem.type] || docItem.type}
                                      </span>
                                      {isRequired && (
                                        <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">Requis</span>
                                      )}
                                      <DocStatusBadge status={docItem.status as DocStatus}/>
                                    </div>
                                    {docItem.status === 'valide' && docItem.validated_at && (
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        Validé le {new Date(docItem.validated_at).toLocaleDateString('fr-FR')}
                                      </p>
                                    )}
                                    {docItem.status === 'refuse' && (docItem as any).rejection_reason && (
                                      <p className="text-xs text-red-500 mt-0.5">
                                        Motif : {(docItem as any).rejection_reason}
                                      </p>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {docItem.url && (
                                      <a href={docItem.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 font-medium">
                                        <ExternalLink className="w-3 h-3"/> Consulter
                                      </a>
                                    )}
                                    {!property.verified_notaire && (
                                      <>
                                        {docItem.status !== 'valide' && (
                                          <button onClick={() => handleDocAction(property, docItem.type, 'valide')}
                                            disabled={isLoading}
                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium disabled:opacity-50 transition-colors">
                                            {isLoading ? <Loader className="w-3 h-3 animate-spin"/> : <ThumbsUp className="w-3 h-3"/>}
                                            Valider
                                          </button>
                                        )}
                                        {docItem.status !== 'refuse' && (
                                          <button onClick={() => setShowRefusalInput(isShowingRefusal ? null : actionKey)}
                                            disabled={isLoading}
                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50 transition-colors">
                                            <ThumbsDown className="w-3 h-3"/>
                                            Refuser
                                          </button>
                                        )}
                                        {docItem.status !== 'en_attente' && (
                                          <button onClick={() => handleDocAction(property, docItem.type, 'en_attente')}
                                            disabled={isLoading}
                                            title="Remettre en attente"
                                            className="p-1.5 text-gray-400 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                                            <RotateCcw className="w-3 h-3"/>
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Motif de refus inline */}
                                {isShowingRefusal && !property.verified_notaire && (
                                  <div className="border-t border-red-100 bg-red-50 px-3 pb-3 pt-2 flex gap-2">
                                    <input
                                      type="text"
                                      value={refusalReasons[actionKey] || ''}
                                      onChange={e => setRefusalReasons(r => ({ ...r, [actionKey]: e.target.value }))}
                                      placeholder="Motif de refus (ex : document illisible, non conforme…)"
                                      className="flex-1 px-3 py-1.5 text-xs border border-red-200 rounded-lg focus:ring-1 focus:ring-red-400 focus:border-transparent bg-white"
                                    />
                                    <button
                                      onClick={() => handleDocAction(property, docItem.type, 'refuse')}
                                      disabled={isLoading}
                                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
                                      {isLoading ? <Loader className="w-3 h-3 animate-spin"/> : <XCircle className="w-3 h-3"/>}
                                      Confirmer
                                    </button>
                                    <button onClick={() => setShowRefusalInput(null)}
                                      className="p-1.5 text-gray-400 hover:text-gray-600">
                                      <X className="w-3.5 h-3.5"/>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Docs requis manquants */}
                        {(() => {
                          const missing = required.filter(r => !property.documents?.find(d => d.type === r));
                          if (!missing.length) return null;
                          return (
                            <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>
                              <div>
                                <span className="font-semibold">Documents requis non soumis : </span>
                                {missing.map(m => DOC_LABELS[m] || m).join(', ')}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Action certification */}
                      <div className={`flex items-center justify-between gap-3 p-3 rounded-xl ${ready && !property.verified_notaire ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'}`}>
                        <div className="text-xs text-gray-600 flex items-center gap-1.5">
                          {property.verified_notaire ? (
                            <><BadgeCheck className="w-4 h-4 text-emerald-600"/> Badge "Vérifié Notaire" accordé</>
                          ) : ready ? (
                            <><CheckCircle className="w-4 h-4 text-blue-600 shrink-0"/> Tous les documents requis sont validés — prêt à certifier</>
                          ) : (
                            <><AlertCircle className="w-4 h-4 text-gray-400 shrink-0"/> Documents requis manquants ou non encore tous validés</>
                          )}
                        </div>
                        <div>
                          {property.verified_notaire ? (
                            <button onClick={() => handleRevoke(property)}
                              disabled={certifyingId === property.id}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors">
                              <XCircle className="w-3.5 h-3.5"/> Retirer la certification
                            </button>
                          ) : (
                            <button onClick={() => handleCertify(property)}
                              disabled={!ready || certifyingId === property.id}
                              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors">
                              {certifyingId === property.id
                                ? <Loader className="w-4 h-4 animate-spin"/>
                                : <Stamp className="w-4 h-4"/>}
                              Certifier ce bien
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium text-white ${toast.ok ? 'bg-emerald-600' : 'bg-red-500'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'aucun' | 'partiel' | 'complet' | 'certifie' }) {
  const cfg = {
    certifie: { cls: 'bg-emerald-100 text-emerald-700', label: 'Certifié',          icon: <Stamp className="w-3 h-3"/> },
    complet:  { cls: 'bg-blue-100 text-blue-700',       label: 'Prêt à certifier',  icon: <CheckCircle className="w-3 h-3"/> },
    partiel:  { cls: 'bg-amber-100 text-amber-700',     label: 'En cours',          icon: <Clock className="w-3 h-3"/> },
    aucun:    { cls: 'bg-gray-100 text-gray-600',       label: 'En attente',        icon: <Clock className="w-3 h-3"/> },
  }[status];
  return (
    <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function DocStatusBadge({ status }: { status: DocStatus }) {
  const cfg: Record<DocStatus, { cls: string; label: string }> = {
    en_attente: { cls: 'bg-amber-100 text-amber-700',   label: 'En attente' },
    valide:     { cls: 'bg-emerald-100 text-emerald-700', label: 'Validé' },
    refuse:     { cls: 'bg-red-100 text-red-700',         label: 'Refusé' },
  };
  const { cls, label } = cfg[status] || cfg.en_attente;
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}
