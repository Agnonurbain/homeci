import { Home, ArrowLeft } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #0D1F12 0%, #1A0E00 100%)' }}>

      {/* Kente */}
      <div className="fixed top-0 left-0 right-0 flex" style={{ height: 4 }}>
        {['#FF6B00','#009E49','#FFFFFF','#D4A017','#FF6B00','#009E49','#FFFFFF','#D4A017',
          '#FF6B00','#009E49','#FFFFFF','#D4A017'].map((c, i) => (
          <div key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </div>

      <div className="max-w-md w-full text-center">
        {/* 404 big number */}
        <div className="mb-6"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '8rem', fontWeight: 700,
                   lineHeight: 1, color: HAlpha.gold15 }}>
          404
        </div>

        {/* Elephant icon */}
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: HAlpha.orange10, border: `2px solid ${HAlpha.orange25}` }}>
          <span style={{ fontSize: '2.5rem' }}>🐘</span>
        </div>

        <h1 className="text-2xl font-bold mb-3"
          style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
          Page introuvable
        </h1>

        <p className="text-sm mb-8 leading-relaxed"
          style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
          Cette page n'existe pas ou a été déplacée.
          Même notre éléphant ne l'a pas trouvée !
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => window.history.back()}
            className="px-6 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-80"
            style={{ border: `1px solid ${HAlpha.gold25}`, color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <button onClick={() => { window.location.href = '/'; }}
            className="px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #D4A017 100%)',
                     color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
            <Home className="w-4 h-4" /> Accueil HOMECI
          </button>
        </div>

        <p className="mt-10 text-xs"
          style={{ color: HAlpha.cream25, fontFamily: 'var(--font-nunito)' }}>
          HOMECI — L'immobilier ivoirien, certifié et sécurisé
        </p>
      </div>
    </div>
  );
}
