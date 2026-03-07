import { useState, useEffect } from 'react';
import {
  X, MapPin, Bed, Bath, Maximize, CheckCircle, Calendar, Eye,
  Star, Hotel, Layers, Lock, AlertTriangle, Clock, Phone,
  ShieldCheck, CreditCard, ChevronLeft, ChevronRight, Home,
  Building2, Car, ArrowUpDown, FileText, ExternalLink,
} from 'lucide-react';
import { propertyService } from '../services/propertyService';
import type { Property } from '../services/propertyService';
import { visitService } from '../services/visitService';
import type { VisitRequest } from '../services/visitService';
import { useAuth } from '../contexts/AuthContext';
import OptimizedImage from './OptimizedImage';
import MapDisplay from './MapDisplay';
import { Property3DViewer } from './Property3DViewer';
import { HColors, HAlpha, HS } from '../styles/homeci-tokens';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { fixDocUrl } from '../utils/fixDocUrl';

interface PropertyViewModalProps {
  propertyId: string;
  onClose: () => void;
  onRequestVisit?: () => void;
  onShowAuth?: (mode: 'login' | 'signup') => void;
}

const TYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', villa: 'Villa',
  terrain: 'Terrain', hotel: 'Hôtel', appart_hotel: 'Appart-Hôtel',
};
const DOC_STATUS: Record<string, { label: string; color: string }> = {
  valide:     { label: 'Validé',     color: '' },
  en_attente: { label: 'En attente', color: '' },
  refuse:     { label: 'Refusé',     color: '' },
};

const TRANSACTION_LABELS: Record<string, string> = {
  location: 'Location', vente: 'Vente', both: 'Location & Vente',
};
const TX_COLORS: Record<string, string> = {
  location: 'bg-blue-100 text-blue-700',
  vente: 'bg-purple-100 text-purple-700',
  both: 'bg-orange-100 text-orange-700',
};

function formatPrice(p: number) {
  return new Intl.NumberFormat('fr-FR').format(p) + ' FCFA';
}

