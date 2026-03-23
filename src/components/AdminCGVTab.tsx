import { useState } from 'react';
import { ScrollText, Shield, FileText, Scale, Download, Mail } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';

export default function AdminCGVTab() {
  const [activeDoc, setActiveDoc] = useState<'locataire' | 'proprietaire' | 'notaire'>('locataire');

  const DOCS = [
    { id: 'locataire', label: 'CGV Locataire / Acheteur', icon: ScrollText, file: '/cgv/cgv-locataire.txt', fileName: 'CGV_Locataire_Acheteur_HOMECI.txt' },
    { id: 'proprietaire', label: 'CGV Propriétaire', icon: FileText, file: '/cgv/cgv-proprietaire.txt', fileName: 'CGV_Proprietaire_HOMECI.txt' },
    { id: 'notaire', label: 'Charte Notaire', icon: Scale, file: '/cgv/cgv-notaire.txt', fileName: 'Charte_Notaire_HOMECI.txt' },
  ] as const;

  const currentDoc = DOCS.find(d => d.id === activeDoc)!;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = currentDoc.file;
    a.download = currentDoc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareGmail = () => {
    const subject = encodeURIComponent(`Document Légal HOMECI : ${currentDoc.label}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nVous trouverez le document légal "${currentDoc.label}" en accès libre sur notre plateforme.\n\nVous pouvez le télécharger directement via ce lien (si hébergé) : https://homeci.ci${currentDoc.file}\n\nCordialement,\nL'équipe HOMECI`
    );
    // Ouvre Gmail web compose avec subject et body pré-remplis
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-bold mb-0.5" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem' }}>
          Documents Légaux & CGV
        </h2>
        <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
          Consultez, téléchargez et partagez les chartes d'utilisation pour chaque type d'acteur.
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

      <div className="rounded-2xl p-8" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
        <div className="flex items-start gap-3 mb-8 p-4 rounded-xl" style={{ background: HAlpha.gold05, border: `1px solid ${HAlpha.gold15}` }}>
          <Shield className="w-5 h-5 shrink-0" style={{ color: HColors.gold }} />
          <div>
            <h3 className="font-bold text-sm mb-1" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
              Valeur Juridique — {currentDoc.label}
            </h3>
            <p className="text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
              Ce document fait foi en cas de conflit juridique. Il établit le cadre de responsabilité et les droits de chaque partie.
              Vous pouvez le télécharger au format texte (.txt) ou le partager directement par email via Gmail.
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4 py-6">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 shadow-md"
            style={{ background: 'linear-gradient(135deg, #1A4F3A, #2D6A4F)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}
          >
            <Download className="w-4 h-4" />
            Télécharger (.txt)
          </button>

          <button
            onClick={handleShareGmail}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 shadow-md"
            style={{ background: '#EA4335', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}
          >
            <Mail className="w-4 h-4" />
            Partager via Gmail
          </button>
        </div>
      </div>
    </div>
  );
}
