import { Bell, Calendar, CheckCircle, XCircle, Star, MessageSquare, Clock } from 'lucide-react';
import type { Notification } from '../../services/notificationService';
import { HColors, HAlpha } from '../../styles/homeci-tokens';

interface NotificationsTabProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  loading: boolean;
}

const NOTIF_ICON: Record<string, React.ReactNode> = {
  visit_request: <Calendar className="w-4 h-4" style={{ color: HColors.navy }} />,
  visit_accepted: <CheckCircle className="w-4 h-4" style={{ color: HColors.vertCI }} />,
  visit_rejected: <XCircle className="w-4 h-4" style={{ color: HColors.bordeaux }} />,
  visit_completed: <Star className="w-4 h-4" style={{ color: HColors.gold }} />,
  notaire_approved: <CheckCircle className="w-4 h-4" style={{ color: HColors.vertCI }} />,
  new_message: <MessageSquare className="w-4 h-4" style={{ color: HColors.orangeCI }} />,
  system: <Bell className="w-4 h-4" style={{ color: HAlpha.brown50 }} />,
};

export default function NotificationsTab({
  notifications,
  unreadCount,
  onMarkAllRead,
  loading
}: NotificationsTabProps) {
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-gold border-b-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Chargement...</p>
    </div>
  );

  return (
    <div>
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
            className="px-4 py-2 text-sm font-medium rounded-xl transition-all hover:opacity-80"
            style={{ background: HAlpha.gold10, border: '1px solid rgba(212,160,23,0.25)', color: HColors.brownMid }}>
            Tout marquer lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl p-16 text-center"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <Bell className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold25 }} />
          <h3 className="text-lg font-semibold mb-1"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucune notification</h3>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>Vous serez notifié des activités importantes ici</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className={`p-4 rounded-2xl flex gap-4 items-start transition-all ${!n.read ? 'bg-white shadow-md border-l-4' : 'opacity-70 grayscale-[0.5]'}`}
              style={{
                background: !n.read ? HColors.white : 'transparent',
                borderColor: !n.read ? HColors.gold : 'transparent',
                border: !n.read ? undefined : `1px solid ${HAlpha.gold12}`
              }}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.read ? 'bg-gold/10' : 'bg-gray-100'}`}
                style={{ background: !n.read ? HAlpha.gold10 : undefined }}>
                {NOTIF_ICON[n.type] || NOTIF_ICON.system}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'}`} style={{ color: HColors.darkBrown }}>{n.title}</p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: HColors.brown }}>{n.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
                    {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
