import { useState, useRef } from 'react';
import { CheckCircle, ScrollText, Shield, AlertTriangle } from 'lucide-react';
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
      console.error('[HOMECI] Erreur CGV:', err);
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
                Conditions Générales d'Utilisation — Propriétaire
              </h2>
              <p className="text-xs" style={{ color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>
                Veuillez lire et accepter avant de publier votre premier bien
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
                Ce document constitue un engagement légal entre vous, propriétaire, et la plateforme HOMECI,
                conformément à la loi n°2013-546 du 30 juillet 2013 relative aux transactions électroniques
                en Côte d'Ivoire. Lisez-le attentivement avant d'accepter.
              </p>
            </div>

            <H3>Article 1 — Objet et cadre juridique</H3>
            <P>
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation
              de la plateforme HOMECI par les propriétaires souhaitant publier des annonces immobilières
              en Côte d'Ivoire. Elles sont établies conformément aux dispositions de la loi n°2019-575 du 26 juin 2019
              instituant le Code de la Construction et de l'Habitat, de la loi n°2020-480 portant Code foncier
              et domanial, et de la loi n°2013-546 du 30 juillet 2013 relative aux transactions électroniques.
              En publiant un bien sur HOMECI, le propriétaire accepte sans réserve les présentes conditions.
            </P>

            <H3>Article 2 — Définitions</H3>
            <P indent>
              a) <strong>Propriétaire</strong> : toute personne physique ou morale, de nationalité ivoirienne ou étrangère,
              titulaire d'un droit de propriété ou d'un mandat de gestion sur un bien immobilier situé
              en Côte d'Ivoire, au sens du décret du 26 juillet 1932 portant réorganisation du régime
              de la propriété foncière en AOF.
            </P>
            <P indent>
              b) <strong>Bien immobilier</strong> : tout immeuble bâti ou non bâti (appartement, maison, villa, terrain,
              hôtel, appart-hôtel) situé sur le territoire ivoirien, qu'il relève du domaine foncier urbain
              ou rural au sens de la loi n°98-750 du 23 décembre 1998 telle que modifiée.
            </P>
            <P indent>
              c) <strong>Certification notariale</strong> : processus de vérification de l'authenticité et de la conformité
              des documents légaux du bien par un notaire inscrit au tableau de l'Ordre des Notaires
              de Côte d'Ivoire, conformément à la loi n°2014-138 du 24 mars 2014.
            </P>

            <H3>Article 3 — Conditions d'éligibilité</H3>
            <P>Le propriétaire déclare et garantit :</P>
            <P indent>
              a) Être le propriétaire légitime du bien, titulaire d'un titre foncier, d'un Arrêté de Concession
              Définitive (ACD), d'un Certificat de Propriété Foncière (CPF), ou disposer d'une procuration
              notariée l'autorisant à agir au nom du propriétaire, conformément à l'article 30 de la loi
              de finances du 15 mars 2002 relative à la pleine propriété.
            </P>
            <P indent>
              b) Que le bien est libre de tout litige foncier, hypothèque non déclarée, servitude
              ou saisie judiciaire en cours.
            </P>
            <P indent>
              c) Que le bien respecte les normes de construction et d'habitabilité prévues par le Code
              de la Construction et de l'Habitat (loi n°2019-575), notamment les articles relatifs
              au permis de construire et au certificat de conformité.
            </P>
            <P indent>
              d) Être majeur et jouir de sa pleine capacité juridique, ou agir au nom d'une personne morale
              dûment immatriculée au Registre du Commerce et du Crédit Mobilier (RCCM).
            </P>

            <H3>Article 4 — Engagements du propriétaire</H3>
            <P>Le propriétaire s'engage à :</P>
            <P indent>
              a) Fournir des informations exactes, complètes et à jour concernant le bien immobilier
              (superficie, localisation, prix, état, équipements). Toute information mensongère engage
              sa responsabilité civile au sens des articles 1382 et suivants du Code civil ivoirien.
            </P>
            <P indent>
              b) Fournir les documents légaux requis selon le type de bien : titre foncier, permis de construire,
              plan cadastral, autorisation d'exploitation (pour les hôtels), registre de commerce, ainsi que
              les pièces d'identité du propriétaire (CNI, passeport, attestation de résidence ou carte de séjour
              selon sa situation).
            </P>
            <P indent>
              c) Respecter les tarifs annoncés et ne pratiquer aucune discrimination contraire à la Constitution
              de la République de Côte d'Ivoire et aux conventions internationales ratifiées.
            </P>
            <P indent>
              d) Maintenir ses annonces à jour et retirer tout bien qui n'est plus disponible dans un délai
              de 48 heures suivant la conclusion d'une transaction.
            </P>
            <P indent>
              e) Ne pas publier de contenu frauduleux, trompeur ou contraire à l'ordre public et aux bonnes
              mœurs tels que définis par la législation ivoirienne.
            </P>

            <H3>Article 5 — Vérification notariale et certification</H3>
            <P>
              Conformément à la loi n°2014-138 du 24 mars 2014 portant organisation de la profession de notaire
              en Côte d'Ivoire, chaque bien publié sur HOMECI est soumis à un processus de vérification
              par un notaire agréé inscrit au tableau de l'Ordre. Le propriétaire autorise expressément HOMECI
              et le notaire assigné à examiner l'authenticité et la conformité des documents soumis.
              La publication de l'annonce est conditionnée à la validation de l'ensemble des documents
              obligatoires par le notaire. Le délai indicatif de traitement est de 48 à 72 heures ouvrées.
            </P>

            <H3>Article 6 — Tarification et paiements</H3>
            <P>
              Les frais de publication sont fixés à 1 000 FCFA par annonce et les frais de certification
              notariale à 75 000 FCFA par dossier, payables via les moyens de paiement Mobile Money
              disponibles sur la plateforme (Orange Money, MTN MoMo, Wave, Moov Flooz). Les paiements
              sont régis par la réglementation de la Banque Centrale des États de l'Afrique de l'Ouest (BCEAO)
              relative à la monnaie électronique. HOMECI se réserve le droit de modifier ses tarifs
              avec notification préalable de 30 jours aux utilisateurs.
            </P>

            <H3>Article 7 — Confidentialité des documents</H3>
            <P>
              Les documents légaux et pièces d'identité soumis sont traités de manière strictement confidentielle.
              Ils sont accessibles uniquement par le propriétaire, le notaire assigné et l'équipe administrative
              de HOMECI. Ils ne sont jamais partagés avec les locataires, acheteurs potentiels ou tout tiers
              non autorisé. Le stockage est effectué sur des serveurs sécurisés avec chiffrement des données
              au repos et en transit.
            </P>

            <H3>Article 8 — Propriété intellectuelle</H3>
            <P>
              Le propriétaire garantit qu'il détient les droits sur l'ensemble des photos, vidéos et médias
              téléversés. En publiant ces contenus, il accorde à HOMECI une licence non exclusive, gratuite
              et révocable d'utilisation aux seules fins de promotion de l'annonce sur la plateforme
              et ses canaux de communication. Cette licence prend fin automatiquement à la suppression
              de l'annonce.
            </P>

            <H3>Article 9 — Responsabilité et limitation</H3>
            <P>
              HOMECI agit en tant qu'intermédiaire de mise en relation au sens de la loi n°2013-546
              relative aux transactions électroniques. La plateforme ne saurait être tenue responsable
              des litiges entre propriétaires et locataires/acheteurs, ni de l'état final des biens.
              Le propriétaire demeure seul responsable de l'exactitude des informations publiées
              et de la conformité du bien aux lois et règlements ivoiriens. HOMECI ne se substitue
              en aucun cas au notaire dans l'exercice de ses fonctions.
            </P>

            <H3>Article 10 — Modération et sanctions</H3>
            <P>
              HOMECI se réserve le droit de suspendre ou supprimer toute annonce ne respectant pas
              les présentes conditions, contenant des informations fausses, ou faisant l'objet de plaintes
              vérifiées. En cas de manquement grave ou répété, le compte du propriétaire pourra être
              suspendu temporairement ou définitivement, sans préjudice des poursuites civiles ou pénales
              prévues par la législation ivoirienne.
            </P>

            <H3>Article 11 — Protection des données personnelles</H3>
            <P>
              Conformément à la loi n°2013-450 du 19 juin 2013 relative à la protection des données
              à caractère personnel, HOMECI s'engage à ne collecter que les données strictement nécessaires
              à la fourniture de ses services. Le traitement est déclaré auprès de l'Autorité de Régulation
              des Télécommunications/TIC de Côte d'Ivoire (ARTCI). Le propriétaire dispose d'un droit
              d'accès, de rectification, d'opposition et de suppression de ses données en contactant
              contact@homeci.ci. Les données sont conservées pour la durée nécessaire à la fourniture
              du service et au respect des obligations légales.
            </P>

            <H3>Article 12 — Droit applicable et juridiction compétente</H3>
            <P>
              Les présentes CGU sont régies par le droit ivoirien. En cas de litige, les parties s'engagent
              à rechercher une solution amiable dans un délai de 30 jours. À défaut d'accord, tout litige
              relatif à l'interprétation ou l'exécution des présentes sera soumis aux juridictions
              compétentes d'Abidjan, Côte d'Ivoire, conformément au Code de procédure civile,
              commerciale et administrative.
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
              J'ai lu et j'accepte les Conditions Générales d'Utilisation de HOMECI.
              Je certifie que les informations et documents que je fournirai sont authentiques
              et conformes à la législation ivoirienne en vigueur.
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
                background: checked && hasScrolledToBottom ? HColors.orangeCI : 'rgba(255,107,0,0.2)',
                color: checked && hasScrolledToBottom ? '#FFFFFF' : 'rgba(245,230,200,0.3)',
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
