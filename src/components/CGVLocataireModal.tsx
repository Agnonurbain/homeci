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

  const H3 = ({ children }: { children: React.ReactNode }) => (
    <h3 style={{ color: HColors.gold, fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700 }}>
      {children}
    </h3>
  );
  const P = ({ children, indent }: { children: React.ReactNode; indent?: boolean }) => (
    <p style={indent ? { paddingLeft: '1rem' } : undefined}>{children}</p>
  );

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
                Conditions Générales d'Utilisation — Locataire / Acheteur
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
                Ce document régit vos droits et obligations en tant que locataire ou acheteur sur HOMECI,
                conformément à la loi n°2013-546 du 30 juillet 2013 relative aux transactions électroniques
                en Côte d'Ivoire.
              </p>
            </div>

            <H3>Article 1 — Objet et cadre juridique</H3>
            <P>
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès
              et l'utilisation de la plateforme HOMECI par les locataires et acheteurs souhaitant consulter
              des annonces immobilières et demander des visites de biens en Côte d'Ivoire. Elles sont établies
              conformément à la loi n°2018-575 du 13 juin 2018 relative au bail à usage d'habitation,
              au Code de la Construction et de l'Habitat (loi n°2019-575 du 26 juin 2019), et à la loi
              n°2013-546 relative aux transactions électroniques.
            </P>

            <H3>Article 2 — Définitions</H3>
            <P indent>
              a) <strong>Locataire/Acheteur</strong> : toute personne physique ou morale utilisant la plateforme HOMECI
              pour rechercher un bien immobilier à louer ou à acquérir en Côte d'Ivoire.
            </P>
            <P indent>
              b) <strong>Visite</strong> : rendez-vous organisé via la plateforme entre le locataire/acheteur
              et le propriétaire pour la consultation physique d'un bien immobilier.
            </P>
            <P indent>
              c) <strong>Bien certifié</strong> : bien dont les documents légaux ont été vérifiés et validés
              par un notaire agréé inscrit au tableau de l'Ordre des Notaires de Côte d'Ivoire
              (loi n°2014-138 du 24 mars 2014).
            </P>

            <H3>Article 3 — Demandes de visite et tarification</H3>
            <P>
              Chaque demande de visite est soumise à des frais de service de 500 FCFA, payables via
              les moyens de paiement Mobile Money disponibles (Orange Money, MTN MoMo, Wave, Moov Flooz).
              Ces paiements sont régis par la réglementation de la BCEAO relative à la monnaie électronique.
              Les frais couvrent la mise en relation avec le propriétaire et la coordination de la visite.
              Les frais ne sont pas remboursables en cas d'annulation par le demandeur. En cas d'annulation
              par le propriétaire, le locataire sera recrédité dans un délai de 72 heures ouvrées.
            </P>

            <H3>Article 4 — Engagements du locataire/acheteur</H3>
            <P>Le locataire/acheteur s'engage à :</P>
            <P indent>
              a) Fournir des informations d'identité exactes et vérifiables lors de son inscription
              sur la plateforme. Toute usurpation d'identité est passible de sanctions pénales
              au titre de la loi n°2013-451 du 19 juin 2013 relative à la lutte contre la cybercriminalité.
            </P>
            <P indent>
              b) Se présenter aux visites programmées ou prévenir le propriétaire en cas d'empêchement
              au moins 24 heures à l'avance via la plateforme.
            </P>
            <P indent>
              c) Respecter les biens visités et ne causer aucun dommage. Tout dommage causé lors d'une visite
              engage la responsabilité civile du visiteur au sens des articles 1382 et suivants
              du Code civil ivoirien.
            </P>
            <P indent>
              d) Ne pas utiliser les coordonnées des propriétaires obtenues via HOMECI à des fins
              commerciales, frauduleuses ou de harcèlement.
            </P>
            <P indent>
              e) Respecter les dispositions de la loi n°2018-575 du 13 juin 2018 relative au bail
              à usage d'habitation dans le cadre de toute relation locative conclue suite à l'utilisation
              de la plateforme, notamment les obligations du preneur prévues aux articles 22 et suivants.
            </P>

            <H3>Article 5 — Garanties et limites de la certification</H3>
            <P>
              HOMECI s'engage à ce que chaque bien publié soit vérifié par un notaire agréé conformément
              à la loi n°2014-138. La certification porte exclusivement sur la validité des documents
              légaux fournis par le propriétaire (titre foncier, permis de construire, etc.) et non sur
              l'état physique, l'habitabilité ou la conformité technique du bien. Le locataire/acheteur
              est encouragé à effectuer ses propres vérifications lors de la visite et, en cas d'achat,
              à se faire accompagner par un professionnel du droit pour la rédaction de l'acte de vente.
            </P>

            <H3>Article 6 — Droits du locataire/acheteur</H3>
            <P>Conformément à la législation ivoirienne, le locataire/acheteur bénéficie :</P>
            <P indent>
              a) Du droit d'accès aux informations complètes sur le bien (superficie, localisation,
              prix, statut de certification) avant toute visite.
            </P>
            <P indent>
              b) Du droit de signaler toute annonce suspecte ou frauduleuse via la plateforme.
              HOMECI s'engage à traiter tout signalement dans un délai de 48 heures.
            </P>
            <P indent>
              c) Du droit de rétractation sur les frais de visite dans un délai de 24 heures suivant
              le paiement, si la visite n'a pas encore été programmée.
            </P>

            <H3>Article 7 — Responsabilité de HOMECI</H3>
            <P>
              HOMECI agit en tant qu'intermédiaire de mise en relation au sens de la loi n°2013-546
              relative aux transactions électroniques. La plateforme ne saurait être tenue responsable
              des litiges entre locataires et propriétaires, ni de l'état réel des biens proposés.
              Toute transaction financière directe entre les parties (loyer, caution, prix de vente)
              se fait sous leur seule responsabilité et doit respecter les dispositions légales applicables,
              notamment la loi n°2018-575 relative au bail à usage d'habitation.
            </P>

            <H3>Article 8 — Règlement des litiges</H3>
            <P>
              En cas de litige lié à une visite ou à une annonce, le locataire/acheteur peut saisir
              le service de médiation de HOMECI à l'adresse contact@homeci.ci. Si aucune solution
              amiable n'est trouvée dans un délai de 30 jours, le litige pourra être soumis
              aux juridictions compétentes d'Abidjan.
            </P>

            <H3>Article 9 — Protection des données personnelles</H3>
            <P>
              Conformément à la loi n°2013-450 du 19 juin 2013 relative à la protection des données
              à caractère personnel, vos données sont collectées et traitées aux seules fins de la fourniture
              des services HOMECI. Le traitement est déclaré auprès de l'ARTCI. Vous disposez d'un droit
              d'accès, de rectification, d'opposition et de suppression de vos données en contactant
              contact@homeci.ci. Vos données ne sont jamais cédées à des tiers sans votre consentement
              préalable, sauf obligation légale.
            </P>

            <H3>Article 10 — Droit applicable et juridiction compétente</H3>
            <P>
              Les présentes CGU sont régies par le droit ivoirien. Tout litige relatif à leur interprétation
              ou exécution sera soumis aux juridictions compétentes d'Abidjan, Côte d'Ivoire,
              conformément au Code de procédure civile, commerciale et administrative.
            </P>

            <p className="pt-3" style={{ color: 'rgba(245,230,200,0.4)', fontStyle: 'italic', fontSize: '0.75rem' }}>
              Dernière mise à jour : Mars 2026
            </p>
          </div>
        </div>

        {!hasScrolledToBottom && (
          <div className="px-6 py-2 flex items-center gap-2 text-xs shrink-0"
            style={{ color: 'rgba(212,160,23,0.6)', fontFamily: 'var(--font-nunito)', borderTop: `1px solid ${HAlpha.gold10}` }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Faites défiler pour lire l'intégralité des conditions
          </div>
        )}

        <div className="px-6 py-4 shrink-0"
          style={{ borderTop: `1px solid ${HAlpha.gold15}`, background: 'rgba(10,22,14,0.5)' }}>
          <label className="flex items-start gap-3 cursor-pointer mb-4 select-none">
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
              disabled={!hasScrolledToBottom} className="mt-0.5 w-4 h-4 rounded accent-amber-500" />
            <span className="text-sm leading-snug"
              style={{ color: hasScrolledToBottom ? HColors.cream : 'rgba(245,230,200,0.35)', fontFamily: 'var(--font-nunito)' }}>
              J'ai lu et j'accepte les Conditions Générales d'Utilisation de HOMECI en tant que locataire/acheteur.
              Je m'engage à respecter les biens visités et la législation ivoirienne en vigueur.
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
