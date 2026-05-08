interface KenteLineProps {
  height?: number;
  className?: string;
}

export function KenteLine({ height = 3, className = '' }: KenteLineProps) {
  return (
    <div
      className={`w-full ${className}`}
      style={{
        height,
        background: 'repeating-linear-gradient(90deg,#FF6B00 0,#FF6B00 14px,#009E49 14px,#009E49 28px,#FFFFFF 28px,#FFFFFF 42px,#D4A017 42px,#D4A017 56px)',
      }}
      role="presentation"
      aria-hidden="true"
    />
  );
}

export default KenteLine;
