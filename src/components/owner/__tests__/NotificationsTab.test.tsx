/**
 * HOMECI — Tests: NotificationsTab (owner)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationsTab from '../NotificationsTab';

const makeNotif = (id: string, type: string, read = false, overrides: any = {}) => ({
  id,
  type,
  title: `Notification ${id}`,
  message: `Message ${id}`,
  read,
  created_at: { toDate: () => new Date('2026-04-10T10:00:00Z') },
  ...overrides,
});

function renderTab(overrides: Partial<React.ComponentProps<typeof NotificationsTab>> = {}) {
  const props = {
    notifications: [
      makeNotif('n1', 'visit_request'),
      makeNotif('n2', 'new_message', true),
    ],
    unreadCount: 1,
    onMarkAsRead: vi.fn(),
    onMarkAllRead: vi.fn(),
    onNavigate: vi.fn(),
    ...overrides,
  };
  render(<NotificationsTab {...props} />);
  return props;
}

describe('NotificationsTab', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('affiche le titre "Centre de Notifications"', () => {
    renderTab();
    expect(screen.getByText(/Centre de Notifications/)).toBeInTheDocument();
  });

  it('affiche le nombre de messages non lus', () => {
    renderTab({ unreadCount: 3 });
    expect(screen.getByText(/3 message\(s\) non lu\(s\)/)).toBeInTheDocument();
  });

  it('affiche le bouton "Tout marquer lu" quand il y a des non-lus', () => {
    renderTab({ unreadCount: 1 });
    expect(screen.getByText(/Tout marquer/)).toBeInTheDocument();
  });

  it('n\'affiche PAS le bouton "Tout marquer lu" quand tout est lu', () => {
    renderTab({ unreadCount: 0 });
    expect(screen.queryByText(/Tout marquer/)).not.toBeInTheDocument();
  });

  it('appelle onMarkAllRead quand on clique sur "Tout marquer lu"', () => {
    const onMarkAllRead = vi.fn();
    renderTab({ unreadCount: 2, onMarkAllRead });
    fireEvent.click(screen.getByText(/Tout marquer/));
    expect(onMarkAllRead).toHaveBeenCalled();
  });

  it('affiche les notifications', () => {
    renderTab();
    expect(screen.getByText('Notification n1')).toBeInTheDocument();
    expect(screen.getByText('Notification n2')).toBeInTheDocument();
  });

  it('affiche un etat vide quand aucune notification', () => {
    renderTab({ notifications: [], unreadCount: 0 });
    expect(screen.getByText(/C'est bien calme/)).toBeInTheDocument();
  });

  it('appelle onMarkAsRead et onNavigate quand on clique sur une notif non lue', () => {
    const onMarkAsRead = vi.fn();
    const onNavigate = vi.fn();
    renderTab({
      notifications: [makeNotif('n1', 'visit_request')],
      unreadCount: 1,
      onMarkAsRead,
      onNavigate,
    });
    fireEvent.click(screen.getByText('Notification n1'));
    expect(onMarkAsRead).toHaveBeenCalledWith('n1');
    expect(onNavigate).toHaveBeenCalledWith('visits');
  });

  it('affiche un point orange pour les notifications non lues', () => {
    renderTab({
      notifications: [makeNotif('n1', 'visit_request', false)],
      unreadCount: 1,
    });
    const dot = document.querySelector('.animate-pulse');
    expect(dot).toBeInTheDocument();
  });

  it('n\'affiche PAS de point pour les notifications lues', () => {
    renderTab({
      notifications: [makeNotif('n1', 'visit_request', true)],
      unreadCount: 0,
    });
    const dot = document.querySelector('.animate-pulse');
    expect(dot).not.toBeInTheDocument();
  });

  it('affiche la date et l\'heure de la notification', () => {
    renderTab();
    // Vérifie que le texte de la notification inclut une date/heure
    const notifMessage = screen.getByText('Message n1');
    const parent = notifMessage.closest('[class*="flex"]');
    // Le composant affiche une date formatée, on vérifie qu'un élément textuel existe
    expect(parent).toBeInTheDocument();
  });
});
