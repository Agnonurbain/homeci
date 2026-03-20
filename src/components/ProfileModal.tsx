import { useState, useRef } from 'react';
import { X, Camera, Save, Loader, User, Phone, Building2, CheckCircle } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storageService';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  useBodyScrollLock(isOpen);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user || !profile) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 2 Mo.');
      return;
    }
    setAvatarLoading(true); setError('');
    try {
      const url = await storageService.uploadImage(file, `avatars/${user.uid}`);
      await updateDoc(doc(db, 'users', user.uid), {
        avatar_url: url,
        updated_at: serverTimestamp(),
      });
      await refreshProfile();
    } catch {
      setError('Erreur lors de l\'upload de la photo.');
    } finally { setAvatarLoading(false); }
  };

  const handleSave = async () => {
    if (!fullName.trim()) { setError('Le nom est obligatoire.'); return; }
    if (phone && !/^(0[1579])\d{8}$/.test(phone.replace(/\s/g, ''))) {
      setError('Numéro ivoirien invalide (ex: 07 00 00 00 00).');
      return;
    }
    setLoading(true); setError('');
    try {
      const updates: Record<string, any> = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        updated_at: serverTimestamp(),
      };
      if (profile.role === 'proprietaire' || profile.role === 'notaire') {
        updates.company_name = companyName.trim() || null;
      }
      await updateDoc(doc(db, 'users', user.uid), updates);
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    } catch {
      setError('Erreur lors de la sauvegarde.');
    } finally { setLoading(false); }
  };

  const roleLabels: Record<string, string> = {
    locataire: 'Locataire / Acheteur',
    proprietaire: 'Propriétaire',
    notaire: 'Notaire Agréé',
    admin: 'Administrateur',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #0D1F12 0%, #1A0E00 100%)',
                 border: `1px solid ${HAlpha.gold25}` }}>

        {/* Kente */}
        <div className="flex" style={{ height: 3 }}>
          {['#FF6B00','#009E49','#FFFFFF','#D4A017','#FF6B00','#009E49','#FFFFFF','#D4A017',
            '#FF6B00','#009E49','#FFFFFF','#D4A017'].map((c, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full transition-all hover:opacity-80"
          style={{ background: 'rgba(245,230,200,0.08)' }}>
          <X className="w-4 h-4" style={{ color: HAlpha.cream60 }} />
        </button>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-xl font-bold" style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
              Mon Profil
            </h2>
            <p className="text-xs mt-1" style={{ color: HAlpha.cream40, fontFamily: 'var(--font-nunito)' }}>
              {roleLabels[profile.role] || profile.role}
            </p>
          </div>

          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: HAlpha.orange10, border: `3px solid ${HAlpha.orange25}` }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8" style={{ color: HColors.orangeCI }} />
                )}
                {avatarLoading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full"
                    style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <Loader className="w-6 h-6 animate-spin" style={{ color: HColors.cream }} />
                  </div>
                )}
              </div>
              <button onClick={() => fileRef.current?.click()}
                disabled={avatarLoading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                style={{ background: HColors.orangeCI, border: '2px solid #0D1F12' }}>
                <Camera className="w-3.5 h-3.5" style={{ color: '#FFFFFF' }} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={handleAvatarChange} />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
              Email
            </label>
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(13,31,18,0.5)', border: '1px solid rgba(212,160,23,0.12)',
                       color: HAlpha.cream40, fontFamily: 'var(--font-nunito)' }}>
              {profile.email || 'Connecté par téléphone'}
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
              Nom complet *
            </label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.25)' }}>
              <User className="w-4 h-4 shrink-0" style={{ color: HAlpha.gold50 }} />
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Votre nom et prénom"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }} />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
              Téléphone
            </label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.25)' }}>
              <Phone className="w-4 h-4 shrink-0" style={{ color: HAlpha.gold50 }} />
              <span className="text-sm shrink-0" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>+225</span>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="07 00 00 00 00" maxLength={10}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }} />
            </div>
          </div>

          {/* Entreprise (propriétaire/notaire) */}
          {(profile.role === 'proprietaire' || profile.role === 'notaire') && (
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                {profile.role === 'notaire' ? 'Cabinet / Étude notariale' : 'Entreprise (optionnel)'}
              </label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.25)' }}>
                <Building2 className="w-4 h-4 shrink-0" style={{ color: HAlpha.gold50 }} />
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                  placeholder="Nom de l'entreprise"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-center" style={{ color: '#FFAAAA', fontFamily: 'var(--font-nunito)' }}>
              {error}
            </p>
          )}

          {/* Success */}
          {success ? (
            <div className="flex items-center justify-center gap-2 py-3"
              style={{ color: HColors.vertCI, fontFamily: 'var(--font-nunito)' }}>
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">Profil mis à jour !</span>
            </div>
          ) : (
            <button onClick={handleSave} disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #D4A017 100%)',
                       color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
