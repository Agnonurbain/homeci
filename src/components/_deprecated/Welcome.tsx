import { Building2, Shield } from 'lucide-react';

interface WelcomeProps {
  onShowAuth: (mode: 'login' | 'signup') => void;
}

export default function Welcome({ onShowAuth }: WelcomeProps) {
  const handleAdminClick = () => {
    window.location.pathname = '/portail-securise';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 relative">
      <button
        onClick={handleAdminClick}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors shadow-lg group"
      >
        <Shield className="w-5 h-5 group-hover:text-red-400 transition-colors" />
        <span className="font-medium">Admin</span>
      </button>

      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-lg">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Bienvenue sur HOMECI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            La plateforme immobilière de référence en Côte d'Ivoire. Trouvez votre prochaine maison, appartement, villa ou terrain en toute confiance.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Recherche simplifiée</h3>
              <p className="text-gray-600 text-sm">Trouvez rapidement le bien qui vous correspond</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Transactions sécurisées</h3>
              <p className="text-gray-600 text-sm">Vérification notariale et paiements sécurisés</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Support dédié</h3>
              <p className="text-gray-600 text-sm">Une équipe à votre écoute 7j/7</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onShowAuth('login')}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Connexion
            </button>
            <button
              onClick={() => onShowAuth('signup')}
              className="px-8 py-4 bg-white border-2 border-emerald-500 text-emerald-600 rounded-xl font-semibold text-lg hover:bg-emerald-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Inscription
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité
          </p>
        </div>
      </div>
    </div>
  );
}
