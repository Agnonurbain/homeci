import { Building2, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { HColors, HAlpha } from '../styles/homeci-tokens';

export function Footer() {
  return (
    <footer style={{ background:'#0A1A0E', borderTop:'1px solid rgba(212,160,23,0.15)' }}>

      {/* Kente top stripe */}
      <div className="w-full flex" style={{ height:6 }}>
        {[HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',
          HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',
          HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D',HColors.gold,HColors.green,HColors.terracotta,'#7B1D1D'].map((c,i) => (
          <div key={i} style={{ flex:1, backgroundColor:c }} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background:HColors.gold }}>
                <Building2 className="w-4 h-4" style={{ color:HColors.night }} />
              </div>
              <span className="text-xl font-bold tracking-widest"
                style={{ color:HColors.cream, fontFamily:'var(--font-cormorant)', letterSpacing:'0.18em' }}>
                HOMECI
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6"
              style={{ color:HAlpha.cream50, fontFamily:'var(--font-nunito)' }}>
              La première plateforme immobilière en Côte d'Ivoire avec vérification notaire garantie.
            </p>
            <div className="flex gap-2.5">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#"
                  className="p-2 rounded-lg transition-all hover:scale-110"
                  style={{ background:HAlpha.gold08, border:'1px solid rgba(212,160,23,0.15)' }}>
                  <Icon className="w-4 h-4" style={{ color:'rgba(212,160,23,0.7)' }} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-5 text-sm tracking-widest uppercase"
              style={{ color:HColors.gold, fontFamily:'var(--font-nunito)' }}>Navigation</h3>
            <ul className="space-y-3">
              {['Rechercher','Biens à louer','Biens à vendre','Blog'].map(l => (
                <li key={l}>
                  <a href="#" className="text-sm transition-colors hover:opacity-100"
                    style={{ color:HAlpha.cream50, fontFamily:'var(--font-nunito)' }}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Villes */}
          <div>
            <h3 className="font-semibold mb-5 text-sm tracking-widest uppercase"
              style={{ color:HColors.gold, fontFamily:'var(--font-nunito)' }}>Villes</h3>
            <ul className="space-y-3">
              {['Abidjan','Bouaké','Yamoussoukro','San Pedro','Korhogo'].map(v => (
                <li key={v}>
                  <a href="#" className="text-sm transition-colors hover:opacity-100"
                    style={{ color:HAlpha.cream50, fontFamily:'var(--font-nunito)' }}>{v}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-5 text-sm tracking-widest uppercase"
              style={{ color:HColors.gold, fontFamily:'var(--font-nunito)' }}>Contact</h3>
            <ul className="space-y-4">
              {[
                { Icon: MapPin, text: "Abidjan, Cocody Riviera, Côte d'Ivoire" },
                { Icon: Phone,  text: '+225 07 00 00 00 00' },
                { Icon: Mail,   text: 'contact@homeci.ci' },
              ].map(({ Icon, text }, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color:HColors.terracotta }} />
                  <span className="text-sm" style={{ color:'rgba(245,230,200,0.55)', fontFamily:'var(--font-nunito)' }}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderTop:'1px solid rgba(212,160,23,0.1)' }}>
          <p className="text-xs" style={{ color:'rgba(245,230,200,0.35)', fontFamily:'var(--font-nunito)' }}>
            2026 HOMECI. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            {["Conditions d'utilisation","Politique de confidentialité","Mentions légales"].map(l => (
              <a key={l} href="#" className="text-xs transition-colors hover:opacity-100"
                style={{ color:'rgba(245,230,200,0.35)', fontFamily:'var(--font-nunito)' }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
