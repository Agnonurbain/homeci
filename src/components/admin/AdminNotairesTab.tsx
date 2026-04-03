import React, { useState, useEffect } from 'react';
import { 
  Award, Calendar, Copy, XCircle, RotateCcw, Plus, Loader as LoaderIcon 
} from 'lucide-react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { SectionTitle } from './AdminSections';

interface NotaireCode {
  id: string;
  code: string;
  used: boolean;
  used_at?: string;
  created_at: string;
  expires_at?: string;
  note?: string | null;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(10);
  crypto.getRandomValues(array);
  return Array.from(array, b => chars[b % chars.length]).join('');
}

interface AdminNotairesTabProps {
  showToast: (msg: string, ok?: boolean) => void;
}

export const AdminNotairesTab: React.FC<AdminNotairesTabProps> = ({ showToast }) => {
  const [codes, setCodes] = useState<NotaireCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [note, setNote] = useState('');
  const [expireDays, setExpireDays] = useState(7);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { loadCodes(); }, []);

  async function loadCodes() {
    setLoading(true);
    try {
      const q = query(collection(db, 'notaire_codes'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      const toISO = (v: any) => {
        if (!v) return undefined;
        if (v instanceof Timestamp) return v.toDate().toISOString();
        if (typeof v === 'string') return v;
        return String(v);
      };
      setCodes(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          created_at: toISO(data.created_at),
          expires_at: toISO(data.expires_at),
          used_at: toISO(data.used_at),
        } as NotaireCode;
      }));
    } catch (e) { console.error('[HOMECI] Load codes error:', e); }
    finally { setLoading(false); }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const code = generateCode();
      const expires = new Date();
      expires.setDate(expires.getDate() + expireDays);
      const data = {
        code,
        used: false,
        created_at: new Date().toISOString(),
        expires_at: expires.toISOString(),
        note: note.trim() || null,
      };
      const ref = await addDoc(collection(db, 'notaire_codes'), data);
      setCodes(prev => [{ id: ref.id, ...data }, ...prev]);
      setNote('');
      showToast(`Code notaire généré : ${code}`);
    } catch { showToast('Erreur lors de la génération', false); }
    finally { setGenerating(false); }
  }

  async function handleRevoke(id: string) {
    try {
      await updateDoc(doc(db, 'notaire_codes', id), { used: true, used_at: new Date().toISOString() });
      setCodes(prev => prev.map(c => c.id === id ? { ...c, used: true } : c));
      showToast('Code révoqué.');
    } catch { showToast('Erreur', false); }
  }

  async function handleCopy(code: string, id: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const isExpired = (c: NotaireCode) => c.expires_at ? new Date(c.expires_at) < new Date() : false;

  return (
    <div className="animate-in fade-in duration-500">
      <SectionTitle title="Codes d'invitation Notaires" sub="Générez des codes à usage unique pour permettre l'inscription des notaires agréés" />

      {/* Générateur */}
      <div className="rounded-2xl p-6 mb-6 shadow-sm" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
        <h3 className="font-bold mb-4" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.2rem' }}>Générer un nouveau code</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: HColors.brownMid }}>Note (optionnel)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: Me Konaté, Cabinet Abidjan..." className="w-full px-3 py-2.5 rounded-xl outline-none text-sm bg-gray-50 border border-gray-200" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: HColors.brownMid }}>Expire dans</label>
            <select value={expireDays} onChange={e => setExpireDays(Number(e.target.value))} className="px-3 py-2.5 rounded-xl outline-none text-sm bg-gray-50 border border-gray-200">
              <option value={1}>1 jour</option><option value={3}>3 jours</option><option value={7}>7 jours</option><option value={30}>30 jours</option>
            </select>
          </div>
          <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#FF6B00,#D4A017)', color: '#FFF' }}>
            {generating ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Générer
          </button>
        </div>
      </div>

      {/* Liste codes */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold" style={{ color: HColors.darkBrown, fontSize: '1.1rem' }}>Codes générés</h3>
          <button onClick={loadCodes} className="text-xs flex items-center gap-1 hover:opacity-70 transition-all font-semibold" style={{ color: HColors.brown }}><RotateCcw className="w-3.5 h-3.5" /> Actualiser</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><LoaderIcon className="w-6 h-6 animate-spin text-gold" /></div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12"><Award className="w-10 h-10 mx-auto mb-3 opacity-20" /><p className="text-sm font-semibold text-gray-400">Aucun code généré pour l'instant</p></div>
        ) : (
          <div className="divide-y">
            {codes.map((c, i) => {
              const expired = isExpired(c);
              const inactive = c.used || expired;
              return (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-all" style={{ opacity: inactive ? 0.6 : 1 }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-bold tracking-widest text-sm text-darkBrown">{c.code}</span>
                      {c.note && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{c.note}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${c.used ? 'bg-green-100 text-green-700' : expired ? 'bg-red-100 text-red-700' : 'bg-gold/10 text-gold-700'}`} style={{ color: c.used ? '#009E49' : expired ? '#B91C1C' : '#D4A017' }}>{c.used ? 'Utilisé' : expired ? 'Expiré' : 'Actif'}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-brown">
                      <span>Créé le {new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                      {c.expires_at && <span>Expire le {new Date(c.expires_at).toLocaleDateString('fr-FR')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!inactive && (
                      <>
                        <button onClick={() => handleCopy(c.code, c.id)} className="px-2.5 py-1.5 text-xs font-bold rounded-lg border bg-white hover:bg-gray-50"><Copy className="w-3 h-3 mr-1 inline" /> {copiedId === c.id ? 'Copié !' : 'Copier'}</button>
                        <button onClick={() => handleRevoke(c.id)} className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1 inline" /> Révoquer</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
