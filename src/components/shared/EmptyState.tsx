import type { ReactNode } from 'react';
import { HColors, HAlpha } from '../../styles/homeci-tokens';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export default function EmptyState({ icon, title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div
      className="rounded-3xl p-14 sm:p-20 text-center"
      style={{
        background: HColors.white,
        border: `1px solid ${HAlpha.gold15}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      }}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: HAlpha.gold05 }}
      >
        <span style={{ color: HAlpha.gold35 }}>{icon}</span>
      </div>
      <h3
        className="text-xl font-bold mb-2"
        style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}
      >
        {title}
      </h3>
      <p
        className="text-sm max-w-xs mx-auto opacity-60 mb-8"
        style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}
      >
        {description}
      </p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest inline-flex items-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-md"
          style={{
            background: 'linear-gradient(135deg,#FF6B00,#D4A017)',
            color: '#FFFFFF',
            fontFamily: 'var(--font-nunito)',
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
