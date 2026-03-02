import { useState } from 'react';
import { Box, Plus, Trash2, Upload, CheckCircle, Clock, Info } from 'lucide-react';
import { storageService } from '../services/storageService';
import type { Model3DRequest, RoomDimension } from '../services/propertyService';

interface Model3DRequestStepProps {
  propertyId: string;
  request: Model3DRequest | null;
  onChange: (req: Model3DRequest | null) => void;
}

const MATERIAUX_OPTIONS = [
  'Béton peint', 'Béton brut', 'Enduit blanc', 'Enduit coloré',
  'Brique', 'Pierre', 'Bois', 'Verre', 'Métal / Acier', 'Bardage composite', 'Autre',
];

const TOITURE_OPTIONS = [
  'Tôle ondulée', 'Tôle bac acier', 'Tuile', 'Terrasse béton',
  'Chaume', 'Ardoise', 'Shingle', 'Autre',
];

const PIECES_DEFAUT = ['Salon', 'Cuisine', 'Chambre 1', 'Salle de bain', 'WC'];

const DEFAULT_REQUEST: Model3DRequest = {
  status: 'non_soumis',
  nb_etages: 1,
  hauteur_sous_plafond: 2.7,
  surface_totale: 0,
  plan_urls: [],
  pieces: [],
  photos_interieures: [],
  materiaux_facade: '',
  type_toiture: '',
  notes: '',
};

