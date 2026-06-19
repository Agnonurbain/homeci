import { useState } from 'react';
import { AlertCircle, Loader, Stamp, Share2, Clipboard } from 'lucide-react';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { useEscapeClose } from '../../hooks/useEscapeClose';

export function RevokeModal({ isOpen, onClose, onConfirm, property, hasActiveVisit, loading }: any) {
  useEscapeClose(onClose);
  const [reason, setReason] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-300"
        style={{ background: '#FFFFFF', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[rgba(139,29,29,0.10)] flex items-center justify-center mx-auto"
            style={{ background: HAlpha.bord10 }}>
            <AlertCircle className="w-8 h-8" style={{ color: HColors.bordeaux }} />
          </div>
          <div>
            <h3 className="text-xl font-black" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Décertifier ce bien ?</h3>
            <p className="text-sm mt-2 font-medium" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
              Cette action est irréversible et retirera le badge "Vérifié Notaire" de <strong>{property.title}</strong>.
            </p>
          </div>

          {hasActiveVisit && (
            <div className="p-3 rounded-xl text-left flex gap-3" style={{ background: HAlpha.orange10, border: `1px solid ${HAlpha.orange25}` }}>
              <AlertCircle className="w-5 h-5 shrink-0" style={{ color: HColors.orangeCI }} />
              <p className="text-xs font-bold" style={{ color: HColors.orangeCI }}>
                Attention : Des visites sont programmées. Elles seront annulées et les locataires seront remboursés.
              </p>
            </div>
          )}

          <div className="space-y-2 text-left">
            <label htmlFor="decertify-reason" className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: HAlpha.brown50 }}>Motif de décertification</label>
            <textarea id="decertify-reason" value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Indiquez la raison précise..."
              className="w-full p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#D4A017]/40 min-h-[100px] resize-none"
              style={{ background: HAlpha.gold05, border: `1.5px solid ${HAlpha.gold15}`, color: HColors.darkBrown }} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all hover:bg-[rgba(212,160,23,0.08)]"
              style={{ color: HColors.brownMid }}>Annuler</button>
            <button onClick={() => onConfirm(reason)} disabled={!reason.trim() || loading}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
              style={{ background: HColors.bordeaux, boxShadow: '0 8px 16px rgba(139,29,29,0.3)' }}>
              {loading ? <Loader className="w-5 h-5 mx-auto animate-spin" /> : 'Confirmer le retrait'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DelegationModal({ token, onClose, action, propertyTitle }: any) {
  useEscapeClose(onClose);
  const [copied, setCopied] = useState(false);
  if (!token) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-[2.5rem] p-8 text-center space-y-6 animate-in slide-in-from-bottom-8 duration-500"
        style={{ background: 'linear-gradient(145deg, #FDFCF8, #F5E6CC)', border: `2px solid ${HColors.gold}` }}>
        <div className="w-20 h-20 bg-[rgba(0,158,73,0.10)] rounded-full flex items-center justify-center mx-auto"
          style={{ background: HAlpha.vertCI10 }}>
          <Stamp className="w-10 h-10" style={{ color: HColors.vertCI }} />
        </div>
        
        <div>
          <h3 className="text-2xl font-black" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Jeton de Délégation Prêt</h3>
          <p className="text-sm mt-2" style={{ color: HColors.brown }}>
            Utilisez ce code pour finaliser la <strong>{action === 'certify' ? 'certification' : 'décertification'}</strong> de <strong>{propertyTitle}</strong>.
          </p>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-inner" style={{ background: 'rgba(255,255,255,0.5)', border: `1px dashed ${HColors.gold}` }}>
          <code className="block text-lg sm:text-2xl font-mono font-black break-all select-all tracking-wider" style={{ color: HColors.gold }}>{token}</code>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button onClick={copyToClipboard} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white"
              style={{ background: HAlpha.gold10, color: HColors.gold }}>
              {copied ? 'Copié !' : <><Clipboard className="w-3.5 h-3.5" /> Copier le code</>}
            </button>
            <button onClick={() => {}} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white"
              style={{ background: HAlpha.vertCI10, color: HColors.vertCI }}>
              <Share2 className="w-3.5 h-3.5" /> Partager
            </button>
          </div>
        </div>

        <button onClick={onClose} className="w-full py-3.5 sm:py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all active:scale-95"
          style={{ background: HColors.darkBrown }}>Fermer et Terminer</button>
      </div>
    </div>
  );
}
