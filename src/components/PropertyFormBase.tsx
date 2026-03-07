/**
 * PropertyFormBase — Composant partagé pour la création et l'édition de biens
 *
 * Usage:
 *   mode="create" → AddPropertyForm
 *   mode="edit"   → EditPropertyForm (passe propertyId + initialData)
 */
import { useState, useEffect, useRef } from 'react';
import {
  X, ArrowLeft, ArrowRight, Home, MapPin, Image, Check,
  Upload, Trash2, FileText,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { propertyService } from '../services/propertyService';
import { storageService } from '../services/storageService';
import { sanitizePropertyData } from '../utils/propertyDataSanitizer';
import { sanitizePropertyUpdate } from '../utils/propertyDataSanitizer';
import LocationPicker from './LocationPicker';
import {
  ALL_DISTRICTS, getRegionsByDistrict, getDepartementsByRegion,
  getVillesByDepartement, getCommunesByVille, getQuartiersByCommune, getQuartiersByVille,
  getHierarchyByVille, getHierarchyByCommune,
} from '../data/coteIvoireGeo';
import { DocumentsStep } from './DocumentsStep';
import { Property3DViewer } from './Property3DViewer';
import { KenteLine } from './ui/KenteLine';
import type { PropertyInsert, PropertyUpdate, PropertyDocument, Model3D } from '../services/propertyService';
import { HColors, HAlpha, HS } from '../styles/homeci-tokens';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

/* ── Types ─────────────────────────────────────────────────────────────────── */
export interface PropertyFormData {
  title: string;
  property_type: string; transaction_type: string; price: string;
  district: string; region: string; departement: string;
  city: string; commune: string; quartier: string; address: string;
  latitude: number | null; longitude: number | null;
  bedrooms: string; bathrooms: string; surface_area: string; land_area: string;
  rooms_count: string; nb_etages: string; hotel_stars: string;
  etage_appartement: string; nb_etages_immeuble: string; annee_construction: string;
  ascenseur: boolean; interphone: boolean;
  nb_unites: string; surface_par_unite: string; chambres_par_unite: string;
  cuisine_par_unite: boolean; furnished: boolean; parking: boolean;
  amenities: string[]; available_from: string;
}

export const DEFAULT_FORM_DATA: PropertyFormData = {
  title: '', property_type: 'appartement', transaction_type: 'location',
  price: '', city: 'Abidjan', district: '', region: '', departement: '',
  commune: '', quartier: '', address: '', latitude: null, longitude: null,
  bedrooms: '1', bathrooms: '1', surface_area: '', land_area: '',
  rooms_count: '', nb_etages: '1', hotel_stars: '3',
  etage_appartement: '', nb_etages_immeuble: '', annee_construction: '',
  ascenseur: false, interphone: false, nb_unites: '', surface_par_unite: '',
  chambres_par_unite: '', cuisine_par_unite: false,
  furnished: false, parking: false, amenities: [], available_from: '',
};

const AMENITIES_OPTIONS = [
  'Climatisation', 'Eau courante', 'Électricité', 'Internet/WiFi', 'Groupe électrogène',
  'Jardin', 'Piscine', 'Sécurité 24h/24', 'Gardien', 'Terrasse', 'Balcon',
  'Cuisine équipée', 'Garage',
];

const STEPS = [
  { label: 'Infos',           icon: Home },
  { label: 'Caractéristiques', icon: Home },
  { label: 'Localisation',    icon: MapPin },
  { label: 'Médias',          icon: Image },
  { label: 'Documents',       icon: FileText },
];

interface PropertyFormBaseProps {
  mode: 'create' | 'edit';
  propertyId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

/* ── Styles partagés ────────────────────────────────────────────────────────── */
const S = {
  input:        { background:'rgba(255,255,255,0.75)', border:'1px solid rgba(212,160,23,0.25)', color:HColors.darkBrown, fontFamily:'var(--font-nunito)' } as React.CSSProperties,
  inputDisabled:{ background:'rgba(255,255,255,0.4)', border:'1px solid rgba(212,160,23,0.12)', color:'rgba(26,14,0,0.4)', fontFamily:'var(--font-nunito)' } as React.CSSProperties,
  label:        { color:'rgba(122,85,0,0.8)', fontFamily:'var(--font-nunito)', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' } as React.CSSProperties,
  labelSm:      { color:'rgba(192,124,62,0.85)', fontFamily:'var(--font-nunito)', fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' } as React.CSSProperties,
};
const secTitle = { color:HColors.darkBrown, fontFamily:'var(--font-cormorant)', fontSize:'1.15rem', fontWeight:700 } as React.CSSProperties;
const secSub   = { color:HColors.brown, fontFamily:'var(--font-nunito)', fontSize:'0.8rem' } as React.CSSProperties;
const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none';

/* ══════════════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════════════════════ */
export default function PropertyFormBase({ mode, propertyId, onClose, onSuccess }: PropertyFormBaseProps) {
  const { user } = useAuth();
  useBodyScrollLock(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData>(DEFAULT_FORM_DATA);
  const [error, setError] = useState('');

  // État chargement initial (edit uniquement)
  const [loading, setLoading] = useState(mode === 'edit');
  // État sauvegarde finale
  const [saving, setSaving] = useState(false);

  // Médias — Create
  const [images, setImages]             = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Médias — Edit
  const [existingImages, setExistingImages]       = useState<string[]>([]);
  const [newImages, setNewImages]                 = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews]   = useState<string[]>([]);
  const [model3d, setModel3d]                     = useState<Model3D | null>(null);

  // Documents (partagé)
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);

  const totalSteps = 5;

  /* ── Chargement données existantes (mode edit) ── */
  useEffect(() => {
    if (mode !== 'edit' || !propertyId) return;
    (async () => {
      try {
        const data = await propertyService.getProperty(propertyId);
        if (!data) return;
        const getDistrict = () => {
          if (data.district) return data.district;
          const h = data.commune ? getHierarchyByCommune(data.commune) : data.city ? getHierarchyByVille(data.city) : null;
          return h?.district || '';
        };
        const getRegion = () => {
          if (data.region) return data.region;
          const h = data.commune ? getHierarchyByCommune(data.commune) : data.city ? getHierarchyByVille(data.city) : null;
          return h?.region || '';
        };
        const getDept = () => {
          if (data.departement) return data.departement;
          const h = data.commune ? getHierarchyByCommune(data.commune) : data.city ? getHierarchyByVille(data.city) : null;
          return h?.departement || '';
        };
        setFormData({
          title: data.title || '',
          property_type: data.property_type || 'appartement',
          transaction_type: data.transaction_type || 'location',
          price: data.price?.toString() || '',
          city: data.city || 'Abidjan', district: getDistrict(), region: getRegion(),
          departement: getDept(), commune: data.commune || '', quartier: data.quartier || '',
          address: data.address || '', latitude: data.latitude || null, longitude: data.longitude || null,
          bedrooms: data.bedrooms?.toString() || '1', bathrooms: data.bathrooms?.toString() || '1',
          surface_area: data.surface_area?.toString() || '', land_area: (data as any).land_area?.toString() || '',
          rooms_count: (data as any).rooms_count?.toString() || '', nb_etages: (data as any).nb_etages?.toString() || '1',
          hotel_stars: (data as any).hotel_stars?.toString() || '3',
          etage_appartement: (data as any).etage_appartement?.toString() || '',
          nb_etages_immeuble: (data as any).nb_etages_immeuble?.toString() || '',
          annee_construction: (data as any).annee_construction?.toString() || '',
          ascenseur: (data as any).ascenseur || false, interphone: (data as any).interphone || false,
          nb_unites: (data as any).nb_unites?.toString() || '',
          surface_par_unite: (data as any).surface_par_unite?.toString() || '',
          chambres_par_unite: (data as any).chambres_par_unite?.toString() || '',
          cuisine_par_unite: (data as any).cuisine_par_unite || false,
          furnished: data.furnished || false, parking: data.parking || false,
          amenities: data.amenities || [], available_from: data.available_from || '',
        });
        setExistingImages(data.images || []);
        setDocuments(data.documents || []);
        setModel3d((data as any).model3d || null);
      } catch (e) {
        setError('Impossible de charger les données du bien.');
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, propertyId]);

  /* ── Handlers communs ── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleAmenity = (amenity: string, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  /* ── Gestion images (Create) ── */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    const current = mode === 'create' ? images.length : existingImages.length + newImages.length;
    if (current + files.length > 15) { setError('Maximum 15 photos autorisées'); return; }
    if (mode === 'create') {
      setImages(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    } else {
      setNewImages(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setNewImagePreviews(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    if (mode === 'create') {
      setImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };
  const removeExistingImage = (index: number) => setExistingImages(prev => prev.filter((_, i) => i !== index));
  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  /* ── Validation ── */
  const validateStep = (step: number): boolean => {
    setError('');
    if (step === 1) {
      if (!formData.title.trim()) {
        setError('Veuillez remplir le titre de l\'annonce'); return false;
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        setError('Veuillez entrer un prix valide'); return false;
      }
    }
    if (step === 2) {
      if (formData.property_type === 'terrain' && (!formData.land_area || parseFloat(formData.land_area) <= 0)) {
        setError('Veuillez entrer la superficie du terrain'); return false;
      }
      if ((formData.property_type === 'hotel' || formData.property_type === 'appart_hotel') && (!formData.rooms_count || parseInt(formData.rooms_count) < 1)) {
        setError('Veuillez indiquer le nombre de chambres'); return false;
      }
      if (['appartement', 'maison', 'villa'].includes(formData.property_type) && (!formData.surface_area || parseFloat(formData.surface_area) <= 0)) {
        setError('Veuillez entrer une surface habitable'); return false;
      }
    }
    if (step === 3 && !formData.city) {
      setError('Veuillez sélectionner la ville'); return false;
    }
    return true;
  };

  const handleNext     = () => { if (validateStep(currentStep)) setCurrentStep(p => Math.min(p + 1, totalSteps)); };
  const handlePrevious = () => { setError(''); setCurrentStep(p => Math.max(p - 1, 1)); };

  /* ── Soumission ── */
  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    if (mode === 'create' && currentStep < totalSteps) return;
    setSaving(true); setError('');

    try {
      if (mode === 'create') {
        const propertyData: PropertyInsert = {
          ...sanitizePropertyData(formData),
          owner_id: user.uid, status: 'pending', images: [],
          documents: [], verified_notaire: false, verification_date: null,
          views_count: 0, featured: false,
        };
        const newId = await propertyService.createProperty(propertyData);
        onSuccess(); onClose();

        const updates: Record<string, unknown> = {};
        if (documents.length > 0) updates.documents = documents;
        if (Object.keys(updates).length > 0) propertyService.updateProperty(newId, updates).catch(() => {});

        if (images.length > 0) {
          (async () => {
            const urls: string[] = [];
            for (const file of images) {
              try {
                const url = await Promise.race([
                  storageService.uploadImage(file, `properties/${user.uid}/${newId}`),
                  new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000)),
                ]);
                urls.push(url);
              } catch { /* continue */ }
            }
            if (urls.length > 0) await propertyService.updateProperty(newId, { images: urls });
          })().catch(() => {});
        }

      } else if (propertyId) {
        const propertyData: PropertyUpdate = sanitizePropertyUpdate(formData);
        await propertyService.updateProperty(propertyId, { ...propertyData, images: existingImages, documents, model3d } as any);
        onSuccess(); onClose();

        if (newImages.length > 0) {
          const base = [...existingImages];
          const toUpload = [...newImages];
          (async () => {
            const urls: string[] = [];
            for (const file of toUpload) {
              try {
                const url = await Promise.race([
                  storageService.uploadImage(file, `${user.uid}/${propertyId}`),
                  new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000)),
                ]);
                urls.push(url);
              } catch { /* continue */ }
            }
            if (urls.length > 0) await propertyService.updateProperty(propertyId, { images: [...base, ...urls] });
          })().catch(() => {});
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setSaving(false);
    }
  };

  /* ── Dérivés ── */
  const isResidential  = ['appartement', 'maison', 'villa'].includes(formData.property_type);
  const isHotel        = formData.property_type === 'hotel';
  const isAppartHotel  = formData.property_type === 'appart_hotel';
  const isAppartement  = formData.property_type === 'appartement';
  const isTerrain      = formData.property_type === 'terrain';
  const totalPhotos    = mode === 'create' ? images.length : existingImages.length + newImages.length;

  const regions      = formData.district ? getRegionsByDistrict(formData.district) : [];
  const departements = formData.region   ? getDepartementsByRegion(formData.region) : [];
  const villes       = formData.departement ? getVillesByDepartement(formData.departement) : [];
  const communes     = formData.city     ? getCommunesByVille(formData.city) : [];
  const quartiers    = formData.commune  ? getQuartiersByCommune(formData.commune) : formData.city ? getQuartiersByVille(formData.city) : [];

  const isSubmitting  = saving;
  const isInitLoading = loading;

  /* ── Écran de chargement initial (edit) ── */
  if (isInitLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background:'rgba(0,0,0,0.78)', backdropFilter:'blur(4px)' }}>
        <div className="p-8 rounded-2xl flex flex-col items-center gap-4"
          style={{ background:HColors.night, border:'1px solid rgba(212,160,23,0.3)' }}>
          <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
            style={{ borderColor:HAlpha.gold20, borderTopColor:HColors.gold }} />
          <p className="text-sm" style={{ color:HAlpha.cream60, fontFamily:'var(--font-nunito)' }}>
            Chargement du bien…
          </p>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     RENDU PRINCIPAL
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4"
      style={{ background:'rgba(0,0,0,0.78)', backdropFilter:'blur(4px)' }}>
      <div className="w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col"
        style={{ maxHeight:'95vh', background:HColors.creamBg,
                 border:'1px solid rgba(212,160,23,0.2)', boxShadow:'0 24px 60px rgba(26,14,0,0.35)' }}>

        {/* ── Header ── */}
        <div className="sticky top-0 z-20 flex-shrink-0"
          style={{ background:HColors.night, borderBottom:'1px solid rgba(212,160,23,0.2)' }}>
          <KenteLine />
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background:HAlpha.gold15, border:'1px solid rgba(212,160,23,0.3)' }}>
                <Home className="w-3.5 h-3.5" style={{ color:HColors.gold }} />
              </div>
              <h2 className="font-bold"
                style={{ color:HColors.cream, fontFamily:'var(--font-cormorant)', fontSize:'1.4rem' }}>
                {mode === 'create' ? 'Publier un bien' : 'Modifier le bien'}
              </h2>
            </div>
            <button aria-label="Fermer" onClick={onClose}
              className="p-1.5 rounded-full transition-all hover:opacity-70"
              style={{ background:HAlpha.gold10, border:'1px solid rgba(212,160,23,0.2)' }}>
              <X className="w-4 h-4" style={{ color:HColors.gold }} />
            </button>
          </div>

          {/* Stepper */}
          <div className="px-5 pb-4 flex items-center gap-1">
            {STEPS.map((step, idx) => {
              const n = idx + 1;
              const isActive    = currentStep === n;
              const isCompleted = currentStep > n;
              return (
                <div key={n} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={isActive
                        ? { background:HColors.gold, color:HColors.night }
                        : isCompleted
                          ? { background:HAlpha.gold18, color:HColors.gold, border:'1px solid rgba(212,160,23,0.4)' }
                          : { background:'rgba(245,230,200,0.07)', color:'rgba(245,230,200,0.3)', border:'1px solid rgba(245,230,200,0.1)' }}>
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : n}
                    </div>
                    <span className="hidden sm:block text-center transition-colors"
                      style={{ fontSize:'0.6rem', fontFamily:'var(--font-nunito)', fontWeight:600,
                               color: isActive ? HColors.gold : isCompleted ? 'rgba(212,160,23,0.6)' : 'rgba(245,230,200,0.25)' }}>
                      {step.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-1.5"
                      style={{ background: currentStep > n ? HColors.gold : 'rgba(245,230,200,0.1)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Corps scrollable ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* Erreur */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
              style={{ background:'rgba(139,29,29,0.15)', border:'1px solid rgba(139,29,29,0.3)',
                       color:HColors.errorText, fontFamily:'var(--font-nunito)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>

            {/* ══════════ ÉTAPE 1 : Infos essentielles ══════════ */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <SectionHeader icon={<Home className="w-5 h-5" style={{ color:HColors.gold }} />}
                  iconBg="rgba(212,160,23,0.15)" iconBorder="rgba(212,160,23,0.3)"
                  title="Informations essentielles" subtitle="Type, description et prix du bien" />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5" style={S.label}>Type de bien *</label>
                    <select name="property_type" value={formData.property_type} onChange={handleChange}
                      className={inputCls} style={S.input}>
                      <option value="appartement">Appartement</option>
                      <option value="maison">Maison</option>
                      <option value="villa">Villa</option>
                      <option value="terrain">Terrain</option>
                      <option value="hotel">Hôtel</option>
                      <option value="appart_hotel">Appart-Hôtel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5" style={S.label}>Transaction *</label>
                    <select name="transaction_type" value={formData.transaction_type} onChange={handleChange}
                      className={inputCls} style={S.input}>
                      <option value="location">Location</option>
                      <option value="vente">Vente</option>
                      <option value="both">Location & Vente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5" style={S.label}>Titre de l'annonce *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange}
                    className={inputCls} style={S.input} placeholder="Ex: Belle villa avec piscine à Cocody" />
                </div>

                

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5" style={S.label}>
                      Prix {formData.transaction_type !== 'vente' ? '(FCFA/mois)' : '(FCFA)'} *
                    </label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange}
                      className={inputCls} style={S.input} min="0" placeholder="0" />
                  </div>
                  <div>
                    <label className="block mb-1.5" style={S.label}>Disponible à partir du</label>
                    <input type="date" name="available_from" value={formData.available_from} onChange={handleChange}
                      className={inputCls} style={S.input} />
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ ÉTAPE 2 : Caractéristiques ══════════ */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <SectionHeader icon={<Home className="w-5 h-5" style={{ color:HColors.terracotta }} />}
                  iconBg="rgba(192,124,62,0.12)" iconBorder="rgba(192,124,62,0.3)"
                  title="Caractéristiques" subtitle="Surface, pièces et équipements" />

                {/* Résidentiel */}
                {isResidential && (
                  <div className="space-y-4">
                    <SubSection title="L'appartement / le logement" color="green">
                      <div className="grid md:grid-cols-2 gap-3">
                        <FieldGroup label="Surface habitable (m²) *">
                          <input type="number" name="surface_area" value={formData.surface_area}
                            onChange={handleChange} className={inputCls} style={S.input} min="0" placeholder="0" />
                        </FieldGroup>
                        <FieldGroup label="Chambres">
                          <input type="number" name="bedrooms" value={formData.bedrooms}
                            onChange={handleChange} className={inputCls} style={S.input} min="0" />
                        </FieldGroup>
                        <FieldGroup label="Salles de bain">
                          <input type="number" name="bathrooms" value={formData.bathrooms}
                            onChange={handleChange} className={inputCls} style={S.input} min="0" />
                        </FieldGroup>
                        {isAppartement && (
                          <FieldGroup label="Étage">
                            <input type="number" name="etage_appartement" value={formData.etage_appartement}
                              onChange={handleChange} className={inputCls} style={S.input} min="0" />
                          </FieldGroup>
                        )}
                        <FieldGroup label="Année de construction">
                          <input type="number" name="annee_construction" value={formData.annee_construction}
                            onChange={handleChange} className={inputCls} style={S.input} min="1900" max="2030" />
                        </FieldGroup>
                      </div>
                      {isAppartement && (
                        <div className="flex gap-4 mt-2 flex-wrap">
                          {[
                            { name:'ascenseur', label:'Ascenseur' },
                            { name:'interphone', label:'Interphone' },
                          ].map(cb => (
                            <label key={cb.name} className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" name={cb.name}
                                checked={formData[cb.name as keyof PropertyFormData] as boolean}
                                onChange={handleChange} className="accent-amber-600" />
                              <span className="text-sm" style={{ color:HColors.brownDark, fontFamily:'var(--font-nunito)' }}>
                                {cb.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </SubSection>

                    {isAppartement && (
                      <SubSection title="L'immeuble" color="gold">
                        <FieldGroup label="Nombre d'étages de l'immeuble">
                          <input type="number" name="nb_etages_immeuble" value={formData.nb_etages_immeuble}
                            onChange={handleChange} className={inputCls} style={S.input} min="1" />
                        </FieldGroup>
                      </SubSection>
                    )}
                  </div>
                )}

                {/* Terrain */}
                {isTerrain && (
                  <SubSection title="Le terrain" color="terracotta">
                    <FieldGroup label="Superficie du terrain (m²) *">
                      <input type="number" name="land_area" value={formData.land_area}
                        onChange={handleChange} className={inputCls} style={S.input} min="0" />
                    </FieldGroup>
                  </SubSection>
                )}

                {/* Hôtel */}
                {isHotel && (
                  <SubSection title="L'hôtel" color="gold">
                    <div className="grid md:grid-cols-2 gap-3">
                      <FieldGroup label="Nombre total de chambres *">
                        <input type="number" name="rooms_count" value={formData.rooms_count}
                          onChange={handleChange} className={inputCls} style={S.input} min="1" />
                      </FieldGroup>
                      <FieldGroup label="Nombre d'étages">
                        <input type="number" name="nb_etages" value={formData.nb_etages}
                          onChange={handleChange} className={inputCls} style={S.input} min="1" />
                      </FieldGroup>
                    </div>
                    <div className="mt-3">
                      <p className="mb-2" style={S.labelSm}>Classement étoiles</p>
                      <div className="flex gap-2 flex-wrap">
                        {[1,2,3,4,5].map(star => (
                          <button key={star} type="button"
                            onClick={() => setFormData(prev => ({ ...prev, hotel_stars: star.toString() }))}
                            className="w-10 h-10 rounded-xl font-bold text-sm transition-all"
                            style={parseInt(formData.hotel_stars) === star
                              ? { background:HColors.gold, color:HColors.night, border:'2px solid #D4A017' }
                              : { background:'rgba(255,255,255,0.6)', color:HColors.brown, border:'1px solid rgba(212,160,23,0.25)' }}>
                            {star}★
                          </button>
                        ))}
                      </div>
                    </div>
                  </SubSection>
                )}

                {/* Appart-Hôtel */}
                {isAppartHotel && (
                  <div className="space-y-4">
                    <SubSection title="La résidence" color="terracotta">
                      <div className="grid md:grid-cols-2 gap-3">
                        <FieldGroup label="Nombre total d'unités *">
                          <input type="number" name="rooms_count" value={formData.rooms_count}
                            onChange={handleChange} className={inputCls} style={S.input} min="1" />
                        </FieldGroup>
                        <FieldGroup label="Nombre d'étages">
                          <input type="number" name="nb_etages" value={formData.nb_etages}
                            onChange={handleChange} className={inputCls} style={S.input} min="1" />
                        </FieldGroup>
                      </div>
                      <div className="mt-3">
                        <p className="mb-2" style={S.labelSm}>Classement</p>
                        <div className="flex gap-2 flex-wrap">
                          {[1,2,3,4,5].map(star => (
                            <button key={star} type="button"
                              onClick={() => setFormData(prev => ({ ...prev, hotel_stars: star.toString() }))}
                              className="w-10 h-10 rounded-xl font-bold text-sm transition-all"
                              style={parseInt(formData.hotel_stars) === star
                                ? { background:HColors.gold, color:HColors.night }
                                : { background:'rgba(255,255,255,0.6)', color:HColors.brown, border:'1px solid rgba(212,160,23,0.25)' }}>
                              {star}★
                            </button>
                          ))}
                        </div>
                      </div>
                    </SubSection>
                    <SubSection title="Chaque unité" color="navy">
                      <div className="grid md:grid-cols-3 gap-3">
                        <FieldGroup label="Surface (m²)">
                          <input type="number" name="surface_par_unite" value={formData.surface_par_unite}
                            onChange={handleChange} className={inputCls} style={S.input} min="0" />
                        </FieldGroup>
                        <FieldGroup label="Chambres">
                          <input type="number" name="chambres_par_unite" value={formData.chambres_par_unite}
                            onChange={handleChange} className={inputCls} style={S.input} min="1" />
                        </FieldGroup>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer mt-2">
                        <input type="checkbox" name="cuisine_par_unite"
                          checked={formData.cuisine_par_unite} onChange={handleChange} className="accent-amber-600" />
                        <span className="text-sm" style={{ color:HColors.brownDark, fontFamily:'var(--font-nunito)' }}>Cuisine dans chaque unité</span>
                      </label>
                    </SubSection>
                  </div>
                )}

                {/* Équipements (tous sauf terrain) */}
                {!isTerrain && (
                  <SubSection title="Équipements & Services" color="green">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {AMENITIES_OPTIONS.map(amenity => (
                        <button key={amenity} type="button"
                          onClick={(e) => toggleAmenity(amenity, e)}
                          className="px-3 py-2 rounded-xl text-xs font-medium text-left transition-all"
                          style={formData.amenities.includes(amenity)
                            ? { background:HAlpha.gold15, border:'1px solid rgba(212,160,23,0.5)', color:HColors.darkBrown, fontFamily:'var(--font-nunito)' }
                            : { background:'rgba(255,255,255,0.6)', border:'1px solid rgba(212,160,23,0.15)', color:HColors.brownDark, fontFamily:'var(--font-nunito)' }}>
                          {amenity}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-3 flex-wrap">
                      {[
                        { name:'furnished', label:'Meublé' },
                        { name:'parking', label:'Parking disponible' },
                      ].map(cb => (
                        <label key={cb.name} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name={cb.name}
                            checked={formData[cb.name as keyof PropertyFormData] as boolean}
                            onChange={handleChange} className="accent-amber-600" />
                          <span className="text-sm" style={{ color:HColors.brownDark, fontFamily:'var(--font-nunito)' }}>
                            {cb.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </SubSection>
                )}
              </div>
            )}

            {/* ══════════ ÉTAPE 3 : Localisation ══════════ */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <SectionHeader icon={<MapPin className="w-5 h-5" style={{ color:HColors.green }} />}
                  iconBg="rgba(45,106,79,0.12)" iconBorder="rgba(45,106,79,0.3)"
                  title="Localisation" subtitle="Positionnez le bien sur la carte" />

                <div className="grid md:grid-cols-2 gap-4">
                  {/* District */}
                  <FieldGroup label="District">
                    <select name="district" value={formData.district}
                      onChange={e => setFormData(prev => ({ ...prev, district: e.target.value, region:'', departement:'', city:'', commune:'', quartier:'' }))}
                      className={inputCls} style={S.input}>
                      <option value="">— Sélectionner —</option>
                      {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </FieldGroup>
                  {/* Région */}
                  <FieldGroup label="Région">
                    <select name="region" value={formData.region}
                      onChange={e => setFormData(prev => ({ ...prev, region: e.target.value, departement:'', city:'', commune:'', quartier:'' }))}
                      className={inputCls} style={regions.length === 0 ? S.inputDisabled : S.input}
                      disabled={regions.length === 0}>
                      <option value="">— Sélectionner —</option>
                      {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </FieldGroup>
                  {/* Département */}
                  <FieldGroup label="Département">
                    <select name="departement" value={formData.departement}
                      onChange={e => setFormData(prev => ({ ...prev, departement: e.target.value, city:'', commune:'', quartier:'' }))}
                      className={inputCls} style={departements.length === 0 ? S.inputDisabled : S.input}
                      disabled={departements.length === 0}>
                      <option value="">— Sélectionner —</option>
                      {departements.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </FieldGroup>
                  {/* Ville */}
                  <FieldGroup label="Ville *">
                    <select name="city" value={formData.city}
                      onChange={e => setFormData(prev => ({ ...prev, city: e.target.value, commune:'', quartier:'' }))}
                      className={inputCls} style={S.input}>
                      <option value="">— Sélectionner —</option>
                      {(villes.length > 0 ? villes : ['Abidjan','Bouaké','San-Pédro','Yamoussoukro']).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </FieldGroup>
                  {/* Commune */}
                  {communes.length > 0 && (
                    <FieldGroup label="Commune">
                      <select name="commune" value={formData.commune}
                        onChange={e => setFormData(prev => ({ ...prev, commune: e.target.value, quartier:'' }))}
                        className={inputCls} style={S.input}>
                        <option value="">— Sélectionner —</option>
                        {communes.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </FieldGroup>
                  )}
                  {/* Quartier */}
                  {quartiers.length > 0 && (
                    <FieldGroup label="Quartier">
                      <select name="quartier" value={formData.quartier}
                        onChange={e => setFormData(prev => ({ ...prev, quartier: e.target.value }))}
                        className={inputCls} style={S.input}>
                        <option value="">— Sélectionner —</option>
                        {quartiers.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </FieldGroup>
                  )}
                  {/* Adresse */}
                  <FieldGroup label="Adresse">
                    <input type="text" name="address" value={formData.address} onChange={handleChange}
                      className={inputCls} style={S.input} placeholder="Rue, numéro, immeuble…" />
                  </FieldGroup>
                </div>

                <LocationPicker
                  latitude={formData.latitude} longitude={formData.longitude}
                  city={formData.city} quartier={formData.quartier}
                  onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                />
              </div>
            )}

            {/* ══════════ ÉTAPE 4 : Médias ══════════ */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <SectionHeader icon={<Image className="w-5 h-5" style={{ color:HColors.terracotta }} />}
                  iconBg="rgba(192,124,62,0.12)" iconBorder="rgba(192,124,62,0.3)"
                  title="Photos" subtitle={`${totalPhotos}/15 photos ajoutées`} />

                {/* Photos existantes (edit) */}
                {mode === 'edit' && existingImages.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider"
                      style={{ color:'rgba(122,85,0,0.7)', fontFamily:'var(--font-nunito)' }}>
                      Photos actuelles
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {existingImages.map((url, i) => (
                        <div key={i} className="relative rounded-xl overflow-hidden group aspect-square"
                          style={{ border:'1px solid rgba(212,160,23,0.2)' }}>
                          <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-xs font-bold"
                              style={{ background:HColors.gold, color:HColors.night, fontFamily:'var(--font-nunito)' }}>
                              Principal
                            </span>
                          )}
                          <button type="button" aria-label="Supprimer cette photo"
                            onClick={() => removeExistingImage(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background:HColors.bordeaux }}>
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nouvelles photos */}
                {mode === 'create' && imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden group aspect-square"
                        style={{ border:'1px solid rgba(212,160,23,0.2)' }}>
                        <img src={src} alt={`Aperçu ${i + 1}`} className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-xs font-bold"
                            style={{ background:HColors.gold, color:HColors.night, fontFamily:'var(--font-nunito)' }}>
                            Principal
                          </span>
                        )}
                        <button type="button" aria-label="Supprimer cette photo"
                          onClick={() => removeImage(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background:HColors.bordeaux }}>
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {mode === 'edit' && newImagePreviews.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider"
                      style={{ color:'rgba(122,85,0,0.7)', fontFamily:'var(--font-nunito)' }}>
                      Nouvelles photos à ajouter
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {newImagePreviews.map((src, i) => (
                        <div key={i} className="relative rounded-xl overflow-hidden group aspect-square"
                          style={{ border:'2px solid rgba(212,160,23,0.5)' }}>
                          <img src={src} alt={`Nouvelle photo ${i + 1}`} className="w-full h-full object-cover" />
                          <button type="button" aria-label="Supprimer cette photo"
                            onClick={() => removeNewImage(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background:HColors.bordeaux }}>
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zone d'upload */}
                {totalPhotos < 15 && (
                  <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl cursor-pointer transition-all hover:opacity-90"
                    style={{ background:HAlpha.gold05, border:'2px dashed rgba(212,160,23,0.3)' }}>
                    <Upload className="w-8 h-8" style={{ color:'rgba(212,160,23,0.7)' }} />
                    <div className="text-center">
                      <p className="text-sm font-semibold" style={{ color:HColors.brownMid, fontFamily:'var(--font-nunito)' }}>
                        Ajouter des photos
                      </p>
                      <p className="text-xs mt-0.5" style={{ color:'rgba(139,106,48,0.55)', fontFamily:'var(--font-nunito)' }}>
                        {totalPhotos}/15 — JPEG, PNG, WebP
                      </p>
                    </div>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                )}

                {/* Visionneuse 3D (edit uniquement) */}
                {mode === 'edit' && model3d && (
                  <div className="pt-4" style={{ borderTop:'1px solid rgba(212,160,23,0.18)' }}>
                    <p className="text-sm font-semibold mb-2" style={{ color:HColors.brownDeep, fontFamily:'var(--font-nunito)' }}>
                      ⬡ Modèle 3D existant
                    </p>
                    <Property3DViewer model3d={model3d} propertyTitle="Aperçu 3D" />
                  </div>
                )}
              </div>
            )}

            {/* ══════════ ÉTAPE 5 : Documents ══════════ */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <SectionHeader icon={<FileText className="w-5 h-5" style={{ color:HColors.navy }} />}
                  iconBg="rgba(26,58,107,0.12)" iconBorder="rgba(26,58,107,0.25)"
                  title="Documents" subtitle="Titres fonciers, permis et pièces officielles" />
                <DocumentsStep documents={documents} onChange={setDocuments} />
              </div>
            )}

          </form>
        </div>

        {/* ── Navigation ── */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4"
          style={{ borderTop:'1px solid rgba(212,160,23,0.15)', background:'rgba(249,243,232,0.95)' }}>
          <button type="button" aria-label="Étape précédente"
            onClick={currentStep === 1 ? onClose : handlePrevious}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background:HAlpha.gold08, border:'1px solid rgba(212,160,23,0.2)',
                     color:HColors.brownMid, fontFamily:'var(--font-nunito)' }}>
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Annuler' : 'Précédent'}
          </button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i + 1 === currentStep ? HColors.gold : i + 1 < currentStep ? HAlpha.gold50 : HAlpha.gold15 }} />
            ))}
          </div>

          {currentStep < totalSteps ? (
            <button type="button" aria-label="Étape suivante" onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background:'linear-gradient(135deg,#D4A017,#C07C3E)', color:HColors.night,
                       fontFamily:'var(--font-nunito)' }}>
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" aria-label={mode === 'create' ? 'Publier le bien' : 'Sauvegarder'}
              onClick={handleSubmit} disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background:'linear-gradient(135deg,#D4A017,#C07C3E)', color:HColors.night,
                       fontFamily:'var(--font-nunito)' }}>
              {isSubmitting
                ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                : <Check className="w-4 h-4" />}
              {mode === 'create' ? 'Publier' : 'Sauvegarder'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sous-composants helpers ────────────────────────────────────────────────── */
function SectionHeader({ icon, iconBg, iconBorder, title, subtitle }: {
  icon: React.ReactNode; iconBg: string; iconBorder: string; title: string; subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg, border: `1px solid ${iconBorder}` }}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold" style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)', fontSize:'1.15rem', fontWeight:700 }}>
          {title}
        </h3>
        <p style={{ color:HColors.brown, fontFamily:'var(--font-nunito)', fontSize:'0.8rem' }}>{subtitle}</p>
      </div>
    </div>
  );
}

function SubSection({ title, color, children }: {
  title: string; color: 'green' | 'gold' | 'terracotta' | 'navy'; children: React.ReactNode;
}) {
  const colors = {
    green:      { bg:'rgba(45,106,79,0.06)',    border:HAlpha.green20,    text:HColors.green },
    gold:       { bg:HAlpha.gold05,   border:HAlpha.gold15, text:HColors.brownMid },
    terracotta: { bg:HAlpha.terra08,   border:'rgba(192,124,62,0.22)', text:HColors.brownDeep },
    navy:       { bg:HAlpha.navy06,    border:HAlpha.navy18, text:HColors.navy },
  };
  const c = colors[color];
  return (
    <div className="p-4 rounded-xl space-y-3" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: c.text, fontFamily:'var(--font-nunito)' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block mb-1.5"
        style={{ color:'rgba(122,85,0,0.8)', fontFamily:'var(--font-nunito)', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' as const }}>
        {label}
      </label>
      {children}
    </div>
  );
}
