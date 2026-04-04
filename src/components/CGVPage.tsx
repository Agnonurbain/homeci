import { useState } from 'react';
import { Scale, Home, Users, Shield, ChevronDown } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface CGVSection { title: string; content: string; }

const CGV_PROPRIETAIRE: CGVSection[] = [
  { title: 'Article 1 — Objet et cadre juridique',
    content: 'Les présentes Conditions Générales d\'Utilisation (CGU) régissent l\'accès et l\'utilisation de la plateforme HOMECI par les propriétaires souhaitant publier des annonces immobilières en Côte d\'Ivoire. Elles sont établies conformément au droit ivoirien, notamment la loi n°2013-546 du 30 juillet 2013 relative aux transactions électroniques, et la loi n°2014-138 portant organisation de la profession de notaire.' },
  { title: 'Article 2 — Conditions d\'éligibilité',
    content: 'Le propriétaire déclare et garantit : (a) Être le propriétaire légitime du bien, titulaire d\'un titre foncier, d\'un Arrêté de Concession Définitive (ACD) ou d\'un mandat de gestion dûment authentifié ; (b) Être majeur selon la loi ivoirienne (21 ans révolus ou mineur émancipé) ; (c) Ne faire l\'objet d\'aucune interdiction de gestion, saisie immobilière ou liquidation judiciaire affectant le bien.' },
  { title: 'Article 3 — Engagements du propriétaire',
    content: 'Le propriétaire s\'engage à : (a) Fournir des informations exactes, complètes et à jour concernant le bien ; (b) Soumettre des documents légaux authentiques et valides ; (c) Ne pas publier de contenu frauduleux, trompeur ou portant atteinte aux droits de tiers ; (d) Répondre aux demandes de visite dans un délai raisonnable ; (e) Mettre à jour le statut du bien (loué, vendu) dans un délai de 3 jours après la conclusion d\'une transaction.' },
  { title: 'Article 4 — Vérification notariale et certification',
    content: 'Chaque bien publié sur HOMECI est soumis à un processus de vérification par un notaire agréé inscrit au Tableau de l\'Ordre des Notaires de Côte d\'Ivoire. Le notaire vérifie la conformité des documents légaux et l\'identité du propriétaire. Le badge « Vérifié Notaire » atteste que les documents ont été contrôlés mais ne constitue pas une garantie de la valeur marchande du bien.' },
  { title: 'Article 5 — Tarification et paiements',
    content: 'Les frais de publication sont fixés à 1 000 FCFA par annonce et les frais de certification notariale à 75 000 FCFA par dossier, payables via Orange Money, MTN MoMo, Wave, Moov Flooz ou Djamo. Les paiements sont gérés par le prestataire Movapay. Aucun remboursement n\'est prévu sauf en cas d\'annulation par HOMECI.' },
  { title: 'Article 6 — Confidentialité des documents',
    content: 'Les documents légaux et pièces d\'identité soumis sont traités de manière strictement confidentielle, conformément à la loi n°2013-450 relative à la protection des données personnelles (ARTCI). Ils sont accessibles uniquement par le propriétaire, le notaire assigné et l\'équipe administrative de HOMECI.' },
  { title: 'Article 7 — Responsabilité et litiges',
    content: 'HOMECI agit en tant qu\'intermédiaire technologique et ne peut être tenu responsable des litiges entre propriétaires et locataires/acheteurs. Tout litige sera soumis aux juridictions compétentes d\'Abidjan, Côte d\'Ivoire. En cas de non-respect des CGU, HOMECI se réserve le droit de suspendre ou supprimer le compte du propriétaire sans préavis.' },
  { title: 'Article 8 — Signalement et conflit d\'intérêts',
    content: 'Tout utilisateur peut signaler une annonce suspecte. En cas de conflit d\'intérêts (le notaire est lié au propriétaire), la certification est bloquée. Le propriétaire reconnaît que HOMECI peut retirer un bien en cas de signalement vérifié, de décertification par un notaire, ou de non-conformité aux présentes conditions.' },
];

const CGV_LOCATAIRE: CGVSection[] = [
  { title: 'Article 1 — Objet',
    content: 'Les présentes conditions régissent l\'utilisation de HOMECI par les locataires et acheteurs potentiels. La plateforme permet de rechercher des biens immobiliers vérifiés, de demander des visites, et d\'entrer en contact avec les propriétaires de manière sécurisée.' },
  { title: 'Article 2 — Inscription et accès',
    content: 'L\'inscription est gratuite et peut se faire par email ou via Google. Le locataire s\'engage à fournir des informations exactes et à ne pas créer plusieurs comptes. L\'accès aux coordonnées du propriétaire n\'est débloqué qu\'après confirmation d\'une visite et paiement des frais de service.' },
  { title: 'Article 3 — Demande de visite',
    content: 'Le locataire peut demander une visite en choisissant un créneau. Le propriétaire dispose de 3 jours pour accepter, refuser, ou contre-proposer une date. Les frais de visite de 1 000 FCFA sont payables via Mobile Money. En cas de refus par le propriétaire, le locataire est automatiquement recrédité.' },
  { title: 'Article 4 — Obligations du locataire',
    content: 'Le locataire s\'engage à : (a) Se présenter aux visites confirmées ou annuler dans un délai raisonnable ; (b) Ne pas utiliser la plateforme à des fins frauduleuses ; (c) Signaler tout comportement suspect ou annonce trompeuse ; (d) Respecter les biens visités et les règles de bienséance lors des visites.' },
  { title: 'Article 5 — Protection des données',
    content: 'Les informations personnelles du locataire sont protégées conformément à la loi n°2013-450 relative à la protection des données personnelles. HOMECI ne partage pas les données du locataire avec des tiers sans consentement, sauf obligation légale.' },
  { title: 'Article 6 — Limitation de responsabilité',
    content: 'HOMECI ne garantit pas la conclusion d\'une transaction immobilière. La plateforme agit en tant qu\'intermédiaire technologique et ne peut être tenue responsable de l\'état des biens visités, de la véracité des informations non vérifiées par le notaire, ni des accords conclus directement entre le locataire et le propriétaire.' },
];

