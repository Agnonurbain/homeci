import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotaireStats } from '../NotaireStats';

beforeEach(() => vi.clearAllMocks());

describe('NotaireStats', () => {
  const mockStats = {
    disponible: 5,
    enCours: 3,
    pret: 2,
    certifie: 10,
  };

  it('affiche les 4 statuts avec leurs counts', () => {
    render(<NotaireStats stats={mockStats} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('affiche les labels des statuts', () => {
    render(<NotaireStats stats={mockStats} />);
    expect(screen.getByText('Disponibles')).toBeInTheDocument();
    expect(screen.getByText('En cours')).toBeInTheDocument();
    expect(screen.getByText('Prêts')).toBeInTheDocument();
    expect(screen.getByText('Certifiés')).toBeInTheDocument();
  });

  it('affiche zéro correctement', () => {
    const zeros = { disponible: 0, enCours: 0, pret: 0, certifie: 0 };
    render(<NotaireStats stats={zeros} />);
    const zeros_display = screen.getAllByText('0');
    expect(zeros_display.length).toBeGreaterThanOrEqual(4);
  });

  it('génère 4 cartes statistiques', () => {
    const { container } = render(<NotaireStats stats={mockStats} />);
    const cards = container.querySelectorAll('.rounded-2xl');
    expect(cards.length).toBe(4);
  });
});
