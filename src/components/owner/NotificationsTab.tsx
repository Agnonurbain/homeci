import { Bell } from 'lucide-react';
import type { Notification } from '../../services/notificationService';
import { HColors, HAlpha } from '../../styles/homeci-tokens';

/* ── Props ─────────────────────────────────────────────────────────────────── */

interface NotificationsTabProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function NotificationsTab({ notifications, unreadCount, onMarkAsRead, onMarkAllRead }: NotificationsTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="font-bold mb-1"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem', color: HColors.darkBrown }}>
            Notifications
          </h1>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            {unreadCount} non lue(s)
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead}
            aria-label="Marquer toutes les notifications comme lues"
            className="px-4 py-2 text-sm font-medium rounded-xl transition-all hover:opacity-80"
            style={{
              background: HAlpha.gold10, color: HColors.brownMid,
              border: '1px solid rgba(212,160,23,0.25)', fontFamily: 'var(--font-nunito)'
            }}>
            Tout marquer lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl p-14 text-center"
          style={{ background: HColors.white, border: `1px solid ${HAlpha.gold15}` }}>
          <Bell className="w-14 h-14 mx-auto mb-4" style={{ color: HAlpha.gold25 }} />
          <p className="text-lg font-semibold mb-1"
            style={{ color: HColors.darkBrown, fontFamily: 'var(--font-cormorant)' }}>Aucune notification</p>
          <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
            Vous serez notifié des nouvelles demandes et vérifications
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div key={notif.id}
              onClick={() => !notif.read && onMarkAsRead(notif.id)}
              className="rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5"
              style={{
                background: HColors.white,
                border: `1px solid ${notif.read ? HAlpha.gold10 : HAlpha.gold35}`,
                opacity: notif.read ? 0.65 : 1,
                boxShadow: notif.read ? 'none' : '0 2px 10px rgba(212,160,23,0.08)'
              }}>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-2 shrink-0"
                  style={{ background: notif.read ? 'rgba(139,106,48,0.3)' : HColors.gold }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm"
                      style={{ color: HColors.darkBrown, fontFamily: 'var(--font-nunito)' }}>{notif.title}</p>
                    <span className="text-xs shrink-0"
                      style={{ color: HAlpha.brown60, fontFamily: 'var(--font-nunito)' }}>
                      {new Date(notif.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: HColors.brown, fontFamily: 'var(--font-nunito)' }}>
                    {notif.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
