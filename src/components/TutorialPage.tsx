import { useState } from 'react';
import {
  Search, Heart, Calendar, Bell, Home, UserPlus, Camera, FileText, CheckCircle,
  ChevronRight, MapPin, Star, MessageCircle, Shield, BookOpen, Users, Scale, Eye
} from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';

/* ── Types ── */

interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  tip?: string;
}

interface TutorialSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  steps: TutorialStep[];
}

/* ── Data ── */

const TUTORIALS: TutorialSection[] = [
  {
    id: 'start',
    title: 'Premiers pas',
    subtitle: 'Inscription et prise en main',
    icon: <UserPlus className="w-5 h-5" />,
    steps: [
      {
        icon: <UserPlus className="w-6 h-6" />,
        title: 'Créez votre compte',
        description:
          'Cliquez sur "S\'inscrire" en haut à droite. Vous pouvez vous inscrire par email ou avec Google.',
      },
      {
        icon: <Users className="w-6 h-6" />,
        title: 'Choisissez votre rôle',
        description:
          'Sélectionnez votre profil : Locataire/Acheteur (vous cherchez un bien) ou Propriétaire (vous publiez vos biens). Les notaires sont inscrits sur invitation uniquement.',
      },
      {
        icon: <Bell className="w-6 h-6" />,
        title: 'Activez les notifications',
        description:
          'Autorisez les notifications push pour être alerté en temps réel des nouvelles visites, messages et mises à jour de vos biens. Vous pouvez personnaliser vos préférences dans votre profil.',
        tip: 'Si vous avez refusé, cliquez sur l\'icône de cloche barrée dans le menu pour réactiver.',
      },
    ],
  },
  {
    id: 'search',
    title: 'Rechercher un bien',
    subtitle: 'Trouvez le bien idéal',
    icon: <Search className="w-5 h-5" />,
    steps: [
      {
        icon: <Search className="w-6 h-6" />,
        title: 'Utilisez la recherche intelligente',
        description:
          'Tapez directement ce que vous cherchez : "Appartement 3 pièces Cocody", "Villa > 500 000 FCFA", "Terrain Yamoussoukro". La recherche comprend le type de bien, la localisation, le nombre de pièces et le budget.',
      },
      {
        icon: <MapPin className="w-6 h-6" />,
        title: 'Filtrez par localisation',
        description:
          'Sélectionnez votre zone géographique en cascade : District, Région, Département, Ville, Commune, puis Quartier. HOMECI couvre l\'ensemble de la Côte d\'Ivoire.',
      },
      {
        icon: <Shield className="w-6 h-6" />,
        title: 'Filtrez les biens certifiés',
        description:
          'Cochez "Vérifié par un notaire" pour n\'afficher que les biens dont les documents ont été vérifiés par un notaire agréé. C\'est votre garantie de sécurité.',
        tip: 'Le badge "Vérifié Notaire" signifie que le titre foncier, les permis et l\'identité du propriétaire sont conformes.',
      },
      {
        icon: <Heart className="w-6 h-6" />,
        title: 'Ajoutez en favoris',
        description:
          'Cliquez sur le coeur pour sauvegarder un bien. Retrouvez tous vos favoris dans l\'onglet "Mes favoris" de votre tableau de bord.',
      },
    ],
  },
  {
    id: 'visit',
    title: 'Demander une visite',
    subtitle: 'De la demande à la visite',
    icon: <Calendar className="w-5 h-5" />,
    steps: [
      {
        icon: <Eye className="w-6 h-6" />,
        title: 'Consultez le bien en détail',
        description:
          'Cliquez sur un bien pour voir ses photos, vidéos, caractéristiques complètes et sa localisation sur la carte. Vérifiez les informations avant de demander une visite.',
      },
      {
        icon: <Calendar className="w-6 h-6" />,
        title: 'Choisissez une date et un créneau',
        description:
          'Cliquez sur "Demander une visite" et sélectionnez votre date et créneau horaire préférés. Le propriétaire sera notifié immédiatement.',
        tip: 'Le propriétaire peut accepter, refuser ou proposer une autre date. Vous serez notifié à chaque étape.',
      },
      {
        icon: <MessageCircle className="w-6 h-6" />,
        title: 'Échangez avec le propriétaire',
        description:
          'Une fois la visite acceptée, un chat s\'ouvre entre vous et le propriétaire. Posez vos questions, demandez des précisions, et organisez les détails de la visite.',
      },
      {
        icon: <Star className="w-6 h-6" />,
        title: 'Évaluez votre expérience',
        description:
          'Après la visite, notez votre satisfaction (1 à 5 étoiles) et laissez un commentaire. Cela aide les autres utilisateurs et améliore la qualité de HOMECI.',
      },
    ],
  },
  {
    id: 'publish',
    title: 'Publier un bien',
    subtitle: 'Guide pour les propriétaires',
    icon: <Home className="w-5 h-5" />,
    steps: [
      {
        icon: <Home className="w-6 h-6" />,
        title: 'Remplissez les informations du bien',
        description:
          'Depuis votre tableau de bord, cliquez "Ajouter un bien". Renseignez le type (Appartement, Villa, Terrain...), le prix, la localisation, la surface, le nombre de pièces et une description détaillée.',
        tip: 'Plus votre annonce est complète, plus elle attire de visiteurs. Ajoutez une description précise du quartier et des commodités.',
      },
      {
        icon: <Camera className="w-6 h-6" />,
        title: 'Ajoutez des photos et vidéos',
        description:
          'Téléchargez plusieurs photos de qualité (intérieur, extérieur, environs). Vous pouvez aussi ajouter une vidéo pour une visite virtuelle. Les biens avec photos reçoivent 5x plus de demandes.',
      },
      {
        icon: <FileText className="w-6 h-6" />,
        title: 'Soumettez vos documents',
        description:
          'Téléchargez les documents requis selon le type de bien : titre foncier, permis de construire, CNI/passeport, attestation de résidence. Pour les hôtels : autorisation d\'exploitation et registre de commerce.',
      },
      {
        icon: <Scale className="w-6 h-6" />,
        title: 'Certification par un notaire',
        description:
          'Un notaire agréé HOMECI examine vos documents (24 à 72h). Il valide ou demande des corrections. Une fois certifié, votre bien obtient le badge "Vérifié Notaire" et est publié.',
        tip: 'Assurez-vous que vos documents sont lisibles et à jour pour accélérer la certification.',
      },
      {
        icon: <CheckCircle className="w-6 h-6" />,
        title: 'Gérez vos visites et transactions',
        description:
          'Recevez les demandes de visite, acceptez ou proposez d\'autres dates. Après la visite, mettez à jour le statut : "Loué", "Vendu" ou "Non abouti". Vous avez 3 jours, sinon le bien repasse en disponible automatiquement.',
      },
    ],
  },
  {
    id: 'notaire',
    title: 'Espace Notaire',
    subtitle: 'Certifier les biens immobiliers',
    icon: <Scale className="w-5 h-5" />,
    steps: [
      {
        icon: <UserPlus className="w-6 h-6" />,
        title: 'Inscription sur invitation',
        description:
          'L\'inscription des notaires se fait uniquement par code d\'invitation fourni par HOMECI. Créez votre compte avec email et saisissez le code reçu pour accéder à l\'espace notaire.',
      },
      {
        icon: <FileText className="w-6 h-6" />,
        title: 'Examinez les dossiers',
        description:
          'Depuis l\'onglet "Disponibles", prenez en charge un bien. Vous accédez aux documents du propriétaire : titre foncier, permis, identité. Validez ou refusez chaque document avec un motif.',
      },
      {
        icon: <CheckCircle className="w-6 h-6" />,
        title: 'Certifiez le bien',
        description:
          'Une fois tous les documents validés, certifiez le bien. Il obtient le badge "Vérifié Notaire" et est publié. Vous pouvez retirer une certification si un problème est constaté.',
        tip: 'La révocation d\'une certification annule automatiquement les visites en cours et notifie les parties concernées.',
      },
    ],
  },
  {
    id: 'security',
    title: 'Sécurité & Confiance',
    subtitle: 'Votre protection sur HOMECI',
    icon: <Shield className="w-5 h-5" />,
    steps: [
      {
        icon: <Shield className="w-6 h-6" />,
        title: 'Données personnelles protégées',
        description:
          'HOMECI respecte la loi n°2013-450 sur la protection des données (ARTCI). Vos pièces d\'identité sont chiffrées et accessibles uniquement par vous et le notaire en charge de votre dossier.',
      },
      {
        icon: <CheckCircle className="w-6 h-6" />,
        title: 'Paiements sécurisés',
        description:
          'Tous les paiements passent par des passerelles certifiées (Orange Money, MTN, Wave, Moov, Djamo). HOMECI ne stocke jamais vos informations de paiement.',
      },
      {
        icon: <MessageCircle className="w-6 h-6" />,
        title: 'Signalez les annonces suspectes',
        description:
          'Si un bien vous semble frauduleux ou trompeur, cliquez "Signaler cette annonce" et choisissez un motif. Notre équipe examine chaque signalement sous 48h.',
        tip: 'En cas de problème urgent, contactez-nous à contact@homeci.ci avec l\'objet "Sécurité".',
      },
    ],
  },
];

