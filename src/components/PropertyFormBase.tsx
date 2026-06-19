import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { propertyService, type PropertyDocument } from '../services/propertyService';
import { useAuth } from '../contexts/AuthContext';
import { usePropertyMedia } from '../hooks/usePropertyMedia';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { KenteLine } from './ui/KenteLine';

// Sub-components
import InfoStep from './owner/propertyForm/InfoStep';
import CharacteristicsStep from './owner/propertyForm/CharacteristicsStep';
import LocationStep from './owner/propertyForm/LocationStep';
import MediaStep from './owner/propertyForm/MediaStep';
import { DocumentsStep } from './DocumentsStep';

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface PropertyFormData {
  title: string;
  property_type: 'appartement' | 'maison' | 'villa' | 'terrain' | 'hotel' | 'appart_hotel';
  transaction_type: 'location' | 'vente' | 'both';
  price: number;
  available_from: string;
  // Location
  district: string;
  region: string;
  departement: string;
  city: string;
  commune: string;
  quartier: string;
  address: string;
  latitude: number;
  longitude: number;
  // Characteristics
  surface_area: number;
  rooms_count: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  annee_construction?: number;
  hotel_stars?: number;
  cuisine_par_unite?: boolean;
  // Dynamic fields
  nb_etages?: number;
  etage_appartement?: number;
  nb_etages_immeuble?: number;
  ascenseur?: boolean;
  interphone?: boolean;
  land_area?: number;
  is_fenced?: boolean;
  terrain_type?: string;
  topography?: string;
  has_acd?: boolean;
  is_serviced?: boolean;
  nb_restaurants?: number;
  has_conference_room?: boolean;
}

