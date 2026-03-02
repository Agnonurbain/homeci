import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Property } from '../services/propertyService';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SingleMapProps {
  mode: 'single';
  latitude: number;
  longitude: number;
  title: string;
}

interface MultiMapProps {
  mode: 'multi';
  properties: Property[];
}

type MapDisplayProps = SingleMapProps | MultiMapProps;

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(price);

const TYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', villa: 'Villa',
  terrain: 'Terrain', hotel: 'Hôtel', appart_hotel: 'Appart-Hôtel',
};

const DEFAULT_CENTER: [number, number] = [5.3539, -4.0051];

export default function MapDisplay(props: MapDisplayProps) {
  if (props.mode === 'single') {
    const position: [number, number] = [props.latitude, props.longitude];
    return (
      <div className="border border-gray-300 rounded-xl overflow-hidden" style={{ height: '400px' }}>
        <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup><strong>{props.title}</strong></Popup>
          </Marker>
        </MapContainer>
      </div>
    );
  }

  const withCoords = props.properties.filter(p => p.latitude && p.longitude);
  const center: [number, number] = withCoords.length > 0
    ? [withCoords[0].latitude!, withCoords[0].longitude!]
    : DEFAULT_CENTER;

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden" style={{ height: '600px' }}>
      {withCoords.length === 0 ? (
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-1">Aucune localisation disponible</p>
            <p className="text-sm">Les biens n'ont pas encore de coordonnées GPS enregistrées.</p>
          </div>
        </div>
      ) : (
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {withCoords.map(property => (
            <Marker key={property.id} position={[property.latitude!, property.longitude!]}>
              <Popup>
                <div className="min-w-[200px]">
                  <p className="font-semibold text-gray-900 mb-1">{property.title}</p>
                  <p className="text-xs text-gray-500 mb-1">
                    {TYPE_LABELS[property.property_type]} — {property.quartier}, {property.city}
                  </p>
                  <p className="text-emerald-600 font-bold">
                    {formatPrice(property.price)}{property.transaction_type === 'location' ? ' / mois' : ''}
                  </p>
                  {property.verified_notaire && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      ✓ Vérifié Notaire
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
