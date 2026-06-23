import { Link } from 'react-router-dom';

interface HomeCIEmblemProps {
  variant?: 'full' | 'header' | 'watermark' | 'favicon';
  className?: string;
  to?: string;
}

function ElephantIcon({ size = 32, color = '#D4A017' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="HOMECI">
      <path d="M52 20c0-8.8-7.2-16-16-16h-8c-8.8 0-16 7.2-16 16v4c-4.4 0-8 3.6-8 8s3.6 8 8 8h2l2 16h8V44h20v12h8l2-16h2c4.4 0 8-3.6 8-8s-3.6-8-8-8v-4z" fill={color} />
      <circle cx="24" cy="22" r="3" fill="#0A3D1F" />
      <circle cx="40" cy="22" r="3" fill="#0A3D1F" />
      <path d="M14 32c0 2-1 6-3 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M50 32c0 2 1 6 3 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M28 30c0 3 2 6 4 8 2-2 4-5 4-8" stroke="#0A3D1F" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HomeCIEmblem({ variant = 'full', className = '', to = '/' }: HomeCIEmblemProps) {
  if (variant === 'watermark') {
    return (
      <div className={`opacity-[0.05] pointer-events-none select-none flex items-center justify-center ${className}`}>
        <ElephantIcon size={180} />
        <span style={{ fontSize: '8rem', fontFamily: 'var(--font-cormorant)', color: '#D4A017', letterSpacing: '0.15em' }}>
          HOMECI
        </span>
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <Link to={to} className={`group flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95 ${className}`}>
        <ElephantIcon size={36} />
        <span className="font-bold text-xl tracking-widest hidden sm:inline transition-colors group-hover:text-amber-400"
          style={{ color: '#D4A017', fontFamily: 'var(--font-cormorant)', letterSpacing: '0.15em' }}>
          HOMECI
        </span>
      </Link>
    );
  }

  if (variant === 'favicon') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <ElephantIcon size={28} />
      </div>
    );
  }

  return (
    <Link to={to} className={`group flex items-center gap-3 transition-all hover:-translate-y-1 ${className}`}>
      <ElephantIcon size={52} />
      <span className="font-bold text-2xl sm:text-3xl tracking-widest transition-colors group-hover:text-amber-400"
        style={{ color: '#D4A017', fontFamily: 'var(--font-cormorant)', letterSpacing: '0.15em' }}>
        HOMECI
      </span>
    </Link>
  );
}

export default HomeCIEmblem;
