import { MapPin, Bed, Bath, Maximize, CheckCircle, Calendar, Phone, Mail, MessageCircle } from 'lucide-react';
import type { Property } from '../services/propertyService';

interface PropertyDetailsProps {
  property: Property;
}

export function PropertyDetails({ property }: PropertyDetailsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const amenitiesList = Array.isArray(property.amenities) ? property.amenities as string[] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="relative h-96 bg-gray-200">
          <img
            src="https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt={property.title}
            className="w-full h-full object-cover"
          />
          {property.verified_notaire && (
            <div className="absolute top-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-full flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Vérifié Notaire</span>
            </div>
          )}
        </div>

        <div className="p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">{property.quartier}, {property.city}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold text-emerald-600 mb-1">
                  {formatPrice(property.price)}
                </div>
                <div className="text-gray-600">
                  {property.transaction_type === 'location' ? 'par mois' : ''}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {property.bedrooms > 0 && !['terrain', 'entrepot', 'magasin'].includes(property.property_type) && (
                  <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                    <Bed className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-semibold">{property.bedrooms}</div>
                      <div className="text-sm text-gray-600">Chambres</div>
                    </div>
                  </div>
                )}
                {property.bathrooms > 0 && !['terrain', 'entrepot', 'magasin'].includes(property.property_type) && (
                  <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                    <Bath className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-semibold">{property.bathrooms}</div>
                      <div className="text-sm text-gray-600">Salles de bain</div>
                    </div>
                  </div>
                )}
                {property.surface_area && (
                  <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                    <Maximize className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-semibold">{property.surface_area} m²</div>
                      <div className="text-sm text-gray-600">Surface</div>
                    </div>
                  </div>
                )}
                {property.available_from && (
                  <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-semibold text-sm">{new Date(property.available_from).toLocaleDateString('fr-FR')}</div>
                      <div className="text-sm text-gray-600">Disponible</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>

              {amenitiesList.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Équipements</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenitiesList.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Localisation</h2>
                <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Carte interactive - {property.city}</p>
                </div>
              </div>
            </div>

            <div className="lg:w-96">
              <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contactez le propriétaire</h3>

                <div className="space-y-4 mb-6">
                  <button className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-medium">
                    <Phone className="w-5 h-5" />
                    Appeler
                  </button>

                  <button className="w-full px-6 py-3 bg-white border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 font-medium">
                    <MessageCircle className="w-5 h-5" />
                    Envoyer un message
                  </button>

                  <button className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium">
                    <Mail className="w-5 h-5" />
                    Envoyer un email
                  </button>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Planifier une visite</h4>
                  <form className="space-y-3">
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <input
                      type="time"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      Réserver une visite
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
