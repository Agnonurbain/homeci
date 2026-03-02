import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, MapPin, Loader, AlertCircle, CheckCircle, Navigation } from 'lucide-react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  latitude:     number | null;
  longitude:    number | null;
  city:         string;
  commune?:     string;
  quartier?:    string;
  district?:    string;
  region?:      string;
  departement?: string;
  onChange: (lat: number, lng: number) => void;
}

// ── Table locale : Abidjan communes ─────────────────────────────────────────
const COMMUNES_CI: Record<string, [number, number]> = {
  'Cocody':       [5.3580,  -3.9780],
  'Plateau':      [5.3190,  -4.0170],
  'Adjamé':       [5.3620,  -4.0270],
  'Abobo':        [5.4180,  -4.0280],
  'Yopougon':     [5.3540,  -4.0740],
  'Marcory':      [5.2980,  -3.9850],
  'Treichville':  [5.2970,  -4.0140],
  'Koumassi':     [5.3010,  -3.9690],
  'Attécoubé':    [5.3530,  -4.0440],
  'Port-Bouët':   [5.2540,  -3.9270],
  'Bingerville':  [5.3560,  -3.8700],
  'Anyama':       [5.4900,  -4.0500],
  'Grand-Bassam': [5.1940,  -3.7410],
};

// ── Table locale : Abidjan quartiers → [lat, lng, zoom] ─────────────────────
// Couverture maximale des quartiers populaires
const QUARTIERS_ABIDJAN: Record<string, [number, number, number]> = {
  // Cocody
  'Angré':              [5.3920, -3.9640, 15],
  'Riviera':            [5.3780, -3.9480, 15],
  'Riviera 2':          [5.3820, -3.9540, 16],
  'Riviera 3':          [5.3840, -3.9580, 16],
  'Riviera 4':          [5.3860, -3.9620, 16],
  'Riviera Palmeraie':  [5.3900, -3.9600, 15],
  'Deux Plateaux':      [5.3650, -3.9690, 15],
  '2 Plateaux':         [5.3650, -3.9690, 15],
  'Vallon':             [5.3720, -3.9700, 15],
  'Danga':              [5.3680, -3.9760, 15],
  'Ambassades':         [5.3600, -3.9720, 15],
  'Blockhauss':         [5.3560, -3.9760, 15],
  'Bonoumin':           [5.3950, -3.9580, 15],
  'Saint-Jean':         [5.3530, -3.9800, 15],
  'Palmeraie':          [5.3900, -3.9560, 15],
  // Plateau
  'Plateau':            [5.3190, -4.0170, 15],
  'Centre-ville':       [5.3170, -4.0150, 15],
  // Marcory / Zone
  'Zone 1':             [5.3000, -3.9800, 15],
  'Zone 2':             [5.2980, -3.9750, 16],
  'Zone 3':             [5.2960, -3.9700, 16],
  'Zone 4':             [5.2950, -3.9650, 16],
  'Zone 4C':            [5.2940, -3.9620, 16],
  'Zone Industrielle':  [5.2920, -3.9800, 15],
  'Marcory':            [5.2980, -3.9850, 15],
  'Anoumabo':           [5.2990, -3.9900, 15],
  'Belleville':         [5.2960, -3.9870, 15],
  'Remblai':            [5.2870, -3.9760, 15],
  // Treichville
  'Treichville':        [5.2970, -4.0140, 15],
  'Washington':         [5.2960, -4.0100, 15],
  // Koumassi
  'Koumassi':           [5.3010, -3.9690, 15],
  'Bromakote':          [5.3060, -3.9650, 15],
  'Grand Campement':    [5.2940, -3.9550, 15],
  // Adjamé
  'Adjamé':             [5.3620, -4.0270, 15],
  '220 logements':      [5.3650, -4.0290, 15],
  'Williamsville':      [5.3700, -4.0240, 15],
  'Salon':              [5.3580, -4.0310, 15],
  // Abobo
  'Abobo':              [5.4180, -4.0280, 15],
  'Abobo Baoulé':       [5.4250, -4.0250, 15],
  'Banco 2':            [5.4050, -4.0150, 15],
  'Sagbé':              [5.4300, -4.0270, 15],
  'Pk 18':              [5.4480, -4.0210, 15],
  'Pk 26':              [5.4900, -4.0100, 15],
  // Yopougon
  'Yopougon':           [5.3540, -4.0740, 15],
  'Selmer':             [5.3600, -4.0800, 16],
  'Niangon':            [5.3620, -4.0870, 16],
  'Niangon Nord':       [5.3640, -4.0890, 16],
  'Niangon Sud':        [5.3600, -4.0850, 16],
  'Ficgayo':            [5.3550, -4.0880, 16],
  'Wassakara':          [5.3500, -4.0810, 16],
  'Kouté':              [5.3480, -4.0900, 15],
  // Attécoubé
  'Attécoubé':          [5.3530, -4.0440, 15],
  'Agban':              [5.3600, -4.0420, 15],
  'Santé':              [5.3510, -4.0480, 15],
  // Port-Bouët
  'Port-Bouët':         [5.2540, -3.9270, 15],
  'Vridi':              [5.2600, -3.9400, 15],
  'Vridi 2':            [5.2580, -3.9370, 16],
  'Vridi Canal':        [5.2570, -3.9350, 16],
  'Biafra':             [5.2490, -3.9190, 15],
  'Gonzagueville':      [5.2460, -3.9120, 15],
  // Grand-Bassam
  'Grand-Bassam':       [5.1940, -3.7410, 14],
  'Moossou':            [5.2020, -3.7560, 15],
  // Bingerville
  'Bingerville':        [5.3560, -3.8700, 14],
};

