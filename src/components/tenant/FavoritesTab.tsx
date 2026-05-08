import { Heart } from 'lucide-react';
import { PropertyCard } from '../PropertyCard';
import type { Property } from '../../services/propertyService';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { useNavigate } from 'react-router-dom';

interface FavoritesTabProps {
  favoriteProperties: Property[];
  onFavorite: (id: string) => void;
  onViewProperty: (id: string) => void;
}

export default function FavoritesTab({
  favoriteProperties,
  onFavorite,
  onViewProperty
}: FavoritesTabProps) {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold mb-0.5"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem' }}>Mes Favoris</h2>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            {favoriteProperties.length} bien(s) sauvegardé(s)
          </p>
        </div>
      </div>
      {favoriteProperties.length === 0 ? (
        <div className="rounded-2xl p-16 text-center"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <Heart className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.terra20 }} />
          <h3 className="text-lg font-semibold mb-1"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucun favori</h3>
          <p className="text-sm mb-6" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Cliquez sur le ❤ d'un bien pour le sauvegarder
          </p>
          <button onClick={() => navigate('/dashboard/search')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF' }}>
            Découvrir les biens
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {favoriteProperties.map(property => (
            <PropertyCard key={property.id} property={property}
              onFavorite={() => onFavorite(property.id)} isFavorite={true}
              onContactClick={() => onViewProperty(property.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
