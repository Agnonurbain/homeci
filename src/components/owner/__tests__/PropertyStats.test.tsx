/**
 * HOMECI — Tests: PropertyStats (owner)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PropertyStats from '../PropertyStats';

function renderStats(overrides: Partial<React.ComponentProps<typeof PropertyStats>> = {}) {
  const props = {
    stats: {
      total: 5,
      published: 3,
      pending: 1,
      rented_sold: 1,
      verified: 2,
    },
    ...overrides,
  };
  render(<PropertyStats {...props} />);
  return props;
}

describe('PropertyStats', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('affiche les 4 cartes de statistiques', () => {
    renderStats();
    expect(screen.getByText('Publiés')).toBeInTheDocument();
    expect(screen.getByText('En attente')).toBeInTheDocument();
    expect(screen.getByText('Loués/Vendus')).toBeInTheDocument();
    // Vérifier qu'il y a 4 StatCards
    const statValues = screen.getAllByText(/\d+/);
    expect(statValues.length).toBeGreaterThanOrEqual(4);
  });

  it('affiche les valeurs correctes', () => {
    renderStats({ stats: { total: 10, published: 7, pending: 2, rented_sold: 1, verified: 5 } });
    // Le composant n'affiche pas "total", seulement published, pending, rented_sold, verified
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('affiche zéro si toutes les stats sont à 0', () => {
    renderStats({ stats: { total: 0, published: 0, pending: 0, rented_sold: 0, verified: 0 } });
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(4);
  });
});
