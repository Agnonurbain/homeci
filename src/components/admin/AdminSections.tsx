import { FC, useState } from 'react';
import {
  MapPin, Calendar, Eye, Download,
  XCircle, Shield, Loader as LoaderIcon
} from 'lucide-react';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { TYPE_LABELS, ROLE_CFG } from '../../constants/labels';
import type { Property } from '../../types/property';
import type { Profile } from '../../contexts/AuthContext';

// --- Shared Components ---
export const SectionTitle: FC<{ title: string; sub: string }> = ({ title, sub }) => (
  <div className="mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
    <h2 className="font-bold mb-0.5" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem' }}>{title}</h2>
    <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>{sub}</p>
  </div>
);

export const RoleBadge: FC<{ role: string }> = ({ role }) => {
  const cfg = ROLE_CFG[role] || ROLE_CFG.locataire;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, border: `1px solid ${cfg.bd}`, color: cfg.text, fontFamily: 'var(--font-nunito)' }}>
      {cfg.label}
    </span>
  );
};

export const PropertyStatusBadge: FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, { bg: string; bd: string; text: string; label: string }> = {
    published: { bg: HAlpha.vertCI10, bd: HAlpha.vertCI25, text: HColors.vertCI, label: 'Publié' },
    pending: { bg: HAlpha.gold10, bd: HAlpha.gold25, text: HColors.brownMid, label: 'En attente' },
    draft: { bg: HAlpha.gold08, bd: HAlpha.gold15, text: HColors.brown, label: 'Brouillon' },
    rejected: { bg: HAlpha.bord10, bd: HAlpha.bord25, text: HColors.bordeaux, label: 'Rejeté' },
    rented: { bg: HAlpha.navy08, bd: HAlpha.navy20, text: HColors.navy, label: 'Loué' },
    sold: { bg: HAlpha.orange10, bd: HAlpha.terra20, text: HColors.brownDeep, label: 'Vendu' },
  };
  const c = cfg[status] || cfg.draft;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, border: `1px solid ${c.bd}`, color: c.text, fontFamily: 'var(--font-nunito)' }}>
      {c.label}
    </span>
  );
};

// --- Users Section ---
interface UsersSectionProps {
  users: (Profile & { suspended?: boolean })[];
  filterRole: string;
  setFilterRole: (role: string) => void;
  filterDate: 'asc' | 'desc';
  setFilterDate: (date: 'asc' | 'desc') => void;
  onViewDetails: (user: Profile) => void;
}

