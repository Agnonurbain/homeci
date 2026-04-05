import { 
  Building2, MapPin, User, ChevronDown, Eye, FileCheck, Loader, 
  Phone 
} from 'lucide-react';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { TYPE_LABELS, REQUIRED_DOCS } from '../../constants/labels';
import { getDocStatus, isReadyToCertify } from '../../hooks/useNotaireDashboard';
import { ValidationSection } from './ValidationSection';

export function NotairePropertyCard({ 
  property, 
  owners, 
  activeTab, 
  isExpanded, 
  onToggleExpand, 
  onTakeCharge, 
  takingId,
  ...validationProps 
}: any) {
  const docSt = getDocStatus(property);
  const required = REQUIRED_DOCS[property.property_type] || ['titre_foncier'];
  const owner = owners[property.owner_id];
  const validatedReq = (property.documents || []).filter((d: any) => 
    required.includes(d.type) && d.status === 'valide'
  ).length;
  const pct = required.length > 0 ? Math.round((validatedReq / required.length) * 100) : 0;

  const stColors: any = {
    certifie: { border: HAlpha.vertCI30, bar: HColors.vertCI, label: 'Certifié' },
    complet: { border: HAlpha.navy20, bar: HColors.navy, label: 'Dossier Complet' },
    partiel: { border: HAlpha.gold35, bar: HColors.gold, label: 'En cours' },
    aucun: { border: HAlpha.gold15, bar: HAlpha.gold20, label: 'Aucun document' },
  }[docSt] || { border: HAlpha.gold15, bar: HAlpha.gold20, label: docSt };

  return (
    <div className="rounded-2xl overflow-hidden transition-all mb-3"
      style={{ background: '#FFFFFF', border: `1px solid ${stColors.border}`, boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
      <div className="h-1" style={{ background: stColors.bar, opacity: 0.45 }} />

        <div className="flex flex-col sm:flex-row gap-4 p-4 items-stretch sm:items-start">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {property.images?.[0] ? (
            <img src={property.images[0]} alt={property.title}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0"
              style={{ border: `1px solid ${HAlpha.gold15}` }} />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: HAlpha.gold08, border: `1px solid ${HAlpha.gold15}` }}>
              <Building2 className="w-6 h-6" style={{ color: HAlpha.gold30 }} />
            </div>
          )}
  
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-sm leading-tight truncate"
                style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1rem' }}>
                {property.title}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0"
                style={{ background: stColors.bar, color: '#FFFFFF', boxShadow: `0 2px 8px ${stColors.bar}40` }}>
                {stColors.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] sm:text-xs"
              style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{TYPE_LABELS[property.property_type]}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" style={{ color: HColors.orangeCI }} />{property.city}</span>
              {owner && <span className="flex items-center gap-1 truncate"><User className="w-3 h-3" />{owner.full_name}</span>}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: HAlpha.gold08 }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: pct === 100 ? HColors.vertCI : pct > 0 ? HColors.gold : HAlpha.gold20 }} />
              </div>
              <span className="text-[10px] font-bold shrink-0" style={{ color: HColors.brown }}>{pct}%</span>
            </div>
          </div>
        </div>

        {activeTab === 'disponible' ? (
          <button onClick={() => onTakeCharge(property)} disabled={takingId === property.id}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 w-full sm:w-auto"
            style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF' }}>
            {takingId === property.id ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
            Prendre en charge
          </button>
        ) : (
          <button onClick={onToggleExpand}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all hover:opacity-80 w-full sm:w-auto"
            style={isExpanded
              ? { background: HAlpha.vertCI10, border: `1px solid ${HAlpha.vertCI25}`, color: HColors.vertCI }
              : { background: HAlpha.gold08, border: `1px solid ${HAlpha.gold20}`, color: HColors.brownMid }}>
            <Eye className="w-3.5 h-3.5" />
            {isExpanded ? 'Masquer' : 'Examiner'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="border-t p-4 space-y-4"
          style={{ borderColor: HAlpha.gold15, background: 'rgba(249,243,232,0.3)' }}>
          {owner && (
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: '#FFFFFF', border: `1px solid ${HAlpha.gold15}` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: HAlpha.vertCI10, border: `1px solid ${HAlpha.vertCI20}` }}>
                <User className="w-4 h-4" style={{ color: HColors.vertCI }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: HColors.darkBrown }}>{owner.full_name}</p>
                <div className="flex flex-col sm:flex-row sm:gap-3 gap-0.5 text-xs" style={{ color: HColors.brown }}>
                  {owner.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{owner.phone}</span>}
                  {owner.email && <span className="truncate">{owner.email}</span>}
                </div>
              </div>
            </div>
          )}

          <ValidationSection property={property} isReadyToCertify={isReadyToCertify} {...validationProps} />
        </div>
      )}
    </div>
  );
}
