import { KENTE_COLORS } from '../../styles/homeci-tokens';

interface KenteLineProps {
  height?: number;
  className?: string;
}

/**
 * Bande Kente horizontale — signature visuelle HOMECI.
 * Utilisée en haut des modals, headers et bannières.
 */
export function KenteLine({ height = 4, className = '' }: KenteLineProps) {
  return (
    <div
      className={`w-full flex ${className}`}
      style={{ height }}
      role="presentation"
      aria-hidden="true"
    >
      {KENTE_COLORS.map((color, i) => (
        <div key={i} style={{ flex: 1, backgroundColor: color }} />
      ))}
    </div>
  );
}

export default KenteLine;
