import { useState, Suspense, lazy } from 'react';
import { List, Map, Search } from 'lucide-react';
import { PropertyCard } from '../PropertyCard';
import { PropertyFilters, type FilterValues } from '../PropertyFilters';
import { PropertyGridSkeleton } from '../Skeletons';
import type { Property } from '../../services/propertyService';
import { HColors, HAlpha } from '../../styles/homeci-tokens';

const MapDisplay = lazy(() => import('../MapDisplay'));

interface SearchTabProps {
  loading: boolean;
  properties: Property[];
  onFilterChange: (filters: FilterValues) => void;
  onFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  onViewProperty: (id: string) => void;
}

const PER_PAGE = 9;

export default function SearchTab({
  loading,
  properties,
  onFilterChange,
  onFavorite,
  isFavorite,
  onViewProperty
}: SearchTabProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(properties.length / PER_PAGE);
  const paginated = properties.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
          {loading ? 'Chargement…' : (
            <><span className="font-bold" style={{ color: HColors.darkBrown }}>{properties.length}</span> bien(s) disponible(s)</>
          )}
        </p>
        <div className="flex gap-2">
          {(['list', 'map'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              aria-label={m === 'list' ? 'Vue liste' : 'Vue carte'}
              aria-pressed={viewMode === m}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={viewMode === m
                ? { background: HColors.navyDark, color: HColors.cream, fontFamily: 'var(--font-nunito)' }
                : { background: 'rgba(255,255,255,0.7)', color: HColors.brown, border: '1px solid rgba(212,160,23,0.2)', fontFamily: 'var(--font-nunito)' }}>
              {m === 'list' ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
              {m === 'list' ? 'Liste' : 'Carte'}
            </button>
          ))}
        </div>
      </div>

      <PropertyFilters onFilterChange={onFilterChange} />

      {loading ? (
        <PropertyGridSkeleton count={6} />
      ) : viewMode === 'map' ? (
        <Suspense fallback={<PropertyGridSkeleton count={6} />}>
          <MapDisplay mode="multi" properties={properties} />
        </Suspense>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl p-20 text-center"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <Search className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold25 }} />
          <p className="text-lg font-semibold mb-1"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucun bien trouvé</p>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Essayez d'élargir vos critères de recherche
          </p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.map(property => (
              <PropertyCard key={property.id} property={property}
                onFavorite={() => onFavorite(property.id)}
                isFavorite={isFavorite(property.id)}
                onContactClick={() => onViewProperty(property.id)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-10 h-10 rounded-xl font-bold transition-all ${page === i + 1 ? 'bg-navy text-white scale-110 shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                  style={page === i + 1 ? { background: HColors.navy, color: HColors.cream } : {}}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
