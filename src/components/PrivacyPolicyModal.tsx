import { Shield, X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import { KenteLine } from './ui/KenteLine';

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export default function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  useBodyScrollLock(true);

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
      style={{ background: 'rgba(10,22,14,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: HColors.night, border: `1px solid ${HAlpha.gold20}`, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <KenteLine />
          <div className="flex items-center gap-3 mt-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: HAlpha.gold12, border: `1px solid ${HAlpha.gold20}` }}>
              <Shield className="w-5 h-5" style={{ color: HColors.gold }} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold"
                style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)', letterSpacing: '0.02em' }}>
                Politique de Confidentialite
              </h2>
              <p className="text-xs font-medium" style={{ color: HColors.gold, opacity: 0.8, fontFamily: 'var(--font-nunito)', marginTop: '2px' }}>
                Protection de vos donnees personnelles
              </p>
            </div>
            <button onClick={onClose}
              className="p-2 rounded-xl transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <X className="w-4 h-4" style={{ color: HAlpha.cream50 }} />
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-2" style={{ maxHeight: '65vh' }}>
          <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-4"
            style={{ color: 'rgba(245,230,200,0.75)', fontFamily: 'var(--font-nunito)' }}>

            <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
              style={{ background: HAlpha.gold05, border: `1px solid ${HAlpha.gold15}` }}>
              <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: HColors.gold }} />
              <p className="text-xs" style={{ color: HColors.gold }}>
                Cette politique est etablie conformement a la loi n°2013-450 du 19 juin 2013
                relative a la protection des donnees a caractere personnel en Cote d'Ivoire
                et au Reglement General sur la Protection des Donnees (RGPD).
              </p>
            </div>

            <H3>1. Responsable du traitement</H3>
            <P>
              La plateforme HOMECI, editee et exploitee depuis Abidjan, Cote d'Ivoire,
              est responsable du traitement des donnees personnelles collectees via le site
              et les applications associees. Pour toute question relative a vos donnees,
              contactez-nous a l'adresse : <strong>contact@homeci.ci</strong>.
            </P>

            <H3>2. Donnees collectees</H3>
            <P>Dans le cadre de nos services, nous collectons les categories de donnees suivantes :</P>
            <P indent>
              <strong>Donnees d'identification</strong> : nom, prenom, adresse e-mail, numero de telephone,
              photo de profil.
            </P>
            <P indent>
              <strong>Donnees de localisation</strong> : commune, quartier, ville, preferences geographiques
              de recherche.
            </P>
            <P indent>
              <strong>Donnees immobilieres</strong> : informations sur les biens publies (adresse, superficie,
              prix, photos, documents de certification notariale).
            </P>
            <P indent>
              <strong>Donnees de paiement</strong> : informations liees aux transactions Mobile Money
              (Orange Money, MTN MoMo, Wave, Moov Flooz, Djamo) via notre prestataire Movapay.
              HOMECI ne stocke pas vos identifiants de paiement.
            </P>
            <P indent>
              <strong>Donnees techniques</strong> : adresse IP, type de navigateur, donnees de session
              et journaux d'erreurs.
            </P>

            <H3>3. Finalites du traitement</H3>
            <P>Vos donnees sont collectees et traitees pour les finalites suivantes :</P>
            <P indent>a) Gestion de votre compte et authentification sur la plateforme.</P>
            <P indent>b) Publication et gestion des annonces immobilieres.</P>
            <P indent>c) Organisation et suivi des demandes de visite.</P>
            <P indent>d) Verification notariale des biens et certification des documents.</P>
            <P indent>e) Traitement des paiements de frais de visite.</P>
            <P indent>f) Amelioration de nos services via l'analyse d'usage (analytics).</P>
            <P indent>g) Detection et resolution d'erreurs techniques (suivi applicatif).</P>
            <P indent>h) Communication relative a votre compte et aux services HOMECI.</P>

            <H3>4. Base legale du traitement</H3>
            <P>
              Le traitement de vos donnees repose sur : votre consentement lors de l'inscription,
              l'execution du contrat de service (CGU), nos obligations legales en matiere immobiliere
              et fiscale, et notre interet legitime a assurer la securite et l'amelioration de la plateforme.
            </P>

            <H3>5. Stockage et securite des donnees</H3>
            <P>
              Vos donnees sont hebergees sur l'infrastructure <strong>Firebase</strong> (Google Cloud Platform),
              avec chiffrement en transit (TLS) et au repos. L'acces aux bases de donnees est protege
              par des regles de securite Firestore strictes et des fonctions Cloud authentifiees.
              Nous appliquons le principe de minimisation des donnees et limitons l'acces
              aux seuls personnels habilites.
            </P>

            <H3>6. Services tiers et sous-traitants</H3>
            <P>HOMECI fait appel aux sous-traitants suivants dans le cadre de ses services :</P>
            <P indent>
              <strong>Firebase / Google Cloud</strong> : hebergement, authentification, base de donnees,
              stockage de fichiers.
            </P>
            <P indent>
              <strong>Movapay</strong> : traitement des paiements Mobile Money. Movapay agit en tant que
              prestataire de services de paiement et dispose de sa propre politique de confidentialite.
            </P>
            <P indent>
              <strong>Sentry</strong> : suivi et resolution des erreurs techniques. Sentry collecte
              des donnees techniques limitees (traces d'erreurs, informations de session)
              a des fins de diagnostic uniquement.
            </P>
            <P>
              Ces prestataires sont contractuellement tenus de proteger vos donnees et de ne les utiliser
              que dans le cadre des services fournis a HOMECI.
            </P>

            <H3>7. Vos droits</H3>
            <P>
              Conformement a la loi n°2013-450 et au RGPD, vous disposez des droits suivants
              sur vos donnees personnelles :
            </P>
            <P indent><strong>Droit d'acces</strong> : obtenir une copie de vos donnees traitees par HOMECI.</P>
            <P indent><strong>Droit de rectification</strong> : corriger des donnees inexactes ou incompletes.</P>
            <P indent><strong>Droit de suppression</strong> : demander l'effacement de vos donnees, sous reserve de nos obligations legales.</P>
            <P indent><strong>Droit a la portabilite</strong> : recevoir vos donnees dans un format structure et lisible.</P>
            <P indent><strong>Droit d'opposition</strong> : vous opposer au traitement de vos donnees a des fins de prospection.</P>
            <P indent><strong>Droit a la limitation</strong> : demander la restriction du traitement dans certains cas.</P>
            <P>
              Pour exercer vos droits, adressez votre demande a <strong>contact@homeci.ci</strong>.
              Nous nous engageons a y repondre dans un delai de 30 jours. En cas de litige,
              vous pouvez saisir l'ARTCI (Autorite de Regulation des Telecommunications de Cote d'Ivoire).
            </P>

            <H3>8. Duree de conservation</H3>
            <P>
              Vos donnees personnelles sont conservees pendant la duree de votre utilisation active
              de la plateforme, puis pendant une duree de 3 ans apres la derniere activite sur votre compte.
              Les donnees de paiement sont conservees conformement aux obligations legales comptables
              (10 ans). Vous pouvez demander la suppression anticipee de votre compte et de vos donnees
              a tout moment.
            </P>

            <H3>9. Cookies et traceurs</H3>
            <P>
              HOMECI utilise des cookies techniques strictement necessaires au fonctionnement
              de la plateforme (authentification, preferences de session). Nous utilisons egalement
              des cookies d'analyse pour ameliorer nos services. Vous pouvez configurer votre navigateur
              pour refuser les cookies non essentiels. Le refus des cookies techniques peut limiter
              l'acces a certaines fonctionnalites.
            </P>

            <H3>10. Transferts de donnees</H3>
            <P>
              Certaines donnees peuvent etre transferees vers des serveurs situes hors de Cote d'Ivoire
              (infrastructure Google Cloud, Sentry). Ces transferts sont encadres par des garanties
              appropriees (clauses contractuelles types, certifications) assurant un niveau de protection
              adequat de vos donnees.
            </P>

            <H3>11. Modification de la politique</H3>
            <P>
              HOMECI se reserve le droit de modifier la presente politique a tout moment.
              En cas de modification substantielle, les utilisateurs seront informes par notification
              sur la plateforme ou par e-mail. La date de derniere mise a jour est indiquee ci-dessous.
            </P>

            <H3>12. Contact</H3>
            <P>
              Pour toute question ou reclamation relative a la protection de vos donnees personnelles,
              contactez-nous :
            </P>
            <P indent>E-mail : <strong>contact@homeci.ci</strong></P>
            <P indent>Adresse : Abidjan, Cocody Riviera, Cote d'Ivoire</P>

            <p className="pt-3" style={{ color: 'rgba(245,230,200,0.4)', fontStyle: 'italic', fontSize: '0.75rem' }}>
              Derniere mise a jour : Mars 2026
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 shrink-0"
          style={{ borderTop: `1px solid ${HAlpha.gold15}`, background: 'rgba(10,22,14,0.5)' }}>
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: HColors.orangeCI,
              color: '#FFFFFF',
              fontFamily: 'var(--font-nunito)',
            }}>
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
