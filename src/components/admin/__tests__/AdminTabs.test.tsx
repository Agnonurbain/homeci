/**
 * HOMECI — Tests: AdminTabs
 * Note: Component uses lucide-react icons which render fine in jsdom.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminTabs } from '../AdminTabs';

const defaultStats = {
  total_users: 50,
  total_properties: 30,
  pending_properties: 5,
  verified_properties: 20,
};

function renderTabs(overrides: Partial<React.ComponentProps<typeof AdminTabs>> = {}) {
  const props = {
    activeTab: 'overview' as const,
    setActiveTab: vi.fn(),
    stats: defaultStats,
    ...overrides,
  };
  render(<AdminTabs {...props} />);
  return props;
}

describe('AdminTabs', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('rend le composant sans erreur', () => {
    renderTabs();
    // Vérifie que le composant s'est rendu
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('affiche les boutons d\'onglets', () => {
    renderTabs();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(10);
  });

  it('appelle setActiveTab quand on clique sur un onglet', () => {
    const setActiveTab = vi.fn();
    renderTabs({ setActiveTab });
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(setActiveTab).toHaveBeenCalled();
  });

  it('applique aria-current sur l\'onglet actif', () => {
    renderTabs({ activeTab: 'overview' });
    const activeTab = screen.getByRole('button', { current: 'page' });
    expect(activeTab).toBeInTheDocument();
  });
});
