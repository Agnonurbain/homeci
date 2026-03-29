import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';

const STORAGE_KEY = 'homeci_tutorial_seen';

export default function TutorialButton() {
  const [seen, setSeen] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');

  useEffect(() => {
    if (seen) localStorage.setItem(STORAGE_KEY, '1');
  }, [seen]);

  if (seen) return null;

  return (
    <>
      <a
        href="/tutoriel"
        onClick={() => setSeen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 tutorial-btn-glow"
        style={{
          background: 'linear-gradient(135deg, #D4A017 0%, #FFD700 50%, #D4A017 100%)',
          color: HColors.night,
          border: '2px solid rgba(255,215,0,0.6)',
          boxShadow: '0 0 20px rgba(212,160,23,0.5), 0 0 40px rgba(212,160,23,0.2)',
          fontFamily: 'var(--font-nunito)',
        }}
      >
        <BookOpen className="w-4 h-4" />
        Découvrir le guide
      </a>
      <style>{`
        @keyframes tutorialGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(212,160,23,0.4), 0 0 30px rgba(212,160,23,0.15); }
          50% { box-shadow: 0 0 25px rgba(255,215,0,0.6), 0 0 50px rgba(212,160,23,0.3); }
        }
        .tutorial-btn-glow {
          animation: tutorialGlow 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
