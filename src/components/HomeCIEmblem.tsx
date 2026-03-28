/**
 * Emblème HOMECI — 🐘 + typographie.
 * 4 variantes : full, header, watermark, favicon.
 */
interface HomeCIEmblemProps {
  variant?: 'full' | 'header' | 'watermark' | 'favicon';
  className?: string;
}

export function HomeCIEmblem({ variant = 'full', className = '' }: HomeCIEmblemProps) {
  if (variant === 'watermark') {
    return (
      <div className={`opacity-[0.05] pointer-events-none select-none flex items-center justify-center ${className}`}>
        <span style={{ fontSize: '12rem', fontFamily: 'var(--font-cormorant)', color: '#D4A017', letterSpacing: '0.15em' }}>
          🐘HOMECI
        </span>
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <a href="/" className={`group flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 ${className}`}>
        <span className="text-3xl sm:text-4xl" role="img" aria-label="éléphant">🐘</span>
        <span className="font-bold text-xl tracking-widest hidden sm:inline transition-colors group-hover:text-amber-400"
          style={{ color: '#D4A017', fontFamily: 'var(--font-cormorant)', letterSpacing: '0.15em' }}>
          HOMECI
        </span>
      </a>
    );
  }

  if (variant === 'favicon') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <span className="text-2xl" role="img" aria-label="éléphant">🐘</span>
      </div>
    );
  }

  // Full — modals, footer, pages
  return (
    <a href="/" className={`group flex items-center gap-3 transition-all hover:-translate-y-1 ${className}`}>
      <span className="text-5xl sm:text-6xl" role="img" aria-label="éléphant">🐘</span>
      <span className="font-bold text-2xl sm:text-3xl tracking-widest transition-colors group-hover:text-amber-400"
        style={{ color: '#D4A017', fontFamily: 'var(--font-cormorant)', letterSpacing: '0.15em' }}>
        HOMECI
      </span>
    </a>
  );
}

export default HomeCIEmblem;
