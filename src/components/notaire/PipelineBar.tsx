import { useNavigate } from 'react-router-dom';

interface PipelineStage {
  id: string;
  label: string;
  color: string;
  icon: string;
  desc: string;
}

interface PipelineBarProps {
  activeTab: string;
  stats: { disponible: number; enCours: number; pret: number; certifie: number };
}

const STAGES: PipelineStage[] = [
  { id: 'disponible', label: 'Disponibles', color: '#FF6B00', icon: '📋', desc: 'À prendre en charge' },
  { id: 'en_cours', label: 'En cours', color: '#D4A017', icon: '🔍', desc: 'Vérification docs' },
  { id: 'pret', label: 'Prêts', color: '#1A3A6B', icon: '✅', desc: 'À certifier' },
  { id: 'certifie', label: 'Certifiés', color: '#009E49', icon: '🏛️', desc: 'Ce mois' },
];

export default function PipelineBar({ activeTab, stats }: PipelineBarProps) {
  const navigate = useNavigate();
  const counts = [stats.disponible, stats.enCours, stats.pret, stats.certifie];

  return (
    <div className="grid grid-cols-4" style={{ gap: 0, margin: '20px 0 0' }}>
      {STAGES.map((stage, i) => {
        const isActive = activeTab === stage.id;
        const count = counts[i];
        return (
          <button
            key={stage.id}
            onClick={() => navigate(`/dashboard/${stage.id}`)}
            className="relative flex flex-col items-center py-3 px-2 transition-all"
            style={{
              background: isActive ? `${stage.color}18` : 'transparent',
              borderBottom: `2.5px solid ${isActive ? stage.color : 'transparent'}`,
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: isActive ? `${stage.color}25` : 'rgba(255,255,255,0.06)',
                border: isActive ? `1.5px solid ${stage.color}50` : '1px solid rgba(255,255,255,0.08)',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>{stage.icon}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, fontWeight: 900, color: isActive ? stage.color : 'rgba(245,230,200,0.8)', lineHeight: 1, marginBottom: 2 }}>
              {count}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: isActive ? stage.color : 'rgba(245,230,200,0.8)', fontFamily: 'var(--font-nunito)' }}>
              {stage.label}
            </span>
            <span className="hidden sm:block" style={{ fontSize: 9, color: 'rgba(245,230,200,0.35)', fontFamily: 'var(--font-nunito)', marginTop: 2 }}>
              {stage.desc}
            </span>
            {i < 3 && (
              <span className="absolute top-1/2 -translate-y-1/2 z-[2]"
                style={{ right: -10, color: 'rgba(212,160,23,0.4)', fontSize: 16, fontWeight: 900 }}>
                ›
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