interface PropertyFormBaseProps {
  mode: 'create' | 'edit';
  propertyId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = [
  { id: 1, label: 'Infos' },
  { id: 2, label: 'Caractéristiques' },
  { id: 3, label: 'Localisation' },
  { id: 4, label: 'Photos / Vidéos' },
  { id: 5, label: 'Documents Légaux' },
];

/* ── Component ────────────────────────────────────────────────────────────── */

export default function PropertyFormBase({ mode, propertyId, onClose, onSuccess }: PropertyFormBaseProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    property_type: 'appartement',
    transaction_type: 'location',
    price: 0,
    available_from: new Date().toISOString().split('T')[0],
    district: '', region: '', departement: '', city: '', commune: '', quartier: '', address: '',
    latitude: 5.3484, longitude: -4.0305,
    surface_area: 0, rooms_count: 1, bedrooms: 1, bathrooms: 1,
    amenities: [],
  });

  const [docs, setDocs] = useState<PropertyDocument[]>([]);
  
  // Media Hook
  const {
    images, imagePreviews, handleImageChange, removeImage,
    videos, videoPreviews, handleVideoChange, removeVideo,
    existingImages, existingVideos, setExistingImages, setExistingVideos,
    error: mediaError, uploadMedia
  } = usePropertyMedia(mode);

  /* ── Load data for Edit mode ── */
  useEffect(() => {
    if (mode === 'edit' && propertyId) {
      propertyService.getProperty(propertyId).then((p: any) => {
        if (!p) return;
        setFormData({
          title: p.title || '',
          property_type: p.property_type as any || 'appartement',
          transaction_type: p.transaction_type || 'location',
          price: p.price || 0,
          available_from: p.available_from || '',
          district: p.district || '',
          region: p.region || '',
          departement: p.departement || '',
          city: p.city || '',
          commune: p.commune || '',
          quartier: p.quartier || '',
          address: p.address || '',
          latitude: p.latitude || 5.3484,
          longitude: p.longitude || -4.0305,
          surface_area: p.surface_area || 0,
          rooms_count: p.rooms_count || 1,
          bedrooms: p.bedrooms || 1,
          bathrooms: p.bathrooms || 1,
          amenities: p.amenities || [],
          annee_construction: p.annee_construction,
          hotel_stars: p.hotel_stars,
          cuisine_par_unite: p.cuisine_par_unite,
          nb_etages: p.nb_etages,
          etage_appartement: p.etage_appartement,
          nb_etages_immeuble: p.nb_etages_immeuble,
          ascenseur: p.ascenseur,
          interphone: p.interphone,
          land_area: p.land_area,
          is_fenced: p.is_fenced,
          terrain_type: p.terrain_type,
          topography: p.topography,
          has_acd: p.has_acd,
          is_serviced: p.is_serviced,
          nb_restaurants: p.nb_restaurants,
          has_conference_room: p.has_conference_room,
        });
        setDocs(p.documents || []);
        if (p.images) setExistingImages(p.images);
        if (p.videos) setExistingVideos(p.videos);
      });
    }
  }, [mode, propertyId, setExistingImages, setExistingVideos]);

  /* ── Handlers ── */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Logic for checkbox handling
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    }
  };

  const toggleAmenity = (a: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(item => item !== a)
        : [...prev.amenities, a]
    }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const validateStep = () => {
    if (step === 1 && (!formData.title || formData.price <= 0)) return 'Titre et prix obligatoires';
    if (step === 3 && !formData.city) return 'La ville est obligatoire';
    if (step === 5 && docs.length === 0 && mode === 'create') return 'Veuillez téléverser au moins un document justificatif';
    return null;
  };

  const handleSubmit = async () => {
    const error = validateStep();
    if (error) { alert(error); return; }

    setIsSubmitting(true);
    try {
      const raw: Record<string, unknown> = {
        ...formData,
        owner_id: user?.uid || 'unknown',
        documents: docs,
        images: existingImages,
        videos: existingVideos,
        updated_at: new Date().toISOString(),
      };
      if (mode === 'create') raw.status = 'pending';
      // Firestore rejette les valeurs undefined — on les supprime
      const finalData: any = Object.fromEntries(
        Object.entries(raw).filter(([, v]) => v !== undefined)
      );

      let id = propertyId;
      if (mode === 'create') {
        const createdId = await propertyService.createProperty({
          ...finalData,
          status: 'pending',
          verified_notaire: false,
          created_at: new Date().toISOString(),
        } as any);
        id = createdId;
      } else if (id) {
        await propertyService.updateProperty(id, finalData);
      }

      if (id) {
        // Upload images and videos in background (or wait for confirmation)
        uploadMedia(id, user?.uid || 'unknown');
        onSuccess();
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert('Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    const error = validateStep();
    if (error) { alert(error); return; }
    if (step < 5) setStep(step + 1);
    else handleSubmit();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-night/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <KenteLine />
        
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: HAlpha.gold12 }}>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
              {mode === 'create' ? 'Publier un nouveau bien' : 'Modifier le bien'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {STEPS.map(s => (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ background: step === s.id ? HColors.gold : step > s.id ? HColors.vertCI : HAlpha.gold25 }} />
                  {s.id === step && <span className="text-[10px] font-bold uppercase tracking-wider text-gold">{s.label}</span>}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gold/10 text-[#8B6A30] hover:text-gold transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 min-h-[500px]">
          {mediaError && (
            <div className="mb-4 p-3 rounded-xl bg-[rgba(139,29,29,0.10)] border border-[rgba(139,29,29,0.20)] text-[#8B1D1D] text-sm font-medium">
              ⚠️ {mediaError}
            </div>
          )}

          {step === 1 && <InfoStep formData={formData} onChange={handleChange} />}
          {step === 2 && <CharacteristicsStep formData={formData} onChange={handleChange} toggleAmenity={toggleAmenity} />}
          {step === 3 && <LocationStep formData={formData} onChange={handleChange} onLocationChange={handleLocationChange} />}
          {step === 4 && (
            <MediaStep 
              mode={mode} 
              images={images} imagePreviews={imagePreviews} existingImages={existingImages} onImageChange={handleImageChange} onRemoveImage={removeImage}
              videos={videos} videoPreviews={videoPreviews} existingVideos={existingVideos} onVideoChange={handleVideoChange} onRemoveVideo={removeVideo}
            />
          )}
          {step === 5 && (
            <DocumentsStep 
              propertyType={formData.property_type} 
              propertyId={propertyId || 'temp'} 
              documents={docs} 
              onChange={setDocs} 
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t bg-[#FFF8ED] flex items-center justify-between">
          <button 
            type="button"
            onClick={() => setStep(step - 1)}
            disabled={step === 1 || isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-brown transition-all hover:bg-gold/10 disabled:opacity-0"
          >
            <ChevronLeft className="w-4 h-4" /> Précédent
          </button>
          
          <button 
            type="button"
            onClick={nextStep}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFFFFF' }}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : step === 5 ? (
              <><Check className="w-4 h-4" /> {mode === 'create' ? 'Soumettre l\'annonce' : 'Enregistrer'}</>
            ) : (
              <>Suivant <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
