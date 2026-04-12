import { useMemo, useState, useCallback } from 'react';
import {
  Upload, CheckCircle, Clock, Eye,
  AlertTriangle, ShieldCheck, Wallet,
  Briefcase, Users,
  Trash2, Send, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTenantDossier } from '../hooks/useTenantDossier';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface DossierDocDef {
  id: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  required: boolean;
  section: 'income' | 'guarantor';
}

const DOSSIER_CONFIG: DossierDocDef[] = [
  // SECTION: REVENUS
  {
    id: 'pay_slip_1',
    label: 'Bulletin de paie (Mois N)',
    hint: 'Le plus récent',
    icon: <Wallet className="w-5 h-5" />,
    required: true,
    section: 'income'
  },
  {
    id: 'pay_slip_2',
    label: 'Bulletin de paie (Mois N-1)',
    hint: 'Avant-dernier mois',
    icon: <Wallet className="w-5 h-5" />,
    required: true,
    section: 'income'
  },
  {
    id: 'pay_slip_3',
    label: 'Bulletin de paie (Mois N-2)',
    hint: 'Il y a 3 mois',
    icon: <Wallet className="w-5 h-5" />,
    required: true,
    section: 'income'
  },
  {
    id: 'employment_proof',
    label: 'Attestation d\'Emploi',
    hint: 'Ou contrat de travail récent',
    icon: <Briefcase className="w-5 h-5" />,
    required: true,
    section: 'income'
  },
  // SECTION: GARANT
  {
    id: 'guarantor_identity',
    label: 'Identité du Garant',
    hint: 'Pièce d\'identité de votre caution',
    icon: <Users className="w-5 h-5" />,
    required: false,
    section: 'guarantor'
  },
  {
    id: 'guarantor_income',
    label: 'Revenus du Garant',
    hint: 'Dernier bulletin de paie du garant',
    icon: <Wallet className="w-5 h-5" />,
    required: false,
    section: 'guarantor'
  }
];

/**
 * Modal de confirmation de soumission du dossier
 */
