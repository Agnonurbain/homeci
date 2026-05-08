import { HColors, HAlpha } from '../../styles/homeci-tokens';

export default function RealTimeIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
      style={{
        background: HAlpha.gold10,
        border: `1px solid ${HAlpha.gold25}`,
      }}
    >
      <div
        className="w-[7px] h-[7px] rounded-full animate-pulse"
        style={{ background: HColors.vertCI }}
      />
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: HColors.gold,
          fontFamily: 'var(--font-nunito)',
        }}
      >
        Temps réel
      </span>
    </div>
  );
}
