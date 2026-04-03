import { useState, useMemo } from 'react';
import { 
  FileText, Upload, CheckCircle, Clock, X, Eye, 
  AlertTriangle, ShieldCheck, Wallet,
  Briefcase, Users, ArrowRight
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
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

export default function TenantDossier() {
  const { user, profile, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const dossier = useMemo(() => profile?.dossier || {}, [profile]);

  // Calcul de la complétude
  const stats = useMemo(() => {
    const totalRequired = DOSSIER_CONFIG.filter(d => d.required).length;
    const completedRequired = DOSSIER_CONFIG.filter(d => d.required && (dossier as any)[`${d.id}_url`]).length;
    const progress = Math.round((completedRequired / totalRequired) * 100);
    
    return { progress, completedRequired, totalRequired };
  }, [dossier]);

  if (!user || !profile) return null;

  const handleUpload = async (docId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier est trop volumineux (max 5 Mo)');
      return;
    }

    setUploading(prev => ({ ...prev, [docId]: true }));
    setError(null);

    try {
      const url = await storageService.uploadTenantDocument(file, user.uid, docId);

      const updates: Record<string, any> = {
        updated_at: serverTimestamp(),
        [`dossier.${docId}_url`]: url,
        [`dossier.${docId}_status`]: 'provided', // On remplace 'pending' par 'provided'
        'dossier.last_updated': new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', user.uid), updates);
      await refreshProfile();
    } catch (err) {
      console.error('Upload error:', err);
      setError('Échec de l\'envoi du document. Veuillez réessayer.');
    } finally {
      setUploading(prev => ({ ...prev, [docId]: false }));
    }
  };

  const renderSection = (title: string, sub: string, sectionId: DossierDocDef['section']) => {
    const sectionDocs = DOSSIER_CONFIG.filter(d => d.section === sectionId);
    
    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between border-b pb-2" style={{ borderColor: HAlpha.gold15 }}>
          <div>
            <h3 className="text-xl font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>{title}</h3>
            <p className="text-xs" style={{ color: HColors.brownMid }}>{sub}</p>
          </div>
          <div className="text-[10px] font-bold tracking-widest uppercase opacity-40">Section {sectionId}</div>
        </div>
        
        <div className="grid gap-3">
          {sectionDocs.map(docDef => {
            const url = (dossier as any)[`${docDef.id}_url`];
            const isUploading = uploading[docDef.id];

            return (
              <div key={docDef.id} className="group relative rounded-xl p-4 transition-all bg-white border"
                style={{ borderColor: url ? HAlpha.vertCI20 : HAlpha.gold10 }}>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: HAlpha.gold05, color: HColors.gold }}>
                      {docDef.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm truncate" style={{ color: HColors.darkBrown }}>
                        {docDef.label} {docDef.required && <span className="text-red-500 font-normal">*</span>}
                      </h4>
                      <p className="text-[10px]" style={{ color: HColors.brownMid }}>{docDef.hint}</p>
                      
                      {url && (
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <CheckCircle className="w-2.5 h-2.5" /> DOCUMENT FOURNI
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {url ? (
                      <div className="flex items-center gap-1">
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-navy-50 text-navy-600 transition-colors" title="Voir">
                          <Eye className="w-4 h-4" />
                        </a>
                        <label className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 cursor-pointer transition-colors" title="Modifier">
                          <Upload className="w-4 h-4" />
                          <input type="file" className="hidden" accept=".pdf,image/*" 
                            onChange={(e) => e.target.files?.[0] && handleUpload(docDef.id, e.target.files[0])} />
                        </label>
                      </div>
                    ) : (
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isUploading ? 'opacity-50 cursor-wait' : 'hover:bg-opacity-90'
                      }`}
                        style={{ background: HColors.gold, color: '#FFF' }}>
                        {isUploading ? <Clock className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {isUploading ? 'Chargement...' : 'Envoyer'}
                        <input type="file" className="hidden" accept=".pdf,image/*" disabled={isUploading}
                          onChange={(e) => e.target.files?.[0] && handleUpload(docDef.id, e.target.files[0])} />
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
      <div className="rounded-3xl p-6 md:p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D1F12 0%, #1A0E00 100%)', border: `1px solid ${HAlpha.gold20}` }}>
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
          {/* Progress Ring */}
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent"
                className="text-white/5" />
              <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray={264} strokeDashoffset={264 - (264 * stats.progress) / 100}
                strokeLinecap="round" style={{ color: HColors.gold }} className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold" style={{ color: HColors.cream }}>{stats.progress}%</span>
              <span className="text-[8px] tracking-widest uppercase" style={{ color: HAlpha.cream50 }}>Complet</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold mb-2" style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
              Finalisez votre Dossier
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                 <CheckCircle className={`w-4 h-4 ${stats.completedRequired === stats.totalRequired ? 'text-emerald-500' : 'text-white/20'}`} />
                 <span className="text-[10px] font-bold" style={{ color: HAlpha.cream80 }}>
                   {stats.completedRequired} / {stats.totalRequired} documents requis
                 </span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                 <ShieldCheck className="w-4 h-4" style={{ color: HColors.vertCI }} />
                 <span className="text-[10px] font-bold" style={{ color: HAlpha.cream80 }}>Confidentialité Garantie</span>
               </div>
            </div>
          </div>
          
          <button className="hidden lg:flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white/90 text-sm font-bold hover:bg-white/20 transition-all">
            Besoin d'aide ? <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Decor */}
        <div className="absolute -bottom-8 -right-8 w-48 h-48 opacity-5">
           <ShieldCheck className="w-full h-full" />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
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
    </div>
  );
}
