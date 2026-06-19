import { useState, useRef } from 'react';
import { X, Camera, Save, Loader, User, Phone, Building2, CheckCircle, MapPin, Award, Wallet, Bell } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storageService';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useEscapeClose } from '../hooks/useEscapeClose';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  useEscapeClose(onClose);
  const { user, profile, refreshProfile } = useAuth();
  useBodyScrollLock(isOpen);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [notaireId, setNotaireId] = useState(profile?.notaire_id || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [isAgent, setIsAgent] = useState(profile?.is_agent || false);
  const [prefBudget, setPrefBudget] = useState(profile?.preferences?.budget_max?.toString() || '');
  const [notifVisits, setNotifVisits] = useState(profile?.notification_prefs?.visits !== false);
  const [notifCertifications, setNotifCertifications] = useState(profile?.notification_prefs?.certifications !== false);
  const [notifSystem, setNotifSystem] = useState(profile?.notification_prefs?.system !== false);
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
        updates.address = address.trim() || null;
      }
      if (profile.role === 'notaire') {
        updates.notaire_id = notaireId.trim() || null;
      }
      if (profile.role === 'proprietaire') {
        updates.is_agent = isAgent;
      }
      if (profile.role === 'locataire') {
        updates.preferences = {
          ...profile.preferences,
          budget_max: prefBudget ? parseInt(prefBudget) : null
        };
      }
      updates.notification_prefs = {
        visits: notifVisits,
        certifications: notifCertifications,
        system: notifSystem,
      };
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

        <div className="p-5 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto homeci-scrollbar">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-xl font-bold" style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
              Mon Profil
            </h2>
            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2"
              style={{ background: profile.role === 'admin' ? HAlpha.orange10 : HAlpha.gold10,
                       color: profile.role === 'admin' ? HColors.orangeCI : HColors.gold,
                       border: `1px solid ${profile.role === 'admin' ? HAlpha.orange25 : HAlpha.gold25}`,
                       fontFamily: 'var(--font-nunito)' }}>
              {roleLabels[profile.role] || profile.role}
            </div>
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
            <label htmlFor="profile-fullname" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
              Nom complet *
            </label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.25)' }}>
              <User className="w-4 h-4 shrink-0" style={{ color: HAlpha.gold50 }} />
              <input id="profile-fullname" type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Votre nom et prénom"
                className="flex-1 bg-transparent outline-none focus:ring-2 focus:ring-[#D4A017]/40 text-sm"
                style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }} />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label htmlFor="profile-phone" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
              style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
              Téléphone
            </label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.25)' }}>
              <Phone className="w-4 h-4 shrink-0" style={{ color: HAlpha.gold50 }} />
              <span className="text-sm shrink-0" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>+225</span>
              <input id="profile-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="07 00 00 00 00" maxLength={10}
                className="flex-1 bg-transparent outline-none focus:ring-2 focus:ring-[#D4A017]/40 text-sm"
                style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }} />
            </div>
          </div>

          {/* Entreprise & Adresse (propriétaire/notaire) */}
          {(profile.role === 'proprietaire' || profile.role === 'notaire') && (
            <div className="space-y-4">
              <div>
                <label htmlFor="profile-employer" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                  {profile.role === 'notaire' ? 'Cabinet / Étude notariale' : 'Entreprise (optionnel)'}
                </label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.25)' }}>
                  <Building2 className="w-4 h-4 shrink-0" style={{ color: HAlpha.gold50 }} />
                  <input id="profile-employer" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                    placeholder="Nom de l'entreprise"
                    className="flex-1 bg-transparent outline-none focus:ring-2 focus:ring-[#D4A017]/40 text-sm"
                    style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }} />
                </div>
              </div>

              {profile.role === 'notaire' && (
                <div>
                  <label htmlFor="profile-occupation" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                    style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                    N° d'agrément Notaire *
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.25)' }}>
                    <Award className="w-4 h-4 shrink-0" style={{ color: HAlpha.gold50 }} />
                    <input id="profile-occupation" type="text" value={notaireId} onChange={e => setNotaireId(e.target.value)}
                      placeholder="Ex: NOT-2024-XXXX"
                      className="flex-1 bg-transparent outline-none focus:ring-2 focus:ring-[#D4A017]/40 text-sm"
                      style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }} />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="profile-city" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                  Adresse professionnelle
                </label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.25)' }}>
                  <MapPin className="w-4 h-4 shrink-0" style={{ color: HAlpha.gold50 }} />
                  <input id="profile-city" type="text" value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="Ville, Commune, Quartier"
                    className="flex-1 bg-transparent outline-none focus:ring-2 focus:ring-[#D4A017]/40 text-sm"
                    style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }} />
                </div>
              </div>

              {profile.role === 'proprietaire' && (
                <div className="flex items-center gap-3 px-4 py-2">
                  <input type="checkbox" id="isAgent" checked={isAgent} onChange={e => setIsAgent(e.target.checked)}
                    className="w-4 h-4 rounded border-[rgba(212,160,23,0.20)] text-orange-600 focus:ring-orange-500" />
                  <label htmlFor="isAgent" className="text-sm cursor-pointer" style={{ color: HAlpha.cream70, fontFamily: 'var(--font-nunito)' }}>
                    Je suis un agent immobilier ou une agence
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Préférences (Locataire) */}
          {profile.role === 'locataire' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="profile-revenue" className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
                  Votre Budget Max (FCFA)
                </label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.25)' }}>
                  <Wallet className="w-4 h-4 shrink-0" style={{ color: HAlpha.gold50 }} />
                  <input id="profile-revenue" type="number" value={prefBudget} onChange={e => setPrefBudget(e.target.value)}
                    placeholder="Ex: 500000"
                    className="flex-1 bg-transparent outline-none focus:ring-2 focus:ring-[#D4A017]/40 text-sm"
                    style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }} />
                </div>
              </div>
              <p className="text-[10px]" style={{ color: HAlpha.cream40, fontFamily: 'var(--font-nunito)' }}>
                Ces informations nous aident à vous proposer des biens plus pertinents.
              </p>
            </div>
          )}

          {/* Préférences de notification */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(212,160,23,0.7)', fontFamily: 'var(--font-nunito)' }}>
              <Bell className="w-3.5 h-3.5" /> Notifications
            </label>
            {([
              { id: 'visits', label: 'Visites (demandes, acceptations, refus)', checked: notifVisits, onChange: setNotifVisits },
              { id: 'certifications', label: 'Certifications notaire', checked: notifCertifications, onChange: setNotifCertifications },
              { id: 'system', label: 'Système et annonces', checked: notifSystem, onChange: setNotifSystem },
            ] as const).map(pref => (
              <label key={pref.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer"
                style={{ background: 'rgba(13,31,18,0.7)', border: '1px solid rgba(212,160,23,0.25)' }}>
                <input type="checkbox" checked={pref.checked} onChange={e => pref.onChange(e.target.checked)}
                  className="w-4 h-4 rounded accent-current" style={{ accentColor: HColors.orangeCI }} />
                <span className="text-sm" style={{ color: HColors.cream, fontFamily: 'var(--font-nunito)' }}>
                  {pref.label}
                </span>
              </label>
            ))}
          </div>

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
