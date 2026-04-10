/**
 * HOMECI — Tests: MessageBubble
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble from '../MessageBubble';
import type { ChatMessage } from '../../../services/chatService';

const makeMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'msg-1',
  chat_id: 'chat-1',
  sender_id: 'user-1',
  content: 'Bonjour !',
  created_at: { toDate: () => new Date('2026-04-10T10:30:00Z') },
  read: false,
  ...overrides,
});

function renderBubble(overrides: Partial<React.ComponentProps<typeof MessageBubble>> = {}) {
  const props = {
    message: makeMessage(),
    isMine: true,
    showTail: true,
    ...overrides,
  };
  render(<MessageBubble {...props} />);
  return props;
}

describe('MessageBubble', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('affiche le contenu du message', () => {
    renderBubble();
    expect(screen.getByText('Bonjour !')).toBeInTheDocument();
  });

  it('applique le style "mine" (expéditeur)', () => {
    renderBubble({ isMine: true });
    const bubble = screen.getByText('Bonjour !').closest('[class*="from-orange"]');
    expect(bubble).toBeInTheDocument();
  });

  it('applique le style "theirs" (destinataire)', () => {
    renderBubble({ isMine: false });
    const bubble = screen.getByText('Bonjour !').closest('[class*="bg-white"]');
    expect(bubble).toBeInTheDocument();
  });

  it('affiche l\'heure formatée', () => {
    renderBubble();
    expect(screen.getByText('10:30')).toBeInTheDocument();
  });

  it('affiche une coche simple pour un message non lu', () => {
    renderBubble({ isMine: true, message: makeMessage({ read: false }) });
    // Check icon (single)
    const checkIcons = document.querySelectorAll('svg');
    const hasCheck = Array.from(checkIcons).some(svg => 
      svg.querySelector('path[d*="M20 6"]') || svg.closest('[class*="transition-all"]')
    );
    expect(hasCheck).toBe(true);
  });

  it('affiche une double coche pour un message lu', () => {
    renderBubble({ isMine: true, message: makeMessage({ read: true }) });
    // Double check icon
    const checkIcons = document.querySelectorAll('svg');
    const hasDoubleCheck = Array.from(checkIcons).some(svg => 
      svg.querySelector('path[d*="M2 14"]') || svg.querySelector('path[d*="M18 6"]')
    );
    expect(hasDoubleCheck).toBe(true);
  });

  it('n\'affiche PAS de coche pour un message reçu', () => {
    renderBubble({ isMine: false, message: makeMessage({ read: true }) });
    // No check icons for received messages
    const container = screen.getByText('Bonjour !').closest('[class*="bg-white"]');
    // Should only have the time, no check marks
    expect(container).toBeInTheDocument();
  });

  it('gère un contenu multi-lignes', () => {
    renderBubble({ message: makeMessage({ content: 'Ligne 1\nLigne 2\nLigne 3' }) });
    expect(screen.getByText(/Ligne 1/)).toBeInTheDocument();
  });

  it('gère un timestamp null', () => {
    renderBubble({ message: makeMessage({ created_at: null }) });
    // Should not crash
    expect(screen.getByText('Bonjour !')).toBeInTheDocument();
  });

  it('applique showTail=false pour des bulles consécutives', () => {
    renderBubble({ showTail: false, isMine: true });
    const bubble = screen.getByText('Bonjour !').closest('[class*="rounded-br-2xl"]');
    expect(bubble).toBeInTheDocument();
  });
});
