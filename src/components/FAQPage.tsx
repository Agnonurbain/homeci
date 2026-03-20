import { useState } from 'react';
import { ChevronDown, Mail, Phone, MapPin, MessageCircle, Shield, Home, CreditCard, Users, Scale, HelpCircle } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';

/* ── FAQ Data ────────────────────────────────────────────────────────────── */

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const FAQ_SECTIONS: FAQSection[] = [
  {
    title: 'Général',
    icon: <HelpCircle className="w-5 h-5" />,
    items: [
      {
        question: "Qu'est-ce que HOMECI ?",
        answer: "HOMECI est la plateforme immobilière de référence en Côte d'Ivoire. Tous les biens publiés sont vérifiés et certifiés par des notaires agréés, garantissant la sécurité et la transparence de chaque transaction.",
      },
      {
        question: "HOMECI est-il gratuit ?",
        answer: "La consultation des annonces est entièrement gratuite. Des frais de service s'appliquent lors des demandes de visite et de la publication de biens. Tous les tarifs sont affichés de manière transparente avant toute transaction.",
      },
      {
        question: "Dans quelles villes HOMECI est-il disponible ?",
        answer: "HOMECI couvre l'ensemble du territoire de la Côte d'Ivoire : Abidjan (toutes les communes), Yamoussoukro, Bouaké, San-Pédro, Daloa, Korhogo, et toutes les autres villes et communes du pays.",
      },
    ],
  },
  {
    title: 'Locataires & Acheteurs',
    icon: <Users className="w-5 h-5" />,
    items: [
      {
        question: "Comment demander une visite ?",
        answer: "Trouvez un bien qui vous intéresse, cliquez sur « Demander une visite », choisissez une date et un créneau horaire. Le propriétaire recevra votre demande et pourra l'accepter, la refuser, ou proposer une autre date.",
      },
      {
        question: "Que signifie le badge « Vérifié Notaire » ?",
        answer: "Ce badge garantit qu'un notaire agréé a vérifié les documents légaux du bien (titre foncier, permis de construire, identité du propriétaire). C'est votre assurance que le bien est légitime et les documents conformes.",
      },
      {
        question: "Puis-je me connecter avec mon numéro de téléphone ?",
        answer: "Oui ! Les locataires/acheteurs peuvent se connecter par email, Google, ou numéro de téléphone ivoirien (+225). Un code SMS sera envoyé pour vérification.",
      },
      {
        question: "Que se passe-t-il si un bien est « en cours de transaction » ?",
        answer: "Cela signifie qu'une visite a déjà été confirmée avec un autre utilisateur. Le bien redeviendra disponible si la transaction n'aboutit pas. Vous pouvez ajouter le bien en favori pour être informé.",
      },
      {
        question: "Comment signaler une annonce suspecte ?",
        answer: "Sur la page de chaque bien, cliquez sur « Signaler cette annonce ». Choisissez un motif (fausse annonce, prix trompeur, etc.) et ajoutez des détails. Notre équipe examinera le signalement sous 48h.",
      },
    ],
  },
  {
    title: 'Propriétaires',
    icon: <Home className="w-5 h-5" />,
    items: [
      {
        question: "Comment publier un bien ?",
        answer: "Créez un compte propriétaire (email ou Google obligatoire pour la traçabilité), acceptez les CGU, puis cliquez sur « Ajouter un bien ». Remplissez les informations, ajoutez des photos, et soumettez les documents légaux. Un notaire vérifiera votre dossier.",
      },
      {
        question: "Quels documents sont nécessaires ?",
        answer: "Les documents varient selon le type de bien : titre foncier (obligatoire), permis de construire, CNI ou passeport du propriétaire, attestation de résidence. Pour les terrains : plan cadastral. Pour les hôtels : autorisation d'exploitation et registre de commerce.",
      },
      {
        question: "Combien de temps prend la certification notaire ?",
        answer: "Un notaire prend en charge votre dossier dès qu'il est soumis. La vérification prend généralement 24 à 72 heures. Vous recevrez une notification dès que votre bien est certifié et publié.",
      },
      {
        question: "Que dois-je faire après une visite ?",
        answer: "Après avoir marqué la visite comme effectuée, vous disposez de 3 jours pour mettre à jour le statut de votre bien : « Loué », « Vendu », ou « Transaction non aboutie ». Passé ce délai, le bien sera automatiquement remis en disponible.",
      },
    ],
  },
  {
    title: 'Paiements',
    icon: <CreditCard className="w-5 h-5" />,
    items: [
      {
        question: "Quels moyens de paiement sont acceptés ?",
        answer: "HOMECI accepte Orange Money, MTN MoMo, Wave, Moov Flooz et Djamo. Tous les paiements sont sécurisés via notre partenaire Movapay.",
      },
      {
        question: "Les paiements sont-ils sécurisés ?",
        answer: "Oui. Toutes les transactions sont chiffrées et transitent par des passerelles de paiement certifiées. HOMECI ne stocke jamais vos informations bancaires ou de mobile money.",
      },
      {
        question: "Puis-je obtenir un remboursement ?",
        answer: "Si un propriétaire annule une visite après votre paiement, vous serez automatiquement recrédité. En cas de problème, contactez notre support à contact@homeci.ci.",
      },
    ],
  },
  {
    title: 'Sécurité & Confidentialité',
    icon: <Shield className="w-5 h-5" />,
    items: [
      {
        question: "Mes données personnelles sont-elles protégées ?",
        answer: "Absolument. HOMECI respecte la loi n°2013-450 relative à la protection des données personnelles en Côte d'Ivoire (ARTCI). Vos pièces d'identité sont stockées de manière chiffrée et accessibles uniquement par vous et le notaire en charge de votre dossier.",
      },
      {
        question: "Qui peut voir mes pièces d'identité (CNI, passeport) ?",
        answer: "Seul vous-même pouvez accéder directement à vos fichiers d'identité dans Firebase Storage. Le notaire y accède via des URLs sécurisées avec token. Aucun locataire ou autre utilisateur ne peut les voir.",
      },
      {
        question: "Comment signaler un problème de sécurité ?",
        answer: "Envoyez un email à contact@homeci.ci avec l'objet « Sécurité ». Notre équipe traitera votre signalement en priorité sous 24h.",
      },
    ],
  },
  {
    title: 'Notaires',
    icon: <Scale className="w-5 h-5" />,
    items: [
      {
        question: "Comment devenir notaire agréé sur HOMECI ?",
        answer: "L'inscription des notaires se fait sur invitation uniquement. Un administrateur HOMECI vous fournira un code d'invitation à saisir lors de votre inscription. Ce processus garantit que seuls les notaires vérifiés accèdent à la plateforme.",
      },
      {
        question: "Puis-je retirer une certification ?",
        answer: "Oui. Si vous constatez un problème avec un bien certifié, vous pouvez retirer la certification avec un motif obligatoire. Si une visite est en cours, elle sera automatiquement annulée et les locataires seront notifiés.",
      },
    ],
  },
];

