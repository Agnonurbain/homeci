import { MapPin, Bed, Bath, Maximize, Heart, CheckCircle, Star, AlertTriangle } from 'lucide-react';
import type { Property } from '../services/propertyService';
import OptimizedImage from './OptimizedImage';
import { HColors, HAlpha } from '../styles/homeci-tokens';

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
      style={{ background:HColors.white, border:'1px solid rgba(212,160,23,0.12)',
               boxShadow:'0 2px 16px rgba(26,14,0,0.07)' }}>

      {/* Image */}
      <div className="relative h-52 overflow-hidden" style={{ background:HColors.darkBrown }}>
        <OptimizedImage
          src={imageSrc} alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER;
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background:'linear-gradient(to top, rgba(10,22,14,0.4) 0%, transparent 60%)' }}/>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full"
            style={{ background: property.transaction_type === 'location' ? HColors.green : HColors.bordeaux,
                     color:HColors.cream, fontFamily:'var(--font-nunito)' }}>
            {property.transaction_type === 'location' ? 'À louer' : property.transaction_type === 'vente' ? 'À vendre' : 'Location/Vente'}
          </span>
          {property.verified_notaire && (
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1"
              style={{ background:'rgba(212,160,23,0.9)', color:HColors.night, fontFamily:'var(--font-nunito)' }}>
              <CheckCircle className="w-3 h-3" /> Vérifié
            </span>
          )}
        </div>

        {/* Favorite */}
        <button onClick={onFavorite}
          className="absolute top-3 right-3 p-1.5 rounded-full transition-all hover:scale-110"
          style={{ background:'rgba(255,255,255,0.92)' }}>
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1.5 gap-2">
          <h3 className="text-base font-semibold line-clamp-1 flex-1"
            style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)', fontSize:'1.1rem' }}>
            {property.title}
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
            style={{ background:HAlpha.gold10, color:HColors.brownMid, fontFamily:'var(--font-nunito)',
                     border:'1px solid rgba(212,160,23,0.2)' }}>
            {TYPE_LABELS[property.property_type] || property.property_type}
          </span>
        </div>

        <div className="flex items-center gap-1 mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color:HColors.terracotta }} />
          <span className="text-xs truncate" style={{ color:HColors.brown, fontFamily:'var(--font-nunito)' }}>
            {property.quartier}, {property.city}
          </span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 mb-4 flex-wrap"
          style={{ color:HColors.brownDark, fontFamily:'var(--font-nunito)', fontSize:'0.8rem' }}>
          {isTerrain && (
            <>
              {(property.land_area || property.surface_area) && (
                <span className="flex items-center gap-1">
                  <Maximize className="w-3.5 h-3.5"/>
                  {(property.land_area || property.surface_area)!.toLocaleString()} m²
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-xs"
                style={{ background:'rgba(192,124,62,0.12)', color:HColors.brownDeep, border:'1px solid rgba(192,124,62,0.25)' }}>
                Terrain nu
              </span>
            </>
          )}
          {isHotel && (
            <>
              {property.hotel_stars && property.hotel_stars > 0 && (
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: property.hotel_stars }).map((_,i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400"/>
                  ))}
                </span>
              )}
              {property.rooms_count && property.rooms_count > 0 && (
                <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5"/>{property.rooms_count} ch.</span>
              )}
            </>
          )}
          {!isTerrain && !isHotel && (
            <>
              {property.bedrooms > 0  && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5"/>{property.bedrooms} ch</span>}
              {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5"/>{property.bathrooms} sdb</span>}
              {property.surface_area  && <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5"/>{property.surface_area} m²</span>}
            </>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-3 gap-2"
          style={{ borderTop:'1px solid rgba(212,160,23,0.12)' }}>
          <div>
            <div className="text-lg font-bold" style={{ color:HColors.terracotta, fontFamily:'var(--font-cormorant)', fontSize:'1.2rem' }}>
              {formatPrice(property.price)}
            </div>
            <div className="text-xs" style={{ color:'rgba(90,64,0,0.6)', fontFamily:'var(--font-nunito)' }}>
              {property.transaction_type === 'location' ? '/ mois' : 'Prix de vente'}
            </div>
          </div>
          {property.verified_notaire ? (
            <button onClick={onViewDetails || onContactClick}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background:HColors.navyDark, color:HColors.cream, fontFamily:'var(--font-nunito)' }}>
              Voir détails
            </button>
          ) : (
            <button onClick={onViewDetails || onContactClick}
              className="px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-90 flex items-center gap-1.5"
              style={{ background:HAlpha.gold10, color:HColors.brownMid, fontFamily:'var(--font-nunito)',
                       border:'1px solid rgba(212,160,23,0.25)' }}
              title="En attente de vérification notaire">
              <AlertTriangle className="w-3.5 h-3.5"/> Voir détails
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
