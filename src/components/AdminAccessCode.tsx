import { useState } from 'react';
import { Shield, Key, AlertCircle, Home } from 'lucide-react';

interface AdminAccessCodeProps {
  onSuccess: () => void;
}

export default function AdminAccessCode({ onSuccess }: AdminAccessCodeProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const VALID_CODE = '9573517c';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (code.toLowerCase() === VALID_CODE.toLowerCase()) {
        onSuccess();
      } else {
        setError('Code d\'accès invalide. Veuillez réessayer.');
        setCode('');
      }
      setLoading(false);
    }, 500);
  };

  const handleBackToHome = () => {
    window.location.pathname = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 relative">
      <button
        onClick={handleBackToHome}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm group"
      >
        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-medium">Accueil</span>
      </button>

      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Accès Sécurisé</h1>
            <p className="text-gray-600">Code de validation administrateur</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Code d'accès
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-lg tracking-wider"
                  placeholder="Entrez le code"
                  maxLength={8}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Format : 7 chiffres + 1 lettre (ex: 1234567a)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 8}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Valider le code</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Accès restreint</p>
                  <p>Ce code est réservé aux administrateurs autorisés uniquement. Toutes les tentatives d'accès sont enregistrées.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Système de sécurité HOMECI
          </p>
        </div>
      </div>
    </div>
  );
}
