import { useState, useRef } from 'react';
import { CheckCircle, Shield, AlertTriangle, Scale } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { KenteLine } from './ui/KenteLine';

interface CGVNotaireModalProps {
  onAccept: () => void;
  onClose: () => void;
}

export default function CGVNotaireModal({ onAccept, onClose }: CGVNotaireModalProps) {
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
        cgv_notaire_accepted: true,
        cgv_notaire_accepted_at: new Date().toISOString(),
        updated_at: serverTimestamp(),
      });
      await refreshProfile();
      onAccept();
    } catch (err) {
      console.error('[HOMECI] Erreur CGV Notaire:', err);
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
              <Scale className="w-5 h-5" style={{ color: HColors.gold }} />
            </div>
            <div>
              <h2 className="text-lg font-bold"
                style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
                Charte du Notaire Agréé HOMECI
              </h2>
              <p className="text-xs" style={{ color: 'rgba(245,230,200,0.5)', fontFamily: 'var(--font-nunito)' }}>
                Veuillez lire et accepter avant de prendre en charge votre premier dossier
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
                Ce document constitue un engagement professionnel et déontologique entre vous,
                notaire agréé, et la plateforme HOMECI. Il est établi conformément à la loi n°2014-138
                du 24 mars 2014 portant organisation de la profession de notaire en Côte d'Ivoire
                et au Règlement n°2002-304/UEMOA relatif aux professions libérales.
              </p>
            </div>

            <H3>Article 1 — Objet et cadre juridique</H3>
            <P>
              La présente charte définit les obligations et responsabilités du notaire agréé dans le cadre
              de sa mission de vérification et de certification des biens immobiliers publiés sur la plateforme
              HOMECI. Elle s'inscrit dans le cadre de la loi n°2014-138 du 24 mars 2014 portant organisation
              de la profession de notaire en Côte d'Ivoire, du décret n°2014-558 fixant les conditions
              d'exercice de la profession, et du Code de la Construction et de l'Habitat
              (loi n°2019-575 du 26 juin 2019). En acceptant cette charte, le notaire s'engage à exercer
              sa mission avec diligence, impartialité et conformément aux lois ivoiriennes en vigueur.
            </P>

            <H3>Article 2 — Qualifications et conditions d'agrément</H3>
            <P>Le notaire agréé HOMECI déclare et garantit :</P>
            <P indent>
              a) Être titulaire du diplôme de notaire délivré par une institution reconnue par l'État
              de Côte d'Ivoire et inscrit au tableau de la Chambre des Notaires de Côte d'Ivoire,
              conformément à la loi n°2014-138, article 4.
            </P>
            <P indent>
              b) Être titulaire d'une charge notariale ou exercer en qualité de notaire associé,
              conformément aux articles 15 à 25 de la loi n°2014-138.
            </P>
            <P indent>
              c) Disposer d'une assurance responsabilité civile professionnelle en cours de validité,
              couvrant l'ensemble de ses activités de certification, conformément à l'article 38
              de la loi n°2014-138.
            </P>
            <P indent>
              d) Ne faire l'objet d'aucune sanction disciplinaire prononcée par la Chambre de Discipline
              des Notaires, ni d'aucune interdiction temporaire ou définitive d'exercer.
            </P>
            <P indent>
              e) Avoir obtenu un code d'invitation valide délivré par l'administration HOMECI
              après vérification de ses qualifications.
            </P>

            <H3>Article 3 — Périmètre de la mission de vérification</H3>
            <P>Pour chaque dossier pris en charge, le notaire est tenu de vérifier :</P>
            <P indent>
              a) <strong>Titre de propriété</strong> : authenticité et validité du titre foncier,
              de l'Arrêté de Concession Définitive (ACD) ou du Certificat de Propriété Foncière (CPF),
              conformément au décret du 26 juillet 1932 et à la loi n°2020-480 portant Code foncier
              et domanial.
            </P>
            <P indent>
              b) <strong>Autorisations administratives</strong> : permis de construire, certificat de conformité
              (pour les biens bâtis), autorisation d'exploitation et registre de commerce
              (pour les hôtels et appart-hôtels).
            </P>
            <P indent>
              c) <strong>Identité du propriétaire</strong> : concordance entre les pièces d'identité fournies
              (CNI, passeport, carte de séjour) et le titulaire du titre de propriété.
              Pour les personnes morales, vérification de l'immatriculation au RCCM.
            </P>
            <P indent>
              d) <strong>Absence de charges</strong> : vérification de l'absence d'hypothèque, de saisie,
              de servitude non déclarée ou de litige foncier en cours sur le bien.
            </P>
            <P indent>
              e) <strong>Concordance des informations</strong> : conformité entre les documents fournis
              et les informations déclarées sur l'annonce (superficie, localisation, type de bien).
            </P>

            <H3>Article 4 — Délais et diligence</H3>
            <P>
              Le notaire s'engage à traiter chaque dossier dans un délai raisonnable de 48 à 72 heures
              ouvrées suivant la prise en charge. Passé ce délai, HOMECI se réserve le droit de réassigner
              le dossier à un autre notaire agréé après notification. Tout refus de validation d'un document
              doit être motivé par une explication claire, précise et fondée en droit, permettant
              au propriétaire de régulariser sa situation.
            </P>

            <H3>Article 5 — Confidentialité et protection des données</H3>
            <P>
              Conformément à la loi n°2013-450 du 19 juin 2013 relative à la protection des données
              à caractère personnel et au secret professionnel inhérent à la fonction notariale
              (article 40 de la loi n°2014-138), le notaire s'engage à :
            </P>
            <P indent>
              a) Traiter de manière strictement confidentielle l'ensemble des documents et informations
              personnelles des propriétaires auxquels il a accès.
            </P>
            <P indent>
              b) Ne jamais divulguer, copier, reproduire ou utiliser ces informations à des fins
              autres que la vérification dans le cadre de HOMECI.
            </P>
            <P indent>
              c) Assurer la sécurité des données consultées et ne pas les stocker en dehors
              des systèmes de la plateforme.
            </P>
            <P indent>
              d) Signaler immédiatement à HOMECI toute faille de sécurité ou tout accès non autorisé
              aux données dont il aurait connaissance.
            </P>

            <H3>Article 6 — Impartialité et conflits d'intérêts</H3>
            <P>
              Le notaire s'engage à exercer sa mission en toute impartialité, conformément aux règles
              déontologiques de la profession. Il est tenu de se récuser et de signaler immédiatement
              à l'administration HOMECI toute situation de conflit d'intérêts, notamment :
            </P>
            <P indent>
              a) Lien personnel, familial ou commercial avec le propriétaire du bien.
            </P>
            <P indent>
              b) Intérêt direct ou indirect dans la transaction immobilière en cours.
            </P>
            <P indent>
              c) Toute situation pouvant compromettre son indépendance de jugement.
            </P>

            <H3>Article 7 — Responsabilité professionnelle</H3>
            <P>
              Le notaire agréé engage sa responsabilité professionnelle sur chaque certification émise,
              au sens de l'article 38 de la loi n°2014-138 relatif à la responsabilité civile du notaire.
              En cas de certification frauduleuse, négligente ou émise sur la base de vérifications
              insuffisantes, le notaire s'expose à :
            </P>
            <P indent>
              a) La suspension ou la révocation de son agrément HOMECI.
            </P>
            <P indent>
              b) Des poursuites disciplinaires devant la Chambre de Discipline des Notaires
              conformément aux articles 55 à 65 de la loi n°2014-138.
            </P>
            <P indent>
              c) La mise en jeu de sa responsabilité civile professionnelle pour indemnisation
              des préjudices subis par les utilisateurs de la plateforme.
            </P>
            <P indent>
              d) Le cas échéant, des poursuites pénales pour faux et usage de faux au sens
              du Code pénal ivoirien.
            </P>

            <H3>Article 8 — Rémunération</H3>
            <P>
              Les frais de certification notariale sont fixés à 75 000 FCFA par dossier, payés
              par le propriétaire via les moyens de paiement Mobile Money de la plateforme
              (Orange Money, MTN MoMo, Wave, Moov Flooz). La rémunération du notaire est versée
              selon les modalités et le pourcentage convenus par contrat distinct entre le notaire
              et l'administration HOMECI. Ces montants sont conformes au barème des honoraires
              de la profession et à la réglementation de la BCEAO relative à la monnaie électronique.
            </P>

            <H3>Article 9 — Suspension et révocation de l'agrément</H3>
            <P>
              HOMECI se réserve le droit de suspendre temporairement ou de révoquer définitivement
              l'agrément d'un notaire dans les cas suivants :
            </P>
            <P indent>
              a) Manquement aux obligations de la présente charte, notamment les obligations
              de diligence, de confidentialité ou d'impartialité.
            </P>
            <P indent>
              b) Plaintes vérifiées de propriétaires ou d'autres utilisateurs de la plateforme.
            </P>
            <P indent>
              c) Non-respect répété des délais de traitement (48-72h).
            </P>
            <P indent>
              d) Sanction disciplinaire prononcée par la Chambre de Discipline des Notaires.
            </P>
            <P indent>
              e) Perte de la qualité de notaire ou expiration de l'assurance responsabilité civile.
            </P>
            <P>
              Le notaire sera notifié par écrit (via la plateforme et par email) et disposera
              d'un délai de 15 jours pour présenter ses observations avant toute décision définitive.
            </P>

            <H3>Article 10 — Propriété intellectuelle</H3>
            <P>
              Les certifications, rapports de vérification et avis émis par le notaire dans le cadre
              de HOMECI restent la propriété intellectuelle conjointe du notaire et de HOMECI.
              Le notaire autorise HOMECI à utiliser le badge « Vérifié Notaire » sur les annonces
              qu'il a certifiées, pour la durée de validité de la certification.
            </P>

            <H3>Article 11 — Droit applicable et juridiction compétente</H3>
            <P>
              La présente charte est régie par le droit ivoirien, notamment la loi n°2014-138
              du 24 mars 2014 portant organisation de la profession de notaire, le Code de la Construction
              et de l'Habitat (loi n°2019-575), et les Actes Uniformes de l'OHADA applicables.
              En cas de litige, les parties s'engagent à rechercher une solution amiable dans un délai
              de 30 jours. À défaut, tout litige sera soumis aux juridictions compétentes d'Abidjan,
              Côte d'Ivoire.
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
            Faites défiler pour lire l'intégralité de la charte
          </div>
        )}

        <div className="px-6 py-4 shrink-0"
          style={{ borderTop: `1px solid ${HAlpha.gold15}`, background: 'rgba(10,22,14,0.5)' }}>
          <label className="flex items-start gap-3 cursor-pointer mb-4 select-none">
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
              disabled={!hasScrolledToBottom} className="mt-0.5 w-4 h-4 rounded accent-amber-500" />
            <span className="text-sm leading-snug"
              style={{ color: hasScrolledToBottom ? HColors.cream : 'rgba(245,230,200,0.35)', fontFamily: 'var(--font-nunito)' }}>
              J'ai lu et j'accepte la Charte du Notaire Agréé HOMECI. Je m'engage à exercer ma mission
              de vérification avec diligence, impartialité et confidentialité, conformément à la loi
              n°2014-138 du 24 mars 2014 et aux règles déontologiques de la profession de notaire.
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