/* ── Step Card ── */

function StepCard({ step, index }: { step: TutorialStep; index: number }) {
  return (
    <div className="flex gap-4 items-start">
      {/* Step number + connector */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: HAlpha.orange10, color: HColors.orangeCI, border: `2px solid ${HAlpha.orange25}` }}>
          {index + 1}
        </div>
        <div className="w-px flex-1 min-h-[20px] mt-2" style={{ background: HAlpha.gold15 }} />
      </div>

      {/* Content */}
      <div className="pb-8 flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span style={{ color: HColors.orangeCI }}>{step.icon}</span>
          <h3 className="text-base font-bold"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
            {step.title}
          </h3>
        </div>
        <p className="text-sm leading-relaxed mb-2"
          style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
          {step.description}
        </p>
        {step.tip && (
          <div className="flex gap-2 items-start px-3 py-2.5 rounded-lg mt-2"
            style={{ background: HAlpha.gold05, border: `1px solid ${HAlpha.gold15}` }}>
            <Star className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: HColors.gold }} />
            <p className="text-xs leading-relaxed"
              style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
              <strong>Astuce :</strong> {step.tip}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main ── */

export default function TutorialPage() {
  const [activeSection, setActiveSection] = useState(0);
  const section = TUTORIALS[activeSection];

  return (
    <div className="min-h-screen" style={{ background: HColors.creamBg }}>

      {/* Hero */}
      <div className="py-16 px-4 text-center"
        style={{ background: 'linear-gradient(160deg, #0D1F12 0%, #1A0E00 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
            style={{ background: HAlpha.orange10, border: `2px solid ${HAlpha.orange25}` }}>
            <BookOpen className="w-7 h-7" style={{ color: HColors.orangeCI }} />
          </div>
          <h1 className="text-3xl font-bold mb-3"
            style={{ color: HColors.cream, fontFamily: 'var(--font-cormorant)' }}>
            Guide d'utilisation
          </h1>
          <p className="text-sm" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
            Apprenez à utiliser HOMECI en quelques minutes
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Section tabs */}
        <div className="flex gap-2 mb-8 flex-wrap justify-center">
          {TUTORIALS.map((t, idx) => (
            <button key={t.id} onClick={() => setActiveSection(idx)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all"
              style={activeSection === idx
                ? { background: HColors.orangeCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }
                : { background: HColors.white, color: HColors.brown, border: `1px solid ${HAlpha.gold15}`,
                    fontFamily: 'var(--font-nunito)' }}>
              {t.icon}
              <span className="hidden sm:inline">{t.title}</span>
            </button>
          ))}
        </div>

        {/* Active section */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`,
                   boxShadow: '0 2px 20px rgba(26,14,0,0.06)' }}>

          {/* Section header */}
          <div className="mb-8 pb-6" style={{ borderBottom: `1px solid ${HAlpha.gold10}` }}>
            <h2 className="text-2xl font-bold mb-1"
              style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>
              {section.title}
            </h2>
            <p className="text-sm" style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
              {section.subtitle}
            </p>
          </div>

          {/* Steps */}
          <div>
            {section.steps.map((step, idx) => (
              <StepCard key={idx} step={step} index={idx} />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
            style={{ background: HColors.white, color: HColors.brown, border: `1px solid ${HAlpha.gold15}`,
                     fontFamily: 'var(--font-nunito)' }}>
            <ChevronRight className="w-4 h-4 rotate-180" /> Précédent
          </button>
          <span className="text-xs" style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
            {activeSection + 1} / {TUTORIALS.length}
          </span>
          <button
            onClick={() => setActiveSection(Math.min(TUTORIALS.length - 1, activeSection + 1))}
            disabled={activeSection === TUTORIALS.length - 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
            style={{ background: HColors.orangeCI, color: '#FFFFFF', fontFamily: 'var(--font-nunito)' }}>
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Help link */}
        <div className="text-center mt-10 py-6 rounded-xl"
          style={{ background: HAlpha.gold05, border: `1px solid ${HAlpha.gold10}` }}>
          <p className="text-sm mb-2" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Vous avez encore des questions ?
          </p>
          <a href="/faq"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: HColors.white, color: HColors.orangeCI, border: `1px solid ${HAlpha.orange25}`,
                     fontFamily: 'var(--font-nunito)' }}>
            Consultez la FAQ <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
