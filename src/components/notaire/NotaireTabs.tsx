import { useNavigate } from 'react-router-dom';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import { BarChart3 } from 'lucide-react';
import { useTabNavigation } from '../../hooks/useTabNavigation';

interface Tab {
  id: string;
  label: string;
  count?: number;
  accent: string;
  bg: string;
  bd: string;
  icon?: any;
}

export function NotaireTabs({ activeTab, stats }: { activeTab: string, stats: any }) {
  const navigate = useNavigate();
  const tabIds = ['disponible', 'en_cours', 'pret', 'certifie', 'stats'];
  const { containerRef, handleKeyDown } = useTabNavigation(tabIds, activeTab, (id) => navigate(`/dashboard/${id}`));

  const tabs: Tab[] = [
    { id: 'disponible', label: 'Disponibles', count: stats.disponible, accent: HColors.orangeCI, bg: HAlpha.orange10, bd: HAlpha.orange25 },
    { id: 'en_cours', label: 'En cours', count: stats.enCours, accent: HColors.gold, bg: HAlpha.gold10, bd: HAlpha.gold25 },
    { id: 'pret', label: 'Prêts à certifier', count: stats.pret, accent: HColors.navy, bg: HAlpha.navy08, bd: HAlpha.navy20 },
    { id: 'certifie', label: 'Certifiés', count: stats.certifie, accent: HColors.vertCI, bg: HAlpha.vertCI10, bd: HAlpha.vertCI25 },
    { id: 'stats', label: 'Statistiques', count: undefined, accent: HColors.bordeaux, bg: HAlpha.bord10, bd: HAlpha.bord20, icon: BarChart3 },
  ];

  return (
    <nav ref={containerRef as React.RefObject<HTMLElement>} role="tablist" onKeyDown={handleKeyDown} className="flex gap-1 overflow-x-auto homeci-tabs-scroll pb-2 mt-4">
      {tabs.map(tab => (
        <button key={tab.id} data-tab-id={tab.id} onClick={() => navigate(`/dashboard/${tab.id}`)}
          role="tab" aria-selected={activeTab === tab.id} tabIndex={activeTab === tab.id ? 0 : -1}
          className="flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap"
          style={activeTab === tab.id
            ? { borderColor: HColors.gold, color: HColors.gold, fontFamily: 'var(--font-nunito)' }
            : { borderColor: 'transparent', color: HAlpha.cream45, fontFamily: 'var(--font-nunito)' }}>
          {tab.icon && <tab.icon className="w-4 h-4 shrink-0" style={{ color: tab.accent }} />}
          {tab.label}
          {tab.count !== undefined && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={activeTab === tab.id
                ? { background: tab.bg, color: tab.accent, border: `1px solid ${tab.bd}` }
                : { background: HAlpha.gold08, color: HAlpha.cream50 }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
