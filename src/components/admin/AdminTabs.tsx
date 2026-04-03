import React from 'react';
import { 
  Users, Home, FileCheck, AlertCircle, TrendingUp,
  Activity, UserCog, Award, Flag, Star, CalendarCheck, 
  UserSearch, FileText, Megaphone 
} from 'lucide-react';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import type { AdminTab, AdminStats } from '../../hooks/useAdminDashboard';

interface AdminTabsProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  stats: AdminStats;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, setActiveTab, stats }) => {
  const TABS = [
    { id: 'overview', icon: TrendingUp, label: 'Vue d\'ensemble', count: undefined },
    { id: 'users', icon: Users, label: 'Utilisateurs', count: stats.total_users },
    { id: 'notaires', icon: Award, label: 'Codes Notaires', count: undefined },
    { id: 'user-search', icon: UserSearch, label: 'Recherche & Suspension', count: undefined },
    { id: 'properties', icon: Home, label: 'Biens', count: stats.total_properties },
    { id: 'verification', icon: FileCheck, label: 'Modération', count: stats.pending_properties || undefined },
    { id: 'reports', icon: Flag, label: 'Signalements', count: undefined },
    { id: 'visits', icon: CalendarCheck, label: 'Visites', count: undefined },
    { id: 'surveys', icon: Star, label: 'Satisfaction', count: undefined },
    { id: 'cgv', icon: FileText, label: 'Docs Légaux', count: undefined },
    { id: 'ads', icon: Megaphone, label: 'Publicités', count: undefined },
    { id: 'security', icon: Activity, label: 'Sécurité', count: undefined },
    { id: 'admin-management', icon: UserCog, label: 'Admins', count: undefined },
  ] as const;

  return (
    <nav className="flex space-x-1 overflow-x-auto homeci-tabs-scroll pb-2">
      {TABS.map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id as AdminTab)}
          aria-label={tab.label}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          className="flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap hover:opacity-80"
          style={activeTab === tab.id
            ? { borderColor: HColors.gold, color: HColors.gold, fontFamily: 'var(--font-nunito)' }
            : { borderColor: 'transparent', color: HAlpha.cream45, fontFamily: 'var(--font-nunito)' }}>
          <tab.icon className="w-4 h-4" />
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold transition-all"
              style={tab.id === 'verification'
                ? { background: HAlpha.bord20, color: HColors.cream }
                : { background: HAlpha.gold15, color: HColors.gold }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};