function SubmitConfirmModal({
  stats,
  onConfirm,
  onCancel,
  submitting,
}: {
  stats: { completedRequired: number; totalRequired: number };
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
         onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200"
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
            Soumettre le dossier
          </h3>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-700" style={{ fontFamily: 'var(--font-nunito)' }}>
            Votre dossier contient <strong>{stats.completedRequired}/{stats.totalRequired}</strong> documents requis.
            Une fois soumis, il sera visible par les propriétaires pour étude de solvabilité.
          </p>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <strong>⚠️ Important :</strong> Vous pourrez modifier vos documents après soumission, mais cela réinitialisera le statut de soumission.
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: HColors.vertCI }}
          >
            {submitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Confirmer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TenantDossier() {
  const { user, profile, refreshProfile } = useAuth();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    stats,
    uploading,
    submitting,
    error,
    success,
    uploadDocument,
    deleteDocument,
    submitDossier,
    clearError,
    clearSuccess,
  } = useTenantDossier({
    userId: user?.uid || '',
    dossier: profile?.dossier as Record<string, unknown> | undefined,
    onRefresh: refreshProfile,
  });

  const isSubmitted = useMemo(() => {
    return (profile?.dossier as any)?.overall_status === 'submitted';
  }, [profile?.dossier]);

  const handleFileSelect = useCallback((docId: string, file: File) => {
    uploadDocument(docId, file);
  }, [uploadDocument]);

  const handleDeleteRequest = useCallback((docId: string) => {
    setDeleteConfirmId(docId);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmId) {
      deleteDocument(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deleteDocument]);

  const handleSubmitRequest = useCallback(() => {
    setShowSubmitModal(true);
  }, []);

  const handleSubmitConfirm = useCallback(() => {
    setShowSubmitModal(false);
    submitDossier();
  }, [submitDossier]);

  if (!user || !profile) return null;

  const renderSection = (title: string, sub: string, sectionId: DossierDocDef['section']) => {
    const sectionDocs = DOSSIER_CONFIG.filter(d => d.section === sectionId);

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b pb-2" style={{ borderColor: HAlpha.gold15 }}>
          <div>
            <h3 className="text-lg sm:text-xl font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>{title}</h3>
            <p className="text-[10px] sm:text-xs" style={{ color: HColors.brownMid }}>{sub}</p>
          </div>
          <div className="text-[8px] sm:text-[10px] font-bold tracking-widest uppercase opacity-40 mt-1 sm:mt-0">Section {sectionId}</div>
        </div>

        <div className="grid gap-3">
          {sectionDocs.map(docDef => {
            const url = (profile.dossier as any)?.[`${docDef.id}_url`];
            const isUploading = uploading[docDef.id];
            const showDeleteConfirm = deleteConfirmId === docDef.id;

            return (
              <div key={docDef.id} className="group relative rounded-xl p-4 transition-all bg-white border"
                style={{ borderColor: url ? HAlpha.vertCI20 : HAlpha.gold10 }}>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: HAlpha.gold05, color: HColors.gold }}>
                      {docDef.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm truncate" style={{ color: HColors.darkBrown }}>
                        {docDef.label} {docDef.required && <span className="text-red-500 font-normal">*</span>}
                      </h4>
                      <p className="text-[9px] sm:text-[10px]" style={{ color: HColors.brownMid }}>{docDef.hint}</p>

                      {url && (
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <CheckCircle className="w-2.5 h-2.5" /> DOCUMENT FOURNI
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex justify-end">
                    {url ? (
                      showDeleteConfirm ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handleDeleteConfirm}
                            className="px-2 py-1 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" title="Voir">
                            <Eye className="w-4 h-4" />
                          </a>
                          <label className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer transition-colors" title="Remplacer">
                            <Upload className="w-4 h-4" />
                            <input type="file" className="hidden" accept=".pdf,image/*"
                              onChange={(e) => e.target.files?.[0] && handleFileSelect(docDef.id, e.target.files[0])} />
                          </label>
                          <button
                            onClick={() => handleDeleteRequest(docDef.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    ) : (
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isUploading ? 'opacity-50 cursor-wait' : 'hover:bg-opacity-90'
                      }`}
                        style={{ background: HColors.gold, color: '#FFF' }}>
                        {isUploading ? <Clock className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {isUploading ? 'Chargement...' : 'Envoyer'}
                        <input type="file" className="hidden" accept=".pdf,image/*" disabled={isUploading}
                          onChange={(e) => e.target.files?.[0] && handleFileSelect(docDef.id, e.target.files[0])} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Progress */}
      <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D1F12 0%, #1A0E00 100%)', border: `1px solid ${HAlpha.gold20}` }}>
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
          {/* Progress Ring */}
          <div className="relative w-16 h-16 sm:w-24 sm:h-24 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="6" fill="transparent"
                className="text-white/5" />
              <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="6" fill="transparent"
                strokeDasharray="251" strokeDashoffset={251 - (251 * stats.progress) / 100}
                strokeLinecap="round" style={{ color: HColors.gold }} className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm sm:text-xl font-bold" style={{ color: HColors.cream }}>{stats.progress}%</span>
              <span className="text-[6px] sm:text-[8px] tracking-widest uppercase font-bold text-cream/40">Complet</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-3xl font-bold mb-1.5" style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
              {isSubmitted ? 'Dossier Soumis ✓' : 'Finalisez votre Dossier'}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                 <CheckCircle className={`w-4 h-4 ${stats.completedRequired === stats.totalRequired ? 'text-emerald-500' : 'text-white/20'}`} />
                 <span className="text-[10px] font-bold" style={{ color: HAlpha.white70 }}>
                   {stats.completedRequired} / {stats.totalRequired} documents requis
                 </span>
               </div>
               {stats.totalOptional > 0 && (
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                   <span className="text-[10px] font-bold" style={{ color: HAlpha.white70 }}>
                     {stats.completedOptional}/{stats.totalOptional} optionnel{stats.totalOptional > 1 ? 's' : ''}
                   </span>
                 </div>
               )}
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                 <ShieldCheck className="w-4 h-4" style={{ color: HColors.vertCI }} />
                 <span className="text-[10px] font-bold" style={{ color: HAlpha.white70 }}>Confidentialité Garantie</span>
               </div>
               {isSubmitted && (
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                   <Send className="w-4 h-4 text-emerald-400" />
                   <span className="text-[10px] font-bold text-emerald-300">Soumis le {(profile.dossier as any)?.submitted_at ? new Date((profile.dossier as any).submitted_at).toLocaleDateString('fr-FR') : '—'}</span>
                 </div>
               )}
            </div>
          </div>

          {/* Submit Button */}
          {!isSubmitted && stats.canSubmit && (
            <button
              onClick={handleSubmitRequest}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-bold transition-all hover:shadow-lg disabled:opacity-50"
              style={{ background: HColors.vertCI }}
            >
              {submitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Soumettre le dossier
                </>
              )}
            </button>
          )}
        </div>

        {/* Decor */}
        <div className="absolute -bottom-8 -right-8 w-48 h-48 opacity-5">
           <ShieldCheck className="w-full h-full" />
        </div>
      </div>

      {/* Error & Success Banners */}
      {error && (
        <div className="p-4 rounded-2xl flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="ml-2 font-bold hover:opacity-70">✕</button>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-2xl flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="flex-1">{success}</span>
          <button onClick={clearSuccess} className="ml-2 font-bold hover:opacity-70">✕</button>
        </div>
      )}

      {/* Main Sections */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          {renderSection('Source de Revenus', 'Justificatifs financiers des 3 derniers mois', 'income')}
        </div>
        <div className="space-y-8">
          {renderSection('Le Garant (Caution)', 'Recommandé pour rassurer le bailleur', 'guarantor')}
        </div>
      </div>

      {/* Global Note */}
      <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-200/50 flex gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <ShieldCheck className="w-6 h-6" style={{ color: '#D97706' }} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-amber-900">Pourquoi mon dossier est-il important ?</h4>
          <p className="text-xs leading-relaxed text-amber-800/80">
            Un dossier complet vous permet de rassurer les propriétaires et d'accélérer vos démarches de location. HomeCI sécurise vos documents et ne les partage qu'avec les propriétaires pour étude de solvabilité.
          </p>
        </div>
      </div>

      {/* Submit Confirm Modal */}
      {showSubmitModal && (
        <SubmitConfirmModal
          stats={stats}
          onConfirm={handleSubmitConfirm}
          onCancel={() => setShowSubmitModal(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
