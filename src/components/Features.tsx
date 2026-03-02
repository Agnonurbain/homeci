import { Shield, CheckCircle, CreditCard, MapPin, MessageCircle, FileText } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';

const features = [
  { icon: Shield,        title: 'Vérification Notaire',   description: 'Tous nos biens sont vérifiés par un notaire avec contrôle des titres fonciers IDUFCI/GUFH', accent:HColors.gold },
  { icon: CheckCircle,   title: 'Annonces Certifiées',    description: 'Zéro arnaque grâce à notre système de validation stricte des documents', accent:HColors.green },
  { icon: CreditCard,    title: 'Paiements Sécurisés',    description: 'Orange Money, MTN MoMo, Wave et Flooz via notre partenaire Movapay', accent:HColors.terracotta },
  { icon: MapPin,        title: '14 Districts Couverts',  description: 'Toute la Côte d\'Ivoire couverte, d\'Abidjan à San Pedro, de Bouaké à Korhogo', accent:HColors.gold },
  { icon: MessageCircle, title: 'Support 24/7',           description: 'Notre équipe est disponible pour vous accompagner à tout moment', accent:HColors.green },
  { icon: FileText,      title: 'Contrats Automatiques',  description: 'Génération automatique de contrats de bail et promesses de vente conformes', accent:HColors.terracotta },
];

export function Features() {
  return (
    <section className="py-20" style={{ background:HColors.creamBg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-semibold tracking-widest"
            style={{ background:HAlpha.gold12, border:'1px solid rgba(212,160,23,0.3)',
                     color:HColors.brownMid, fontFamily:'var(--font-nunito)', letterSpacing:'0.15em' }}>
            ◆ NOS ENGAGEMENTS ◆
          </div>
          <h2 style={{ fontFamily:'var(--font-cormorant)', fontSize:'clamp(2rem,4vw,3rem)',
                       fontWeight:700, color:HColors.darkBrown, lineHeight:1.2 }}>
            Pourquoi choisir HOMECI ?
          </h2>
          <div className="mx-auto mt-4 rounded-full" style={{ width:60, height:3, background:'linear-gradient(90deg,#D4A017,#C07C3E)' }}/>
          <p className="mt-5 max-w-xl mx-auto text-base"
            style={{ color:HColors.brownDark, fontFamily:'var(--font-nunito)', opacity:0.8 }}>
            La première plateforme immobilière 100% sécurisée en Côte d'Ivoire
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="group p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                style={{ background:HColors.white, border:'1px solid rgba(212,160,23,0.15)',
                         boxShadow:'0 2px 12px rgba(26,14,0,0.06)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all"
                  style={{ background:`${f.accent}18`, border:`1px solid ${f.accent}30` }}>
                  <Icon className="w-5 h-5" style={{ color: f.accent }} />
                </div>
                <h3 className="text-lg font-semibold mb-2"
                  style={{ color:HColors.darkBrown, fontFamily:'var(--font-cormorant)', fontSize:'1.2rem', fontWeight:700 }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed"
                  style={{ color:HColors.brownDark, fontFamily:'var(--font-nunito)', opacity:0.8 }}>
                  {f.description}
                </p>
                <div className="mt-4 h-0.5 rounded-full transition-all duration-300 group-hover:opacity-100 opacity-0"
                  style={{ background:`linear-gradient(90deg,${f.accent},transparent)` }}/>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
