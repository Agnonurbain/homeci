import { useState } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import { HColors, HAlpha, HGradients } from '../styles/homeci-tokens';
import { KenteLine } from './ui/KenteLine';
import { HomeCIEmblem } from './HomeCIEmblem';
import {
  ALL_DISTRICTS, getRegionsByDistrict, getDepartementsByRegion,
  getVillesByDepartement, getCommunesByVille, getQuartiersByCommune, getQuartiersByVille,
} from '../data/coteIvoireGeo';

interface HeroSearchValues {
  propertyType: string; propertyTypes: string[]; transactionType: string;
  verifiedNotaire: boolean;
  district: string; region: string; departement: string;
  city: string; commune: string; quartier: string;
}
interface HeroProps { onSearch?: (filters: HeroSearchValues) => void; }

const EMPTY: HeroSearchValues = {
  propertyType:'', propertyTypes:[], transactionType:'', verifiedNotaire:false,
  district:'', region:'', departement:'', city:'', commune:'', quartier:'',
};

/* ── Motif losange Baoulé ─────────────────────────────────────────────────── */
function BaoulePattern() {
  return (
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L45 15L30 30L15 15Z' fill='%23D4A017'/%3E%3Cpath d='M0 30L15 45L0 60' fill='%23D4A017'/%3E%3Cpath d='M60 30L45 45L60 60' fill='%23D4A017'/%3E%3C/svg%3E")`,
      backgroundSize: '60px 60px',
    }} />
  );
}

