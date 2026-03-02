import { useState } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import {
  ALL_DISTRICTS, getRegionsByDistrict, getDepartementsByRegion,
  getVillesByDepartement, getCommunesByVille, getQuartiersByCommune, getQuartiersByVille,
} from '../data/coteIvoireGeo';

interface HeroSearchValues {
  propertyType: string; transactionType: string;
  district: string; region: string; departement: string;
  city: string; commune: string; quartier: string;
}
interface HeroProps { onSearch?: (filters: HeroSearchValues) => void; }

const EMPTY: HeroSearchValues = {
  propertyType:'', transactionType:'', district:'', region:'',
  departement:'', city:'', commune:'', quartier:'',
};

function KenteStripe({ flip = false }: { flip?: boolean }) {
  const bands = [HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',
                 HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',
                 HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',
                 HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D'];
  return (
    <div className="w-full flex" style={{ height:10, transform: flip ? 'scaleY(-1)' : undefined }}>
      {bands.map((c,i) => <div key={i} style={{ flex:1, backgroundColor:c }} />)}
    </div>
  );
}

function AdinkraPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity:0.045 }}
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="adinkra" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <circle cx="40" cy="40" r="28" fill="none" stroke="#D4A017" strokeWidth="1"/>
          <circle cx="40" cy="40" r="18" fill="none" stroke="#D4A017" strokeWidth="0.8"/>
          <circle cx="40" cy="40" r="6"  fill="none" stroke="#D4A017" strokeWidth="1"/>
          <line x1="40" y1="12" x2="40" y2="68" stroke="#D4A017" strokeWidth="0.7"/>
          <line x1="12" y1="40" x2="68" y2="40" stroke="#D4A017" strokeWidth="0.7"/>
          <line x1="20" y1="20" x2="60" y2="60" stroke="#D4A017" strokeWidth="0.4"/>
          <line x1="60" y1="20" x2="20" y2="60" stroke="#D4A017" strokeWidth="0.4"/>
          <circle cx="40" cy="14" r="2" fill="#D4A017"/>
          <circle cx="40" cy="66" r="2" fill="#D4A017"/>
          <circle cx="14" cy="40" r="2" fill="#D4A017"/>
          <circle cx="66" cy="40" r="2" fill="#D4A017"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#adinkra)"/>
    </svg>
  );
}

function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="homeci-float absolute"  style={{ top:'10%', right:'8%',  width:180,height:180, border:'1.5px solid #D4A017', borderRadius:'50%', opacity:0.18 }}/>
      <div className="homeci-float3 absolute" style={{ top:'14%', right:'12%', width:100,height:100, border:'1px solid #D4A017',   borderRadius:'50%', opacity:0.14 }}/>
      <div className="homeci-float2 absolute" style={{ top:'30%', right:'5%',  width:90, height:90,  border:'1.2px solid #C07C3E', transform:'rotate(45deg)', opacity:0.2 }}/>
      <div className="homeci-float2 absolute" style={{ bottom:'18%',left:'4%', width:140,height:140, border:'1.5px solid #D4A017', borderRadius:'50%', opacity:0.12 }}/>
      <div className="homeci-float absolute"  style={{ top:'50%', left:'7%',   width:60, height:60,  border:'1px solid #D4A017',   transform:'rotate(45deg)', opacity:0.22 }}/>
      <div className="homeci-float3 absolute" style={{ top:'65%', left:'18%',  width:50, height:50,  border:'1px solid #C07C3E',   borderRadius:'50%', opacity:0.15 }}/>
      <div className="homeci-float2 absolute" style={{ top:'8%',  left:'12%',  width:70, height:70,  border:'1px solid #D4A017',   transform:'rotate(45deg)', opacity:0.14 }}/>
    </div>
  );
}

