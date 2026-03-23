import { useState } from 'react';
import { ScrollText, Shield, FileText, Scale } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import CGVLocataireModal from './CGVLocataireModal';
import CGVModal from './CGVModal';
import CGVNotaireModal from './CGVNotaireModal';

export default function AdminCGVTab() {
  const [activeDoc, setActiveDoc] = useState<'locataire' | 'proprietaire' | 'notaire'>('locataire');

  const DOCS = [
    { id: 'locataire', label: 'CGV Locataire / Acheteur', icon: ScrollText },
    { id: 'proprietaire', label: 'CGV Propriétaire', icon: FileText },
    { id: 'notaire', label: 'Charte Notaire', icon: Scale },
  ] as const;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-bold mb-0.5" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem' }}>
          Documents Légaux & CGV
        </h2>
        <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
          Consultez les Conditions Générales de Vente et les chartes d'utilisation pour chaque type d'acteur.
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        {DOCS.map(doc => (
          <button
            key={doc.id}
            onClick={() => setActiveDoc(doc.id)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: activeDoc === doc.id ? HColors.night : HColors.white,
              color: activeDoc === doc.id ? HColors.gold : HColors.brownMid,
              border: `1px solid ${activeDoc === doc.id ? HAlpha.gold30 : HAlpha.gold20}`,
              boxShadow: activeDoc === doc.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
              fontFamily: 'var(--font-nunito)'
            }}
          >
            <doc.icon className="w-4 h-4" />
            {doc.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden p-8" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
        <div className="flex items-start gap-3 mb-6 p-4 rounded-xl" style={{ background: HAlpha.gold05, border: `1px solid ${HAlpha.gold15}` }}>
          <Shield className="w-5 h-5 shrink-0" style={{ color: HColors.gold }} />
          <div>
            <h3 className="font-bold text-sm mb-1" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
              Valeur Juridique
            </h3>
            <p className="text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
              Ces documents font foi en cas de conflit juridique. Ils établissent le cadre de responsabilité et les droits de chaque partie.
              Pour lire leur contenu complet, vous pouvez déclencher un aperçu ci-dessous.
            </p>
          </div>
        </div>

        <div className="flex justify-center py-10">
          <button
            onClick={() => alert('Les textes originaux sont codés en dur dans les modals (components/CGVLocataireModal.tsx, CGVModal.tsx, CGVNotaireModal.tsx). Vous pouvez les retrouver là-bas ou instancier la vue modale directement.')}
            className="px-6 py-3 rounded-xl font-bold text-sm"
            style={{ background: HAlpha.gold10, color: HColors.brownDeep, border: `1px solid ${HAlpha.gold25}` }}
          >
            Afficher le texte complet du {DOCS.find(d => d.id === activeDoc)?.label}
          </button>
        </div>
      </div>
    </div>
  );
}