export const UsersSection: FC<UsersSectionProps> = ({
  users, filterRole, setFilterRole, filterDate, setFilterDate, onViewDetails
}) => {
  const handleExportCSV = () => {
    if (users.length === 0) return;
    const clean = (s: string | null) => (s || '').replace(/[";,]/g, ' ');
    const headers = ['Nom complet', 'Email', 'Téléphone', 'Rôle', 'Entreprise', 'Statut', 'Vérifié', 'Inscription'];
    const rows = users.map(u => [
      `"${clean(u.full_name)}"`,
      `"${clean(u.email)}"`,
      u.phone || '',
      u.role,
      `"${clean(u.company_name)}"`,
      u.suspended ? 'Suspendu' : 'Actif',
      u.verified ? 'Oui' : 'Non',
      new Date(u.created_at).toLocaleDateString('fr-FR'),
    ]);
    const csv = "\uFEFF" + [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homeci_utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
  <div className="animate-in fade-in duration-500">
    <SectionTitle title="Gestion des Utilisateurs" sub="Liste des utilisateurs inscrits sur la plateforme" />
    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3.5" style={{ borderBottom: `1px solid ${HAlpha.gold10}`, background: 'rgba(249,243,232,0.5)' }}>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="min-w-0 flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs outline-none" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}`, color: HColors.darkBrown }}>
          <option value="">Tous les rôles</option>
          {['locataire', 'proprietaire', 'agent', 'notaire', 'admin'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <button onClick={() => setFilterDate(filterDate === 'desc' ? 'asc' : 'desc')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/50" style={{ border: `1px solid ${HAlpha.gold20}`, color: HColors.brownMid }}>
          <Calendar className="w-3.5 h-3.5" style={{ color: HColors.orangeCI }} />
          {filterDate === 'desc' ? '↓ Date' : '↑ Date'}
        </button>
        <span className="hidden sm:inline text-xs font-bold opacity-60 sm:ml-auto" style={{ color: HColors.brown }}>{users.length} utilisateur(s)</span>
        <button onClick={handleExportCSV} disabled={users.length === 0}
          className="ml-auto sm:ml-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: HAlpha.vertCI10, border: `1px solid ${HAlpha.vertCI25}`, color: HColors.vertCI }}>
          <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Exporter</span> CSV
        </button>
      </div>
      <div className="homeci-table-scroll">
        <table className="min-w-full">
          <thead style={{ background: HColors.forest }}>
            <tr>{['Utilisateur', 'Rôle', 'Statut', 'Inscription', 'Actions'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: HAlpha.cream60 }}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: HAlpha.gold08 }}>
            {users.map((user, i) => (
              <tr key={user.id} style={{ background: i % 2 === 0 ? HColors.white : 'rgba(249,243,232,0.4)' }}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: HAlpha.gold10, color: HColors.gold, border: `1px solid ${HAlpha.gold25}` }}>
                      {user.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate max-w-[120px] sm:max-w-none" style={{ color: HColors.darkBrown }}>{user.full_name}</div>
                      <div className="text-[10px] sm:text-xs opacity-60 truncate max-w-[120px] sm:max-w-none" style={{ color: HColors.brown }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
                <td className="px-5 py-3.5"><span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: user.suspended ? HAlpha.bord10 : HAlpha.vertCI10, color: user.suspended ? HColors.bordeaux : HColors.vertCI }}>{user.suspended ? 'Suspendu' : 'Actif'}</span></td>
                <td className="px-5 py-3.5 text-xs text-brown">{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                <td className="px-5 py-3.5">
                  <button onClick={() => onViewDetails(user)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 transition-all hover:bg-gray-50"><Eye className="w-3.5 h-3.5" /> Détails</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
};

// --- Moderation Section ---
interface ModerationSectionProps {
  properties: Property[];
  onViewDetails: (prop: Property) => void;
  onReject: (id: string) => void;
  onConsumeToken: (token: string) => Promise<boolean>;
}

export const ModerationSection: FC<ModerationSectionProps> = ({ 
  properties, onViewDetails, onReject, onConsumeToken 
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [consuming, setConsuming] = useState(false);

  const handleApplyToken = async () => {
    setConsuming(true);
    const success = await onConsumeToken(tokenInput);
    if (success) setTokenInput('');
    setConsuming(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <SectionTitle title="Modération des Biens" sub="Approuvez ou rejetez les nouvelles annonces soumises à validation" />
      
      <div className="mb-8 p-6 rounded-2xl shadow-sm border border-dashed flex flex-col md:flex-row md:items-center gap-6" style={{ background: HAlpha.orange08, borderColor: HAlpha.orange30 }}>
        <div className="flex-1">
          <h4 className="text-lg font-bold flex items-center gap-2 mb-1" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}><Shield className="w-5 h-5 text-orange-600" /> Délégation Notaire</h4>
          <p className="text-sm" style={{ color: HColors.brown }}>Utilisez un jeton à usage unique fourni par un notaire pour finaliser une modération.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:min-w-[300px]">
          <input type="text" value={tokenInput} onChange={e => setTokenInput(e.target.value.toUpperCase())} placeholder="JETON (HC-XXXXXX)" className="flex-1 px-4 py-2.5 rounded-xl font-mono font-bold tracking-widest outline-none border border-orange-200 text-sm" />
          <button onClick={handleApplyToken} disabled={consuming || !tokenInput} className="px-6 py-2.5 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px] sm:min-h-0" style={{ background: `linear-gradient(135deg,${HColors.orangeCI},${HColors.gold})`, color: '#FFF' }}>
            {consuming ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />} Valider
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {properties.length === 0 ? (
          <div className="rounded-2xl p-16 text-center border bg-white"><h3 className="font-bold text-gray-400">File de modération vide</h3></div>
        ) : properties.map(p => (
          <div key={p.id} className="rounded-2xl overflow-hidden border bg-white flex flex-col sm:flex-row items-center gap-4 p-5 hover:shadow-md transition-all">
            <img src={p.images?.[0] || ''} alt="" className="w-20 h-20 rounded-xl object-cover border" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-darkBrown truncate mb-1">{p.title}</h3>
              <div className="flex flex-wrap gap-3 text-xs text-brown">
                <span>{TYPE_LABELS[p.property_type]}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-orange-600" />{p.city}</span>
                <span className="font-bold text-orange-600">{p.price.toLocaleString()} FCFA</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onViewDetails(p)} className="px-4 py-2 text-xs font-medium rounded-xl border bg-gray-50 hover:bg-gray-100"><Eye className="w-3.5 h-3.5 mr-1 inline" /> Voir</button>
              <button onClick={() => onReject(p.id)} className="px-4 py-2 text-xs font-medium rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"><XCircle className="w-3.5 h-3.5 mr-1 inline" /> Rejeter</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
