import { useState, useEffect } from 'react';
import { 
  X, CheckCircle, 
  AlertTriangle, ShieldCheck, UserCircle, Wallet,
  Briefcase, Users, ExternalLink
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import type { Profile } from '../../contexts/AuthContext';

interface DossierViewerModalProps {
  tenantId: string;
  tenantName: string;
  onClose: () => void;
}

export default function DossierViewerModal({ tenantId, tenantName, onClose }: DossierViewerModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', tenantId));
        if (docSnap.exists()) {
          setProfile(docSnap.data() as Profile);
        }
      } catch (err) {
        console.error('Error fetching tenant profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [tenantId]);

  const dossier = profile?.dossier;

  const renderDocRow = (docId: string, label: string, icon: React.ReactNode) => {
    if (!dossier) return null;
    const url = (dossier as any)[`${docId}_url`];

    if (!url) return (
      <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-gray-200 opacity-60 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
            {icon}
          </div>
          <span className="text-xs font-medium text-gray-500">{label}</span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase">Non fourni</span>
      </div>
    );

    return (
      <div className="flex items-center justify-between p-3 rounded-xl border"
        style={{ background: '#FFF', borderColor: HAlpha.vertCI20 }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: HAlpha.gold05, color: HColors.gold }}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: HColors.darkBrown }}>{label}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-600 uppercase">
                <CheckCircle className="w-2.5 h-2.5" /> FOURNI
              </span>
            </div>
          </div>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:bg-navy-50"
          style={{ color: HColors.navy, background: HAlpha.navy08 }}>
          Ouvrir <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(10,22,14,0.92)', backdropFilter: 'blur(8px)' }}>
      
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 md:p-8 flex items-center justify-between border-b" 
          style={{ background: 'linear-gradient(135deg, #0D1F12 0%, #1A0E00 100%)', borderColor: HAlpha.gold20 }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
              <UserCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold truncate max-w-[150px] xs:max-w-none" style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
                {hasConsented ? `Dossier de ${tenantName}` : "Engagement Légal"}
              </h2>
              <p className="text-[10px] sm:text-xs opacity-60" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                {hasConsented ? "Consultation du profil" : "Conditions d'accès"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-6 h-6 text-white/50" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50">
          {!hasConsented ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 py-4">
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-amber-200 shadow-sm space-y-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
                  <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-amber-900 leading-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>Protection des Données</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-amber-900/80">
                  En accédant au dossier de <strong>{tenantName}</strong>, vous vous engagez à respecter strictement la <strong>Loi n°2013-450</strong> sur la protection des données en Côte d'Ivoire.
                </p>
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                  <p className="text-[11px] font-semibold text-amber-800">Je reconnais et j'accepte que :</p>
                  <ul className="text-[11px] space-y-2 text-amber-800/80 list-disc pl-4">
                    <li>Ces documents sont destinés <strong>exclusivement</strong> à l'étude de solvabilité dans le cadre d'une location.</li>
                    <li>Toute divulgation à des tiers ou partage externe est <strong>strictement interdit</strong>.</li>
                    <li>L'utilisation abusive de ces données peut entraîner des <strong>poursuites pénales</strong>.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4">
                <label className="relative flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="peer hidden" id="consent-check" onChange={(e) => {
                    if(e.target.checked) {
                      setTimeout(() => setHasConsented(true), 300);
                    }
                  }} />
                  <div className="w-6 h-6 rounded-lg border-2 border-amber-200 peer-checked:bg-amber-600 peer-checked:border-amber-600 transition-all flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs font-bold text-amber-900 group-hover:text-amber-700 transition-colors">
                    J'ai lu et j'accepte mon engagement de confidentialité.
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-4 border-gold border-b-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chargement du dossier...</p>
                </div>
              ) : !profile ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-500">Impossible de charger le dossier de ce locataire.</p>
                </div>
              ) : (
                <>
                  {/* Income Sec */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">Revenus & Emploi</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {renderDocRow('pay_slip_1', 'Bulletin de paie (M)', <Wallet />)}
                      {renderDocRow('pay_slip_2', 'Bulletin de paie (M-1)', <Wallet />)}
                      {renderDocRow('pay_slip_3', 'Bulletin de paie (M-2)', <Wallet />)}
                      {renderDocRow('employment_proof', 'Attestation d\'Emploi', <Briefcase />)}
                    </div>
                  </div>

                  {/* Guarantor Sec */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">Le Garant (Caution)</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {renderDocRow('guarantor_identity', 'Identité du Garant', <Users />)}
                      {renderDocRow('guarantor_income', 'Revenus du Garant', <Wallet />)}
                    </div>
                  </div>

                  {/* Security Banner: Ivorian Law Disclaimer */}
                  <div className="p-4 rounded-2xl flex items-start gap-4 bg-amber-50 border border-amber-200 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6 text-amber-700" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Avertissement Légal Immédiat</h4>
                      <p className="text-[10px] leading-relaxed text-amber-800">
                        Conformément à la <strong>Loi n°2013-450 du 19 juin 2013 rel. à la protection des données à caractère personnel</strong>, les informations consultées sont strictement confidentielles. Toute divulgation externe est passible de sanctions pénales.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-white border-t flex justify-center sm:justify-end">
          <button onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #D4A017 100%)', color: '#FFF' }}>
            {hasConsented ? "Fermer le dossier" : "Annuler"}
          </button>
        </div>
      </div>
    </div>
  );
}
