import type { PropertyFormData } from '../../PropertyFormBase';
import { HColors, HAlpha } from '../../../styles/homeci-tokens';
import { Home } from 'lucide-react';

interface CharacteristicsStepProps {
  formData: PropertyFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  toggleAmenity: (amenity: string) => void;
}

const AMENITIES_OPTIONS = [
  'Climatisation', 'Eau courante', 'Électricité', 'Internet/WiFi', 'Groupe électrogène',
  'Jardin', 'Piscine', 'Sécurité 24h/24', 'Gardien', 'Terrasse', 'Balcon',
  'Cuisine équipée', 'Garage',
];

const S = {
  input: { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(212,160,23,0.25)', color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' } as React.CSSProperties,
  label: { color: 'rgba(122,85,0,0.8)', fontFamily: 'var(--font-nunito)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' } as React.CSSProperties as any,
  labelSm: { color: 'rgba(192,124,62,0.85)', fontFamily: 'var(--font-nunito)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' } as React.CSSProperties as any,
};
const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none';

export default function CharacteristicsStep({ formData, onChange, toggleAmenity }: CharacteristicsStepProps) {
  const isResidential = ['appartement', 'maison', 'villa'].includes(formData.property_type);
  const isHotel = formData.property_type === 'hotel';
  const isAppartHotel = formData.property_type === 'appart_hotel';
  const isAppartement = formData.property_type === 'appartement';
  const isTerrain = formData.property_type === 'terrain';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,124,62,0.12)', border: '1px solid rgba(192,124,62,0.3)' }}>
          <Home className="w-5 h-5" style={{ color: HColors.orangeCI }} />
        </div>
        <div>
          <h3 className="font-bold text-lg" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Caractéristiques</h3>
          <p className="text-xs text-gray-500">Surface, pièces et équipements</p>
        </div>
      </div>

      {isResidential && (
        <div className="space-y-5">
          <SubSection title="Espace de Vie" color="vert">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FieldGroup label="Surface habitable (m²) *">
                <input type="number" name="surface_area" value={formData.surface_area} onChange={onChange} className={inputCls} style={S.input} min="0" placeholder="0" />
              </FieldGroup>
              <FieldGroup label="Nombre de pièces">
                <input type="number" name="rooms_count" value={formData.rooms_count} onChange={onChange} className={inputCls} style={S.input} min="1" placeholder="Ex: 3" />
              </FieldGroup>
              <FieldGroup label="Année de construction">
                <input type="number" name="annee_construction" value={formData.annee_construction} onChange={onChange} className={inputCls} style={S.input} min="1900" max="2030" placeholder="Ex: 2022" />
              </FieldGroup>
              <FieldGroup label="Chambres">
                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={onChange} className={inputCls} style={S.input} min="0" />
              </FieldGroup>
              <FieldGroup label="Salles de bain">
                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={onChange} className={inputCls} style={S.input} min="0" />
              </FieldGroup>
              {isAppartement ? (
                <FieldGroup label="Niveau (Étage)">
                  <input type="number" name="etage_appartement" value={formData.etage_appartement} onChange={onChange} className={inputCls} style={S.input} min="0" placeholder="0 pour RDC" />
                </FieldGroup>
              ) : (
                <FieldGroup label="Nombre de niveaux">
                  <div className="relative">
                    <input type="number" name="nb_etages" value={formData.nb_etages ?? 0} onChange={onChange} className={inputCls} style={S.input} min="0" />
                    {(!formData.nb_etages || formData.nb_etages === 0) && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none" style={{ color: HAlpha.brown60 }}>
                        Rez-de-chaussée
                      </span>
                    )}
                  </div>
                </FieldGroup>
              )}
            </div>
          </SubSection>

          {!isAppartement && (
            <SubSection title="Terrain & Extérieur" color="orange">
              <div className="grid md:grid-cols-2 gap-4">
                <FieldGroup label="Superficie du terrain (m²)">
                  <input type="number" name="land_area" value={formData.land_area} onChange={onChange} className={inputCls} style={S.input} min="0" />
                </FieldGroup>
                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white/40 transition-colors">
                    <input type="checkbox" name="is_fenced" checked={formData.is_fenced} onChange={onChange} className="w-4 h-4 accent-amber-600" />
                    <span className="text-sm font-medium" style={{ color: HColors.brownDark, fontFamily: 'var(--font-nunito)' }}>Propriété clôturée</span>
                  </label>
                </div>
              </div>
            </SubSection>
          )}

          {isAppartement && (
            <SubSection title="L'immeuble" color="gold">
              <div className="grid md:grid-cols-2 gap-4">
                <FieldGroup label="Total étages de l'immeuble">
                  <input type="number" name="nb_etages_immeuble" value={formData.nb_etages_immeuble} onChange={onChange} className={inputCls} style={S.input} min="1" />
                </FieldGroup>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer p-1">
                    <input type="checkbox" name="ascenseur" checked={formData.ascenseur} onChange={onChange} className="w-4 h-4 accent-amber-600" />
                    <span className="text-sm font-medium" style={{ color: HColors.brownDark, fontFamily: 'var(--font-nunito)' }}>Ascenseur</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1">
                    <input type="checkbox" name="interphone" checked={formData.interphone} onChange={onChange} className="w-4 h-4 accent-amber-600" />
                    <span className="text-sm font-medium" style={{ color: HColors.brownDark, fontFamily: 'var(--font-nunito)' }}>Interphone</span>
                  </label>
                </div>
              </div>
            </SubSection>
          )}
        </div>
      )}

      {isTerrain && (
        <div className="space-y-5">
          <SubSection title="Dimensions & Usage" color="orange">
            <div className="grid md:grid-cols-2 gap-4">
              <FieldGroup label="Superficie totale (m²) *">
                <input type="number" name="land_area" value={formData.land_area} onChange={onChange} className={inputCls} style={S.input} min="0" />
              </FieldGroup>
              <FieldGroup label="Usage du terrain">
                <select name="terrain_type" value={formData.terrain_type} onChange={onChange} className={inputCls} style={S.input}>
                  <option value="residentiel">Résidentiel</option>
                  <option value="agricole">Agricole</option>
                  <option value="industriel">Industriel</option>
                  <option value="commercial">Commercial</option>
                </select>
              </FieldGroup>
            </div>
          </SubSection>

          <SubSection title="État & Aménagements" color="vert">
            <div className="grid md:grid-cols-2 gap-4">
              <FieldGroup label="Topographie (Relief)">
                <select name="topography" value={formData.topography} onChange={onChange} className={inputCls} style={S.input}>
                  <option value="plat">Plat</option>
                  <option value="pente">En pente</option>
                  <option value="accidente">Accidenté / Vallonné</option>
                </select>
              </FieldGroup>
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="has_acd" checked={formData.has_acd} onChange={onChange} className="w-4 h-4 accent-amber-600" />
                  <span className="text-sm font-medium" style={{ color: HColors.brownDark, fontFamily: 'var(--font-nunito)' }}>Possède un ACD</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_serviced" checked={formData.is_serviced} onChange={onChange} className="w-4 h-4 accent-amber-600" />
                  <span className="text-sm font-medium" style={{ color: HColors.brownDark, fontFamily: 'var(--font-nunito)' }}>Terrain viabilisé (Eau/Élec)</span>
                </label>
              </div>
            </div>
          </SubSection>
        </div>
      )}

      {(isHotel || isAppartHotel) && (
        <div className="space-y-5">
          <SubSection title="Établissement" color="vert">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FieldGroup label="Surface totale (m²) *">
                <input type="number" name="surface_area" value={formData.surface_area} onChange={onChange} className={inputCls} style={S.input} min="0" placeholder="0" />
              </FieldGroup>
              <FieldGroup label="Nombre de chambres">
                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={onChange} className={inputCls} style={S.input} min="0" />
              </FieldGroup>
              <FieldGroup label="Salles de bain">
                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={onChange} className={inputCls} style={S.input} min="0" />
              </FieldGroup>
              <FieldGroup label="Étoiles">
                <select name="hotel_stars" value={formData.hotel_stars ?? ''} onChange={onChange} className={inputCls} style={S.input}>
                  <option value="">Non classé</option>
                  <option value="1">1 étoile</option>
                  <option value="2">2 étoiles</option>
                  <option value="3">3 étoiles</option>
                  <option value="4">4 étoiles</option>
                  <option value="5">5 étoiles</option>
                </select>
              </FieldGroup>
              <FieldGroup label="Année de construction">
                <input type="number" name="annee_construction" value={formData.annee_construction} onChange={onChange} className={inputCls} style={S.input} min="1900" max="2030" placeholder="Ex: 2022" />
              </FieldGroup>
              <FieldGroup label="Nombre de niveaux">
                <div className="relative">
                  <input type="number" name="nb_etages" value={formData.nb_etages ?? 0} onChange={onChange} className={inputCls} style={S.input} min="0" />
                  {(!formData.nb_etages || formData.nb_etages === 0) && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold pointer-events-none" style={{ color: HAlpha.brown60 }}>
                      Rez-de-chaussée
                    </span>
                  )}
                </div>
              </FieldGroup>
            </div>
          </SubSection>

          <SubSection title="Services & Équipements" color="gold">
            <div className="grid md:grid-cols-2 gap-4">
              <FieldGroup label="Nombre de restaurants">
                <input type="number" name="nb_restaurants" value={formData.nb_restaurants} onChange={onChange} className={inputCls} style={S.input} min="0" />
              </FieldGroup>
              <div className="flex flex-col justify-center gap-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="has_conference_room" checked={formData.has_conference_room} onChange={onChange} className="w-4 h-4 accent-amber-600" />
                  <span className="text-sm font-medium" style={{ color: HColors.brownDark, fontFamily: 'var(--font-nunito)' }}>Salles de conférence</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="cuisine_par_unite" checked={formData.cuisine_par_unite} onChange={onChange} className="w-4 h-4 accent-amber-600" />
                  <span className="text-sm font-medium" style={{ color: HColors.brownDark, fontFamily: 'var(--font-nunito)' }}>Cuisine équipée</span>
                </label>
              </div>
            </div>
          </SubSection>
        </div>
      )}

      {/* AMENITIES */}
      {!isTerrain && (
        <div className="pt-2">
          <label className="block mb-3" style={S.label}>Commodités & Équipements</label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES_OPTIONS.map(a => {
              const selected = formData.amenities.includes(a);
              return (
                <button key={a} type="button" onClick={() => toggleAmenity(a)} className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border"
                  style={selected
                    ? { background: HAlpha.gold20, color: HColors.darkBrown, border: `1.5px solid ${HColors.gold}` }
                    : { background: 'white', color: HColors.brownMid, border: `1px solid ${HAlpha.gold12}` }}>
                  {a}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SubSection({ title, children, color }: { title: string, children: React.ReactNode, color: 'gold' | 'vert' | 'orange' }) {
  const accent = color === 'gold' ? HColors.gold : color === 'vert' ? HColors.vertCI : HColors.orangeCI;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
        <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent, fontFamily: 'var(--font-nunito)' }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

function FieldGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div>
      <label className="block mb-1.5" style={S.labelSm}>{label}</label>
      {children}
    </div>
  );
}
