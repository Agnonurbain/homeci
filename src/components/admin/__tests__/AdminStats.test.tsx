/**
 * HOMECI — Tests: AdminStats
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminStats } from '../AdminStats';

const defaultStats = {
  total_users: 50,
  total_properties: 30,
  pending_properties: 5,
  verified_properties: 20,
};

function renderStats(overrides: Partial<React.ComponentProps<typeof AdminStats>> = {}) {
  const props = {
    stats: defaultStats,
    ...overrides,
  };
  render(<AdminStats {...props} />);
  return props;
}

describe('AdminStats', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('rend le composant sans erreur', () => {
    renderStats();
    // Vérifie que le composant s'est rendu (grille de stat cards)
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('affiche les 4 valeurs de statistiques', () => {
    renderStats();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('affiche les labels des cartes', () => {
    renderStats();
    expect(screen.getByText('Utilisateurs inscrits')).toBeInTheDocument();
    expect(screen.getByText('Biens immobiliers')).toBeInTheDocument();
    expect(screen.getByText('En attente modération')).toBeInTheDocument();
    expect(screen.getByText('Vérifiés Notaire')).toBeInTheDocument();
  });

  it('affiche zéro si les stats sont à 0', () => {
    renderStats({ stats: { total_users: 0, total_properties: 0, pending_properties: 0, verified_properties: 0 } });
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(4);
  });
});
