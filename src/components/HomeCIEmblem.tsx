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
      <a href="/" className={`group flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 ${className}`}>
        <div className="relative h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 bg-white/5 rounded-xl p-1 shadow-lg border border-white/10 overflow-hidden">
          <img src="/logo_homeci.jpg" alt="HOMECI"
            className="w-full h-full object-contain group-hover:drop-shadow-lg transition-all" draggable={false} />
        </div>
        <span className="font-bold text-xl tracking-widest hidden sm:inline transition-colors group-hover:text-amber-400"
          style={{ color: '#D4A017', fontFamily: 'var(--font-cormorant)', letterSpacing: '0.15em' }}>
          HOMECI
        </span>
      </a>
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
    <a href="/" className={`group flex flex-col items-center transition-all hover:-translate-y-1 ${className}`}>
      <div className="relative bg-white/5 p-2 rounded-2xl shadow-xl border border-white/10 overflow-hidden">
        <img src="/logo_homeci.jpg" alt="HOMECI — L'immobilier ivoirien certifié"
          className="w-full h-auto max-w-[200px] sm:max-w-[240px] drop-shadow-xl rounded-xl transition-all group-hover:scale-105 object-contain" draggable={false} />
      </div>
    </a>
  );
}

export default HomeCIEmblem;
