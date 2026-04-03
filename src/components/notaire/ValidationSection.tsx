import { useState } from 'react';
import { 
  FileText, CheckCircle, XCircle, Clock, Loader, ThumbsUp, ThumbsDown, 
  BadgeCheck, ExternalLink, X 
} from 'lucide-react';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { DOC_LABELS, REQUIRED_DOCS } from '../../constants/labels';
import { fixDocUrl } from '../../utils/fixDocUrl';

export function ValidationSection({ 
  property, 
  actionLoading, 
  handleDocAction, 
  handleCertify, 
  certifyingId,
  isReadyToCertify
}: any) {
  const [refusalReasons, setRefusalReasons] = useState<Record<string, string>>({});
  const [showRefusalInput, setShowRefusalInput] = useState<string | null>(null);

  const required = REQUIRED_DOCS[property.property_type] || ['titre_foncier'];
  const ready = isReadyToCertify(property);

  const onDocAction = async (docType: string, status: 'valide' | 'refuse' | 'en_attente') => {
    const key = `${docType}:${property.id}`;
    if (status === 'refuse' && !refusalReasons[key]?.trim()) {
      setShowRefusalInput(key);
      return;
    }
    await handleDocAction(property, docType, status, refusalReasons[key]);
    setShowRefusalInput(null);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider mb-2"
        style={{ color: HAlpha.brown50, fontFamily: 'var(--font-nunito)' }}>Documents soumis</h4>
      
      <div className="space-y-2">
        {(property.documents || []).map((docItem: any) => {
          const actionKey = `${docItem.type}:${property.id}`;
          const isLoading = actionLoading === actionKey;
          const isRequired = required.includes(docItem.type);
          const isShowingRefusal = showRefusalInput === actionKey;

          return (
            <div key={docItem.type} className="rounded-xl overflow-hidden"
              style={{ background: '#FFFFFF', border: `1px solid ${HAlpha.gold15}` }}>
              <div className="flex flex-col xs:flex-row xs:items-center gap-3 p-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-4 h-4 shrink-0" style={{ color: HColors.gold }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate"
                        style={{ color: HAlpha.brown50, fontFamily: 'var(--font-nunito)' }}>
                        {DOC_LABELS[docItem.type] || docItem.type}
                      </span>
                      {isRequired && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase"
                          style={{ background: HAlpha.orange10, color: HColors.orangeCI, border: `1px solid ${HAlpha.orange25}` }}>Req.</span>
                      )}
                      <DocStatusBadge status={docItem.status} />
                    </div>
                    {docItem.rejection_reason && docItem.status === 'refuse' && (
                      <p className="text-[10px] mt-1 italic" style={{ color: HColors.bordeaux }}>Motif : {docItem.rejection_reason}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0 justify-end mt-2 xs:mt-0">
                  <a href={fixDocUrl(docItem.url)} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg transition-all hover:opacity-70 flex items-center justify-center"
                    style={{ background: HAlpha.gold08, border: `1px solid ${HAlpha.gold15}`, color: HColors.brownMid }}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  
                  {docItem.status !== 'valide' && (
                    <button onClick={() => onDocAction(docItem.type, 'valide')} disabled={isLoading}
                      className="p-1.5 rounded-lg transition-all hover:scale-110 flex items-center justify-center"
                      style={{ background: HAlpha.vertCI10, border: `1px solid ${HAlpha.vertCI25}`, color: HColors.vertCI }}>
                      {isLoading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  
                  {docItem.status !== 'refuse' && (
                    <button onClick={() => setShowRefusalInput(isShowingRefusal ? null : actionKey)} disabled={isLoading}
                      className="p-1.5 rounded-lg transition-all hover:scale-110 flex items-center justify-center"
                      style={{ background: 'rgba(139,29,29,0.08)', border: '1px solid rgba(139,29,29,0.25)', color: HColors.bordeaux }}>
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isShowingRefusal && (
                <div className="px-3 pb-3 flex flex-col sm:flex-row gap-2 border-t pt-3" style={{ borderColor: HAlpha.gold05 }}>
                  <div className="flex-1 flex gap-2">
                    <input type="text" placeholder="Motif du refus..."
                      value={refusalReasons[actionKey] || ''}
                      onChange={e => setRefusalReasons(prev => ({ ...prev, [actionKey]: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                      style={{ background: 'rgba(139,29,29,0.05)', color: HColors.darkBrown, border: `1px solid ${HAlpha.bord20}` }} />
                    <button onClick={() => setShowRefusalInput(null)} className="p-2 text-brown sm:hidden">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => onDocAction(docItem.type, 'refuse')} disabled={isLoading}
                    className="w-full sm:w-auto px-4 py-2 bg-bordeaux text-white rounded-lg text-xs font-bold transition-all hover:opacity-90"
                    style={{ background: HColors.bordeaux }}>
                    Confirmer le refus
                  </button>
                  <button onClick={() => setShowRefusalInput(null)} className="hidden sm:block p-1.5 text-brown">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {ready && !property.verified_notaire && (
        <div className="mt-6 p-4 rounded-2xl text-center space-y-3"
          style={{ background: 'linear-gradient(135deg, #0D1F12, #1A2E1F)', border: `1px solid ${HAlpha.gold30}` }}>
          <BadgeCheck className="w-8 h-8 mx-auto" style={{ color: HColors.gold }} />
          <div>
            <p className="text-sm font-bold text-cream" style={{ color: HColors.cream }}>Dossier complet & vérifié</p>
            <p className="text-[10px] text-cream/60">Tous les documents requis sont validés. Vous pouvez certifier ce bien.</p>
          </div>
          <button onClick={() => handleCertify(property)} disabled={!!certifyingId}
            className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #D4A017, #FF6B00)', color: '#FFFFFF', boxShadow: '0 4px 15px rgba(212,160,23,0.3)' }}>
            {certifyingId === property.id ? <Loader className="w-4 h-4 mx-auto animate-spin" /> : 'Certifier le bien maintenant'}
          </button>
        </div>
      )}
    </div>
  );
}

function DocStatusBadge({ status }: { status: string }) {
  const cfg: any = {
    valide: { label: 'Validé', bg: HAlpha.vertCI10, text: HColors.vertCI, bd: HAlpha.vertCI25, icon: CheckCircle },
    refuse: { label: 'Refusé', bg: 'rgba(139,29,29,0.08)', text: HColors.bordeaux, bd: 'rgba(139,29,29,0.25)', icon: XCircle },
    en_attente: { label: 'En attente', bg: HAlpha.gold08, text: HColors.gold, bd: HAlpha.gold20, icon: Clock },
  }[status] || { label: status, bg: HAlpha.gold08, text: HColors.gold, bd: HAlpha.gold20, icon: Clock };

  return (
    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
      style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.bd}` }}>
      <cfg.icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}
