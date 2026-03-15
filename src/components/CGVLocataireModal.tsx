import { useState, useRef } from 'react';
import { CheckCircle, ScrollText, Shield, AlertTriangle } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { KenteLine } from './ui/KenteLine';

interface CGVLocataireModalProps {
  onAccept: () => void;
  onClose: () => void;
}

export default function CGVLocataireModal({ onAccept, onClose }: CGVLocataireModalProps) {
  const { user, refreshProfile } = useAuth();
  useBodyScrollLock(true);
  const [checked, setChecked] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) setHasScrolledToBottom(true);
  };

  const handleAccept = async () => {
    if (!user || !checked) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        cgv_accepted: true,
        cgv_accepted_at: new Date().toISOString(),
        updated_at: serverTimestamp(),
      });
      await refreshProfile();
      onAccept();
    } catch (err) {
      console.error('[HOMECI] Erreur CGV locataire:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(10,22,14,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: HColors.night, border: `1px solid ${HAlpha.gold20}`, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <KenteLine />
          <div className="flex items-center gap-3 mt-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: HAlpha.gold12, border: `1px solid ${HAlpha.gold20}` }}>
              <ScrollText className="w-5 h-5" style={{ color: HColors.gold }} />
            </div>
            <div>
              <h2 className="text-lg font-bold"
                style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
                Conditions d'utilisation — Locataire
              </h2>
              <p className="text-xs" style={{ color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>
                Veuillez lire et accepter avant de demander votre première visite
              </p>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div ref={scrollRef} onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 pb-2" style={{ maxHeight: '50vh' }}>
          <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-4"
            style={{ color: 'rgba(245,230,200,0.75)', fontFamily: 'var(--font-nunito)' }}>

            <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
              style={{ background: HAlpha.gold05, border: `1px solid ${HAlpha.gold15}` }}>
              <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: HColors.gold }} />
              <p className="text-xs" style={{ color: HColors.gold }}>
                Ce document régit vos droits et obligations en tant que locataire/acheteur sur HOMECI.
              </p>
            </div>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 1 — Objet
            </h3>
            <p>
              Les présentes Conditions Générales d'Utilisation régissent l'accès et l'utilisation de la plateforme
              HOMECI par les locataires et acheteurs souhaitant consulter des annonces immobilières et demander
              des visites de biens en Côte d'Ivoire.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 2 — Demandes de visite
            </h3>
            <p>
              Chaque demande de visite est soumise à des frais de service de 500 FCFA, payables via Mobile Money
              (Orange Money, MTN MoMo, Wave ou Moov Flooz). Ces frais couvrent la mise en relation avec le
              propriétaire et la coordination de la visite. Les frais ne sont pas remboursables en cas d'annulation
              par le demandeur.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 3 — Engagements du locataire
            </h3>
            <p>Le locataire/acheteur s'engage à :</p>
            <p style={{ paddingLeft: '1rem' }}>
              a) Fournir des informations d'identité exactes lors de son inscription sur la plateforme.
            </p>
            <p style={{ paddingLeft: '1rem' }}>
              b) Se présenter aux visites programmées ou prévenir le propriétaire en cas d'empêchement
              au moins 24 heures à l'avance.
            </p>
            <p style={{ paddingLeft: '1rem' }}>
              c) Respecter les biens visités et ne causer aucun dommage lors des visites.
            </p>
            <p style={{ paddingLeft: '1rem' }}>
              d) Ne pas utiliser les coordonnées des propriétaires obtenues via la plateforme à des fins
              commerciales, frauduleuses ou de harcèlement.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 4 — Annonces vérifiées
            </h3>
            <p>
              HOMECI s'engage à ce que chaque bien publié soit vérifié par un notaire agréé. Cependant,
              HOMECI ne garantit pas l'état final du bien et encourage le locataire à effectuer ses propres
              vérifications lors de la visite.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 5 — Responsabilité
            </h3>
            <p>
              HOMECI agit en tant qu'intermédiaire de mise en relation. La plateforme ne saurait être tenue
              responsable des litiges entre locataires et propriétaires, ni de l'état réel des biens proposés.
              Toute transaction financière directe entre les parties se fait sous leur seule responsabilité.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 6 — Protection des données
            </h3>
            <p>
              Vos données personnelles sont traitées conformément à la loi n°2013-450 relative à la protection
              des données à caractère personnel en Côte d'Ivoire. Vous disposez d'un droit d'accès,
              de rectification et de suppression en contactant contact@homeci.ci.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 7 — Droit applicable
            </h3>
            <p>
              Les présentes conditions sont régies par le droit ivoirien. Tout litige sera soumis
              aux juridictions compétentes d'Abidjan.
            </p>

            <p className="pt-3" style={{ color: 'rgba(245,230,200,0.4)', fontStyle: 'italic', fontSize: '0.75rem' }}>
              Dernière mise à jour : Mars 2026
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        {!hasScrolledToBottom && (
          <div className="px-6 py-2 flex items-center gap-2 text-xs shrink-0"
            style={{ color: 'rgba(212,160,23,0.6)', fontFamily: 'var(--font-nunito)', borderTop: `1px solid ${HAlpha.gold10}` }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Faites défiler pour lire l'intégralité des conditions
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 shrink-0"
          style={{ borderTop: `1px solid ${HAlpha.gold15}`, background: 'rgba(10,22,14,0.5)' }}>
          <label className="flex items-start gap-3 cursor-pointer mb-4 select-none">
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
              disabled={!hasScrolledToBottom} className="mt-0.5 w-4 h-4 rounded accent-amber-500" />
            <span className="text-sm leading-snug"
              style={{ color: hasScrolledToBottom ? HColors.cream : 'rgba(245,230,200,0.35)', fontFamily: 'var(--font-nunito)' }}>
              J'ai lu et j'accepte les Conditions Générales d'Utilisation de HOMECI en tant que locataire/acheteur.
            </span>
          </label>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                       color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>
              Annuler
            </button>
            <button onClick={handleAccept} disabled={!checked || !hasScrolledToBottom || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: checked && hasScrolledToBottom ? HColors.gold : 'rgba(212,160,23,0.2)',
                color: checked && hasScrolledToBottom ? HColors.night : 'rgba(245,230,200,0.3)',
                fontFamily: 'var(--font-nunito)',
              }}>
              {saving ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <CheckCircle className="w-4 h-4" />}
              {saving ? 'Enregistrement...' : 'Accepter et continuer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
