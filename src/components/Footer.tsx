import { useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { HomeCIEmblem } from './HomeCIEmblem';
import { KenteLine } from './ui/KenteLine';
import { HColors, HAlpha } from '../styles/homeci-tokens';
import PrivacyPolicyModal from './PrivacyPolicyModal';

export function Footer() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  return (
    <footer style={{ background: 'linear-gradient(180deg, #0D2F15 0%, #0A3D1F 40%, #1A0E00 100%)', borderTop: '1px solid rgba(212,160,23,0.15)' }}>

      {/* Bande Kente */}
      <KenteLine height={5} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand — logo + devise */}
          <div>
            <HomeCIEmblem variant="full" className="mb-4 w-32" />
            <p className="text-sm leading-relaxed mb-2"
              style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
              La première plateforme immobilière en Côte d'Ivoire avec vérification notaire garantie.
            </p>
            <p className="text-xs italic tracking-wider mb-5"
              style={{ color: HAlpha.gold50, fontFamily: 'var(--font-cormorant)' }}>
              « Union, Discipline, Travail »
            </p>
            <div className="flex gap-2.5">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#"
                  className="p-2.5 rounded-lg homeci-social-icon"
                  style={{ background: HAlpha.orange08, border: `1px solid ${HAlpha.orange15}` }}>
                  <Icon className="w-4 h-4" style={{ color: HColors.orangeCI }} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-5 text-sm tracking-widest uppercase"
              style={{ color: HColors.orangeCI, fontFamily: 'var(--font-nunito)', textShadow: '0 0 16px rgba(255,107,0,0.2)' }}>Navigation</h3>
            <ul className="space-y-3">
              {[
                { label: 'Rechercher', href: '/#search' },
                { label: 'Biens à louer', href: '/#properties' },
                { label: 'Biens à vendre', href: '/#properties' },
                { label: 'Guide d\'utilisation', href: '/tutoriel' },
                { label: 'Aide & FAQ', href: '/faq' },
              ].map(l => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm transition-colors hover:opacity-100"
                    style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Villes */}
          <div>
            <h3 className="font-semibold mb-5 text-sm tracking-widest uppercase"
              style={{ color: HColors.orangeCI, fontFamily: 'var(--font-nunito)', textShadow: '0 0 16px rgba(255,107,0,0.2)' }}>Villes</h3>
            <ul className="space-y-3">
              {['Abidjan', 'Bouaké', 'Yamoussoukro', 'San Pedro', 'Korhogo'].map(v => (
                <li key={v}>
                  <a href="#" className="text-sm transition-colors hover:opacity-100"
                    style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>{v}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-5 text-sm tracking-widest uppercase"
              style={{ color: HColors.orangeCI, fontFamily: 'var(--font-nunito)', textShadow: '0 0 16px rgba(255,107,0,0.2)' }}>Contact</h3>
            <ul className="space-y-4">
              {[
                { Icon: MapPin, text: "Abidjan, Cocody Riviera, Côte d'Ivoire" },
                { Icon: Phone,  text: '+225 07 00 00 00 00' },
                { Icon: Mail,   text: 'contact@homeci.ci' },
              ].map(({ Icon, text }, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: HColors.orangeCI }} />
                  <span className="text-sm" style={{ color: HAlpha.cream50, fontFamily: 'var(--font-nunito)' }}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Mobile Money logos */}
            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-wider font-bold mb-2"
                style={{ color: HAlpha.gold50, fontFamily: 'var(--font-nunito)' }}>Paiements acceptés</p>
              <div className="flex gap-2 flex-wrap items-center">
                {[
                  { name: 'Orange Money', logo: '/logos/orange.jpeg' },
                  { name: 'MTN MoMo',    logo: '/logos/mtn.jpeg' },
                  { name: 'Wave',         logo: '/logos/wave.jpeg' },
                  { name: 'Flooz',        logo: '/logos/flooz.jpeg' },
                  { name: 'Djamo',        logo: '/logos/djamo.jpeg' },
                ].map(op => (
                  <img key={op.name} src={op.logo} alt={op.name}
                    title={op.name} className="w-9 h-9 rounded-lg ring-1 ring-white/10 transition-transform hover:scale-110" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid rgba(212,160,23,0.1)' }}>
          <p className="text-xs" style={{ color: 'rgba(245,230,200,0.35)', fontFamily: 'var(--font-nunito)' }}>
            © 2026 HOMECI — Côte d'Ivoire. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <a href="/cgv" className="text-xs transition-colors hover:opacity-100"
              style={{ color: 'rgba(245,230,200,0.35)', fontFamily: 'var(--font-nunito)' }}>
              Conditions d'utilisation
            </a>
            <button onClick={() => setShowPrivacy(true)}
              className="text-xs transition-colors hover:opacity-100 cursor-pointer bg-transparent border-none"
              style={{ color: 'rgba(245,230,200,0.35)', fontFamily: 'var(--font-nunito)' }}>
              Politique de confidentialité
            </button>
            <a href="#" className="text-xs transition-colors hover:opacity-100"
              style={{ color: 'rgba(245,230,200,0.35)', fontFamily: 'var(--font-nunito)' }}>
              Mentions légales
            </a>
          </div>
        </div>
      </div>
      {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
    </footer>
  );
}