export function Hero({ onSearch }: HeroProps) {
  const [f, setF] = useState<HeroSearchValues>(EMPTY);
  const [showGeo, setShowGeo] = useState(false);

  const upd = (key: keyof HeroSearchValues, val: string, resets: (keyof HeroSearchValues)[] = []) => {
    setF(prev => { const next = { ...prev, [key]: val }; resets.forEach(k => { next[k] = ''; }); return next; });
  };

  const handleSearch = () => {
    onSearch?.(f);
    document.getElementById('property-list')?.scrollIntoView({ behavior:'smooth' });
  };

  const regions   = f.district    ? getRegionsByDistrict(f.district)      : [];
  const depts     = f.region      ? getDepartementsByRegion(f.region)     : [];
  const villes    = f.departement ? getVillesByDepartement(f.departement) : [];
  const communes  = f.city        ? getCommunesByVille(f.city)            : [];
  const quartiers = f.commune     ? getQuartiersByCommune(f.commune)
                  : f.city        ? getQuartiersByVille(f.city)           : [];

  const locSummary  = [f.quartier,f.commune,f.city,f.departement,f.region,f.district].find(Boolean);
  const activeCount = [
    f.propertyTypes.length > 0, f.verifiedNotaire, !!f.transactionType,
    !!f.district, !!f.region, !!f.departement, !!f.city, !!f.commune, !!f.quartier,
  ].filter(Boolean).length;

  const darkSel = {
    background: 'rgba(10,61,31,0.75)', border: '1px solid rgba(255,255,255,0.12)',
    color: HColors.white, fontFamily: 'var(--font-nunito)',
  } as React.CSSProperties;

  return (
    <section className="relative w-full flex flex-col overflow-hidden"
      style={{ background: HGradients.hero, minHeight: '95vh' }}>

      <BaoulePattern />

      {/* Éléphant watermark */}
      <HomeCIEmblem variant="watermark"
        className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[450px] h-[450px]" />

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 pt-14 pb-12">

        <div className="w-full max-w-3xl">
          {/* Devise */}
          <p className="text-center tracking-[0.2em] text-sm mb-6 italic"
            style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)' }}>
            Union, Discipline, Travail
          </p>

          {/* Titre */}
          <h1 className="text-center leading-tight mb-6"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(2.4rem,6vw,4.5rem)',
                     fontWeight: 700, color: HColors.white, lineHeight: 1.1 }}>
            L'immobilier ivoirien,{' '}
            <br className="hidden md:block" />
            <span style={{ color: HColors.gold }}>certifié & sécurisé.</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-center mb-10 max-w-xl mx-auto leading-relaxed"
            style={{ fontFamily: 'var(--font-nunito)', fontSize: '1rem', color: HAlpha.white70 }}>
            Trouvez votre bien vérifié par notaire dans les 14 districts de Côte d'Ivoire.
            La solidité d'un éléphant au service de vos projets.
          </p>

          {/* ── Barre de recherche glassmorphism ── */}
          <div className="w-full rounded-2xl p-2 mb-4"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                     backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {/* Type de bien */}
              <div className="rounded-xl p-3" style={{ background: HAlpha.white05 }}>
                <label className="block text-[10px] uppercase font-bold mb-1 tracking-wider"
                  style={{ color: HColors.gold, fontFamily: 'var(--font-nunito)' }}>Type de bien</label>
                <div className="relative">
                  <select value={f.propertyType} onChange={e => upd('propertyType', e.target.value)}
                    className="w-full bg-transparent outline-none text-sm appearance-none pr-6 cursor-pointer"
                    style={{ color: f.propertyType ? HColors.white : HAlpha.white50, fontFamily: 'var(--font-nunito)' }}>
                    <option value="" style={{ background: HColors.night }}>Tous</option>
                    <option value="appartement"  style={{ background: HColors.night }}>Appartement</option>
                    <option value="maison"       style={{ background: HColors.night }}>Maison</option>
                    <option value="villa"        style={{ background: HColors.night }}>Villa</option>
                    <option value="terrain"      style={{ background: HColors.night }}>Terrain</option>
                    <option value="hotel"        style={{ background: HColors.night }}>Hôtel</option>
                    <option value="appart_hotel" style={{ background: HColors.night }}>Appart-Hôtel</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: HColors.gold }} />
                </div>
              </div>

              {/* Transaction */}
              <div className="rounded-xl p-3" style={{ background: HAlpha.white05 }}>
                <label className="block text-[10px] uppercase font-bold mb-1 tracking-wider"
                  style={{ color: HColors.gold, fontFamily: 'var(--font-nunito)' }}>Transaction</label>
                <div className="relative">
                  <select value={f.transactionType} onChange={e => upd('transactionType', e.target.value)}
                    className="w-full bg-transparent outline-none text-sm appearance-none pr-6 cursor-pointer"
                    style={{ color: f.transactionType ? HColors.white : HAlpha.white50, fontFamily: 'var(--font-nunito)' }}>
                    <option value="" style={{ background: HColors.night }}>Tous</option>
                    <option value="location" style={{ background: HColors.night }}>Location</option>
                    <option value="vente"    style={{ background: HColors.night }}>Vente</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: HColors.gold }} />
                </div>
              </div>

              {/* Localisation */}
              <div className="rounded-xl p-3 md:col-span-2 cursor-pointer" onClick={() => setShowGeo(!showGeo)}
                style={{ background: HAlpha.white05 }}>
                <label className="block text-[10px] uppercase font-bold mb-1 tracking-wider"
                  style={{ color: HColors.gold, fontFamily: 'var(--font-nunito)' }}>Localisation</label>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1.5"
                    style={{ color: locSummary ? HColors.white : HAlpha.white50, fontFamily: 'var(--font-nunito)' }}>
                    <MapPin size={13} style={{ color: HColors.orangeCI }} />
                    {locSummary || "Toute la Côte d'Ivoire"}
                  </span>
                  <ChevronDown size={12} className={`transition-transform ${showGeo ? 'rotate-180' : ''}`} style={{ color: HColors.gold }} />
                </div>
              </div>

              {/* Bouton recherche */}
              <button onClick={handleSearch}
                className="flex items-center justify-center gap-2 rounded-xl py-3 md:py-0 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
                style={{ background: HGradients.cta, color: HColors.white, fontFamily: 'var(--font-nunito)' }}>
                <Search size={18} />
                Rechercher
                {activeCount > 0 && (
                  <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: HColors.white, color: HColors.orangeCI }}>{activeCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* ── Geo cascade (dropdown) ── */}
          {showGeo && (
            <div className="w-full rounded-2xl p-4 mb-4"
              style={{ background: 'rgba(10,61,31,0.85)', border: '1px solid rgba(255,255,255,0.1)',
                       backdropFilter: 'blur(12px)' }}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { label:'District',    val:f.district,    opts:ALL_DISTRICTS, disabled:false,
                    onChange:(v:string) => upd('district',v,['region','departement','city','commune','quartier']) },
                  { label:'Région',      val:f.region,      opts:regions,  disabled:!regions.length,
                    onChange:(v:string) => upd('region',v,['departement','city','commune','quartier']) },
                  { label:'Département', val:f.departement, opts:depts,    disabled:!depts.length,
                    onChange:(v:string) => upd('departement',v,['city','commune','quartier']) },
                  { label:'Ville',       val:f.city,        opts:villes,   disabled:!villes.length,
                    onChange:(v:string) => upd('city',v,['commune','quartier']) },
                  { label:'Commune',     val:f.commune,     opts:communes, disabled:!communes.length,
                    onChange:(v:string) => upd('commune',v,['quartier']) },
                  { label:'Quartier',    val:f.quartier,    opts:quartiers,disabled:!quartiers.length,
                    onChange:(v:string) => upd('quartier',v) },
                ].map(({ label, val, opts, disabled, onChange }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wider"
                      style={{ color: HAlpha.gold50, fontFamily: 'var(--font-nunito)' }}>{label}</label>
                    <div className="relative">
                      <select value={val} disabled={disabled} onChange={e => onChange(e.target.value)}
                        className="w-full appearance-none rounded-xl px-3 py-2.5 text-sm pr-8 focus:outline-none disabled:opacity-30"
                        style={darkSel}>
                        <option value="" style={{ background: HColors.night }}>Tous</option>
                        {opts.map(o => <option key={o} value={o} style={{ background: HColors.night }}>{o}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: HColors.gold, opacity: 0.6 }} />
                    </div>
                  </div>
                ))}
                {locSummary && (
                  <div className="col-span-2 md:col-span-3 text-right">
                    <button type="button" onClick={() => setF(p => ({ ...p, district:'', region:'', departement:'', city:'', commune:'', quartier:'' }))}
                      className="text-xs font-medium hover:opacity-80"
                      style={{ color: HColors.orangeCI, fontFamily: 'var(--font-nunito)' }}>
                      ✕ Réinitialiser la localisation
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Quick filters ── */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {([
              { label:'✦ Vérifié Notaire', kind:'notaire', value:'notaire'      },
              { label:'Villas',            kind:'type',    value:'villa'        },
              { label:'Terrains',          kind:'type',    value:'terrain'      },
              { label:'Hôtels',            kind:'type',    value:'hotel'        },
              { label:'Appart-Hôtels',     kind:'type',    value:'appart_hotel' },
              { label:'À louer',           kind:'tx',      value:'location'     },
              { label:'À vendre',          kind:'tx',      value:'vente'        },
            ] as {label:string;kind:string;value:string}[]).map(tag => {
              const isActive =
                tag.kind === 'notaire' ? f.verifiedNotaire :
                tag.kind === 'type'    ? f.propertyTypes.includes(tag.value) :
                                         f.transactionType === tag.value;
              const toggle = () => {
                let next = { ...f };
                if (tag.kind === 'notaire') {
                  next.verifiedNotaire = !f.verifiedNotaire;
                } else if (tag.kind === 'type') {
                  const has = f.propertyTypes.includes(tag.value);
                  next.propertyTypes = has
                    ? f.propertyTypes.filter((t: string) => t !== tag.value)
                    : [...f.propertyTypes, tag.value];
                  next.propertyType = next.propertyTypes[0] || '';
                } else {
                  next.transactionType = f.transactionType === tag.value ? '' : tag.value;
                }
                setF(next);
              };
              return (
                <button key={tag.label} onClick={toggle}
                  className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                  style={isActive
                    ? { background: HAlpha.orange25, border: '2px solid ' + HColors.orangeCI,
                        color: HColors.white, fontFamily: 'var(--font-nunito)' }
                    : { background: HAlpha.white05, border: '1px solid rgba(255,255,255,0.15)',
                        color: HAlpha.white70, fontFamily: 'var(--font-nunito)' }}>
                  {tag.label}
                </button>
              );
            })}
            {(f.propertyTypes.length > 0 || f.verifiedNotaire || f.transactionType) && (
              <button onClick={() => {
                  const next = { ...f, propertyTypes:[], propertyType:'', verifiedNotaire:false, transactionType:'' };
                  setF(next); onSearch?.(next);
                }}
                className="px-3 py-2 rounded-full text-xs font-medium transition-all"
                style={{ background: HAlpha.bord15, border: '1px solid rgba(139,29,29,0.40)',
                         color: HColors.errorText, fontFamily: 'var(--font-nunito)' }}>
                ✕ Effacer
              </button>
            )}
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { value: '500+', label: 'Biens disponibles' },
              { value: '100%', label: 'Sécurisé' },
              { value: '14',   label: 'Districts couverts' },
              { value: '24/7', label: 'Support client' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1 px-4 py-4 rounded-2xl"
                style={{ background: HAlpha.white05, border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-3xl font-bold leading-none"
                  style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)' }}>{s.value}</span>
                <span className="text-xs text-center"
                  style={{ color: HAlpha.white50, fontFamily: 'var(--font-nunito)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <KenteLine height={4} />
    </section>
  );
}
