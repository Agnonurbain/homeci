import { Bell, Calendar, CheckCircle, XCircle, Star, MessageSquare, ChevronRight } from 'lucide-react';
import type { Notification } from '../../services/notificationService';
import { HColors, HAlpha } from '../../styles/homeci-tokens';

const NOTIF_COLORS: Record<string, string> = {
  visit_accepted: '#009E49',
  visit_rejected: '#8B1D1D',
  visit_requested: '#FF6B00',
  counter_proposed: '#D4A017',
  document_validated: '#009E49',
  document_rejected: '#8B1D1D',
  new_message: '#1A3A6B',
  certification: '#009E49',
};

interface NotificationsTabProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  loading: boolean;
  onNavigate?: (tab: string) => void;
}

const NOTIF_CONFIG: Record<string, { icon: React.ReactNode; color: string; tab: string }> = {
  visit_request: { icon: <Calendar className="w-4 h-4" />, color: HColors.navy, tab: 'visits' },
  visit_accepted: { icon: <CheckCircle className="w-4 h-4" />, color: HColors.vertCI, tab: 'visits' },
  visit_rejected: { icon: <XCircle className="w-4 h-4" />, color: HColors.bordeaux, tab: 'visits' },
  visit_completed: { icon: <Star className="w-4 h-4" />, color: HColors.gold, tab: 'visits' },
  notaire_approved: { icon: <CheckCircle className="w-4 h-4" />, color: HColors.vertCI, tab: 'dossier' },
  new_message: { icon: <MessageSquare className="w-4 h-4" />, color: HColors.orangeCI, tab: 'chat' },
  system: { icon: <Bell className="w-4 h-4" />, color: HAlpha.brown50, tab: 'notifications' },
};

export default function NotificationsTab({
  notifications,
  unreadCount,
  onMarkAllRead,
  loading,
  onNavigate
}: NotificationsTabProps) {

  const handleNotifClick = (n: Notification) => {
    const config = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.system;
    const target = n.target_tab || config.tab;
    if (target && onNavigate) {
      onNavigate(target);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-gold border-b-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Chargement...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold mb-0.5"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem' }}>
            Notifications
          </h2>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est lu'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead}
            className="px-4 py-2 text-sm font-bold rounded-xl transition-all hover:bg-gold/10"
            style={{ border: `1.5px solid ${HAlpha.gold25}`, color: HColors.gold }}>
            Tout marquer lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-3xl p-16 text-center"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <Bell className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold25 }} />
          <h3 className="text-lg font-semibold mb-1"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucune notification</h3>
          <p className="text-sm opacity-60" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>Vous serez notifié des activités importantes ici</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            const config = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.system;
            return (
              <div key={n.id}
                onClick={() => handleNotifClick(n)}
                className={`group p-5 rounded-2xl flex gap-4 items-start transition-all cursor-pointer hover:shadow-md ${!n.read ? 'border-l-4' : 'opacity-75'}`}
                style={{
                  background: !n.read ? `${NOTIF_COLORS[n.type] || '#FF6B00'}08` : HColors.white,
                  borderColor: !n.read ? (NOTIF_COLORS[n.type] || HColors.gold) : HAlpha.gold15,
                  border: !n.read ? undefined : `1.5px solid ${HAlpha.gold12}`,
                  transform: !n.read ? 'scale(1.01)' : 'none'
                }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: `${config.color}15`, color: config.color, border: `1px solid ${config.color}30` }}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
                    <p className={`text-sm ${!n.read ? 'font-bold' : 'font-semibold'} truncate`} style={{ color: HColors.darkBrown }}>{n.title}</p>
                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold tracking-wider uppercase whitespace-nowrap">
                      {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: HColors.brown }}>{n.message}</p>

                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                    Voir les détails <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
                {!n.read && <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 animate-pulse" style={{ background: NOTIF_COLORS[n.type] || '#FF6B00' }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
