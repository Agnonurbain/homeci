import type { PropertyFormData } from '../../PropertyFormBase';
import { HColors, HAlpha } from '../../../styles/homeci-tokens';
import { MapPin } from 'lucide-react';
import LocationPicker from '../../LocationPicker';
import { 
  ALL_DISTRICTS, getRegionsByDistrict, getDepartementsByRegion, 
  getVillesByDepartement, getCommunesByVille, getQuartiersByCommune, getQuartiersByVille 
} from '../../../data/coteIvoireGeo';

interface LocationStepProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onLocationChange: (lat: number, lng: number) => void;
}

const S = {
  input: { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(212,160,23,0.25)', color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' } as React.CSSProperties,
  label: { color: 'rgba(122,85,0,0.8)', fontFamily: 'var(--font-nunito)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' } as React.CSSProperties as any,
};
const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#D4A017]/40';

export default function LocationStep({ formData, onChange, onLocationChange }: LocationStepProps) {
  const regions = formData.district ? getRegionsByDistrict(formData.district) : [];
  const departements = formData.region ? getDepartementsByRegion(formData.region) : [];
  const villes = formData.departement ? getVillesByDepartement(formData.departement) : [];
  const communes = formData.city ? getCommunesByVille(formData.city) : [];
  const quartiers = formData.commune ? getQuartiersByCommune(formData.commune) : formData.city ? getQuartiersByVille(formData.city) : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,158,73,0.1)', border: '1px solid rgba(0,158,73,0.3)' }}>
          <MapPin className="w-5 h-5" style={{ color: '#009E49' }} />
        </div>
        <div>
          <h3 className="font-bold text-lg" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Localisation</h3>
          <p className="text-xs text-[#8B6A30]">Où se situe votre bien exactement ?</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="loc-district" className="block mb-1.5" style={S.label}>District</label>
          <select id="loc-district" name="district" value={formData.district} onChange={onChange} className={inputCls} style={S.input}>
            <option value="">Sélectionner</option>
            {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="loc-region" className="block mb-1.5" style={S.label}>Région</label>
          <select id="loc-region" name="region" value={formData.region} onChange={onChange} disabled={!formData.district} className={inputCls} style={S.input}>
            <option value="">Sélectionner</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="loc-departement" className="block mb-1.5" style={S.label}>Département</label>
          <select id="loc-departement" name="departement" value={formData.departement} onChange={onChange} disabled={!formData.region} className={inputCls} style={S.input}>
            <option value="">Sélectionner</option>
            {departements.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="loc-ville" className="block mb-1.5" style={S.label}>Ville *</label>
          <select id="loc-ville" name="city" value={formData.city} onChange={onChange} disabled={!formData.departement} className={inputCls} style={S.input}>
            <option value="">Sélectionner</option>
            {villes.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="loc-commune" className="block mb-1.5" style={S.label}>Commune</label>
          <select id="loc-commune" name="commune" value={formData.commune} onChange={onChange} disabled={!formData.city} className={inputCls} style={S.input}>
            <option value="">Sélectionner</option>
            {communes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="loc-quartier" className="block mb-1.5" style={S.label}>Quartier</label>
          <select id="loc-quartier" name="quartier" value={formData.quartier} onChange={onChange} disabled={!formData.city} className={inputCls} style={S.input}>
            <option value="">Sélectionner</option>
            {quartiers.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="loc-address" className="block mb-1.5" style={S.label}>Adresse précise (optionnel)</label>
        <input id="loc-address" type="text" name="address" value={formData.address} onChange={onChange} className={inputCls} style={S.input} placeholder="Ex: Rue du Commerce, Immeuble Horizon" />
      </div>

      <div className="h-64 rounded-2xl overflow-hidden border" style={{ borderColor: HAlpha.gold15 }}>
        <LocationPicker 
          latitude={formData.latitude} 
          longitude={formData.longitude} 
          onChange={onLocationChange}
          city={formData.city} 
        />
      </div>
    </div>
  );
}