const CGV_NOTAIRE: CGVSection[] = [
  { title: 'Article 1 — Cadre d\'exercice',
    content: 'Le notaire intervient sur HOMECI en qualité de professionnel inscrit au Tableau de l\'Ordre des Notaires de Côte d\'Ivoire, conformément à la loi n°2014-138 du 24 mars 2014. L\'accès à la plateforme est soumis à un code d\'invitation fourni par l\'administration de HOMECI.' },
  { title: 'Article 2 — Mission de vérification',
    content: 'Le notaire s\'engage à vérifier avec diligence : (a) L\'authenticité du titre foncier ou de l\'ACD ; (b) La conformité du permis de construire le cas échéant ; (c) L\'identité du propriétaire via les pièces d\'identité soumises ; (d) L\'absence de charges, hypothèques ou saisies sur le bien.' },
  { title: 'Article 3 — Conflit d\'intérêts',
    content: 'Le notaire ne peut certifier un bien dont il est le propriétaire, le mandataire, ou un proche parent du propriétaire. En cas de conflit d\'intérêts détecté, la certification est automatiquement bloquée.' },
  { title: 'Article 4 — Certification et décertification',
    content: 'La certification accorde le badge « Vérifié Notaire » au bien. Le notaire peut retirer cette certification si de nouveaux éléments le justifient. La décertification doit être motivée et entraîne la notification automatique du propriétaire et des locataires ayant une visite en cours.' },
  { title: 'Article 5 — Délais et horodatage',
    content: 'La prise en charge d\'un dossier est horodatée. Le notaire s\'engage à traiter chaque dossier dans un délai de 72 heures maximum. L\'ensemble des actions est journalisé et horodaté dans le système.' },
  { title: 'Article 6 — Confidentialité et déontologie',
    content: 'Le notaire est soumis au secret professionnel tel que défini par le Code de déontologie notariale ivoirien. Les documents consultés sur HOMECI ne peuvent être divulgués à des tiers. En cas de manquement, HOMECI se réserve le droit de révoquer l\'accès du notaire.' },
  { title: 'Article 7 — Rémunération',
    content: 'La rémunération du notaire pour les services de vérification sur HOMECI est de 50 000 FCFA par dossier certifié, virée mensuellement selon les modalités définies dans le contrat de prestation.' },
  { title: 'Article 8 — Responsabilité',
    content: 'Le notaire engage sa responsabilité professionnelle pour les vérifications effectuées. En cas de certification d\'un bien dont les documents s\'avèrent frauduleux, le notaire est tenu de coopérer avec les autorités judiciaires.' },
];

function AccordionSection({ section }: { section: CGVSection }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{ background: open ? HAlpha.gold05 : 'transparent', border: `1px solid ${open ? HAlpha.gold20 : HAlpha.gold10}` }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-all hover:opacity-80">
        <span className="text-sm font-semibold pr-4"
          style={{ color: open ? HColors.orangeCI : HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
          {section.title}
        </span>
        <ChevronDown className="w-4 h-4 shrink-0 transition-transform"
          style={{ color: open ? HColors.orangeCI : HColors.brown, transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            {section.content}
          </p>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'proprietaire', label: 'Propriétaires', icon: Home, sections: CGV_PROPRIETAIRE },
  { id: 'locataire', label: 'Locataires / Acheteurs', icon: Users, sections: CGV_LOCATAIRE },
  { id: 'notaire', label: 'Notaires Agréés', icon: Scale, sections: CGV_NOTAIRE },
];

export default function CGVPage() {
  const [activeTab, setActiveTab] = useState('proprietaire');
  const active = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div className="min-h-screen" style={{ background: HColors.creamBg }}>
      <div className="py-16 px-4 text-center"
        style={{ background: 'linear-gradient(160deg, #0D1F12 0%, #1A0E00 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ background: HAlpha.orange10, border: `2px solid ${HAlpha.orange25}` }}>
            <Shield className="w-7 h-7" style={{ color: HColors.orangeCI }} />
          </div>
          <h1 className="text-3xl font-bold mb-3"
            style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-sm" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
            Conformes au droit ivoirien — Dernière mise à jour : Mars 2026
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex gap-2 mb-8 flex-wrap justify-center">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all"
                style={activeTab === tab.id
                  ? { background: HColors.orangeCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }
                  : { background: HColors.white, color: HColors.brown, border: `1px solid ${HAlpha.gold20}`, fontFamily: 'var(--font-nunito)' }}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <p className="text-xs mb-4 text-center" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
          {active.sections.length} articles — CGU {active.label}
        </p>

        <div className="space-y-3">
          {active.sections.map((section, idx) => (
            <AccordionSection key={idx} section={section} />
          ))}
        </div>

        <div className="mt-12 rounded-2xl p-6 text-center"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <p className="text-xs mb-2" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Ces conditions sont soumises au droit ivoirien. Tout litige relève de la compétence
            exclusive des tribunaux d'Abidjan, Côte d'Ivoire.
          </p>
          <p className="text-xs" style={{ color: HAlpha.gold50, fontFamily: 'var(--font-nunito)' }}>
            HOMECI — L'immobilier ivoirien, certifié et sécurisé.
          </p>
        </div>
      </div>
    </div>
  );
}