/* ── Components ──────────────────────────────────────────────────────────── */

function AccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{ background: open ? HAlpha.gold05 : 'transparent', border: `1px solid ${open ? HAlpha.gold20 : HAlpha.gold10}` }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-all hover:opacity-80">
        <span className="text-sm font-semibold pr-4"
          style={{ color: open ? HColors.orangeCI : HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>
          {item.question}
        </span>
        <ChevronDown className="w-4 h-4 shrink-0 transition-transform" 
          style={{ color: open ? HColors.orangeCI : HColors.brown, transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed"
            style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            {item.answer}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export default function FAQPage() {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div className="min-h-screen" style={{ background: HColors.creamBg }}>

      {/* Hero */}
      <div className="py-16 px-4 text-center"
        style={{ background: 'linear-gradient(160deg, #0D1F12 0%, #1A0E00 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ background: HAlpha.orange10, border: `2px solid ${HAlpha.orange25}` }}>
            <MessageCircle className="w-7 h-7" style={{ color: HColors.orangeCI }} />
          </div>
          <h1 className="text-3xl font-bold mb-3"
            style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
            Aide & Questions fréquentes
          </h1>
          <p className="text-sm" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
            Trouvez rapidement les réponses à vos questions sur HOMECI
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Section tabs */}
        <div className="flex gap-2 mb-8 flex-wrap justify-center">
          {FAQ_SECTIONS.map((section, idx) => (
            <button key={idx} onClick={() => setActiveSection(idx)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={activeSection === idx
                ? { background: HColors.orangeCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }
                : { background: HColors.white, color: HColors.brown, border: `1px solid ${HAlpha.gold20}`,
                    fontFamily: 'var(--font-nunito)' }}>
              {section.icon}
              {section.title}
            </button>
          ))}
        </div>

        {/* Active section */}
        <div className="space-y-3">
          {FAQ_SECTIONS[activeSection].items.map((item, idx) => (
            <AccordionItem key={idx} item={item} />
          ))}
        </div>

        {/* Contact section */}
        <div className="mt-16 rounded-2xl p-8 text-center"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
                   boxShadow: '0 2px 12px rgba(26,14,0,0.05)' }}>
          <h2 className="text-xl font-bold mb-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
            Vous n'avez pas trouvé votre réponse ?
          </h2>
          <p className="text-sm mb-6"
            style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Notre équipe est disponible du lundi au vendredi, de 8h à 18h (heure d'Abidjan)
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:contact@homeci.ci"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #D4A017)', color: '#FFFFFF',
                       fontFamily: 'var(--font-nunito)' }}>
              <Mail className="w-4 h-4" /> contact@homeci.ci
            </a>
            <a href="tel:+2250700000000"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ border: `1px solid ${HAlpha.gold25}`, color: HColors.darkBrown,
                       fontFamily: 'var(--font-nunito)' }}>
              <Phone className="w-4 h-4" /> +225 07 00 00 00 00
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-xs"
            style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            <MapPin className="w-3.5 h-3.5" style={{ color: HColors.orangeCI }} />
            Abidjan, Côte d'Ivoire
          </div>
        </div>
      </div>
    </div>
  );
}
