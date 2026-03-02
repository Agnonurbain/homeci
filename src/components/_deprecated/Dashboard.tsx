import { Plus, Home, Eye, Heart, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { propertyService } from '../services/propertyService';
import { PropertyCard } from './PropertyCard';
import type { Property } from '../types/property';

export function Dashboard() {
  const { profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    pending: 0,
    draft: 0,
  });

  useEffect(() => {
    if (profile) {
      loadProperties();
    }
  }, [profile]);

  async function loadProperties() {
    if (!profile) return;

    try {
      const data = await propertyService.getPropertiesByOwner(profile.id);

      setProperties(data);

      const published = data.filter(p => p.status === 'available').length;
      const pending = data.filter(p => p.status === 'rented').length;

      setStats({
        total: data.length,
        published,
        pending,
        draft: 0,
      });
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!profile || (profile.role !== 'proprietaire' && profile.role !== 'agent')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-600">Vous devez être propriétaire ou agent pour accéder à cette page</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes biens immobiliers</h1>
            <p className="text-gray-600 mt-1">Gérez vos annonces et suivez vos performances</p>
          </div>
          <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-medium">
            <Plus className="w-5 h-5" />
            Ajouter un bien
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Home className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total de biens</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.published}</div>
            <div className="text-sm text-gray-600 mt-1">Publiés</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.pending}</div>
            <div className="text-sm text-gray-600 mt-1">En attente</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.draft}</div>
            <div className="text-sm text-gray-600 mt-1">Brouillons</div>
          </div>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun bien enregistré
          </h3>
          <p className="text-gray-600 mb-6">
            Commencez par ajouter votre premier bien immobilier
          </p>
          <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2 font-medium">
            <Plus className="w-5 h-5" />
            Ajouter un bien
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
