import type { ReactNode } from 'react';
import { HColors } from '../../styles/homeci-tokens';

interface StatBadgeProps {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}

export default function StatBadge({ icon, label, value, color, onClick }: StatBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 transition-all hover:scale-[1.04]"
      style={{
        padding: '6px 12px',
        borderRadius: 10,
        border: `1px solid ${color}30`,
        background: `${color}12`,
        cursor: 'pointer',
      }}
    >
      <span style={{ color, fontSize: 13, lineHeight: 1 }}>{icon}</span>
      <span style={{ color, fontSize: 11, fontWeight: 900 }}>{value}</span>
      <span style={{ color: HColors.cream, fontSize: 10, fontWeight: 600, opacity: 0.5 }}>{label}</span>
    </button>
  );
}
