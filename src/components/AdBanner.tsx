/**
 * Bannière publicitaire partenaire — s'intègre au design HomeCI.
 * Récupère une bannière ciblée via adService et gère les impressions/clics.
 */
import { useState, useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { adService } from '../services/adService';
import type { AdBanner as AdBannerType, AdContext } from '../types/ad';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface AdBannerProps {
  context?: AdContext;
  className?: string;
}

export default function AdBanner({ context, className = '' }: AdBannerProps) {
  const [banner, setBanner] = useState<AdBannerType | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    adService.getActiveBanners(context).then(banners => {
      if (banners.length > 0) {
        // Sélectionner une bannière aléatoire parmi celles éligibles
        const picked = banners[Math.floor(Math.random() * banners.length)];
        setBanner(picked);
        // Compteur d'impressions
        if (picked.id) adService.trackImpression(picked.id);
      }
    });
  }, [context?.city, context?.transactionType, context?.propertyType]);

  if (!banner || dismissed) return null;

  const handleClick = () => {
    if (banner.id) adService.trackClick(banner.id);
    window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden group cursor-pointer transition-all hover:-translate-y-0.5 ${className}`}
      style={{
        background: HColors.white,
        border: `1px solid ${HAlpha.gold20}`,
        boxShadow: '0 2px 16px rgba(26,14,0,0.08)',
      }}
      onClick={handleClick}>

      {/* Badge Partenaire */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm"
        style={{ background: 'rgba(212,160,23,0.85)', color: '#FFFFFF' }}>
        <ExternalLink className="w-3 h-3" />
        <span className="text-[10px] font-bold uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-nunito)' }}>Partenaire</span>
      </div>

      {/* Bouton fermer */}
      <button
        onClick={e => { e.stopPropagation(); setDismissed(true); }}
        className="absolute top-3 right-3 z-10 p-1 rounded-full transition-all hover:opacity-80"
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
        <X className="w-3.5 h-3.5 text-white" />
      </button>

      {/* Image */}
      <div className="relative aspect-[16/7] overflow-hidden bg-[rgba(212,160,23,0.08)]">
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          draggable={false}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />

        {/* Texte overlay */}
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-sm font-bold text-white mb-0.5"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
            {banner.title}
          </p>
          <p className="text-xs text-white/70"
            style={{ fontFamily: 'var(--font-nunito)' }}>
            {banner.advertiserName} • Annonce sponsorisée
          </p>
        </div>
      </div>
    </div>
  );
}
