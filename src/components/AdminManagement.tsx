import { useState, useEffect } from 'react';
import { UserPlus, Mail, Lock, Shield, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword, updateEmail, updatePassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface CredentialRequest {
  id: string;
  admin_id: string;
  new_email: string | null;
  request_type: 'email_change' | 'password_change' | 'both';
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function AdminManagement() {
  const { user, profile } = useAuth();
  const [isAdminPrincipal, setIsAdminPrincipal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [credentialRequests, setCredentialRequests] = useState<CredentialRequest[]>([]);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changeType, setChangeType] = useState<'email' | 'password' | 'both'>('email');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);

  useEffect(() => {
    checkIfAdminPrincipal();
  }, [profile]);

  const checkIfAdminPrincipal = async () => {
    try {
      setIsAdminPrincipal(profile?.role === 'admin');
    } catch (err) {
      setIsAdminPrincipal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (changeType === 'password' || changeType === 'both') {
      if (newPassword !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
      if (newPassword.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Non authentifié');

      if (changeType === 'email' || changeType === 'both') {
        await updateEmail(currentUser, newEmail);
      }
      if (changeType === 'password' || changeType === 'both') {
        await updatePassword(currentUser, newPassword);
      }

      setMessage('Vos informations ont été mises à jour avec succès');
      setNewEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error updating credentials:', err);
      setError(err.message || 'Une erreur est survenue');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!isAdminPrincipal) {
      setError('Seul l\'administrateur principal peut créer de nouveaux administrateurs');
      return;
    }

    if (newAdminPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newAdminEmail, newAdminPassword);
      await setDoc(doc(db, 'profiles', userCredential.user.uid), {
        id: userCredential.user.uid,
        email: newAdminEmail,
        full_name: newAdminName,
        role: 'admin',
        created_at: new Date().toISOString(),
      });

      setMessage('Nouvel administrateur créé avec succès');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminName('');
    } catch (err: any) {
      console.error('Error creating admin:', err);
      setError(err.message || 'Une erreur est survenue lors de la création de l\'administrateur');
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    setMessage(`Demande ${action === 'approved' ? 'approuvée' : 'rejetée'}`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Administrateurs</h2>
        <p className="text-gray-600">
          {isAdminPrincipal
            ? 'Vous êtes l\'administrateur principal. Gérez vos informations et les autres administrateurs.'
            : 'Modifiez vos informations de connexion. Les changements nécessitent l\'approbation de l\'administrateur principal.'}
        </p>
      </div>

      {message && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{message}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Modifier vos identifiants
        </h3>

        <form onSubmit={handleCredentialChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de modification
            </label>
            <select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="email">Changer l'email</option>
              <option value="password">Changer le mot de passe</option>
              <option value="both">Changer email et mot de passe</option>
            </select>
          </div>

          {(changeType === 'email' || changeType === 'both') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouvel email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="nouveau@email.com"
                />
              </div>
            </div>
          )}

          {(changeType === 'password' || changeType === 'both') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {isAdminPrincipal ? 'Mettre à jour' : 'Soumettre la demande'}
          </button>

          {!isAdminPrincipal && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Votre demande sera examinée par l'administrateur principal avant d'être appliquée.
            </p>
          )}
        </form>
      </div>

      {isAdminPrincipal && (
        <>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Ajouter un nouvel administrateur
            </h3>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="admin@homeci.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showNewAdminPassword ? "text" : "password"}
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewAdminPassword(!showNewAdminPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showNewAdminPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Créer l'administrateur
              </button>
            </form>
          </div>

          {credentialRequests.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Demandes de modification en attente
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold ml-2">
                  {credentialRequests.length}
                </span>
              </h3>

              <div className="space-y-4">
                {credentialRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{request.profiles.full_name}</h4>
                        <p className="text-sm text-gray-600">{request.profiles.email}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                        {request.request_type === 'email_change' && 'Changement d\'email'}
                        {request.request_type === 'password_change' && 'Changement de mot de passe'}
                        {request.request_type === 'both' && 'Changement email et mot de passe'}
                      </span>
                    </div>

                    {request.new_email && (
                      <div className="mb-3 text-sm">
                        <span className="font-medium text-gray-700">Nouvel email :</span>
                        <span className="ml-2 text-gray-900">{request.new_email}</span>
                      </div>
                    )}

                    <div className="text-sm text-gray-500 mb-4">
                      Demandé le {new Date(request.requested_at).toLocaleString('fr-FR')}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRequestAction(request.id, 'approved')}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approuver
                      </button>
                      <button
                        onClick={() => handleRequestAction(request.id, 'rejected', 'Demande rejetée')}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
