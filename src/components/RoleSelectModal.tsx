import { useState } from 'react';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { KenteLine } from './ui/KenteLine';
import { Home, Building2, Briefcase, Award, Loader, CheckCircle, XCircle } from 'lucide-react';

interface RoleSelectModalProps {
  uid: string;
  displayName: string;
  photoURL: string | null;
  onDone: () => void;
}

type RoleId = 'locataire' | 'proprietaire' | 'notaire';

const ROLES: { id: RoleId; label: string; desc: string; icon: React.ReactNode; needsCode?: boolean }[] = [
  { id: 'locataire',    label: 'Locataire / Acheteur', desc: 'Je cherche un bien à louer ou à acheter', icon: <Home      className="w-5 h-5" /> },
  { id: 'proprietaire', label: 'Propriétaire',          desc: 'Je loue ou vends mes biens',             icon: <Building2 className="w-5 h-5" /> },
  { id: 'notaire',      label: 'Notaire Agréé',         desc: 'Code d\'invitation requis',               icon: <Award     className="w-5 h-5" />, needsCode: true },
];

async function validateNotaireCode(code: string): Promise<{ valid: boolean; docId?: string }> {
  try {
    const q = query(collection(db, 'notaire_codes'), where('code', '==', code.toUpperCase()), where('used', '==', false));
    const snap = await getDocs(q);
    if (snap.empty) return { valid: false };
    const d = snap.docs[0];
    const data = d.data();
    if (data.expires_at && data.expires_at.toDate() < new Date()) return { valid: false };
    return { valid: true, docId: d.id };
  } catch { return { valid: false }; }
}

async function markNotaireCodeUsed(docId: string) {
  await updateDoc(doc(db, 'notaire_codes', docId), { used: true, used_at: new Date().toISOString() });
}

export default function RoleSelectModal({ uid, displayName, photoURL, onDone }: RoleSelectModalProps) {
  const { refreshProfile } = useAuth();
  useBodyScrollLock(true);
  const [selected, setSelected] = useState<RoleId>('locataire');
  const [loading, setLoading] = useState(false);

  // Notaire code state
  const [notaireCode, setNotaireCode]       = useState('');
  const [codeStatus, setCodeStatus]         = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [validCodeDocId, setValidCodeDocId] = useState<string | null>(null);

  async function handleCheckCode() {
    if (!notaireCode.trim()) return;
    setCodeStatus('checking');
    const result = await validateNotaireCode(notaireCode);
    if (result.valid && result.docId) {
      setCodeStatus('valid');
      setValidCodeDocId(result.docId);
    } else {
      setCodeStatus('invalid');
      setValidCodeDocId(null);
    }
  }

  function handleSelectRole(id: RoleId) {
    setSelected(id);
    // Reset code state when changing away from notaire
    if (id !== 'notaire') {
      setNotaireCode('');
      setCodeStatus('idle');
      setValidCodeDocId(null);
    }
  }

  const canConfirm = selected !== 'notaire' || codeStatus === 'valid';

  async function handleConfirm() {
    if (!canConfirm) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
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
      // Marquer le code notaire comme utilisé
      if (selected === 'notaire' && validCodeDocId) {
        await markNotaireCodeUsed(validCodeDocId);
      }
      // Recharger le profil en mémoire → déclenche le bon dashboard
      await refreshProfile();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      onDone();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)' }}>
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
                <span className="text-xl font-bold" style={{ color: HColors.orangeCI }}>
                  {displayName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div>
              <h2 className="font-bold" style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem' }}>
                Bienvenue, {displayName.split(' ')[0]} !
              </h2>
              <p className="text-sm" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                Choisissez votre type de compte
              </p>
            </div>
          </div>

          {/* Role cards */}
          <div className="space-y-2.5 mb-5">
            {ROLES.map(role => {
              const isActive = selected === role.id;
              return (
                <div key={role.id}>
                  <button onClick={() => handleSelectRole(role.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={isActive
                      ? { background: HAlpha.orange15, border: `2px solid ${HColors.orangeCI}` }
                      : { background: 'rgba(255,255,255,0.04)', border: `1px solid ${HAlpha.gold15}` }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: isActive ? HAlpha.gold20 : HAlpha.gold08,
                               color: isActive ? HColors.orangeCI : 'rgba(245,230,200,0.4)' }}>
                      {role.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: isActive ? HColors.orangeCI : HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                        {role.label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(245,230,200,0.4)', fontFamily: 'var(--font-nunito)' }}>
                        {role.desc}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: HColors.orangeCI }}>
                        <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                          <path d="M2 6l3 3 5-5" stroke={HColors.night} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* Code input — visible only when notaire is selected */}
                  {role.id === 'notaire' && isActive && (
                    <div className="mt-2 px-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={notaireCode}
                          onChange={e => { setNotaireCode(e.target.value.toUpperCase()); setCodeStatus('idle'); setValidCodeDocId(null); }}
                          onKeyDown={e => e.key === 'Enter' && handleCheckCode()}
                          placeholder="Code d'invitation (ex: NOT-XXXX)"
                          className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                          style={{
                            background: 'rgba(13,31,18,0.7)',
                            border: codeStatus === 'valid'   ? '1.5px solid rgba(45,106,79,0.8)' :
                                    codeStatus === 'invalid' ? '1.5px solid rgba(180,40,40,0.7)' :
                                                               '1px solid rgba(212,160,23,0.25)',
                            color: HColors.cream,
                            fontFamily: 'var(--font-nunito)',
                          }}
                        />
                        <button onClick={handleCheckCode} disabled={!notaireCode.trim() || codeStatus === 'checking'}
                          className="px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                          style={{ background: HAlpha.gold20, border: `1px solid ${HAlpha.gold30}`,
                                   color: HColors.gold, fontFamily: 'var(--font-nunito)' }}>
                          {codeStatus === 'checking'
                            ? <Loader className="w-4 h-4 animate-spin" />
                            : 'Valider'}
                        </button>
                      </div>
                      {codeStatus === 'valid' && (
                        <p className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: '#6FCF97', fontFamily: 'var(--font-nunito)' }}>
                          <CheckCircle className="w-3.5 h-3.5" /> Code valide — vous pouvez confirmer
                        </p>
                      )}
                      {codeStatus === 'invalid' && (
                        <p className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: '#FFAAAA', fontFamily: 'var(--font-nunito)' }}>
                          <XCircle className="w-3.5 h-3.5" /> Code invalide, expiré ou déjà utilisé
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Confirm button */}
          <button onClick={handleConfirm} disabled={loading || !canConfirm}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: canConfirm
                       ? 'linear-gradient(135deg, #FF6B00 0%, #D4A017 100%)'
                       : 'rgba(212,160,23,0.25)',
                     color: canConfirm ? HColors.night : HAlpha.cream45,
                     fontFamily: 'var(--font-nunito)' }}>
            {loading
              ? <><Loader className="w-4 h-4 animate-spin" /> Enregistrement…</>
              : selected === 'notaire' && codeStatus !== 'valid'
                ? 'Validez votre code pour continuer'
                : 'Confirmer et accéder à HOMECI'}
          </button>
        </div>
      </div>
    </div>
  );
}
