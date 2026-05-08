import { HColors, HAlpha } from '../../styles/homeci-tokens';

interface NotaireSidebarProps {
  stats: { disponible: number; enCours: number; pret: number; certifie: number };
  onCreateDelegation?: () => void;
}

const PIPELINE_ROWS = [
  { label: 'Disponibles', key: 'disponible' as const, color: '#FF6B00' },
  { label: 'En cours', key: 'enCours' as const, color: '#D4A017' },
  { label: 'Prêts', key: 'pret' as const, color: '#1A3A6B' },
  { label: 'Certifiés', key: 'certifie' as const, color: '#009E49' },
];

const ACTIVITY_ITEMS = [
  { time: 'Il y a 12 min', action: 'Document validé', detail: 'Titre Foncier — Villa Cocody', color: '#009E49', dot: '✓' },
  { time: 'Il y a 1h', action: 'Prise en charge', detail: 'Terrain Yopougon 800m²', color: '#FF6B00', dot: '→' },
  { time: 'Il y a 2h', action: 'Certification', detail: 'Appartement Deux Plateaux — certifié', color: '#D4A017', dot: '★' },
  { time: 'Il y a 3h', action: 'Document refusé', detail: 'Plan cadastral — Maison Marcory', color: '#8B1D1D', dot: '✕' },
  { time: 'Hier 16:42', action: 'Certification', detail: 'Villa Riviera Golf — certifiée', color: '#D4A017', dot: '★' },
];

export default function NotaireSidebar({ stats, onCreateDelegation }: NotaireSidebarProps) {
  const maxVal = Math.max(stats.disponible, stats.enCours, stats.pret, stats.certifie, 1);

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Dashboard */}
      <div style={{ borderRadius: 18, background: '#fff', border: `1px solid ${HAlpha.gold15}`, boxShadow: '0 2px 16px rgba(26,14,0,0.05)' }}>
        <div style={{ padding: '14px 16px 10px' }}>
          <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.05rem', fontWeight: 700, color: HColors.darkBrown }}>
            Tableau de bord
          </h3>
          <p style={{ fontSize: 10, color: HColors.brown }}>
            {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="grid grid-cols-2" style={{ gap: 1, background: `${HAlpha.gold10}` }}>
          <KPICell icon="🏛️" value={stats.certifie} label="Certifiés ce mois" color="#009E49" />
          <KPICell icon="📈" value="87%" label="Taux approbation" color="#1A3A6B" />
          <KPICell icon="⏳" value={stats.enCours} label="En attente" color="#D4A017" />
          <KPICell icon="⚡" value={stats.disponible} label="Dossiers urgents" color="#8B1D1D" />
        </div>
      </div>

      {/* Pipeline Certification */}
      <div style={{ borderRadius: 18, background: '#fff', border: `1px solid ${HAlpha.gold15}`, padding: '14px 16px' }}>
        <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.05rem', fontWeight: 700, color: HColors.darkBrown, marginBottom: 14 }}>
          Pipeline Certification
        </h3>
        {PIPELINE_ROWS.map(row => {
          const val = stats[row.key];
          const pct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
          return (
            <div key={row.key} style={{ marginBottom: 12 }}>
              <div className="flex justify-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: HColors.brown }}>{row.label}</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: row.color }}>{val}</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: `${row.color}12`, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: row.color, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Feed */}
      <div style={{ borderRadius: 18, background: '#fff', border: `1px solid ${HAlpha.gold15}`, padding: '14px 16px', flex: 1 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.05rem', fontWeight: 700, color: HColors.darkBrown }}>
            Activité récente
          </h3>
          <span style={{ fontSize: 10, color: HColors.orangeCI, fontWeight: 700, cursor: 'pointer' }}>
            Voir tout →
          </span>
        </div>
        {ACTIVITY_ITEMS.map((item, i) => (
          <div key={i} className="flex relative" style={{ gap: 12, marginBottom: 14 }}>
            {i < ACTIVITY_ITEMS.length - 1 && (
              <div className="absolute" style={{ left: 14, top: 28, width: 1, bottom: -14, background: `linear-gradient(to bottom,${item.color}40,transparent)` }} />
            )}
            <div className="flex items-center justify-center shrink-0"
              style={{ width: 28, height: 28, borderRadius: 99, background: `${item.color}18`, border: `1.5px solid ${item.color}40`, fontSize: 11, fontWeight: 900, color: item.color }}>
              {item.dot}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, fontWeight: 700, color: HColors.brown }}>{item.action}</span>
                <span style={{ fontSize: 9, color: HColors.brown }}>{item.time}</span>
              </div>
              <p className="truncate" style={{ fontSize: 11, color: HColors.brown }}>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Delegation CTA */}
      <div className="text-center" style={{ borderRadius: 18, padding: 16, background: 'linear-gradient(135deg,#0A3D1F,#1B5E3A)', border: `1px solid ${HAlpha.gold25}` }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🤝</div>
        <h4 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 700, color: HColors.cream }}>
          Délégation de pouvoir
        </h4>
        <p style={{ fontSize: 10, color: 'rgba(245,230,200,0.5)', marginBottom: 10 }}>
          Partagez un accès temporaire à un collaborateur
        </p>
        <button onClick={onCreateDelegation}
          className="w-full transition-all hover:opacity-90"
          style={{ padding: 9, borderRadius: 10, background: 'rgba(212,160,23,0.20)', border: `1px solid rgba(212,160,23,0.35)`, color: '#D4A017', fontWeight: 800, fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer' }}>
          Créer un lien de délégation
        </button>
      </div>
    </div>
  );
}

function KPICell({ icon, value, label, color }: { icon: string; value: number | string; label: string; color: string }) {
  return (
    <div className="text-center" style={{ padding: '14px 12px', background: '#fff' }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: HColors.brown, marginTop: 3, letterSpacing: '0.04em' }}>
        {label}
      </div>
    </div>
  );
}
