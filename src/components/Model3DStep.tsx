import React, { useState, useRef } from 'react';
import { Box, Link, Upload, X, Eye, AlertTriangle, ExternalLink } from 'lucide-react';
import { storageService } from '../services/storageService';
import type { Model3D } from '../services/propertyService';

interface Model3DStepProps {
  propertyId: string;
  model3d: Model3D | null;
  onChange: (model: Model3D | null) => void;
}

type TabType = 'url' | 'file';

function detectProvider(url: string): Model3D['provider'] {
  if (url.includes('matterport.com')) return 'matterport';
  if (url.includes('sketchfab.com')) return 'sketchfab';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'other';
}

function getEmbedUrl(url: string, provider: Model3D['provider']): string {
  if (provider === 'sketchfab') {
    // https://sketchfab.com/3d-models/xxx → https://sketchfab.com/models/xxx/embed
    const match = url.match(/sketchfab\.com\/3d-models\/([^/?]+)/);
    if (match) return `https://sketchfab.com/models/${match[1]}/embed`;
  }
  if (provider === 'youtube') {
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  if (provider === 'matterport') {
    // https://my.matterport.com/show/?m=xxx → embed
    const match = url.match(/[?&]m=([^&]+)/);
    if (match) return `https://my.matterport.com/show/?m=${match[1]}&play=1`;
    return url;
  }
  return url;
}

export function Model3DStep({ propertyId, model3d, onChange }: Model3DStepProps) {
  const [activeTab, setActiveTab] = useState<TabType>(model3d?.type || 'url');
  const [urlInput, setUrlInput] = useState(model3d?.type === 'url' ? model3d.url : '');
  const [urlError, setUrlError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUrlConfirm = () => {
    setUrlError('');
    if (!urlInput.trim()) {
      setUrlError("Veuillez entrer une URL valide");
      return;
    }
    try {
      new URL(urlInput.trim());
    } catch {
      setUrlError("URL invalide");
      return;
    }
    const provider = detectProvider(urlInput.trim());
    onChange({ type: 'url', url: urlInput.trim(), provider });
  };

  const handleFileUpload = async (file: File) => {
    const allowed = ['.glb', '.gltf'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadError("Seuls les fichiers .glb et .gltf sont acceptés");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError("Le fichier ne doit pas dépasser 50 MB");
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const url = await storageService.uploadModel3D(file, propertyId || 'temp');
      onChange({ type: 'file', url, provider: 'other' });
    } catch {
      setUploadError("Échec de l'upload. Réessayez.");
    } finally {
      setUploading(false);
    }
  };

  const embedUrl = model3d?.type === 'url'
    ? getEmbedUrl(model3d.url, model3d.provider)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <Box className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Modélisation 3D</h3>
          <p className="text-sm text-gray-600">
            Ajoutez une visite virtuelle ou un modèle 3D de votre bien <span className="text-gray-400">(optionnel)</span>
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => { setActiveTab('url'); setUrlError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'url' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Link className="w-4 h-4" />
          Lien externe
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('file'); setUploadError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'file' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Upload className="w-4 h-4" />
          Fichier 3D
        </button>
      </div>

      {/* Onglet Lien externe */}
      {activeTab === 'url' && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-800 space-y-2">
            <p className="font-medium">Sources compatibles :</p>
            <div className="grid grid-cols-1 gap-1 text-xs">
              <span>🏠 <strong>Matterport</strong> — ex: https://my.matterport.com/show/?m=abc123</span>
              <span>🎮 <strong>Sketchfab</strong> — ex: https://sketchfab.com/3d-models/mon-bien-abc123</span>
              <span>▶️ <strong>YouTube 360°</strong> — ex: https://youtu.be/abc123</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://my.matterport.com/show/?m=..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleUrlConfirm}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
            >
              Confirmer
            </button>
          </div>

          {urlError && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> {urlError}
            </p>
          )}

          {model3d?.type === 'url' && (
            <div className="border border-emerald-300 bg-emerald-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <Box className="w-4 h-4" />
                  <span className="font-medium">Modèle 3D configuré</span>
                  <span className="text-xs bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full capitalize">
                    {model3d.provider || 'Lien externe'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                  >
                    <Eye className="w-3 h-3" />
                    {showPreview ? 'Masquer' : 'Aperçu'}
                  </button>
                  <a
                    href={model3d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ouvrir
                  </a>
                  <button
                    type="button"
                    onClick={() => { onChange(null); setUrlInput(''); }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 truncate">{model3d.url}</p>

              {showPreview && embedUrl && (
                <div className="w-full rounded-lg overflow-hidden border border-gray-200" style={{ height: 300 }}>
                  <iframe
                    src={embedUrl}
                    width="100%"
                    height="300"
                    frameBorder="0"
                    allow="autoplay; fullscreen; vr"
                    allowFullScreen
                    title="Aperçu 3D"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Onglet Fichier 3D */}
      {activeTab === 'file' && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-800">
            <p className="font-medium mb-1">Formats acceptés :</p>
            <p className="text-xs">.glb ou .gltf — Maximum 50 MB</p>
            <p className="text-xs mt-1 text-purple-600">
              💡 Utilisez Blender, SketchUp, ou l'export de votre logiciel d'architecture pour générer ces fichiers.
            </p>
          </div>

          {model3d?.type === 'file' ? (
            <div className="border border-emerald-300 bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <Box className="w-4 h-4" />
                  <span className="font-medium">Fichier 3D uploadé</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={model3d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Télécharger
                  </a>
                  <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">{model3d.url}</p>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              uploading ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 bg-gray-50 hover:bg-purple-50 hover:border-purple-400'
            }`}>
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <span className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Upload en cours...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Box className="w-10 h-10 text-gray-400" />
                  <span className="text-sm font-medium">Cliquez pour sélectionner un fichier .glb ou .gltf</span>
                  <span className="text-xs text-gray-400">Max 50 MB</span>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".glb,.gltf"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = '';
                }}
              />
            </label>
          )}

          {uploadError && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> {uploadError}
            </p>
          )}
        </div>
      )}

      {/* Option passer l'étape */}
      {!model3d && (
        <div className="text-center py-2">
          <p className="text-xs text-gray-400">
            Cette étape est optionnelle — vous pouvez ajouter la modélisation 3D plus tard en modifiant le bien.
          </p>
        </div>
      )}
    </div>
  );
}