export default function PropertyViewModal({ propertyId, onClose, onRequestVisit, onShowAuth }: PropertyViewModalProps) {
  const { user, profile } = useAuth();
  useBodyScrollLock(true);
  const [property, setProperty] = useState<Property | null>(null);
  // Peut voir les docs : notaire, propriétaire du bien
  const canSeeDocs = (p: Property | null) => {
    if (!p || !user || !profile) return false;
    if (profile.role === 'notaire') return true;
    if (profile.role === 'admin') return true;
    if (p.owner_id === user.uid) return true;
    return false;
  };
  const [myVisit, setMyVisit] = useState<VisitRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'photos' | '3d' | 'map'>('photos');

  useEffect(() => { loadData(); }, [propertyId, user]);

  const loadData = async () => {
    try {
      const data = await propertyService.getProperty(propertyId);
      setProperty(data);
      if (user) {
        const visits = await visitService.getVisitRequestsByTenant(user.uid);
        const mine = visits.find((v: VisitRequest) => v.property_id === propertyId);
        setMyVisit(mine || null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background:'rgba(0,0,0,0.75)' }}>
      <div className="rounded-2xl p-8" style={{ background:HColors.night, border:'1px solid rgba(212,160,23,0.3)' }}><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor:'#D4A017 rgba(212,160,23,0.2) rgba(212,160,23,0.2) rgba(212,160,23,0.2)' }} /></div>
    </div>
  );
  if (!property) return null;

  const images = property.images?.length ? property.images : ['/placeholder-property.jpg'];
  const amenitiesList = Array.isArray(property.amenities) ? property.amenities : [];
  const p = property as any; // for extra fields

  // ── Contact panel ──────────────────────────────────────────────────────────
  const ContactPanel = () => {
    const visitStatus = myVisit?.status;
    if (visitStatus === 'accepted') return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background:HAlpha.green10, border:'1px solid rgba(45,106,79,0.3)' }}>
          <CheckCircle className="w-4 h-4 shrink-0" style={{ color:HColors.green }} />
          <div>
            <p className="text-sm font-semibold" style={{ color:HColors.green, fontFamily:'var(--font-nunito)' }}>Visite confirmée</p>
            <p className="text-xs" style={{ color:'rgba(45,106,79,0.75)', fontFamily:'var(--font-nunito)' }}>{new Date(myVisit!.preferred_date).toLocaleDateString('fr-FR')} à {myVisit!.preferred_time}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl" style={{ background:'rgba(45,106,79,0.08)', border:'1px solid rgba(45,106,79,0.25)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color:HColors.green, fontFamily:'var(--font-nunito)' }}>Contact débloqué</p>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" style={{ color:HColors.green }} />
            <span className="text-sm font-bold" style={{ color:HColors.green, fontFamily:'var(--font-nunito)' }}>Disponible après caution</span>
          </div>
        </div>
        <div className="p-3 rounded-xl text-xs" style={{ background:HAlpha.terra10, border:'1px solid rgba(192,124,62,0.28)', color:HColors.brownDeep, fontFamily:'var(--font-nunito)' }}>
          <div className="flex items-center gap-1.5 mb-1 font-semibold"><CreditCard className="w-3.5 h-3.5" /> Paiement caution requis</div>
          <p>Règlement via Orange Money, MTN MoMo, Wave ou Flooz</p>
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full font-medium" style={{ background:HAlpha.terra15 }}>🚀 Prochainement</span>
        </div>
      </div>
    );

    if (visitStatus === 'pending') return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background:HAlpha.gold10, border:'1px solid rgba(212,160,23,0.3)' }}>
          <Clock className="w-4 h-4 shrink-0" style={{ color:HColors.gold }} />
          <div>
            <p className="text-sm font-semibold" style={{ color:HColors.brownMid, fontFamily:'var(--font-nunito)' }}>Visite en attente</p>
            <p className="text-xs" style={{ color:'rgba(122,85,0,0.7)', fontFamily:'var(--font-nunito)' }}>{new Date(myVisit!.preferred_date).toLocaleDateString('fr-FR')} à {myVisit!.preferred_time}</p>
          </div>
        </div>
        <div className="p-3 rounded-xl space-y-2" style={{ background:HAlpha.gold05, border:`1px solid ${HAlpha.gold15}` }}>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" style={{ color:'rgba(139,106,48,0.4)' }} /><p className="text-xs" style={{ color:'rgba(139,106,48,0.55)', fontFamily:'var(--font-nunito)' }}>+225 ·· ·· ·· ·· ··</p>
          </div>
          <p className="text-xs flex items-center gap-1" style={{ color:HAlpha.brown50, fontFamily:'var(--font-nunito)' }}><Lock className="w-3 h-3" />Contact révélé après acceptation</p>
        </div>
      </div>
    );

    return (
      <div className="space-y-3">
        <div className="p-3 rounded-xl space-y-2" style={{ background:HAlpha.gold05, border:`1px solid ${HAlpha.gold15}` }}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Propriétaire</p>
          <div className="flex items-center gap-2"><Phone className="w-4 h-4" style={{ color:'rgba(139,106,48,0.25)' }} /><p className="text-sm font-mono tracking-widest" style={{ color:'rgba(139,106,48,0.45)', fontFamily:'var(--font-nunito)' }}>+225 ·· ·· ·· ·· ··</p></div>
          <p className="text-xs flex items-center gap-1" style={{ color:HAlpha.brown50, fontFamily:'var(--font-nunito)' }}><Lock className="w-3 h-3" />Contact révélé après visite acceptée</p>
        </div>
        {user ? (
          <button onClick={onRequestVisit}
            className="w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background:'linear-gradient(135deg,#D4A017,#C07C3E)', color:HColors.night, fontFamily:'var(--font-nunito)' }}>
            <Calendar className="w-4 h-4" /> Demander une visite
          </button>
        ) : (
          <div className="rounded-xl p-4 text-center space-y-3" style={{ background:'rgba(212,160,23,0.07)', border:'1px solid rgba(212,160,23,0.18)' }}>
            <p className="text-sm" style={{ color:HColors.brownMid, fontFamily:'var(--font-nunito)' }}>Connectez-vous pour demander une visite</p>
            <div className="flex gap-2">
              <button onClick={() => onShowAuth?.('signup')}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background:HColors.gold, color:HColors.night, fontFamily:'var(--font-nunito)' }}>
                S'inscrire
              </button>
              <button onClick={() => onShowAuth?.('login')}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80" style={{ border:'1px solid rgba(212,160,23,0.35)', color:HColors.brownMid, fontFamily:'var(--font-nunito)' }}>
                Se connecter
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center z-50 p-3 md:p-6 overflow-y-auto" style={{ background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)' }}>
      <div className="rounded-2xl w-full max-w-5xl my-auto shadow-2xl overflow-hidden" style={{ background:HColors.creamBg }}>

        {/* ── Header compact ── */}
        <div className="sticky top-0 px-5 py-3 flex items-center gap-3 z-10" style={{ background:HColors.night, borderBottom:'1px solid rgba(212,160,23,0.2)' }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background:HAlpha.gold15, color:HColors.gold, fontFamily:'var(--font-nunito)' }}>{TYPE_LABELS[property.property_type]}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background:HAlpha.terra20, color:HColors.terracotta, fontFamily:'var(--font-nunito)' }}>{TRANSACTION_LABELS[property.transaction_type]}</span>
              {property.verified_notaire
                ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background:HAlpha.green25, color:HColors.green, fontFamily:'var(--font-nunito)' }}><ShieldCheck className="w-3 h-3" />Vérifié</span>
                : <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background:HAlpha.gold15, color:HColors.brownMid, fontFamily:'var(--font-nunito)' }}><AlertTriangle className="w-3 h-3" />Non vérifié</span>
              }
            </div>
            <h2 className="text-base font-bold truncate mt-1" style={{ color:HColors.cream, fontFamily:'var(--font-cormorant)', fontSize:'1.1rem' }}>{property.title}</h2>
          </div>
          <button aria-label="Fermer" onClick={onClose} className="p-1.5 rounded-full transition-all hover:opacity-70 shrink-0" style={{ background:HAlpha.gold10, border:'1px solid rgba(212,160,23,0.2)' }}>
            <X className="w-4 h-4" style={{ color:HColors.gold }} />
          </button>
        </div>

        <div className="p-4 md:p-6">

          {/* ── Onglets Médias ── */}
          <div className="flex gap-1.5 mb-3">
            {[
              { key: 'photos', label: `📷 Photos${images.length > 1 ? ` (${images.length})` : ''}` },
              { key: '3d',     label: '⬡ Vue 3D' },
              { key: 'map',    label: '🗺 Carte' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={activeTab === tab.key
                  ? { background: tab.key === '3d' ? HColors.brownDeep : HColors.navyDark, color:HColors.cream, fontFamily:'var(--font-nunito)' }
                  : { background:HAlpha.gold08, color:HColors.brown, border:`1px solid ${HAlpha.gold15}`, fontFamily:'var(--font-nunito)' }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Galerie photos ── */}
          {activeTab === 'photos' && (
            <div className="relative h-64 md:h-80 bg-gray-200 rounded-2xl overflow-hidden mb-5">
              <OptimizedImage src={images[imgIndex]} alt={property.title} className="w-full h-full rounded-2xl" priority />
              {images.length > 1 && (
                <>
                  <button aria-label="Photo précédente" onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow">
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button aria-label="Photo suivante" onClick={() => setImgIndex(i => (i + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow">
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white rounded-full text-xs">{imgIndex + 1}/{images.length}</div>
                </>
              )}
              {/* Miniatures */}
              {images.length > 1 && (
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {images.slice(0, 5).map((img, i) => (
                    <button key={i} onClick={() => setImgIndex(i)}
                      className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${imgIndex === i ? 'border-white' : 'border-transparent opacity-70'}`}>
                      <img src={img} alt={`Photo ${i + 1} — ${property.title}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {images.length > 5 && <div className="w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center text-white text-xs font-bold">+{images.length - 5}</div>}
                </div>
              )}
            </div>
          )}

          {/* ── Vue 3D ── */}
          {activeTab === '3d' && <div className="mb-5"><Property3DViewer property={property} height={380} /></div>}

          {/* ── Carte ── */}
          {activeTab === 'map' && property.latitude && property.longitude && (
            <div className="mb-5">
              <p className="text-xs mb-2 flex items-center gap-1" style={{ color:HAlpha.brown50, fontFamily:'var(--font-nunito)' }}><Lock className="w-3 h-3" />Position approximative — adresse exacte après visite acceptée</p>
              <MapDisplay mode="single" latitude={property.latitude + 0.003} longitude={property.longitude + 0.003}
                title={`${TYPE_LABELS[property.property_type]} — ${property.city}`} />
            </div>
          )}
          {activeTab === 'map' && (!property.latitude || !property.longitude) && (
            <div className="mb-5 h-48 rounded-2xl flex items-center justify-center text-sm" style={{ background:'rgba(212,160,23,0.06)', border:`1px solid ${HAlpha.gold15}`, color:HAlpha.brown50, fontFamily:'var(--font-nunito)' }}>Localisation non renseignée</div>
          )}

          {/* ── Grille principale ── */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ── Colonne principale ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Prix + localisation */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold" style={{ color:HColors.terracotta, fontFamily:'var(--font-cormorant)' }}>{formatPrice(property.price)}</span>
                    {property.transaction_type !== 'vente' && <span className="text-sm" style={{ color:HAlpha.brown60, fontFamily:'var(--font-nunito)' }}>/mois</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm mt-1" style={{ color:HColors.terracotta, fontFamily:'var(--font-nunito)' }}>
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {[property.quartier, property.commune, property.city, (p.departement || ''), (p.region || '')].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="sm:text-right shrink-0">
                  <div className="flex items-center gap-1 text-xs sm:justify-end" style={{ color:'rgba(139,106,48,0.55)', fontFamily:'var(--font-nunito)' }}><Eye className="w-3.5 h-3.5" />{property.views_count || 0} vue{(property.views_count||0)>1?'s':''}</div>
                  {property.available_from && (
                    <div className="flex items-center gap-1 text-xs mt-1 sm:justify-end" style={{ color:'rgba(139,106,48,0.65)', fontFamily:'var(--font-nunito)' }}>
                      <Calendar className="w-3.5 h-3.5" />Dispo {new Date(property.available_from).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Caractéristiques par type ── */}
              {property.property_type !== 'terrain' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {property.surface_area && <InfoChip icon={<Maximize className="w-4 h-4"/>} label="Surface" value={`${property.surface_area} m²`} />}
                  {property.land_area && <InfoChip icon={<Layers className="w-4 h-4"/>} label="Terrain" value={`${property.land_area} m²`} />}
                  {property.bedrooms > 0 && <InfoChip icon={<Bed className="w-4 h-4"/>} label="Chambres" value={String(property.bedrooms)} />}
                  {property.bathrooms > 0 && <InfoChip icon={<Bath className="w-4 h-4"/>} label="Salles de bain" value={String(property.bathrooms)} />}
                  {p.nb_etages > 1 && <InfoChip icon={<Building2 className="w-4 h-4"/>} label="Étages" value={String(p.nb_etages)} />}
                  {p.etage_appartement != null && p.etage_appartement !== '' && (
                    <InfoChip icon={<ArrowUpDown className="w-4 h-4"/>} label="Étage" value={Number(p.etage_appartement) <= 1 ? '1er étage' : `${p.etage_appartement}ème étage`} />
                  )}
                  {property.rooms_count && (
                    <InfoChip icon={<Hotel className="w-4 h-4"/>}
                      label={property.property_type === 'appart_hotel' ? 'Unités' : 'Chambres'}
                      value={String(property.rooms_count)} />
                  )}
                  {property.hotel_stars > 0 && (
                    <InfoChip icon={<Star className="w-4 h-4 text-amber-500"/>} label="Classement" value={'★'.repeat(property.hotel_stars)} />
                  )}
                  {p.surface_par_unite && <InfoChip icon={<Home className="w-4 h-4"/>} label="Surface/unité" value={`${p.surface_par_unite} m²`} />}
                  {p.chambres_par_unite && <InfoChip icon={<Bed className="w-4 h-4"/>} label="Ch./unité" value={String(p.chambres_par_unite)} />}
                  {p.nb_etages_immeuble && <InfoChip icon={<Building2 className="w-4 h-4"/>} label="Ét. immeuble" value={String(p.nb_etages_immeuble)} />}
                  {p.annee_construction && <InfoChip icon={<Calendar className="w-4 h-4"/>} label="Construit" value={String(p.annee_construction)} />}
                </div>
              )}

              {/* Terrain */}
              {property.property_type === 'terrain' && (
                <div className="grid grid-cols-2 gap-2">
                  {property.land_area && <InfoChip icon={<Layers className="w-4 h-4"/>} label="Superficie" value={`${property.land_area} m²`} />}
                  {property.surface_area && <InfoChip icon={<Maximize className="w-4 h-4"/>} label="Constructible" value={`${property.surface_area} m²`} />}
                </div>
              )}

              {/* Badges commodités */}
              <div className="flex flex-wrap gap-2">
                {property.furnished && <Badge color="emerald" label={property.property_type === 'appart_hotel' ? 'Unités meublées' : 'Meublé'} />}
                {property.parking && <Badge color="blue" label="Parking" icon={<Car className="w-3.5 h-3.5"/>} />}
                {p.ascenseur && <Badge color="gray" label="Ascenseur" icon={<ArrowUpDown className="w-3.5 h-3.5"/>} />}
                {p.interphone && <Badge color="gray" label="Interphone" />}
                {p.cuisine_par_unite && <Badge color="orange" label="Cuisine/unité" />}
              </div>

              {/* Équipements */}
              {amenitiesList.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-2" style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)', fontSize:'1rem' }}>Équipements</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {amenitiesList.map((a: string, i: number) => (
                      <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs" style={{ background:HAlpha.green10, color:HColors.green, fontFamily:'var(--font-nunito)', border:'1px solid rgba(45,106,79,0.2)' }}>
                        <CheckCircle className="w-3 h-3" />{a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Documents officiels ── */}
              {property.documents && property.documents.length > 0 && (
                canSeeDocs(property) ? (
                  <div>
                    <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)', fontSize:'1rem' }}>
                      <FileText className="w-4 h-4" style={{ color:HColors.terracotta }} />
                      Documents officiels
                    </h3>
                    <div className="space-y-2">
                      {property.documents.map((doc, i) => {
                        const st = DOC_STATUS[doc.status] ?? DOC_STATUS['en_attente'];
                        const isValidated = doc.status === 'valide';
                        return (
                          <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                            style={doc.status === 'valide' ? { background:'rgba(45,106,79,0.08)', border:'1px solid rgba(45,106,79,0.3)' } : doc.status === 'refuse' ? { background:'rgba(139,29,29,0.08)', border:'1px solid rgba(139,29,29,0.25)' } : { background:HAlpha.gold08, border:'1px solid rgba(212,160,23,0.25)' }}>
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 shrink-0 opacity-70" style={{ color:HColors.terracotta }} />
                              <span className="text-sm font-medium truncate" style={{ color:HColors.darkBrown, fontFamily:'var(--font-nunito)' }}>{doc.label || doc.type}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background:'rgba(255,255,255,0.6)', border:'1px solid currentColor', fontFamily:'var(--font-nunito)' }}>
                                {st.label}
                              </span>
                              {isValidated && doc.url && (
                                <a href={fixDocUrl(doc.url)} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color:HColors.green, fontFamily:'var(--font-nunito)' }}>
                                  <ExternalLink className="w-3.5 h-3.5" /> Voir
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!property.verified_notaire && (
                      <p className="text-xs mt-2 flex items-center gap-1" style={{ color:HAlpha.brown50, fontFamily:'var(--font-nunito)' }}>
                        <Lock className="w-3 h-3" />Les documents sont accessibles après validation notaire
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background:HAlpha.gold08, border:`1px solid ${HAlpha.gold20}` }}>
                    <Lock className="w-4 h-4 shrink-0" style={{ color:HColors.brownMid }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color:HColors.darkBrown, fontFamily:'var(--font-nunito)' }}>
                        Documents confidentiels
                      </p>
                      <p className="text-xs" style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
                        Les documents officiels sont réservés au propriétaire et au notaire en charge du dossier.
                      </p>
                    </div>
                  </div>
                )
              )}

              {/* Vérification notaire */}
              <div className="flex items-center gap-3 p-3 rounded-xl text-sm"
              style={property.verified_notaire
                ? { background:HAlpha.green10, border:'1px solid rgba(45,106,79,0.3)', color:HColors.green }
                : { background:HAlpha.gold10, border:'1px solid rgba(212,160,23,0.3)', color:HColors.brownMid }}>
                {property.verified_notaire
                  ? <><ShieldCheck className="w-5 h-5 shrink-0"/><div><p className="font-semibold">Bien vérifié par notaire</p><p className="text-xs opacity-80">Documents officiels validés par HOMECI</p></div></>
                  : <><AlertTriangle className="w-5 h-5 shrink-0"/><div><p className="font-semibold">Vérification en cours</p><p className="text-xs opacity-80">Documents en attente de validation notaire</p></div></>
                }
              </div>
            </div>

            {/* ── Colonne contact ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="rounded-2xl p-4" style={{ background:HColors.white, border:'1px solid rgba(212,160,23,0.2)' }}>
                  <h3 className="text-sm font-bold mb-3" style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)', fontSize:'1rem' }}>Contact & Visite</h3>
                  <ContactPanel />
                </div>

                {/* Récap rapide */}
                <div className="mt-3 rounded-2xl p-4 space-y-2" style={{ background:HColors.white, border:`1px solid ${HAlpha.gold15}` }}>
                  <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color:'rgba(122,85,0,0.7)', fontFamily:'var(--font-nunito)' }}>Récapitulatif</h3>
                  <RecapRow label="Type" value={TYPE_LABELS[property.property_type]} />
                  <RecapRow label="Transaction" value={TRANSACTION_LABELS[property.transaction_type]} />
                  {property.city && <RecapRow label="Ville" value={[property.quartier, property.commune, property.city].filter(Boolean).join(', ')} />}
                  {p.district && <RecapRow label="District" value={p.district} />}
                  {property.surface_area && <RecapRow label="Surface" value={`${property.surface_area} m²`} />}
                  {property.land_area && <RecapRow label="Terrain" value={`${property.land_area} m²`} />}
                  {property.bedrooms > 0 && <RecapRow label="Chambres" value={String(property.bedrooms)} />}
                  {property.bathrooms > 0 && <RecapRow label="SDB" value={String(property.bathrooms)} />}
                  {property.rooms_count && <RecapRow label={property.property_type === 'appart_hotel' ? 'Unités' : 'Chambres hôtel'} value={String(property.rooms_count)} />}
                  {p.nb_etages && <RecapRow label="Étages" value={String(p.nb_etages)} />}
                  {p.etage_appartement != null && p.etage_appartement !== '' && <RecapRow label="Étage appart." value={Number(p.etage_appartement) <= 1 ? '1er étage' : `${p.etage_appartement}ème étage`} />}
                  {p.annee_construction && <RecapRow label="Construit en" value={String(p.annee_construction)} />}
                  {property.documents?.length > 0 && <RecapRow label="Documents" value={`${property.documents.length} fourni${property.documents.length > 1 ? 's' : ''}`} />}
                  <RecapRow label="Prix" value={formatPrice(property.price)} bold />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background:'rgba(255,255,255,0.7)', border:`1px solid ${HAlpha.gold15}` }}>
      <span className="shrink-0" style={{ color:HColors.terracotta }}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs leading-none" style={{ color:HAlpha.brown60, fontFamily:'var(--font-nunito)' }}>{label}</p>
        <p className="text-sm font-semibold truncate" style={{ color:HColors.darkBrown, fontFamily:'var(--font-nunito)' }}>{value}</p>
      </div>
    </div>
  );
}

function Badge({ label, color = 'gray', icon }: { label: string; color?: string; icon?: React.ReactNode }) {
  const c: Record<string,string> = {
    gray: 'bg-gray-100 text-gray-600',
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c[color]}`}>
      {icon}{label}
    </span>
  );
}

function RecapRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="shrink-0" style={{ color:HAlpha.brown60, fontFamily:'var(--font-nunito)' }}>{label}</span>
      <span className={bold ? 'text-right font-bold truncate text-sm' : 'text-right font-medium truncate'}>{value}</span>
    </div>
  );
}