// ── Table villes Côte d'Ivoire ───────────────────────────────────────────────
const VILLES_CI: Record<string, [number, number]> = {
  'Abidjan':       [5.3600, -4.0083],
  'Bouaké':        [7.6900, -5.0300],
  'Yamoussoukro':  [6.8276, -5.2893],
  'San Pedro':     [4.7490, -6.6363],
  'Daloa':         [6.8770, -6.4503],
  'Korhogo':       [9.4580, -5.6297],
  'Man':           [7.4125, -7.5544],
  'Gagnoa':        [6.1319, -5.9506],
  'Divo':          [5.8370, -5.5704],
  'Abengourou':    [6.7294, -3.4967],
  'Adzopé':        [6.1050, -3.8700],
  'Agboville':     [5.9270, -4.2140],
  'Anyama':        [5.4900, -4.0500],
  'Grand-Bassam':  [5.1940, -3.7410],
  'Jacqueville':   [5.2060, -4.4190],
  'Toumodi':       [6.5560, -5.0190],
  'Tiassalé':      [5.8970, -4.8250],
  'Dabou':         [5.3250, -4.3800],
  'Sikensi':       [5.6630, -4.5640],
};

interface GeoResult { lat: number; lon: number; display_name: string; }

// ── Geocodage Nominatim (meilleure couverture Afrique) ──────────────────────
async function geocodeNominatim(query: string): Promise<GeoResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ci&accept-language=fr`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
  if (!res.ok) throw new Error('Nominatim error');
  const data: any[] = await res.json();
  return data.map(d => ({
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
    display_name: d.display_name,
  }));
}

// ── Lookup local prioritaire ────────────────────────────────────────────────
// Cherche (insensible casse, accent) dans les tables locales
function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function localLookup(quartier: string, commune: string, city: string)
  : { pos: [number, number]; zoom: number; label: string } | null {

  const qn = normalize(quartier);
  const cn = normalize(commune);
  const vin = normalize(city);

  // 1. Quartier exact
  for (const [key, val] of Object.entries(QUARTIERS_ABIDJAN)) {
    if (normalize(key) === qn) return { pos: [val[0], val[1]], zoom: val[2], label: key };
  }

  // 2. Quartier partiel (ex: "Zone 3" dans "Zone 3C")
  if (qn.length >= 3) {
    for (const [key, val] of Object.entries(QUARTIERS_ABIDJAN)) {
      if (normalize(key).includes(qn) || qn.includes(normalize(key))) {
        return { pos: [val[0], val[1]], zoom: val[2], label: key };
      }
    }
  }

  // 3. Commune Abidjan
  for (const [key, val] of Object.entries(COMMUNES_CI)) {
    if (normalize(key) === cn || normalize(key) === vin) {
      return { pos: val, zoom: 14, label: key };
    }
  }

  // 4. Ville CI
  for (const [key, val] of Object.entries(VILLES_CI)) {
    if (normalize(key) === vin || normalize(key) === cn) {
      return { pos: val, zoom: 13, label: key };
    }
  }

  return null;
}

// ── Composants Leaflet ───────────────────────────────────────────────────────
function MapController({ target }: { target: { pos: [number, number]; zoom: number } | null }) {
  const map = useMap();
  const prevRef = useRef('');
  useEffect(() => {
    if (!target) return;
    const key = `${target.pos[0].toFixed(5)},${target.pos[1].toFixed(5)},${target.zoom}`;
    if (key === prevRef.current) return;
    prevRef.current = key;
    map.flyTo(target.pos, target.zoom, { duration: 0.8 });
  }, [target, map]);
  return null;
}

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function LocationPicker({
  latitude, longitude,
  city = '', commune = '', quartier = '',
  district = '', region = '', departement = '',
  onChange,
}: LocationPickerProps) {

  const [position, setPosition]   = useState<[number, number] | null>(
    latitude != null && longitude != null ? [Number(latitude), Number(longitude)] : null
  );
  const [mapTarget, setMapTarget] = useState<{ pos: [number, number]; zoom: number } | null>(null);
  const [geoLabel, setGeoLabel]   = useState('');
  const [autoLoading, setAutoLoading] = useState(false);

  // Recherche manuelle
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop]   = useState(false);
  const [error, setError]         = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);
  const prevKey     = useRef('');

  const defaultCenter: [number, number] = VILLES_CI[city] || [5.3600, -4.0083];

  // ── Auto-ajustement quand les champs géo changent ────────────────────────
  useEffect(() => {
    const key = [district, region, departement, city, commune, quartier].join('|');
    if (key === prevKey.current) return;
    prevKey.current = key;

    if (!city && !commune && !quartier && !departement && !region && !district) return;

    // 1. Lookup local immédiat
    const local = localLookup(quartier || '', commune || '', city || '');
    if (local) {
      setMapTarget({ pos: local.pos, zoom: local.zoom });
      setGeoLabel(local.label);
      if (!position) {
        setPosition(local.pos);
        onChange(local.pos[0], local.pos[1]);
      }
      // Si quartier trouvé localement, pas besoin d'API
      if (quartier && normalize(local.label) === normalize(quartier)) return;
    }

    // 2. Appel Nominatim pour précision (uniquement si quartier ou commune non trouvé localement)
    const parts = [quartier, commune, city, departement, region].filter(Boolean);
    if (parts.length === 0) return;
    const apiQuery = parts.join(', ') + ", Côte d'Ivoire";

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setAutoLoading(true);
      try {
        const r = await geocodeNominatim(apiQuery);
        if (r.length > 0) {
          const zoom = quartier ? 16 : commune ? 14 : city ? 13 : 11;
          const pos: [number, number] = [r[0].lat, r[0].lon];
          setMapTarget({ pos, zoom });
          const shortLabel = r[0].display_name.split(',').slice(0, 2).join(', ');
          setGeoLabel(shortLabel);
          if (!position) {
            setPosition(pos);
            onChange(pos[0], pos[1]);
          }
        }
      } catch { /* silencieux, le lookup local est déjà affiché */ }
      finally { setAutoLoading(false); }
    }, 700);
  }, [district, region, departement, city, commune, quartier]);

  // Fermer dropdown extérieur
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Recherche manuelle ───────────────────────────────────────────────────
  const handleInput = (val: string) => {
    setQuery(val); setError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setResults([]); setShowDrop(false); return; }

    // Lookup local d'abord
    const local = localLookup(val, commune || '', city || '');
    if (local) {
      setResults([{ lat: local.pos[0], lon: local.pos[1], display_name: local.label + (city ? `, ${city}` : '') }]);
      setShowDrop(true);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const ctx = [commune, city].filter(Boolean).join(', ');
        const r = await geocodeNominatim(val + (ctx ? `, ${ctx}` : '') + ", Côte d'Ivoire");
        setResults(r); setShowDrop(r.length > 0);
        if (r.length === 0) setError('Aucun résultat — cliquez directement sur la carte.');
      } catch { setError('Service indisponible — cliquez directement sur la carte.'); }
      finally { setSearching(false); }
    }, 500);
  };

  const selectResult = (r: GeoResult) => {
    const pos: [number, number] = [r.lat, r.lon];
    setPosition(pos); onChange(pos[0], pos[1]);
    setMapTarget({ pos, zoom: 16 });
    setQuery(r.display_name.split(',')[0]);
    setGeoLabel('');
    setShowDrop(false); setResults([]);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]); onChange(lat, lng);
    setGeoLabel('');
  };

  const geoContext = [quartier, commune, city].filter(Boolean).join(', ') || 'Côte d\'Ivoire';

  return (
    <div className="space-y-3">

      {/* Bandeau auto-localisation */}
      {(autoLoading || geoLabel) && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-sm">
          {autoLoading
            ? <><Loader className="w-4 h-4 text-blue-500 animate-spin shrink-0" /><span className="text-blue-700">Localisation en cours…</span></>
            : <><Navigation className="w-4 h-4 text-blue-500 shrink-0" /><span className="text-blue-700">Carte centrée sur : <strong>{geoLabel}</strong></span></>
          }
        </div>
      )}

      {/* Barre de recherche manuelle */}
      <div ref={wrapRef} className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Affiner la position exacte
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && results.length > 0 && selectResult(results[0])}
            onFocus={() => results.length > 0 && setShowDrop(true)}
            placeholder={`Rue, résidence, bâtiment… (${geoContext})`}
            className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {searching && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />}
        </div>

        {showDrop && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            {results.map((r, i) => (
              <button key={i} type="button" onMouseDown={() => selectResult(r)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 transition-colors flex items-start gap-2 border-b last:border-0 border-gray-50">
                <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-gray-700 line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
          </p>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
        <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          La carte se centre automatiquement selon les champs remplis.
          <strong> Cliquez sur la carte</strong> pour affiner la position exacte du bien.
          L'adresse précise reste confidentielle pour les visiteurs.
        </p>
      </div>

      {/* Carte */}
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden" style={{ height: '380px' }}>
        <MapContainer
          center={position || defaultCenter}
          zoom={position ? 15 : 13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController target={mapTarget} />
          <ClickHandler onSelect={handleMapClick} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>

      {/* Statut */}
      {position ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-emerald-700 font-medium">Position enregistrée</span>
          <span className="ml-auto text-emerald-600 text-xs font-mono">
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </span>
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center">
          Aucune position — remplissez les champs de localisation ou cliquez sur la carte
        </p>
      )}
    </div>
  );
}
