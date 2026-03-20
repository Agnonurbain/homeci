import { useState, useEffect, useMemo } from 'react';
import { Search, UserX, UserCheck, Shield, User, Mail, Phone, Calendar, AlertTriangle, Loader, X } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  suspended?: boolean;
  suspended_at?: string;
  suspension_reason?: string;
  created_at: string;
}

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  locataire:    { bg: HAlpha.navy08,    text: HColors.navy,     label: 'Locataire' },
  proprietaire: { bg: HAlpha.vertCI10,  text: HColors.vertCI,   label: 'Propriétaire' },
  notaire:      { bg: HAlpha.orange10,  text: HColors.orangeCI, label: 'Notaire' },
  admin:        { bg: 'rgba(139,29,29,0.08)', text: '#8B1D1D',  label: 'Admin' },
};

export default function AdminUsersSearchTab({ showToast }: { showToast: (msg: string, ok?: boolean) => void }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');
  const [suspendModal, setSuspendModal] = useState<{ user: UserRecord; reason: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            email: String(data.email || ''),
            full_name: String(data.full_name || ''),
            phone: data.phone ? String(data.phone) : null,
            role: String(data.role || 'locataire'),
            avatar_url: data.avatar_url ? String(data.avatar_url) : null,
            suspended: Boolean(data.suspended),
            suspended_at: data.suspended_at ? String(data.suspended_at) : undefined,
            suspension_reason: data.suspension_reason ? String(data.suspension_reason) : undefined,
            created_at: data.created_at?.toDate?.() ? data.created_at.toDate().toISOString() : String(data.created_at || ''),
          } as UserRecord;
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setUsers(list);
      } catch (e) {
        console.error('[HOMECI] Load users error:', e);
      } finally { setLoading(false); }
    })();
  }, []);

  // Search + filters
  const filtered = useMemo(() => {
    let result = users;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        u.id.toLowerCase().includes(q)
      );
    }
    if (filterRole) result = result.filter(u => u.role === filterRole);
    if (filterStatus === 'active') result = result.filter(u => !u.suspended);
    if (filterStatus === 'suspended') result = result.filter(u => u.suspended);
    return result;
  }, [users, searchQuery, filterRole, filterStatus]);

  const handleSuspend = async () => {
    if (!suspendModal || !suspendModal.reason.trim()) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', suspendModal.user.id), {
        suspended: true,
        suspended_at: serverTimestamp(),
        suspension_reason: suspendModal.reason.trim(),
      });
      setUsers(prev => prev.map(u => u.id === suspendModal.user.id ? { ...u, suspended: true, suspension_reason: suspendModal.reason.trim() } : u));
      showToast(`${suspendModal.user.full_name} a été suspendu.`);
      setSuspendModal(null);
    } catch { showToast('Erreur', false); }
    finally { setActionLoading(false); }
  };

  const handleReactivate = async (user: UserRecord) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        suspended: false,
        suspended_at: null,
        suspension_reason: null,
      });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, suspended: false, suspension_reason: undefined } : u));
      showToast(`${user.full_name} a été réactivé.`);
    } catch { showToast('Erreur', false); }
    finally { setActionLoading(false); }
  };

  const suspendedCount = users.filter(u => u.suspended).length;

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: HAlpha.gold20, borderTopColor: HColors.gold }} />
    </div>
  );

  return (
    <div>
      <h2 className="font-bold text-xl mb-1" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
        Gestion des utilisateurs
      </h2>
      <p className="text-sm mb-6" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
        {users.length} utilisateur{users.length > 1 ? 's' : ''} inscrits
        {suspendedCount > 0 && (
          <span style={{ color: '#8B1D1D', fontWeight: 600 }}> · {suspendedCount} suspendu{suspendedCount > 1 ? 's' : ''}</span>
        )}
      </p>

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: HAlpha.gold50 }} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone ou ID..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }} />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X className="w-3.5 h-3.5" style={{ color: HColors.brown }} />
            </button>
          )}
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-3 rounded-xl text-xs outline-none"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}`, color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
          <option value="">Tous les rôles</option>
          <option value="locataire">Locataire</option>
          <option value="proprietaire">Propriétaire</option>
          <option value="notaire">Notaire</option>
          <option value="admin">Admin</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
          className="px-3 py-3 rounded-xl text-xs outline-none"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}`, color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs mb-4" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
        {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
        {searchQuery && ` pour « ${searchQuery} »`}
      </p>

      {/* Users list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-14 text-center"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <Search className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold25 }} />
          <p className="font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.2rem' }}>
            Aucun utilisateur trouvé
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, 50).map(user => {
            const rs = ROLE_STYLES[user.role] || ROLE_STYLES.locataire;
            return (
              <div key={user.id} className="rounded-xl p-4"
                style={{
                  background: user.suspended ? 'rgba(139,29,29,0.03)' : HColors.white,
                  border: `1px solid ${user.suspended ? 'rgba(139,29,29,0.2)' : HAlpha.gold15}`,
                }}>
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                    style={{ background: HAlpha.orange10, border: `1px solid ${HAlpha.orange20}` }}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" style={{ color: HColors.orangeCI }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
                        {user.full_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: rs.bg, color: rs.text, fontFamily: 'var(--font-nunito)' }}>
                        {rs.label}
                      </span>
                      {user.suspended && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: 'rgba(139,29,29,0.1)', color: '#8B1D1D', fontFamily: 'var(--font-nunito)' }}>
                          SUSPENDU
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" style={{ color: HColors.orangeCI }} />{user.email || 'Téléphone'}
                      </span>
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" style={{ color: HColors.vertCI }} />+225 {user.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {user.suspended && user.suspension_reason && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#8B1D1D', fontFamily: 'var(--font-nunito)' }}>
                        <AlertTriangle className="w-3 h-3" /> Motif : {user.suspension_reason}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {user.role !== 'admin' && (
                    <div className="shrink-0">
                      {user.suspended ? (
                        <button onClick={() => handleReactivate(user)} disabled={actionLoading}
                          className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all hover:opacity-80 disabled:opacity-50"
                          style={{ background: HAlpha.vertCI10, color: HColors.vertCI, border: `1px solid ${HAlpha.vertCI25}`, fontFamily: 'var(--font-nunito)' }}>
                          <UserCheck className="w-3 h-3" /> Réactiver
                        </button>
                      ) : (
                        <button onClick={() => setSuspendModal({ user, reason: '' })} disabled={actionLoading}
                          className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all hover:opacity-80 disabled:opacity-50"
                          style={{ background: 'rgba(139,29,29,0.08)', color: '#8B1D1D', border: '1px solid rgba(139,29,29,0.2)', fontFamily: 'var(--font-nunito)' }}>
                          <UserX className="w-3 h-3" /> Suspendre
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suspend modal */}
      {suspendModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'linear-gradient(160deg, #0D1F12, #1A0E00)', border: `1px solid ${HAlpha.gold25}` }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(139,29,29,0.15)', border: '1px solid rgba(139,29,29,0.3)' }}>
                <UserX className="w-5 h-5" style={{ color: '#FF6B6B' }} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
                  Suspendre {suspendModal.user.full_name}
                </h3>
                <p className="text-xs" style={{ color: HAlpha.cream40, fontFamily: 'var(--font-nunito)' }}>
                  {suspendModal.user.email} · {suspendModal.user.role}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                Motif de suspension *
              </label>
              <textarea value={suspendModal.reason} onChange={e => setSuspendModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
                rows={3} placeholder="Décrivez la raison de la suspension..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.25)',
                         color: HColors.cream, fontFamily: 'var(--font-nunito)' }} />
            </div>

            <div className="p-3 rounded-xl mb-5" style={{ background: 'rgba(139,29,29,0.1)', border: '1px solid rgba(139,29,29,0.2)' }}>
              <p className="text-xs" style={{ color: 'rgba(255,170,170,0.9)', fontFamily: 'var(--font-nunito)' }}>
                L'utilisateur ne pourra plus accéder à son compte ni publier de biens. Cette action est réversible.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSuspendModal(null)}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ border: `1px solid ${HAlpha.gold25}`, color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                Annuler
              </button>
              <button onClick={handleSuspend} disabled={!suspendModal.reason.trim() || actionLoading}
                className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: '#8B1D1D', color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
                {actionLoading ? <Loader className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                Suspendre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
