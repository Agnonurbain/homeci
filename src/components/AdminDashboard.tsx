import { useState, useEffect } from 'react';
import { Users, Home, Shield, FileCheck, AlertCircle, TrendingUp, CheckCircle, XCircle, Activity, UserCog } from 'lucide-react';
import { collection, getDocs, orderBy, query, limit, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { propertyService } from '../services/propertyService';
import type { Property } from '../types/property';
import type { Profile } from '../contexts/AuthContext';
import AdminLoginHistory from './AdminLoginHistory';
import AdminManagement from './AdminManagement';

interface Stats {
  total_users: number;
  total_properties: number;
  pending_properties: number;
  verified_properties: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'properties' | 'verification' | 'security' | 'admin-management'>('overview');
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    total_properties: 0,
    pending_properties: 0,
    verified_properties: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const usersQuery = query(
        collection(db, 'profiles'),
        orderBy('created_at', 'desc'),
        limit(20)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const profiles = usersSnapshot.docs.map(d => {
        const data = d.data();
        const toISO = (v: unknown) => {
          if (!v) return new Date().toISOString();
          if (v instanceof Timestamp) return v.toDate().toISOString();
          return String(v);
        };
        return {
          id: d.id,
          email: String(data.email ?? ''),
          full_name: String(data.full_name ?? ''),
          phone: (data.phone as string | null) ?? null,
          role: (data.role as Profile['role']) ?? 'locataire',
          avatar_url: (data.avatar_url as string | null) ?? null,
          company_name: (data.company_name as string | null) ?? null,
          verified: Boolean(data.verified ?? false),
          created_at: toISO(data.created_at),
          updated_at: toISO(data.updated_at),
        } as Profile;
      });

      const allProperties = await propertyService.getAllProperties();

      setUsers(profiles);
      setProperties(allProperties.slice(0, 10));

      setStats({
        total_users: profiles.length,
        total_properties: allProperties.length,
        pending_properties: allProperties.filter(p => p.status === 'pending').length,
        verified_properties: allProperties.filter(p => p.verified_notaire).length,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setLoading(true);
    loadData();
  };

  const approveProperty = async (propertyId: string) => {
    try {
      await propertyService.updateProperty(propertyId, { status: 'published' });
      refreshData();
    } catch (error) {
      console.error('Error approving property:', error);
    }
  };

  const rejectProperty = async (propertyId: string) => {
    try {
      await propertyService.updateProperty(propertyId, { status: 'rejected' });
      refreshData();
    } catch (error) {
      console.error('Error rejecting property:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      locataire: 'bg-blue-100 text-blue-700',
      proprietaire: 'bg-green-100 text-green-700',
      agent: 'bg-purple-100 text-purple-700',
      admin: 'bg-red-100 text-red-700',
    };

    const labels = {
      locataire: 'Locataire',
      proprietaire: 'Propriétaire',
      agent: 'Agent',
      admin: 'Admin',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[role as keyof typeof styles] || styles.locataire}`}>
        {labels[role as keyof typeof labels] || role}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Panneau Administrateur</h1>
              <p className="text-red-100 text-sm">Gestion et modération de la plateforme HOMECI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span>Vue d'ensemble</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Utilisateurs</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'properties'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                <span>Biens immobiliers</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'verification'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                <span>Modération</span>
                {stats.pending_properties > 0 && (
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                    {stats.pending_properties}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'security'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                <span>Sécurité</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('admin-management')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'admin-management'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCog className="w-5 h-5" />
                <span>Gestion Admins</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Vue d'ensemble</h2>
              <p className="text-gray-600">Statistiques générales de la plateforme</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total_users}</div>
                  <div className="text-sm text-gray-600">Utilisateurs inscrits</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Home className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total_properties}</div>
                  <div className="text-sm text-gray-600">Biens immobiliers</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pending_properties}</div>
                  <div className="text-sm text-gray-600">En attente de modération</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FileCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.verified_properties}</div>
                  <div className="text-sm text-gray-600">Biens vérifiés</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Utilisateurs</h2>
              <p className="text-gray-600">Liste de tous les utilisateurs de la plateforme</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'inscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Actif
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-red-600 hover:text-red-900">
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Tous les Biens</h2>
              <p className="text-gray-600">Gérez tous les biens immobiliers de la plateforme</p>
            </div>

            <div className="bg-white rounded-xl p-12 text-center">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Liste complète à venir</h3>
              <p className="text-gray-600">Fonctionnalité de gestion avancée en développement</p>
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Modération des Biens</h2>
              <p className="text-gray-600">Approuvez ou rejetez les nouvelles annonces</p>
            </div>

            {properties.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun bien en attente</h3>
                <p className="text-gray-600">Tous les biens ont été modérés</p>
              </div>
            ) : (
              <div className="space-y-4">
                {properties.map((property) => (
                  <div key={property.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">Propriétaire:</span> {property.owner_id}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {property.property_type}
                          </div>
                          <div>
                            <span className="font-medium">Ville:</span> {property.city}
                          </div>
                          <div>
                            <span className="font-medium">Prix:</span> {property.price.toLocaleString()} FCFA
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Soumis le {new Date(property.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="flex gap-3 ml-6">
                        <button
                          onClick={() => approveProperty(property.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approuver
                        </button>
                        <button
                          onClick={() => rejectProperty(property.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeter
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <AdminLoginHistory />
        )}

        {activeTab === 'admin-management' && (
          <AdminManagement />
        )}
      </div>
    </div>
  );
}
