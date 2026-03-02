import { useState, useEffect } from 'react';
import { Lock, SlidersHorizontal } from 'lucide-react';
import { propertyService } from '../services/propertyService';
import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';
import type { Property } from '../services/propertyService';
import type { FilterValues } from './PropertyFilters';
import PropertyViewModal from './PropertyViewModal';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface PublicPropertyListProps {
  onShowAuth?: (mode: 'login' | 'signup') => void;
  initialFilters?: { propertyType?: string; transactionType?: string; district?: string; region?: string; departement?: string; city?: string; commune?: string; quartier?: string; };
}

const PER_PAGE = 9;

export default function PublicPropertyList({ onShowAuth, initialFilters }: PublicPropertyListProps) {
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filtered, setFiltered] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [viewingPropertyId, setViewingPropertyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    propertyService.getProperties({ status: 'published' }).then(data => {
      setAllProperties(data);
      let result = data;
      if (initialFilters?.propertyType) result = result.filter(p => p.property_type === initialFilters.propertyType);
      if (initialFilters?.city) result = result.filter(p => p.city === initialFilters.city);
      if (initialFilters?.transactionType) result = result.filter(p => p.transaction_type === initialFilters.transactionType || p.transaction_type === 'both');
      setFiltered(result);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (allProperties.length === 0) return;
    let result = [...allProperties];
    if (initialFilters?.propertyType) result = result.filter(p => p.property_type === initialFilters.propertyType);
    if (initialFilters?.transactionType) result = result.filter(p => p.transaction_type === initialFilters.transactionType || p.transaction_type === 'both');
    if (initialFilters?.district) result = result.filter(p => (p as any).district === initialFilters.district);
    if (initialFilters?.region) result = result.filter(p => (p as any).region === initialFilters.region);
    if (initialFilters?.departement) result = result.filter(p => (p as any).departement === initialFilters.departement);
    if (initialFilters?.city) result = result.filter(p => p.city === initialFilters.city);
    if (initialFilters?.commune) result = result.filter(p => p.commune === initialFilters.commune);
    if (initialFilters?.quartier) result = result.filter(p => p.quartier?.toLowerCase().includes((initialFilters.quartier || '').toLowerCase()));
    setFiltered(result);
    setPage(1);
  }, [initialFilters?.propertyType, initialFilters?.transactionType, initialFilters?.district, initialFilters?.region, initialFilters?.departement, initialFilters?.city, initialFilters?.commune, initialFilters?.quartier]);

  const handleFilterChange = (filters: FilterValues) => {
    let result = [...allProperties];
    if (filters.propertyType) result = result.filter(p => p.property_type === filters.propertyType);
    if (filters.transactionType) result = result.filter(p => p.transaction_type === filters.transactionType || p.transaction_type === 'both');
    if (filters.district) result = result.filter(p => (p as any).district === filters.district);
    if (filters.region) result = result.filter(p => (p as any).region === filters.region);
    if (filters.departement) result = result.filter(p => (p as any).departement === filters.departement);
    if (filters.city) result = result.filter(p => p.city === filters.city);
    if (filters.commune) result = result.filter(p => p.commune === filters.commune);
    if (filters.quartier) result = result.filter(p => p.quartier?.toLowerCase().includes(filters.quartier.toLowerCase()));
    if (filters.minPrice) result = result.filter(p => p.price >= Number(filters.minPrice));
    if (filters.maxPrice) result = result.filter(p => p.price <= Number(filters.maxPrice));
    if (filters.bedrooms) result = result.filter(p => p.bedrooms >= Number(filters.bedrooms));
    if (filters.furnished) result = result.filter(p => p.furnished);
    if (filters.parking) result = result.filter(p => p.parking);
    if (filters.verifiedOnly) result = result.filter(p => p.verified_notaire);
    setFiltered(result);
    setPage(1);
  };

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <section id="property-list" style={{ background: HColors.creamBg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* ── Header section ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-bold mb-1"
              style={{ fontFamily:'var(--font-cormorant)', fontSize:'clamp(1.8rem,3vw,2.5rem)',
                       color:HColors.darkBrown, fontWeight:700 }}>
              Biens disponibles
            </h2>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-8 rounded-full" style={{ background:'linear-gradient(90deg,#D4A017,#C07C3E)' }}/>
              <p className="text-sm" style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
                {loading ? 'Chargement...' : `${filtered.length} bien${filtered.length > 1 ? 's' : ''} trouvé${filtered.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium"
            style={{ color:HColors.terracotta, fontFamily:'var(--font-nunito)' }}>
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtres avancés ci-dessous</span>
          </div>
        </div>

        <PropertyFilters onFilterChange={handleFilterChange} />

        {/* ── Content ── */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor:HColors.gold }} />
            <p className="mt-4 text-sm" style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
              Chargement des biens...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl"
            style={{ background:'rgba(212,160,23,0.06)', border:'1px solid rgba(212,160,23,0.15)' }}>
            <p className="text-3xl mb-3">🏠</p>
            <p className="text-lg font-semibold mb-1"
              style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)' }}>Aucun bien trouvé</p>
            <p className="text-sm" style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
              Modifiez vos critères de recherche
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={() => setViewingPropertyId(property.id)}
                  onContactClick={() => setShowLoginPrompt(true)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button disabled={page === 1}
                  onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                  style={{ background:HAlpha.gold10, color:HColors.brownMid,
                           border:'1px solid rgba(212,160,23,0.2)', fontFamily:'var(--font-nunito)' }}>
                  ← Précédent
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className="w-9 h-9 rounded-xl text-sm font-medium transition-all"
                        style={page === p
                          ? { background:HColors.navyDark, color:HColors.cream, fontFamily:'var(--font-nunito)' }
                          : { background:HAlpha.gold08, color:HColors.brownMid,
                              border:'1px solid rgba(212,160,23,0.15)', fontFamily:'var(--font-nunito)' }}>
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button disabled={page === totalPages}
                  onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                  style={{ background:HColors.navyDark, color:HColors.cream, fontFamily:'var(--font-nunito)' }}>
                  Suivant →
                </button>
              </div>
            )}
            <p className="text-center text-xs mt-3" style={{ color:'rgba(139,106,48,0.6)', fontFamily:'var(--font-nunito)' }}>
              Page {page} sur {totalPages}
            </p>
          </>
        )}

        {/* ── CTA bannière africaine ── */}
        <div className="mt-14 relative overflow-hidden rounded-2xl p-10 text-center"
          style={{ background:'linear-gradient(135deg, #0D1F12 0%, #1A0E00 100%)',
                   border:'1px solid rgba(212,160,23,0.25)' }}>
          {/* Kente stripe top */}
          <div className="absolute top-0 left-0 right-0 flex" style={{ height:5 }}>
            {[HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',
              HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',
              HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',HColors.gold,HColors.green].map((c,i) => (
              <div key={i} style={{ flex:1, backgroundColor:c }}/>
            ))}
          </div>
          {/* Adinkra déco subtile */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity:0.04 }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cta-adinkra" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                  <circle cx="40" cy="40" r="28" fill="none" stroke="#D4A017" strokeWidth="1"/>
                  <circle cx="40" cy="40" r="14" fill="none" stroke="#D4A017" strokeWidth="0.8"/>
                  <line x1="40" y1="12" x2="40" y2="68" stroke="#D4A017" strokeWidth="0.7"/>
                  <line x1="12" y1="40" x2="68" y2="40" stroke="#D4A017" strokeWidth="0.7"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-adinkra)"/>
            </svg>
          </div>

          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5 text-xs font-semibold tracking-widest"
              style={{ background:HAlpha.gold12, border:'1px solid rgba(212,160,23,0.3)',
                       color:HColors.gold, fontFamily:'var(--font-nunito)' }}>
              ◆ REJOIGNEZ HOMECI ◆
            </div>
            <h3 className="font-bold mb-3"
              style={{ fontFamily:'var(--font-cormorant)', fontSize:'clamp(1.6rem,3vw,2.2rem)',
                       color:HColors.cream }}>
              Connectez-vous pour aller plus loin
            </h3>
            <p className="mb-8 max-w-xl mx-auto text-sm leading-relaxed"
              style={{ color:HAlpha.cream60, fontFamily:'var(--font-nunito)' }}>
              Contactez les propriétaires, sauvegardez vos favoris et effectuez des réservations sécurisées.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => onShowAuth?.('signup')}
                className="px-7 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background:HColors.gold, color:HColors.night, fontFamily:'var(--font-nunito)' }}>
                Créer un compte gratuit
              </button>
              <button onClick={() => onShowAuth?.('login')}
                className="px-7 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
                style={{ border:'1px solid rgba(212,160,23,0.4)', color:HColors.gold,
                         fontFamily:'var(--font-nunito)' }}>
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal login prompt */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
            style={{ background:HColors.night, border:'1px solid rgba(212,160,23,0.3)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background:HAlpha.gold15 }}>
              <Lock className="w-8 h-8" style={{ color:HColors.gold }} />
            </div>
            <h3 className="text-xl font-bold mb-2"
              style={{ color:HColors.cream, fontFamily:'var(--font-cormorant)' }}>
              Connectez-vous pour continuer
            </h3>
            <p className="text-sm mb-6"
              style={{ color:'rgba(245,230,200,0.65)', fontFamily:'var(--font-nunito)' }}>
              Créez un compte gratuit pour contacter les propriétaires et effectuer des réservations sécurisées.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowLoginPrompt(false); onShowAuth?.('signup'); }}
                className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all hover:opacity-90"
                style={{ background:HColors.gold, color:HColors.night, fontFamily:'var(--font-nunito)' }}>
                S'inscrire
              </button>
              <button onClick={() => { setShowLoginPrompt(false); onShowAuth?.('login'); }}
                className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
                style={{ border:'1px solid rgba(212,160,23,0.4)', color:HColors.gold, fontFamily:'var(--font-nunito)' }}>
                Connexion
              </button>
            </div>
            <button onClick={() => setShowLoginPrompt(false)}
              className="mt-4 text-sm transition-colors"
              style={{ color:'rgba(245,230,200,0.35)', fontFamily:'var(--font-nunito)' }}>
              Continuer en navigation libre
            </button>
          </div>
        </div>
      )}

      {/* Modal détails bien */}
      {viewingPropertyId && (
        <PropertyViewModal
          propertyId={viewingPropertyId}
          onClose={() => setViewingPropertyId(null)}
          onShowAuth={(mode) => { setViewingPropertyId(null); onShowAuth?.(mode); }}
        />
      )}
    </section>
  );
}
