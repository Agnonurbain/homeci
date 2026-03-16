import { MapPin, Bed, Bath, Maximize, Heart, ShieldCheck, Star, AlertTriangle, Film } from 'lucide-react';
import type { Property } from '../services/propertyService';
import OptimizedImage from './OptimizedImage';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha, HGradients } from '../styles/homeci-tokens';

const PLACEHOLDER = 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800';

interface PropertyCardProps {
  property: Property;
  onFavorite?: () => void;
  isFavorite?: boolean;
  onViewDetails?: () => void;
  onContactClick?: () => void;
}

export function PropertyCard({ property, onFavorite, isFavorite, onViewDetails, onContactClick }: PropertyCardProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);

  const TYPE_LABELS: Record<string, string> = {
    appartement: 'Appartement', maison: 'Maison', villa: 'Villa',
    terrain: 'Terrain', hotel: 'Hôtel', appart_hotel: 'Appart-Hôtel',
  };

  const imageSrc = property.images?.length ? property.images[0] : PLACEHOLDER;
  const isTerrain = property.property_type === 'terrain';
  const isHotel   = property.property_type === 'hotel' || property.property_type === 'appart_hotel';

  return (
    <div className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{ background: HColors.white, border: '1px solid rgba(245,230,200,0.5)',
               boxShadow: '0 2px 12px rgba(10,61,31,0.08)' }}>

      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden" style={{ background: HColors.darkBrown }}>
        <OptimizedImage
          src={imageSrc} alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER;
          }}
        />
        {/* Gradient overlay for price */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }} />

        {/* Type badge — top left */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider backdrop-blur-sm"
            style={{ background: HAlpha.orange15, color: HColors.orangeCI, fontFamily: 'var(--font-nunito)' }}>
            {TYPE_LABELS[property.property_type] || property.property_type}
          </span>
          {property.videos?.length > 0 && (
            <span className="px-2.5 py-1 text-[10px] font-bold rounded-md flex items-center gap-1 backdrop-blur-sm"
              style={{ background: 'rgba(0,158,73,0.85)', color: HColors.white, fontFamily: 'var(--font-nunito)' }}>
              <Film className="w-3 h-3" /> Vidéo
            </span>
          )}
        </div>

        {/* Verified badge — top right */}
        {property.verified_notaire && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg"
            style={{ background: HGradients.verified }}>
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-white"
              style={{ fontFamily: 'var(--font-nunito)' }}>Vérifié Notaire</span>
          </div>
        )}

        {/* Favorite button */}
        {onFavorite && (
          <button onClick={onFavorite}
            className="absolute bottom-14 right-3 p-2 rounded-full transition-all hover:scale-110"
            style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}>
            <Heart className={`w-4.5 h-4.5 ${isFavorite ? 'fill-[#FF6B00] text-[#FF6B00]' : 'text-white'}`} />
          </button>
        )}

        {/* Price overlay — bottom left */}
        <div className="absolute bottom-3 left-4">
          <span className="text-2xl font-bold text-white tabular-nums drop-shadow-lg"
            style={{ fontFamily: 'var(--font-cormorant)' }}>
            {formatPrice(property.price)}
          </span>
          <span className="block text-xs text-white/60" style={{ fontFamily: 'var(--font-nunito)' }}>
            {property.transaction_type === 'location' ? '/ mois' : 'Prix de vente'}
          </span>
        </div>

        {/* Transaction badge — bottom right */}
        <span className="absolute bottom-3 right-3 px-2.5 py-1 text-[10px] font-bold rounded-full"
          style={{ background: property.transaction_type === 'location' ? HColors.vertCI : HColors.orangeCI,
                   color: HColors.white, fontFamily: 'var(--font-nunito)' }}>
          {property.transaction_type === 'location' ? 'À louer' : property.transaction_type === 'vente' ? 'À vendre' : 'Location/Vente'}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold leading-tight mb-1 truncate"
          style={{ color: HColors.bois, fontFamily: 'var(--font-cormorant)' }}>
          {property.title}
        </h3>

        <div className="flex items-center gap-1 mb-4">
          <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: HColors.orangeCI }} />
          <span className="text-xs truncate" style={{ color: 'rgba(92,61,30,0.6)', fontFamily: 'var(--font-nunito)' }}>
            {property.quartier}, {property.city}
          </span>
        </div>

        {/* Specs */}
        <div className="flex items-center justify-between py-3"
          style={{ borderTop: '1px solid rgba(245,230,200,0.6)' }}>
          <div className="flex items-center gap-4" style={{ fontFamily: 'var(--font-nunito)', fontSize: '0.8rem' }}>
            {isTerrain && (
              <>
                {(property.land_area || property.surface_area) && (
                  <span className="flex items-center gap-1.5" style={{ color: 'rgba(92,61,30,0.8)' }}>
                    <Maximize className="w-4 h-4" style={{ color: HColors.vertCI }} />
                    <span className="font-bold">{(property.land_area || property.surface_area)!.toLocaleString()} m²</span>
                  </span>
                )}
              </>
            )}
            {isHotel && (
              <>
                {property.hotel_stars && property.hotel_stars > 0 && (
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: property.hotel_stars }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </span>
                )}
                {property.rooms_count && property.rooms_count > 0 && (
                  <span className="flex items-center gap-1.5" style={{ color: 'rgba(92,61,30,0.8)' }}>
                    <Bed className="w-4 h-4" style={{ color: HColors.vertCI }} />
                    <span className="font-bold">{property.rooms_count}</span>
                  </span>
                )}
              </>
            )}
            {!isTerrain && !isHotel && (
              <>
                {property.bedrooms > 0 && (
                  <span className="flex items-center gap-1.5" style={{ color: 'rgba(92,61,30,0.8)' }}>
                    <Bed className="w-4 h-4" style={{ color: HColors.vertCI }} />
                    <span className="font-bold">{property.bedrooms}</span>
                  </span>
                )}
                {property.bathrooms > 0 && (
                  <span className="flex items-center gap-1.5" style={{ color: 'rgba(92,61,30,0.8)' }}>
                    <Bath className="w-4 h-4" style={{ color: HColors.vertCI }} />
                    <span className="font-bold">{property.bathrooms}</span>
                  </span>
                )}
                {property.surface_area && (
                  <span className="flex items-center gap-1.5" style={{ color: 'rgba(92,61,30,0.8)' }}>
                    <Maximize className="w-4 h-4" style={{ color: HColors.vertCI }} />
                    <span className="font-bold">{property.surface_area} m²</span>
                  </span>
                )}
              </>
            )}
          </div>

          {/* CTA */}
          <button onClick={onViewDetails || onContactClick}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95 shrink-0"
            style={property.verified_notaire
              ? { background: HGradients.cta, color: HColors.white, fontFamily: 'var(--font-nunito)' }
              : { background: HAlpha.orange08, color: HColors.orangeCI, fontFamily: 'var(--font-nunito)',
                  border: `1px solid ${HAlpha.orange20}` }}>
            {!property.verified_notaire && <AlertTriangle className="w-3 h-3 inline mr-1" />}
            Voir détails
          </button>
        </div>
      </div>

      {/* Bande Kente signature */}
      <KenteLine height={3} />
    </div>
  );
}
