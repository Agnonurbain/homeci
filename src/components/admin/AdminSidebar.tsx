import { useState } from 'react';
import {
  Users, Home, FileCheck, TrendingUp,
  Activity, Award, Flag, Star, CalendarCheck,
  UserSearch, FileText, Megaphone, Shield, FileDown, BarChart3,
  ChevronLeft, ChevronRight, Crown, Landmark,
} from 'lucide-react';
import { KenteLine } from '../ui/KenteLine';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import type { AdminTab, AdminStats } from '../../hooks/useAdminDashboard';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  stats: AdminStats;
  adminName: string;
  adminEmail?: string;
}

const TABS = [
  { id: 'overview', icon: TrendingUp, label: 'Vue d\'ensemble' },
  { id: 'users', icon: Users, label: 'Utilisateurs' },
  { id: 'notaires', icon: Award, label: 'Codes Notaires' },
  { id: 'user-search', icon: UserSearch, label: 'Recherche' },
  { id: 'properties', icon: Home, label: 'Biens' },
  { id: 'verification', icon: FileCheck, label: 'Modération' },
  { id: 'reports', icon: Flag, label: 'Signalements' },
  { id: 'visits', icon: CalendarCheck, label: 'Visites' },
  { id: 'surveys', icon: Star, label: 'Satisfaction' },
  { id: 'cgv', icon: FileText, label: 'Docs Légaux' },
  { id: 'ads', icon: Megaphone, label: 'Publicités' },
  { id: 'security', icon: Activity, label: 'Sécurité' },
  { id: 'admin-management', icon: Crown, label: 'Admins' },
  { id: 'audit', icon: Shield, label: 'Journal d\'Audit' },
  { id: 'exports', icon: FileDown, label: 'Exports' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
] as const;

function getTabCount(id: string, stats: AdminStats): number | undefined {
  switch (id) {
    case 'users': return stats.total_users || undefined;
    case 'properties': return stats.total_properties || undefined;
    case 'verification': return stats.pending_properties || undefined;
    default: return undefined;
  }
}

export default function AdminSidebar({ activeTab, setActiveTab, stats, adminName, adminEmail }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="sticky top-0 h-screen flex flex-col shrink-0 transition-all duration-200 overflow-hidden"
      style={{
        width: collapsed ? 60 : 210,
        background: HColors.sidebar,
        borderRight: `1px solid ${HAlpha.gold12}`,
      }}
    >
      <KenteLine />

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 pt-4 pb-3" style={{ borderBottom: `1px solid ${HAlpha.gold10}` }}>
        <div
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: HAlpha.gold10, border: `1px solid ${HAlpha.gold25}` }}
        >
          <Landmark className="w-5 h-5" style={{ color: HColors.gold }} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div style={{ fontFamily: 'var(--font-cormorant)', color: HColors.gold, fontSize: 15, fontWeight: 700, letterSpacing: '0.1em' }}>
              HOMECI
            </div>
            <div style={{ fontSize: 8, color: 'rgba(245,230,200,0.50)', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>
              Administration
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2.5 px-1.5 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const count = getTabCount(tab.id, stats);
          const isUrgent = (tab.id === 'verification' || tab.id === 'reports') && (count ?? 0) > 0;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`w-full flex items-center gap-2 rounded-[9px] transition-all relative ${!isActive ? 'hover:bg-white/5' : ''}`}
              style={{
                padding: 8,
                background: isActive ? HAlpha.gold15 : 'transparent',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              title={collapsed ? tab.label : undefined}
            >
              <tab.icon className="w-4 h-4 shrink-0" style={{ color: isActive ? HColors.gold : 'rgba(245,230,200,0.45)' }} />
              {!collapsed && (
                <>
                  <span style={{
                    fontSize: 11,
                    fontWeight: isActive ? 800 : 500,
                    color: isActive ? HColors.gold : 'rgba(245,230,200,0.50)',
                    fontFamily: 'var(--font-nunito)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {tab.label}
                  </span>
                  {count !== undefined && count > 0 && (
                    <span
                      className="ml-auto rounded-full text-[9px] font-black px-1.5 py-px"
                      style={isUrgent
                        ? { background: HColors.bordeaux, color: '#fff' }
                        : { background: HAlpha.gold15, color: HColors.gold }
                      }
                    >
                      {count}
                    </span>
                  )}
                </>
              )}
              {collapsed && isUrgent && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: HColors.bordeaux }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-1.5 py-2.5" style={{ borderTop: `1px solid ${HAlpha.gold10}` }}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'} rounded-[9px] p-2 mb-2`} style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
            style={{ background: HAlpha.bord15, border: `1px solid ${HAlpha.bord25}` }}
          >
            <Crown className="w-3.5 h-3.5" style={{ color: HColors.gold }} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div style={{ fontSize: 10, fontWeight: 700, color: HColors.cream }} className="truncate">{adminName}</div>
              {adminEmail && <div style={{ fontSize: 8, color: 'rgba(245,230,200,0.50)' }} className="truncate">{adminEmail}</div>}
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-[9px] transition-all hover:bg-white/5"
          style={{ color: 'rgba(245,230,200,0.50)', fontSize: 11, fontFamily: 'var(--font-nunito)' }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> Réduire</>}
        </button>
      </div>
    </aside>
  );
}
