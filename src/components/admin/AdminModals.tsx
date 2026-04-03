import React from 'react';
import { XCircle, MapPin, Building2, Calendar, Eye, Shield, CheckCircle } from 'lucide-react';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { TYPE_LABELS, ROLE_CFG } from '../../constants/labels';
import type { Property } from '../../types/property';
import type { Profile } from '../../contexts/AuthContext';

interface UserModalProps {
  user: (Profile & { suspended?: boolean }) | null;
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserModalProps> = ({ user, onClose }) => {
  if (!user) return null;
  const cfg = ROLE_CFG[user.role] || ROLE_CFG.locataire;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#FF6B00,#009E49,#FFFFFF,#D4A017)' }} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl"
                style={{ background: HAlpha.gold15, color: HColors.gold, border: `2px solid ${HAlpha.gold30}` }}>
                {user.full_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h3 className="font-bold mb-1" style={{ color: HColors.darkBrown, fontSize: '1.3rem' }}>{user.full_name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.bd}`, color: cfg.text }}>
                  {cfg.label}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:opacity-70 transition-all"
              style={{ background: HAlpha.gold08, color: HColors.brown }}>
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Email', value: user.email, icon: '✉' },
              { label: 'Téléphone', value: user.phone || '—', icon: '📞' },
              { label: 'Entreprise', value: user.company_name || '—', icon: '🏢' },
              { label: 'Statut', value: user.suspended ? 'Suspendu' : 'Actif', icon: '👤' },
              { label: 'Vérifié', value: user.verified ? 'Oui ✓' : 'Non', icon: '🔒' },
              { label: 'Inscrit le', value: new Date(user.created_at).toLocaleDateString('fr-FR'), icon: '📅' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl"
                style={{ background: HColors.creamBg, border: `1px solid ${HAlpha.gold10}` }}>
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider shrink-0"
                  style={{ color: HColors.brownMid }}>
                  <span>{icon}</span>{label}
                </span>
                <span className="text-xs text-right truncate" style={{ color: HColors.darkBrown }}>{value}</span>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: HAlpha.gold08, border: `1px solid ${HAlpha.gold20}`, color: HColors.brownMid }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

interface PropertyModalProps {
  property: Property | null;
  onClose: () => void;
  onReject: (id: string) => void;
}

export const PropertyDetailModal: React.FC<PropertyModalProps> = ({ property, onClose, onReject }) => {
  if (!property) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        style={{ background: HColors.white, border: `1px solid ${HAlpha.gold20}` }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#FF6B00,#009E49,#FFFFFF,#D4A017)' }} />

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${HAlpha.gold10}` }}>
          <div>
            <h3 className="font-bold" style={{ color: HColors.darkBrown, fontSize: '1.4rem' }}>{property.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs" style={{ color: HColors.brown }}>
                {TYPE_LABELS[property.property_type] || property.property_type}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:opacity-70 transition-all"
            style={{ background: HAlpha.gold08, color: HColors.brown }}>
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {property.images && property.images.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: HColors.brownMid }}>Photos</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {property.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-32 h-24 rounded-xl object-cover shrink-0" style={{ border: `1px solid ${HAlpha.gold20}` }} />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Prix', value: `${property.price.toLocaleString('fr-FR')} FCFA` },
              { label: 'Type', value: TYPE_LABELS[property.property_type] || property.property_type },
              { label: 'Ville', value: property.city },
              { label: 'Surface', value: property.surface_area ? `${property.surface_area} m²` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 px-3 rounded-xl"
                style={{ background: HColors.creamBg, border: `1px solid ${HAlpha.gold10}` }}>
                <span className="text-xs font-semibold" style={{ color: HColors.brownMid }}>{label}</span>
                <span className="text-xs font-bold" style={{ color: HColors.darkBrown }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4" style={{ borderTop: `1px solid ${HAlpha.gold10}` }}>
          {property.status === 'pending' && (
            <button onClick={() => { onReject(property.id); onClose(); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-red-50"
              style={{ background: HAlpha.bord10, border: `1px solid ${HAlpha.bord25}`, color: HColors.bordeaux }}>
              <XCircle className="w-4 h-4" /> Rejeter
            </button>
          )}
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: HAlpha.gold08, border: `1px solid ${HAlpha.gold20}`, color: HColors.brownMid }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
