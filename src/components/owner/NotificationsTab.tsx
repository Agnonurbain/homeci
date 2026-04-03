import { 
  Bell, Calendar, MessageSquare, Shield, CheckCircle, XCircle, ChevronRight 
} from 'lucide-react';
import type { Notification } from '../../services/notificationService';
import { HColors, HAlpha } from '../../styles/homeci-tokens';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface NotificationsTabProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate?: (tab: string) => void;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const getNotifConfig = (type: Notification['type']) => {
  switch (type) {
    case 'visit_request':
    case 'visit_accepted':
    case 'visit_rejected':
    case 'visit_completed':
      return { icon: <Calendar className="w-4 h-4" />, color: HColors.orangeCI, tab: 'visits' };
    case 'new_message':
      return { icon: <MessageSquare className="w-4 h-4" />, color: HColors.navy, tab: 'chat' };
    case 'notaire_approved':
      return { icon: <Shield className="w-4 h-4" />, color: HColors.vertCI, tab: 'properties' };
    case 'notaire_rejected':
      return { icon: <XCircle className="w-4 h-4" />, color: '#ef4444', tab: 'properties' };
    default:
      return { icon: <Bell className="w-4 h-4" />, color: HColors.gold, tab: null };
  }
};

/* ── Component ────────────────────────────────────────────────────────────── */

export default function NotificationsTab({ 
  notifications, unreadCount, onMarkAsRead, onMarkAllRead, onNavigate 
}: NotificationsTabProps) {

  const handleNotifClick = (notif: Notification) => {
    if (!notif.read) onMarkAsRead(notif.id);
    
    // Auto-navigation based on type
    const config = getNotifConfig(notif.type);
    const targetTab = notif.target_tab || config.tab;
    if (targetTab && onNavigate) {
      onNavigate(targetTab);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="font-bold mb-1"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem', color: HColors.darkBrown }}>
            Centre de Notifications
          </h1>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Vous avez {unreadCount} message(s) non lu(s)
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:bg-gold/10 flex items-center gap-2"
            style={{ color: HColors.gold, border: `1.5px solid ${HAlpha.gold25}`, fontFamily: 'var(--font-nunito)' }}>
            <CheckCircle className="w-4 h-4" /> Tout marquer lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-3xl p-20 text-center"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div className="w-20 h-20 bg-gold/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell className="w-10 h-10" style={{ color: HAlpha.gold35 }} />
          </div>
          <h2 className="text-xl font-bold mb-2"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>C'est bien calme ici</h2>
          <p className="text-sm max-w-xs mx-auto opacity-60" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Nous vous tiendrons informé dès qu'une action nécessitera votre attention.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const config = getNotifConfig(notif.type);
            return (
              <div key={notif.id}
                onClick={() => handleNotifClick(notif)}
                className="group relative rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md hover:bg-gold/[0.02]"
                style={{
                  background: HColors.white,
                  border: `1.5px solid ${notif.read ? HAlpha.gold10 : HAlpha.gold35}`,
                  opacity: notif.read ? 0.75 : 1,
                  transform: notif.read ? 'none' : 'scale(1.01)'
                }}>
                
                {!notif.read && (
                  <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                )}

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${config.color}15`, color: config.color, border: `1px solid ${config.color}30` }}>
                    {config.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-bold text-sm"
                        style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>{notif.title}</p>
                      <span className="text-[10px] font-bold uppercase tracking-tighter opacity-40 shrink-0"
                        style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                        {new Date(notif.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} • {new Date(notif.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed pr-6" style={{ color: HColors.brownMid, fontFamily: 'var(--font-nunito)' }}>
                      {notif.message}
                    </p>
                    
                    {(config.tab || notif.target_tab) && (
                      <div className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                        Voir les détails <ChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
