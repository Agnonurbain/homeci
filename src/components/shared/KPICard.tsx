import type { ReactNode } from 'react';
import { HColors, HAlpha } from '../../styles/homeci-tokens';

interface KPICardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  color?: string;
}

export default function KPICard({ icon, label, value, color = HColors.gold }: KPICardProps) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 text-center transition-all hover:-translate-y-0.5"
      style={{
        background: HColors.white,
        border: `1px solid ${HAlpha.gold15}`,
        boxShadow: '0 2px 10px rgba(26,14,0,0.05)',
      }}
    >
      <div
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div
        className="text-xl sm:text-2xl font-black"
        style={{ color, fontFamily: 'var(--font-cormorant)' }}
      >
        {value}
      </div>
      <div
        className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide mt-0.5 truncate"
        style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}
      >
        {label}
      </div>
    </div>
  );
}
