import React from 'react';
import { Users, Home, AlertCircle, FileCheck } from 'lucide-react';
import { HColors, HAlpha } from '../../styles/homeci-tokens';
import type { AdminStats as AdminStatsType } from '../../hooks/useAdminDashboard';

interface AdminStatsProps {
  stats: AdminStatsType;
}

export const AdminStats: React.FC<AdminStatsProps> = ({ stats }) => {
  const statCards = [
    { icon: Users, label: 'Utilisateurs inscrits', value: stats.total_users, accent: HColors.navy, bg: HAlpha.navy08 },
    { icon: Home, label: 'Biens immobiliers', value: stats.total_properties, accent: HColors.vertCI, bg: HAlpha.vertCI10 },
    { icon: AlertCircle, label: 'En attente modération', value: stats.pending_properties, accent: HColors.gold, bg: HAlpha.gold10 },
    { icon: FileCheck, label: 'Vérifiés Notaire', value: stats.verified_properties, accent: HColors.orangeCI, bg: HAlpha.orange10 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map(({ icon: Icon, label, value, accent, bg }) => (
        <div key={label} className="rounded-2xl p-3 sm:p-5 transition-all hover:scale-[1.02]"
          style={{ 
            background: HColors.white, 
            border: `1px solid ${HAlpha.gold15}`, 
            boxShadow: '0 2px 12px rgba(26,14,0,0.05)', 
            minWidth: 0, 
            overflow: 'hidden' 
          }}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 sm:mb-3"
            style={{ background: bg, border: `1px solid ${accent}30` }}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: accent }} />
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-0.5"
            style={{ color: accent, fontFamily: 'var(--font-cormorant)' }}>{value}</div>
          <div className="text-[10px] sm:text-xs truncate" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>{label}</div>
        </div>
      ))}
    </div>
  );
};
