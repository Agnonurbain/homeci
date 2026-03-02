import { useState, useRef, useEffect } from 'react';
import { HColors, HAlpha } from '../styles/homeci-tokens';

interface Props {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  /** Contexte : 'light' = sur fond crème, 'dark' = sur fond nuit */
  variant?: 'light' | 'dark';
}

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function ScrollColumn({ items, selected, onSelect, variant }: {
  items: string[]; selected: string;
  onSelect: (v: string) => void; variant: 'light' | 'dark';
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_H = 40;

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0 && containerRef.current)
      containerRef.current.scrollTop = idx * ITEM_H;
  }, [selected, items]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const idx = Math.round(containerRef.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (items[clamped] !== selected) onSelect(items[clamped]);
  };

  const hlBg     = variant === 'dark' ? 'rgba(212,160,23,0.15)' : HAlpha.gold10;
  const hlBorder = HAlpha.gold40;

  return (
    <div className="relative w-14">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 z-10 rounded-lg"
        style={{ background: hlBg, border: `1px solid ${hlBorder}` }} />
      <div ref={containerRef} onScroll={handleScroll}
        className="h-[120px] overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth:'none' }}>
        <div style={{ height: 40 }} />
        {items.map(item => (
          <div key={item} onClick={() => onSelect(item)}
            className="snap-center flex items-center justify-center h-10 text-sm cursor-pointer select-none transition-all"
            style={{
              fontFamily: 'var(--font-nunito)',
              fontWeight: item === selected ? 700 : 400,
              fontSize:   item === selected ? '1.05rem' : '0.875rem',
              color:      item === selected
                ? HColors.gold
                : variant === 'dark'
                  ? 'rgba(245,230,200,0.35)'
                  : 'rgba(122,85,0,0.35)',
            }}>
            {item}
          </div>
        ))}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

export default function ScrollTimePicker({ value, onChange, className = '', variant = 'light' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [hh, mm] = value ? value.split(':') : ['08', '00'];
  const setHour   = (h: string) => onChange(`${h}:${mm || '00'}`);
  const setMinute = (m: string) => onChange(`${hh || '08'}:${m}`);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const btnStyle: React.CSSProperties = variant === 'dark'
    ? { background:'rgba(13,31,18,0.7)', border:'1px solid rgba(212,160,23,0.2)', color:HColors.cream, fontFamily:'var(--font-nunito)' }
    : { background:'rgba(255,255,255,0.75)', border:'1px solid rgba(212,160,23,0.25)', color:HColors.darkBrown, fontFamily:'var(--font-nunito)' };

  const dropStyle: React.CSSProperties = variant === 'dark'
    ? { background:HColors.night, border:'1px solid rgba(212,160,23,0.25)', boxShadow:'0 16px 40px rgba(0,0,0,0.5)' }
    : { background:'#fff', border:'1px solid rgba(212,160,23,0.2)', boxShadow:'0 8px 30px rgba(26,14,0,0.1)' };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2.5 rounded-xl text-sm text-left flex items-center justify-between outline-none"
        style={btnStyle}>
        <span style={{ fontWeight: value ? 600 : 400, opacity: value ? 1 : 0.45 }}>
          {value || 'Choisir'}
        </span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ color:'rgba(212,160,23,0.6)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 6v6l4 2M12 2a10 10 0 110 20A10 10 0 0112 2z"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 p-3 rounded-2xl" style={{ ...dropStyle, width: 160 }}>
          <p className="text-center text-xs font-semibold mb-2 uppercase tracking-wider"
            style={{ color:'rgba(212,160,23,0.6)', fontFamily:'var(--font-nunito)' }}>
            Faire défiler
          </p>
          <div className="flex items-center justify-center gap-1">
            <ScrollColumn items={HOURS}   selected={hh || '08'} onSelect={setHour}   variant={variant} />
            <span className="text-xl font-bold pb-1" style={{ color: variant === 'dark' ? HColors.gold : HColors.terracotta }}>:</span>
            <ScrollColumn items={MINUTES} selected={mm || '00'} onSelect={setMinute} variant={variant} />
          </div>
          <button onClick={() => setOpen(false)}
            className="mt-2.5 w-full py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#D4A017,#C07C3E)', color:HColors.night, fontFamily:'var(--font-nunito)' }}>
            Confirmer
          </button>
        </div>
      )}
    </div>
  );
}
