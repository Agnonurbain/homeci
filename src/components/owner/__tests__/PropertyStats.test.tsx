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

  it('affiche les 5 cartes de statistiques', () => {
    renderStats();
    expect(screen.getByText('Total biens')).toBeInTheDocument();
    expect(screen.getByText('Vues totales')).toBeInTheDocument();
    expect(screen.getByText('Visites reçues')).toBeInTheDocument();
    expect(screen.getByText('Publiés')).toBeInTheDocument();
    expect(screen.getByText('Vérifiés notaire')).toBeInTheDocument();
    const statValues = screen.getAllByText(/\d+/);
    expect(statValues.length).toBeGreaterThanOrEqual(5);
  });

  it('affiche les valeurs correctes', () => {
    renderStats({ stats: { total: 10, published: 7, pending: 2, rented_sold: 1, verified: 5 } });
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('affiche zéro si toutes les stats sont à 0', () => {
    renderStats({ stats: { total: 0, published: 0, pending: 0, rented_sold: 0, verified: 0 } });
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(5);
  });
});
