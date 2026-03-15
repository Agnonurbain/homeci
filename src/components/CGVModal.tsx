import { useState, useRef, useEffect } from 'react';
import { FileText, CheckCircle, ScrollText, Shield, AlertTriangle } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { KenteLine } from './ui/KenteLine';

interface CGVModalProps {
  onAccept: () => void;
  onClose: () => void;
}

export default function CGVModal({ onAccept, onClose }: CGVModalProps) {
  const { user, refreshProfile } = useAuth();
  useBodyScrollLock(true);
  const [checked, setChecked] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Détecter le scroll vers le bas
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) setHasScrolledToBottom(true);
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
      console.error('[HOMECI] Erreur CGV:', err);
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
                Conditions Générales d'Utilisation
              </h2>
              <p className="text-xs" style={{ color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>
                Veuillez lire et accepter avant de publier votre premier bien
              </p>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div ref={scrollRef} onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 pb-2"
          style={{ maxHeight: '50vh' }}>
          <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-4"
            style={{ color: 'rgba(245,230,200,0.75)', fontFamily: 'var(--font-nunito)' }}>

            <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
              style={{ background: HAlpha.gold05, border: `1px solid ${HAlpha.gold15}` }}>
              <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: HColors.gold }} />
              <p className="text-xs" style={{ color: HColors.gold }}>
                Ce document constitue un engagement légal entre vous et HOMECI.
                Lisez-le attentivement avant d'accepter.
              </p>
            </div>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 1 — Objet
            </h3>
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme
              HOMECI par les propriétaires souhaitant publier des annonces immobilières en Côte d'Ivoire.
              En publiant un bien sur HOMECI, le propriétaire accepte sans réserve les présentes conditions.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 2 — Engagements du propriétaire
            </h3>
            <p>Le propriétaire s'engage à :</p>
            <p style={{ paddingLeft: '1rem' }}>
              a) Fournir des informations exactes, complètes et à jour concernant le bien immobilier proposé
              (superficie, localisation, prix, état, etc.).
            </p>
            <p style={{ paddingLeft: '1rem' }}>
              b) Être le propriétaire légitime du bien ou disposer d'une procuration légale l'autorisant à le proposer
              sur la plateforme.
            </p>
            <p style={{ paddingLeft: '1rem' }}>
              c) Fournir les documents légaux requis (titre foncier, permis de construire, etc.) pour vérification
              par un notaire agréé de la plateforme.
            </p>
            <p style={{ paddingLeft: '1rem' }}>
              d) Ne pas publier de contenu frauduleux, trompeur, discriminatoire ou contraire à la législation
              ivoirienne en vigueur.
            </p>
            <p style={{ paddingLeft: '1rem' }}>
              e) Maintenir ses annonces à jour et retirer tout bien qui n'est plus disponible à la vente ou à la location.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 3 — Vérification notariale
            </h3>
            <p>
              Chaque bien publié sur HOMECI est soumis à un processus de vérification par un notaire agréé.
              Le propriétaire autorise expressément HOMECI et ses notaires partenaires à examiner les documents
              fournis afin de certifier l'authenticité et la conformité du bien. Le propriétaire comprend que
              la publication de son annonce est conditionnée à la validation de ses documents par le notaire.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 4 — Confidentialité des documents
            </h3>
            <p>
              Les documents légaux soumis par le propriétaire sont traités de manière strictement confidentielle.
              Ils sont accessibles uniquement par le propriétaire, le notaire assigné et l'équipe administrative
              de HOMECI. Ils ne sont jamais partagés avec les locataires, acheteurs potentiels ou tout tiers
              non autorisé.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 5 — Médias (photos et vidéos)
            </h3>
            <p>
              Le propriétaire garantit qu'il détient les droits sur l'ensemble des photos et vidéos téléversées
              sur la plateforme. En publiant ces médias, le propriétaire accorde à HOMECI une licence non exclusive
              d'utilisation à des fins de promotion de l'annonce sur la plateforme et ses canaux de communication.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 6 — Responsabilité
            </h3>
            <p>
              HOMECI agit en tant qu'intermédiaire et ne saurait être tenu responsable des litiges entre
              propriétaires et locataires/acheteurs. Le propriétaire demeure seul responsable de l'exactitude
              des informations publiées et de la conformité du bien aux lois et règlements ivoiriens,
              notamment le décret n°2015-21 relatif aux transactions immobilières.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 7 — Modération et retrait
            </h3>
            <p>
              HOMECI se réserve le droit de suspendre ou supprimer toute annonce ne respectant pas les présentes
              conditions, contenant des informations fausses, ou faisant l'objet de plaintes vérifiées.
              Le propriétaire sera notifié par la plateforme en cas de retrait.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 8 — Tarification
            </h3>
            <p>
              La publication d'annonces sur HOMECI est actuellement gratuite. HOMECI se réserve le droit
              d'introduire des fonctionnalités premium payantes à l'avenir, avec notification préalable
              aux utilisateurs.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 9 — Protection des données personnelles
            </h3>
            <p>
              Les données personnelles du propriétaire sont collectées et traitées conformément à la loi
              n°2013-450 relative à la protection des données à caractère personnel en Côte d'Ivoire.
              Le propriétaire dispose d'un droit d'accès, de rectification et de suppression de ses données
              en contactant HOMECI à l'adresse contact@homeci.ci.
            </p>

            <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
              Article 10 — Droit applicable
            </h3>
            <p>
              Les présentes CGU sont régies par le droit ivoirien. Tout litige relatif à leur interprétation
              ou exécution sera soumis aux juridictions compétentes d'Abidjan, Côte d'Ivoire.
            </p>

            <p className="pt-3" style={{ color: 'rgba(245,230,200,0.4)', fontStyle: 'italic', fontSize: '0.75rem' }}>
              Dernière mise à jour : Mars 2026
            </p>
          </div>
        </div>

        {/* Indication de scroll si pas encore en bas */}
        {!hasScrolledToBottom && (
          <div className="px-6 py-2 flex items-center gap-2 text-xs shrink-0"
            style={{ color: 'rgba(212,160,23,0.6)', fontFamily: 'var(--font-nunito)', borderTop: `1px solid ${HAlpha.gold10}` }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Faites défiler pour lire l'intégralité des conditions
          </div>
        )}

        {/* Footer : checkbox + boutons */}
        <div className="px-6 py-4 shrink-0"
          style={{ borderTop: `1px solid ${HAlpha.gold15}`, background: 'rgba(10,22,14,0.5)' }}>

          <label className="flex items-start gap-3 cursor-pointer mb-4 select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className="mt-0.5 w-4 h-4 rounded accent-amber-500"
            />
            <span className="text-sm leading-snug"
              style={{
                color: hasScrolledToBottom ? HColors.cream : 'rgba(245,230,200,0.35)',
                fontFamily: 'var(--font-nunito)',
              }}>
              J'ai lu et j'accepte les Conditions Générales d'Utilisation de HOMECI.
              Je certifie que les informations et documents que je fournirai sont authentiques.
            </span>
          </label>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.1)`,
                       color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>
              Annuler
            </button>
            <button onClick={handleAccept}
              disabled={!checked || !hasScrolledToBottom || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: checked && hasScrolledToBottom ? HColors.gold : 'rgba(212,160,23,0.2)',
                color: checked && hasScrolledToBottom ? HColors.night : 'rgba(245,230,200,0.3)',
                fontFamily: 'var(--font-nunito)',
              }}>
              {saving ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {saving ? 'Enregistrement...' : 'Accepter et continuer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
