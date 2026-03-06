import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { KenteLine } from './ui/KenteLine';
import { Home, Building2, Briefcase, Loader } from 'lucide-react';

interface RoleSelectModalProps {
  uid: string;
  displayName: string;
  photoURL: string | null;
  onDone: () => void;
}

const ROLES = [
  {
    id: 'locataire',
    label: 'Locataire / Acheteur',
    desc: 'Je cherche un bien à louer ou à acheter',
    icon: <Home className="w-6 h-6" />,
  },
  {
    id: 'proprietaire',
    label: 'Propriétaire',
    desc: 'Je loue ou vends mes biens',
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    id: 'agent',
    label: 'Agent immobilier',
    desc: 'Je représente des biens pour mes clients',
    icon: <Briefcase className="w-6 h-6" />,
  },
] as const;

export default function RoleSelectModal({ uid, displayName, photoURL, onDone }: RoleSelectModalProps) {
  const [selected, setSelected] = useState<'locataire' | 'proprietaire' | 'agent'>('locataire');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'profiles', uid), {
        role: selected,
        updated_at: serverTimestamp(),
      });
      // Update localStorage cache
      const cacheKey = `homeci_profile_${uid}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        localStorage.setItem(cacheKey, JSON.stringify({ ...parsed, role: selected }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      onDone();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: HColors.night, border: `1px solid ${HAlpha.gold20}` }}>

        <KenteLine height={4} />

        <div className="px-6 pt-6 pb-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            {photoURL ? (
              <img src={photoURL} alt={displayName}
                className="w-12 h-12 rounded-full object-cover shrink-0"
                style={{ border: `2px solid ${HAlpha.gold30}` }} />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ background: HAlpha.gold15, border: `2px solid ${HAlpha.gold30}` }}>
                <span className="text-xl font-bold" style={{ color: HColors.gold }}>
                  {displayName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div>
              <h2 className="font-bold text-lg" style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>
                Bienvenue, {displayName.split(' ')[0]} !
              </h2>
              <p className="text-sm" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                Choisissez votre type de compte
              </p>
            </div>
          </div>

          {/* Role cards */}
          <div className="space-y-3 mb-6">
            {ROLES.map(role => {
              const isActive = selected === role.id;
              return (
                <button key={role.id} onClick={() => setSelected(role.id)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all"
                  style={isActive
                    ? { background: HAlpha.gold15, border: `2px solid ${HColors.gold}` }
                    : { background: 'rgba(255,255,255,0.04)', border: `1px solid ${HAlpha.gold15}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: isActive ? HAlpha.gold20 : HAlpha.gold08, color: isActive ? HColors.gold : HAlpha.cream45 }}>
                    {role.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: isActive ? HColors.gold : HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                      {role.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: HAlpha.cream45, fontFamily: 'var(--font-nunito)' }}>
                      {role.desc}
                    </p>
                  </div>
                  {isActive && (
                    <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: HColors.gold }}>
                      <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                        <path d="M2 6l3 3 5-5" stroke={HColors.night} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Confirm button */}
          <button onClick={handleConfirm} disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #D4A017 0%, #C07C3E 100%)',
                     color: HColors.night, fontFamily: 'var(--font-nunito)' }}>
            {loading
              ? <><Loader className="w-4 h-4 animate-spin" /> Enregistrement…</>
              : 'Confirmer et accéder à HOMECI'}
          </button>
        </div>
      </div>
    </div>
  );
}
