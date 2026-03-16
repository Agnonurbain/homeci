/**
 * Emblème HOMECI — utilise le vrai logo (écusson éléphant + maison + devise).
 * 4 variantes : full, header, watermark, favicon.
 */
interface HomeCIEmblemProps {
  variant?: 'full' | 'header' | 'watermark' | 'favicon';
  className?: string;
}

export function HomeCIEmblem({ variant = 'full', className = '' }: HomeCIEmblemProps) {
  if (variant === 'watermark') {
    return (
      <div className={`opacity-[0.05] pointer-events-none select-none ${className}`}>
        <img src="/logo_homeci.jpg" alt="" aria-hidden="true"
          className="w-full h-full object-contain" draggable={false} />
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <img src="/logo_homeci.jpg" alt="HOMECI"
          className="h-14 w-auto rounded-md" draggable={false} />
        <span className="font-bold text-xl tracking-widest hidden sm:inline"
          style={{ color: '#D4A017', fontFamily: 'var(--font-cormorant)', letterSpacing: '0.15em' }}>
          HOMECI
        </span>
      </div>
    );
  }

  if (variant === 'favicon') {
    return (
      <div className={className}>
        <img src="/logo_homeci.jpg" alt="HOMECI"
          className="w-full h-full object-contain rounded-full" draggable={false} />
      </div>
    );
  }

  // Full — modals, footer, pages
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img src="/logo_homeci.jpg" alt="HOMECI — L'immobilier ivoirien certifié"
        className="w-full h-auto max-w-[200px] drop-shadow-lg rounded-lg" draggable={false} />
    </div>
  );
}

export default HomeCIEmblem;