export function Model3DRequestStep({ propertyId, request, onChange }: Model3DRequestStepProps) {
  const [data, setData] = useState<Model3DRequest>(request || DEFAULT_REQUEST);
  const [uploadingPlan, setUploadingPlan] = useState(false);
  const [uploadingFacade, setUploadingFacade] = useState<string | null>(null);
  const [uploadingInt, setUploadingInt] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const update = (partial: Partial<Model3DRequest>) => {
    const updated = { ...data, ...partial };
    setData(updated);
    onChange(updated.status === 'non_soumis' && !hasAnyData(updated) ? null : updated);
  };

  const hasAnyData = (d: Model3DRequest) =>
    d.plan_urls.length > 0 || d.pieces.length > 0 ||
    d.photo_nord || d.photo_sud || d.photo_est || d.photo_ouest ||
    d.materiaux_facade || d.notes;

  // ── Pièces ──────────────────────────────────────────────────────────────────
  const addPiece = (nom = '') => {
    update({ pieces: [...data.pieces, { nom, longueur: 0, largeur: 0, hauteur: data.hauteur_sous_plafond }] });
  };

  const updatePiece = (idx: number, field: keyof RoomDimension, value: string | number) => {
    const pieces = [...data.pieces];
    pieces[idx] = { ...pieces[idx], [field]: field === 'nom' ? value : Number(value) };
    update({ pieces });
  };

  const removePiece = (idx: number) => {
    update({ pieces: data.pieces.filter((_, i) => i !== idx) });
  };

  // ── Upload helpers ──────────────────────────────────────────────────────────
  const uploadPlan = async (file: File) => {
    setUploadingPlan(true);
    try {
      const url = await storageService.uploadDocument(file, propertyId || 'temp', 'plan_3d');
      update({ plan_urls: [...data.plan_urls, url] });
    } catch { /* ignore */ } finally { setUploadingPlan(false); }
  };

  const uploadFacade = async (direction: 'nord' | 'sud' | 'est' | 'ouest', file: File) => {
    setUploadingFacade(direction);
    try {
      const url = await storageService.uploadImage(file, `properties/${propertyId}/facades`);
      update({ [`photo_${direction}`]: url });
    } catch { /* ignore */ } finally { setUploadingFacade(null); }
  };

  const uploadInterieur = async (file: File) => {
    setUploadingInt(true);
    try {
      const url = await storageService.uploadImage(file, `properties/${propertyId}/interieures`);
      update({ photos_interieures: [...data.photos_interieures, url] });
    } catch { /* ignore */ } finally { setUploadingInt(false); }
  };

  const handleSubmit = () => {
    update({ status: 'en_attente', submitted_at: new Date().toISOString() });
  };

  const isSubmitted = data.status !== 'non_soumis';
  const sc = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white disabled:bg-gray-50";
  const ic = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm disabled:bg-gray-50";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Box className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Modélisation 3D</h3>
            <p className="text-sm text-gray-500">
              Fournissez les données — notre équipe génère le modèle 3D
            </p>
          </div>
        </div>
        {isSubmitted && (
          <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
            data.status === 'termine' ? 'bg-emerald-100 text-emerald-700' :
            data.status === 'en_cours' ? 'bg-blue-100 text-blue-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {data.status === 'termine' ? <><CheckCircle className="w-3.5 h-3.5" /> Modèle généré</> :
             data.status === 'en_cours' ? <><Clock className="w-3.5 h-3.5" /> En cours de génération</> :
             <><Clock className="w-3.5 h-3.5" /> En attente</>}
          </span>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-purple-800">
          <p className="font-medium mb-1">Comment ça fonctionne ?</p>
          <p>Renseignez les dimensions, uploadez vos plans et photos. Notre équipe génère une visite virtuelle 3D sous <strong>5 jours ouvrés</strong> et la publie automatiquement sur votre annonce.</p>
        </div>
      </div>

      {isSubmitted && data.status !== 'termine' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <p className="font-medium">Demande soumise le {data.submitted_at ? new Date(data.submitted_at).toLocaleDateString('fr-FR') : '—'}</p>
          <p className="mt-1">Notre équipe traite votre demande. Vous serez notifié par email dès que le modèle 3D est disponible.</p>
        </div>
      ) : data.status === 'termine' ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
          <p className="font-medium">✅ Modèle 3D disponible sur votre annonce</p>
        </div>
      ) : (
        <>
          {/* ── Section 1 : Structure ── */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button type="button" onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100">
              <span>1 — Structure du bâtiment</span>
              <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
            </button>
            {expanded && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre d'étages</label>
                    <input type="number" min="1" max="30" value={data.nb_etages}
                      onChange={e => update({ nb_etages: Number(e.target.value) })}
                      className={ic} disabled={isSubmitted} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Hauteur sous plafond (m)</label>
                    <input type="number" min="2" max="10" step="0.1" value={data.hauteur_sous_plafond}
                      onChange={e => update({ hauteur_sous_plafond: Number(e.target.value) })}
                      className={ic} disabled={isSubmitted} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Surface totale (m²)</label>
                    <input type="number" min="0" value={data.surface_totale}
                      onChange={e => update({ surface_totale: Number(e.target.value) })}
                      className={ic} disabled={isSubmitted} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Matériaux façade</label>
                    <select value={data.materiaux_facade}
                      onChange={e => update({ materiaux_facade: e.target.value })}
                      className={sc} disabled={isSubmitted}>
                      <option value="">Sélectionner</option>
                      {MATERIAUX_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type de toiture</label>
                    <select value={data.type_toiture}
                      onChange={e => update({ type_toiture: e.target.value })}
                      className={sc} disabled={isSubmitted}>
                      <option value="">Sélectionner</option>
                      {TOITURE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 2 : Plans ── */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <span className="text-sm font-medium text-gray-700">2 — Plans du bien</span>
              <span className="text-xs text-gray-400">PDF, JPG, PNG · {data.plan_urls.length} fichier{data.plan_urls.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="p-4 space-y-3">
              {data.plan_urls.map((url, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-purple-700 hover:underline truncate flex-1">Plan {idx + 1}</a>
                  {!isSubmitted && (
                    <button type="button" onClick={() => update({ plan_urls: data.plan_urls.filter((_, i) => i !== idx) })}
                      className="ml-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              {!isSubmitted && (
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 text-sm text-purple-600 transition-colors">
                  {uploadingPlan
                    ? <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    : <Upload className="w-4 h-4" />}
                  {uploadingPlan ? 'Upload...' : 'Ajouter un plan'}
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                    disabled={uploadingPlan}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadPlan(f); e.target.value = ''; }} />
                </label>
              )}
            </div>
          </div>

          {/* ── Section 3 : Dimensions des pièces ── */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <span className="text-sm font-medium text-gray-700">3 — Dimensions des pièces</span>
              {!isSubmitted && (
                <div className="flex gap-2">
                  {PIECES_DEFAUT.filter(p => !data.pieces.find(d => d.nom === p)).map(p => (
                    <button key={p} type="button" onClick={() => addPiece(p)}
                      className="text-xs bg-white border border-purple-300 text-purple-600 px-2 py-1 rounded hover:bg-purple-50 transition-colors">
                      + {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 space-y-3">
              {data.pieces.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">Aucune pièce ajoutée — cliquez sur les boutons ci-dessus</p>
              )}
              {data.pieces.map((piece, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                  <div className="col-span-1">
                    <input type="text" value={piece.nom}
                      onChange={e => updatePiece(idx, 'nom', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      placeholder="Nom" disabled={isSubmitted} />
                  </div>
                  {(['longueur', 'largeur', 'hauteur'] as const).map(field => (
                    <div key={field} className="col-span-1">
                      <div className="relative">
                        <input type="number" min="0" step="0.1" value={piece[field]}
                          onChange={e => updatePiece(idx, field, e.target.value)}
                          className="w-full px-2 py-1.5 pr-6 border border-gray-300 rounded text-sm"
                          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                          disabled={isSubmitted} />
                        <span className="absolute right-2 top-2 text-xs text-gray-400">m</span>
                      </div>
                    </div>
                  ))}
                  <div className="col-span-1 text-right">
                    {!isSubmitted && (
                      <button type="button" onClick={() => removePiece(idx)}
                        className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              ))}
              {!isSubmitted && (
                <button type="button" onClick={() => addPiece()}
                  className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-1">
                  <Plus className="w-4 h-4" /> Ajouter une pièce personnalisée
                </button>
              )}
            </div>
          </div>

          {/* ── Section 4 : Photos façades ── */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50">
              <span className="text-sm font-medium text-gray-700">4 — Photos des façades</span>
              <p className="text-xs text-gray-400 mt-0.5">Photographiez le bâtiment depuis les 4 orientations si possible</p>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['nord', 'sud', 'est', 'ouest'] as const).map(dir => {
                const photoUrl = data[`photo_${dir}`];
                const loading = uploadingFacade === dir;
                return (
                  <div key={dir} className="space-y-1">
                    <p className="text-xs font-medium text-gray-600 capitalize text-center">Façade {dir}</p>
                    {photoUrl ? (
                      <div className="relative group">
                        <img src={photoUrl} alt={`Façade ${dir}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                        {!isSubmitted && (
                          <button type="button"
                            onClick={() => update({ [`photo_${dir}`]: undefined })}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg transition-colors ${
                        isSubmitted ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50 cursor-pointer'
                      }`}>
                        {loading
                          ? <span className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                          : <><Upload className="w-5 h-5 text-gray-400 mb-1" /><span className="text-xs text-gray-400">Ajouter</span></>
                        }
                        <input type="file" className="hidden" accept="image/*"
                          disabled={isSubmitted || loading}
                          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFacade(dir, f); e.target.value = ''; }} />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Section 5 : Photos intérieures ── */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">5 — Photos intérieures supplémentaires</span>
                <p className="text-xs text-gray-400 mt-0.5">Prise de vue depuis les coins des pièces — idéalement 2 par pièce</p>
              </div>
              <span className="text-xs text-gray-400">{data.photos_interieures.length} photo{data.photos_interieures.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="p-4">
              {data.photos_interieures.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {data.photos_interieures.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt={`Intérieur ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                      {!isSubmitted && (
                        <button type="button"
                          onClick={() => update({ photos_interieures: data.photos_interieures.filter((_, i) => i !== idx) })}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!isSubmitted && (
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-colors">
                  {uploadingInt
                    ? <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    : <Upload className="w-4 h-4 text-gray-400" />}
                  <span className="text-sm text-gray-500">{uploadingInt ? 'Upload...' : 'Ajouter des photos'}</span>
                  <input type="file" className="hidden" accept="image/*" multiple
                    disabled={uploadingInt}
                    onChange={e => { Array.from(e.target.files || []).forEach(f => uploadInterieur(f)); e.target.value = ''; }} />
                </label>
              )}
            </div>
          </div>

          {/* ── Notes libres ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes pour l'équipe <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea value={data.notes} rows={3}
              onChange={e => update({ notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
              placeholder="Ex: Le salon est en L, la terrasse fait face au jardin, le mur nord est en brique apparente..."
              disabled={isSubmitted} />
          </div>

          {/* ── Bouton soumettre ── */}
          {!isSubmitted && (
            <div className="pt-2">
              <button type="button" onClick={handleSubmit}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm">
                <Box className="w-4 h-4" />
                Soumettre la demande de modélisation 3D
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                Vous pouvez soumettre maintenant et compléter les informations manquantes plus tard en modifiant le bien.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
