import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, Clock, X, Eye, AlertTriangle } from 'lucide-react';
import { storageService } from '../services/storageService';
import type { PropertyDocument } from '../services/propertyService';
import { fixDocUrl } from '../utils/fixDocUrl';

const DOCUMENTS_BY_TYPE: Record<string, { type: string; label: string; required: boolean; hint: string }[]> = {
  appartement: [
    { type: 'titre_foncier', label: 'Titre foncier', required: true, hint: 'Document officiel attestant la propriété' },
    { type: 'permis_construire', label: 'Permis de construire', required: true, hint: 'Autorisation de construction délivrée par la mairie' },
    { type: 'plan_cadastral', label: 'Plan cadastral', required: false, hint: 'Plan délimitant la parcelle' },
    { type: 'certificat_propriete', label: 'Certificat de propriété', required: false, hint: 'Document notarial confirmant la propriété' },
  ],
  maison: [
    { type: 'titre_foncier', label: 'Titre foncier', required: true, hint: 'Document officiel attestant la propriété' },
    { type: 'permis_construire', label: 'Permis de construire', required: true, hint: 'Autorisation de construction délivrée par la mairie' },
    { type: 'plan_cadastral', label: 'Plan cadastral', required: false, hint: 'Plan délimitant la parcelle' },
    { type: 'certificat_propriete', label: 'Certificat de propriété', required: false, hint: 'Document notarial confirmant la propriété' },
  ],
  villa: [
    { type: 'titre_foncier', label: 'Titre foncier', required: true, hint: 'Document officiel attestant la propriété' },
    { type: 'permis_construire', label: 'Permis de construire', required: true, hint: 'Autorisation de construction délivrée par la mairie' },
    { type: 'plan_cadastral', label: 'Plan cadastral', required: false, hint: 'Plan délimitant la parcelle' },
    { type: 'certificat_propriete', label: 'Certificat de propriété', required: false, hint: 'Document notarial confirmant la propriété' },
  ],
  terrain: [
    { type: 'titre_foncier', label: 'Titre foncier', required: true, hint: 'Document officiel attestant la propriété du terrain' },
    { type: 'plan_cadastral', label: 'Plan cadastral', required: true, hint: 'Plan délimitant la parcelle' },
    { type: 'arrete_lotissement', label: 'Arrêté de lotissement', required: false, hint: 'Autorisation administrative de lotissement' },
    { type: 'certificat_propriete', label: 'Certificat de propriété', required: false, hint: 'Document notarial confirmant la propriété' },
  ],
  hotel: [
    { type: 'titre_foncier', label: 'Titre foncier', required: true, hint: 'Document officiel attestant la propriété' },
    { type: 'autorisation_exploitation', label: "Autorisation d'exploitation", required: true, hint: "Licence délivrée par le ministère du tourisme" },
    { type: 'registre_commerce', label: 'Registre de commerce', required: true, hint: 'Inscription au registre des sociétés' },
    { type: 'permis_construire', label: 'Permis de construire', required: false, hint: 'Autorisation de construction' },
  ],
  appart_hotel: [
    { type: 'titre_foncier', label: 'Titre foncier', required: true, hint: 'Document officiel attestant la propriété' },
    { type: 'autorisation_exploitation', label: "Autorisation d'exploitation", required: true, hint: "Licence délivrée par le ministère du tourisme" },
    { type: 'registre_commerce', label: 'Registre de commerce', required: true, hint: 'Inscription au registre des sociétés' },
    { type: 'permis_construire', label: 'Permis de construire', required: false, hint: 'Autorisation de construction' },
  ],
};

interface DocumentsStepProps {
  propertyType: string;
  propertyId: string;
  documents: PropertyDocument[];
  onChange: (documents: PropertyDocument[]) => void;
}

export function DocumentsStep({ propertyType, propertyId, documents, onChange }: DocumentsStepProps) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const docDefs = DOCUMENTS_BY_TYPE[propertyType] || DOCUMENTS_BY_TYPE['maison'];

  const getDocument = (type: string) => documents.find(d => d.type === type);

  const handleUpload = async (type: string, label: string, file: File) => {
    setUploading(prev => ({ ...prev, [type]: true }));
    setErrors(prev => ({ ...prev, [type]: '' }));

    try {
      const url = await storageService.uploadDocument(file, propertyId || 'temp', type);
      const newDoc: PropertyDocument = {
        type,
        label,
        url,
        status: 'en_attente',
      };
      const updated = [...documents.filter(d => d.type !== type), newDoc];
      onChange(updated);
    } catch (err) {
      setErrors(prev => ({ ...prev, [type]: "Échec de l'upload. Réessayez." }));
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const removeDocument = (type: string) => {
    onChange(documents.filter(d => d.type !== type));
  };

  const requiredCount = docDefs.filter(d => d.required).length;
  const uploadedRequired = docDefs.filter(d => d.required && getDocument(d.type)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Documents officiels</h3>
          <p className="text-sm text-gray-600">
            Ces documents seront vérifiés par un notaire avant publication
          </p>
        </div>
      </div>

      {/* Progression */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800">Documents obligatoires</span>
          <span className="text-sm font-bold text-blue-800">{uploadedRequired}/{requiredCount}</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${requiredCount > 0 ? (uploadedRequired / requiredCount) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-blue-700 mt-2">
          Les documents seront examinés sous 48h par notre équipe notariale
        </p>
      </div>

      {/* Liste des documents */}
      <div className="space-y-4">
        {docDefs.map(def => {
          const doc = getDocument(def.type);
          const isUploading = uploading[def.type];
          const error = errors[def.type];

          return (
            <div
              key={def.type}
              className={`border rounded-lg p-4 transition-colors ${
                doc ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{def.label}</span>
                    {def.required && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Obligatoire</span>
                    )}
                    {!def.required && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Optionnel</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{def.hint}</p>
                  {error && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {error}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {doc ? (
                    <>
                      <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3" /> En attente de validation
                      </span>
                      <a
                        href={fixDocUrl(doc.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir le document"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeDocument(def.type)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                      isUploading
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}>
                      {isUploading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          Upload...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Téléverser
                        </>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(def.type, def.label, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Statut si uploadé */}
              {doc && doc.status === 'valide' && (
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-700">
                  <CheckCircle className="w-3 h-3" /> Validé par le notaire
                </div>
              )}
              {doc && doc.status === 'refuse' && (
                <div className="mt-2 text-xs text-red-700 bg-red-50 rounded p-2">
                  ❌ Refusé : {doc.rejection_reason || 'Document non conforme'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Note légale */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>🔒 Confidentialité :</strong> Vos documents sont chiffrés et uniquement accessibles par notre équipe notariale agréée. Ils ne sont jamais partagés avec les visiteurs ou locataires.
        </p>
      </div>
    </div>
  );
}
