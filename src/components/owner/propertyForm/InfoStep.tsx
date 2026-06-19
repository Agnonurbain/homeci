import type { PropertyFormData } from '../../PropertyFormBase';
import { HColors } from '../../../styles/homeci-tokens';
import { Home } from 'lucide-react';

interface InfoStepProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const S = {
  input: { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(212,160,23,0.25)', color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' } as React.CSSProperties,
  label: { color: 'rgba(122,85,0,0.8)', fontFamily: 'var(--font-nunito)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' } as React.CSSProperties as any,
};
const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#D4A017]/40';

export default function InfoStep({ formData, onChange }: InfoStepProps) {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.3)' }}>
          <Home className="w-5 h-5" style={{ color: HColors.gold }} />
        </div>
        <div>
          <h3 className="font-bold text-lg" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Informations essentielles</h3>
          <p className="text-xs text-[#8B6A30]">Type, description et prix du bien</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="info-type" className="block mb-1.5" style={S.label}>Type de bien *</label>
          <select id="info-type" name="property_type" value={formData.property_type} onChange={onChange} className={inputCls} style={S.input}>
            <option value="appartement">Appartement</option>
            <option value="maison">Maison</option>
            <option value="villa">Villa</option>
            <option value="terrain">Terrain</option>
            <option value="hotel">Hôtel</option>
            <option value="appart_hotel">Appart-Hôtel</option>
          </select>
        </div>
        <div>
          <label htmlFor="info-transaction" className="block mb-1.5" style={S.label}>Transaction *</label>
          <select id="info-transaction" name="transaction_type" value={formData.transaction_type} onChange={onChange} className={inputCls} style={S.input}>
            <option value="location">Location</option>
            <option value="vente">Vente</option>
            <option value="both">Location & Vente</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="info-title" className="block mb-1.5" style={S.label}>Titre de l'annonce *</label>
        <input id="info-title" type="text" name="title" value={formData.title} onChange={onChange} className={inputCls} style={S.input} placeholder="Ex: Belle villa avec piscine à Cocody" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="info-price" className="block mb-1.5" style={S.label}>
            Prix {formData.transaction_type !== 'vente' ? '(FCFA/mois)' : '(FCFA)'} *
          </label>
          <input id="info-price" type="number" name="price" value={formData.price} onChange={onChange} className={inputCls} style={S.input} min="0" placeholder="0" />
        </div>
        <div>
          <label htmlFor="info-available-date" className="block mb-1.5" style={S.label}>Disponible à partir du</label>
          <input id="info-available-date" type="date" name="available_from" value={formData.available_from} onChange={onChange} className={inputCls} style={S.input} />
        </div>
      </div>
    </div>
  );
}