function StatCard({ value, label, delay }: { value:string; label:string; delay:string }) {
  return (
    <div className="homeci-reveal-6 flex flex-col items-center gap-1 px-6 py-4 rounded-2xl"
      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,160,23,0.2)',
               backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', animationDelay:delay }}>
      <span className="text-3xl font-bold leading-none"
        style={{ color:HColors.gold, fontFamily:'var(--font-cormorant)' }}>{value}</span>
      <span className="text-xs tracking-wide text-center"
        style={{ color:HColors.cream, opacity:0.7, fontFamily:'var(--font-nunito)' }}>{label}</span>
    </div>
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
  const activeCount = Object.values(f).filter(Boolean).length;

  const darkSel = {
    background:'rgba(13,31,18,0.75)', border:'1px solid rgba(212,160,23,0.22)',
    color:HColors.cream, fontFamily:'var(--font-nunito)',
  } as React.CSSProperties;

  return (
    <section className="relative w-full flex flex-col overflow-hidden"
      style={{ background:'linear-gradient(160deg,#0D1F12 0%,#0D1F12 40%,#1A0E00 100%)', minHeight:'95vh' }}>

      <AdinkraPattern />
      <FloatingShapes />
      <KenteStripe />

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 pt-14 pb-12 text-center">

        {/* Badge */}
        <div className="homeci-reveal-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-semibold"
          style={{ background:HAlpha.gold12, border:'1px solid rgba(212,160,23,0.35)',
                   color:HColors.gold, fontFamily:'var(--font-nunito)', letterSpacing:'0.15em' }}>
          <MapPin size={12} /> CÔTE D'IVOIRE · WEST AFRICA
        </div>

        {/* Title */}
        <h1 className="homeci-reveal-2 leading-tight mb-1"
          style={{ fontFamily:'var(--font-cormorant)', fontSize:'clamp(2.6rem,6vw,5rem)',
                   fontWeight:600, color:HColors.cream, lineHeight:1.15 }}>
          Votre bien idéal,
        </h1>
        <h1 className="homeci-reveal-2 mb-8"
          style={{ fontFamily:'var(--font-cormorant)', fontSize:'clamp(2.6rem,6vw,5rem)',
                   fontWeight:400, fontStyle:'italic', color:HColors.gold,
                   lineHeight:1.15, animationDelay:'0.15s' }}>
          au cœur de l'Afrique
        </h1>

        {/* Subtitle */}
        <p className="homeci-reveal-3 mb-10 max-w-xl leading-relaxed"
          style={{ fontFamily:'var(--font-nunito)', fontSize:'1rem', color:HColors.cream, opacity:0.65 }}>
          Découvrez une sélection exclusive de biens immobiliers vérifiés à travers toute la Côte d'Ivoire
          — sécurisés, certifiés, et adaptés à votre projet de vie.
        </p>

        {/* ── Search panel ── */}
        <div className="homeci-reveal-4 w-full max-w-2xl rounded-2xl p-6 mb-4"
          style={{ background:'rgba(212,160,23,0.07)', border:'1px solid rgba(212,160,23,0.22)',
                   backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)' }}>

          {/* Row: dropdowns + button */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <select value={f.propertyType} onChange={e => upd('propertyType', e.target.value)}
                className="w-full appearance-none rounded-xl px-4 py-3 text-sm pr-9 cursor-pointer focus:outline-none"
                style={{ ...darkSel, color: f.propertyType ? HColors.cream : 'rgba(245,230,200,0.45)' }}>
                <option value="" style={{ background:HColors.night }}>Type de bien</option>
                <option value="appartement"  style={{ background:HColors.night }}>Appartement</option>
                <option value="maison"       style={{ background:HColors.night }}>Maison</option>
                <option value="villa"        style={{ background:HColors.night }}>Villa</option>
                <option value="terrain"      style={{ background:HColors.night }}>Terrain</option>
                <option value="hotel"        style={{ background:HColors.night }}>Hôtel</option>
                <option value="appart_hotel" style={{ background:HColors.night }}>Appart-Hôtel</option>
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:HColors.gold, opacity:0.7 }}/>
            </div>

            <div className="relative flex-1">
              <select value={f.transactionType} onChange={e => upd('transactionType', e.target.value)}
                className="w-full appearance-none rounded-xl px-4 py-3 text-sm pr-9 cursor-pointer focus:outline-none"
                style={{ ...darkSel, color: f.transactionType ? HColors.cream : 'rgba(245,230,200,0.45)' }}>
                <option value="" style={{ background:HColors.night }}>Location / Vente</option>
                <option value="location" style={{ background:HColors.night }}>À louer</option>
                <option value="vente"    style={{ background:HColors.night }}>À vendre</option>
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:HColors.gold, opacity:0.7 }}/>
            </div>

            <button onClick={handleSearch}
              className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
              style={{ background:HColors.green, color:HColors.cream, fontFamily:'var(--font-nunito)', minWidth:130 }}>
              <Search size={15} /> Rechercher
              {activeCount > 0 && (
                <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background:HColors.gold, color:HColors.night }}>{activeCount}</span>
              )}
            </button>
          </div>

          {/* Location toggle */}
          <button type="button" onClick={() => setShowGeo(!showGeo)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm mb-3 transition-all"
            style={{ background:HAlpha.gold08, border:'1px solid rgba(212,160,23,0.2)' }}>
            <span className="flex items-center gap-2">
              <MapPin size={14} style={{ color:HColors.gold }}/>
              <span style={{ color:HColors.gold, fontFamily:'var(--font-nunito)', opacity:0.9 }}>
                {locSummary || "Toute la Côte d'Ivoire"}
              </span>
              {locSummary && <span className="text-xs" style={{ color:'rgba(212,160,23,0.7)' }}>— affinée</span>}
            </span>
            <ChevronDown size={14} className={`transition-transform ${showGeo ? 'rotate-180':''}`} style={{ color:HColors.gold }}/>
          </button>

          {/* Geo cascade */}
          {showGeo && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 p-4 rounded-xl"
              style={{ background:'rgba(13,31,18,0.5)', border:'1px solid rgba(212,160,23,0.15)' }}>
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
                    style={{ color:'rgba(212,160,23,0.7)', fontFamily:'var(--font-nunito)' }}>{label}</label>
                  <div className="relative">
                    <select value={val} disabled={disabled} onChange={e => onChange(e.target.value)}
                      className="w-full appearance-none rounded-xl px-3 py-2.5 text-sm pr-8 focus:outline-none disabled:opacity-40"
                      style={darkSel}>
                      <option value="" style={{ background:HColors.night }}>Tous</option>
                      {opts.map(o => <option key={o} value={o} style={{ background:HColors.night }}>{o}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color:HColors.gold, opacity:0.6 }}/>
                  </div>
                </div>
              ))}
              {locSummary && (
                <div className="col-span-2 md:col-span-3 text-right">
                  <button type="button" onClick={() => setF(p => ({ ...p, district:'', region:'', departement:'', city:'', commune:'', quartier:'' }))}
                    className="text-xs font-medium" style={{ color:HColors.terracotta, fontFamily:'var(--font-nunito)' }}>
                    ✕ Réinitialiser la localisation
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { label:'✦ Vérifié Notaire', type:'',        tx:'' },
              { label:'Terrains',          type:'terrain',  tx:'' },
              { label:'Hôtels',            type:'hotel',    tx:'' },
              { label:'À louer',           type:'',         tx:'location' },
              { label:'À vendre',          type:'',         tx:'vente' },
            ].map(tag => (
              <button key={tag.label}
                onClick={() => {
                  const next = { ...f, ...(tag.type ? { propertyType:tag.type } : {}), ...(tag.tx ? { transactionType:tag.tx } : {}) };
                  setF(next);
                  setTimeout(() => { onSearch?.(next); document.getElementById('property-list')?.scrollIntoView({ behavior:'smooth' }); }, 50);
                }}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-100"
                style={{ background:'rgba(212,160,23,0.07)', border:'1px solid rgba(212,160,23,0.25)',
                         color:HColors.cream, opacity:0.85, fontFamily:'var(--font-nunito)' }}>
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { value:'500+', label:'Biens disponibles' },
            { value:'100%', label:'Sécurisé' },
            { value:'14',   label:'Districts couverts' },
            { value:'24/7', label:'Support client' },
          ].map((s,i) => <StatCard key={s.label} value={s.value} label={s.label} delay={`${1.0+i*0.1}s`}/>)}
        </div>
      </div>

      <KenteStripe flip />
    </section>
  );
}
