import { useState } from 'react';
import { ScrollText, Shield, FileText, Scale, Download, Mail, CheckCircle, XCircle } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { ROLE_CFG } from '../constants/labels';
import type { Profile } from '../contexts/AuthContext';
import { RoleBadge } from './admin/AdminSections';

interface AdminCGVTabProps {
  users: (Profile & { suspended?: boolean })[];
}

export default function AdminCGVTab({ users }: AdminCGVTabProps) {
  const [activeDoc, setActiveDoc] = useState<'locataire' | 'proprietaire' | 'notaire'>('locataire');
  const [filterCgv, setFilterCgv] = useState<'all' | 'accepted' | 'not_accepted'>('all');

  const DOCS = [
    { id: 'locataire', label: 'CGV Locataire / Acheteur', icon: ScrollText, file: '/cgv/cgv-locataire.pdf', fileName: 'CGV_Locataire_Acheteur_HOMECI.pdf' },
    { id: 'proprietaire', label: 'CGV Propriétaire', icon: FileText, file: '/cgv/cgv-proprietaire.pdf', fileName: 'CGV_Proprietaire_HOMECI.pdf' },
    { id: 'notaire', label: 'Charte Notaire', icon: Scale, file: '/cgv/cgv-notaire.pdf', fileName: 'Charte_Notaire_HOMECI.pdf' },
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
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
    window.open(url, '_blank');
  };

  // --- CGV acceptance tracking ---
  const hasCgv = (u: Profile) => {
    if (u.role === 'notaire') return !!u.cgv_notaire_accepted;
    return !!u.cgv_accepted;
  };

  const cgvDate = (u: Profile) => {
    if (u.role === 'notaire') return u.cgv_notaire_accepted_at;
    return u.cgv_accepted_at;
  };

  const filteredCgvUsers = users.filter(u => {
    if (filterCgv === 'accepted') return hasCgv(u);
    if (filterCgv === 'not_accepted') return !hasCgv(u);
    return true;
  });

  const acceptedCount = users.filter(hasCgv).length;

  const handleExportCGVCsv = () => {
    if (filteredCgvUsers.length === 0) return;
    const clean = (s: string | null) => (s || '').replace(/[";,]/g, ' ');
    const headers = ['Nom complet', 'Email', 'Rôle', 'CGV Acceptées', 'Date acceptation', 'Statut compte'];
    const rows = filteredCgvUsers.map(u => [
      `"${clean(u.full_name)}"`,
      `"${clean(u.email)}"`,
      (ROLE_CFG[u.role] || ROLE_CFG.locataire).label,
      hasCgv(u) ? 'Oui' : 'Non',
      cgvDate(u) ? new Date(cgvDate(u)!).toLocaleDateString('fr-FR') : '',
      u.suspended ? 'Suspendu' : 'Actif',
    ]);
    const csv = "\uFEFF" + [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homeci_cgv_utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
        {DOCS.map(doc => (
          <button
            key={doc.id}
            onClick={() => setActiveDoc(doc.id)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all"
            style={{
              background: activeDoc === doc.id ? HColors.night : HColors.white,
              color: activeDoc === doc.id ? HColors.gold : HColors.brownMid,
              border: `1px solid ${activeDoc === doc.id ? HAlpha.gold30 : HAlpha.gold20}`,
              boxShadow: activeDoc === doc.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
              fontFamily: 'var(--font-nunito)'
            }}
          >
            <doc.icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{doc.label}</span>
            <span className="sm:hidden">{doc.id === 'locataire' ? 'Locataire' : doc.id === 'proprietaire' ? 'Proprio' : 'Notaire'}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-4 sm:p-8 mb-8" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
        <div className="flex items-start gap-3 mb-8 p-4 rounded-xl" style={{ background: HAlpha.gold05, border: `1px solid ${HAlpha.gold15}` }}>
          <Shield className="w-5 h-5 shrink-0" style={{ color: HColors.gold }} />
          <div>
            <h3 className="font-bold text-sm mb-1" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
              Valeur Juridique — {currentDoc.label}
            </h3>
            <p className="text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
              Ce document fait foi en cas de conflit juridique. Il établit le cadre de responsabilité et les droits de chaque partie.
              Vous pouvez le télécharger au format PDF (.pdf) ou le partager directement par email via Gmail.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 py-4 sm:py-6">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all hover:opacity-90 shadow-md"
            style={{ background: 'linear-gradient(135deg, #1A4F3A, #2D6A4F)', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Télécharger</span> (.pdf)
          </button>

          <button
            onClick={handleShareGmail}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all hover:opacity-90 shadow-md"
            style={{ background: '#EA4335', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Partager via</span> Gmail
          </button>
        </div>
      </div>

      {/* --- Suivi des acceptations CGV --- */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3.5" style={{ borderBottom: `1px solid ${HAlpha.gold10}`, background: 'rgba(249,243,232,0.5)' }}>
          <h3 className="font-bold text-sm" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.3rem' }}>
            Suivi des acceptations
          </h3>
          <select value={filterCgv} onChange={e => setFilterCgv(e.target.value as typeof filterCgv)}
            className="min-w-0 flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs outline-none"
            style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}`, color: HColors.darkBrown }}>
            <option value="all">Tous</option>
            <option value="accepted">CGV acceptées</option>
            <option value="not_accepted">CGV non acceptées</option>
          </select>
          <span className="hidden sm:inline text-xs font-bold opacity-60 sm:ml-auto" style={{ color: HColors.brown }}>
            {acceptedCount}/{users.length} accepté(s)
          </span>
          <button onClick={handleExportCGVCsv} disabled={filteredCgvUsers.length === 0}
            className="ml-auto sm:ml-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: HAlpha.vertCI10, border: `1px solid ${HAlpha.vertCI25}`, color: HColors.vertCI }}>
            <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Exporter</span> CSV
          </button>
        </div>
        <div className="homeci-table-scroll">
          <table className="min-w-full">
            <thead style={{ background: HColors.night }}>
              <tr>
                {['Utilisateur', 'Rôle', 'CGV', 'Date acceptation', 'Statut'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: HAlpha.cream60 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: HAlpha.gold08 }}>
              {filteredCgvUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: HColors.brown }}>Aucun utilisateur trouvé</td></tr>
              ) : filteredCgvUsers.map((user, i) => (
                <tr key={user.id} style={{ background: i % 2 === 0 ? HColors.white : 'rgba(249,243,232,0.4)' }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={{ background: HAlpha.gold10, color: HColors.gold, border: `1px solid ${HAlpha.gold25}` }}>
                        {user.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate max-w-[120px] sm:max-w-none" style={{ color: HColors.darkBrown }}>{user.full_name}</div>
                        <div className="text-[10px] sm:text-xs opacity-60 truncate max-w-[120px] sm:max-w-none" style={{ color: HColors.brown }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
                  <td className="px-5 py-3.5">
                    {hasCgv(user) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: HAlpha.vertCI10, color: HColors.vertCI }}>
                        <CheckCircle className="w-3 h-3" /> Acceptées
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: HAlpha.bord10, color: HColors.bordeaux }}>
                        <XCircle className="w-3 h-3" /> Non acceptées
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: HColors.brown }}>
                    {cgvDate(user) ? new Date(cgvDate(user)!).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: user.suspended ? HAlpha.bord10 : HAlpha.vertCI10, color: user.suspended ? HColors.bordeaux : HColors.vertCI }}>
                      {user.suspended ? 'Suspendu' : 'Actif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
