import { ShieldCheck, FileText, Smartphone, MapPin, Clock, Users } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';

const features = [
  { icon: ShieldCheck, title: 'Vérification Notaire',   desc: 'Chaque bien est vérifié par un notaire agréé inscrit au tableau de l\'Ordre', color: HColors.vertCI },
  { icon: FileText,    title: 'Annonces Certifiées',    desc: 'Documents légaux contrôlés et authentifiés — zéro arnaque', color: HColors.orangeCI },
  { icon: Smartphone,  title: 'Paiements Mobile Money', desc: 'Orange Money, MTN MoMo, Wave, Flooz et Djamo via notre partenaire Movapay', color: HColors.vertCI },
  { icon: MapPin,      title: '14 Districts Couverts',  desc: 'Toute la Côte d\'Ivoire à portée de main, d\'Abidjan à Korhogo', color: HColors.orangeCI },
  { icon: Clock,       title: 'Support 24/7',           desc: 'Notre équipe est disponible pour vous accompagner à tout moment', color: HColors.vertCI },
  { icon: Users,       title: 'Contrats Automatiques',  desc: 'Génération automatique de contrats de bail et promesses de vente conformes', color: HColors.orangeCI },
];

export function Features() {
  return (
    <section className="relative py-20" style={{ background: HColors.white }}>

      {/* Motif losange Baoulé en fond */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L45 15L30 30L15 15Z' fill='%230A3D1F'/%3E%3Cpath d='M0 30L15 45L0 60' fill='%230A3D1F'/%3E%3Cpath d='M60 30L45 45L60 60' fill='%230A3D1F'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px',
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(2rem,4vw,3rem)',
                       fontWeight: 700, color: HColors.night, lineHeight: 1.2 }}>
            Pourquoi HOMECI ?
          </h2>
          <div className="mx-auto mt-4 rounded-full"
            style={{ width: 60, height: 3, background: `linear-gradient(90deg, ${HColors.orangeCI}, ${HColors.gold})` }} />
          <p className="mt-5 max-w-lg mx-auto text-base"
            style={{ color: 'rgba(92,61,30,0.6)', fontFamily: 'var(--font-nunito)' }}>
            La solidité d'un éléphant, la précision d'un notaire.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="group p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                style={{ background: HColors.creamBg, border: '1px solid rgba(245,230,200,0.5)',
                         boxShadow: '0 2px 12px rgba(10,61,31,0.06)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: f.color, borderRadius: 12 }}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2"
                  style={{ color: HColors.night, fontFamily: 'var(--font-cormorant)', fontSize: '1.2rem' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed"
                  style={{ color: 'rgba(92,61,30,0.6)', fontFamily: 'var(--font-nunito)' }}>
                  {f.desc}
                </p>
                {/* Hover underline */}
                <div className="mt-4 h-0.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                  style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
