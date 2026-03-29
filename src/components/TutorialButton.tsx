import { useState } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';

const STORAGE_KEY = 'homeci_tutorial_seen';

export default function TutorialButton() {
  const [seen, setSeen] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');

  if (seen) return null;

  const handleClick = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setSeen(true);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: 'rgba(10,22,14,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl p-8 text-center tutorial-card-glow"
        style={{
          background: HColors.night,
          border: `2px solid rgba(255,215,0,0.4)`,
          boxShadow: '0 0 60px rgba(212,160,23,0.25)',
        }}>

        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center tutorial-icon-glow"
          style={{
            background: 'linear-gradient(135deg, #D4A017 0%, #FFD700 50%, #D4A017 100%)',
            boxShadow: '0 0 30px rgba(212,160,23,0.5)',
          }}>
          <BookOpen className="w-9 h-9" style={{ color: HColors.night }} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-3"
          style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
          Bienvenue sur HOMECI
        </h2>

        {/* Description */}
        <p className="text-sm mb-8 leading-relaxed"
          style={{ color: HAlpha.cream60, fontFamily: 'var(--font-nunito)' }}>
          Avant de commencer, prenez 2 minutes pour découvrir comment utiliser
          la plateforme. Le guide vous explique tout, étape par étape.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <a href="/tutoriel" onClick={handleClick}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] tutorial-btn-glow"
            style={{
              background: 'linear-gradient(135deg, #D4A017 0%, #FFD700 50%, #D4A017 100%)',
              color: HColors.night,
              fontFamily: 'var(--font-nunito)',
            }}>
            <BookOpen className="w-4 h-4" />
            Lire le guide
            <ArrowRight className="w-4 h-4" />
          </a>
          <button onClick={handleClick}
            className="py-2.5 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{
              color: HAlpha.cream40,
              fontFamily: 'var(--font-nunito)',
              background: 'transparent',
              border: `1px solid ${HAlpha.gold15}`,
            }}>
            Je connais déjà, passer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tutorialGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(212,160,23,0.4), 0 0 30px rgba(212,160,23,0.15); }
          50% { box-shadow: 0 0 25px rgba(255,215,0,0.6), 0 0 50px rgba(212,160,23,0.3); }
        }
        @keyframes tutorialCardGlow {
          0%, 100% { border-color: rgba(255,215,0,0.3); }
          50% { border-color: rgba(255,215,0,0.6); }
        }
        @keyframes tutorialIconPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(212,160,23,0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 45px rgba(212,160,23,0.6); }
        }
        .tutorial-btn-glow { animation: tutorialGlow 2s ease-in-out infinite; }
        .tutorial-card-glow { animation: tutorialCardGlow 3s ease-in-out infinite; }
        .tutorial-icon-glow { animation: tutorialIconPulse 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
